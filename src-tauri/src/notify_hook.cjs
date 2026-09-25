#!/usr/bin/env node
// Third-party push notifier for cc-sessions-viewer, invoked by agent hooks.
//
// PRIVACY INVARIANT: only the event icon + kind + agent name + project
// directory *basename* + local time are ever sent. Never the prompt, never
// tool/terminal output, never an absolute path. The stdin hook payload is read
// solely to extract the cwd basename; everything else in it is discarded.
//
// Async + batched: a hook invocation appends one line to a queue file and
// spawns a detached flush, then returns immediately (never blocks the agent).
// The flush coalesces a burst within `windowSeconds` into a single push and is
// single-flight via a lock directory.
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const tls = require('tls');
const { spawn } = require('child_process');
const { URL } = require('url');

const ICONS = { done: '✅', attention: '\u{1F514}', test: '\u{1F9EA}' };
const STALE_LOCK_MS = 120000;
const HTTP_TIMEOUT_MS = 8000;

function paths(dataDir) {
  return {
    config: path.join(dataDir, 'notify.json'),
    queue: path.join(dataDir, 'notify-queue.jsonl'),
    state: path.join(dataDir, 'notify-state.json'),
    lock: path.join(dataDir, 'notify-flush.lock'),
  };
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function channelsEnabled(cfg) {
  const bark = cfg.bark && cfg.bark.enabled && cfg.bark.key;
  const tg =
    cfg.telegram && cfg.telegram.enabled && cfg.telegram.botToken && cfg.telegram.chatId;
  return { bark: !!bark, tg: !!tg };
}

// Extract only the project directory basename from the hook payload. Anything
// else in the payload (prompt, messages, tool output, full paths) is ignored.
function projectName(input) {
  try {
    const data = input.trim() ? JSON.parse(input) : {};
    const cwd = data.cwd || data.workspaceRoot || data.workspace || '';
    if (typeof cwd === 'string' && cwd) return path.basename(cwd.replace(/[\\/]+$/, ''));
  } catch (_) {
    // fall through
  }
  return '';
}

// POST JSON to an https URL, optionally through an http CONNECT proxy (Telegram
// typically needs one). Resolves true on 2xx, false on any error/timeout —
// observability must never throw back into the agent.
function postJson(urlStr, body, proxy, timeoutMs) {
  return new Promise((resolve) => {
    let target;
    try {
      target = new URL(urlStr);
    } catch (_) {
      return resolve(false);
    }
    const payload = Buffer.from(JSON.stringify(body));
    const port = Number(target.port) || 443;
    const reqOpts = {
      method: 'POST',
      host: target.hostname,
      port,
      path: `${target.pathname}${target.search}`,
      headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length },
    };
    let settled = false;
    const done = (ok) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };
    const fire = () => {
      const req = https.request(reqOpts, (res) => {
        res.resume();
        done(res.statusCode >= 200 && res.statusCode < 300);
      });
      req.on('error', () => done(false));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        done(false);
      });
      req.write(payload);
      req.end();
    };
    if (!proxy) return fire();
    let p;
    try {
      p = new URL(proxy);
    } catch (_) {
      return done(false);
    }
    const conn = http.request({
      host: p.hostname,
      port: Number(p.port) || 80,
      method: 'CONNECT',
      path: `${target.hostname}:${port}`,
    });
    conn.on('connect', (res, socket) => {
      if (res.statusCode !== 200) return done(false);
      reqOpts.agent = false;
      reqOpts.createConnection = () => tls.connect({ socket, servername: target.hostname });
      fire();
    });
    conn.on('error', () => done(false));
    conn.setTimeout(timeoutMs, () => {
      conn.destroy();
      done(false);
    });
    conn.end();
  });
}

async function sendAll(cfg, title, body) {
  const ch = channelsEnabled(cfg);
  const proxy = (cfg.proxy || '').trim();
  const jobs = [];
  if (ch.bark) {
    const server = (cfg.bark.server || 'https://api.day.app').replace(/\/+$/, '');
    jobs.push(
      postJson(
        `${server}/${encodeURIComponent(cfg.bark.key)}`,
        { title, body, group: 'cc-sessions-viewer' },
        proxy,
        HTTP_TIMEOUT_MS,
      ),
    );
  }
  if (ch.tg) {
    jobs.push(
      postJson(
        `https://api.telegram.org/bot${cfg.telegram.botToken}/sendMessage`,
        { chat_id: cfg.telegram.chatId, text: `${title}\n${body}`, disable_web_page_preview: true },
        proxy,
        HTTP_TIMEOUT_MS,
      ),
    );
  }
  return Promise.all(jobs);
}

function kindLabel(kind) {
  if (kind === 'done') return '完成';
  if (kind === 'attention') return '需要关注';
  if (kind === 'test') return '测试';
  return kind;
}

