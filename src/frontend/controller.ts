import type {
  CalendarEvent,
  DevicePreferences,
  GalleryResult,
  PhoneApp,
  PhoneCapabilities,
  PhoneContact,
  PhoneNote,
  PocketActivity,
  PocketRoute,
  PhoneState,
  PhoneTracker,
  SwarmVisualProfile,
} from '../types.js'
import { defaultPreferences, normalizePreferences, wallpaperCss } from '../domain/preferences.js'
import { normalizePocketRoute } from '../domain/navigation.js'
import { applyMobilePhoneSurface, calculatePhoneSurface, currentViewport, desktopDockSize } from './surface.js'
import { renderSettingsView } from './apps/settings.js'
import { renderTrackersView } from './apps/trackers.js'
import { renderMessagesView } from './apps/messages.js'
import { activityReceipt } from './activity.js'
import { button, dateTimeLocal, el, formatDate, formatTime, inputValue, requestId } from './shared.js'
import type {
  SpindleDrawerTabHandle,
  SpindleDockPanelHandle,
  SpindleFloatWidgetHandle,
  SpindleFrontendContext,
} from 'lumiverse-spindle-types'

type Cleanup = () => void
type BackendPayload = Record<string, any>

const PHONE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.7" y="2.5" width="10.6" height="19" rx="2.6"/><path d="M10 5h4M10.7 18.7h2.6"/></svg>'

const ICONS: Record<string, string> = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 10 8.5-7 8.5 7v9.5a1.5 1.5 0 0 1-1.5 1.5h-5v-6H10v6H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
  messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.6A8 8 0 1 1 20.5 11.5Z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4.5 18 4.7-4.7 3.1 3.1 2.2-2.2 5 5"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/></svg>',
  weather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18.5h9a4 4 0 0 0 .4-8A6 6 0 0 0 6 12.5a3 3 0 0 0 2 6Z"/><path d="M8 5V3M4.5 7 3 5.5M11.5 7 13 5.5"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3"/></svg>',
  trackers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6v.2H10V21a1.8 1.8 0 0 0-1.1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1L4 17.1l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.9h-.2V10H3a1.8 1.8 0 0 0 1.6-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1L6.9 4l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 3V2.8h4V3a1.8 1.8 0 0 0 1.1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1L20 6.9l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.1h.2V14h-.2a1.8 1.8 0 0 0-1.7 1Z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21 3-7.2 18-3.2-7.6L3 10zM10.6 13.4 21 3"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5c.5 4.2 2.8 6.5 7 7-4.2.5-6.5 2.8-7 7-.5-4.2-2.8-6.5-7-7 4.2-.5 6.5-2.8 7-7Z"/><path d="M19 16.5c.2 2 1.3 3.1 3 3.3-1.7.2-2.8 1.3-3 3.2-.2-1.9-1.3-3-3-3.2 1.7-.2 2.8-1.3 3-3.3Z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>',
}

const APP_META: Array<{ app: PhoneApp; label: string; icon: string; dock?: boolean }> = [
  { app: 'messages', label: 'Messages', icon: 'messages', dock: true },
  { app: 'camera', label: 'Camera', icon: 'camera', dock: true },
  { app: 'gallery', label: 'Gallery', icon: 'gallery', dock: true },
  { app: 'notes', label: 'Notes', icon: 'notes', dock: true },
  { app: 'weather', label: 'Weather', icon: 'weather' },
  { app: 'calendar', label: 'Timeline', icon: 'calendar' },
  { app: 'trackers', label: 'Trackers', icon: 'trackers' },
  { app: 'settings', label: 'Settings', icon: 'settings' },
]

function icon(name: string): HTMLSpanElement {
  const node = el('span')
  node.innerHTML = ICONS[name] || ICONS.home
  return node
}

function iconButton(name: string, label: string): HTMLButtonElement {
  const node = button('', 'lp-button lp-button-icon')
  node.setAttribute('aria-label', label)
  node.appendChild(icon(name))
  return node
}

class PocketController {
  private ctx: SpindleFrontendContext
  private cleanups: Cleanup[] = []
  private drawer: SpindleDrawerTabHandle
  private dockPanel: SpindleDockPanelHandle | null = null
  private widget: SpindleFloatWidgetHandle | null = null
  private mobileWidget: SpindleFloatWidgetHandle | null = null
  private widgetRoot: HTMLDivElement | null = null
  private handsetHost: HTMLDivElement
  private launcher: HTMLButtonElement
  private launcherBadge: HTMLSpanElement
  private shell: HTMLDivElement
  private screen: HTMLElement
  private alert: HTMLElement
  private clock: HTMLSpanElement
  private expanded = false
  private currentApp: PhoneApp = 'home'
  private state: PhoneState | null = null
  private preferences: DevicePreferences = defaultPreferences()
  private caps: PhoneCapabilities | null = null
  private swarmProfile: SwarmVisualProfile | null = null
  private gallery: GalleryResult = { data: [], total: 0 }
  private galleryScope = 'chat'
  private selectedContactId = ''
  private selectedMessageId = ''
  private selectedNoteId = ''
  private selectedEventId = ''
  private selectedTrackerId = ''
  private selectedGalleryImageId = ''
  private selectedSettingsSection = ''
  private selectedTrackerView: 'detail' | 'config' = 'detail'
  private cameraPreview = ''
  private cameraProgress = ''
  private cameraBusy = false
  private cameraRequestId = ''
  private messageRequests = new Map<string, string>()
  private lastTagKeys = new Set<string>()
  private tagKeyOrder: string[] = []
  private destroyed = false
  private collapseTimer = 0
  private alertTimer = 0
  private launcherFocus: HTMLElement | null = null
  private suppressLauncherClick = false
  private launcherPointer: { x: number; y: number } | null = null
  private pendingRoute: PocketRoute | null = null
  private injectedActivities = new Map<string, Element>()
  private pendingActivities = new Map<string, PocketActivity>()
  private viewCleanups: Cleanup[] = []
  private receiptSweepTimer = 0

