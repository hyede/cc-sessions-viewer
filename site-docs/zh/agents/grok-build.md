---
title: Grok Build 的会话记录存在哪
description: Grok Build 一个会话一个目录，放在 $GROK_HOME/sessions/ 下，updates.jsonl 是记录本体，summary.json 是元数据。目录结构、该读哪个文件，以及 jq 命令。
---

# Grok Build 的会话记录存在哪

Grok Build 是目录型的：一个会话一个文件夹，不是一个文件。

```
$GROK_HOME/sessions/<编码过的 cwd>/<会话 id>/
```

`GROK_HOME` 默认 `~/.grok`。填相对路径的话按当前工作目录解析，和你在 shell 里手敲一个相对路径一样，而不是相对于 home 目录。

## Grok Build 的会话目录里有什么

```
updates.jsonl          ← 你要的那份记录
summary.json           ← 列表元数据，含 info.cwd
chat_history.jsonl     ← 喂给模型的上下文，不是展示用的记录
events.jsonl
rewind_points.jsonl
prompt_history.jsonl
prompt_context.json
system_prompt.txt
resources_state.json
announcement_state.json
*.lock
```

这里面有两个看着都像对话记录，但只有一个是：

- `updates.jsonl` 是权威的、用户可见的事件流，也就是 CLI 当时渲染给你看的东西。
- `chat_history.jsonl` 是喂给模型的：压缩过、重排过、夹着 system 脚手架。把它当记录读，得到的是一份从来没出现在任何人屏幕上的东西。

那些 `.lock` 文件的存在是因为 Grok 会并发写这些文件。会话可能还活着的话，解析前先拷一份。

## 会话属于哪个项目

分组目录名里编了工作目录，但权威答案在 `summary.json` 里：

```bash
jq -r '.info.cwd' ~/.grok/sessions/*/*/summary.json | sort | uniq -c | sort -rn
```

## 在终端里读 Grok Build 会话

打印可见的对话：

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.grok/sessions/<分组>/<会话 id>/updates.jsonl
```

不碰记录本体，只看标题和时间：

```bash
jq '{title, info}' ~/.grok/sessions/<分组>/<会话 id>/summary.json
```

因为一个会话就是一个目录，删除意味着删掉整个文件夹，而不是 unlink 一个文件。任何管理 Grok 会话的东西都必须把目录当作操作单元。

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 读的是 `updates.jsonl`，绝不读 `chat_history.jsonl`，按 `info.cwd` 归类，并且把目录当作存储单元：删除是把整个文件夹挪进可还原的回收站，不是 `rm`。它同时还读 [Claude Code](/zh/agents/claude-code)、[Codex](/zh/agents/codex)、[Kimi Code](/zh/agents/kimi-code)、[Pi](/zh/agents/pi)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
