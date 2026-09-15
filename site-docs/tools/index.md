---
title: Managing skills, MCP servers and hooks
description: One panel for the skills, MCP servers, hooks and instruction files of seven coding agents. Find duplicate skills and dead links, and preview every edit.
image: /screenshots/tools-skills.png
---

# Managing skills, MCP servers and hooks

Every agent CLI keeps its own skills, MCP servers, hooks and instruction files somewhere on disk. Install a few tools and switch between agents for a few months, and nobody knows what is actually loaded anymore. The same skill exists in three folders, a link points at something that was deleted, and a server you configured once is still running in an agent you forgot about.

The tool management panel shows all of it in one place and lets you fix it. Open it from the wrench icon at the bottom of the sidebar, or press `⌘K`.

## Skills {#skills}

![The skills panel, with a summary bar counting duplicated, detoured and dead skills](/screenshots/tools-skills.png)

The bar across the top summarises this machine. In the screenshot: 45 skills, 28 duplicated, 12 reached through a detour, 1 pointing at nothing. Click any of those counts to filter the list down to just those skills.

Pick a skill and the right side shows everything that matters before you touch it:

- Enabled in: which agents can actually see it. Toggle an agent on or off here.
- Content: where the actual files live. There can be more than one copy.
- References: every link pointing at it, and what it resolves through.
- Risk findings: shell commands found in the skill, with the risky-looking ones called out. An `rm -rf` used as an example inside a code block scores lower than the same line in an executable script, so the badge still means something.

Sort by newest, oldest or name. Pinned skills stay on top regardless.

### Move to main store

![The move-to-main-store preview, listing one move step and one link step](/screenshots/tools-skills-adopt.png)

Skills scattered across different folders cause most of the mess. This action gathers one into your main store and leaves a link behind, so nothing stops working.

You see the exact steps before anything happens. In the screenshot that is one `move` and one `link`. Nothing is written until you press the button. "Move all to main store" at the top does the whole list at once.

### Repair links

![The repair preview, showing a link rewritten to point straight at the real folder](/screenshots/tools-skills-repair.png)

A detour is a link that points at another link. It works until one day it does not, and then it is hard to figure out why the skill disappeared.

Repair points the link straight at the real folder. In the screenshot, `~/.claude/skills/three` went through `~/.skills-manager` to reach `~/.cc-switch`. After the repair it goes there directly.

### Delete

![The delete preview, listing every reference and every copy that will be removed](/screenshots/tools-skills-delete.png)

Dead links come from something deleting a skill's folder and leaving every link to it dangling.

Deleting here unlinks every reference first, then removes every copy, and shows you the complete list before it starts. In the screenshot, one skill turned out to live in three separate stores at once. You can also remove a single copy from the Content list, for example to keep the project-level copy and drop the global one.

## MCP servers {#mcp}

![The MCP panel, listing servers with their context budget and the agents they run in](/screenshots/tools-mcp.png)

Every MCP server across all seven agents appears in one list, whether it was configured in JSON or TOML.

The context budget shows how much of your context window the servers use before you type anything. One server in the screenshot has 29 tools and costs about 5,700 tokens.

"Active in" shows which agents run a server, and which file says so. Note the entry marked "Grok Build · Read for compatibility": Grok reads Claude's config by default, so a server you added to Claude is running there too. That is normally invisible.

You can add, edit, remove, enable, disable or copy a server to other agents, and each action shows the file changes first. Anything that looks like a token or key is masked until you ask to see it.

## Discover skills {#discover}

![The discover panel, showing a skills.sh search result with its description and file list](/screenshots/tools-discover.png)

Search [skills.sh](https://www.skills.sh) and read a skill before installing it: its description, file list, commit, and where it sits in the repository.

"Copy and install" opens a terminal right there and types the command in. You watch it run and can stop it with `Ctrl-C`. It pauses at the installer's own "which agents?" prompt and waits for you. The app does not answer that on your behalf.

## Hooks {#hooks}

![The hooks panel, grouping one script that is wired into several agents and events](/screenshots/tools-hooks.png)

Hooks are grouped by command rather than by file. The first entry in the screenshot is one script wired into 4 agents across 9 events, shown as one row instead of twenty-one.

You can dry-run a hook with a real payload and see its output, exit code and how long it took. A hook can be removed entirely or from just one place it is wired in. Hooks this app installed itself are marked and protected from accidental removal.

## Global config

![The global config panel, showing CLAUDE.md, AGENTS.md and the files they import](/screenshots/tools-memo.png)

This section covers `CLAUDE.md`, `AGENTS.md` and everything they pull in. Each file carries a status:

- falls back: opencode has no file of its own, so it reads Claude's. Editing that file changes both.
- not created: the agent supports one, you just do not have it yet.
- fragment: a file pulled in via `@import` by one of the others.
- also read: a file outside the usual path that an agent loads anyway.

Same-named files that have drifted apart get flagged, with a side-by-side diff and a button to sync one over the other.

## Config bundle

The archive icon in the top bar exports your setup as a shareable file. Values are never included, so a teammate gets the shape of your config and not your API keys. On import you choose which agents receive each entry.

## Two rules that always hold

Nothing is written until you confirm it. Every action shows the exact file changes first, and you can cancel.

Existing files are preserved. Only the keys this app owns are rewritten, the original is backed up alongside, and if the file changed on disk since it was read, the write is refused rather than applied over your edit.
