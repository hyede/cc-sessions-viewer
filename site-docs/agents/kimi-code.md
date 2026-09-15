---
title: Where Kimi Code stores session history
description: Kimi Code stores one directory per session under ~/.kimi-code/sessions/, with agents/main/wire.jsonl as the transcript. Layout and jq commands.
---

# Where Kimi Code stores session history

Kimi Code groups sessions by working directory, then gives each session its own folder:

```
$KIMI_CODE_HOME/sessions/wd_<name>_<hash>/session_<uuid>/
```

`KIMI_CODE_HOME` defaults to `~/.kimi-code`. There is also a flat index at the root of that directory:

```
~/.kimi-code/session_index.jsonl
```

## The wd_ group directory

The `wd_` prefix stands for working directory. The name that follows is the project folder's own name plus a short hash of its full path:

```
~/.kimi-code/sessions/wd_blog_dbc648dfdf98/
```

The hash keeps two projects named `blog` in different parents from landing in the same bucket, so the directory listing is enough to tell projects apart.

## What is in a Kimi Code session directory

```
state.json                 ← session metadata
agents/main/wire.jsonl     ← the transcript
logs/
media/
```

`wire.jsonl` under `agents/main/` is the primary transcript. The `agents/` level exists because a session can run more than one agent, and `main` is the one you talked to.

## Reading a Kimi Code session from the terminal

List your sessions with their titles, newest first:

```bash
jq -r '[.updated_at, .title] | @tsv' ~/.kimi-code/session_index.jsonl | sort -r
```

Print a transcript:

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/agents/main/wire.jsonl
```

Inspect one session's metadata:

```bash
jq . ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/state.json
```

## Or open it in an app

[Sessions Viewer](/guide/) reads `wire.jsonl` into the same conversation view as every other agent, keeps the `media/` attachments inline, and treats the session directory as the unit for renaming and deleting. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Pi](/agents/pi), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
