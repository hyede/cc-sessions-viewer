---
title: Where Codex stores session history
description: Codex writes rollout-*.jsonl transcripts under ~/.codex/sessions/, bucketed by date, with the project path inside each file. Layout and jq commands.
---

# Where Codex stores session history

Codex writes one JSONL file per session, filed by the date it started:

```
~/.codex/sessions/<YYYY>/<MM>/<DD>/rollout-<timestamp>-<uuid>.jsonl
```

A real one looks like this:

```
~/.codex/sessions/2026/03/20/rollout-2026-03-20T09-55-16-019d08f4-37fe-7090-96a6-100d7fbe09df.jsonl
```

Archived sessions move to a sibling directory:

```
~/.codex/archived_sessions/
```

Codex also keeps a schema-versioned state database at `~/.codex/state_<N>.sqlite`, where `<N>` climbs with each schema change. The highest-numbered file is the live one.

## The path does not tell you the project

The directory hierarchy is dates, not projects. The working directory is recorded in a field inside the file. So "show me every Codex session for this repo" cannot be answered from a directory listing. Something has to open each file and read the `cwd` out of it.

## Two kinds of record

Codex's JSONL is closer to an event stream than a message log, and it carries each turn twice at different levels of abstraction:

| Record | What it is |
| --- | --- |
| `event_msg` | The high-level conversation event. Clean text, already typed |
| `response_item` | The raw model API item: tool calls, multi-part content arrays |

Use `event_msg` for readable text, and `response_item` when you need tool-call detail or attachments.

### Images arrive split across both

A single user turn that contained a pasted image is written as two records. The `response_item` with `role: user` carries the `input_image` block with the actual image data, and the `event_msg.user_message` carries the clean typed text. Neither is complete on its own. To render the bubble the way it happened, you have to buffer the image and attach it to the matching text event.

## Reading a Codex session from the terminal

Print the conversation text:

```bash
jq -r 'select(.type=="event_msg")
  | .payload // . | select(.type=="user_message" or .type=="agent_message")
  | .message // .text' \
  ~/.codex/sessions/2026/03/20/rollout-*.jsonl
```

Find which project a session belongs to, without opening it in an editor:

```bash
jq -r 'select(.cwd) | .cwd' <file>.jsonl | head -1
```

Group every session by project. The directory layout will not give you this listing, so the loop has to open every file:

```bash
for f in ~/.codex/sessions/*/*/*/rollout-*.jsonl; do
  jq -r 'select(.cwd) | .cwd' "$f" 2>/dev/null | head -1
done | sort | uniq -c | sort -rn
```

## Or open it in an app

[Sessions Viewer](/guide/) does that grouping for you and caches it, pairs the split image records back together, and shows the 5-hour and weekly quota of a ChatGPT subscription while you work. It also reads [Claude Code](/agents/claude-code), [Grok Build](/agents/grok-build), [Kimi Code](/agents/kimi-code), [Pi](/agents/pi), [Antigravity CLI](/agents/antigravity-cli) and [opencode](/agents/opencode).
