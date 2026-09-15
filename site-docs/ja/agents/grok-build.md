---
title: Grok Build のセッション履歴の保存場所
description: Grok Build は $GROK_HOME/sessions/ 配下に 1 セッション 1 ディレクトリで保存し、updates.jsonl が記録本体、summary.json がメタデータです。構成、読むべきファイル、jq コマンド。
---

# Grok Build のセッション履歴の保存場所

Grok Build はディレクトリ型です。1 セッションが 1 つのフォルダで、1 ファイルではありません。

```
$GROK_HOME/sessions/<エンコードされた cwd>/<セッション ID>/
```

`GROK_HOME` の既定値は `~/.grok` です。相対パスを指定した場合は、シェルのプロンプトで打った相対パスと同じように、ホームディレクトリからではなくカレントディレクトリから解決されます。

## Grok Build のセッションディレクトリの中身

```
updates.jsonl          ← 読みたいのはこれ
summary.json           ← 一覧用メタデータ、info.cwd を含む
chat_history.jsonl     ← モデルへのコンテキスト。表示用の記録ではない
events.jsonl
rewind_points.jsonl
prompt_history.jsonl
prompt_context.json
system_prompt.txt
resources_state.json
announcement_state.json
*.lock
```

このうち 2 つが記録本体に見えますが、本体は 1 つだけです：

- `updates.jsonl` はユーザーに見えるイベントストリームの正本で、CLI が実際に画面へ描いたものです。
- `chat_history.jsonl` はモデルに渡されたもので、圧縮・並べ替えされ、システムの足場が混ざっています。これを記録として読むと、誰の画面にも表示されなかったものが出てきます。

`.lock` ファイルがあるのは、Grok がこれらのファイルを並行して書き込むためです。セッションがまだ生きている可能性があるなら、解析前にコピーを取ってください。

## セッションが属するプロジェクト

グループディレクトリ名にも作業ディレクトリが埋め込まれていますが、正本は `summary.json` です：

```bash
jq -r '.info.cwd' ~/.grok/sessions/*/*/summary.json | sort | uniq -c | sort -rn
```

## Grok Build のセッションをターミナルから読む

表示された会話を出力：

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.grok/sessions/<グループ>/<セッション ID>/updates.jsonl
```

記録本体に触れずにタイトルと時刻だけを見る：

```bash
jq '{title, info}' ~/.grok/sessions/<グループ>/<セッション ID>/summary.json
```

1 セッションが 1 ディレクトリなので、削除は 1 ファイルの unlink ではなくフォルダごとの削除です。Grok のセッションを扱うものは、ディレクトリを操作単位として扱う必要があります。

## アプリで開く

[Sessions Viewer](/ja/guide/) は `updates.jsonl` を読み、`chat_history.jsonl` は決して読みません。`info.cwd` でグループ化し、ディレクトリを保存単位として扱います。削除は `rm` を呼ぶ代わりに、フォルダごと復元可能なゴミ箱へ移動します。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Kimi Code](/ja/agents/kimi-code)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
