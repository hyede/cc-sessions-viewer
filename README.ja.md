<div align="center">

# Sessions Viewer

[![Version](https://img.shields.io/github/v/release/jerrywu001/cc-sessions-viewer?color=blue&label=version)](https://github.com/jerrywu001/cc-sessions-viewer/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/jerrywu001/cc-sessions-viewer/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/jerrywu001/cc-sessions-viewer/total)](https://github.com/jerrywu001/cc-sessions-viewer/releases/latest)
[![Star on GitHub](https://img.shields.io/github/stars/jerrywu001/cc-sessions-viewer?style=flat&logo=github&label=Star%20on%20GitHub)](https://github.com/jerrywu001/cc-sessions-viewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](README.md) · [中文](README.zh-CN.md) · **日本語** · [**ドキュメント**](https://sessions-viewer.js-bridge.com/ja/) · [CHANGELOG](CHANGELOG.md)

<p align="center"><strong>Claude Code</strong>、<strong>Codex</strong>、<strong>Grok Build</strong>、<strong>Kimi Code</strong>、<strong>Pi</strong>、<strong>Antigravity CLI</strong>、<strong>opencode</strong> 専用のネイティブデスクトップブラウザ。<br/>7 つの CLI のローカルセッション履歴を一元的に読み取り、検索し、管理します。</p>

<p align="center">さらに<strong>ツール管理</strong>のページ — 各エージェントに散らばった skill（重複・リンク切れ・同じものが 3 か所に）を整理し、<br/>MCP サーバー・hook・指示ファイルもまとめて掌握。<a href="https://sessions-viewer.js-bridge.com/ja/tools/"><strong>ガイド →</strong></a></p>

</div>

https://github.com/user-attachments/assets/9bcb92a8-e5b8-40e5-b492-af252162309b

---

## 概要

Sessions Viewer は、ローカルのエージェントセッション履歴を検索可能なワークスペースにまとめます。プロジェクトを開いて内容を正確に振り返り、JSONL ファイルを手作業で探すことなく同じ場所から作業を続けられます。

> [!TIP]
> **新機能 — ツール管理。** 7 つのエージェントの skill・MCP サーバー・hook・グローバル指示ファイルを 1 つの画面にまとめます。マシン上の重複した skill や切れたリンクを見つけて修復し、入力を始める前に MCP サーバーがコンテキストをどれだけ消費しているかを確認し、hook は信頼する前に試し実行できます。すべての変更は、書き換わるファイルを先に提示します。
>
> → **[ツール管理ガイドを読む](https://sessions-viewer.js-bridge.com/ja/tools/)**

### 読む・探す

- **忠実な再現** — 思考プロセス、ツール呼び出しのペアリング、構造化 Diff、インライン画像を完全に表示。
- **グローバル検索** — プロジェクトを横断して検索し、`⌘⇧F` で該当メッセージへ直行。
- **プロンプトへジャンプ** — すべてのユーザープロンプトを一覧から選び、対象メッセージへスクロールしてハイライト。
- **ビュー履歴** — プロジェクトごとに閲覧・チャットビューの履歴を保存し、検索やお気に入り、一発復帰に対応。

### 作業を続ける

- **アプリ内チャット** — Claude Code と Codex のセッションを内蔵チャットで新規作成・再開。モデル、推論強度（Opus **Ultracode** 対応）、権限モードを切り替え可能。
- **ワンクリック再開** — 埋め込みターミナルまたは **Terminal.app**、**cmux**、**iTerm2**、**Ghostty**、**Warp** でセッションを再開・新規作成。
- **Shell タブ** — エージェントセッションの横で通常のシェルコマンドを実行でき、タブは再起動後も保持。
- **起動引数** — エージェントごとに CLI フラグ（例：`--dangerously-skip-permissions`）を設定し、再開・新規作成時に自動追加。

### プロジェクトを整理する

- **画面分割** — 左右または上下のペインに分割し、タブをペイン間でドラッグ。プロジェクトごとのレイアウトは再起動後も保持。
- **cmux 統合** — 作業ディレクトリでワークスペースを再利用し、実行中のセッションを見つけ、分割方向を自動選択。タブ名にはディレクトリ名を使用。
- **ブックマーク** — よく使うフォルダをサイドバーにピン留めし、エージェントごとに管理。
- **リネームとゴミ箱** — セッション名の変更を CLI に同期し、ソフト削除したセッションは共有ゴミ箱から復元可能。

### 利用状況を把握・共有する

- **統計と料金** — models.dev のリアルタイム料金で、プロジェクト・モデル・ツール別にトークン消費とコストを分析。macOS のメニューバーには各エージェントの Today / 7d / 30d 集計を表示。
- **柔軟なエクスポート** — 単一または複数セッションをオフラインで読める Markdown、HTML、可逆 JSON として保存。
- **読み取り専用の安全性** — オリジナルの JSONL は変更・削除しません。

### 対応するセッションソース

Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode に対応しています。Grok Build、Kimi Code、Pi では履歴、ターミナル、エクスポート、分析、再開のワークフローを利用できますが、GUI Chat は意図的に含めていません。

それぞれがセッションをディスクのどこに保存するか、ターミナルから記録を読むコマンドとあわせて [sessions-viewer.js-bridge.com/ja/agents/](https://sessions-viewer.js-bridge.com/ja/agents/) にまとめています。

## スクリーンショット

<details>
  <summary>ビジュアルツアーを開く</summary>

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/cover.png" alt="メインビュー — サイドバー、セッション、チャット" />
      <p align="center"><em>メインビュー — サイドバー、セッション一覧、チャット</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/chat.png" alt="忠実な再現 — 思考、ツール呼び出し、構造化 Diff" />
      <p align="center"><em>忠実な再現 — 思考、ツール呼び出し、構造化 Diff</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/split-screen.png" alt="画面分割 — 複数セッションを並べて表示" />
      <p align="center"><em>画面分割 — 複数セッションを並べて表示、タブをペイン間でドラッグ</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/chat-preview.png" alt="アプリ内チャット — Mermaid、表、ファイル メンション、画像添付" />
      <p align="center"><em>アプリ内チャット — Mermaid・表の描画、@ファイル メンション、画像添付</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/session-resume.png" alt="埋め込みターミナルでセッション再開" />
      <p align="center"><em>埋め込みターミナル — ワンクリックで再開・新規作成</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/search.png" alt="グローバル検索オーバーレイ" />
      <p align="center"><em>グローバル検索（⌘⇧F）で目的のメッセージへ直行</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/stats.png" alt="トークン・コスト分析ダッシュボード" />
      <p align="center"><em>プロジェクト · モデル · ツール別のトークン・コスト分析</em></p>
    </td>
    <td width="50%">
      <img src="src/assets/sys-stats.png" alt="メニューバー統計 — 各エージェントのコストとトークン概要" />
      <p align="center"><em>メニューバー統計 — 各エージェントのコストとトークン概要</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/model-price.png" alt="モデル料金テーブル" />
      <p align="center"><em>リアルタイムモデル料金表</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/trash.png" alt="共有ゴミ箱と復元" />
      <p align="center"><em>共有ゴミ箱 — ソフト削除とワンクリック復元</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="src/assets/settings.png" alt="設定 — ターミナル選択と起動引数" />
      <p align="center"><em>設定 — ターミナル選択と起動引数</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/export.png" alt="エクスポート HTML のプレビュー" />
      <p align="center"><em>エクスポート HTML — 完全オフライン、ブラウザで開ける</em></p>
    </td>
  </tr>
</table>

</details>

## インストール

[Releases](https://github.com/jerrywu001/cc-sessions-viewer/releases) からプラットフォームに合ったインストーラをダウンロード、または[インストールガイド](https://sessions-viewer.js-bridge.com/ja/guide/install)を参照：

| プラットフォーム | ファイル |
| --- | --- |
| macOS (Apple Silicon + Intel) | `.dmg` |
| Windows x64 | `-setup.exe` / `.msi` |
| Linux x86_64 | `.deb` / `.AppImage` |

> [!IMPORTANT]
> **macOS: このビルドは公証（notarization）を受けていません。** ad-hoc 署名のみのため、初回
> 起動時に Gatekeeper が「"Sessions Viewer"は開けません。Apple は、悪質なソフトウェアが含まれ
> ていないことを確認できませんでした」と表示してブロックします。署名なしのオープンソース
> ビルドでは正常な挙動で、異常ではありません。
>
> **macOS 15 Sequoia 以降** —— 右クリック →「開く」による回避は Apple が廃止しました：
> 1. アプリをダブルクリックし、警告を閉じます。
> 2. **システム設定 → プライバシーとセキュリティ** を開き、一番下までスクロールします。
> 3. 「"Sessions Viewer"がブロックされました」の横の **このまま開く** をクリックし、認証します。
> 4. もう一度アプリを起動し、**開く** をクリックします。
>
> **macOS 14 Sonoma 以前** —— Finder でアプリを右クリック → **開く** → ダイアログで再度
> **開く**。初回のみです。
>
> **どちらの場合もターミナルから:**
> ```bash
> xattr -dr com.apple.quarantine "/Applications/Sessions Viewer.app"
> ```
> `Operation not permitted` と出る場合は `sudo` を付けてください。

Linux 版 `.AppImage` はポータブル形式 —— `chmod +x` で実行可能になります。`.deb` のインストール：
```bash
sudo apt install ./cc-sessions-viewer_<ver>_amd64.deb
```

## 開発

```bash
git clone https://github.com/jerrywu001/cc-sessions-viewer.git
cd cc-sessions-viewer
npm install
npm run tauri dev      # 開発モード
npm run tauri build    # バンドル
```

必要環境：Node 20+、Rust stable。アーキテクチャの詳細は [`CLAUDE.md`](CLAUDE.md) を参照。

## コントリビュート

PR 歓迎。[Conventional Commits](https://www.conventionalcommits.org/)（`feat:` / `fix:` / `docs:` ...）でお願いします。

## Star History

<a href="https://www.star-history.com/?type=date&repos=jerrywu001/cc-sessions-viewer">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=jerrywu001/cc-sessions-viewer&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=jerrywu001/cc-sessions-viewer&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=jerrywu001/cc-sessions-viewer&type=date&legend=top-left" />
 </picture>
</a>

## スポンサー支援
このプロジェクトは限られた個人の時間で維持しています。スポンサー支援は継続的な開発、バグ修正、ドキュメント整備に充てます。

- 🛠️ 継続的な開発とアップデート

- 🐛 迅速なバグ修正と問題解決

- 📚 ドキュメントの改善とサンプルの拡充

カスタム対応や特別な要件は、下記のスポンサー支援窓口からご相談ください。50 米ドルから承りますが、対応可否はその時点の状況によります。

### 支援方法：

- GitHub Sponsors
  
[GitHub Sponsors](https://github.com/sponsors/jerrywu001)（推奨 · 手数料無料）

- Alipay / WeChat
  
<table style="display: flex; width: 500px;">
  <tr>
    <td style="margin-right: 16px;">
      <img style="width: 150px;" src="https://www.js-bridge.com/alipay.jpg" />
    </td>
    <td style="margin-right: 16px;">
      <img style="width: 150px;" src="https://www.js-bridge.com/wechat.jpg" />
    </td>
  </tr>
</table>

## ライセンス

[MIT](LICENSE) © jerrywu001 · [@jerrywu185](https://x.com/jerrywu185)
