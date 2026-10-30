import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { setupPhone } from '../src/frontend/controller.js'
import { resolveLauncherPosition } from '../src/frontend/surface.js'

const settle = () => new Promise(resolve => setTimeout(resolve, 25))

async function fixture(width = 1100, hostClampsToScale = false, nativeGeometry = false) {
  const dom = new JSDOM('<body></body>', { url: 'http://localhost/', pretendToBeVisual: true })
  const win = dom.window
  Object.defineProperty(win, 'innerWidth', { configurable: true, value: width })
  if (hostClampsToScale) win.document.documentElement.style.setProperty('--lumiverse-ui-scale', '1.25')
  win.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as any
  win.HTMLElement.prototype.animate = (() => ({ cancel() {}, finished: Promise.resolve() })) as any
  const bindings = {
    window: win, document: win.document, HTMLElement: win.HTMLElement,
    HTMLInputElement: win.HTMLInputElement, HTMLTextAreaElement: win.HTMLTextAreaElement,
    MutationObserver: win.MutationObserver, getComputedStyle: win.getComputedStyle.bind(win),
    requestAnimationFrame: win.requestAnimationFrame.bind(win), cancelAnimationFrame: win.cancelAnimationFrame.bind(win),
  }
  const previous = new Map(Object.keys(bindings).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(bindings)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  const root = win.document.createElement('div'), drawer = win.document.createElement('div')
  win.document.body.append(root, drawer)
  let position = { x: 0, y: 0 }
  const moves: Array<{ x: number; y: number }> = []
  const sends: any[] = []
  let modalOpen = false, cutoff = false, dragEnd: (() => void) | undefined
  const hostPosition = (requested: { x: number; y: number }) => {
    if (!hostClampsToScale) return requested
    const scale = Number.parseFloat(win.getComputedStyle(win.document.documentElement).getPropertyValue('--lumiverse-ui-scale')) || 1
    return { x: Math.min(requested.x, win.innerWidth / scale - 58), y: requested.y }
  }
  const widget = {
    root, widgetId: 'fixture-launcher', getPosition: () => ({ ...position }),
    moveTo(x: number, y: number) {
      position = hostPosition({ x, y }); moves.push(position)
      // Model the actual host path: immutable widget update -> App rerender ->
      // ModalShell effect cleanup/reapply. Bound the old bug so tests cannot hang.
      if (moves.length > 20) { cutoff = true; modalOpen = false }
      if (modalOpen) { win.document.body.style.overflow = ''; win.document.body.style.overflow = 'hidden' }
    },
    onDragEnd(handler: () => void) { dragEnd = handler; return () => { dragEnd = undefined } },
    setVisible() {}, isVisible: () => true, destroy() {},
  }
  const events = new Map<string, () => void>()
  const ctx: any = {
    ui: {
      ...(nativeGeometry ? { geometry: { layoutViewportSize: () => {
        const scale = Number.parseFloat(win.getComputedStyle(win.document.documentElement).getPropertyValue('--lumiverse-ui-scale')) || 1
        return { width: win.innerWidth / scale, height: win.innerHeight / scale }
      } } } : {}),
      registerDrawerTab: () => ({ root: drawer, setBadge() {}, activate() {}, onActivate: () => () => {}, destroy() {} }),
      registerInputBarAction: () => ({ onClick: () => () => {}, destroy() {}, setLabel() {}, setSubtitle() {}, setEnabled() {} }),
      createFloatWidget(options: any) { position = hostPosition({ ...options.initialPosition }); return widget },
    },
    dom: { findMessageElement: () => null, uninject: (node: Element) => node.remove() },
    messages: { registerTagInterceptor: () => () => {}, getLatestMessageId: () => null },
    events: { on(name: string, callback: () => void) { events.set(name, callback); return () => { events.delete(name) } } },
    permissions: { getGranted: async () => ['ui_panels'] },
    getActiveChat: () => ({ chatId: 'fixture-chat', characterId: 'fixture-character' }),
    sendToBackend: (payload: any) => sends.push(payload), onBackendMessage: () => () => {}, ready() {},
  }
  let cleanup = setupPhone(ctx)
  await settle()
  return {
    win, moves, sends, position: () => position, cutoff: () => cutoff,
    modal(open: boolean) { modalOpen = open; win.document.body.style.overflow = open ? 'hidden' : '' },
    resize(nextWidth: number) { Object.defineProperty(win, 'innerWidth', { configurable: true, value: nextWidth }); win.dispatchEvent(new win.Event('resize')) },
    drag(next: { x: number; y: number }) { position = next; dragEnd?.() },
    switchChat() { events.get('CHAT_SWITCHED')?.() },
    unmount() { cleanup(); cleanup = () => {} },
    async remount() { cleanup(); cleanup = setupPhone(ctx); await settle() },
    close() {
      cleanup(); win.close()
      for (const [key, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete (globalThis as any)[key]
      }
    },
  }
}

for (const width of [1100, 390]) test(`confirmation scroll lock settles without launcher feedback at width ${width}`, async () => {
  const f = await fixture(width)
  try {
    f.modal(true); await settle()
    expect(f.cutoff()).toBe(false)
    expect(f.moves).toHaveLength(0)
    f.modal(false); await settle()
    f.modal(true); await settle()
    expect(f.moves).toHaveLength(0)
    // Root style changes also reach the same observer, including UI-scale changes.
    f.win.document.documentElement.style.setProperty('--lumiverse-ui-scale', '1.25')
    await settle()
    expect(f.moves).toHaveLength(1)
    expect(f.position()).toEqual(resolveLauncherPosition(null, { width: width / 1.25, height: f.win.innerHeight / 1.25 }))
    f.modal(false); f.modal(true); await settle()
    expect(f.moves).toHaveLength(1)
  } finally { f.close() }
})

test('scroll locks cannot loop when UI scale makes the host clamp requested coordinates', async () => {
  const f = await fixture(1100, true)
  try {
    f.modal(true); await settle()
    expect(f.cutoff()).toBe(false)
    expect(f.moves).toHaveLength(0)
    f.win.document.body.classList.add('confirmation-open')
    f.win.document.documentElement.style.setProperty('--unrelated-theme-token', 'red')
    await settle()
    expect(f.moves).toHaveLength(0)
    f.win.document.documentElement.style.setProperty('--lumiverse-ui-scale', '1.5')
    await settle()
    expect(f.cutoff()).toBe(false)
    expect(f.moves).toHaveLength(1)
    expect(f.position()).toEqual(resolveLauncherPosition(null, { width: 1100 / 1.5, height: f.win.innerHeight / 1.5 }))
  } finally { f.close() }
})

test('real viewport changes move once, while modal feedback and repeated resizes settle', async () => {
  const f = await fixture()
  try {
    f.modal(true)
    f.resize(390); await settle()
    expect(f.cutoff()).toBe(false)
    expect(f.moves).toHaveLength(1)
    expect(f.position()).toEqual(resolveLauncherPosition(null))
    f.resize(390); await settle()
    expect(f.moves).toHaveLength(1)
    f.resize(1100); await settle()
    expect(f.moves).toHaveLength(2)
    f.switchChat(); await settle()
    expect(f.moves).toHaveLength(2)
    f.unmount()
    f.resize(390); await settle()
    expect(f.moves).toHaveLength(2)
    await f.remount()
    f.modal(false); f.modal(true); await settle()
    expect(f.moves).toHaveLength(2)
  } finally { f.close() }
})

test('drag persistence survives and a saved offscreen position still reclamps', async () => {
  const f = await fixture()
  try {
    f.drag({ x: 900, y: 100 })
    await new Promise(resolve => setTimeout(resolve, 300))
    const saved = f.sends.findLast(message => message.type === 'lumiphone:save_preferences')
    expect(saved.preferences.launcherPosition).toEqual({ x: 900, y: 100 })
    f.modal(true); await settle()
    expect(f.moves).toHaveLength(0)
    f.resize(390); await settle()
    expect(f.moves).toHaveLength(1)
    expect(f.position()).toEqual(resolveLauncherPosition(saved.preferences.launcherPosition))
    expect(f.cutoff()).toBe(false)
    f.resize(1100); await settle()
    expect(f.position()).toEqual({ x: 900, y: 100 })
    expect(f.moves).toHaveLength(2)
  } finally { f.close() }
})


for (const native of [false, true]) test(`reduced host UI scale preserves edge drag coordinates with ${native ? 'native geometry' : 'legacy fallback'}`, async () => {
  const f = await fixture(1100, true, native)
  try {
    f.win.document.documentElement.style.setProperty('--lumiverse-ui-scale', '.7'); await settle()
    const right = { x: 1100 / .7 - 70, y: 120 }
    f.drag(right); await new Promise(resolve => setTimeout(resolve, 300))
    const saved = f.sends.findLast(message => message.type === 'lumiphone:save_preferences')
    expect(saved.preferences.launcherPosition).toEqual(right)
    const before = f.moves.length
    f.resize(1100); await settle()
    expect(f.position()).toEqual(right); expect(f.moves).toHaveLength(before)
    f.win.document.documentElement.style.setProperty('--lumiverse-ui-scale', '1.3'); await settle()
    expect(f.position()).toEqual(resolveLauncherPosition(right, { width: 1100 / 1.3, height: f.win.innerHeight / 1.3 }))
    f.modal(true); await settle(); expect(f.cutoff()).toBe(false)
  } finally { f.close() }
})
