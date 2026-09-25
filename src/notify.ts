// Agent-agnostic logic for the third-party push-notification settings tab.
// Pure functions only (no Tauri, no DOM) so they can be unit-tested; the
// SettingsModal tab wires these to `api.ts` and renders the issue keys via t().

import type { NotifyConfig } from './api'

export const SUPPORTED_NOTIFY_AGENTS = ['claude', 'codex'] as const
export type NotifyAgent = (typeof SUPPORTED_NOTIFY_AGENTS)[number]

export function defaultNotifyConfig(): NotifyConfig {
  return {
    bark: { enabled: false, server: 'https://api.day.app', key: '' },
    telegram: { enabled: false, botToken: '', chatId: '' },
    proxy: '',
    notifyDone: true,
    notifyAttention: true,
    agents: ['claude', 'codex'],
    windowSeconds: 30,
    maxBatch: 5,
  }
}

/** True when at least one channel is switched on with the credentials it needs. */
export function hasEnabledChannel(config: NotifyConfig): boolean {
  const bark = config.bark.enabled && config.bark.key.trim() !== ''
  const tg =
    config.telegram.enabled &&
    config.telegram.botToken.trim() !== '' &&
    config.telegram.chatId.trim() !== ''
  return bark || tg
}

/** True when a channel is enabled and at least one event kind is selected. */
export function hasDeliverableEvent(config: NotifyConfig): boolean {
  return (config.notifyDone || config.notifyAttention) && config.agents.length > 0
}

/**
 * Validate the form and return i18n keys for anything wrong. Empty = valid.
 * A disabled channel is never validated — you can leave stale credentials.
 */
export function validateNotifyConfig(config: NotifyConfig): string[] {
  const issues: string[] = []
  if (config.bark.enabled) {
    if (config.bark.server.trim() === '') issues.push('notify.err.barkServer')
    if (config.bark.key.trim() === '') issues.push('notify.err.barkKey')
  }
  if (config.telegram.enabled) {
    if (config.telegram.botToken.trim() === '') issues.push('notify.err.tgToken')
    if (config.telegram.chatId.trim() === '') issues.push('notify.err.tgChat')
  }
  return issues
}

/** Toggle an agent in/out of the delivery list, preserving a stable order. */
export function toggleNotifyAgent(config: NotifyConfig, agent: NotifyAgent): string[] {
  if (config.agents.includes(agent)) {
    return config.agents.filter((a) => a !== agent)
  }
  return SUPPORTED_NOTIFY_AGENTS.filter((a) => a === agent || config.agents.includes(a))
}

/** Clamp the debounce window/batch to sane bounds before persisting. */
export function clampNotifyConfig(config: NotifyConfig): NotifyConfig {
  return {
    ...config,
    windowSeconds: Math.min(300, Math.max(0, Math.round(config.windowSeconds) || 0)),
    maxBatch: Math.min(50, Math.max(1, Math.round(config.maxBatch) || 1)),
  }
}
