---
title: Token 与成本统计
description: Claude Code、Codex 等七种 agent 的 token 用量和花费，按项目、模型、工具拆开，价格取自 models.dev 实时数据，macOS 菜单栏显示今日 / 7 天 / 30 天。
image: /screenshots/stats.png
---

# Token 与成本统计

![Sessions Viewer 的 token 与成本分析，按项目和模型拆开](/screenshots/stats.png)

每种 agent 都会在自己的记录里报 token 用量，但没有一个会告诉你所有 agent 加起来是多少。`⌘⇧S` 打开统计视图，它读遍磁盘上的所有会话再汇总。

## 按什么拆

- 项目：哪个仓库在真正烧钱
- 模型：花费落在你用的哪些模型上
- 工具：哪些工具被调用、调用了多少次
- 时间：今日、最近 7 天、最近 30 天

可以看全部 agent，也可以只看某一个。

## 价格从哪来

价格取自 [models.dev](https://models.dev)（一个开源的模型目录），本地缓存 24 小时。

选 models.dev 而不是 LiteLLM 的价目表，原因是收录速度。那份表靠 PR 驱动，新发布的模型可能好几天都没有条目。Fable 5 发布当天 models.dev 已经收录，LiteLLM 还没有。缺条目意味着那部分会话在总额里悄无声息地算成零，这比价格稍微陈旧糟糕得多。

![Sessions Viewer 内置的实时模型价目表](/screenshots/model-price.png)

完整价目表在应用里可以直接翻，所以你能看到某个模型是按什么价算的，而不是面对一个不知道哪来的数字。

### 价目表不够用的地方

opencode 可以挂任意 provider，所以模型名推不出价格。那类会话改用 opencode 自己库里逐条消息记着的成本，见 [opencode 那页](/zh/agents/opencode#cost-from-db)。Antigravity CLI 的记录里根本没有 token 字段，所以它不贡献任何用量数字。

## 菜单栏

macOS 上菜单栏显示各 agent 的今日 / 7 天 / 30 天读数，让这个数字出现在你真的会看到的地方，而不是藏在一个要主动打开的窗口后面。

## 额度徽标

用订阅账号登录的 Claude 和 Codex 会话，会在输入框旁边显示 5 小时和周额度的剩余比例，随着你干活刷新。用第三方 API key 认证的会话没有这种额度窗口，所以不显示徽标。