function hhmm(t) {
  const d = new Date(t || Date.now());
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatBatch(events) {
  return events
    .map((e) => {
      const parts = [ICONS[e.kind] || '•', kindLabel(e.kind), e.agent];
      if (e.project) parts.push(e.project);
      parts.push(hhmm(e.t));
      return parts.join(' · ');
    })
    .join('\n');
}

// Single-flight lock via atomic mkdir. A crashed flush leaves a stale dir; we
// steal it once it is older than STALE_LOCK_MS.
function acquireLock(lock) {
  try {
    fs.mkdirSync(lock);
    return true;
  } catch (e) {
    if (e.code !== 'EEXIST') return false;
    try {
      if (Date.now() - fs.statSync(lock).mtimeMs > STALE_LOCK_MS) {
        fs.rmdirSync(lock);
        fs.mkdirSync(lock);
        return true;
      }
    } catch (_) {
      // lost the race; another flush holds it
    }
    return false;
  }
}

function releaseLock(lock) {
  try {
    fs.rmdirSync(lock);
  } catch (_) {
    // already gone
  }
}

function queuedCount(queue) {
  try {
    return fs.readFileSync(queue, 'utf8').split('\n').filter((l) => l.trim()).length;
  } catch (_) {
    return 0;
  }
}

// Read every queued event and truncate the file in one shot.
function drainQueue(queue) {
  let lines = [];
  try {
    lines = fs.readFileSync(queue, 'utf8').split('\n').filter((l) => l.trim());
    fs.writeFileSync(queue, '');
  } catch (_) {
    return [];
  }
  return lines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function spawnFlush(dataDir) {
  try {
    const child = spawn(process.execPath, [__filename, 'flush', dataDir], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  } catch (_) {
    // best effort
  }
}

async function flush(dataDir) {
  const p = paths(dataDir);
  const cfg = readJson(p.config, null);
  if (!cfg) return;
  const ch = channelsEnabled(cfg);
  if (!ch.bark && !ch.tg) return;
  if (!acquireLock(p.lock)) return;
  try {
    const windowMs = Math.max(0, Number(cfg.windowSeconds || 30) * 1000);
    const maxBatch = Math.max(1, Number(cfg.maxBatch || 5));
    const state = readJson(p.state, { lastFlush: 0 });
    const elapsed = Date.now() - (state.lastFlush || 0);
    // Coalesce a burst: if we pushed recently and the batch is not yet full,
    // wait out the rest of the window so trailing events ride along.
    if (elapsed < windowMs && queuedCount(p.queue) < maxBatch) {
      await sleep(windowMs - elapsed);
    }
    const events = drainQueue(p.queue);
    if (!events.length) return;
    const title = `cc-sessions-viewer (${events.length})`;
    await sendAll(cfg, title, formatBatch(events));
    fs.writeFileSync(p.state, JSON.stringify({ lastFlush: Date.now() }));
    // Events that arrived while we were sending get their own flush.
    if (queuedCount(p.queue) > 0) spawnFlush(dataDir);
  } finally {
    releaseLock(p.lock);
  }
}

function enqueue(agent, kind, dataDir, input) {
  const p = paths(dataDir);
  const cfg = readJson(p.config, null);
  if (!cfg) return;
  if (kind === 'done' && !cfg.notifyDone) return;
  if (kind === 'attention' && !cfg.notifyAttention) return;
  if (Array.isArray(cfg.agents) && cfg.agents.length && !cfg.agents.includes(agent)) return;
  const ch = channelsEnabled(cfg);
  if (!ch.bark && !ch.tg) return;
  const event = { t: Date.now(), kind, agent, project: projectName(input) };
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.appendFileSync(p.queue, JSON.stringify(event) + '\n', 'utf8');
  } catch (_) {
    return;
  }
  spawnFlush(dataDir);
}

async function test(dataDir) {
  const p = paths(dataDir);
  const cfg = readJson(p.config, null);
  if (!cfg) {
    process.stderr.write('notify: no config file\n');
    process.exit(1);
  }
  const ch = channelsEnabled(cfg);
  if (!ch.bark && !ch.tg) {
    process.stderr.write('notify: no channel enabled\n');
    process.exit(1);
  }
  const results = await sendAll(cfg, 'cc-sessions-viewer', `${ICONS.test} ${kindLabel('test')} · ${hhmm(Date.now())}`);
  if (results.some(Boolean)) {
    process.stdout.write('ok\n');
    process.exit(0);
  }
  process.stderr.write('notify: all channels failed\n');
  process.exit(1);
}

// ---- entry ----
const mode = process.argv[2];
if (mode === 'test') {
  test(process.argv[3] || '').catch(() => process.exit(1));
} else if (mode === 'flush') {
  flush(process.argv[3] || '').catch(() => {});
} else if (mode === 'hook') {
  const agent = process.argv[3];
  const kind = process.argv[4];
  const dataDir = process.argv[5] || '';
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  const run = () => {
    try {
      enqueue(agent, kind, dataDir, input);
    } catch (_) {
      // never block the agent
    }
  };
  process.stdin.on('end', run);
  process.stdin.on('error', run);
}

