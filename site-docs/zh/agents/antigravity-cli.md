---
title: Antigravity CLI 的会话记录存在哪
description: Antigravity CLI（agy）把对话放在 ~/.gemini/antigravity-cli/brain/<uuid>/ 下，transcript.jsonl 是 step 记录。目录结构、格式的坑，以及用 jq 读对话的命令。
---

# Antigravity CLI 的会话记录存在哪

Antigravity CLI（`agy`）给每个对话一个 UUID 目录，记录埋在里面好几层：

```
~/.gemini/antigravity-cli/brain/<对话 uuid>/.system_generated/logs/transcript.jsonl
```

完整布局：

```
~/.gemini/antigravity-cli/
├── brain/<对话 uuid>/
│   ├── .system_generated/logs/
│   │   ├── transcript.jsonl        ← 滚动窗口
│   │   └── transcript_full.jsonl   ← 名义上完整
│   ├── chunks/
│   ├── scratch/
│   └── media__<时间戳>.<扩展名>    ← 你上传的附件
└── history.jsonl                   ← 索引
```

## 对话属于哪个项目

路径里没有任何线索，答案在根目录那个索引里：

```bash
jq -r '[.timestamp, .workspace, .display] | @tsv' \
  ~/.gemini/antigravity-cli/history.jsonl | sort -r | head
```

每行是 `{display, timestamp, workspace, conversationId}`。`workspace` 是项目目录，`conversationId` 就是 `brain/` 下面那个文件夹名。

## 该读哪一个 transcript

两个都不保证完整。`transcript.jsonl` 是会在 checkpoint 处被压缩的滚动窗口，而 `transcript_full.jsonl` 虽然名字叫 full，同样会在 checkpoint 处被截断。实际可用的规则是：哪个大读哪个。

`transcript.jsonl` 还不是追加式的。CLI 压缩时会整文件重写，所以任何监听它的东西都必须处理「文件变小」，而不只是变大。假设文件单调增长的 tail 会在某一刻悄无声息地停止更新。

## step 记录格式

```json
{"step_index":12,"source":"USER_EXPLICIT","type":"USER_INPUT","status":"...",
 "created_at":"...","content":"...","thinking":"...","tool_calls":[{"name":"...","args":{}}]}
```

`source` 是 `USER_EXPLICIT`、`MODEL`、`SYSTEM` 三者之一。

`content` 有三件事，当成纯文本处理就会出问题：

- 用户输入裹着 XML 壳。真正的消息在 `<USER_REQUEST>…</USER_REQUEST>` 里面，后面还跟着一段 metadata。
- 工具结果带两行前缀。每一条都以 `Created At: …\nCompleted At: …\n` 开头，之后才是真正的输出。
- 代码改动里嵌着 diff。`CODE_ACTION` 类型的 step 含一个 `[diff_block_start]` 标记，后面跟 unified diff。

这些记录里没有任何 token、usage、model 字段，所以这个 agent 没法做成本和用量统计。

## 在终端里读 Antigravity CLI 对话

打印 step 的来源和类型：

```bash
jq -r '[.step_index, .source, .type] | @tsv' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl
```

只把你自己敲的话抠出来，去掉 XML 壳：

```bash
jq -r 'select(.type=="USER_INPUT") | .content' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl \
  | sed -n 's/.*<USER_REQUEST>\(.*\)<\/USER_REQUEST>.*/\1/p'
```

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 会在两份 transcript 里挑大的那个，剥掉 XML 壳和时间戳前缀，把 `CODE_ACTION` 的 diff 渲染成真正的 diff，并且能扛住文件在脚下被重写。它同时还读 [Claude Code](/zh/agents/claude-code)、[Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Kimi Code](/zh/agents/kimi-code)、[Pi](/zh/agents/pi) 和 [opencode](/zh/agents/opencode)。
