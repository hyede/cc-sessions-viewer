// 站点级配置：所有语言共用的部分。语言相关的 nav / sidebar 在 en.ts / zh.ts / ja.ts。
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vitepress'
import type { HeadConfig, PageData, SiteConfig } from 'vitepress'

export const REPO = 'https://github.com/jerrywu001/cc-sessions-viewer'
export const RELEASES = `${REPO}/releases`
export const LATEST_RELEASE = `${REPO}/releases/latest`

const SITE_TITLE = 'Sessions Viewer'
const DEFAULT_IMAGE = '/screenshots/cover.png'
const PUBLIC_DIR = new URL('../../public/', import.meta.url).pathname

/**
 * 站点的对外地址。canonical、hreflang、og:url、JSON-LD 的 @id、sitemap 以及 robots.txt
 * 里的 Sitemap 行都靠它拼绝对地址。
 *
 * 写死成生产域名，而不是从 Vercel 的 `VERCEL_PROJECT_PRODUCTION_URL` 推导：canonical 的
 * 语义就是「这份内容唯一的正式地址」，本地构建、预览部署、生产构建都必须指向同一个值。
 * 让它跟着构建环境走，预览部署就会把自己的临时域名当成规范地址发给搜索引擎。
 * 换域名或者临时在别处构建，设 `SITE_URL` 覆盖即可。
 */
export const SITE_URL = (process.env.SITE_URL ?? 'https://sessions-viewer.js-bridge.com').replace(/\/$/, '')

const APP_VERSION: string | undefined = (() => {
  try {
    return JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).version
  } catch {
    return undefined
  }
})()

const abs = (path: string) => `${SITE_URL}${path}`

/** `guide/install.md` → `/guide/install`；`zh/index.md` → `/zh/`。和 cleanUrls 的产物一致。 */
const pathOf = (relativePath: string) =>
  '/' + relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')

/** 页面属于哪个 locale（config.ts 里的 key），以及去掉语言前缀后的路径。 */
function localeOf(relativePath: string, site: SiteConfig['site']) {
  const [head] = relativePath.split('/')
  const key = head !== 'root' && head in site.locales && head !== relativePath ? head : 'root'
  const prefix = key === 'root' ? '' : `${key}/`
  return { key, prefix, base: relativePath.slice(prefix.length) }
}

/**
 * 读 PNG 的像素尺寸，只解 IHDR，不引依赖。
 *
 * 用处是给每张截图写上 width/height：浏览器据此在图片下载完之前就把位置留出来，
 * 避免 Cumulative Layout Shift。CLS 是 Core Web Vitals 三项之一，直接算进排名。
 */
const sizeCache = new Map<string, { w: number; h: number } | null>()
function pngSize(file: string) {
  if (sizeCache.has(file)) return sizeCache.get(file)!
  let out: { w: number; h: number } | null = null
  try {
    const buf = readFileSync(file)
    // 8 字节签名 + 4 长度 + 4 "IHDR"，之后是 4 宽 4 高，大端。
    if (buf.length >= 24 && buf.toString('ascii', 12, 16) === 'IHDR') {
      out = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
    }
  } catch {
    out = null
  }
  sizeCache.set(file, out)
  return out
}

/** 与 VitePress 客户端 createTitle 相同的规则，用来算 og:title。 */
function fullTitle(page: PageData) {
  const title = page.title || SITE_TITLE
  const template = page.titleTemplate
  if (typeof template === 'string' && template.includes(':title')) return template.replace(/:title/g, title)
  if (template === false) return title
  if (template === true || template === undefined) return title === SITE_TITLE ? title : `${title} | ${SITE_TITLE}`
  if (template === SITE_TITLE) return title
  return `${title} | ${template}`
}

/** 从该 locale 的顶部导航里找到当前分区的显示名，给面包屑用。 */
function sectionLabel(site: SiteConfig['site'], key: string, prefix: string, section: string) {
  const nav = (site.locales[key]?.themeConfig?.nav ?? site.themeConfig?.nav ?? []) as Array<{
    text?: string
    link?: string
  }>
  const target = `/${prefix}${section}/`
  return nav.find((item) => item.link?.startsWith(target))?.text
}

