import { test, expect } from 'bun:test'
import { JSDOM } from 'jsdom'
import { applyPocketTouchScroll, supportsPocketTouchScroll } from '../src/frontend/touch-scroll.js'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { renderSettingsView } from '../src/frontend/apps/settings.js'

test('touch scrolling stays opt in through saved preferences and reset', () => {
  expect(defaultPreferences().nativeTouchScrolling).toBe(false)
  expect(normalizePreferences({}).nativeTouchScrolling).toBe(false)
  expect(normalizePreferences({ nativeTouchScrolling: true }).nativeTouchScrolling).toBe(true)
  expect(normalizePreferences({ nativeTouchScrolling: 'true' }).nativeTouchScrolling).toBe(false)
})

test('only the supplied mobile widget changes, and older hosts are supported', () => {
  const modes: string[] = []
  const widget = { setTouchScrollMode(mode: string) { modes.push(mode) } }
  const otherModes: string[] = []
  const otherWidget = { setTouchScrollMode(mode: string) { otherModes.push(mode) } }
  expect(supportsPocketTouchScroll(widget)).toBe(true)
  expect(supportsPocketTouchScroll(otherWidget)).toBe(true)
  applyPocketTouchScroll(widget, true)
  applyPocketTouchScroll(widget, false)
  expect(modes).toEqual(['native', 'guarded'])
  expect(otherModes).toEqual([])
  expect(supportsPocketTouchScroll({})).toBe(false)
  applyPocketTouchScroll({}, true)
  applyPocketTouchScroll(null, true)
})

test('appearance toggle has a name, saves both directions, and is disabled on older hosts', () => {
  const dom = new JSDOM('<body></body>')
  const previous = globalThis.document
  globalThis.document = dom.window.document
  try {
    let saved = defaultPreferences()
    const host = {
      draft: saved, section: 'appearance', nativeTouchScrollAvailable: true,
      resolvedWallpapers: { deviceHome: { status: 'empty', sourceLabel: 'Theme background' }, deviceChat: { status: 'empty', sourceLabel: 'Theme background' } }, page: () => {
        const page = document.createElement('div'), content = document.createElement('div')
        page.append(content); return { page, content }
      }, update: (value: typeof saved) => { saved = value },
    } as any
    const view = renderSettingsView(host)
    const toggle = view.querySelector<HTMLButtonElement>('button[aria-label="Native touch scrolling"]')!
    expect(toggle.disabled).toBe(false)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    toggle.click()
    expect(saved.nativeTouchScrolling).toBe(true)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    toggle.click()
    expect(saved.nativeTouchScrolling).toBe(false)
    host.nativeTouchScrollAvailable = false
    const oldHost = renderSettingsView(host)
    expect(oldHost.querySelector<HTMLButtonElement>('button[aria-label="Native touch scrolling"]')!.disabled).toBe(true)
  } finally { globalThis.document = previous; dom.window.close() }
})
