import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { LATEST_RELEASE, REPO } from './shared'

type Locale = LocaleSpecificConfig<DefaultTheme.Config> & { label: string; link?: string }

export const en: Locale = {
  label: 'English',
  lang: 'en-US',
  description:
    "Read, search and resume local session transcripts from Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode in one desktop app.",
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'Features', link: '/features/read-and-search', activeMatch: '/features/' },
      { text: 'Agents', link: '/agents/', activeMatch: '/agents/' },
      { text: 'Tool management', link: '/tools/', activeMatch: '/tools/' },
      { text: 'Download', link: LATEST_RELEASE },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'What it does', link: '/guide/' },
          { text: 'Installation', link: '/guide/install' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Reading and searching', link: '/features/read-and-search' },
          { text: 'Resuming sessions', link: '/features/resume' },
          { text: 'Panes, tabs and git diff', link: '/features/panes' },
          { text: 'Token and cost stats', link: '/features/stats' },
          { text: 'Export and trash', link: '/features/export-and-trash' },
          { text: 'Keyboard shortcuts', link: '/features/shortcuts' },
          { text: 'Skills management', link: '/tools/#skills' },
          { text: 'Discovering skills', link: '/tools/#discover' },
          { text: 'MCP servers', link: '/tools/#mcp' },
          { text: 'Hooks', link: '/tools/#hooks' },
        ],
      },
      {
        text: 'Tool management',
        items: [{ text: 'Overview', link: '/tools/' }],
      },
      {
        text: 'Where agents store sessions',
        items: [
          { text: 'All seven, compared', link: '/agents/' },
          { text: 'Claude Code', link: '/agents/claude-code' },
          { text: 'Codex', link: '/agents/codex' },
          { text: 'Grok Build', link: '/agents/grok-build' },
          { text: 'Kimi Code', link: '/agents/kimi-code' },
          { text: 'Pi', link: '/agents/pi' },
          { text: 'Antigravity CLI', link: '/agents/antigravity-cli' },
          { text: 'opencode', link: '/agents/opencode' },
        ],
      },
    ],
    outline: { level: [2, 3], label: 'On this page' },
    editLink: {
      pattern: `${REPO}/edit/main/site-docs/:path`,
      text: 'Edit this page on GitHub',
    },
    docFooter: { prev: 'Previous', next: 'Next' },
    lastUpdated: { text: 'Last updated' },
    returnToTopLabel: 'Back to top',
    darkModeSwitchLabel: 'Appearance',
    sidebarMenuLabel: 'Menu',
    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © 2025-present <a href="${REPO}">Sessions Viewer</a>`,
    },
  },
}
