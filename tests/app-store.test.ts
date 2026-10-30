import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { defaultLauncherLayout, setPocketAppInstalled } from '../src/domain/launcher.js'
import { renderAppStore, updateAppStore, type AppStoreSession } from '../src/frontend/apps/app-store.js'

function fixture(removed = false, ui: AppStoreSession = {}) {
  const dom = new JSDOM('<body></body>'), previous = globalThis.document
  globalThis.document = dom.window.document
  const installed = defaultLauncherLayout(), layout = removed ? setPocketAppInstalled(installed, 'weather', false) : installed
  const actions: unknown[] = []
  const view = renderAppStore({ layout, ui, page: () => { const page = document.createElement('div'), content = document.createElement('div'); page.append(content); return { page, content } }, open: app => actions.push(['open', app]), install: (app, installed) => actions.push(['install', app, installed]) })
  document.body.append(view)
  const control = (name: string) => {
    const node = [...view.querySelectorAll<HTMLButtonElement>('button')].find(node => node.getAttribute('aria-label') === name)
    if (!node) throw new Error('Missing store action: ' + name)
    return node
  }
  return { dom, ui, view, actions, control, close() { dom.window.close(); globalThis.document = previous } }
}

test('store offers real app actions and keeps system apps available', () => {
  const f = fixture(true)
  try {
    f.control('Get Weather').click(); f.control('Open Camera').click(); f.control('Remove Notes from this phone').click()
    expect(f.actions).toEqual([['install', 'weather', true], ['open', 'camera'], ['install', 'notes', false]])
    expect([...f.view.querySelectorAll('button')].some(node => node.getAttribute('aria-label') === 'Remove Settings from this phone')).toBe(false)
    expect(f.view.textContent).toContain('Your saved data and layout stay safe.')
    expect(f.view.textContent).toContain('Socials are here.')
    for (const name of ['Twitter', 'Discord', 'Instagram', 'Tumblr']) expect(f.control(`Get ${name}`)).toBeTruthy()
  } finally { f.close() }
})

test('search and installation filters combine without replacing the focused input', () => {
  const f = fixture(true)
  try {
    const input = f.view.querySelector('input')!; input.focus(); input.value = 'WEATHER'; input.dispatchEvent(new f.dom.window.Event('input'))
    expect(f.ui.query).toBe('WEATHER')
    expect(f.dom.window.document.activeElement).toBe(input)
    expect([...f.view.querySelectorAll<HTMLElement>('.lp-store-app')].filter(node => !node.hidden)).toHaveLength(1)
    const onPhone = [...f.view.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent === 'On your phone')!
    onPhone.click(); expect([...f.view.querySelectorAll<HTMLElement>('.lp-store-app')].filter(node => !node.hidden)).toHaveLength(0)
    expect(onPhone.getAttribute('aria-pressed')).toBe('true')
    const available = [...f.view.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent === 'Available')!
    available.click(); expect([...f.view.querySelectorAll<HTMLElement>('.lp-store-app')].filter(node => !node.hidden)).toHaveLength(1)
  } finally { f.close() }
})

