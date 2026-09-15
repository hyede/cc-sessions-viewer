---
title: Claude Code のセッション履歴の保存場所
description: Claude Code は 1 セッション 1 つの JSONL 記録を ~/.claude/projects/ 配下に書き出します。ディレクトリ構成、レコード形式、構造化された diff、ターミナルから読む jq コマンド。
---

# Claude Code のセッション履歴の保存場所

Claude Code はセッションごとに 1 つの JSONL ファイルをホーム配下に書き出します：

```
~/.claude/projects/<プロジェクトディレクトリ>/<セッション ID>.jsonl
```

`<セッション ID>` は `claude --resume` に渡す UUID そのものです。各プロジェクトディレクトリには、CLI 自身のセッションピッカー用の `sessions-index.json` も置かれます。

## プロジェクトディレクトリ名の作られ方

Claude Code は、プロジェクトの絶対パスに含まれる `/` を先頭のものも含めてすべて `-` に置き換え、ディレクトリ名を作ります：

```
/Users/me/apps/blog   →   -Users-me-apps-blog
```

それ以外は何もエンコードされていないため、置換される文字 1 つだけが異なるパス同士は理論上衝突します。実用上は、ディレクトリ一覧を読むだけでどのフォルダがどのプロジェクトか分かります。

## Claude Code のレコードの形

1 行 1 つの JSON オブジェクトで、`type` で区別します：

```json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"..."},{"type":"tool_use","name":"Edit","input":{}}]}}
```

会話は `message.content` の配列に、ブロックとして入っています：

| ブロックの `type` | 内容 |
| --- | --- |
| `text` | 通常のテキスト |
| `thinking` | 拡張思考（モデルが生成した場合のみ） |
| `tool_use` | ツール呼び出し：`name` と `input` オブジェクト |
| `tool_result` | 結果。`tool_use_id` で呼び出しと対応づく |
| `image` | 貼り付けた画像は `source.base64`、参照は `source.url` |

レコードレベルには他の `type` もあります。セッションをリネームしたときの `custom-title` などです。

### 構造化された diff {#structured-diffs}

ファイル編集の `tool_result` には `structuredPatch` フィールドが付くことが多く、これはテキストの塊ではなくハンク単位に分解済みの diff です。このフィールドがあるからこそ、編集を本物の diff として描画できます。

## Claude Code のセッションをターミナルから読む

各メッセージを `ロール: テキスト` の形で出力：

```bash
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content[]? | select(.type=="text") | .text' \
  ~/.claude/projects/-Users-me-apps-blog/<セッション ID>.jsonl
```

どのツールを何回呼んだかを集計：

```bash
jq -r '.message.content[]? | select(.type=="tool_use") | .name' \
  ~/.claude/projects/*/*.jsonl | sort | uniq -c | sort -rn
```

特定のファイルに触れたセッションを探す：

```bash
grep -l "src/api.ts" ~/.claude/projects/*/*.jsonl
```

## アプリで開く

[Sessions Viewer](/ja/guide/) はこれらのファイルを直接読みます。思考ブロック、ツール呼び出しと結果の対応づけ、`structuredPatch` の diff、インライン画像が当時のとおりに描画され、元ファイルには書き込まず、`⌘⇧F` で全プロジェクトを一度に検索できます。[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Kimi Code](/ja/agents/kimi-code)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
