import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { defaultLauncherLayout, MAX_LAUNCHER_ITEMS, normalizeLauncherLayout, normalizeLauncherLayouts, placeLauncherApp, pocketAppInstalled, setPocketAppInstalled, removeLauncherItem, removeLauncherPage } from '../src/domain/launcher.js'
import type { LauncherLayout } from '../src/domain/launcher.js'
import type { PhoneState, PhoneTracker } from '../src/types.js'
import { normalizeTracker } from '../src/domain/trackers.js'
import { renderLauncher, type LauncherSession } from '../src/frontend/apps/launcher.js'
const homeApps = (layout: LauncherLayout) => layout.pages[0].items.flatMap(item => item.kind === 'app' ? [item.app] : [])
const emptyLayout = (): LauncherLayout => ({ version: 2, pages: [{ id: 'home', name: 'Home', items: [] }], dock: [null, null, null, null] })

test('legacy and malformed layouts get defaults; intentional empty Home and dock survive', () => {
  expect(normalizeLauncherLayout(undefined)).toEqual(defaultLauncherLayout())
  expect(normalizeLauncherLayout({ version: 9 })).toEqual(defaultLauncherLayout())
  expect(normalizeLauncherLayout({ version: 1, home: [], dock: [] })).toEqual(emptyLayout())
  expect(normalizeLauncherLayout({ version: 1, home: ['camera', 'weather', 'unknown', 'weather'], dock: ['camera', 'camera', null, 'notes', 'settings'] })).toEqual({ version: 2, pages: [{ id: 'home', name: 'Home', items: [{ id: 'app-weather', kind: 'app', app: 'weather' }] }], dock: ['camera', null, null, 'notes'] })
  expect(homeApps(normalizeLauncherLayouts({ alice: { version: 1, home: [], dock: [] }, bob: undefined }).alice)).toEqual([])
})

test('dock replacement preserves displaced apps and never duplicates shortcuts', () => {
  const initial = defaultLauncherLayout()
  const moved = placeLauncherApp(initial, 'weather', 0)
  expect(moved.dock).toEqual(['weather', 'camera', 'gallery', 'notes'])
  expect(homeApps(moved)).toEqual(['contacts', 'calendar', 'trackers', 'settings', 'appstore', 'messages'])
  expect(initial).toEqual(defaultLauncherLayout())
  expect(placeLauncherApp(moved, 'weather', 'home').dock[0]).toBeNull()
  expect(placeLauncherApp(moved, 'weather', 0)).toEqual(moved)
})

function fixture(ui: LauncherSession = {}, layout = defaultLauncherLayout(), trackers: PhoneTracker[] = []) {
  const dom = new JSDOM('<body></body>', { pretendToBeVisual: true })
  const previous = globalThis.document
  globalThis.document = dom.window.document
  const opened: string[] = [], saved: unknown[] = []
  const cleanups: Array<() => void> = []
  const state = { roleplayNow: '2026-10-29T12:00:00Z', weather: { temperature: 21, unit: 'C', condition: 'Clear', location: 'Harbor', high: 24, low: 16 }, trackers, contacts: [], discoveredActors: [], pocketPersona: { displayName: 'You' } } as unknown as PhoneState
  const view = renderLauncher({
    state, ui, layout, open: app => opened.push(app), openTracker: id => opened.push(`tracker:${id}`), onCleanup: cleanup => cleanups.push(cleanup), save: layout => saved.push(layout),
    appIcon(meta, activate) { const control = dom.window.document.createElement('button'); control.textContent = meta.label; control.setAttribute('aria-label', meta.label); control.onclick = activate; return control },
  }, [])
  dom.window.document.body.append(view)
  const control = (name: string) => {
    const found = [...view.querySelectorAll<HTMLButtonElement>('button')].find(node => node.getAttribute('aria-label') === name)
    if (!found) throw new Error(`Missing control: ${name}`)
    return found
  }
  const place = (app: string, value: string) => {
    const select = view.querySelector('select')!
    expect(select.labels?.[0].textContent).toContain(`Move ${app} to`)
    select.value = value; select.dispatchEvent(new dom.window.Event('change'))
  }
  return { dom, ui, view, state, control, place, opened, saved, close() { cleanups.forEach(cleanup => cleanup()); dom.window.close(); globalThis.document = previous } }
}

