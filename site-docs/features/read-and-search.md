---
title: Reading and searching sessions
description: Replay a coding agent transcript with paired tool calls, collapsed thinking, structured diffs and inline images, and search every project at once.
image: /screenshots/chat.png
---

# Reading and searching sessions

A JSONL transcript contains everything that happened, in an order and a shape designed for a program rather than a person. The reading view puts it back into the form it had on screen.

![A Claude Code session replayed in Sessions Viewer, with tool calls paired to their results and a rendered diff](/screenshots/chat.png)

## What gets reconstructed

### Tool calls paired with their results

In the file, a call and its result are separate records, sometimes many lines apart, linked by an id. Shown apart they are unreadable. Shown together, you can see what the agent asked for and what came back.

### Thinking blocks, collapsed until you want them

Extended thinking is often longer than the answer. It is preserved and folded, and you can expand it per message or for the whole session at once.

### Diffs rendered as diffs

When a file-edit result carries structured patch data, it becomes a real diff with line numbers and syntax highlighting instead of a block of escaped text. The [Claude Code page](/agents/claude-code#structured-diffs) shows what that data looks like on disk.

### Images back inline

Some agents store pasted screenshots as base64 and others as separate media files. Both render in place, in the message that contained them.

### Mermaid diagrams, tables and math

Anything the agent emitted as Markdown is rendered as Markdown.

## Finding a message {#finding-a-message}

![Global search in Sessions Viewer listing matches from several projects](/screenshots/search.png)

`⌘⇧F` opens global search. It runs across every project and every agent at once. Selecting a result opens that session, scrolls to the exact message and flashes it so you can see where you landed.

`⌘F` searches inside whatever is currently open, and `⌘G` and `⌘⇧G` step through the matches.

### Jump to a prompt

Long sessions are mostly agent output. The prompt list strips all of it away and shows only what you typed, in order, as a compact list. It is usually the fastest way to find the moment a session went wrong. Pick one and the view scrolls to it.

### Views history

Sessions you have read recently stay in a history list, per project, with search and favourites. Reopening yesterday's session does not mean finding it again.

## Nothing is written back

Reading a session never modifies the file. The app opens transcripts read-only, and the only writes it ever makes to agent data are the ones you explicitly ask for: renaming a session, or moving one to the [trash](/features/export-and-trash).