/**
 * keywords。Google 从 2009 年起就完全忽略这个标签，留着是给 Baidu / Yandex 用的，
 * 所以按页给一组真实相关的词就行，堆词反而会被这些引擎当作作弊信号。
 */
const PAGE_KEYWORDS: Record<string, string[]> = {
  'index.md': ['sessions viewer', 'coding agent session history', 'claude code session viewer', 'codex session viewer'],
  'guide/index.md': ['claude code history app', 'codex history app', 'session transcript viewer'],
  'guide/install.md': ['sessions viewer download', 'macos gatekeeper unsigned app', 'tauri app install'],
  'features/read-and-search.md': ['read claude code transcript', 'search agent sessions', 'jsonl transcript viewer'],
  'features/resume.md': ['claude --resume', 'codex resume', 'resume coding agent session', 'cmux iterm ghostty warp'],
  'features/panes.md': ['split panes', 'git diff beside session', 'session tabs'],
  'features/stats.md': ['claude code token usage', 'codex cost tracking', 'models.dev pricing', 'ai coding cost'],
  'features/export-and-trash.md': ['export claude code session', 'session to markdown html json', 'session trash restore'],
  'features/shortcuts.md': ['sessions viewer shortcuts', 'keyboard shortcuts'],
  'tools/index.md': ['claude code skills', 'mcp server manager', 'claude code hooks', 'agents.md claude.md'],
  'agents/index.md': ['where coding agents store sessions', 'session history location', 'jsonl transcript path'],
  'agents/claude-code.md': ['~/.claude/projects', 'claude code session files', 'claude code jsonl', 'structuredPatch'],
  'agents/codex.md': ['~/.codex/sessions', 'codex rollout jsonl', 'codex session files'],
  'agents/grok-build.md': ['GROK_HOME', 'grok build sessions', 'updates.jsonl'],
  'agents/kimi-code.md': ['KIMI_CODE_HOME', 'kimi code sessions', 'wire.jsonl'],
  'agents/pi.md': ['PI_CODING_AGENT_DIR', 'pi agent sessions', 'pi coding agent'],
  'agents/antigravity-cli.md': ['antigravity cli', 'agy transcript.jsonl', 'gemini antigravity brain'],
  'agents/opencode.md': ['opencode.db', 'opencode sqlite', 'opencode session database'],
}

const LOCALE_KEYWORDS: Record<string, string[]> = {
  root: ['claude code', 'codex', 'opencode', 'session history', 'open source'],
  zh: ['会话记录', '会话查看器', '聊天记录导出', 'token 统计', '开源工具'],
  ja: ['セッション履歴', 'セッションビューア', 'トークン統計', 'オープンソース'],
}

function keywordsFor(base: string, key: string) {
  const terms = [...(PAGE_KEYWORDS[base] ?? []), ...(LOCALE_KEYWORDS[key] ?? [])]
  return [...new Set(terms)].slice(0, 12).join(', ')
}

/** 每页出现的截图，给 sitemap 的 image 扩展用（Google 图片搜索按这个收录）。 */
const pageImages = new Map<string, Array<{ url: string; title: string }>>()

/** sitemap 里 url 的写法：`agents/codex`、`guide/`。和 VitePress 内部算法保持一致。 */
const sitemapKey = (relativePath: string) =>
  relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')

/**
 * 每页的 SEO head：canonical、robots、keywords、Open Graph、Twitter 卡片、
 * 三语 hreflang、JSON-LD 图谱。
 *
 * 在 transformPageData 里做而不是写死在 head 里，是因为这些标签每页都不同，而且
 * hreflang 只能指向真实存在的对应语言页 —— 这里按 siteConfig.pages 逐个核对。
 */
