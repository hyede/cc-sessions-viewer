---
title: Pi 的会话记录存在哪
description: Pi 把会话写成 ~/.pi/agent/sessions/ 下的追加式 JSONL，项目路径编在目录名里。会话根目录怎么解析、文件怎么命名，以及读会话的命令。
---

# Pi 的会话记录存在哪

Pi 一个会话一个追加式（append-only）JSONL 文件：

```
<会话根目录>/--<编码过的项目路径>--/<时间戳>_<uuid>.jsonl
```

真实路径长这样：

```
~/.pi/agent/sessions/--Users-me-apps-blog--/2026-08-23T09-49-28-819Z_01a02e06-6f73-7b54-8a4a-63e19fdca249.jsonl
```

文件名以 ISO 8601 时间戳打头，所以直接 `ls` 出来就是按时间排好的。

## 会话根目录怎么定

Pi 的根目录有三个地方可以配，优先级从高到低：

1. `PI_CODING_AGENT_SESSION_DIR` 环境变量（设了且非空）
2. `<agent 目录>/settings.json` 里的 `sessionDir`
3. 默认值，`<agent 目录>/sessions`

agent 目录本身由 `PI_CODING_AGENT_DIR` 指定，默认 `~/.pi/agent`。所以什么都不配的话，会话就在 `~/.pi/agent/sessions`。

命令行上那个一次性的 `--session-dir` 参数会写到别处去，但 Pi 不会给它建索引，事后没有任何东西找得到。想让会话以后还能被找到，就改根目录，别用那个参数。

## 项目目录名怎么来的

项目绝对路径把 `/` 换成 `-`，前后各裹一对 `--`：

```
/Users/me/apps/blog   →   --Users-me-apps-blog--
```

前后那两对短横是用来和「名字里本来就带短横的目录」区分的，所以光看列表就能按项目归类。

## agent 目录里还有什么

```
~/.pi/agent/
├── sessions/
├── extensions/          ← 生命周期扩展
├── settings.json
├── mcp.json
├── memory/
├── models-store.json
└── auth.json            ← 凭据，别读这个
```

任何读 Pi 数据的东西都应该只待在 `sessions/` 里。旁边那些文件装的是认证、模型和信任配置。

## 在终端里读 Pi 会话

打印对话：

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl
```

某个项目最近的一个会话：

```bash
ls -1 ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl | tail -1
```

按项目统计会话数：

```bash
for d in ~/.pi/agent/sessions/*/; do
  printf '%4d  %s\n' "$(ls "$d"*.jsonl 2>/dev/null | wc -l)" "$(basename "$d")"
done | sort -rn
```

## 或者用应用打开

[Sessions Viewer](/zh/guide/) 按和 Pi 一样的顺序解析会话根目录，先看环境变量，再看 `settings.json`，最后用默认值，并且只读会话记录，绝不碰旁边的 auth 和凭据文件。它同时还读 [Claude Code](/zh/agents/claude-code)、[Codex](/zh/agents/codex)、[Grok Build](/zh/agents/grok-build)、[Kimi Code](/zh/agents/kimi-code)、[Antigravity CLI](/zh/agents/antigravity-cli) 和 [opencode](/zh/agents/opencode)。
