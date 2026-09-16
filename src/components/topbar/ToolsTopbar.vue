<script setup lang="ts">
// 工具管理的顶栏：项目选择器 + 搜索框 + 关闭按钮。
//
// 工具管理不是弹框，是和统计 / 回收站同一档的主区视图，所以搜索框必须落在顶栏中列
// —— 和别的视图同一个位置，用户的眼睛不用换地方找。关闭按钮贴最右（顶栏第三列），
// 那儿平时是空的。
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { t } from '../../i18n'
import {
  effectiveToolsProject,
  setToolsProject,
  submitToolsSearch,
  tabAutoFocusesSearch,
  toolsBundleOpen,
  toolsPickedProject,
  toolsQuery,
  toolsTab,
  type ToolTab,
} from '../../toolsPanel'
import { shortName } from '../../format'
import { useDebouncedSearch } from '../../useDebouncedSearch'
import type { ProjectInfo } from '../../types'
import { IconArchive, IconCheck, IconChevronDown, IconClose, IconSearch } from '../icons'

const props = defineProps<{
  /** 可选的项目（当前 agent 的那一批，和侧边栏同一份）。 */
  projects: ProjectInfo[]
  /** 侧边栏当前选中的项目路径 —— 没显式挑过时就跟着它。 */
  sidebarCwd?: string
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

// ---------------------------------------------------------------------------
// 项目选择器
// ---------------------------------------------------------------------------
//
// 为什么顶栏非有这个不可：项目级的 skills / MCP / hooks 是拿「当前项目」的路径拼出来
// 的，而在这之前，「当前项目」只能从侧边栏的选中态来 —— 那个状态不落盘，重开 app
// 就没了，于是工具页只剩用户级，页面上却一个字都不解释。用户报的「安装版扫不出项目级」
// 就是这个。这里把它变成一个看得见、改得动、记得住的东西。

const projectMenuOpen = ref(false)
const projectWrapEl = ref<HTMLElement>()

/** 当前生效的项目路径（挑过的优先，否则跟着侧边栏）。 */
const currentProject = computed(() =>
  effectiveToolsProject(toolsPickedProject.value, props.sidebarCwd),
)

/** 按钮上的字。一个项目都没有时说清「只扫了用户级」，而不是显示一个空按钮。 */
const projectLabel = computed(() =>
  currentProject.value ? shortName(currentProject.value) : t('tools.project.none'),
)

/**
 * 下拉里的选项。生效的那个若不在列表里（换了 agent、或者项目已从列表消失）也补进去，
 * 否则菜单里没有一项是打勾的，看着像「谁都没选」，而实际上正扫着它。
 */
const projectOptions = computed(() => {
  const out = props.projects.filter((p) => p.exists).map((p) => p.displayPath)
  const cur = currentProject.value
  if (cur && !out.includes(cur)) out.unshift(cur)
  return out
})

function pickProject(path: string | null) {
  projectMenuOpen.value = false
  setToolsProject(path)
}

function onDocPointerDown(e: MouseEvent) {
  if (!projectMenuOpen.value) return
  if (projectWrapEl.value && !projectWrapEl.value.contains(e.target as Node)) {
    projectMenuOpen.value = false
  }
}

// 搜索防抖 + IME 组合保护：见 useDebouncedSearch 的注释。
// 切 tab 会把 toolsQuery 清空，watch(target) 会把这里的 draft 一并拉回来。
const {
  draft: searchDraft,
  commit: commitSearch,
  onInput: onSearchInput,
  onCompositionStart: onSearchCompStart,
  onCompositionEnd: onSearchCompEnd,
} = useDebouncedSearch(toolsQuery, 200)
const hasQuery = computed(() => searchDraft.value.length > 0)
// 四个面板搜的不是一类东西，placeholder 跟着 tab 走。
const placeholder = computed(() => t(`tools.search.${toolsTab.value}`))

// ⌘F / Ctrl+F：面板开着时接管系统 Find，聚焦搜索框并全选（和 TrashTopbar 同款）。
// 只检测当前平台对应的修饰键，避免 macOS 上 Ctrl+F（光标右移）被误抢。
const searchInput = ref<HTMLInputElement>()
const isMac = /Mac/i.test(navigator.platform)
function onFindShortcut(e: KeyboardEvent) {
  if (e.key !== 'f' && e.key !== 'F') return
  const want = isMac ? e.metaKey : e.ctrlKey
  const other = isMac ? e.ctrlKey : e.metaKey
  if (!want || other || e.shiftKey || e.altKey) return
  e.preventDefault()
  searchInput.value?.focus()
  searchInput.value?.select()
}
/**
 * 回车 = 立刻按当前输入搜。
 *
 * 本地那几个面板用不上（它们输入即过滤），「发现」面板的一次输入是一次 HTTP，
 * 防抖叠到 700 ms，知道要搜什么的人不该干等。顶栏只管说「用户提交了」，
 * **不知道也不需要知道**是谁在听、那边要干什么。
 */
function onSubmit() {
  commitSearch(searchDraft.value)
  submitToolsSearch()
}

/**
 * 进「发现」面板时把光标送进搜索框。
 *
 * 哪个 tab 要这个待遇由 `tabAutoFocusesSearch` 说了算，不写成 `=== 'discover'`：
 * 那条判断有理由（见它的注释），而理由该和判断待在一处，且那儿测得到。
 *
 * `nextTick` 不能省 —— tab 刚换，面板还没渲染完，此刻 focus 会被随后的
 * 渲染/滚动抢走。
 */
async function focusSearchFor(tab: ToolTab) {
  if (!tabAutoFocusesSearch(tab)) return
  await nextTick()
  searchInput.value?.focus()
}

watch(toolsTab, focusSearchFor)

onMounted(() => {
  window.addEventListener('keydown', onFindShortcut)
  document.addEventListener('pointerdown', onDocPointerDown)
  // 顶栏和面板是一起挂上来的：如果打开工具管理时停在的就是「发现」，watch 不会触发。
  void focusSearchFor(toolsTab.value)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onFindShortcut)
  document.removeEventListener('pointerdown', onDocPointerDown)
})
</script>