  constructor(ctx: SpindleFrontendContext) {
    this.ctx = ctx
    this.drawer = ctx.ui.registerDrawerTab({
      id: 'lumiphone',
      title: 'Pocket',
      shortName: 'Pocket',
      headerTitle: 'Pocket',
      description: 'Open the character-aware roleplay phone',
      keywords: ['phone', 'messages', 'camera', 'gallery', 'journal', 'calendar', 'timeline', 'tracker'],
      iconSvg: PHONE_ICON,
    })
    this.launcher = el('button', 'lumiphone-launcher')
    this.launcher.type = 'button'
    this.launcher.title = 'Open Pocket'
    this.launcher.setAttribute('aria-label', 'Open Pocket')
    this.launcher.innerHTML = PHONE_ICON
    this.launcherBadge = el('span', 'lumiphone-badge')
    this.launcherBadge.hidden = true
    this.launcher.appendChild(this.launcherBadge)
    this.handsetHost = el('div', 'lumiphone-widget-root lumiphone-handset-host')
    this.shell = el('div', 'lumiphone-shell')
    this.shell.hidden = true
    const status = el('div', 'lumiphone-statusbar')
    const dismiss = iconButton('back', 'Dismiss phone')
    dismiss.className = 'lumiphone-dismiss'
    dismiss.addEventListener('click', () => this.close())
    this.clock = el('span', 'lumiphone-time', formatTime(new Date()))
    const island = el('span', 'lumiphone-island')
    const signals = el('span', 'lumiphone-signals')
    const bars = el('span', 'lumiphone-signal-bars')
    for (let i = 0; i < 4; i += 1) bars.appendChild(el('i'))
    signals.append(bars, el('span', '', '5G'), el('span', 'lumiphone-battery'))
    status.append(dismiss, this.clock, island, signals)
    this.screen = el('main', 'lumiphone-screen')
    this.alert = el('div', 'lp-alert')
    this.alert.hidden = true
    const homebar = el('div', 'lumiphone-homebar')
    const homeButton = button('')
    homeButton.setAttribute('aria-label', 'Home or dismiss phone')
    homebar.appendChild(homeButton)
    this.shell.append(status, this.screen, homebar, this.alert)
    this.launcher.addEventListener('pointerdown', (event) => { this.launcherPointer = { x: event.clientX, y: event.clientY } })
    this.launcher.addEventListener('pointermove', (event) => {
      if (!this.launcherPointer) return
      if (Math.hypot(event.clientX - this.launcherPointer.x, event.clientY - this.launcherPointer.y) > 7) this.suppressLauncherClick = true
    })
    this.launcher.addEventListener('pointerup', () => { this.launcherPointer = null })
    this.launcher.addEventListener('pointercancel', () => { this.launcherPointer = null })
    this.launcher.addEventListener('click', (event) => {
      if (this.suppressLauncherClick) { event.preventDefault(); this.suppressLauncherClick = false; return }
      this.open()
    })
    homeButton.addEventListener('click', () => {
      if (this.currentApp !== 'home') this.openApp('home')
      else this.close()
    })
    this.installSwipeDismiss(status)
    this.renderDrawerLanding()
    this.installHostIntegrations()
    this.tickClock()
    this.refresh()
  }

  destroy(): void {
    this.destroyed = true
    window.clearTimeout(this.collapseTimer)
    window.clearTimeout(this.alertTimer)
    window.clearInterval(this.receiptSweepTimer)
    for (const cleanup of this.cleanups.splice(0)) {
      try { cleanup() } catch { /* best effort */ }
    }
    this.widget?.destroy()
    this.mobileWidget?.destroy()
    this.dockPanel?.destroy()
    for (const injected of this.injectedActivities.values()) this.ctx.dom.uninject(injected)
    this.injectedActivities.clear()
    for (const cleanup of this.viewCleanups.splice(0)) cleanup()
    this.drawer.destroy()
  }

