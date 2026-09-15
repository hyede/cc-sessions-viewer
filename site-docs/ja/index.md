---
layout: home
title: Claude Code・Codex・opencode のセッション履歴ビューア
titleTemplate: false
description: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode のローカルセッション履歴を読み、検索し、再開できる無料のデスクトップアプリ。

hero:
  name: Sessions Viewer
  text: 7 つの CLI をひとつのワークスペースに
  tagline: Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode はそれぞれ別の場所に別の形式でセッション履歴を保存します。Sessions Viewer はそのすべてを同じ プロジェクト → セッション → 会話 のビューに読み込みます。
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/
    - theme: alt
      text: ダウンロード
      link: https://github.com/jerrywu001/cc-sessions-viewer/releases/latest
    - theme: alt
      text: GitHub
      link: https://github.com/jerrywu001/cc-sessions-viewer

features:
  - title: そのままの再現
    details: 思考チェーン、ツール呼び出しと結果の対応づけ、構造化された diff、貼り付けたスクリーンショットまで、画面で起きたとおりに表示されます。
    link: /ja/features/read-and-search
    linkText: セッション再現のしくみ
  - title: プロジェクト横断の検索
    details: ⌘⇧F で全プロジェクトを一度に検索し、該当するメッセージへ直接ジャンプします。そのセッションで書いたプロンプトはコンパクトな一覧で見渡せます。
    link: /ja/features/read-and-search#finding-a-message
    linkText: 検索とプロンプトへのジャンプ
  - title: 中断したところから再開
    details: 内蔵ターミナルで開き直す、Terminal.app / iTerm2 / Ghostty / Warp / cmux に渡す、あるいはアプリ内チャットでそのまま続ける。モデル・推論の強さ・権限モードはその場で切り替えられます。
    link: /ja/features/resume
    linkText: 再開と継続
  - title: トークンとコストの統計
    details: models.dev のライブ価格をもとに、プロジェクト・モデル・ツール別に集計します。macOS のメニューバーにはエージェントごとの今日・7 日・30 日の合計が出ます。
    link: /ja/features/stats
    linkText: 統計
  - title: ツール管理
    details: 7 つのエージェントの skills・MCP サーバー・hooks・指示ファイルをひとつのパネルに。重複した skill や切れたリンクを見つけ出し、書き込む前に変更されるファイルを必ず提示します。
    link: /ja/tools/
    linkText: skills・MCP・hooks の管理
  - title: 読み取り専用・ローカル完結
    details: 元のセッションファイルは一切変更しません。削除は復元できる共有ゴミ箱への移動で、どこにもアップロードされません。
    link: /ja/features/export-and-trash#the-read-only-guarantee
    linkText: 読み取り専用の保証
---

## 各エージェントのセッションの保存場所

Sessions Viewer は、各 CLI がすでに書き出しているファイルをその場で読みます。リファレンスページではすべてのレイアウトを説明し、アプリなしで記録を読むための `jq` と `sqlite3` のコマンドも載せています。

| エージェント | 既定の場所 | 形式 |
| --- | --- | --- |
| [Claude Code](/ja/agents/claude-code) | `~/.claude/projects/` | 1 セッション 1 JSONL ファイル |
| [Codex](/ja/agents/codex) | `~/.codex/sessions/` | 1 セッション 1 JSONL、日付でバケット分け |
| [Grok Build](/ja/agents/grok-build) | `~/.grok/sessions/` | 1 セッション 1 ディレクトリ |
| [Kimi Code](/ja/agents/kimi-code) | `~/.kimi-code/sessions/` | 1 セッション 1 ディレクトリ |
| [Pi](/ja/agents/pi) | `~/.pi/agent/sessions/` | 1 セッション 1 JSONL ファイル |
| [Antigravity CLI](/ja/agents/antigravity-cli) | `~/.gemini/antigravity-cli/brain/` | 1 会話 1 ディレクトリ |
| [opencode](/ja/agents/opencode) | `~/.local/share/opencode/opencode.db` | 単一の SQLite データベース |

このアプリは MIT ライセンスの無料オープンソースで、macOS、Windows、Linux で動作します。[最新リリースをダウンロード](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)するか、[ガイド](/ja/guide/)から始めてください。
