// 构建后校验站内跨页锚点。
//
// VitePress 自己的 dead-link 检查**只管页面存在不存在，不管 `#fragment`**。中日文标题上
// 这会静默出事：slugger 生成 id 时做 NFKD 分解，日文的浊音字符（デ = テ + U+3099）被拆成
// 两个码位，而手写的锚点是 NFC 的单码位。两个字符串肉眼一模一样，浏览器按精确匹配比对
// fragment，于是链接点了不跳，还不报任何错。
//
// 对策是给被链接的标题显式写 `{#ascii-id}`，这个脚本负责保证没人再漏。
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../.vitepress/dist')
const files = globSync('**/*.html', { cwd: dist })

const idsOf = new Map()
for (const rel of files) {
  const html = readFileSync(join(dist, rel), 'utf8')
  idsOf.set(rel, new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1])))
}

const resolveTarget = (path) => {
  const clean = path.replace(/^\//, '')
  for (const cand of [clean.endsWith('/') ? `${clean}index.html` : null, `${clean}.html`]) {
    if (cand && idsOf.has(cand)) return cand
  }
  return null
}

const bad = []
for (const rel of files) {
  const html = readFileSync(join(dist, rel), 'utf8')
  for (const [, href] of html.matchAll(/href="(\/[^"]*#[^"]*)"/g)) {
    const [path, frag] = [href.slice(0, href.indexOf('#')), decodeURIComponent(href.slice(href.indexOf('#') + 1))]
    const target = resolveTarget(path)
    if (!target) bad.push(`${rel} → ${href}  (目标页不存在)`)
    else if (frag && !idsOf.get(target).has(frag)) bad.push(`${rel} → ${href}  (锚点不存在)`)
  }
}

if (bad.length) {
  console.error(`[check-anchors] ${bad.length} 条失效链接：`)
  for (const line of bad) console.error(`  ✗ ${line}`)
  process.exit(1)
}
console.log(`[check-anchors] ${files.length} 个页面的跨页锚点全部有效`)
