# macOS 12 兼容性修改说明

> 目标机器：**macOS 12.7.6（Darwin 21.6.0，Intel x86_64）**
> 现象：`npm run tauri dev` / 安装包打开后**整页白屏**，无任何可见报错。

## 一、根本原因

Tauri 应用的界面由**系统自带的 WKWebView** 渲染。macOS 12 的 WKWebView 内核是
**Safari 15.6**，它无法解析部分较新的 JS 语法。只要**启动路径**上任意一个模块含有
它不认识的语法，就会在解析期抛出 `SyntaxError`，导致 Vue 根组件根本没被挂载 →
`#app` 为空 → 白屏，且错误不会出现在终端里。

定位到的两类不兼容点：

| 类型 | 位置 | 能否被 esbuild 自动降级 |
| --- | --- | --- |
| 正则 **lookbehind** `(?<=…)` / `(?<!…)`（Safari 16.4+ 才支持） | `src/format.ts`（本项目源码） | ❌ 不能，必须改写源码 |
| 其它较新语法（类静态块、逻辑赋值等） | 依赖包（如 `@antv/g2`） | ✅ 能，构建目标降到 safari15 即可 |
| 正则 lookbehind | `mermaid` 依赖包内部 | ❌ 不能，只能优雅降级 |
| CSS **`color-mix()`**（Safari 16.2+ 才支持） | `src/style.css`（本项目源码） | ❌ 不能，且无法在构建期预计算，必须改写源码 |

`src/format.ts` 是 `App.vue` 直接静态依赖（`import { shortName } from './format'`），
所以它里面的 lookbehind 正则是**白屏的首要元凶**。

> `color-mix()` 不导致白屏（不在 JS 启动路径上），但会导致**局部渲染错误**：在本机
> 上 `color-mix(in srgb, var(--text) N%, transparent)` 会被渲染成**纯 `var(--text)`
> 实心色**（实测，而非按预期回退成透明）。凡是同时写了这种背景又写了 `color:
> var(--text)` 的元素，就变成「深底 + 深字」（亮色主题）或「亮底 + 亮字」（暗色主题）
> 的看不清文字的色块——设置页选中项的黑块就是这么来的。

## 二、具体修改（共 3 个文件）

### 1. `src/format.ts` —— 改写两处 lookbehind 正则

把 lookbehind 改成「前置捕获组 + 回写」的等价写法（lookahead `(?!…)` Safari 15 支持，保留不动）：

```diff
-  s = s.replace(/(?<!\\)\\\(([^\n]+?)\\\)/g, (_m, expr) => {
+  s = s.replace(/(^|[^\\])\\\(([^\n]+?)\\\)/g, (_m, pre, expr) => {
     const idx = codes.push(`MATH:${expr}`) - 1
-    return `${SENT}CODE${idx}${SENT}`
+    return `${pre}${SENT}CODE${idx}${SENT}`
   })
```

```diff
-  s = s.replace(/(?<![*\\])\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
+  s = s.replace(/(^|[^*\\])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
```

原理：`(?<!X)` 表示「前一个字符不是 X」，用 `(^|[^X])` 显式捕获「行首或一个非 X 字符」
再原样回写（`${pre}` / `$1`）即可达到相同效果，且不依赖 lookbehind。

已用 node 逐一比对两种写法的边界行为（转义 `\*`、被 `\\(` 屏蔽等），输出完全一致；
`test/format.test.ts` 121 项全部通过。

### 2. `vite.config.ts` —— 把构建目标降到 `safari15`

```diff
     },
   },
+  // macOS 12 自带 WebKit 是 Safari 15.6，解析不了依赖里较新的 JS 语法（类静态块、
+  // 逻辑赋值等），会整页白屏。把 dev 预打包 / 生产构建的目标降到 safari15，让 esbuild
+  // 把可降级语法转掉。注意：正则 lookbehind 无法被 esbuild 转写，那类代码需在源码里
+  // 手动规避（见 src/format.ts）。
+  esbuild: { target: "safari15" },
+  optimizeDeps: { esbuildOptions: { target: "safari15" } },
+  build: { target: "safari15" },
   };
 });
```

三个 target 的分工：

- `optimizeDeps.esbuildOptions.target` —— dev 模式下预打包依赖时降级（含懒加载依赖）。
- `esbuild.target` —— 源码（`.ts`/`.vue`）转换时的目标。
- `build.target` —— `tauri build` 生产构建产物的目标。

设置后，`@antv/g2`（StatsView 统计图表）等依赖能被成功降级解析并正常工作。

### 3. `src/style.css` —— 把会「变黑块」的 `color-mix()` 背景换成实心 token

`color-mix()` 无法在构建期降级（Lightning CSS/PostCSS 算不出「运行时 CSS 变量」的
混合结果），必须在源码里规避。本机上它被渲染成纯 `var(--text)` 实心色，所以**只需要
处理「背景用了 `color-mix(... var(--text) ...)`、同时又有文字」的元素**——其余
`color-mix()`（滚动条、边框、遮罩等纯装饰、不压文字）保持不动。

用主题自带的实心 token 等价替换（`--surface-active` ≈ 8% 混合，`--surface-hover`
≈ 4% 混合，两者在各主题里都有明暗自适应的实心值）：