function seoHead(page: PageData, siteConfig: SiteConfig): HeadConfig[] {
  const site = siteConfig.site
  const { key, prefix, base } = localeOf(page.relativePath, site)
  const locale = site.locales[key] ?? {}
  const lang = locale.lang ?? site.lang ?? 'en-US'
  const url = abs(pathOf(page.relativePath))
  const isHome = page.frontmatter.layout === 'home'
  const title = fullTitle(page)
  const description = page.description || locale.description || site.description
  const imagePath: string = page.frontmatter.image ?? DEFAULT_IMAGE
  const image = abs(imagePath)
  const imageDim = pngSize(join(PUBLIC_DIR, imagePath))

  // 收集正文里的截图，供 sitemap 的 image 扩展使用。
  try {
    const src = readFileSync(join(siteConfig.srcDir, page.relativePath), 'utf8')
    const found = [...src.matchAll(/!\[([^\]]*)\]\((\/[^)\s]+)\)/g)].map((m) => ({
      url: abs(m[2]),
      title: m[1],
    }))
    if (found.length) pageImages.set(sitemapKey(page.relativePath), found)
  } catch {
    /* 页面没有对应的源文件就跳过 */
  }

  const head: HeadConfig[] = [
    // 让 Google 在结果里用大图预览、不裁剪摘要。默认是小图 + 截断。
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' }],
    ['meta', { name: 'keywords', content: keywordsFor(base, key) }],
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:type', content: isHome ? 'website' : 'article' }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:locale', content: lang.replace('-', '_') }],
    ['meta', { property: 'og:image', content: image }],
    ['meta', { property: 'og:image:alt', content: title }],
    ['meta', { property: 'og:image:type', content: 'image/png' }],
    ['meta', { name: 'twitter:title', content: title }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: image }],
    ['meta', { name: 'twitter:image:alt', content: title }],
  ]
  if (imageDim) {
    head.push(
      ['meta', { property: 'og:image:width', content: String(imageDim.w) }],
      ['meta', { property: 'og:image:height', content: String(imageDim.h) }],
    )
  }

  // 同一页的其它语言版本。root 是 x-default，也就是没有匹配语言时的默认落点。
  const alternates = Object.entries(site.locales).flatMap(([k, l]) => {
    const p = k === 'root' ? '' : `${k}/`
    const rel = `${p}${base}`
    if (!l.lang || !siteConfig.pages.includes(rel)) return []
    return [{ key: k, lang: l.lang, path: pathOf(rel) }]
  })
  for (const alt of alternates) {
    if (alt.key !== key) head.push(['meta', { property: 'og:locale:alternate', content: alt.lang.replace('-', '_') }])
  }
  if (alternates.length > 1) {
    for (const alt of alternates) head.push(['link', { rel: 'alternate', hreflang: alt.lang, href: abs(alt.path) }])
    const root = alternates.find((a) => a.key === 'root')
    if (root) head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: abs(root.path) }])
  }

  const modified = page.lastUpdated ? new Date(page.lastUpdated).toISOString() : undefined
  if (!isHome && modified) head.push(['meta', { property: 'article:modified_time', content: modified }])

  // 一份 @graph，实体之间用 @id 互相指，搜索引擎才能把「这个站」「这个应用」
  // 「这一页」拼成同一个东西，而不是三份互不相干的标记。
  const siteId = `${SITE_URL}/#website`
  const orgId = `${SITE_URL}/#organization`
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': orgId,
      name: SITE_TITLE,
      url: SITE_URL,
      logo: abs('/logo.png'),
      sameAs: [REPO],
    },
    {
      '@type': 'WebSite',
      '@id': siteId,
      url: SITE_URL,
      name: SITE_TITLE,
      description: site.locales.root?.description ?? site.description,
      inLanguage: Object.values(site.locales)
        .map((l) => l.lang)
        .filter(Boolean),
      publisher: { '@id': orgId },
    },
  ]

  if (isHome) {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_TITLE,
      url,
      description,
      inLanguage: lang,
      image,
      screenshot: image,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'macOS, Windows, Linux',
      ...(APP_VERSION ? { softwareVersion: APP_VERSION } : {}),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      license: 'https://opensource.org/licenses/MIT',
      downloadUrl: LATEST_RELEASE,
      softwareHelp: { '@type': 'CreativeWork', url: abs(`/${prefix}guide/`) },
      publisher: { '@id': orgId },
      isPartOf: { '@id': siteId },
      sameAs: [REPO],
      featureList: [
        'Read Claude Code, Codex, Grok Build, Kimi Code, Pi, Antigravity CLI and opencode session transcripts',
        'Search every project at once',
        'Resume a session in a terminal or in-app chat',
        'Token and cost statistics priced from models.dev',
        'Export sessions as Markdown, HTML or JSON',
        'Manage skills, MCP servers and hooks',
      ],
    })
  } else {
    const segments = base.replace(/\.md$/, '').split('/')
    const section = segments[0]
    const crumbs: Array<{ name: string; item: string }> = [{ name: SITE_TITLE, item: abs(`/${prefix}`) }]
    const label = sectionLabel(site, key, prefix, section)
    if (segments.length > 1 && segments[1] !== 'index' && label) {
      crumbs.push({ name: label, item: abs(`/${prefix}${section}/`) })
    }
    crumbs.push({ name: page.title, item: url })
    graph.push(
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
      },
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        headline: page.title,
        description,
        inLanguage: lang,
        url,
        image,
        ...(modified ? { dateModified: modified } : {}),
        author: { '@id': orgId },
        publisher: { '@id': orgId },
        isPartOf: { '@id': siteId },
        mainEntityOfPage: url,
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
    )
  }
  head.push(['script', { type: 'application/ld+json' }, JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })])
  return head
}

