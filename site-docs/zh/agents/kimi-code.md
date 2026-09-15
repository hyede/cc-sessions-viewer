---
title: Kimi Code 的会话记录存在哪
description: Kimi Code 一个会话一个目录，放在 ~/.kimi-code/sessions/ 下，state.json 是元数据，agents/main/wire.jsonl 是记录本体。目录结构，以及用 jq 读会话的命令。
---

# Kimi Code 的会话记录存在哪

Kimi Code 先按工作目录分组，再给每个会话一个自己的文件夹：

```
$KIMI_CODE_HOME/sessions/wd_<名字>_<哈希>/session_<uuid>/
```

`KIMI_CODE_HOME` 默认 `~/.kimi-code`。那个目录的根上还有一份扁平索引：

```
~/.kimi-code/session_index.jsonl
```

## wd_ 分组目录

`wd_` 是 working directory 的意思，后面跟的是项目文件夹自己的名字，再加上完整路径的一段短哈希：

```
~/.kimi-code/sessions/wd_blog_dbc648dfdf98/
```

那段哈希让两个都叫 `blog` 但在不同父目录下的项目不会落进同一个桶，所以光看目录列表就能把项目分开。

## Kimi Code 的会话目录里有什么

```
state.json                 ← 会话元数据
agents/main/wire.jsonl     ← 记录本体
logs/
media/
```

`agents/main/` 下面的 `wire.jsonl` 是主记录。之所以多一层 `agents/`，是因为一个会话可以跑不止一个 agent，`main` 是你实际对话的那个。

## 在终端里读 Kimi Code 会话

按时间倒序列出会话和标题：

```bash
jq -r '[.updated_at, .title] | @tsv' ~/.kimi-code/session_index.jsonl | sort -r
```

打印一份记录：

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/agents/main/wire.jsonl
```

看某个会话的元数据：

```bash
jq . ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/state.json
```

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 把 `wire.jsonl` 读进和其它 agent 相同的对话视图，`media/` 里的附件内联显示，重命名和删除都以会话目录为单元。它同时还读 [Claude Code](/zh/agents/claude-code)、[Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Pi](/zh/agents/pi)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
