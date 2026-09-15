---
title: Codex のセッション履歴の保存場所
description: Codex は ~/.codex/sessions/ 配下に日付でバケット分けした rollout-*.jsonl を書き出し、プロジェクトのパスは各ファイルの内部に記録します。構成、2 種類のレコード、セッションを読む jq コマンド。
---

# Codex のセッション履歴の保存場所

Codex はセッションごとに 1 つの JSONL ファイルを、開始した日付で整理して保存します：

```
~/.codex/sessions/<YYYY>/<MM>/<DD>/rollout-<タイムスタンプ>-<uuid>.jsonl
```

実際のものはこうなります：

```
~/.codex/sessions/2026/03/20/rollout-2026-03-20T09-55-16-019d08f4-37fe-7090-96a6-100d7fbe09df.jsonl
```

アーカイブしたセッションは隣のディレクトリに移動します：

```
~/.codex/archived_sessions/
```

Codex は `~/.codex/state_<N>.sqlite` にスキーマ版号付きの状態データベースも持ちます。`<N>` はスキーマ変更のたびに増え、番号が最大のものが現行です。

## パスからはプロジェクトが分からない

ディレクトリ階層は日付であってプロジェクトではありません。作業ディレクトリはファイル内部のフィールドに記録されます。そのため「このリポジトリの Codex セッションを全部見せて」という要求は、ディレクトリ一覧だけでは答えられません。各ファイルを開いて `cwd` を読み出す必要があります。

## 2 種類のレコード

Codex の JSONL はメッセージログというよりイベントストリームに近く、1 ターンが抽象度の違う 2 つの形で書き込まれます：

| レコード | 内容 |
| --- | --- |
| `event_msg` | 高レベルの会話イベント。テキストは整形済み |
| `response_item` | モデル API の生の item：ツール呼び出し、複数パートの content 配列 |

読めるテキストが欲しいなら `event_msg`、ツール呼び出しの詳細や添付が必要なら `response_item` を見ます。

### 画像は 2 つのレコードに分かれる

画像を貼り付けたユーザーのターンは 2 つのレコードとして書かれます。`role: user` の `response_item` が `input_image` ブロックと実際の画像データを持ち、`event_msg.user_message` が整形済みのテキストを持ちます。どちらも単独では不完全です。当時の吹き出しを再現するには、画像を保持しておいて対応するテキストイベントに結びつける必要があります。

## Codex のセッションをターミナルから読む

会話テキストを出力：

```bash
jq -r 'select(.type=="event_msg")
  | .payload // . | select(.type=="user_message" or .type=="agent_message")
  | .message // .text' \
  ~/.codex/sessions/2026/03/20/rollout-*.jsonl
```

エディタを開かずにセッションのプロジェクトを確認：

```bash
jq -r 'select(.cwd) | .cwd' <ファイル>.jsonl | head -1
```

全セッションをプロジェクト別に集計します。ディレクトリ構成はこの一覧を与えてくれないので、ループは全ファイルを開くことになります：

```bash
for f in ~/.codex/sessions/*/*/*/rollout-*.jsonl; do
  jq -r 'select(.cwd) | .cwd' "$f" 2>/dev/null | head -1
done | sort | uniq -c | sort -rn
```

## アプリで開く

[Sessions Viewer](/ja/guide/) はこの集計を代わりに行ってキャッシュし、分割された画像レコードを再び結びつけ、ChatGPT サブスクリプションの 5 時間／週次クォータも作業中に表示します。[Claude Code](/ja/agents/claude-code)、[Grok Build](/ja/agents/grok-build)、[Kimi Code](/ja/agents/kimi-code)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
