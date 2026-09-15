---
title: Where Pi stores session history
description: Pi writes append-only JSONL under ~/.pi/agent/sessions/ with the project path in the directory name. How the session root resolves, plus read commands.
---

# Where Pi stores session history

Pi writes one append-only JSONL file per session:

```
<session root>/--<encoded-project-path>--/<timestamp>_<uuid>.jsonl
```

A real path looks like this:

```
~/.pi/agent/sessions/--Users-me-apps-blog--/2026-08-23T09-49-28-819Z_01a02e06-6f73-7b54-8a4a-63e19fdca249.jsonl
```

The filename starts with an ISO 8601 timestamp, so a plain `ls` sorts sessions chronologically.

## Finding the session root

Pi's root is configurable in three places, in this order of precedence:

1. The `PI_CODING_AGENT_SESSION_DIR` environment variable, if set and non-empty
2. `sessionDir` in `<agent dir>/settings.json`
3. The default, `<agent dir>/sessions`

The agent directory itself is `PI_CODING_AGENT_DIR`, defaulting to `~/.pi/agent`. So with nothing configured, sessions live at `~/.pi/agent/sessions`.

A one-shot `--session-dir` flag on the command line writes somewhere else, but Pi does not index those, so nothing can discover them afterwards. If you want a session to be findable later, set the root rather than passing the flag.

## The project directory name

The absolute project path with `/` replaced by `-`, wrapped in a leading and trailing `--`:

```
/Users/me/apps/blog   →   --Users-me-apps-blog--
```

The wrapping dashes are what distinguish it from a directory that happens to contain dashes, so you can group sessions by project straight from the listing.

## What else lives in the agent directory

```
~/.pi/agent/
├── sessions/
├── extensions/          ← lifecycle extensions
├── settings.json
├── mcp.json
├── memory/
├── models-store.json
└── auth.json            ← credentials, do not read this
```

Anything reading Pi's data should stay inside `sessions/`. The sibling files hold authentication, model and trust configuration.

## Reading a Pi session from the terminal

Print the conversation:

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl
```

Most recent session for a project:

```bash
ls -1 ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl | tail -1
```

Count sessions per project:

```bash
for d in ~/.pi/agent/sessions/*/; do
  printf '%4d  %s\n' "$(ls "$d"*.jsonl 2>/dev/null | wc -l)" "$(basename "$d")"
done | sort -rn
```

## Or open it in an app

[Sessions Viewer](/guide/) resolves the session root the same way Pi does, checking the environment variable, then `settings.json`, then the default, and reads only the session records, never the auth or credential files beside them. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