test('drawer filters without losing focus, opens apps, and Escape restores Home focus', () => {
  const f = fixture()
  try {
    f.control('Open app drawer').click()
    const input = f.view.querySelector('input')!
    expect(f.dom.window.document.activeElement).toBe(input)
    input.value = ' CAM '; input.dispatchEvent(new f.dom.window.Event('input'))
    expect([...f.view.querySelectorAll('.lp-app-grid button')].filter(node => !(node as HTMLElement).hidden).map(node => node.textContent)).toEqual(['Camera'])
    f.control('Camera').click(); expect(f.opened).toEqual(['camera'])
    input.value = 'nothing'; input.dispatchEvent(new f.dom.window.Event('input'))
    expect(f.view.textContent).toContain('No matching apps.')
    input.dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(f.ui.drawer).toBe(false)
    expect(f.dom.window.document.activeElement).toBe(f.control('Open app drawer'))
  } finally { f.close() }
})

test('edit is a draft, supports reorder and dock replacement, and prevents duplicate saves', () => {
  const f = fixture()
  try {
    f.control('Edit home screen').click()
    f.control('Arrange Contacts').click()
    f.control('Move earlier: Contacts').click()
    expect(homeApps(f.ui.draft!)[0]).toBe('contacts')
    f.place('Contacts', '0')
    expect(f.ui.draft!.dock[0]).toBe('contacts')
    expect(homeApps(f.ui.draft!)).toContain('messages')
    f.control('Save home layout').click(); f.control('Save home layout').click()
    expect(f.saved.length).toBe(1)
    expect(f.ui.pending).toBe(true)
    expect([...f.view.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select')].every(node => node.disabled)).toBe(true)
    expect(f.opened).toEqual([])
  } finally { f.close() }
})

test('removing a shortcut leaves it in the drawer; Cancel leaves stored layout intact', () => {
  const f = fixture()
  try {
    f.control('Edit home screen').click(); f.control('Arrange Settings').click(); f.control('Remove Settings shortcut').click()
    expect(homeApps(f.ui.draft!)).not.toContain('settings')
    f.control('Open app drawer').click(); f.control('Arrange Settings').click()
    f.place('Settings', 'page:home')
    expect(homeApps(f.ui.draft!)).toContain('settings')
    f.control('Cancel layout changes').click()
    expect(f.ui.draft).toBeUndefined(); expect(f.saved).toEqual([])
    expect(f.control('Settings')).toBeDefined()
  } finally { f.close() }
})

test('independent phone sessions and rerenders keep drafts, search, and errors separate', () => {
  const alice: LauncherSession = { draft: emptyLayout(), error: 'Save failed. Try again.' }
  const f = fixture(alice)
  try { expect(f.view.querySelector('[role="alert"]')?.textContent).toBe('Save failed. Try again.'); expect(homeApps(f.ui.draft!)).toEqual([]) } finally { f.close() }
  const bob = fixture()
  try { expect(bob.ui.draft).toBeUndefined(); expect(bob.control('Weather')).toBeDefined() } finally { bob.close() }
})

test('an empty dock slot places the chosen drawer app directly into that slot', () => {
  const f = fixture({ draft: emptyLayout() })
  try {
    f.control('Choose app for dock slot 3').click(); f.control('Arrange Camera').click()
    expect(f.ui.draft!.dock).toEqual([null, null, 'camera', null])
    expect(f.ui.placingSlot).toBeUndefined()
    f.control('Choose app for dock slot 1').click(); f.control('Return to Home').click()
    expect(f.ui.placingSlot).toBeUndefined()
  } finally { f.close() }
})

test('screen/folder normalization keeps ids unique and app/widget references canonical', () => {
  const layout = normalizeLauncherLayout({ version: 2, dock: ['messages'], pages: [
    { id: 'same', items: [{ id: 'duplicate', kind: 'folder', name: 'Social', apps: ['contacts', 'messages', 'contacts'] }, { id: 'duplicate', kind: 'tracker', trackerId: 'health', size: 'wide' }] },
    { id: 'same', items: [{ kind: 'app', app: 'contacts' }, { kind: 'tracker', trackerId: 'health' }, { kind: 'tracker', trackerId: 'removed' }] },
  ] })
  expect(new Set(layout.pages.map(page => page.id)).size).toBe(2)
  expect(new Set(layout.pages.flatMap(page => page.items).map(item => item.id)).size).toBe(3)
  expect(layout.pages[0].items[0]).toMatchObject({ kind: 'folder', apps: ['contacts'] })
  expect(layout.pages[1].items).toHaveLength(1)
  expect(normalizeLauncherLayout(layout)).toEqual(layout)
})

test('removing folders and screens preserves all contained shortcuts and widgets', () => {
  const layout = emptyLayout()
  layout.pages.push({ id: 'second', name: 'Screen 2', items: [{ id: 'social', kind: 'folder', name: 'Social', apps: ['contacts', 'messages'] }, { id: 'health-widget', kind: 'tracker', trackerId: 'health', size: 'compact' }] })
  const moved = placeLauncherApp(layout, 'camera', { folderId: 'social' })
  expect((moved.pages[1].items[0] as any).apps).toEqual(['contacts', 'messages', 'camera'])
  const removed = removeLauncherPage(moved, 'second')
  expect(removed.pages).toHaveLength(1)
  expect(removed.pages[0].items).toHaveLength(2)
  const released = removeLauncherItem(removed, 'social')
  expect(homeApps(released)).toEqual(['contacts', 'messages', 'camera'])
  expect(released.pages[0].items.at(-1)).toMatchObject({ kind: 'tracker', trackerId: 'health' })
  expect(removeLauncherPage(released, 'home')).toEqual(released)
  expect(placeLauncherApp(released, 'settings', { pageId: 'missing' })).toEqual(released)
})

test('screen dots navigate, add draft screens, and move screen contents safely on removal', () => {
  const f = fixture()
  try {
    f.control('Edit home screen').click(); f.control('Add Home screen').click()
    expect(f.ui.draft!.pages).toHaveLength(2)
    expect(f.view.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe('Go to Home screen 2: Screen 2')
    f.control('Open app drawer').click(); f.control('Arrange Settings').click()
    f.place('Settings', `page:${f.ui.pageId}`)
    expect(f.ui.draft!.pages[1].items[0]).toMatchObject({ kind: 'app', app: 'settings' })
    f.control('Remove Screen 2 screen and move its items to Home').click()
    expect(f.ui.draft!.pages).toHaveLength(1)
    expect(homeApps(f.ui.draft!)).toContain('settings')
    expect(f.saved).toEqual([])
  } finally { f.close() }
})

test('folders support names, app placement, opening, Escape, and removal without lost apps', () => {
  const f = fixture()
  let layout: LauncherLayout
  try {
    f.control('Edit home screen').click(); f.control('Create folder').click()
    const input = f.view.querySelector('input')!
    input.value = 'Social'; input.dispatchEvent(new f.dom.window.Event('input')); input.dispatchEvent(new f.dom.window.Event('change'))
    const folderId = f.ui.selectedItem!
    f.control('Open app drawer').click(); f.control('Arrange Contacts').click(); f.place('Contacts', `folder:${folderId}`)
    const folder = f.ui.draft!.pages[0].items.find(item => item.id === folderId)!
    expect(folder).toMatchObject({ name: 'Social', apps: ['contacts'] })
    layout = structuredClone(f.ui.draft!)
    f.control('Arrange folder: Social').click(); f.control('Remove Social').click()
    expect(homeApps(f.ui.draft!)).toContain('contacts')
  } finally { f.close() }
  const normal = fixture({}, layout!)
  try {
    normal.control('Open folder: Social').click(); normal.control('Contacts').click()
    expect(normal.opened).toEqual(['contacts'])
    normal.control('Close folder').dispatchEvent(new normal.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(normal.ui.folderId).toBeUndefined()
    expect(normal.dom.window.document.activeElement).toBe(normal.control('Open folder: Social'))
  } finally { normal.close() }
})

const healthTracker = () => normalizeTracker({ id: 'health', label: 'Health', value: 75, unit: '%', target: { type: 'scene', label: 'Scene', id: '' } }, { now: '2026-10-29T12:00:00Z' })!

test('tracker widgets use canonical tracker ids, support wide size, and open the original tracker', () => {
  const f = fixture({}, defaultLauncherLayout(), [healthTracker()])
  let layout: LauncherLayout
  try {
    f.control('Edit home screen').click(); f.control('Add widget').click(); f.control('Add Health widget').click()
    expect(f.view.querySelector('[data-tracker-widget="health"]')?.textContent).toContain('75%')
    const size = [...f.view.querySelectorAll('select')].at(-1)!
    size.value = 'wide'; size.dispatchEvent(new f.dom.window.Event('change'))
    expect(f.view.querySelector('[data-tracker-widget="health"]')?.getAttribute('data-size')).toBe('wide')
    layout = structuredClone(f.ui.draft!)
    f.control('Add widget').click()
    expect(f.view.textContent).toContain('Every tracker already has a widget.')
  } finally { f.close() }
  const normal = fixture({}, layout!, [healthTracker()])
  try { normal.control('Open tracker: Health').click(); expect(normal.opened).toEqual(['tracker:health']) } finally { normal.close() }
  const missing = fixture({}, layout!)
  try {
    expect(missing.view.textContent).toContain('Tracker unavailable')
    missing.control('Edit home screen').click(); missing.control('Arrange Unavailable tracker widget').click(); missing.control('Remove Unavailable tracker widget').click()
    expect(missing.view.querySelector('[data-tracker-widget="health"]')).toBeNull()
  } finally { missing.close() }
})

test('automatic widgets refresh canonical readings without replacing their interactive button', async () => {
  const tracker = { ...healthTracker(), updateMode: 'automatic', ratePerHour: 0 } as PhoneTracker
  const layout = emptyLayout(); layout.pages[0].items.push({ id: 'health-widget', kind: 'tracker', trackerId: tracker.id, size: 'compact' })
  const f = fixture({}, layout, [tracker])
  try {
    const button = f.control('Open tracker: Health')
    tracker.value = 42
    await new Promise(resolve => setTimeout(resolve, 1100))
    expect(f.view.querySelector('.lp-launcher-widget')?.textContent).toContain('42%')
    expect(f.control('Open tracker: Health')).toBe(button)
    expect(f.ui.draft).toBeUndefined()
  } finally { f.close() }
})

test('capacity checks preserve items when folders are unpacked or a new shortcut cannot fit', () => {
  const layout = emptyLayout()
  layout.pages[0].items.push({ id: 'folder', kind: 'folder', name: 'Folder', apps: ['contacts', 'camera'] })
  for (let index = 0; index < MAX_LAUNCHER_ITEMS - 3; index++) layout.pages[0].items.push({ id: `widget-${index}`, kind: 'tracker', trackerId: `tracker-${index}`, size: 'compact' })
  expect(normalizeLauncherLayout(layout)).toEqual(layout)
  expect(placeLauncherApp(layout, 'settings', 'home')).toEqual(layout)
  const unpacked = removeLauncherItem(layout, 'folder')
  expect(normalizeLauncherLayout(unpacked)).toEqual(unpacked)
  expect(homeApps(unpacked)).toEqual(['contacts', 'camera'])
  expect(homeApps(placeLauncherApp(unpacked, 'settings', 'home'))).toContain('settings')
  const collision = emptyLayout()
  collision.pages[0].items.push({ id: 'folder', kind: 'folder', name: 'Folder', apps: ['contacts'] }, { id: 'app-contacts', kind: 'tracker', trackerId: 'health', size: 'compact' })
  const released = removeLauncherItem(collision, 'folder')
  expect(new Set(released.pages[0].items.map(item => item.id)).size).toBe(2)
})

test('duplicate folder names and missing widgets have distinct accessible actions', () => {
  const layout = emptyLayout()
  layout.pages[0].items.push({ id: 'one', kind: 'folder', name: 'Social', apps: [] }, { id: 'two', kind: 'folder', name: 'Social', apps: [] }, { id: 'missing-one', kind: 'tracker', trackerId: 'gone-one', size: 'compact' }, { id: 'missing-two', kind: 'tracker', trackerId: 'gone-two', size: 'compact' })
  const f = fixture({}, layout)
  try {
    const names = [...f.view.querySelectorAll('[aria-label]')].map(node => node.getAttribute('aria-label'))
    expect(new Set(names).size).toBe(names.length)
    f.control('Open folder: Social (Home, position 2)').click()
    f.control('Close folder').dispatchEvent(new f.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(f.dom.window.document.activeElement).toBe(f.control('Open folder: Social (Home, position 2)'))
  } finally { f.close() }
})

test('screen limit is enforced in Edit and cancel restores the saved screen list', () => {
  const f = fixture()
  try {
    f.control('Edit home screen').click()
    for (let screen = 2; screen <= 8; screen++) f.control('Add Home screen').click()
    expect(f.ui.draft!.pages).toHaveLength(8)
    expect(f.control('Add Home screen').disabled).toBe(true)
    f.control('Cancel layout changes').click()
    expect(f.view.querySelectorAll('.lp-launcher-pages button')).toHaveLength(1)
    expect(f.saved).toEqual([])
  } finally { f.close() }
})

for (const [kind, name, app] of [['weather', 'Weather', 'weather'], ['clock', 'Clock & date', 'calendar']] as const) test(`${name} is an optional widget confined to its chosen screen`, () => {
  const layout = emptyLayout(); layout.pages.push({ id: 'second', name: 'Screen 2', items: [] })
  const f = fixture({}, layout)
  let saved: LauncherLayout
  try {
    expect(f.view.querySelector('.lp-home-head')).toBeNull()
    expect(f.view.querySelector('.lp-launcher-widget')).toBeNull()
    f.control('Edit home screen').click(); f.control('Add widget').click(); f.control(`Add ${name} widget`).click()
    f.place(`${name} widget`, 'page:second')
    const size = [...f.view.querySelectorAll('select')].find(select => select.dataset.launcherFocus === `Widget size: ${name}`)!
    size.value = 'wide'; size.dispatchEvent(new f.dom.window.Event('change'))
    expect(f.view.querySelector('[data-system-widget]')?.getAttribute('data-size')).toBe('wide')
    f.control('Add widget').click()
    expect([...f.view.querySelectorAll('button')].some(button => button.getAttribute('aria-label') === `Add ${name} widget`)).toBe(false)
    f.control('Close widget picker').click(); f.control('Save home layout').click()
    saved = f.saved[0] as LauncherLayout
    expect(normalizeLauncherLayout(saved)).toEqual(saved)
    expect(saved.pages[1].items[0]).toMatchObject({ kind, size: 'wide' })
  } finally { f.close() }
  const normal = fixture({}, saved!)
  try {
    expect(normal.view.querySelector('.lp-launcher-widget')).toBeNull()
    normal.control('Go to Home screen 2: Screen 2').click(); normal.control(`Open ${name} widget`).click()
    expect(normal.opened).toEqual([app])
    normal.control('Edit home screen').click(); normal.control(`Arrange ${name} widget`).click(); normal.control(`Remove ${name} widget`).click()
    expect(normal.view.querySelector('.lp-launcher-widget')).toBeNull()
  } finally { normal.close() }
})

test('system widgets use current story data and preserve approximate clock labels', () => {
  const layout = emptyLayout(); layout.pages[0].items.push({ id: 'weather', kind: 'weather', size: 'compact' }, { id: 'clock', kind: 'clock', size: 'compact' })
  const f = fixture({}, layout)
  try {
    f.state.weather.temperature = -4; f.state.weather.condition = 'Snow'
    f.state.roleplayClockSource = 'narrative'; f.state.roleplayClockPrecision = 'relative'; f.state.roleplayClockLabel = 'Afternoon'
    f.control('Edit home screen').click()
    expect(f.view.querySelector('.lp-launcher-weather-card')?.textContent).toContain('-4°C')
    expect(f.view.querySelector('[data-weather-kind]')?.getAttribute('data-weather-kind')).toBe('snow')
    expect(f.view.querySelector('.lp-launcher-clock-time')?.textContent).toBe('Afternoon')
    f.state.roleplayClockLabel = 'invented time prose'
    f.control('Cancel layout changes').click()
    expect(f.view.querySelector('.lp-launcher-clock-time')?.textContent).toBe('Story time')
  } finally { f.close() }
  layout.pages.push({ id: 'second', name: 'Screen 2', items: [{ id: 'weather-duplicate', kind: 'weather', size: 'wide' }, { id: 'clock-duplicate', kind: 'clock', size: 'wide' }] })
  expect(normalizeLauncherLayout(layout).pages[1].items).toEqual([])
})

test('fresh layouts include clock/weather while saved opt-outs remain removed', () => {
  const layout = defaultLauncherLayout()
  expect(layout.pages[0].items.slice(0, 2).map(item => item.kind)).toEqual(['clock', 'weather'])
  expect(layout.pages[0].items[1]).toMatchObject({ kind: 'weather', variant: 'stripe' })
  const f = fixture({}, layout)
  let saved: LauncherLayout
  try {
    expect(f.view.querySelector('.lp-launcher-clock-card h3')).toBeNull()
    f.control('Edit home screen').click(); f.control('Arrange Weather widget').click()
    const variant = [...f.view.querySelectorAll('select')].find(select => select.dataset.launcherFocus === 'Weather layout')!
    variant.value = 'stripe'; variant.dispatchEvent(new f.dom.window.Event('change'))
    expect(f.ui.draft!.pages[0].items.find(item => item.kind === 'weather')).toMatchObject({ variant: 'stripe' })
    expect(normalizeLauncherLayout(f.ui.draft!)).toEqual(f.ui.draft!)
    f.control('Remove Weather widget').click(); f.control('Arrange Clock & date widget').click(); f.control('Remove Clock & date widget').click()
    f.control('Save home layout').click(); saved = f.saved[0] as LauncherLayout
    expect(normalizeLauncherLayout(saved).pages[0].items.some(item => item.kind === 'weather' || item.kind === 'clock')).toBe(false)
  } finally { f.close() }
  const reopened = fixture({}, saved!)
  try { expect(reopened.view.querySelector('[data-system-widget]')).toBeNull() } finally { reopened.close() }
})

test('app installation is per phone, preserves layout placements, and protects system apps', () => {
  const layout = defaultLauncherLayout(), removed = setPocketAppInstalled(layout, 'weather', false)
  expect(pocketAppInstalled(removed, 'weather')).toBe(false)
  expect(pocketAppInstalled(layout, 'weather')).toBe(true)
  expect(removed.pages).toEqual(layout.pages)
  expect(setPocketAppInstalled(removed, 'weather', true).pages).toEqual(layout.pages)
  for (const app of ['appstore', 'messages', 'contacts', 'settings'] as const) expect(pocketAppInstalled(setPocketAppInstalled(removed, app, false), app)).toBe(true)
  expect(normalizeLauncherLayout(removed)).toEqual(removed)
  const custom = emptyLayout()
  expect(homeApps(setPocketAppInstalled(custom, 'camera', true))).toContain('camera')
})

test('removed apps and their widgets disappear from the launcher and return in their original positions', () => {
  const removed = setPocketAppInstalled(defaultLauncherLayout(), 'weather', false)
  const f = fixture({}, removed)
  try {
    expect(f.view.querySelector('[data-system-widget="weather"]')).toBeNull()
    expect([...f.view.querySelectorAll('button')].some(button => button.getAttribute('aria-label') === 'Weather')).toBe(false)
    f.control('Open app drawer').click()
    expect([...f.view.querySelectorAll('button')].some(button => button.getAttribute('aria-label') === 'Weather')).toBe(false)
    f.control('Open App Store').click(); expect(f.opened).toEqual(['appstore'])
  } finally { f.close() }
})
