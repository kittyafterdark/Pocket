import { test, expect } from 'bun:test'
import { JSDOM } from 'jsdom'
import { applyPocketTouchScroll, supportsPocketTouchScroll, resolvePocketTouchScrollMode } from '../src/frontend/touch-scroll.js'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { renderSettingsView } from '../src/frontend/apps/settings.js'

test('iPhone defaults to native scrolling, while explicit opt-outs survive normalization', () => {
  expect(defaultPreferences().nativeTouchScrollMode).toBe('auto')
  expect(normalizePreferences({}).nativeTouchScrollMode).toBe('auto')
  expect(normalizePreferences({ nativeTouchScrolling: false }).nativeTouchScrollMode).toBe('auto')
  expect(normalizePreferences({ nativeTouchScrolling: true }).nativeTouchScrollMode).toBe('native')
  expect(normalizePreferences({ nativeTouchScrollMode: 'guarded' }).nativeTouchScrollMode).toBe('guarded')
  expect(normalizePreferences(normalizePreferences({ nativeTouchScrollMode: 'guarded' })).nativeTouchScrollMode).toBe('guarded')
  expect(resolvePocketTouchScrollMode('auto', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('native')
  expect(resolvePocketTouchScrollMode('auto', 'Mozilla/5.0 (Linux; Android 15)')).toBe('guarded')
  expect(resolvePocketTouchScrollMode('auto', 'Mozilla/5.0 (Windows NT 10.0)')).toBe('guarded')
  expect(resolvePocketTouchScrollMode('guarded', 'iPhone')).toBe('guarded')
  expect(resolvePocketTouchScrollMode('native', 'Android')).toBe('native')
})

test('only the supplied mobile widget changes, and older hosts are supported', () => {
  const modes: string[] = []
  const widget = { setTouchScrollMode(mode: string) { modes.push(mode) } }
  const otherModes: string[] = []
  const otherWidget = { setTouchScrollMode(mode: string) { otherModes.push(mode) } }
  expect(supportsPocketTouchScroll(widget)).toBe(true)
  expect(supportsPocketTouchScroll(otherWidget)).toBe(true)
  applyPocketTouchScroll(widget, 'native')
  applyPocketTouchScroll(widget, 'guarded')
  expect(modes).toEqual(['native', 'guarded'])
  expect(otherModes).toEqual([])
  expect(supportsPocketTouchScroll({})).toBe(false)
  applyPocketTouchScroll({}, 'native')
  applyPocketTouchScroll(null, 'native')
})

test('appearance toggle saves reversible iPhone overrides without a widget capability gate', () => {
  const dom = new JSDOM('<body></body>')
  const previous = globalThis.document
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'iPhone' } })
  globalThis.document = dom.window.document
  try {
    let saved = defaultPreferences()
    const host = {
      draft: saved, section: 'appearance',
      resolvedWallpapers: { deviceHome: { status: 'empty', sourceLabel: 'Theme background' }, deviceChat: { status: 'empty', sourceLabel: 'Theme background' } }, page: () => {
        const page = document.createElement('div'), content = document.createElement('div')
        page.append(content); return { page, content }
      }, update: (value: typeof saved) => { saved = value },
    } as any
    const view = renderSettingsView(host)
    const toggle = view.querySelector<HTMLButtonElement>('button[aria-label="Native touch scrolling"]')!
    expect(toggle.disabled).toBe(false)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    toggle.click()
    expect(saved.nativeTouchScrollMode).toBe('guarded')
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    toggle.click()
    expect(saved.nativeTouchScrollMode).toBe('native')
    host.draft = normalizePreferences(saved)
    const reopened = renderSettingsView(host)
    const savedToggle = reopened.querySelector<HTMLButtonElement>('button[aria-label="Native touch scrolling"]')!
    expect(savedToggle.disabled).toBe(false)
    expect(savedToggle.getAttribute('aria-pressed')).toBe('true')
  } finally {
    globalThis.document = previous
    if (previousNavigator) Object.defineProperty(globalThis, 'navigator', previousNavigator)
    else delete (globalThis as any).navigator
    dom.window.close()
  }
})
