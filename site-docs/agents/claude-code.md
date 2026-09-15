---
title: Where Claude Code stores session history
description: Claude Code writes one JSONL transcript per session under ~/.claude/projects/. The layout, record format, structured diffs and jq commands to read one.
---

# Where Claude Code stores session history

Claude Code keeps every session as a single JSONL file under your home directory:

```
~/.claude/projects/<project-dir>/<session-id>.jsonl
```

`<session-id>` is the UUID you pass to `claude --resume`. Each project directory also holds a `sessions-index.json` that the CLI maintains for its own session picker.

## The project directory name

Claude Code derives the directory name from the absolute path of the project by replacing every `/` with `-`, including the leading one:

```
/Users/me/apps/blog   →   -Users-me-apps-blog
```

Nothing else is encoded, so two projects whose paths differ only by a character that gets rewritten can collide in principle. In practice it means you can read the directory listing and know which project each folder belongs to.

## What a Claude Code record looks like

One JSON object per line, keyed by `type`:

```json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"..."},{"type":"tool_use","name":"Edit","input":{}}]}}
```

The conversation lives in `message.content`, an array of blocks:

| Block `type` | Contents |
| --- | --- |
| `text` | Plain message text |
| `thinking` | Extended thinking, when the model produced any |
| `tool_use` | A tool call: `name` plus an `input` object |
| `tool_result` | The result, matched to a call by `tool_use_id` |
| `image` | `source.base64` for pasted images, `source.url` for referenced ones |

There are other `type` values at the record level too, such as `custom-title` when a session has been renamed.

### Structured diffs {#structured-diffs}

When a `tool_result` comes back from a file edit, it often carries a `structuredPatch` field: the diff in hunk form rather than as a blob of text. That field is what makes it possible to render an edit as a real diff.

## Reading a Claude Code session from the terminal

Print every message as `role: text`:

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content[]? | select(.type=="text") | .text' \
  ~/.claude/projects/-Users-me-apps-blog/<session-id>.jsonl
```

List which tools a session called, most used first:

```bash
jq -r '.message.content[]? | select(.type=="tool_use") | .name' \
  ~/.claude/projects/*/*.jsonl | sort | uniq -c | sort -rn
```

Find the sessions that touched a particular file:

```bash
grep -l "src/api.ts" ~/.claude/projects/*/*.jsonl
```

## Or open it in an app

[Sessions Viewer](/guide/) reads these files directly. Thinking blocks, tool call and result pairing, `structuredPatch` diffs and inline images all render the way they happened, the originals are never written to, and `⌘⇧F` searches across every project at once. It also reads [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Pi](/agents/pi), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
