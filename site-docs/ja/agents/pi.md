---
title: Pi のセッション履歴の保存場所
description: Pi は ~/.pi/agent/sessions/ 配下に追記専用の JSONL を書き出し、プロジェクトのパスをディレクトリ名にエンコードします。セッションルートの解決順、ファイル名、セッションを読むコマンド。
---

# Pi のセッション履歴の保存場所

Pi はセッションごとに追記専用（append-only）の JSONL ファイルを 1 つ書き出します：

```
<セッションルート>/--<エンコードされたプロジェクトパス>--/<タイムスタンプ>_<uuid>.jsonl
```

実際のパスはこうなります：

```
~/.pi/agent/sessions/--Users-me-apps-blog--/2026-08-23T09-49-28-819Z_01a02e06-6f73-7b54-8a4a-63e19fdca249.jsonl
```

ファイル名は ISO 8601 のタイムスタンプで始まるため、単に `ls` するだけで時系列に並びます。

## セッションルートの決まり方

Pi のルートは 3 か所で設定でき、優先順位は次のとおりです：

1. 環境変数 `PI_CODING_AGENT_SESSION_DIR`（設定済みかつ空でない場合）
2. `<agent ディレクトリ>/settings.json` の `sessionDir`
3. 既定値の `<agent ディレクトリ>/sessions`

agent ディレクトリ自体は `PI_CODING_AGENT_DIR` で指定し、既定値は `~/.pi/agent` です。何も設定しなければセッションは `~/.pi/agent/sessions` に入ります。

コマンドラインの一回限りの `--session-dir` は別の場所へ書き込みますが、Pi はそれをインデックス化しないため、あとから発見できるものは何もありません。あとで見つけられるようにしたいなら、このフラグではなくルートのほうを設定してください。

## プロジェクトディレクトリ名

プロジェクトの絶対パスの `/` を `-` に置換し、前後を `--` で囲んだものです：

```
/Users/me/apps/blog   →   --Users-me-apps-blog--
```

前後のダッシュは、名前にもともとダッシュを含むディレクトリと区別するためのもので、一覧からそのままプロジェクト別にまとめられます。

## agent ディレクトリのその他の中身

```
~/.pi/agent/
├── sessions/
├── extensions/          ← ライフサイクル拡張
├── settings.json
├── mcp.json
├── memory/
├── models-store.json
└── auth.json            ← 認証情報。読まないこと
```

Pi のデータを読むものは `sessions/` の中だけに留まるべきです。隣にあるファイルには認証・モデル・信頼設定が入っています。

## Pi のセッションをターミナルから読む

会話を出力：

```bash
jq -r 'select(.type) | .text // .content // empty' \
  ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl
```

あるプロジェクトの最新セッション：

```bash
ls -1 ~/.pi/agent/sessions/--Users-me-apps-blog--/*.jsonl | tail -1
```

プロジェクトごとのセッション数：

```bash
for d in ~/.pi/agent/sessions/*/; do
  printf '%4d  %s\n' "$(ls "$d"*.jsonl 2>/dev/null | wc -l)" "$(basename "$d")"
done | sort -rn
```

## アプリで開く

[Sessions Viewer](/ja/guide/) は Pi と同じ順序でセッションルートを解決し（環境変数、次に `settings.json`、最後に既定値）、セッション記録だけを読みます。隣にある auth や認証情報のファイルには一切触れません。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Kimi Code](/ja/agents/kimi-code)、[Antigravity CLI](/ja/agents/antigravity-cli)、[opencode](/ja/agents/opencode) にも対応しています。