<template>
  <div class="chat-topbar tools-topbar">
    <!-- 扫哪个项目。放在搜索框左边而不是某个面板里：skills / MCP / hooks / 全局指令
         四个面板共用这一个 cwd，塞进其中一个就等于说另外三个不受它影响。 -->
    <div ref="projectWrapEl" class="set-dropdown-wrap tools-project">
      <button
        type="button"
        class="set-dropdown-btn tools-project-btn"
        :class="{ active: projectMenuOpen, none: !currentProject }"
        :aria-expanded="projectMenuOpen"
        aria-haspopup="menu"
        v-tooltip="currentProject ?? t('tools.project.noneTip')"
        @click.stop="projectMenuOpen = !projectMenuOpen"
      >
        <span class="tools-project-cur">{{ projectLabel }}</span>
        <IconChevronDown class="set-dropdown-chev" />
      </button>
      <div v-if="projectMenuOpen" class="set-dropdown-menu tools-project-menu" role="menu">
        <p class="tools-project-title">{{ t('tools.project.title') }}</p>
        <button
          type="button"
          class="set-dropdown-item tools-project-item"
          role="menuitem"
          @click.stop="pickProject(null)"
        >
          <span class="set-dropdown-check"><IconCheck v-if="toolsPickedProject === null" /></span>
          <span class="tools-project-path">{{ t('tools.project.follow') }}</span>
        </button>
        <button
          v-for="path in projectOptions"
          :key="path"
          type="button"
          class="set-dropdown-item tools-project-item"
          role="menuitem"
          v-tooltip="path"
          @click.stop="pickProject(path)"
        >
          <span class="set-dropdown-check"><IconCheck v-if="path === toolsPickedProject" /></span>
          <span class="tools-project-path">{{ shortName(path) }}</span>
        </button>
      </div>
    </div>
    <div class="ct-search" :class="{ active: hasQuery }">
      <span class="ct-search-ic"><IconSearch /></span>
      <input
        ref="searchInput"
        :value="searchDraft"
        type="text"
        class="ct-search-input"
        :placeholder="placeholder"
        :aria-label="placeholder"
        spellcheck="false"
        autocomplete="off"
        @input="onSearchInput"
        @compositionstart="onSearchCompStart"
        @compositionend="onSearchCompEnd"
        @keydown.enter="onSubmit"
      />
      <button
        v-if="hasQuery"
        class="ct-btn"
        v-tooltip="t('chat.tb.search.clear')"
        @click="commitSearch('')"
      >
        <IconClose />
      </button>
    </div>
    <!-- 配置集跨四个 tab（一个包同时带 MCP / hooks / 全局指令 / skill 清单），
         所以入口在顶栏而不在某一个面板里。 -->
    <button
      class="ct-btn tools-topbar-bundle"
      :class="{ active: toolsBundleOpen }"
      v-tooltip="t('tools.bundle.open')"
      :aria-label="t('tools.bundle.open')"
      @click="toolsBundleOpen = !toolsBundleOpen"
    >
      <IconArchive />
    </button>
    <button
      class="ct-btn tools-topbar-close"
      v-tooltip="t('tools.close')"
      :aria-label="t('tools.close')"
      @click="emit('close')"
    >
      <IconClose />
    </button>
  </div>
</template>

<style scoped>
/* .topbar-drag 是三列网格：[上下文标题 | 搜索 | 右侧空位]。别的顶栏只占中列，
   工具管理要多占一列，好让关闭按钮贴到窗口最右边。 */
.tools-topbar {
  grid-column: 2 / 4;
}
.tools-project {
  flex-shrink: 0;
}
.tools-project-btn {
  max-width: 180px;
}
/* 一个项目都没有时压暗 —— 这个按钮此刻说的是「没在扫任何项目」，不是一个普通选项。 */
.tools-project-btn.none .tools-project-cur {
  color: var(--text-dim);
}
.tools-project-cur {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tools-project-menu {
  min-width: 220px;
  max-height: 320px;
  overflow-y: auto;
}
.tools-project-title {
  margin: 0;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-dim);
}
.tools-project-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tools-topbar-bundle {
  margin-left: auto;
  flex-shrink: 0;
}
.tools-topbar-close {
  flex-shrink: 0;
}
</style>
