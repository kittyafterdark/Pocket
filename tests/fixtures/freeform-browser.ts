import { setup } from '../../src/frontend.js'
import { freeformHost } from './freeform-host.js'

const host = freeformHost(JSON.parse(localStorage.getItem('freeform-fixture-store') || '[]'), entries => localStorage.setItem('freeform-fixture-store', JSON.stringify(entries)))
// The real backend runs in Bun, whose timers do not require a Window receiver.
// Give the browser-hosted backend the same timer behavior for composer callbacks.
globalThis.setTimeout = window.setTimeout.bind(window)
globalThis.clearTimeout = window.clearTimeout.bind(window)
await import('../../src/backend.js')
const style = document.createElement('style')
style.textContent = `:root{--app-interactive-safe-top:47px;--lumiverse-bg:#17151c;--lumiverse-bg-elevated:#211e29;--lumiverse-text:#efedf4;--lumiverse-text-muted:#aaa5b7;--lumiverse-primary:#b6a5ee;--lumiverse-border:#ffffff18;--lumiverse-fill-subtle:#ffffff05;--lumiverse-fill:#ffffff0c}body{margin:0;background:#141218;color:#eee;font-family:system-ui}#fixture-drawer{position:absolute;top:var(--app-interactive-safe-top);bottom:0;left:0;width:min(380px,100vw);overflow:auto;border-right:1px solid #ffffff15}#fixture-dock{position:fixed;top:47px;bottom:20px;left:410px;width:390px;display:grid;place-items:center}#fixture-mobile{position:fixed;inset:0;z-index:10}#fixture-floating{position:fixed;right:20px;bottom:20px}dialog{box-sizing:border-box;background:#211e29;color:#eee;border:1px solid #ffffff20;border-radius:18px;padding:22px;max-width:calc(100vw - 32px);max-height:calc(100dvh - var(--app-interactive-safe-top) - 24px);top:var(--app-interactive-safe-top);overflow:auto}dialog::backdrop{background:#0009}`
document.head.append(style)
const drawer = document.createElement('aside'), dock = document.createElement('div'), mobile = document.createElement('div'), floating = document.createElement('div')
drawer.id = 'fixture-drawer'; dock.id = 'fixture-dock'; mobile.id = 'fixture-mobile'; floating.id = 'fixture-floating'
mobile.hidden = true; document.body.append(drawer, dock, mobile, floating)
const events = new Map<string, () => void>()
let receive: (payload: any) => void = () => {}, activated = () => {}
const widget = (root: HTMLElement) => ({ root, widgetId: root.id, moveTo() {}, getPosition: () => ({ x: 10, y: 10 }), onDragEnd: () => () => {},
  setVisible: (show: boolean) => { root.hidden = !show }, isVisible: () => !root.hidden, isFullscreen: () => innerWidth < 600, setFullscreen() {}, setSize() {}, setTouchScrollMode() {}, destroy() { root.replaceChildren(); root.hidden = true } })
const ctx: any = {
  components: { mountModelCombobox(target: HTMLElement, options: any) {
    const input = document.createElement('input'); input.value = options.value || ''; input.disabled = Boolean(options.disabled); input.setAttribute('aria-label', 'Model override'); input.onchange = () => options.onChange(input.value); target.append(input)
    return { destroy() { input.remove() } }
  } },
  dom: { addStyle(css: string) { const sheet = document.createElement('style'); sheet.textContent = css; document.head.append(sheet); return () => sheet.remove() }, findMessageElement: () => null, uninject: (node: HTMLElement) => node.remove() },
  ui: {
    registerDrawerTab: () => ({ root: drawer, setBadge() {}, activate() { activated() }, onActivate(handler: () => void) { activated = handler; return () => { activated = () => {} } }, destroy() { drawer.replaceChildren() } }),
    registerInputBarAction: () => ({ onClick: () => () => {}, destroy() {}, setLabel() {}, setSubtitle() {}, setEnabled() {} }),
    createFloatWidget: (options: any) => widget(options.width === 58 ? floating : mobile),
    requestDockPanel: () => ({ root: dock, expand() { dock.hidden = false }, collapse() { dock.hidden = true }, onVisibilityChange: () => () => {}, setSize() {}, destroy() { dock.hidden = true } }),
    showModal(options: any) {
      const root = document.createElement('dialog'); root.setAttribute('aria-label', options.title); root.style.width = options.width + 'px'
      const previous = document.activeElement as HTMLElement
      const dismissHandlers=new Set<()=>void>()
      const dismiss = () => { root.close(); root.remove();for(const handler of dismissHandlers)handler(); previous?.focus() }
      root.addEventListener('cancel',event=>{event.preventDefault();dismiss()})
      const heading = document.createElement('h2'); heading.textContent = options.title; heading.style.cssText = 'font-size:18px;margin:0 0 18px;line-height:1.3'
      const close = document.createElement('button'); close.textContent = 'Close dialog'; close.onclick = dismiss
      close.style.cssText = 'display:block;margin:0 0 18px 0;background:transparent;color:inherit;border:0;font:inherit;min-height:44px'
      root.append(heading, close); document.body.append(root); root.showModal(); return { root, dismiss,onDismiss(handler:()=>void){dismissHandlers.add(handler);return()=>dismissHandlers.delete(handler)} }
    },
  },
  messages: { registerTagInterceptor: () => () => {}, getLatestMessageId: () => null },
  events: { on(name: string, callback: () => void) { events.set(name, callback); return () => events.delete(name) } },
  permissions: { getGranted: async () => ['ui_panels'] },
  getActiveChat: host.activeChat,
  sendToBackend(payload: any) { setTimeout(() => { void host.send(payload) }, 0) },
  onBackendMessage(handler: typeof receive) { receive = handler; return () => { receive = () => {} } },
  uploads: { async pickFile() { return [{name:'fixture-photo.png',mimeType:'image/png',bytes:new Uint8Array([1,2,3])}] } },
  ready() {},
}
host.connect(payload => receive(payload))
let cleanup = setup(ctx)
;(window as any).freeformFixture = {
  host,
  switchChat(id: string) { host.switchChat(id); events.get('CHAT_SWITCHED')?.(); void host.emit('CHAT_SWITCHED', { chatId: id }) },
  switchPersona(id: string) { host.switchPersona(id); void host.emit('PERSONA_CHANGED') },
  remount() { cleanup(); mobile.hidden = true; floating.hidden = false; cleanup = setup(ctx) },
  send(payload: any) { return host.send(payload) },
}
