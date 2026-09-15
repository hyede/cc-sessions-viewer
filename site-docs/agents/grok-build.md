---
title: Where Grok Build stores session history
description: Grok Build keeps each session as a directory under $GROK_HOME/sessions/, with updates.jsonl as the transcript. Which file to read, plus jq commands.
---

# Where Grok Build stores session history

Grok Build is directory-backed: each session is a folder, not a single file.

```
$GROK_HOME/sessions/<encoded-cwd>/<session-id>/
```

`GROK_HOME` defaults to `~/.grok`. A relative value is resolved from the current working directory, the same way a relative path typed at a shell prompt would be, rather than from your home directory.

## What is in a Grok Build session directory

```
updates.jsonl          ← the transcript you want
summary.json           ← list metadata, including info.cwd
chat_history.jsonl     ← model context, NOT the display transcript
events.jsonl
rewind_points.jsonl
prompt_history.jsonl
prompt_context.json
system_prompt.txt
resources_state.json
announcement_state.json
*.lock
```

Two of these look like the transcript and only one is:

- `updates.jsonl` is the authoritative user-visible event stream, the one the CLI rendered to you.
- `chat_history.jsonl` is what was fed to the model: compacted, reordered, with system scaffolding mixed in. Read as a transcript, it gives you something that never appeared on anyone's screen.

The `.lock` files exist because Grok writes these files concurrently. Take a copy before parsing if the session might still be live.

## Which project a session belongs to

The group directory name encodes the working directory, but the authoritative answer is in `summary.json`:

```bash
jq -r '.info.cwd' ~/.grok/sessions/*/*/summary.json | sort | uniq -c | sort -rn
```

## Reading a Grok Build session from the terminal

Print the visible conversation:

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.grok/sessions/<group>/<session-id>/updates.jsonl
```

Get a session's title and timestamps without opening the transcript:

```bash
jq '{title, info}' ~/.grok/sessions/<group>/<session-id>/summary.json
```

Because a session is a directory, deleting one means removing the whole folder rather than unlinking a single file. Anything that manages Grok sessions has to treat the directory as the unit.

## Or open it in an app

[Sessions Viewer](/guide/) reads `updates.jsonl` and never `chat_history.jsonl`, groups sessions by `info.cwd`, and treats the directory as the storage unit: deleting moves the whole folder into a restorable trash instead of calling `rm`. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Kimi Code](/agents/kimi-code), [Pi](/agents/pi), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
