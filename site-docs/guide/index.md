---
title: What Sessions Viewer does
description: Sessions Viewer turns the local transcripts of Claude Code, Codex and five other coding agents into one searchable workspace you can read and resume.
---

# What Sessions Viewer does

Sessions Viewer reads the transcripts that coding agent CLIs leave on your disk and shows them as one workspace. Open a project, see exactly what happened in a session, then continue the work from the same place. You never have to hunt through JSONL files by hand.

> [!TIP]
> **Tool management** is the newest part of the app: skills, MCP servers, hooks and instruction files for all seven agents in one place. Find duplicate skills and broken links on your machine and repair them, see how much context an MCP server costs before you type, and dry-run a hook before you trust it. Every change previews the exact file edits first. [Read the tool management guide](/tools/).

## Read and find context

The [reading view](/features/read-and-search) replays a session the way it happened. Thinking chains stay attached to their messages, each tool call sits next to its result, file edits render as structured diffs, and pasted screenshots appear inline.

Global search (`⌘⇧F`) runs across every project and jumps to the exact matching message. Inside a long session, the prompt list shows only what you typed, so you can pick a prompt and scroll straight to it, with the message flashed to mark the spot. Recently opened read and chat views stay in a per-project history with search and favourites.

## Continue the work

Claude Code and Codex sessions can be continued in the [built-in chat](/features/resume), with model, reasoning effort (including Opus Ultracode) and permission mode as live controls. Any session can be resumed with one click in the embedded terminal or in Terminal.app, cmux, iTerm2, Ghostty or Warp.

Shell tabs run ordinary commands beside agent sessions and persist across restarts. Launch arguments such as `--dangerously-skip-permissions` are configured per agent and added to new and resumed sessions automatically.

## Keep projects organized

Split the window into [side-by-side or stacked panes](/features/panes), drag tabs between them, and each project keeps its own layout across restarts. With cmux, the app reuses workspaces by working directory, finds running sessions, picks a split direction, and names tabs after directories.

Bookmarks pin frequently used folders to the sidebar. Renaming a session syncs the new name back to the CLI, and deleting one moves it to a trash you can restore from.

## Understand usage and share results

The [statistics view](/features/stats) breaks token spend and cost down by project, model or tool, priced from live models.dev data. On macOS the menu bar shows today, 7-day and 30-day totals per agent.

One session or a batch can be [exported](/features/export-and-trash) as offline-readable Markdown, HTML or lossless JSON. Source transcripts are never modified or removed.

## Supported agents

Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode. In-app chat is available for Claude Code and Codex. The other five get history, terminal, export, analysis and resume. The [agents reference](/agents/) explains where each one stores its sessions on disk.
