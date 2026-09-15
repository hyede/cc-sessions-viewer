<script setup lang="ts">
// 一个 skill 的风险明细。
//
// 两处用：本地 Skills 详情，和「发现」面板装之前那一屏。**这两处必须是同一段代码**
// —— 装之前看到的风险和装完之后看到的风险不一样的话，装之前那一屏就没有意义了。
// 后端那边也是同一份（`skills::describe_body`）。
//
// **按「规则 × 等级」折叠，不铺平。** 铺平过一版，结果是 archify 这种 skill 在面板上
// 挂出 101 行内容一模一样的「起子进程」。用户在这一屏要回答的问题是「这东西危险吗」，
// 而一百行同一句话只会把真正不同的那几条挤出屏幕。折叠之后一条规则占一行，想看具体
// 位置再展开。
//
// 降级说明（`level !== baseLevel`）不能省：一条 `curl` 出现在 SKILL.md 的代码块里和
// 出现在一个 `.sh` 文件里不是一回事，`risk.rs` 会按上下文降级。不写出来的话用户看到
// 的是一个「低危」，却无从判断它凭什么低。同一组里各条的降级理由可能不同（同一条规则
// 既命中了 `bin/` 又命中了 `test/`），所以这句话跟着每一条走，不提到组头上。
import { computed, ref } from 'vue'
import type { RiskFinding } from '../types'
import { groupFindings } from '../toolsSkills'
import { IconChevronDown, IconChevronRight } from './icons'
import { t } from '../i18n'

const props = defineProps<{
  findings: RiskFinding[]
  /** 文件没扫全（数量 / 深度触顶，或有文件扫不动）。**必须报出来** —— 一份只扫了
      一半的目录和一份真的干净的目录，不报的话在界面上长得一模一样。 */
  truncated: boolean
  /** 小节标题。两个面板的措辞不同（「风险点 (3)」/「装之前先看这几条 (3)」）。 */
  heading: string
}>()

const groups = computed(() => groupFindings(props.findings))

/** 展开的组。默认全收起 —— 折叠的意义就在于先给一个能一眼看完的概览。 */
const expanded = ref(new Set<string>())

function toggle(key: string): void {
  const next = new Set(expanded.value)
  if (!next.delete(key)) next.add(key)
  expanded.value = next
}
</script>

<template>
  <div v-if="groups.length > 0" class="skill-section">
    <h4>
      {{ heading }}
      <span v-if="truncated" class="skill-note">{{ t('tools.skills.truncatedRisk') }}</span>
    </h4>
    <div v-for="g in groups" :key="g.key" class="skill-finding-group">
      <!-- 只有一条的组不值得多点一下：直接摊开，长得和折叠前一样。 -->
      <div v-if="g.findings.length === 1" class="skill-finding">
        <span class="skill-risk" :class="g.level">{{ t(`tools.skills.risk.${g.level}`) }}</span>
        <span class="skill-finding-rule">{{ g.rule }}</span>
        <span class="skill-finding-at">{{ g.findings[0].file }}:{{ g.findings[0].line }}</span>
        <code class="skill-finding-code">{{ g.findings[0].excerpt }}</code>
        <span v-if="g.findings[0].level !== g.findings[0].baseLevel" class="skill-note">
          {{ t('tools.skills.downgraded', {
            base: t(`tools.skills.risk.${g.findings[0].baseLevel}`),
            context: t(`tools.skills.context.${g.findings[0].context}`),
          }) }}
        </span>
      </div>

      <template v-else>
        <button
          type="button"
          class="skill-finding skill-finding-head"
          :aria-expanded="expanded.has(g.key)"
          @click="toggle(g.key)"
        >
          <component
            :is="expanded.has(g.key) ? IconChevronDown : IconChevronRight"
            class="skill-finding-chevron"
          />
          <span class="skill-risk" :class="g.level">{{ t(`tools.skills.risk.${g.level}`) }}</span>
          <span class="skill-finding-rule">{{ g.rule }}</span>
          <span class="skill-finding-at">
            {{ t('tools.skills.riskOccurrences', { n: String(g.findings.length) }) }}
          </span>
          <code class="skill-finding-code">{{ g.findings[0].excerpt }}</code>
        </button>
        <div v-if="expanded.has(g.key)" class="skill-finding-list">
          <div v-for="(f, i) in g.findings" :key="i" class="skill-finding skill-finding-child">
            <span class="skill-finding-at">{{ f.file }}:{{ f.line }}</span>
            <code class="skill-finding-code">{{ f.excerpt }}</code>
            <span v-if="f.level !== f.baseLevel" class="skill-note">
              {{ t('tools.skills.downgraded', {
                base: t(`tools.skills.risk.${f.baseLevel}`),
                context: t(`tools.skills.context.${f.context}`),
              }) }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.skill-section {
  margin-top: 18px;
}
.skill-section h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-mute);
  display: flex;
  align-items: center;
  gap: 8px;
}
.skill-finding {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
  border-bottom: 1px solid var(--border);
}
/* 组头是个按钮，但要长得和普通行一样。 */
.skill-finding-head {
  width: 100%;
  background: none;
  border-width: 0 0 1px;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
  padding: 4px 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.skill-finding-head:hover {
  background: var(--surface-hover);
}
.skill-finding-chevron {
  width: 12px;
  height: 12px;
  flex: none;
  color: var(--text-dim);
}
.skill-finding-list {
  /* 一组可能有上百条。给个上限，让下一条规则始终够得着。 */
  max-height: 220px;
  overflow-y: auto;
}
.skill-finding-child {
  padding-left: 20px;
}
.skill-finding-child:last-child {
  border-bottom: none;
}
.skill-finding-rule {
  font-size: 12px;
  color: var(--text);
}
.skill-finding-at {
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
}
.skill-note {
  font-size: 11px;
  color: var(--text-dim);
  font-weight: 400;
}
.skill-finding-code {
  flex: 1;
  min-width: 160px;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 11px;
  color: var(--text-mute);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
