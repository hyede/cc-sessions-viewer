---
title: Kimi Code のセッション履歴の保存場所
description: Kimi Code は ~/.kimi-code/sessions/ 配下に 1 セッション 1 ディレクトリで保存し、state.json がメタデータ、agents/main/wire.jsonl が記録本体です。構成と、セッションを読む jq コマンド。
---

# Kimi Code のセッション履歴の保存場所

Kimi Code はまず作業ディレクトリでグループ分けし、その中でセッションごとにフォルダを作ります：

```
$KIMI_CODE_HOME/sessions/wd_<名前>_<ハッシュ>/session_<uuid>/
```

`KIMI_CODE_HOME` の既定値は `~/.kimi-code` です。そのディレクトリの直下にフラットなインデックスもあります：

```
~/.kimi-code/session_index.jsonl
```

## wd_ グループディレクトリ

`wd_` は working directory の略です。その後ろに続くのはプロジェクトフォルダ自体の名前と、フルパスの短いハッシュです：

```
~/.kimi-code/sessions/wd_blog_dbc648dfdf98/
```

このハッシュがあるおかげで、親ディレクトリの異なる同名の `blog` が同じバケットに落ちません。つまりディレクトリ一覧だけでプロジェクトを区別できます。

## Kimi Code のセッションディレクトリの中身

```
state.json                 ← セッションのメタデータ
agents/main/wire.jsonl     ← 記録本体
logs/
media/
```

`agents/main/` 配下の `wire.jsonl` が主たる記録です。`agents/` という階層があるのは、1 つのセッションで複数のエージェントを走らせられるためで、`main` が実際に会話した相手です。

## Kimi Code のセッションをターミナルから読む

セッションとタイトルを新しい順に一覧：

```bash
jq -r '[.updated_at, .title] | @tsv' ~/.kimi-code/session_index.jsonl | sort -r
```

記録を出力：

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/agents/main/wire.jsonl
```

セッションのメタデータを見る：

```bash
jq . ~/.kimi-code/sessions/wd_blog_*/session_<uuid>/state.json
```

## アプリで開く

[Sessions Viewer](/ja/guide/) は `wire.jsonl` を他のエージェントと同じ会話ビューに読み込み、`media/` の添付をインライン表示し、リネームと削除をセッションディレクトリ単位で扱います。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
