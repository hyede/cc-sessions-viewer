import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { LATEST_RELEASE, REPO } from './shared'

type Locale = LocaleSpecificConfig<DefaultTheme.Config> & { label: string; link?: string }

export const ja: Locale = {
  label: '日本語',
  lang: 'ja-JP',
  description:
    'Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode のローカルセッション記録をひとつの画面で読み、検索し、再開できるデスクトップアプリ。',
  themeConfig: {
    nav: [
      { text: 'ガイド', link: '/ja/guide/', activeMatch: '/ja/guide/' },
      { text: '機能', link: '/ja/features/read-and-search', activeMatch: '/ja/features/' },
      { text: 'Agents', link: '/ja/agents/', activeMatch: '/ja/agents/' },
      { text: 'ツール管理', link: '/ja/tools/', activeMatch: '/ja/tools/' },
      { text: 'ダウンロード', link: LATEST_RELEASE },
    ],
    sidebar: [
      {
        text: 'ガイド',
        items: [
          { text: '概要', link: '/ja/guide/' },
          { text: 'インストール', link: '/ja/guide/install' },
        ],
      },
      {
        text: '機能',
        items: [
          { text: '読む・検索する', link: '/ja/features/read-and-search' },
          { text: '再開と継続', link: '/ja/features/resume' },
          { text: 'ペイン・タブ・git diff', link: '/ja/features/panes' },
          { text: 'トークンとコスト', link: '/ja/features/stats' },
          { text: 'エクスポートとゴミ箱', link: '/ja/features/export-and-trash' },
          { text: 'ショートカット', link: '/ja/features/shortcuts' },
          { text: 'Skills の管理', link: '/ja/tools/#skills' },
          { text: 'Skill を探す', link: '/ja/tools/#discover' },
          { text: 'MCP の管理', link: '/ja/tools/#mcp' },
          { text: 'Hooks の管理', link: '/ja/tools/#hooks' },
        ],
      },
      {
        text: 'ツール管理',
        items: [{ text: '全体像', link: '/ja/tools/' }],
      },
      {
        text: 'セッションの保存場所',
        items: [
          { text: '7 つの比較', link: '/ja/agents/' },
          { text: 'Claude Code', link: '/ja/agents/claude-code' },
          { text: 'Codex', link: '/ja/agents/codex' },
          { text: 'Grok Build', link: '/ja/agents/grok-build' },
          { text: 'Kimi Code', link: '/ja/agents/kimi-code' },
          { text: 'Pi', link: '/ja/agents/pi' },
          { text: 'Antigravity CLI', link: '/ja/agents/antigravity-cli' },
          { text: 'opencode', link: '/ja/agents/opencode' },
        ],
      },
    ],
    outline: { level: [2, 3], label: 'このページの内容' },
    editLink: {
      pattern: `${REPO}/edit/main/site-docs/:path`,
      text: 'GitHub でこのページを編集',
    },
    docFooter: { prev: '前のページ', next: '次のページ' },
    lastUpdated: { text: '最終更新' },
    returnToTopLabel: 'トップへ戻る',
    darkModeSwitchLabel: '外観',
    sidebarMenuLabel: 'メニュー',
    langMenuLabel: '言語を切り替える',
    footer: {
      message: 'MIT ライセンスのもとで公開されています。',
      copyright: `Copyright © 2025-present <a href="${REPO}">Sessions Viewer</a>`,
    },
  },
}
