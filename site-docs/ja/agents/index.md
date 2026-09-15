---
title: 各コーディングエージェントのセッション履歴の保存場所
description: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode がセッション記録をディスクのどこにどの形式で保存し、所属プロジェクトをどう記録しているかの対照表。
---

# 各コーディングエージェントのセッション履歴の保存場所

コーディングエージェントの CLI はどれも会話をディスクに書き出しますが、「どこに」「どんな形式で」「どんな名前で」の 3 点について合意はまったくありません。このページはその対照表です。エージェントごとに、レコード形式とターミナルから直接読む方法を扱ったページがあります。

以下のパスはすべて、7 つすべてを読む [Sessions Viewer](https://github.com/jerrywu001/cc-sessions-viewer) のパーサ実装と突き合わせて確認しています。

## 既定の場所と形式

| エージェント | 既定の場所 | 形式 |
| --- | --- | --- |
| [Claude Code](/ja/agents/claude-code) | `~/.claude/projects/` | 1 セッション 1 JSONL ファイル |
| [Codex](/ja/agents/codex) | `~/.codex/sessions/` | 1 セッション 1 JSONL、日付でバケット分け |
| [Grok Build](/ja/agents/grok-build) | `~/.grok/sessions/` | 1 セッション 1 ディレクトリ |
| [Kimi Code](/ja/agents/kimi-code) | `~/.kimi-code/sessions/` | 1 セッション 1 ディレクトリ |
| [Pi](/ja/agents/pi) | `~/.pi/agent/sessions/` | 1 セッション 1 JSONL ファイル |
| [Antigravity CLI](/ja/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | 1 会話 1 ディレクトリ |
| [opencode](/ja/agents/opencode) | `~/.local/share/opencode/opencode.db` | 単一の SQLite データベース |

## 「このセッションはどのプロジェクトか」の判定方法

作業ディレクトリをパスに埋め込むエージェントは一目で分かります。ファイル内部に記録するエージェントは、すべてのファイルを開かないとプロジェクト別にまとめられません。

| エージェント | プロジェクト情報の出どころ |
| --- | --- |
| Claude Code | ディレクトリ名。絶対パスの `/` を `-` に置換したもの |
| Codex | ファイル内部の `cwd` フィールド。パスが示すのは日付だけ |
| Grok Build | `summary.json` → `info.cwd` |
| Kimi Code | `wd_<名前>_<ハッシュ>` のグループディレクトリ |
| Pi | ディレクトリ名。絶対パスを `--` で囲んだもの |
| Antigravity CLI | `history.jsonl` の `workspace` フィールド |
| opencode | `project` テーブル（`session.project_id` で結合） |

## データルートを変更できる環境変数

次のエージェントはデータルートを移動できます：

```bash
GROK_HOME=/path/to/dir              # Grok Build、既定 ~/.grok
KIMI_CODE_HOME=/path/to/dir         # Kimi Code、既定 ~/.kimi-code
PI_CODING_AGENT_DIR=/path/to/dir    # Pi、既定 ~/.pi/agent
PI_CODING_AGENT_SESSION_DIR=/path   # Pi のセッションルート
XDG_DATA_HOME=/path/to/dir          # opencode は $XDG_DATA_HOME/opencode を参照
```

Claude Code、Codex、Antigravity CLI には、ここで扱うレイアウト上これに相当する環境変数はありません。ルートはホームディレクトリ配下に固定です。

## アプリなしで記録を読む

各ページに、読める形の記録を出力する `jq` または `sqlite3` のワンライナーを載せています。覚えておく価値があります。エージェントの挙動がおかしいとき、実際に何が起きたかを正確に残しているのはディスク上のそのファイルだけだからです。

毎回それを打ちたくない場合は、[Sessions Viewer](/ja/guide/) が 7 つすべてをひとつの検索可能な画面に読み込み、ツール呼び出しと結果を対応づけ、構造化された diff とインライン画像を描画し、元ファイルには一切書き込みません。
