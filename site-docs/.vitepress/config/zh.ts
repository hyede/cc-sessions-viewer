import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import { LATEST_RELEASE, REPO } from './shared'

type Locale = LocaleSpecificConfig<DefaultTheme.Config> & { label: string; link?: string }

export const zh: Locale = {
  label: '简体中文',
  lang: 'zh-CN',
  description:
    '一个桌面应用，把 Claude Code、Codex、Grok Build、Kimi Code、Pi、Antigravity CLI、opencode 的本地会话记录读进同一个界面，可阅读、可搜索、可恢复。',
  themeConfig: {
    nav: [
      { text: '指南', link: '/zh/guide/', activeMatch: '/zh/guide/' },
      { text: '功能', link: '/zh/features/read-and-search', activeMatch: '/zh/features/' },
      { text: 'Agents', link: '/zh/agents/', activeMatch: '/zh/agents/' },
      { text: '工具管理', link: '/zh/tools/', activeMatch: '/zh/tools/' },
      { text: '下载', link: LATEST_RELEASE },
    ],
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '项目定位', link: '/zh/guide/' },
          { text: '安装', link: '/zh/guide/install' },
        ],
      },
      {
        text: '功能',
        items: [
          { text: '阅读与搜索', link: '/zh/features/read-and-search' },
          { text: '恢复与继续', link: '/zh/features/resume' },
          { text: '分屏、标签与 git diff', link: '/zh/features/panes' },
          { text: 'Token 与成本统计', link: '/zh/features/stats' },
          { text: '导出与回收站', link: '/zh/features/export-and-trash' },
          { text: '键盘快捷键', link: '/zh/features/shortcuts' },
          { text: 'Skills 管理', link: '/zh/tools/#skills' },
          { text: 'Skills 发现', link: '/zh/tools/#discover' },
          { text: 'MCP 管理', link: '/zh/tools/#mcp' },
          { text: 'Hooks 管理', link: '/zh/tools/#hooks' },
        ],
      },
      {
        text: '工具管理',
        items: [{ text: '总览', link: '/zh/tools/' }],
      },
      {
        text: 'Agents 存储位置',
        items: [
          { text: '七种对照', link: '/zh/agents/' },
          { text: 'Claude Code', link: '/zh/agents/claude-code' },
          { text: 'Codex', link: '/zh/agents/codex' },
          { text: 'Grok Build', link: '/zh/agents/grok-build' },
          { text: 'Kimi Code', link: '/zh/agents/kimi-code' },
          { text: 'Pi', link: '/zh/agents/pi' },
          { text: 'Antigravity CLI', link: '/zh/agents/antigravity-cli' },
          { text: 'opencode', link: '/zh/agents/opencode' },
        ],
      },
    ],
    outline: { level: [2, 3], label: '本页目录' },
    editLink: {
      pattern: `${REPO}/edit/main/site-docs/:path`,
      text: '在 GitHub 上编辑此页',
    },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    langMenuLabel: '切换语言',
    footer: {
      message: '基于 MIT 许可证发布。',
      copyright: `Copyright © 2025-present <a href="${REPO}">Sessions Viewer</a>`,
    },
  },
}
