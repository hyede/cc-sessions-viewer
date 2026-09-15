---
title: opencode のセッション履歴の保存場所
description: opencode は JSONL を使いません。すべてのセッションは ~/.local/share/opencode/opencode.db という単一の SQLite データベースにあります。スキーマ、主要な 4 テーブル、記録を読む SQL。
---

# opencode のセッション履歴の保存場所

opencode は 7 つの中で異質です。他のエージェントは `grep` できる JSONL を書きます。opencode はすべてを単一の SQLite データベースに入れます：

```
~/.local/share/opencode/opencode.db
```

XDG Base Directory 仕様に従うため、`$XDG_DATA_HOME` が設定されていれば `$XDG_DATA_HOME/opencode/opencode.db` が優先されます。多くのアプリが `~/Library/Application Support` を使う macOS でも同じです。

セッションごとのファイルは存在しません。ホームディレクトリを `grep -r` しても opencode の会話は見つかりません。たいていの人はこうしてこの事実に気づきます。

## 主要な 4 テーブル

```sql
project  -- id (sha1)、worktree（プロジェクトディレクトリ）、vcs、time_*
session  -- id（"ses_…"）、project_id、parent_id、slug、title、directory、
         -- model (JSON)、tokens_* 5 列、cost、time_created、
         -- time_updated、time_archived
message  -- id（"msg_…"）、session_id、time_created、data（JSON エンベロープ）
part     -- id（"prt_…"）、message_id、session_id、time_created、data（JSON 本文）
```

データベースには他にもテーブル（`workspace`、`todo`、`permission`、`event`、`credential`、マイグレーション管理）がありますが、1 つの記録は `session` → `message` → `part` です。

`message.data` は JSON エンベロープで、`role`、`modelID`、`providerID`、`tokens{input,output,reasoning,cache{read,write}}`、`cost`、`time{created,completed}` を持ちます。`part.data` が本文で、`type` は `text`、`reasoning`、`tool`、`file`、`step-start`、`step-finish` などです。

## サブエージェントのセッション

`parent_id` が非 NULL のセッションは、別のセッションから派生したサブエージェントの実行です。実際に課金される API 呼び出しですが、自分で始めた会話ではありません。「自分のセッション一覧」を出すものはこれらを除外すべきで、支出を合計するものは必ず含める必要があります。

## 読み取り専用で開く

読んでいる間に opencode の TUI が書き込んでいる可能性があります。SQLite の WAL モードにより並行読み取りは安全ですが、読み取り専用で開き、書き込みロックを取らないことが前提です：

```bash
sqlite3 "file:$HOME/.local/share/opencode/opencode.db?mode=ro" ".tables"
```

## opencode の記録を SQL で読む

プロジェクトとコスト付きで、新しい順にセッションを一覧：

```sql
SELECT s.id, p.worktree, s.title, s.cost,
       datetime(s.time_created/1000, 'unixepoch') AS created
FROM session s
JOIN project p ON p.id = s.project_id
WHERE s.parent_id IS NULL
ORDER BY s.time_created DESC
LIMIT 20;
```

1 つのセッションのテキストを順番に出力：

```sql
SELECT json_extract(m.data, '$.role') AS role,
       json_extract(pt.data, '$.text') AS text
FROM message m
JOIN part pt ON pt.message_id = m.id
WHERE m.session_id = 'ses_...'
  AND json_extract(pt.data, '$.type') = 'text'
ORDER BY m.time_created, pt.time_created;
```

プロジェクト別の合計支出：

```sql
SELECT p.worktree, ROUND(SUM(s.cost), 2) AS usd, COUNT(*) AS sessions
FROM session s JOIN project p ON p.id = s.project_id
GROUP BY p.worktree ORDER BY usd DESC;
```

最後のクエリは意図的にサブエージェントのセッションを含めています。それも請求の一部だからです。

## コストをデータベースから取る理由 {#cost-from-db}

opencode は任意のプロバイダを指せます。DeepSeek、OpenRouter、ローカルモデル、何でもです。モデル名を引く価格表では実際の呼び出しコストを再構成できないため、assistant メッセージごとに記録された実際の `modelID` と `cost` だけが信頼できる情報源です。

## アプリで開く

[Sessions Viewer](/ja/guide/) はこのデータベースを読み取り専用で参照し、一覧ではサブエージェントのセッションを隠しつつ統計には算入し、opencode の会話を JSONL ベースのエージェントと同じ画面に並べて表示します。[Claude Code](/ja/agents/claude-code)、[Codex](/ja/agents/codex)、[Grok Build](/ja/agents/grok-build)、[Kimi Code](/ja/agents/kimi-code)、[Pi](/ja/agents/pi)、[Antigravity CLI](/ja/agents/antigravity-cli) にも対応しています。
