import { afterEach, describe, expect, it } from 'vitest'
import { t } from '../src/i18n'
import { lang, setLang } from '../src/settings'
import en from '../src/locales/en'
import zh from '../src/locales/zh'
import zhTW from '../src/locales/zh-TW'
import ja from '../src/locales/ja'

afterEach(() => setLang('en'))

describe('t', () => {
  it('returns the English string by default', () => {
    expect(t('time.today')).toBe('Today')
  })

  it('switches dictionary when the language changes', () => {
    setLang('zh')
    expect(t('time.today')).toBe('今天')
    setLang('zh-TW')
    expect(t('list.messages', { n: 3 })).toBe('3 則訊息')
    setLang('ja')
    expect(t('time.today')).toBe('今日')
  })

  it('returns the key itself when it is unknown', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('interpolates numeric variables', () => {
    expect(t('list.messages', { n: 42 })).toBe('42 messages')
  })

  it('interpolates string variables', () => {
    expect(t('sidebar.noSessions', { agent: 'Claude' })).toBe('No Claude sessions')
  })

  it('leaves the template untouched when a variable does not match a slot', () => {
    expect(t('time.today', { unused: 'x' })).toBe('Today')
  })

  it('falls back to the English dictionary for an unrecognized language', () => {
    lang.value = 'xx' as unknown as typeof lang.value
    expect(t('time.today')).toBe('Today')
  })
})


describe('四份词典的键必须对齐', () => {
  // `t()` 查不到键就原样返回键名，于是漏翻一条的表现是界面上蹦出个
  // `stats.scope.pi` —— 不报错、不崩、测试全绿，只有真的切到那个语言、点到那个
  // 位置才看得见。实际就这么漏过一条：Pi 接进统计页时四份词典全忘了加。
  //
  // 键是**动态拼**的时候尤其危险（`stats.scope.${agent}`），grep 都 grep 不出来。
  const DICTS: Record<string, Record<string, string>> = { en, zh, 'zh-TW': zhTW, ja }

  const everyKey = [...new Set(Object.values(DICTS).flatMap((d) => Object.keys(d)))].sort()

  it.each(Object.keys(DICTS))('%s 不缺键', (name) => {
    const missing = everyKey.filter((k) => !(k in DICTS[name]))
    expect(missing, `${name} 缺 ${missing.length} 个键`).toEqual([])
  })

  it('没有哪份词典有别人没有的键', () => {
    // 反方向：某份词典里留着一条别人都删掉的键，说明那次删除漏了一处。
    const counts = new Map<string, number>()
    for (const d of Object.values(DICTS)) {
      for (const k of Object.keys(d)) counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    const lonely = [...counts.entries()].filter(([, n]) => n !== 4).map(([k]) => k)
    expect(lonely).toEqual([])
  })

  it('值不能是空串', () => {
    // 空串会让界面上那一处直接消失，比露出键名更难发现。
    for (const [name, d] of Object.entries(DICTS)) {
      const blank = Object.entries(d)
        .filter(([, v]) => typeof v === 'string' && v.trim() === '')
        .map(([k]) => k)
      expect(blank, `${name} 有空值`).toEqual([])
    }
  })
})
