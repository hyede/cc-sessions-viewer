// 把仓库根的 docs/screenshots 同步进 site-docs/public/screenshots。
//
// 截图只有一份源：docs/screenshots/。三份 README 的 <img src="docs/screenshots/…">
// 都指着它，站点再复制一份进 git 就成了两个会各自漂移的副本。所以这里在 dev / build
// 前拷一次，拷出来的目录进 .gitignore —— 源永远只有一处。
//
// 用拷贝而不是软链：Vite 把 public/ 整个复制进 dist 时对符号链接目录的处理各版本不一，
// 拷贝没有这个不确定性，几十张图也就几百毫秒。
//
// 找不到源目录就**让构建失败**，不要跳过。跳过的代价是产出一个所有截图都 404 的站点，
// 而且构建还报成功 —— 这件事在 Vercel 上真实发生过一次：项目的 Root Directory 被设成了
// site-docs，于是这里解析出的 ../../docs/screenshots 落到了仓库外面。失败比静默出坏站好。
import { cp, readdir, rm, stat } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../../docs/screenshots')
const dest = resolve(here, '../public/screenshots')

// session.gif 是 3.4MB 的宣传动图，只有 my-articles/ 下的投稿文引用它，文档站一张页面
// 都没用到。不跳过的话它会进 public/ → 进 dist → 每次部署都传一遍。
const skip = new Set(['session.gif'])

const fail = (reason) => {
  console.error(`[sync-assets] ${reason}`)
  console.error(`[sync-assets] 期望的源目录: ${src}`)
  console.error(
    '[sync-assets] 如果这是 CI：本项目必须以**仓库根**为构建根目录，' +
      '因为截图在 docs/screenshots，而它在 site-docs 之外。' +
      'Vercel 请把 Project Settings 的 Root Directory 留空，由仓库根的 vercel.json 决定构建命令和输出目录。',
  )
  process.exit(1)
}

let entries
try {
  const info = await stat(src)
  if (!info.isDirectory()) fail('截图源不是一个目录')
  entries = await readdir(src)
} catch {
  fail('截图源目录不存在')
}

if (entries.length === 0) fail('截图源目录是空的')

await rm(dest, { recursive: true, force: true })
await cp(src, dest, { recursive: true, filter: (from) => !skip.has(basename(from)) })
const copied = entries.filter((name) => !skip.has(name)).length
console.log(`[sync-assets] docs/screenshots → public/screenshots（${copied} 个文件）`)
