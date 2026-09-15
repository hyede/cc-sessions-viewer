---
layout: home
title: Claude Code、Codex、opencode 会话记录查看器
titleTemplate: false
description: 一个免费的桌面应用，把 Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI 和 opencode 的本地会话记录读进同一个界面，可阅读、搜索、恢复。

hero:
  name: Sessions Viewer
  text: 七种 CLI，一个工作区
  tagline: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI 和 opencode 各自把会话记录存在不同的地方、用不同的格式。Sessions Viewer 把它们全部读进同一套 项目 → 会话 → 对话 的视图。
  actions:
    - theme: brand
      text: 开始使用
      link: /zh/guide/
    - theme: alt
      text: 下载
      link: https://github.com/jerrywu001/cc-sessions-viewer/releases/latest
    - theme: alt
      text: GitHub
      link: https://github.com/jerrywu001/cc-sessions-viewer

features:
  - title: 原样还原
    details: 思考链、工具调用与结果的配对、结构化 diff、粘贴的截图，都按当时在屏幕上发生的样子呈现。
    link: /zh/features/read-and-search
    linkText: 会话是怎么还原的
  - title: 跨项目搜索
    details: ⌘⇧F 一次搜遍所有项目，直接跳到命中的那条消息。一个紧凑列表里扫完你在这个会话里写过的每一句提问。
    link: /zh/features/read-and-search#finding-a-message
    linkText: 搜索与跳转提问
  - title: 从断点继续
    details: 在内嵌终端里重开会话，或交给 Terminal.app、iTerm2、Ghostty、Warp、cmux，也可以直接在应用内的对话里继续，模型、推理强度、权限模式都是实时可调的。
    link: /zh/features/resume
    linkText: 恢复与继续
  - title: Token 与成本统计
    details: 价格取自 models.dev 的实时数据，按项目、模型、工具拆开。macOS 菜单栏直接显示各 agent 的今日 / 7 天 / 30 天用量。
    link: /zh/features/stats
    linkText: 统计
  - title: 工具管理
    details: 七种 agent 的 skills、MCP 服务器、hooks 和指令文件集中在一个面板里。找出机器上重复的 skill 和断掉的链接，任何改动落盘前都先把要动的文件逐条列给你看。
    link: /zh/tools/
    linkText: 管理 skills、MCP 和 hooks
  - title: 只读、纯本地
    details: 原始会话文件永远不会被修改。删除是移进一个可以还原的共享回收站，不是 rm。没有任何数据上传。
    link: /zh/features/export-and-trash#the-read-only-guarantee
    linkText: 只读保证
---

## 各家 agent 的会话记录在哪

Sessions Viewer 在原位读取每个 CLI 本来就在写的那些文件。参考页记录了每一种布局，并给出不装应用也能读记录的 `jq` 和 `sqlite3` 命令。

| Agent | 默认位置 | 格式 |
| --- | --- | --- |
| [Claude Code](/zh/agents/claude-code) | `~/.claude/projects/` | 一个会话一个 JSONL 文件 |
| [Codex](/zh/agents/codex) | `~/.codex/sessions/` | 一个会话一个 JSONL，按日期分桶 |
| [Grok Build](/zh/agents/grok-build) | `~/.grok/sessions/` | 一个会话一个目录 |
| [Kimi Code](/zh/agents/kimi-code) | `~/.kimi-code/sessions/` | 一个会话一个目录 |
| [Pi](/zh/agents/pi) | `~/.pi/agent/sessions/` | 一个会话一个 JSONL 文件 |
| [Antigravity CLI](/zh/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | 一个对话一个目录 |
| [opencode](/zh/agents/opencode) | `~/.local/share/opencode/opencode.db` | 一个 SQLite 库 |

应用免费、开源，基于 MIT 许可证，支持 macOS、Windows 和 Linux。[下载最新版本](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)，或者从[指南](/zh/guide/)开始。