test('pending saves prevent duplicate actions and errors remain available for retry', () => {
  const f = fixture(false, { pending: true, error: 'Save failed. Retry.' })
  try {
    expect([...f.view.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input')].every(node => node.disabled)).toBe(true)
    f.control('Remove Camera from this phone').click(); expect(f.actions).toEqual([])
    expect(f.view.querySelector('[role="alert"]')?.textContent).toBe('Save failed. Retry.')
  } finally { f.close() }
})

test('search comes first and vector banners and carousel controls stay accessible', () => {
  const f = fixture()
  try {
    expect(f.view.firstElementChild?.firstElementChild?.className).toBe('lp-store-search')
    const rails = [...f.view.querySelectorAll<HTMLElement>('.lp-store-rail')]
    expect(rails).toHaveLength(2)
    for (const rail of rails) {
      expect(rail.tabIndex).toBe(0)
      expect(rail.getAttribute('aria-label')).toBeTruthy()
      expect(f.view.querySelectorAll(`[aria-controls="${rail.id}"]`)).toHaveLength(2)
    }
    const ids = [...f.view.querySelectorAll('[id]')].map(node => node.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(f.view.querySelectorAll('.lp-store-banner')).toHaveLength(4)
    expect([...f.view.querySelectorAll('.lp-store-banner')].every(node => node.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect(f.view.querySelector('img')).toBeNull()
    const social = f.view.querySelector('.lp-store-soon')!
    const everyday = f.view.querySelector('[aria-label="Everyday favorites app cards"]')!.closest('section')!
    expect(social.nextElementSibling).toBe(everyday)
    f.control('Open Camera from Spotlight').click(); f.control('Open Notes from Everyday favorites').click()
    expect(f.actions).toEqual([['open', 'camera'], ['open', 'notes']])
  } finally { f.close() }
})

test('search hides discovery collections and clearing it restores them', () => {
  const f = fixture()
  try {
    const input = f.view.querySelector('input')!, discovery = f.view.querySelector<HTMLElement>('.lp-store-discovery')!
    input.value = 'camera'; input.dispatchEvent(new f.dom.window.Event('input'))
    expect(discovery.hidden).toBe(true)
    expect(f.view.querySelector('.lp-store-catalog-title')?.textContent).toBe('Search results')
    input.value = ''; input.dispatchEvent(new f.dom.window.Event('input'))
    expect(discovery.hidden).toBe(false)
  } finally { f.close() }
})

test('rapid state acknowledgements cannot replace saved carousel offsets with an unrestored view', () => {
  const dom = new JSDOM('<body></body>'), previous = globalThis.document, ui: AppStoreSession = {}
  globalThis.document = dom.window.document
  let cleanups: Array<() => void> = [], frames: FrameRequestCallback[] = []
  dom.window.requestAnimationFrame = callback => { frames.push(callback); return frames.length }
  const mount = () => {
    for (const cleanup of cleanups) cleanup(); cleanups = []
    const view = renderAppStore({ layout: defaultLauncherLayout(), ui, page: () => { const page = document.createElement('div'), content = document.createElement('div'); page.append(content); return { page, content } }, open() {}, install() {}, onCleanup: cleanup => cleanups.push(cleanup) })
    document.body.replaceChildren(view); return view
  }
  const paint = () => { const pending = frames; frames = []; for (const callback of pending) callback(0) }
  try {
    const first = mount(); paint()
    first.querySelector<HTMLElement>('.lp-store-rail-spotlight')!.scrollLeft = 312
    first.scrollTop = 140
    ui.pending = true; mount()
    // A second state/ack arrives before the interim view has painted/restored.
    ui.pending = false; const final = mount(); paint()
    expect(final.querySelector<HTMLElement>('.lp-store-rail-spotlight')!.scrollLeft).toBe(312)
    expect(final.scrollTop).toBe(140)
  } finally { dom.window.close(); globalThis.document = previous }
})


test('Get patches existing Store controls and keeps the real page scroll through pending, state, and ack', () => {
  const f = fixture()
  try {
    const catalogGet = f.control('Get Twitter'), socialsGet = f.control('Get Twitter from Socials')
    const rail = f.view.querySelector<HTMLElement>('.lp-store-rail-spotlight')!
    f.view.scrollTop = 940; rail.scrollLeft = 312; socialsGet.focus()
    socialsGet.click()
    f.ui.pending = true; updateAppStore(f.view, defaultLauncherLayout())
    expect(f.view.scrollTop).toBe(940); expect(rail.scrollLeft).toBe(312)
    const installed = setPocketAppInstalled(defaultLauncherLayout(), 'twitter', true)
    updateAppStore(f.view, installed)
    expect(socialsGet.textContent).toBe('Open'); expect(socialsGet.disabled).toBe(true)
    f.ui.pending = false; updateAppStore(f.view, installed)
    expect(f.control('Open Twitter')).toBe(catalogGet)
    expect(f.control('Open Twitter from Socials')).toBe(socialsGet)
    expect(f.view.scrollTop).toBe(940); expect(rail.scrollLeft).toBe(312)
    socialsGet.click(); expect(f.actions.at(-1)).toEqual(['open', 'twitter'])
  } finally { f.close() }
})

test('Available keeps the just-installed row in place until the person changes the filter', () => {
  const f = fixture(false, { filter: 'available' })
  try {
    const get = f.control('Get Tumblr'), row = get.closest<HTMLElement>('.lp-store-app')!
    get.click(); const installed = setPocketAppInstalled(defaultLauncherLayout(), 'tumblr', true)
    updateAppStore(f.view, installed)
    expect(row.hidden).toBe(false); expect(f.control('Open Tumblr')).toBe(get)
    const available = [...f.view.querySelectorAll<HTMLButtonElement>('.lp-store-filter')].find(button => button.textContent === 'Available')!
    available.click(); expect(row.hidden).toBe(true)
  } finally { f.close() }
})
