// 默认主题 + 一份配色覆盖。目前没有自定义组件，等 agents / features 那几页
// 需要「按平台给下载按钮」之类的交互时再往 components/ 里加。
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './style.css'

export default {
  extends: DefaultTheme,
} satisfies Theme
