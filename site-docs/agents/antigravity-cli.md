---
title: Where Antigravity CLI stores session history
description: Antigravity CLI (agy) stores conversations under ~/.gemini/antigravity-cli/brain/<uuid>/ as step records. Layout, format quirks and jq commands.
---

# Where Antigravity CLI stores session history

Antigravity CLI (`agy`) gives each conversation a UUID directory and buries the transcript a few levels down:

```
~/.gemini/antigravity-cli/brain/<conversation-uuid>/.system_generated/logs/transcript.jsonl
```

The full layout:

```
~/.gemini/antigravity-cli/
├── brain/<conversation-uuid>/
│   ├── .system_generated/logs/
│   │   ├── transcript.jsonl        ← rolling window
│   │   └── transcript_full.jsonl   ← nominally complete
│   ├── chunks/
│   ├── scratch/
│   └── media__<timestamp>.<ext>    ← your attachments
└── history.jsonl                   ← the index
```

## Which project a conversation belongs to

Nothing in the path says. The index at the root does:

```bash
jq -r '[.timestamp, .workspace, .display] | @tsv' \
  ~/.gemini/antigravity-cli/history.jsonl | sort -r | head
```

Each line is `{display, timestamp, workspace, conversationId}`. `workspace` is the project directory and `conversationId` is the folder name under `brain/`.

## Which transcript file to read

Neither is reliably complete. `transcript.jsonl` is a rolling window compacted at checkpoints, and `transcript_full.jsonl`, despite its name, gets truncated at checkpoints too. The practical rule is to read whichever is larger.

`transcript.jsonl` is also not append-only. The CLI rewrites the whole file when it compacts, so anything watching it has to handle the file shrinking as well as growing. A tail that assumes monotonic growth will silently stop updating.

## The step record format

```json
{"step_index":12,"source":"USER_EXPLICIT","type":"USER_INPUT","status":"...",
 "created_at":"...","content":"...","thinking":"...","tool_calls":[{"name":"...","args":{}}]}
```

`source` is one of `USER_EXPLICIT`, `MODEL` or `SYSTEM`.

Three things about `content` will bite you if you treat it as plain text:

- User input is wrapped in XML. The real message sits inside `<USER_REQUEST>…</USER_REQUEST>`, followed by a metadata block.
- Tool results carry a two-line prefix. Every one starts with `Created At: …\nCompleted At: …\n` before the actual output.
- Code edits embed a diff. `CODE_ACTION` steps contain a `[diff_block_start]` marker followed by a unified diff.

There are no token, usage or model fields anywhere in these records, so cost and token accounting are not available for this agent.

## Reading an Antigravity CLI conversation from the terminal

Print the steps with their source and type:

```bash
jq -r '[.step_index, .source, .type] | @tsv' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl
```

Pull out just what you typed, with the XML shell removed:

```bash
jq -r 'select(.type=="USER_INPUT") | .content' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl \
  | sed -n 's/.*<USER_REQUEST>\(.*\)<\/USER_REQUEST>.*/\1/p'
```

## Or open it in an app

[Sessions Viewer](/guide/) picks the larger of the two transcripts, strips the XML wrapper and the timestamp prefixes, renders `CODE_ACTION` diffs as real diffs, and handles the file being rewritten underneath it. It also reads [Claude Code](/agents/claude-code), [Codex](/agents/codex), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Pi](/agents/pi) and [opencode](/agents/opencode).
