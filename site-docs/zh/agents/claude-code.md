---
title: Claude Code 的会话记录存在哪
description: Claude Code 把每个会话写成 ~/.claude/projects/ 下的一个 JSONL 文件。目录结构、记录格式、结构化 diff，以及在终端里用 jq 直接读会话的命令。
---

# Claude Code 的会话记录存在哪

Claude Code 把每个会话存成 home 目录下的一个 JSONL 文件：

```
~/.claude/projects/<项目目录>/<会话 id>.jsonl
```

`<会话 id>` 就是你传给 `claude --resume` 的那个 UUID。每个项目目录里还有一个 `sessions-index.json`，是 CLI 自己的会话选择器在维护。

## 项目目录名怎么来的

Claude Code 把项目的绝对路径里每一个 `/` 换成 `-`，开头那个也换，得到目录名：

```
/Users/me/apps/blog   →   -Users-me-apps-blog
```

除此之外没有编码别的东西，所以理论上两个只差一个会被改写的字符的项目会撞到一起。实际用起来的好处是：`ls` 一下就知道每个文件夹对应哪个项目。

## Claude Code 的一条记录长什么样

一行一个 JSON 对象，用 `type` 区分：

```json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"..."},{"type":"tool_use","name":"Edit","input":{}}]}}
```

整段对话都在 `message.content` 这个数组的块里：

| 块 `type` | 内容 |
| --- | --- |
| `text` | 普通文本 |
| `thinking` | 扩展思考（模型产生了才有） |
| `tool_use` | 一次工具调用：`name` 加一个 `input` 对象 |
| `tool_result` | 结果，靠 `tool_use_id` 和调用配对 |
| `image` | 粘贴的图是 `source.base64`，引用的是 `source.url` |

记录层面还有别的 `type`，比如会话被改过名字时的 `custom-title`。

### 结构化 diff {#structured-diffs}

文件编辑的 `tool_result` 回来时常常带一个 `structuredPatch` 字段：已经按 hunk 切好的 diff，而不是一坨文本。有这个字段，编辑才能渲染成真正的 diff。

## 在终端里读 Claude Code 会话

按 `角色: 文本` 打印每条消息：

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content[]? | select(.type=="text") | .text' \
  ~/.claude/projects/-Users-me-apps-blog/<会话 id>.jsonl
```

统计调用过哪些工具，按次数排：

```bash
jq -r '.message.content[]? | select(.type=="tool_use") | .name' \
  ~/.claude/projects/*/*.jsonl | sort | uniq -c | sort -rn
```

找出动过某个文件的会话：

```bash
grep -l "src/api.ts" ~/.claude/projects/*/*.jsonl
```

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 直接读这些文件。思考块、工具调用与结果的配对、`structuredPatch` diff、内联图片都按当时的样子呈现，原文件一个字节不改，`⌘⇧F` 一次搜遍所有项目。它同时还读 [Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Kimi Code](/zh/agents/kimi-code)、[Pi](/zh/agents/pi)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
