---
title: 各家 coding agent 的会话记录存在哪
description: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode 把会话记录存在磁盘的什么位置、什么格式，以及各家怎么记录一个会话属于哪个项目。
---

# 各家 coding agent 的会话记录存在哪

每一个 coding agent CLI 都会把你的对话写到磁盘上，而它们在「写到哪」「写成什么样」「叫什么名字」这三件事上没有任何共识。这页是对照表，每种 agent 另有单独一页讲记录格式和怎么用命令行直接读。

下面所有路径都对着 [Sessions Viewer](https://github.com/jerrywu001/cc-sessions-viewer) 的解析实现核对过，它七种都读。

## 默认位置与格式

| Agent | 默认位置 | 格式 |
| --- | --- | --- |
| [Claude Code](/zh/agents/claude-code) | `~/.claude/projects/` | 一个会话一个 JSONL 文件 |
| [Codex](/zh/agents/codex) | `~/.codex/sessions/` | 一个会话一个 JSONL，按日期分桶 |
| [Grok Build](/zh/agents/grok-build) | `~/.grok/sessions/` | 一个会话一个目录 |
| [Kimi Code](/zh/agents/kimi-code) | `~/.kimi-code/sessions/` | 一个会话一个目录 |
| [Pi](/zh/agents/pi) | `~/.pi/agent/sessions/` | 一个会话一个 JSONL 文件 |
| [Antigravity CLI](/zh/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | 一个对话一个目录 |
| [opencode](/zh/agents/opencode) | `~/.local/share/opencode/opencode.db` | 一个 SQLite 库 |

## 「这个会话属于哪个项目」各家怎么判断

有的把工作目录编进路径里，看一眼目录名就知道。有的记在文件内部，意味着不打开每一个文件就没法按项目归类。

| Agent | 项目信息来自 |
| --- | --- |
| Claude Code | 目录名：绝对路径把 `/` 换成 `-` |
| Codex | 文件内部的 `cwd` 字段。路径只告诉你日期 |
| Grok Build | `summary.json` → `info.cwd` |
| Kimi Code | `wd_<名字>_<哈希>` 分组目录 |
| Pi | 目录名：绝对路径外面裹一对 `--` |
| Antigravity CLI | `history.jsonl` 里的 `workspace` 字段 |
| opencode | `project` 表，按 `session.project_id` 关联 |

## 可以改根目录的环境变量

这几家支持把数据根目录搬走：

```bash
GROK_HOME=/path/to/dir              # Grok Build，默认 ~/.grok
KIMI_CODE_HOME=/path/to/dir         # Kimi Code，默认 ~/.kimi-code
PI_CODING_AGENT_DIR=/path/to/dir    # Pi，默认 ~/.pi/agent
PI_CODING_AGENT_SESSION_DIR=/path   # Pi 的会话根目录
XDG_DATA_HOME=/path/to/dir          # opencode 读 $XDG_DATA_HOME/opencode
```

Claude Code、Codex、Antigravity CLI 在这里读到的布局里没有对应的环境变量，根目录固定在 home 下面。

## 不装应用怎么读记录

每一页都给了能直接打印出可读记录的 `jq` 或 `sqlite3` 一行命令。这些值得记住：agent 出了问题的时候，磁盘上那个文件是唯一如实记录了当时发生什么的东西。

如果不想每次都敲这些，[Sessions Viewer](/zh/guide/) 把七种都读进同一个可搜索的界面，把工具调用和它的结果配好对，把结构化 diff 和内联图片渲染出来，并且永远不改原文件。
