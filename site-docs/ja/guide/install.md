---
title: macOS / Windows / Linux にインストールする
description: macOS、Windows、Linux 向けの Sessions Viewer インストーラをダウンロードし、未署名の macOS ビルドが初回起動時に出す Gatekeeper の警告を通す方法。
---

# macOS / Windows / Linux にインストールする

[リリースページ](https://github.com/jerrywu001/cc-sessions-viewer/releases)からプラットフォームに合ったインストーラをダウンロードします：

| プラットフォーム | ファイル |
| --- | --- |
| macOS (Apple Silicon + Intel) | `.dmg` |
| Windows x64 | `-setup.exe` / `.msi` |
| Linux x86_64 | `.deb` / `.AppImage` |

## macOS: Gatekeeper を通す

> [!IMPORTANT]
> macOS 版は ad-hoc 署名のみで公証（notarization）を受けていないため、初回起動時に Gatekeeper が「"Sessions Viewer"は開けません。Apple は、悪質なソフトウェアが含まれていないことを確認できませんでした」と表示してブロックします。署名なしのオープンソースビルドでは正常な表示で、異常があるわけではありません。

### macOS 15 Sequoia 以降

Sequoia で Apple は右クリック →「開く」による回避を廃止したので、システム設定から許可します：

1. アプリをダブルクリックし、警告を閉じます。
2. **システム設定 → プライバシーとセキュリティ** を開き、一番下までスクロールします。
3. 「"Sessions Viewer"がブロックされました」の横の **このまま開く** をクリックし、認証します。
4. もう一度アプリを起動し、**開く** をクリックします。

### macOS 14 Sonoma 以前

Finder でアプリを右クリック（または Control クリック）し、**開く** を選び、ダイアログで再度 **開く** をクリックします。初回のみで十分です。

### どのバージョンでも、ターミナルから

```bash
xattr -dr com.apple.quarantine "/Applications/Sessions Viewer.app"
```

`Operation not permitted` と出る場合は `sudo` を付けてください。

## Linux

`.AppImage` はポータブル形式です。`chmod +x` を付けて起動してください。`.deb` は次のコマンドでインストールします：

```bash
sudo apt install ./cc-sessions-viewer_<ver>_amd64.deb
```
