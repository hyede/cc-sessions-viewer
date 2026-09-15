---
layout: home
title: Session history viewer for Claude Code, Codex and opencode
titleTemplate: false
description: A free desktop app that reads, searches and resumes the local session history of Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode.

hero:
  name: Sessions Viewer
  text: Seven coding CLIs, one workspace
  tagline: Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode each store their session history in a different place and a different format. Sessions Viewer reads all of them into the same project, session and conversation view.
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: Download
      link: https://github.com/jerrywu001/cc-sessions-viewer/releases/latest
    - theme: alt
      text: GitHub
      link: https://github.com/jerrywu001/cc-sessions-viewer

features:
  - title: Faithful replay
    details: Thinking chains, tool calls paired with their results, structured diffs and pasted screenshots render the way they happened on screen.
    link: /features/read-and-search
    linkText: How sessions are replayed
  - title: Search across every project
    details: ⌘⇧F searches all projects at once and jumps to the matching message. A compact prompt list shows every prompt you wrote in a session.
    link: /features/read-and-search#finding-a-message
    linkText: Search and jump to a prompt
  - title: Resume where you left off
    details: Reopen a session in an embedded terminal, hand it to Terminal.app, iTerm2, Ghostty, Warp or cmux, or keep going in an in-app chat with model, reasoning effort and permission mode as live controls.
    link: /features/resume
    linkText: Resume and continue
  - title: Token and cost stats
    details: Priced from live models.dev data and broken down by project, model and tool. The macOS menu bar shows today, 7-day and 30-day totals per agent.
    link: /features/stats
    linkText: Statistics
  - title: Tool management
    details: Skills, MCP servers, hooks and instruction files for all seven agents in one panel. Find duplicated skills and dead links on your machine, and see the exact file edits before anything is written.
    link: /tools/
    linkText: Manage skills, MCP and hooks
  - title: Read-only and local
    details: Original transcripts are never modified. Deleting moves a session into a shared trash you can restore from, and nothing is uploaded anywhere.
    link: /features/export-and-trash#the-read-only-guarantee
    linkText: The read-only guarantee
---

## Where each agent keeps its sessions

Sessions Viewer reads the files each CLI already writes, in place. The reference pages document every layout, with `jq` and `sqlite3` commands for reading a transcript without the app.

| Agent | Default location | Format |
| --- | --- | --- |
| [Claude Code](/agents/claude-code) | `~/.claude/projects/` | One JSONL file per session |
| [Codex](/agents/codex) | `~/.codex/sessions/` | One JSONL file per session, bucketed by date |
| [Grok Build](/agents/grok-build) | `~/.grok/sessions/` | One directory per session |
| [Kimi Code](/agents/kimi-code) | `~/.kimi-code/sessions/` | One directory per session |
| [Pi](/agents/pi) | `~/.pi/agent/sessions/` | One JSONL file per session |
| [Antigravity CLI](/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | One directory per conversation |
| [opencode](/agents/opencode) | `~/.local/share/opencode/opencode.db` | A single SQLite database |

The app is free and open source under the MIT license, and runs on macOS, Windows and Linux. [Download the latest release](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest) or start with the [guide](/guide/).
