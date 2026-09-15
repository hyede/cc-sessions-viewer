---
title: 恢复与继续会话
description: 在内嵌终端、Terminal.app、iTerm2、Ghostty、Warp 或 cmux 里重开任意 agent 会话，或者在应用内对话里继续 Claude Code 和 Codex 会话，模型和权限模式实时可调。
image: /screenshots/session-resume.png
---

# 恢复与继续会话

读完一个会话，多半是想接着做下去。列表里每个会话都有恢复操作，在哪儿打开由你决定。

![在内嵌终端里恢复的会话，标签页就挨着它的记录](/screenshots/session-resume.png)

## 会话能在哪儿重开

### 内嵌终端

应用里一个真正的 PTY，标签页就挨着你刚才在读的那份记录。不用切窗口，恢复出来的会话和你从中恢复它的历史并排放着。

### 你自己的终端

Terminal.app、iTerm2、Ghostty、Warp 或 cmux。应用会 cd 进项目目录，跑那个 agent 自己的恢复命令，比如 `claude --resume`、`codex resume`，你落到的位置和直接用 CLI 完全一样。

cmux 的处理稍有不同。会话按工作目录匹配到 workspace，所以恢复是复用已有的 workspace，而不是堆出一大串新的。

## 或者就在应用里继续

![应用内对话正在继续一个 Claude Code 会话，输入框旁是模型和权限控件](/screenshots/chat-preview.png)

Claude Code 和 Codex 的会话可以在应用自带的对话里继续。那些平时意味着「带不同参数重启 CLI」的设置，在这儿是实时的开关：

- 模型，会话中途就能换
- 推理强度，包括 Opus 的 Ultracode
- 权限模式，包括 agent 要权限时在对话里直接弹出的允许 / 拒绝

可以用 `@` 提及文件、贴图片，Mermaid 图和表格边打边渲染。斜杠命令可用，包括 `/fork`，把会话分叉成一份副本，原件一个字节不动。

另外五种 agent 提供历史、恢复、导出和分析，但不含应用内对话。

## Shell 标签

会话旁边不一定非得是 agent。普通的 shell 标签在同一个标签条里打开，工作目录相同，并且能扛过重启，你挂着的那个 `npm run dev` 明天还在。

## 启动参数

每种 agent 可以配自己的 CLI 参数，新建和恢复时都会带上。最典型的就是 `--dangerously-skip-permissions`。参数在设置里按 agent 分别配置，所以给某个 CLI 加的参数不会漏到别的上面去。
