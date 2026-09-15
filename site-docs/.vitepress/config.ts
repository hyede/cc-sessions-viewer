import { defineConfig } from 'vitepress'
import { shared } from './config/shared'
import { en } from './config/en'
import { zh } from './config/zh'
import { ja } from './config/ja'

// 英文占根目录，另外两种语言各占一级子目录（/zh/、/ja/）—— VitePress i18n 的约定布局，
// 语言切换器据此自动生成对应链接。三份目录结构必须严格同构，缺一页切过去就是 404。
export default defineConfig({
  ...shared,
  locales: {
    root: { ...en },
    zh: { ...zh },
    ja: { ...ja },
  },
})