```diff
 .set-nav-item:hover {
-  background: color-mix(in srgb, var(--text) 4%, transparent);
+  background: var(--surface-hover);
   color: var(--text);
 }
 .set-nav-item.active {
-  background: color-mix(in srgb, var(--text) 8%, transparent);
+  background: var(--surface-active);
   color: var(--text);
   font-weight: 600;
 }
```

同样处理的还有三处同类模式：

- `.bubble code`（聊天里的内联代码）：`color-mix(... 8% ...)` → `var(--surface-active)`，
  否则内联代码变成黑底黑字看不清。
- `.theme-dark .seg-wide button.active`、`.theme-dark .segmented button.active`
  （暗色主题下的分段控件选中态）：`color-mix(... 8% ...)` → `var(--surface-active)`，
  否则选中项在暗色下变成亮底亮字。

## 三、已知限制：mermaid 图

`mermaid` 库自身的 ESM 产物里用了正则 lookbehind，**无法被 esbuild 转写**，所以在
macOS 12 上无法渲染。但它是**懒加载**，且 `src/mermaid.ts::renderAllMermaid` 本来就
`try/catch` 了导入/渲染失败，会显示：

> Mermaid diagram could not be rendered.

因此**不影响 app 启动和其它功能**，只是 mermaid 图块显示为上述提示。若要让 mermaid
也能渲染，只能升级到 **macOS 13+（Safari 16.4+）**，或替换/patch 该库（代价较大）。

## 四、验证

- 真机 WebKit（Playwright 缓存的 Safari 15 内核）逐模块探测：`App.vue` ✅、
  `@antv/g2` ✅、`#app` 已挂载子节点（Vue 正常渲染）；`mermaid` 仍失败（预期，已降级）。
- `npm run test:run`：改动相关测试全过（唯一 1 个失败在**未改动的原始代码上同样失败**，
  是 renderText 缓存的跨文件测试隔离问题，与本次改动无关）。
- `npm run build`：`vue-tsc` 类型检查 + 生产构建通过。

## 五、打包（本机安装包）

```bash
npm run tauri build -- --config '{"bundle":{"createUpdaterArtifacts":false}}'
```

- 关闭 `createUpdaterArtifacts`：原配置为 `true`，会要求 minisign 私钥
  （`TAURI_SIGNING_PRIVATE_KEY`）对更新产物签名，本地打包没有该 key 会导致构建失败。
  本机自用不需要自动更新产物。
- 产物：
  - `src-tauri/target/release/bundle/dmg/Sessions Viewer_0.5.2_x64.dmg`
  - `src-tauri/target/release/bundle/macos/Sessions Viewer.app`
- 该包为**临时签名（ad-hoc）、未公证**。首次打开若被 Gatekeeper 拦截，
  右键 App → **打开**，或在「系统设置 → 隐私与安全性」点**仍要打开**。

## 六、修改后完整代码

### `src/format.ts`（`inline()` 函数内相关片段）

```ts
  // 行内数学 $...$ / \(...\) → 占位（保护内容不被后续 pass 误改）。
  // Claude / ChatGPT 常用 \(...\)，而 $...$ 则是 Markdown 社区更常见的写法。
  s = s.replace(/\$([^\$\n]+?)\$/g, (_m, expr) => {
    const idx = codes.push(`MATH:${expr}`) - 1
    return `${SENT}CODE${idx}${SENT}`
  })
  // 【macOS 12 兼容】避免正则 lookbehind：用 (^|[^\\]) 捕获前置字符并回写。
  s = s.replace(/(^|[^\\])\\\(([^\n]+?)\\\)/g, (_m, pre, expr) => {
    const idx = codes.push(`MATH:${expr}`) - 1
    return `${pre}${SENT}CODE${idx}${SENT}`
  })
```

```ts
  s = escapeHtml(s)
  s = s.replace(URL_RE, (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`)
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  // 【macOS 12 兼容】避免正则 lookbehind：用 (^|[^*\\]) 捕获前置字符并回写 $1。
  s = s.replace(/(^|[^*\\])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
```

> 说明：以上仅为改动所在的上下文片段，`format.ts` 其余代码保持不变。

### `vite.config.ts`（`defineConfig` 返回对象结尾部分）

```ts
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: [
        "**/src-tauri/**",
        "**/.claude/worktrees/**",
        "**/.claude-worktrees/**",
      ],
    },
  },
  // macOS 12 自带 WebKit 是 Safari 15.6，解析不了依赖里较新的 JS 语法（类静态块、
  // 逻辑赋值等），会整页白屏。把 dev 预打包 / 生产构建的目标降到 safari15，让 esbuild
  // 把可降级语法转掉。注意：正则 lookbehind 无法被 esbuild 转写，那类代码需在源码里
  // 手动规避（见 src/format.ts）。
  esbuild: { target: "safari15" },
  optimizeDeps: { esbuildOptions: { target: "safari15" } },
  build: { target: "safari15" },
  };
});
```

## 附：如何排查这类白屏

macOS 12 的 webview 控制台在命令行里看不到。排查手段：

1. 在 `index.html` 临时注入 `window.onerror` / `unhandledrejection` 信标：
   `new Image().src = "/__vwerr__?m=" + encodeURIComponent(msg)`。
2. 在 `vite.config.ts` 临时加一个 dev 中间件监听 `/__vwerr__`，把消息 `console.log`
   出来（会打到 `npm run tauri dev` 的终端输出里）。
3. 用 `type="module"` 脚本逐个 `await import(...)` 探测，定位到具体报错模块。
4. 排查完**移除所有临时代码**。
