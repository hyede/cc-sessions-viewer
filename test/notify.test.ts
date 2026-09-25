import { describe, expect, it } from 'vitest'
import {
  clampNotifyConfig,
  defaultNotifyConfig,
  hasDeliverableEvent,
  hasEnabledChannel,
  SUPPORTED_NOTIFY_AGENTS,
  toggleNotifyAgent,
  validateNotifyConfig,
} from '../src/notify'
import type { NotifyConfig } from '../src/api'

const cfg = (over: Partial<NotifyConfig> = {}): NotifyConfig => ({
  ...defaultNotifyConfig(),
  ...over,
})

describe('defaultNotifyConfig', () => {
  it('starts with both channels off but both agents on', () => {
    const d = defaultNotifyConfig()
    expect(d.bark.enabled).toBe(false)
    expect(d.telegram.enabled).toBe(false)
    expect(d.agents).toEqual(['claude', 'codex'])
    expect(d.notifyDone).toBe(true)
    expect(d.notifyAttention).toBe(true)
  })
})

describe('hasEnabledChannel', () => {
  it('is false when nothing enabled', () => {
    expect(hasEnabledChannel(cfg())).toBe(false)
  })
  it('needs credentials, not just the toggle', () => {
    expect(hasEnabledChannel(cfg({ bark: { enabled: true, server: 's', key: '' } }))).toBe(false)
    expect(hasEnabledChannel(cfg({ bark: { enabled: true, server: 's', key: 'k' } }))).toBe(true)
  })
  it('telegram needs both token and chat id', () => {
    expect(
      hasEnabledChannel(cfg({ telegram: { enabled: true, botToken: 't', chatId: '' } })),
    ).toBe(false)
    expect(
      hasEnabledChannel(cfg({ telegram: { enabled: true, botToken: 't', chatId: 'c' } })),
    ).toBe(true)
  })
  it('ignores credentials of a disabled channel', () => {
    expect(hasEnabledChannel(cfg({ bark: { enabled: false, server: 's', key: 'k' } }))).toBe(false)
  })
})

describe('hasDeliverableEvent', () => {
  it('needs at least one kind and one agent', () => {
    expect(hasDeliverableEvent(cfg())).toBe(true)
    expect(hasDeliverableEvent(cfg({ notifyDone: false, notifyAttention: false }))).toBe(false)
    expect(hasDeliverableEvent(cfg({ agents: [] }))).toBe(false)
  })
})

describe('validateNotifyConfig', () => {
  it('passes when everything disabled', () => {
    expect(validateNotifyConfig(cfg())).toEqual([])
  })
  it('flags missing bark fields only when enabled', () => {
    expect(validateNotifyConfig(cfg({ bark: { enabled: true, server: '', key: '' } }))).toEqual([
      'notify.err.barkServer',
      'notify.err.barkKey',
    ])
  })
  it('flags missing telegram fields when enabled', () => {
    expect(
      validateNotifyConfig(cfg({ telegram: { enabled: true, botToken: '', chatId: '' } })),
    ).toEqual(['notify.err.tgToken', 'notify.err.tgChat'])
  })
  it('treats whitespace-only as empty', () => {
    expect(validateNotifyConfig(cfg({ bark: { enabled: true, server: '  ', key: '  ' } }))).toEqual(
      ['notify.err.barkServer', 'notify.err.barkKey'],
    )
  })
})

describe('toggleNotifyAgent', () => {
  it('removes an enabled agent', () => {
    expect(toggleNotifyAgent(cfg({ agents: ['claude', 'codex'] }), 'claude')).toEqual(['codex'])
  })
  it('adds a missing agent in canonical order', () => {
    expect(toggleNotifyAgent(cfg({ agents: ['codex'] }), 'claude')).toEqual(['claude', 'codex'])
  })
  it('canonical order matches the supported list', () => {
    const both = toggleNotifyAgent(cfg({ agents: [] }), 'codex')
    expect(both).toEqual(['codex'])
    expect(SUPPORTED_NOTIFY_AGENTS).toEqual(['claude', 'codex'])
  })
})

describe('clampNotifyConfig', () => {
  it('clamps the debounce window into [0, 300]', () => {
    expect(clampNotifyConfig(cfg({ windowSeconds: -5 })).windowSeconds).toBe(0)
    expect(clampNotifyConfig(cfg({ windowSeconds: 999 })).windowSeconds).toBe(300)
    expect(clampNotifyConfig(cfg({ windowSeconds: 12.7 })).windowSeconds).toBe(13)
  })
  it('clamps batch size into [1, 50]', () => {
    expect(clampNotifyConfig(cfg({ maxBatch: 0 })).maxBatch).toBe(1)
    expect(clampNotifyConfig(cfg({ maxBatch: 100 })).maxBatch).toBe(50)
  })
  it('coerces NaN to the floor', () => {
    expect(clampNotifyConfig(cfg({ windowSeconds: NaN })).windowSeconds).toBe(0)
    expect(clampNotifyConfig(cfg({ maxBatch: NaN })).maxBatch).toBe(1)
  })
})
