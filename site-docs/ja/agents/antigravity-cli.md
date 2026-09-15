---
title: Antigravity CLI のセッション履歴の保存場所
description: Antigravity CLI（agy）は ~/.gemini/antigravity-cli/brain/<uuid>/ 配下に会話を保存し、transcript.jsonl は step レコードで書かれます。構成、形式の落とし穴、会話を読む jq コマンド。
---

# Antigravity CLI のセッション履歴の保存場所

Antigravity CLI（`agy`）は会話ごとに UUID のディレクトリを作り、記録はその数階層下に埋まっています：

```
~/.gemini/antigravity-cli/brain/<会話 uuid>/.system_generated/logs/transcript.jsonl
```

全体の構成：

```
~/.gemini/antigravity-cli/
├── brain/<会話 uuid>/
│   ├── .system_generated/logs/
│   │   ├── transcript.jsonl        ← ローリングウィンドウ
│   │   └── transcript_full.jsonl   ← 名目上は完全版
│   ├── chunks/
│   ├── scratch/
│   └── media__<タイムスタンプ>.<拡張子>   ← 添付ファイル
└── history.jsonl                   ← インデックス
```

## 会話が属するプロジェクト

パスには手がかりがありません。答えはルートのインデックスにあります：

```bash
jq -r '[.timestamp, .workspace, .display] | @tsv' \
  ~/.gemini/antigravity-cli/history.jsonl | sort -r | head
```

各行は `{display, timestamp, workspace, conversationId}` です。`workspace` がプロジェクトディレクトリ、`conversationId` が `brain/` 配下のフォルダ名です。

## どちらの transcript を読むか

どちらも完全であるとは限りません。`transcript.jsonl` はチェックポイントで圧縮されるローリングウィンドウで、`transcript_full.jsonl` も名前に反して同じくチェックポイントで切り詰められます。実用上のルールは、大きいほうを読むことです。

さらに `transcript.jsonl` は追記専用ではありません。圧縮時に CLI がファイル全体を書き直すため、これを監視するものはファイルが大きくなるケースだけでなく小さくなるケースも扱う必要があります。単調増加を前提にした tail は、ある時点から静かに更新を止めます。

## step レコードの形式

```json
{"step_index":12,"source":"USER_EXPLICIT","type":"USER_INPUT","status":"...",
 "created_at":"...","content":"...","thinking":"...","tool_calls":[{"name":"...","args":{}}]}
```

`source` は `USER_EXPLICIT`、`MODEL`、`SYSTEM` のいずれかです。

`content` を素のテキストとして扱うと問題になる点が 3 つあります：

- ユーザー入力は XML で包まれています。実際のメッセージは `<USER_REQUEST>…</USER_REQUEST>` の中にあり、その後ろにメタデータブロックが続きます。
- ツール結果には 2 行の接頭辞が付きます。すべて `Created At: …\nCompleted At: …\n` で始まり、その後に実際の出力が来ます。
- コード編集には diff が埋め込まれています。`CODE_ACTION` の step には `[diff_block_start]` マーカーと、それに続く unified diff が含まれます。

これらのレコードには token・usage・model のフィールドが一切ないため、このエージェントについてはコストとトークンの集計ができません。

## Antigravity CLI の会話をターミナルから読む

step のソースと種別を出力：

```bash
jq -r '[.step_index, .source, .type] | @tsv' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl
```

自分が入力した内容だけを、XML の殻を外して取り出す：

```bash
jq -r 'select(.type=="USER_INPUT") | .content' \
  ~/.gemini/antigravity-cli/brain/<uuid>/.system_generated/logs/transcript.jsonl \
  | sed -n 's/.*<USER_REQUEST>\(.*\)<\/USER_REQUEST>.*/\1/p'
```

## アプリで開く

[Sessions Viewer](/ja/guide/) は 2 つの transcript のうち大きいほうを選び、XML の殻とタイムスタンプの接頭辞を取り除き、`CODE_ACTION` の diff を本物の diff として描画し、ファイルが足元で書き換えられても壊れません。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Kimi Code](/ja/agents/kimi-code)、[Pi](/ja/agents/pi)、[opencode](/ja/agents/opencode) にも対応しています。
