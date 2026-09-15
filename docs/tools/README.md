# Tool management

**English** · [中文](README.zh-CN.md) · [日本語](README.ja.md)

Every agent CLI keeps its own skills, MCP servers, hooks and instruction files somewhere on disk. Install a few tools and switch between agents for a few months, and nobody knows what is actually loaded anymore. The same skill exists in three folders, a link points at something that was deleted, and a server you configured once is still running in an agent you forgot about.

The tool management panel shows all of it in one place and lets you fix it. Open it from the wrench icon at the bottom of the sidebar, or press `⌘K`.

## The full guide has moved

The complete walkthrough, with screenshots of every panel, now lives in the documentation site source:

**→ [Tool management guide](https://sessions-viewer.js-bridge.com/tools/)**

It covers:

- Skills: the duplicate, detour and dead-link summary, per-skill content and references, risk findings, moving a skill to your main store, repairing links, and deleting every copy at once
- MCP servers: every server across all seven agents, its context budget in tokens, which agents run it, and masked secrets
- Discover skills: searching skills.sh and reading a skill before installing it
- Hooks: grouped by command, with a dry run against a real payload
- Global config: `CLAUDE.md`, `AGENTS.md`, their imports, and the drift between same-named files
- Config bundle: exporting your setup without any values in it

Two rules hold throughout. Nothing is written until you confirm it, and every action shows the exact file changes first. Existing files are preserved, because only the keys this app owns are rewritten and the original is backed up alongside.