export const shared = defineConfig({
  // 站点名。不设的话 VitePress 会拿默认的 "VitePress" 去填每一页的 titleTemplate，
  // 首页因为自带 titleTemplate 看不出来，内页会直接显示成「Installation | VitePress」。
  title: SITE_TITLE,

  // 部署在域名根目录，不需要子路径前缀。
  base: '/',
  cleanUrls: true,
  lastUpdated: true,
  // 每页的 meta 单独成 chunk，切页时不用重新解析整份 app chunk。
  metaChunk: true,

  sitemap: {
    hostname: SITE_URL,
    transformItems: (items) =>
      items.map((item) => {
        const links = item.links as Array<{ lang: string; url: string }> | undefined
        // VitePress 已经按 locale 分组给每条 url 加了 hreflang 的 links，这里补 x-default
        //（指向英文版），让搜索引擎在没有匹配语言时有一个明确的落点。
        const root = links?.find((l) => l.lang === 'en-US')
        const withDefault =
          root && !links!.some((l) => l.lang === 'x-default')
            ? [...links!, { lang: 'x-default', url: root.url }]
            : links
        const img = pageImages.get(item.url)
        return { ...item, ...(withDefault ? { links: withDefault } : {}), ...(img ? { img } : {}) }
      }),
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#c2410c' }],
    ['meta', { property: 'og:site_name', content: SITE_TITLE }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    // Google Search Console 的所有权验证。这里用 HTML 标记而不是 DNS TXT，是因为
    // sessions-viewer.js-bridge.com 是一条指向 Vercel 的 CNAME，而按 DNS 规范，
    // 有 CNAME 的名字上不能再挂任何其他记录，令牌无处安放。删掉这行会掉验证。
    ['meta', { name: 'google-site-verification', content: '2HHzsv3xGJJTgjJ8Nz2XOi4X_6SgZK_giYNv9jeos1E' }],
  ],

  transformPageData(pageData, { siteConfig }) {
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(...seoHead(pageData, siteConfig))
  },

  buildEnd(siteConfig) {
    writeFileSync(
      join(siteConfig.outDir, 'robots.txt'),
      ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`].join('\n') + '\n',
    )
  },

  markdown: {
    lineNumbers: true,
    // 代码块里的路径和命令经常要逐行对，行号比复制按钮有用。

    config(md) {
      // 给每张截图补 width/height/loading/decoding。
      // width+height 让浏览器提前留出版面，消掉 CLS；首图 eager+high 优先级是 LCP，
      // 其余 lazy，页面初次渲染就不用等十几张截图。
      const renderImage = md.renderer.rules.image
      if (!renderImage) return
      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const src = token.attrGet('src')
        if (src?.startsWith('/')) {
          const dim = pngSize(join(PUBLIC_DIR, src))
          if (dim) {
            token.attrSet('width', String(dim.w))
            token.attrSet('height', String(dim.h))
          }
          const seen = (env.__imgIndex = (env.__imgIndex ?? 0) + 1) as number
          token.attrSet('decoding', 'async')
          if (seen === 1) token.attrSet('fetchpriority', 'high')
          else token.attrSet('loading', 'lazy')
        }
        return renderImage(tokens, idx, options, env, self)
      }
    },
  },

  themeConfig: {
    logo: '/logo.png',
    socialLinks: [{ icon: 'github', link: REPO }],
    search: { provider: 'local' },
  },
})