  private installHostIntegrations(): void {
    this.cleanups.push(this.drawer.onActivate(() => {
      if (this.widget) this.open()
      else this.mountPhoneInDrawer()
    }))
    const action = this.ctx.ui.registerInputBarAction({
      id: 'open-lumiphone',
      label: 'Open Pocket',
      subtitle: 'Open the character-aware roleplay phone',
      iconSvg: PHONE_ICON,
    })
    this.cleanups.push(action.onClick(() => this.open()))
    this.cleanups.push(() => action.destroy())
    this.cleanups.push(this.ctx.messages.registerTagInterceptor(
      { tagName: 'lumi-phone', removeFromMessage: true },
      (payload) => {
        if (payload.isStreaming) return
        const key = `${payload.messageId || ''}:${payload.fullMatch}`
        if (this.lastTagKeys.has(key)) return
        this.lastTagKeys.add(key)
        this.tagKeyOrder.push(key)
        while (this.tagKeyOrder.length > 120) {
          const old = this.tagKeyOrder.shift()
          if (old) this.lastTagKeys.delete(old)
        }
        const active = this.ctx.getActiveChat()
        this.ctx.sendToBackend({
          type: 'lumiphone:model_action',
          requestId: requestId('tag'),
          chatId: payload.chatId || active.chatId,
          characterId: active.characterId,
          attrs: payload.attrs,
          content: payload.content,
          messageId: payload.messageId,
          fullMatch: payload.fullMatch,
          idempotencyKey: `tag:${payload.messageId || ''}:${payload.fullMatch}`,
        })
      },
    ))
    this.cleanups.push(this.ctx.onBackendMessage((payload) => this.onBackend(payload as BackendPayload)))
    this.cleanups.push(this.ctx.events.on('CHAT_SWITCHED', () => {
      this.pendingActivities.clear()
      this.refresh()
      window.setTimeout(() => this.sweepActivityReceipts(), 0)
    }))
    const returned = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.extensionId === 'lumiphone') this.refresh()
    }
    window.addEventListener('spindle:desktop-widget-returned', returned)
    this.cleanups.push(() => window.removeEventListener('spindle:desktop-widget-returned', returned))
    const resize = () => { if (this.expanded) this.resizeExpanded() }
    window.addEventListener('resize', resize)
    this.cleanups.push(() => window.removeEventListener('resize', resize))
    window.visualViewport?.addEventListener('resize', resize)
    this.cleanups.push(() => window.visualViewport?.removeEventListener('resize', resize))
    const keydown = (event: KeyboardEvent) => {
      if (!this.expanded) return
      if (event.key === 'Escape') {
        if (this.currentApp !== 'home') this.openApp('home')
        else this.close()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...this.shell.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
        .filter((node) => !node.hidden && node.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', keydown)
    this.cleanups.push(() => window.removeEventListener('keydown', keydown))
    void this.ensureWidget()
  }

  private async ensureWidget(): Promise<void> {
    if (this.widget) return
    try {
      const granted = await this.ctx.permissions.getGranted()
      if (!granted.includes('ui_panels')) return
      if (this.destroyed) return
      this.widget = this.ctx.ui.createFloatWidget({
        width: 58,
        height: 58,
        initialPosition: { x: Math.max(12, window.innerWidth - 82), y: Math.max(58, window.innerHeight * .22) },
        snapToEdge: true,
        tooltip: 'Pocket',
        chromeless: true,
        resizable: false,
        aspectLock: 9 / 16,
        persistGeometry: false,
      } as any)
      this.widgetRoot = el('div', 'lumiphone-widget-root')
      this.widget.root.appendChild(this.widgetRoot)
      this.widgetRoot.append(this.launcher)
      this.cleanups.push(this.widget.onDragEnd(() => {
        this.suppressLauncherClick = true
        window.setTimeout(() => { this.suppressLauncherClick = false }, 180)
      }))
      this.launcher.hidden = false
      this.renderDrawerLanding()
    } catch {
      this.widget = null
      this.mountPhoneInDrawer()
    }
  }

  private renderDrawerLanding(): void {
    this.drawer.root.replaceChildren()
    const outer = el('div', 'lumiphone-drawer')
    const card = el('div', 'lumiphone-drawer-card')
    const logo = el('div', 'lumiphone-drawer-icon')
    logo.innerHTML = PHONE_ICON
    const title = el('h2', 'lumiphone-drawer-title', 'Pocket')
    const copy = el('p', 'lumiphone-drawer-copy', 'A persistent phone for each chat and character—messages, photos, journals, roleplay weather, timeline events, and live trackers in one place.')
    const actions = el('div', 'lumiphone-drawer-actions')
    const open = button('Open phone', 'lumiphone-drawer-button')
    open.dataset.primary = 'true'
    open.addEventListener('click', () => this.open())
    const permission = button('Manage access', 'lumiphone-drawer-button')
    permission.addEventListener('click', () => this.requestPermissions())
    actions.append(open, permission)
    card.append(logo, title, copy, actions)
    outer.appendChild(card)
    this.drawer.root.appendChild(outer)
  }

  private ensureDockPanel(): SpindleDockPanelHandle | null {
    if (this.dockPanel) return this.dockPanel
    try {
      this.dockPanel = this.ctx.ui.requestDockPanel({
        edge: 'right', title: 'Pocket', size: desktopDockSize(this.preferences.handsetScale),
        minSize: 292, maxSize: 620, resizable: false, startCollapsed: true,
      })
      this.cleanups.push(this.dockPanel.onVisibilityChange((visible) => {
        if (!visible && this.expanded && !calculatePhoneSurface(this.preferences.handsetScale).fullscreen) {
          this.expanded = false
          this.shell.hidden = true
          this.launcher.hidden = false
        }
      }))
      return this.dockPanel
    } catch {
      this.dockPanel = null
      return null
    }
  }

  private ensureMobileWidget(): SpindleFloatWidgetHandle | null {
    if (this.mobileWidget) return this.mobileWidget
    try {
      const viewport = currentViewport()
      this.mobileWidget = this.ctx.ui.createFloatWidget({
        width: viewport.width, height: viewport.height, initialPosition: { x: 0, y: 0 },
        fullscreen: true, chromeless: true, snapToEdge: false, persistGeometry: false,
      } as any)
      this.mobileWidget.setVisible(false)
      return this.mobileWidget
    } catch {
      this.mobileWidget = null
      return null
    }
  }

  private mountInteractiveSurface(): boolean {
    const geometry = calculatePhoneSurface(this.preferences.handsetScale)
    if (geometry.fullscreen) {
      this.dockPanel?.collapse()
      const mobile = this.ensureMobileWidget()
      if (!mobile) return false
      mobile.root.replaceChildren(this.handsetHost)
      this.handsetHost.replaceChildren(this.shell)
      this.handsetHost.dataset.fullscreen = 'true'
      applyMobilePhoneSurface(mobile, this.preferences.handsetScale)
      mobile.setVisible(true)
      return true
    }
    if (this.mobileWidget) {
      this.mobileWidget.setFullscreen(false)
      this.mobileWidget.setVisible(false)
    }
    const panel = this.ensureDockPanel()
    if (!panel) return false
    panel.root.replaceChildren(this.handsetHost)
    this.handsetHost.replaceChildren(this.shell)
    this.handsetHost.dataset.fullscreen = 'false'
    const setSize = (panel as SpindleDockPanelHandle & { setSize?: (size: number) => void }).setSize
    if (typeof setSize === 'function') setSize.call(panel, desktopDockSize(this.preferences.handsetScale))
    panel.expand()
    const desktop = calculatePhoneSurface(this.preferences.handsetScale, currentViewport(), false)
    this.handsetHost.style.width = `${desktop.width}px`
    this.handsetHost.style.height = `${desktop.height}px`
    return true
  }

  private mountPhoneInDrawer(): void {
    if (this.widget && (this.dockPanel || this.mobileWidget)) return
    this.drawer.root.replaceChildren()
    const host = this.handsetHost
    const viewport = currentViewport()
    const geometry = calculatePhoneSurface(this.preferences.handsetScale, { width: Math.min(viewport.width, 620), height: Math.max(320, viewport.height - 130) }, false)
    host.style.width = geometry.fullscreen ? '100%' : `${geometry.width}px`
    host.style.height = geometry.fullscreen ? 'calc(100dvh - 110px)' : `${geometry.height}px`
    host.style.aspectRatio = '9 / 16'
    this.drawer.root.appendChild(host)
    host.replaceChildren(this.shell)
    this.launcher.hidden = true
    this.shell.hidden = false
    this.expanded = true
    this.render()
  }

  private async requestPermissions(): Promise<void> {
    try {
      await this.ctx.permissions.request([
        'ui_panels', 'chats', 'characters', 'personas', 'generation', 'tools', 'interceptor', 'images', 'image_gen', 'push_notification',
      ], { reason: 'Pocket uses these permissions for its launcher and handset, per-chat character state, generated text messages, model actions, gallery, camera, and optional push notifications.' })
      await this.ensureWidget()
      this.refresh()
    } catch (error) {
      this.showError(error instanceof Error ? error.message : String(error))
    }
  }

  private installSwipeDismiss(target: HTMLElement): void {
    let startX = 0
    let startY = 0
    let active = false
    target.addEventListener('pointerdown', (event) => {
      if ((event.target as Element | null)?.closest('button,input,select,textarea,a')) return
      startX = event.clientX
      startY = event.clientY
      active = true
    })
    target.addEventListener('pointerup', (event) => {
      if (!active) return
      active = false
      const dx = event.clientX - startX
      const dy = event.clientY - startY
      const dismissLeft = dx < -64 && Math.abs(dx) > Math.abs(dy) * 1.35
      const dismissUp = dy < -64 && Math.abs(dy) > Math.abs(dx) * 1.35
      if (dismissLeft || dismissUp) this.close()
    })
    target.addEventListener('pointercancel', () => { active = false })
  }

  private tickClock(): void {
    const timer = window.setInterval(() => {
      this.clock.textContent = formatTime(new Date())
    }, 30_000)
    this.cleanups.push(() => window.clearInterval(timer))
  }

  private activeContext(): { chatId: string | null; characterId: string | null } {
    const active = this.ctx.getActiveChat()
    return {
      chatId: active.chatId || this.state?.chatId || null,
      characterId: active.characterId || this.state?.characterId || null,
    }
  }

  private send(type: string, payload: Record<string, unknown> = {}): string {
    const context = this.activeContext()
    const id = String(payload.requestId || requestId())
    this.ctx.sendToBackend({ type, requestId: id, chatId: context.chatId, characterId: context.characterId, ...payload })
    return id
  }

  private refresh(): void {
    this.send('lumiphone:get_state')
  }

  private onBackend(payload: BackendPayload): void {
    if (!payload || typeof payload !== 'object' || typeof payload.type !== 'string') return
    if (payload.type === 'lumiphone:state' && payload.state) {
      const active = this.ctx.getActiveChat()
      if (active.chatId && payload.state.chatId !== active.chatId) return
      if (active.characterId && payload.state.characterId !== active.characterId) return
      const previousUnread = this.unreadCount()
      this.state = payload.state as PhoneState
      this.preferences = normalizePreferences(payload.preferences || this.preferences)
      this.caps = payload.capabilities || this.caps
      this.swarmProfile = payload.swarmProfile || this.swarmProfile
      for (const activity of this.state.activities || []) this.queueActivityReceipt(activity)
      this.applyAppearance()
      this.updateBadge()
      if (payload.open) this.open()
      const pending = this.pendingRoute
      this.pendingRoute = null
      if (pending) this.openPocket(pending)
      else if (this.expanded) this.render()
      if (this.unreadCount() > previousUnread && !this.expanded) this.launcher.animate([
        { transform: 'scale(1)' }, { transform: 'scale(1.13) rotate(-4deg)' }, { transform: 'scale(1)' },
      ], { duration: 420, easing: 'ease-out' })
      return
    }
    if (payload.type === 'lumiphone:activity' && payload.activity) {
      this.queueActivityReceipt(payload.activity as PocketActivity)
      return
    }
    if (payload.type === 'lumiphone:capabilities') {
      this.caps = payload.capabilities
      if (!this.caps?.panels && this.widget) {
        try { this.widget.destroy() } catch { /* host may already have closed it */ }
        this.widget = null
        this.widgetRoot = null
        this.expanded = false
        this.renderDrawerLanding()
      } else {
        void this.ensureWidget()
      }
      if (this.currentApp === 'settings') this.render()
      return
    }
    if (payload.type === 'lumiphone:gallery') {
      this.gallery = { data: payload.data || [], total: Number(payload.total) || 0 }
      if (this.currentApp === 'gallery') this.render()
      return
    }
    if (payload.type === 'lumiphone:swarm_profile') {
      this.swarmProfile = payload.profile
      if (this.currentApp === 'settings' || this.currentApp === 'camera') this.render()
      return
    }
    if (payload.type === 'lumiphone:camera_progress') {
      if (payload.requestId !== this.cameraRequestId) return
      this.cameraBusy = true
      this.cameraProgress = payload.message || (payload.phase === 'preview' ? 'Preview developing…' : 'Working…')
      if (payload.imageDataUrl) this.cameraPreview = payload.imageDataUrl
      if (payload.profile) this.swarmProfile = payload.profile
      if (this.currentApp === 'camera') this.render()
      return
    }
    if (payload.type === 'lumiphone:message_progress') {
      const active = this.activeContext()
      if (payload.chatId !== active.chatId || payload.characterId !== active.characterId) return
      if (payload.phase === 'done') this.messageRequests.delete(payload.requestId)
      else this.messageRequests.set(payload.requestId, payload.contactId)
      if (this.currentApp === 'messages') this.render()
      return
    }
    if (payload.type === 'lumiphone:camera_done') {
      if (payload.requestId !== this.cameraRequestId) return
      this.cameraBusy = false
      this.cameraProgress = 'Photo saved to Gallery'
      this.cameraPreview = payload.imageUrl || this.cameraPreview
      if (payload.profile) this.swarmProfile = payload.profile
      if (this.currentApp === 'camera') this.render()
      return
    }
    if (payload.type === 'lumiphone:camera_cancelled') {
      if (payload.requestId !== this.cameraRequestId) return
      this.cameraBusy = false
      this.cameraProgress = 'Cancelled'
      if (this.currentApp === 'camera') this.render()
      return
    }
    if (payload.type === 'lumiphone:export_data' && payload.data) {
      const blob = new Blob([JSON.stringify(payload.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `pocket-${this.state?.chatId || 'backup'}.json`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      return
    }
    if (payload.type === 'lumiphone:error') {
      if (payload.requestId === this.cameraRequestId) this.cameraBusy = false
      this.messageRequests.delete(payload.requestId)
      this.showError(payload.error || 'Pocket could not complete that action.')
      if (this.expanded) this.render()
    }
  }

  private unreadCount(): number {
    if (!this.state) return 0
    const notifications = this.state.notifications.filter((item) => !item.read).length
    const messages = this.state.contacts.reduce((sum, contact) => sum + contact.unread, 0)
    return Math.min(999, Math.max(notifications, messages))
  }

  private updateBadge(): void {
    const unread = this.unreadCount()
    this.launcherBadge.hidden = unread === 0
    this.launcherBadge.textContent = unread > 99 ? '99+' : String(unread)
    this.drawer.setBadge(unread ? (unread > 99 ? '99+' : String(unread)) : null)
  }

  private applyAppearance(): void {
    const settings = this.preferences
    this.shell.dataset.theme = settings.theme
    this.shell.style.setProperty('--lp-accent', settings.colors.accent)
    this.shell.style.setProperty('--lp-bezel', settings.colors.bezel)
    this.shell.style.setProperty('--lp-bg', settings.colors.background)
    this.shell.style.setProperty('--lp-surface', settings.colors.surface)
    this.shell.style.setProperty('--lp-text', settings.colors.text)
    this.shell.style.setProperty('--lp-wallpaper', wallpaperCss(settings.colors.wallpaperPrimary, settings.colors.wallpaperSecondary))
    this.shell.style.setProperty('--lp-chat-wallpaper', wallpaperCss(settings.colors.chatPrimary, settings.colors.chatSecondary))
    this.shell.style.setProperty('--lp-animation-ms', `${settings.reducedMotion ? 0 : settings.animationDurationMs}ms`)
    this.shell.dataset.reducedMotion = String(settings.reducedMotion)
  }

  private open(): void {
    if (!this.widget) {
      this.drawer.activate()
      this.mountPhoneInDrawer()
      return
    }
    this.expanded = true
    window.clearTimeout(this.collapseTimer)
    this.launcherFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!this.mountInteractiveSurface()) {
      this.expanded = false
      this.drawer.activate()
      this.mountPhoneInDrawer()
      return
    }
    this.launcher.hidden = true
    this.shell.hidden = false
    this.resizeExpanded()
    this.render()
    this.refresh()
    requestAnimationFrame(() => {
      this.shell.tabIndex = -1
      this.shell.focus({ preventScroll: true })
    })
  }

  private close(): void {
    if (!this.widget && !this.dockPanel && !this.mobileWidget) return
    this.expanded = false
    this.shell.hidden = true
    this.launcher.hidden = false
    this.dockPanel?.collapse()
    if (this.mobileWidget) {
      this.mobileWidget.setFullscreen(false)
      this.mobileWidget.setVisible(false)
    }
    window.clearTimeout(this.collapseTimer)
    this.collapseTimer = window.setTimeout(() => {
      this.launcherFocus?.focus({ preventScroll: true })
      this.launcherFocus = null
    }, this.preferences.reducedMotion || this.preferences.animation === 'none' ? 0 : this.preferences.animationDurationMs)
  }

  private resizeExpanded(): void {
    if (!this.expanded) return
    this.mountInteractiveSurface()
  }

  private openApp(app: PhoneApp): void {
    this.openPocket({ app } as PocketRoute)
  }

  private openPocket(routeInput: PocketRoute): void {
    const route = normalizePocketRoute(routeInput)
    if (!this.state) {
      this.pendingRoute = route
      this.open()
      this.refresh()
      return
    }
    if (!this.expanded) this.open()
    this.currentApp = route.app
    if (route.app === 'messages') {
      const contact = route.contactId ? this.state.contacts.find((entry) => entry.id === route.contactId) : null
      this.selectedContactId = contact?.id || ''
      this.selectedMessageId = contact && route.messageId && contact.messages.some((entry) => entry.id === route.messageId) ? route.messageId : ''
      this.send('lumiphone:mark_read', contact ? { app: 'messages', contactId: contact.id } : { app: 'messages' })
    } else if (route.app === 'trackers') {
      const tracker = route.trackerId ? this.state.trackers.find((entry) => entry.id === route.trackerId) : null
      this.selectedTrackerId = tracker?.id || ''
      this.selectedTrackerView = route.view || 'detail'
      this.send('lumiphone:mark_read', { app: 'trackers' })
    } else if (route.app === 'calendar') {
      this.selectedEventId = route.eventId && this.state.events.some((entry) => entry.id === route.eventId) ? route.eventId : ''
      this.send('lumiphone:mark_read', { app: 'calendar' })
    } else if (route.app === 'notes') {
      this.selectedNoteId = route.noteId && this.state.notes.some((entry) => entry.id === route.noteId) ? route.noteId : ''
      this.send('lumiphone:mark_read', { app: 'notes' })
    } else if (route.app === 'gallery') {
      this.selectedGalleryImageId = route.imageId || ''
      this.requestGallery(this.galleryScope)
      this.send('lumiphone:mark_read', { app: 'gallery' })
    } else if (route.app === 'settings') {
      this.selectedSettingsSection = route.section || ''
      this.send('lumiphone:mark_read', { app: 'settings' })
    } else if (route.app !== 'home') {
      this.send('lumiphone:mark_read', { app: route.app })
    }
    this.render()
  }

  private queueActivityReceipt(activity: PocketActivity): void {
    const active = this.activeContext()
    if (activity.scope.chatId !== active.chatId || activity.scope.characterId !== active.characterId) return
    if (this.injectedActivities.has(activity.id) || !activity.source?.messageId) return
    this.pendingActivities.set(activity.id, activity)
    this.sweepActivityReceipts()
  }

  private sweepActivityReceipts(): void {
    for (const [activityId, activity] of this.pendingActivities) {
      const injected = activityReceipt(this.ctx, activity, (route) => this.openPocket(route))
      if (!injected) continue
      this.pendingActivities.delete(activityId)
      this.injectedActivities.set(activityId, injected)
    }
    if (this.pendingActivities.size && !this.receiptSweepTimer) {
      this.receiptSweepTimer = window.setInterval(() => {
        if (!this.pendingActivities.size) {
          window.clearInterval(this.receiptSweepTimer)
          this.receiptSweepTimer = 0
          return
        }
        this.sweepActivityReceipts()
      }, 1_500)
    }
  }

  private render(): void {
    for (const cleanup of this.viewCleanups.splice(0)) cleanup()
    if (!this.state) {
      this.screen.replaceChildren(this.loadingView())
      return
    }
    this.applyAppearance()
    const view = this.currentApp === 'home' ? this.renderHome()
      : this.currentApp === 'messages' ? this.renderMessages()
      : this.currentApp === 'gallery' ? this.renderGallery()
      : this.currentApp === 'camera' ? this.renderCamera()
      : this.currentApp === 'notes' ? this.renderNotes()
      : this.currentApp === 'weather' ? this.renderWeather()
      : this.currentApp === 'calendar' ? this.renderCalendar()
      : this.currentApp === 'trackers' ? this.renderTrackers()
      : this.renderSettings()
    view.classList.add('lumiphone-app-view')
    const animation = this.preferences.reducedMotion ? 'none' : this.preferences.animation
    if (animation !== 'none') {
      view.dataset.animate = animation
      view.addEventListener('animationend', () => view.removeAttribute('data-animate'), { once: true })
    }
    this.screen.replaceChildren(view)
  }

  private loadingView(): HTMLElement {
    const node = el('div', 'lp-page lp-empty')
    const inner = el('div')
    inner.innerHTML = `${PHONE_ICON}<p>Waking Pocket…</p>`
    node.appendChild(inner)
    return node
  }

  private page(title: string, subtitle = '', rightLabel = '', onRight?: () => void): { page: HTMLDivElement; content: HTMLDivElement } {
    const page = el('div', 'lp-page')
    const nav = el('header', 'lp-nav')
    const back = button('‹ Home', 'lp-nav-action')
    back.addEventListener('click', () => this.openApp('home'))
    const heading = el('div', 'lp-nav-title', title)
    if (subtitle) heading.appendChild(el('span', 'lp-nav-subtitle', subtitle))
    const right = button(rightLabel, 'lp-nav-action')
    if (rightLabel && onRight) right.addEventListener('click', onRight)
    else right.disabled = true
    nav.append(back, heading, right)
    const content = el('div', 'lp-content')
    page.append(nav, content)
    return { page, content }
  }

  private renderHome(): HTMLDivElement {
    const state = this.state!
    const home = el('div', 'lp-home')
    const head = el('div', 'lp-home-head')
    const left = el('div')
    left.append(el('div', 'lp-home-date', formatDate(state.roleplayNow, false)), el('div', 'lp-home-clock', formatTime(state.roleplayNow)))
    const weather = el('button', 'lp-home-weather')
    weather.type = 'button'
    weather.append(icon('weather'), el('span', '', `${state.weather.temperature}°${state.weather.unit} · ${state.weather.condition}`))
    weather.addEventListener('click', () => this.openApp('weather'))
    head.append(left, weather)
    const grid = el('div', 'lp-app-grid')
    for (const meta of APP_META.filter((entry) => !entry.dock)) grid.appendChild(this.appIcon(meta))
    const activity = el('div', 'lp-home-activity')
    for (const item of [...(state.activities || [])].reverse().slice(0, 2)) {
      const receipt = button('', 'lp-home-activity-item')
      receipt.append(el('strong', '', item.title), el('span', '', item.summary || item.kind), el('span', 'lp-home-activity-arrow', '›'))
      receipt.setAttribute('aria-label', `Open ${item.title}`)
      receipt.addEventListener('click', () => this.openPocket(item.route))
      activity.appendChild(receipt)
    }
    const dock = el('div', 'lp-home-dock')
    for (const meta of APP_META.filter((entry) => entry.dock)) dock.appendChild(this.appIcon(meta))
    home.append(head, grid)
    if (activity.childElementCount) home.appendChild(activity)
    home.appendChild(dock)
    return home
  }

  private appIcon(meta: typeof APP_META[number]): HTMLButtonElement {
    const node = el('button', 'lp-app-icon')
    node.type = 'button'
    const box = el('span', `lp-app-icon-box lp-icon-${meta.icon}`)
    box.appendChild(icon(meta.icon))
    const unread = meta.app === 'messages'
      ? this.state!.contacts.reduce((sum, contact) => sum + contact.unread, 0)
      : this.state!.notifications.filter((item) => !item.read && item.app === meta.app).length
    if (unread) box.appendChild(el('span', 'lp-app-dot', unread > 99 ? '99+' : String(unread)))
    node.append(box, el('span', 'lp-app-label', meta.label))
    node.addEventListener('click', () => this.openApp(meta.app))
    return node
  }

  private renderMessages(): HTMLDivElement {
    return renderMessagesView({
      state: this.state!, selectedContactId: this.selectedContactId,
      selectedMessageId: this.selectedMessageId,
      generationAvailable: Boolean(this.caps?.generation), busyContacts: new Set(this.messageRequests.values()),
      page: (title, subtitle) => this.page(title, subtitle),
      empty: (title, copy) => this.empty('messages', title, copy), iconButton,
      selectContact: (contactId) => {
        this.selectedContactId = contactId
        this.selectedMessageId = ''
        if (contactId) this.send('lumiphone:mark_read', { app: 'messages', contactId })
        this.render()
      },
      send: (type, payload) => { this.send(type, payload) },
      generateReply: (contactId) => this.generateReply(contactId),
    })
  }

  private generateReply(contactId: string): void {
    if ([...this.messageRequests.values()].includes(contactId)) return
    const id = requestId('reply')
    this.messageRequests.set(id, contactId)
    this.send('lumiphone:generate_message', { requestId: id, contactId })
    this.render()
  }

  private requestGallery(scope: string): void {
    this.galleryScope = scope
    this.send('lumiphone:gallery_list', { scope })
  }

  private renderGallery(): HTMLDivElement {
    const { page, content } = this.page('Gallery', `${this.gallery.total} assets`, 'Refresh', () => this.requestGallery(this.galleryScope))
    const chips = el('div', 'lp-chipbar')
    for (const [scope, label] of [['chat', 'This chat'], ['character', 'Character'], ['phone', 'Pocket'], ['all', 'All']] as const) {
      const chip = button(label, 'lp-chip')
      chip.setAttribute('aria-pressed', String(this.galleryScope === scope))
      chip.addEventListener('click', () => this.requestGallery(scope))
      chips.appendChild(chip)
    }
    content.appendChild(chips)
    if (!this.caps?.images) {
      content.appendChild(this.empty('gallery', 'Gallery access is off', 'Grant Images permission from Settings to browse Lumiverse assets.'))
      return page
    }
    const grid = el('div', 'lp-gallery-grid')
    for (const item of this.gallery.data) {
      const tile = el('button', 'lp-gallery-item')
      tile.type = 'button'
      tile.dataset.selected = String(item.id === this.selectedGalleryImageId)
      if (item.id === this.selectedGalleryImageId) tile.setAttribute('aria-current', 'true')
      const image = el('img')
      image.loading = 'lazy'
      image.src = item.url
      image.alt = item.filename || 'Gallery image'
      image.addEventListener('error', () => {
        tile.dataset.missing = 'true'
        image.replaceWith(el('span', 'lp-gallery-missing', 'Image unavailable'))
      }, { once: true })
      tile.append(image, el('span', 'lp-gallery-meta', item.filename || formatDate(item.createdAt * 1000)))
      tile.addEventListener('click', () => this.inspectImage(item.url, item.filename))
      grid.appendChild(tile)
    }
    content.appendChild(grid)
    if (!this.gallery.data.length) content.appendChild(this.empty('gallery', 'Nothing here yet', 'Take a photo with Camera or switch the gallery filter.'))
    return page
  }

  private inspectImage(url: string, title: string): void {
    const modal = this.ctx.ui.showModal({ title: title || 'Pocket photo', size: 'lg' } as any)
    const image = el('img')
    image.src = url
    image.alt = title || 'Pocket photo'
    image.style.cssText = 'display:block;width:100%;max-height:76vh;object-fit:contain;border-radius:12px;background:#080808'
    modal.root.appendChild(image)
  }

  private renderCamera(): HTMLDivElement {
    const page = el('div', 'lp-camera')
    const nav = el('header', 'lp-nav')
    const back = button('‹ Home', 'lp-nav-action')
    back.addEventListener('click', () => this.openApp('home'))
    const profileLabel = this.swarmProfile?.available ? 'Swarm profile linked' : 'Manual profile'
    const title = el('div', 'lp-nav-title', 'Camera')
    title.appendChild(el('span', 'lp-nav-subtitle', profileLabel))
    const gallery = button('Gallery', 'lp-nav-action')
    gallery.addEventListener('click', () => this.openApp('gallery'))
    nav.append(back, title, gallery)
    const viewfinder = el('div', 'lp-viewfinder')
    if (this.cameraPreview) {
      const image = el('img')
      image.src = this.cameraPreview
      image.alt = 'Camera preview'
      viewfinder.appendChild(image)
    } else {
      const placeholder = el('div', 'lp-camera-placeholder')
      placeholder.append(icon('camera'), el('div', '', 'Frame an in-world moment. The optional scene planner expands your brief before the image connection develops it.'))
      viewfinder.appendChild(placeholder)
    }
    const controls = el('form', 'lp-camera-controls')
    const prompt = el('textarea', 'lp-textarea')
    prompt.placeholder = 'Describe the photo or moment…'
    prompt.rows = 2
    const optionRow = el('div', 'lp-row-between')
    const enhanceLabel = el('label', 'lp-row')
    const enhance = el('input')
    enhance.type = 'checkbox'
    enhance.checked = this.preferences.sceneEnhancer
    enhanceLabel.append(enhance, el('span', 'lp-copy', 'Scene planner sidecar'))
    const source = el('span', 'lp-copy', this.swarmProfile?.source === 'swarm_studio' ? 'Swarm Studio' : 'Primitive/manual')
    optionRow.append(enhanceLabel, source)
    const shutterRow = el('div', 'lp-shutter-row')
    const cancel = button(this.cameraBusy ? 'Cancel' : '', 'lp-button')
    cancel.style.visibility = this.cameraBusy ? 'visible' : 'hidden'
    cancel.addEventListener('click', () => {
      this.send('lumiphone:camera_cancel', { requestId: this.cameraRequestId })
      this.cameraBusy = false
      this.cameraProgress = 'Cancelled'
      this.render()
    })
    const shutter = el('button', 'lp-shutter')
    shutter.type = 'submit'
    shutter.disabled = this.cameraBusy || !this.caps?.imageGen
    const spacer = el('span')
    shutterRow.append(cancel, shutter, spacer)
    const progress = el('div', 'lp-camera-progress', this.cameraProgress || (!this.caps?.imageGen ? 'Grant Image Generation permission in Settings' : ''))
    controls.append(prompt, optionRow, shutterRow, progress)
    controls.addEventListener('submit', (event) => {
      event.preventDefault()
      const scene = inputValue(prompt)
      if (!scene || this.cameraBusy) return
      this.cameraRequestId = requestId('camera')
      this.cameraBusy = true
      this.cameraProgress = 'Sending scene to camera…'
      this.send('lumiphone:camera_generate', { requestId: this.cameraRequestId, scene, enhance: enhance.checked })
      this.render()
    })
    page.append(nav, viewfinder, controls)
    return page
  }

  private renderNotes(): HTMLDivElement {
    const state = this.state!
    const selected = state.notes.find((item) => item.id === this.selectedNoteId)
    if (this.selectedNoteId === '__new__' || selected) return this.renderNoteEditor(selected || null)
    const { page, content } = this.page('Notes', `${state.notes.length} journal entries`, 'New', () => { this.selectedNoteId = '__new__'; this.render() })
    const sorted = [...state.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    for (const note of sorted) {
      const card = el('div', 'lp-card lp-note-card')
      card.dataset.clickable = 'true'
      card.dataset.pinned = String(note.pinned)
      const head = el('div', 'lp-row-between')
      head.append(el('h3', 'lp-title', note.title), el('span', 'lp-copy', formatDate(note.updatedAt)))
      const preview = el('p', 'lp-copy lp-note-preview', note.body || 'Empty note')
      card.append(head, preview)
      card.appendChild(el('span', 'lp-eyebrow', [note.author, note.mood].filter(Boolean).join(' · ')))
      card.addEventListener('click', () => { this.selectedNoteId = note.id; this.render() })
      content.appendChild(card)
    }
    if (!state.notes.length) content.appendChild(this.empty('notes', 'The journal is blank', 'You or the character can write the first entry.'))
    return page
  }

  private renderNoteEditor(note: PhoneNote | null): HTMLDivElement {
    const { page, content } = this.page(note ? 'Edit Note' : 'New Note', note?.mood || 'Character journal', 'Save')
    const navSave = page.querySelector<HTMLButtonElement>('.lp-nav-action:last-child')!
    const title = el('input', 'lp-input')
    title.placeholder = 'Title'
    title.value = note?.title || ''
    const mood = el('input', 'lp-input')
    mood.placeholder = 'Mood or tag'
    mood.value = note?.mood || ''
    const body = el('textarea', 'lp-textarea')
    body.style.minHeight = '270px'
    body.placeholder = 'Write a memory, thought, or journal entry…'
    body.value = note?.body || ''
    const pinRow = el('label', 'lp-row-between lp-card')
    pinRow.append(el('span', 'lp-title', 'Pin for model memory'))
    const pinned = el('input')
    pinned.type = 'checkbox'
    pinned.checked = note?.pinned || false
    pinRow.appendChild(pinned)
    const save = () => {
      this.send('lumiphone:action', { action: 'note', payload: { id: note?.id, title: inputValue(title), body: body.value, mood: inputValue(mood), pinned: pinned.checked } })
      this.selectedNoteId = ''
      this.render()
    }
    navSave.addEventListener('click', save)
    content.append(title, mood, body, pinRow)
    if (note) {
      const remove = button('Delete note', 'lp-button lp-button-danger')
      remove.addEventListener('click', () => {
        this.send('lumiphone:delete', { kind: 'note', id: note.id })
        this.selectedNoteId = ''
        this.render()
      })
      content.appendChild(remove)
    }
    return page
  }

  private renderWeather(): HTMLDivElement {
    const weather = this.state!.weather
    const { page, content } = this.page('Weather', weather.location, 'Save')
    const hero = el('div', 'lp-weather-hero')
    const top = el('div')
    top.append(el('div', 'lp-weather-condition', weather.condition), el('div', 'lp-copy', weather.location))
    const temp = el('div', 'lp-weather-temp', `${weather.temperature}°`)
    const bottom = el('div', 'lp-row-between')
    bottom.append(el('span', 'lp-weather-range', `H:${weather.high}°  L:${weather.low}°`), el('span', 'lp-weather-range', weather.updatedAt ? `Updated ${formatTime(weather.updatedAt)}` : ''))
    hero.append(top, temp, bottom)
    const fields = el('div', 'lp-fields')
    const location = this.field('Location', weather.location)
    const condition = this.field('Condition', weather.condition)
    const temperature = this.field('Temperature', String(weather.temperature), 'number')
    const unit = el('select', 'lp-select')
    for (const value of ['C', 'F']) {
      const option = el('option', '', `°${value}`)
      option.value = value
      option.selected = weather.unit === value
      unit.appendChild(option)
    }
    const unitLabel = el('label', 'lp-label', 'Unit')
    unitLabel.appendChild(unit)
    const high = this.field('High', String(weather.high), 'number')
    const low = this.field('Low', String(weather.low), 'number')
    fields.append(location.label, condition.label, temperature.label, unitLabel, high.label, low.label)
    const details = el('textarea', 'lp-textarea')
    details.placeholder = 'Atmosphere and roleplay weather details…'
    details.value = weather.details
    content.append(hero, fields, details)
    const save = page.querySelector<HTMLButtonElement>('.lp-nav-action:last-child')!
    save.addEventListener('click', () => this.send('lumiphone:action', { action: 'weather', payload: {
      location: inputValue(location.input), condition: inputValue(condition.input), temperature: Number(temperature.input.value), unit: unit.value,
      high: Number(high.input.value), low: Number(low.input.value), details: details.value,
    } }))
    return page
  }

  private renderCalendar(): HTMLDivElement {
    const state = this.state!
    const selected = state.events.find((item) => item.id === this.selectedEventId)
    if (this.selectedEventId === '__new__' || selected) return this.renderEventEditor(selected || null)
    const { page, content } = this.page('Timeline', formatDate(state.roleplayNow, true), 'Add', () => { this.selectedEventId = '__new__'; this.render() })
    const nowCard = el('div', 'lp-card')
    const nowField = el('input', 'lp-input')
    nowField.type = 'datetime-local'
    nowField.value = dateTimeLocal(state.roleplayNow)
    const setNow = button('Set roleplay now', 'lp-button')
    setNow.addEventListener('click', () => {
      const parsed = new Date(nowField.value)
      if (!Number.isNaN(parsed.getTime())) this.send('lumiphone:save_roleplay_time', { roleplayNow: parsed.toISOString() })
    })
    nowCard.append(el('div', 'lp-eyebrow', 'Roleplay clock'), nowField, setNow)
    content.appendChild(nowCard)
    const timeline = el('div', 'lp-timeline')
    const events = [...state.events].sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    for (const event of events) {
      const row = el('div', 'lp-event')
      row.dataset.completed = String(event.completed)
      const dot = el('span', 'lp-event-dot')
      dot.style.setProperty('--event-color', event.color)
      const card = el('div', 'lp-card')
      card.dataset.clickable = 'true'
      card.append(el('div', 'lp-eyebrow', `${event.lane} · ${event.whenText || formatDate(event.start, true)}`), el('h3', 'lp-title', event.title))
      if (event.description) card.appendChild(el('p', 'lp-copy', event.description))
      card.addEventListener('click', () => { this.selectedEventId = event.id; this.render() })
      row.append(dot, card)
      timeline.appendChild(row)
    }
    content.appendChild(timeline)
    if (!events.length) content.appendChild(this.empty('calendar', 'No timeline events', 'Schedule story beats, dates, appointments, or alternate-timeline milestones.'))
    return page
  }

  private renderEventEditor(event: CalendarEvent | null): HTMLDivElement {
    const { page, content } = this.page(event ? 'Edit Event' : 'New Event', 'Roleplay timeline', 'Save')
    const title = this.field('Title', event?.title || '')
    const lane = this.field('Timeline lane', event?.lane || 'Main timeline')
    const whenKindLabel = el('label', 'lp-label', 'Time precision')
    const whenKind = el('select', 'lp-select')
    for (const [value, label] of [['exact', 'Exact date/time'], ['approximate', 'Approximate'], ['relative', 'Relative to story'], ['unscheduled', 'Unscheduled']] as const) {
      const option = el('option', '', label)
      option.value = value
      option.selected = (event?.whenKind || 'exact') === value
      whenKind.appendChild(option)
    }
    whenKindLabel.appendChild(whenKind)
    const whenText = this.field('Timeline label', event?.whenText || (event ? formatDate(event.start, true) : ''))
    const start = this.field('Start', event ? dateTimeLocal(event.start) : dateTimeLocal(this.state!.roleplayNow), 'datetime-local')
    const end = this.field('End', event ? dateTimeLocal(event.end) : dateTimeLocal(this.state!.roleplayNow), 'datetime-local')
    const description = el('textarea', 'lp-textarea')
    description.placeholder = 'What happens?'
    description.value = event?.description || ''
    const completed = el('input')
    completed.type = 'checkbox'
    completed.checked = event?.completed || false
    const completeRow = el('label', 'lp-card lp-row-between')
    completeRow.append(el('span', 'lp-title', 'Completed'), completed)
    content.append(title.label, lane.label, whenKindLabel, whenText.label, start.label, end.label, description, completeRow)
    const save = page.querySelector<HTMLButtonElement>('.lp-nav-action:last-child')!
    save.addEventListener('click', () => {
      const startDate = new Date(start.input.value)
      const endDate = new Date(end.input.value)
      this.send('lumiphone:action', { action: 'event', payload: {
        id: event?.id, title: inputValue(title.input), lane: inputValue(lane.input), description: description.value,
        start: Number.isNaN(startDate.getTime()) ? this.state!.roleplayNow : startDate.toISOString(),
        end: Number.isNaN(endDate.getTime()) ? this.state!.roleplayNow : endDate.toISOString(),
        whenKind: whenKind.value, whenText: inputValue(whenText.input), completed: completed.checked,
      } })
      this.selectedEventId = ''
      this.render()
    })
    if (event) {
      const remove = button('Delete event', 'lp-button lp-button-danger')
      remove.addEventListener('click', () => { this.send('lumiphone:delete', { kind: 'event', id: event.id }); this.selectedEventId = ''; this.render() })
      content.appendChild(remove)
    }
    return page
  }

  private renderTrackers(): HTMLDivElement {
    return renderTrackersView({
      state: this.state!, selectedId: this.selectedTrackerId, selectedView: this.selectedTrackerView,
      accent: this.preferences.colors.accent,
      page: (title, subtitle, rightLabel, onRight) => this.page(title, subtitle, rightLabel, onRight),
      field: (label, value, type) => this.field(label, value, type),
      send: (type, payload) => { this.send(type, payload) },
      select: (id, view = 'detail') => { this.selectedTrackerId = id; this.selectedTrackerView = view; this.render() },
      back: () => { this.selectedTrackerId = ''; this.selectedTrackerView = 'detail'; this.render() },
      onCleanup: (cleanup) => this.viewCleanups.push(cleanup),
    })
  }

  private renderSettings(): HTMLDivElement {
    const view = renderSettingsView({
      preferences: this.preferences,
      capabilities: this.caps,
      swarmProfile: this.swarmProfile,
      page: (title, subtitle, rightLabel) => this.page(title, subtitle, rightLabel),
      field: (label, value, type) => this.field(label, value, type),
      preview: (preferences, options) => {
        this.preferences = preferences
        if (options?.appearance) this.applyAppearance()
        if (options?.resize) this.resizeExpanded()
        if (options?.rerender) this.render()
      },
      send: (type, payload) => { this.send(type, payload) },
      requestPermissions: () => { void this.requestPermissions() },
      showError: (message) => this.showError(message),
      openHome: () => this.openApp('home'),
    })
    if (this.selectedSettingsSection) requestAnimationFrame(() => {
      view.querySelector<HTMLElement>(`[data-settings-section="${CSS.escape(this.selectedSettingsSection)}"]`)?.scrollIntoView({ block: 'start' })
    })
    return view
  }
  private field(labelText: string, value = '', type = 'text'): { label: HTMLLabelElement; input: HTMLInputElement } {
    const label = el('label', 'lp-label', labelText)
    const input = el('input', 'lp-input')
    input.type = type
    input.value = value
    label.appendChild(input)
    return { label, input }
  }

  private empty(iconName: string, title: string, copy: string): HTMLDivElement {
    const node = el('div', 'lp-empty')
    const inner = el('div')
    inner.append(icon(iconName), el('h3', 'lp-title', title), el('p', 'lp-copy', copy))
    node.appendChild(inner)
    return node
  }

  private showError(message: string): void {
    window.clearTimeout(this.alertTimer)
    this.alert.textContent = message
    this.alert.hidden = false
    this.alertTimer = window.setTimeout(() => { this.alert.hidden = true }, 5_500)
  }
}

export function setupPhone(ctx: SpindleFrontendContext): Cleanup {
  const controller = new PocketController(ctx)
  ctx.ready()
  return () => controller.destroy()
}
