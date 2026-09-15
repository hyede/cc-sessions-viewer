---
title: Where coding agents store session history
description: Where Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode save session transcripts, in what format, and how they group by project.
---

# Where coding agents store session history

Every coding agent CLI writes your conversations to disk, and no two of them agree on where, in what shape, or under what name. This page is the reference table. Each agent has its own page with the record format and a command for reading a session by hand.

All paths below are verified against the parsers in [Sessions Viewer](https://github.com/jerrywu001/cc-sessions-viewer), which reads all seven.

## Default locations and formats

| Agent | Default location | Format |
| --- | --- | --- |
| [Claude Code](/agents/claude-code) | `~/.claude/projects/` | One JSONL file per session |
| [Codex](/agents/codex) | `~/.codex/sessions/` | One JSONL file per session, bucketed by date |
| [Grok Build](/agents/grok-build) | `~/.grok/sessions/` | One directory per session |
| [Kimi Code](/agents/kimi-code) | `~/.kimi-code/sessions/` | One directory per session |
| [Pi](/agents/pi) | `~/.pi/agent/sessions/` | One JSONL file per session |
| [Antigravity CLI](/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | One directory per conversation |
| [opencode](/agents/opencode) | `~/.local/share/opencode/opencode.db` | A single SQLite database |

## How each agent decides which project a session belongs to

Some agents encode the working directory into the path, so you can tell at a glance. Others record it inside the file, which means you cannot group sessions by project without opening every one.

| Agent | Project comes from |
| --- | --- |
| Claude Code | The directory name: the absolute path with `/` replaced by `-` |
| Codex | The `cwd` field inside each file. The path only tells you the date |
| Grok Build | `summary.json` → `info.cwd` |
| Kimi Code | The `wd_<name>_<hash>` group directory |
| Pi | The directory name: the absolute path wrapped in `--` |
| Antigravity CLI | The `workspace` field in `history.jsonl` |
| opencode | The `project` table, joined on `session.project_id` |

## Environment variables that move the data root

These agents let you move their data root:

```bash
GROK_HOME=/path/to/dir              # Grok Build, default ~/.grok
KIMI_CODE_HOME=/path/to/dir         # Kimi Code, default ~/.kimi-code
PI_CODING_AGENT_DIR=/path/to/dir    # Pi, default ~/.pi/agent
PI_CODING_AGENT_SESSION_DIR=/path   # Pi session root specifically
XDG_DATA_HOME=/path/to/dir          # opencode reads $XDG_DATA_HOME/opencode
```

Claude Code, Codex and Antigravity CLI have no equivalent override in the layouts read here. Their roots are fixed under your home directory.

## Reading a transcript without an app

Every agent's page has a `jq` or `sqlite3` one-liner that prints a readable transcript. They are worth knowing: when an agent misbehaves, the file on disk is the only record of what actually happened.

If you would rather not do that every time, [Sessions Viewer](/guide/) reads all seven into one searchable view, pairs tool calls with their results, renders structured diffs and inline images, and never writes to the original files.
