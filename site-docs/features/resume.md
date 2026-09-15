---
title: Resuming and continuing a session
description: Reopen any session in an embedded terminal, Terminal.app, iTerm2, Ghostty, Warp or cmux, or continue Claude Code and Codex in an in-app chat.
image: /screenshots/session-resume.png
---

# Resuming and continuing a session

Reading a session usually ends with wanting to continue it. Every session in the list has a resume action, and where it opens is up to you.

![A session resumed in the embedded terminal, in a tab next to its transcript](/screenshots/session-resume.png)

## Where a session can reopen

### In the embedded terminal

A real PTY inside the app, in a tab next to the transcript you were just reading. There is no window switching, and the session you resumed sits beside the history you resumed it from.

### In your own terminal

Terminal.app, iTerm2, Ghostty, Warp or cmux. The app changes into the project directory and runs that agent's own resume command, such as `claude --resume` or `codex resume`, so you end up exactly where the CLI would have put you.

cmux gets slightly different treatment. Sessions are matched to workspaces by working directory, so resuming reuses an existing workspace instead of piling up new ones.

## Or keep going in the app

![The in-app chat continuing a Claude Code session, with model and permission controls in the composer](/screenshots/chat-preview.png)

Claude Code and Codex sessions can be continued in the app's own chat. The settings that normally mean restarting the CLI with different flags are live controls here:

- Model, which you can switch mid-session
- Reasoning effort, including Opus Ultracode
- Permission mode, including an in-chat allow or deny prompt when the agent asks for something

You can `@`-mention files, attach images, and see Mermaid diagrams and tables rendered as you go. Slash commands work, including `/fork`, which branches the session into a copy without touching the original.

The other five agents get history, resume, export and analysis, but not in-app chat.

## Shell tabs

Not everything next to a session is an agent. Plain shell tabs open in the same tab strip, in the same working directory, and survive a restart, so the `npm run dev` you had running is still there tomorrow.

## Launch arguments

Each agent can carry its own CLI flags, applied to both new and resumed sessions. `--dangerously-skip-permissions` is the obvious one. Flags are configured per agent in settings, so the ones you want for one CLI do not leak into another.
