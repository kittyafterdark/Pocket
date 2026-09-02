import type {
  CalendarEvent,
  DevicePreferences,
  GalleryResult,
  PhoneApp,
  PhoneCapabilities,
  PhoneNote,
  PhoneNotification,
  PocketGenerationInfo,
  PocketOperationProgress,
  PocketContactSourceOption,
  PocketActivity,
  PocketRoute,
  PhoneState,
  PhoneTracker,
  SwarmVisualProfile,
} from '../types.js'
import { defaultPreferences, normalizePreferences, wallpaperCss } from '../domain/preferences.js'
import { normalizePocketRoute } from '../domain/navigation.js'
import { applyMobilePhoneSurface, applyVisualViewportSurface, calculatePhoneSurface, clearVisualViewportSurface, currentViewport, desktopDockSize } from './surface.js'
import { renderSettingsView } from './apps/settings.js'
import { renderTrackersView } from './apps/trackers.js'
import { renderMessagesView } from './apps/messages.js'
import { renderContactsView } from './apps/contacts.js'
import { renderNotificationsView } from './apps/notifications.js'
import { PocketRouteHistory } from './router.js'
import { activityReceipt } from './activity.js'
import { button, dateTimeLocal, el, formatDate, formatTime, inputValue, requestId } from './shared.js'
import type { PageAction } from './shared.js'
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
  contacts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 8h5M18.5 5.5v5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m4.5 18 4.7-4.7 3.1 3.1 2.2-2.2 5 5"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5"/></svg>',
  weather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18.5h9a4 4 0 0 0 .4-8A6 6 0 0 0 6 12.5a3 3 0 0 0 2 6Z"/><path d="M8 5V3M4.5 7 3 5.5M11.5 7 13 5.5"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 18h3"/></svg>',
  trackers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6v.2H10V21a1.8 1.8 0 0 0-1.1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1L4 17.1l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.9h-.2V10H3a1.8 1.8 0 0 0 1.6-1.1 1.8 1.8 0 0 0-.4-2l-.1-.1L6.9 4l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 3V2.8h4V3a1.8 1.8 0 0 0 1.1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1L20 6.9l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1.1h.2V14h-.2a1.8 1.8 0 0 0-1.7 1Z"/></svg>',
  notifications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
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
  { app: 'contacts', label: 'Contacts', icon: 'contacts' },
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
  private dockVisibilityCleanup: Cleanup | null = null
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
  private settingsDraft: DevicePreferences | null = null
  private settingsSaveTimer = 0
  private activePersona: { id: string; name: string } | null = null
  private caps: PhoneCapabilities | null = null
  private swarmProfile: SwarmVisualProfile | null = null
  private generation: PocketGenerationInfo | null = null
  private operations = new Map<string, PocketOperationProgress>()
  private router = new PocketRouteHistory()
  private gallery: GalleryResult = { data: [], total: 0 }
  private galleryScope = 'chat'
  private selectedContactId = ''
  private selectedContactView: 'list' | 'detail' | 'config' | 'import' | 'new' = 'list'
  private selectedConversationId = ''
  private selectedConversationView: 'thread' | 'new-group' | 'group-detail' = 'thread'
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
  private messageRequests = new Map<string, { conversationId: string; speakerContactId: string; phase: 'checking' | 'pending' }>()
  private messageDrafts = new Map<string, string>()
  private contactSources: PocketContactSourceOption[] = []
  private contactSourcesRequested = false
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
  private notificationTimer = 0
  private notificationIsland: HTMLButtonElement
  private customStyle: HTMLStyleElement

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
    const island = button('', 'lumiphone-island')
    island.setAttribute('aria-label', 'Open Notification Center')
    island.addEventListener('click', () => this.openPocket({ app: 'notifications' }))
    this.notificationIsland = island
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
    this.customStyle = document.createElement('style')
    this.customStyle.dataset.pocketCustomCss = 'true'
    this.shell.append(status, this.screen, homebar, this.alert, this.customStyle)
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
      if (this.currentApp !== 'home') this.home()
      else this.close()
    })
    this.installSwipeDismiss(status)
    this.installNotificationPull(status)
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
    window.clearTimeout(this.notificationTimer)
    window.clearTimeout(this.settingsSaveTimer)
    for (const cleanup of this.cleanups.splice(0)) {
      try { cleanup() } catch { /* best effort */ }
    }
    this.widget?.destroy()
    this.mobileWidget?.destroy()
    this.releaseDockPanel()
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
    window.visualViewport?.addEventListener('scroll', resize)
    this.cleanups.push(() => window.visualViewport?.removeEventListener('scroll', resize))
    const focusin = (event: FocusEvent) => {
      if (!this.expanded || this.handsetHost.dataset.fullscreen !== 'true') return
      this.resizeExpanded()
      const target = event.target instanceof HTMLElement ? event.target : null
      window.setTimeout(() => {
        this.resizeExpanded()
        target?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }, 60)
    }
    this.shell.addEventListener('focusin', focusin)
    this.cleanups.push(() => this.shell.removeEventListener('focusin', focusin))
    const keydown = (event: KeyboardEvent) => {
      if (!this.expanded) return
      if (event.key === 'Escape') {
        if (this.currentApp !== 'home') this.back()
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
        chromeless: true, centerContent: true,
      })
      this.dockVisibilityCleanup = this.dockPanel.onVisibilityChange((visible) => {
        if (!visible && this.expanded && !calculatePhoneSurface(this.preferences.handsetScale).fullscreen) {
          this.expanded = false
          this.shell.hidden = true
          this.launcher.hidden = false
        }
      })
      return this.dockPanel
    } catch {
      this.dockPanel = null
      return null
    }
  }

  private releaseDockPanel(): void {
    try { this.dockVisibilityCleanup?.() } catch { /* best effort */ }
    this.dockVisibilityCleanup = null
    try { this.dockPanel?.destroy() } catch { /* host may already have closed it */ }
    this.dockPanel = null
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
      this.releaseDockPanel()
      const mobile = this.ensureMobileWidget()
      if (!mobile) return false
      if (this.handsetHost.parentElement !== mobile.root) mobile.root.replaceChildren(this.handsetHost)
      if (this.shell.parentElement !== this.handsetHost) this.handsetHost.replaceChildren(this.shell)
      this.handsetHost.dataset.fullscreen = 'true'
      applyMobilePhoneSurface(mobile, 1)
      applyVisualViewportSurface(this.handsetHost)
      mobile.setVisible(true)
      return true
    }
    if (this.mobileWidget) {
      this.mobileWidget.setFullscreen(false)
      this.mobileWidget.setVisible(false)
    }
    const panel = this.ensureDockPanel()
    if (!panel) return false
    if (this.handsetHost.parentElement !== panel.root) panel.root.replaceChildren(this.handsetHost)
    if (this.shell.parentElement !== this.handsetHost) this.handsetHost.replaceChildren(this.shell)
    this.handsetHost.dataset.fullscreen = 'false'
    clearVisualViewportSurface(this.handsetHost)
    if ('setSize' in panel && typeof panel.setSize === 'function') {
      panel.setSize(desktopDockSize(this.preferences.handsetScale))
    }
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
    host.dataset.fullscreen = 'false'
    this.drawer.root.appendChild(host)
    host.replaceChildren(this.shell)
    this.launcher.hidden = true
    this.shell.hidden = false
    this.expanded = true
    this.render(true)
  }

  private async requestPermissions(): Promise<void> {
    try {
      await this.ctx.permissions.request([
        'ui_panels', 'chats', 'chat_mutation', 'characters', 'personas', 'generation', 'tools', 'interceptor', 'images', 'image_gen', 'push_notification',
      ], { reason: 'Pocket uses these permissions for its launcher and handset, per-chat character state, generated text messages, user-requested scene contact sync, model actions, gallery, camera, and optional push notifications.' })
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

  private installNotificationPull(target: HTMLElement): void {
    let startY = 0
    let active = false
    target.addEventListener('pointerdown', (event) => {
      if ((event.target as Element | null)?.closest('button,input,select,textarea,a')) return
      startY = event.clientY
      active = true
    })
    target.addEventListener('pointerup', (event) => {
      if (!active) return
      active = false
      if (event.clientY - startY > 52) this.openPocket({ app: 'notifications' })
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

  private announceView(): void {
    this.send('lumiphone:view_state', { open: this.expanded, route: this.router.current })
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
      if (payload.reason === 'import' || payload.reason === 'reset_preferences') this.settingsDraft = structuredClone(this.preferences)
      this.caps = payload.capabilities || this.caps
      this.swarmProfile = payload.swarmProfile || this.swarmProfile
      this.generation = payload.generation || this.generation
      if ('activePersona' in payload) this.activePersona = payload.activePersona || null
      for (const activity of this.state.activities || []) this.queueActivityReceipt(activity)
      this.applyAppearance()
      this.updateBadge()
      this.announceView()
      if (payload.open) this.open()
      const pending = this.pendingRoute
      this.pendingRoute = null
      if (pending) this.openPocket(pending)
      else if (this.expanded && this.currentApp === 'settings') this.updateSettingsDiagnostics()
      else if (this.expanded) this.render(false)
      if (this.unreadCount() > previousUnread && !this.expanded) this.launcher.animate([
        { transform: 'scale(1)' }, { transform: 'scale(1.13) rotate(-4deg)' }, { transform: 'scale(1)' },
      ], { duration: 420, easing: 'ease-out' })
      return
    }
    if (payload.type === 'lumiphone:activity' && payload.activity) {
      this.queueActivityReceipt(payload.activity as PocketActivity)
      return
    }
    if (payload.type === 'lumiphone:notification' && payload.notification) {
      this.showIncomingNotification(payload.notification as PhoneNotification)
      return
    }
    if (payload.type === 'lumiphone:generation_status' && payload.run) {
      const history = (this.generation?.history || this.preferences.generationHistory || []).filter((entry) => entry.requestId !== payload.run.requestId)
      history.push(payload.run)
      this.preferences.generationHistory = history.slice(-24)
      if (this.generation) this.generation.history = this.preferences.generationHistory
      if (this.currentApp === 'settings') this.updateSettingsDiagnostics()
      return
    }
    if (payload.type === 'lumiphone:operation_progress' && payload.requestId) {
      const operation: PocketOperationProgress = {
        task: payload.task, requestId: payload.requestId, phase: payload.phase,
        message: payload.message || 'Working…',
      }
      this.operations.set(operation.requestId, operation)
      if (this.currentApp === 'contacts' && !this.updateOperationProgress(operation)) this.render(false)
      if (operation.phase === 'complete') window.setTimeout(() => {
        this.operations.delete(operation.requestId)
        if (this.currentApp === 'contacts') this.updateOperationProgress(null, operation.requestId)
      }, 1_200)
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
      if (this.currentApp === 'settings') this.updateSettingsDiagnostics()
      return
    }
    if (payload.type === 'lumiphone:gallery') {
      this.gallery = { data: payload.data || [], total: Number(payload.total) || 0 }
      if (this.currentApp === 'gallery') this.render(false)
      return
    }
    if (payload.type === 'lumiphone:contact_sources') {
      this.contactSources = Array.isArray(payload.sources) ? payload.sources : []
      this.contactSourcesRequested = true
      if (this.currentApp === 'contacts') this.render(false)
      return
    }
    if (payload.type === 'lumiphone:conversation_opened' && payload.conversationId) {
      this.openPocket({ app: 'messages', conversationId: payload.conversationId, view: 'thread' })
      return
    }
    if ((payload.type === 'lumiphone:contact_created' || payload.type === 'lumiphone:contact_saved') && payload.contactId) {
      this.contactSourcesRequested = false
      this.openPocket({ app: 'contacts', contactId: payload.contactId, view: 'detail' })
      return
    }
    if (payload.type === 'lumiphone:swarm_profile') {
      this.swarmProfile = payload.profile
      if (this.currentApp === 'settings') this.updateSettingsDiagnostics()
      else if (this.currentApp === 'camera') this.render(false)
      return
    }
    if (payload.type === 'lumiphone:camera_progress') {
      if (payload.requestId !== this.cameraRequestId) return
      this.cameraBusy = true
      this.cameraProgress = payload.message || (payload.phase === 'preview' ? 'Preview developing…' : 'Working…')
      if (payload.imageDataUrl) this.cameraPreview = payload.imageDataUrl
      if (payload.profile) this.swarmProfile = payload.profile
      if (this.currentApp === 'camera') this.render(false)
      return
    }
    if (payload.type === 'lumiphone:message_progress') {
      const active = this.activeContext()
      if (payload.chatId !== active.chatId || payload.characterId !== active.characterId) return
      if (payload.phase === 'done') this.messageRequests.delete(payload.requestId)
      else this.messageRequests.set(payload.requestId, { conversationId: payload.conversationId, speakerContactId: payload.speakerContactId || payload.contactId, phase: payload.phase === 'checking' ? 'checking' : 'pending' })
      if (this.currentApp === 'messages') this.render(false)
      return
    }
    if (payload.type === 'lumiphone:camera_done') {
      if (payload.requestId !== this.cameraRequestId) return
      this.cameraBusy = false
      this.cameraProgress = 'Photo saved to Gallery'
      this.cameraPreview = payload.imageUrl || this.cameraPreview
      if (payload.profile) this.swarmProfile = payload.profile
      if (this.currentApp === 'camera') this.render(false)
      return
    }
    if (payload.type === 'lumiphone:camera_cancelled') {
      if (payload.requestId !== this.cameraRequestId) return
      this.cameraBusy = false
      this.cameraProgress = 'Cancelled'
      if (this.currentApp === 'camera') this.render(false)
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
      const operation = this.operations.get(payload.requestId)
      if (operation) this.operations.set(payload.requestId, { ...operation, phase: 'error', message: payload.error || 'Operation failed' })
      this.showError(payload.error || 'Pocket could not complete that action.')
      if (this.expanded) this.render(false)
    }
  }

  private unreadCount(): number {
    if (!this.state) return 0
    const notifications = this.state.notifications.filter((item) => !item.read && !item.dismissedAt).length
    const messages = this.state.conversations.reduce((sum, conversation) => sum + conversation.unread, 0)
    return Math.min(999, Math.max(notifications, messages))
  }

  private updateBadge(): void {
    const unread = this.unreadCount()
    this.launcherBadge.hidden = unread === 0
    this.launcherBadge.textContent = unread > 99 ? '99+' : String(unread)
    this.drawer.setBadge(unread ? (unread > 99 ? '99+' : String(unread)) : null)
    const notificationUnread = this.state?.notifications.filter((entry) => !entry.read && !entry.dismissedAt).length || 0
    this.notificationIsland.dataset.unread = String(notificationUnread > 0)
    this.notificationIsland.setAttribute('aria-label', notificationUnread ? `Open Notification Center, ${notificationUnread} unread` : 'Open Notification Center')
  }

  private updateOperationProgress(operation: PocketOperationProgress | null, requestId = operation?.requestId || ''): boolean {
    if (!requestId) return false
    const node = this.screen.querySelector<HTMLElement>(`[data-operation-request="${CSS.escape(requestId)}"]`)
    if (!node) return false
    if (!operation) { node.remove(); return true }
    const label = node.querySelector<HTMLElement>('[data-operation-message]')
    if (label) label.textContent = operation.message
    node.dataset.phase = operation.phase
    return true
  }

  private updateSettingsDiagnostics(): void {
    const generationNode = this.screen.querySelector<HTMLElement>('[data-pocket-generation-diagnostic]')
    if (generationNode) {
      const run = [...(this.generation?.history || this.preferences.generationHistory || [])].reverse().find((entry) => entry.task === 'connection-test')
      generationNode.dataset.status = run?.status || 'idle'
      generationNode.textContent = !run ? 'Not tested yet.' : run.status === 'started' ? '● Testing…'
        : run.status === 'completed' ? `✓ Success · ${run.latencyMs ?? 0} ms · ${run.connectionName} / ${run.model}`
          : `Failed · ${run.error || 'Unknown provider error'}`
      const testButton = this.screen.querySelector<HTMLButtonElement>('[data-pocket-generation-test]')
      if (testButton) testButton.disabled = !this.caps?.generation || run?.status === 'started'
    }
    const effectiveNode = this.screen.querySelector<HTMLElement>('[data-pocket-generation-effective]')
    if (effectiveNode) {
      const effective = this.generation?.effective
      const title = effectiveNode.querySelector<HTMLElement>('strong')
      const detail = effectiveNode.querySelector<HTMLElement>('span')
      if (title) title.textContent = effective?.name || 'No effective connection'
      if (detail) detail.textContent = effective ? `${effective.provider} · ${effective.model || 'model not set'}` : 'Configure a Lumiverse LLM connection.'
    }
    const swarmNode = this.screen.querySelector<HTMLElement>('[data-pocket-swarm-status]')
    if (swarmNode && this.swarmProfile) {
      swarmNode.dataset.status = this.swarmProfile.status
      swarmNode.textContent = this.swarmProfile.status === 'connected'
        ? `Connected · ${this.swarmProfile.checkpoint || 'profile macros resolved'}`
        : this.swarmProfile.status === 'disabled' ? 'Swarm profile sync is disabled.'
          : this.swarmProfile.status === 'error' ? `Error · ${this.swarmProfile.error}`
            : 'Swarm Studio macros were not detected for this character/persona.'
    }
    for (const row of this.screen.querySelectorAll<HTMLElement>('[data-pocket-swarm-macro]')) {
      const name = row.dataset.pocketSwarmMacro as keyof NonNullable<SwarmVisualProfile['fields']>
      const field = this.swarmProfile?.fields?.[name]
      row.textContent = `${name} · ${field?.detected ? `${field.length} chars · ${field.preview}` : 'empty'}`
    }
  }

  private updatePreferences(next: DevicePreferences, options: { persist?: boolean; resize?: boolean } = {}): void {
    const normalized = normalizePreferences(next)
    if (this.settingsDraft) Object.assign(this.settingsDraft, structuredClone(normalized))
    else this.settingsDraft = structuredClone(normalized)
    this.preferences = normalized
    this.applyAppearance()
    if (options.resize) this.resizeExpanded()
    if (options.persist === false) return
    window.clearTimeout(this.settingsSaveTimer)
    this.settingsSaveTimer = window.setTimeout(() => {
      this.send('lumiphone:save_preferences', { preferences: this.settingsDraft || this.preferences })
    }, 240)
  }

  private showIncomingNotification(notification: PhoneNotification): void {
    if (!this.expanded) {
      this.launcher.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 360 })
      return
    }
    window.clearTimeout(this.notificationTimer)
    this.shell.querySelector('.lp-floating-notification')?.remove()
    const toast = button('', 'lp-floating-notification')
    toast.setAttribute('role', 'status')
    toast.append(icon(notification.app), el('span', 'lp-grow', ''), el('span', 'lp-home-activity-arrow', '›'))
    const copy = toast.children[1]
    copy.append(el('strong', '', notification.title), el('span', '', notification.body))
    toast.addEventListener('click', () => {
      this.send('lumiphone:notification_mark_read', { notificationId: notification.id })
      this.openPocket(notification.route || { app: notification.app })
      toast.remove()
    })
    this.shell.appendChild(toast)
    this.notificationTimer = window.setTimeout(() => toast.remove(), 6_000)
  }

  private applyAppearance(): void {
    const settings = this.settingsDraft || this.preferences
    const persona = this.activePersona ? settings.personaAppearance[this.activePersona.id] : null
    const appearance = persona?.enabled ? persona : settings
    this.shell.dataset.theme = appearance.theme
    this.shell.style.setProperty('--lp-accent', appearance.colors.accent)
    this.shell.style.setProperty('--lp-bezel', appearance.colors.bezel)
    this.shell.style.setProperty('--lp-bg', appearance.colors.background)
    this.shell.style.setProperty('--lp-surface', appearance.colors.surface)
    this.shell.style.setProperty('--lp-text', appearance.colors.text)
    const homeWallpaper = wallpaperCss(appearance.colors.wallpaperPrimary, appearance.colors.wallpaperSecondary)
    const chatWallpaper = wallpaperCss(appearance.colors.chatPrimary, appearance.colors.chatSecondary)
    this.shell.style.setProperty('--lp-wallpaper', settings.wallpaperImageUrl ? `${homeWallpaper},url(${JSON.stringify(settings.wallpaperImageUrl)})` : homeWallpaper)
    this.shell.style.setProperty('--lp-chat-wallpaper', settings.chatWallpaperImageUrl ? `${chatWallpaper},url(${JSON.stringify(settings.chatWallpaperImageUrl)})` : chatWallpaper)
    this.shell.style.setProperty('--pocket-ui-scale', String(settings.uiScale))
    this.shell.style.setProperty('--lp-animation-ms', `${settings.reducedMotion ? 0 : settings.animationDurationMs}ms`)
    this.shell.dataset.reducedMotion = String(settings.reducedMotion)
    const customCss = [settings.customCss, persona?.enabled ? persona.customCss : ''].filter(Boolean).join('\n')
    this.customStyle.textContent = customCss ? `@scope (.lumiphone-shell) { ${customCss} }` : ''
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
    this.render(true)
    this.refresh()
    this.announceView()
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
    this.releaseDockPanel()
    if (this.mobileWidget) {
      this.mobileWidget.setFullscreen(false)
      this.mobileWidget.setVisible(false)
    }
    this.announceView()
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

  private back(): void {
    this.openPocket(this.router.back(), false)
  }

  private home(): void {
    this.openPocket(this.router.home(), false)
  }

  private openPocket(routeInput: PocketRoute, pushHistory = true): void {
    const normalized = normalizePocketRoute(routeInput)
    const route = pushHistory ? this.router.navigate(normalized) : normalized
    if (!this.state) {
      this.pendingRoute = route
      this.open()
      this.refresh()
      return
    }
    if (!this.expanded) this.open()
    if (this.currentApp === 'settings' && route.app !== 'settings') this.settingsDraft = null
    this.currentApp = route.app
    if (route.app === 'messages') {
      const conversation = (route.conversationId ? this.state.conversations.find((entry) => entry.id === route.conversationId) : null)
        || (route.contactId ? this.state.conversations.find((entry) => entry.kind === 'direct' && entry.participantContactIds[0] === route.contactId) : null)
      this.selectedConversationId = conversation?.id || ''
      this.selectedConversationView = route.view || 'thread'
      this.selectedMessageId = conversation && route.messageId && conversation.messages.some((entry) => entry.id === route.messageId) ? route.messageId : ''
      this.send('lumiphone:mark_read', conversation ? { app: 'messages', conversationId: conversation.id } : { app: 'messages' })
    } else if (route.app === 'contacts') {
      const contact = route.contactId ? this.state.contacts.find((entry) => entry.id === route.contactId) : null
      this.selectedContactId = contact?.id || ''
      this.selectedContactView = contact ? route.view === 'config' ? 'config' : 'detail' : route.view || 'list'
      this.send('lumiphone:mark_read', { app: 'contacts' })
    } else if (route.app === 'trackers') {
      const tracker = route.trackerId ? this.state.trackers.find((entry) => entry.id === route.trackerId) : null
      this.selectedTrackerId = tracker?.id || (route.trackerId?.startsWith('__template:') ? route.trackerId : '')
      this.selectedTrackerView = route.view || 'detail'
      this.send('lumiphone:mark_read', { app: 'trackers' })
    } else if (route.app === 'calendar') {
      this.selectedEventId = route.eventId === '__new__' || (route.eventId && this.state.events.some((entry) => entry.id === route.eventId)) ? route.eventId : ''
      this.send('lumiphone:mark_read', { app: 'calendar' })
    } else if (route.app === 'notes') {
      this.selectedNoteId = route.noteId === '__new__' || (route.noteId && this.state.notes.some((entry) => entry.id === route.noteId)) ? route.noteId : ''
      this.send('lumiphone:mark_read', { app: 'notes' })
    } else if (route.app === 'gallery') {
      this.selectedGalleryImageId = route.imageId || ''
      this.requestGallery(this.galleryScope)
      this.send('lumiphone:mark_read', { app: 'gallery' })
    } else if (route.app === 'settings') {
      this.selectedSettingsSection = route.section || ''
      this.settingsDraft ||= structuredClone(this.preferences)
      this.send('lumiphone:mark_read', { app: 'settings' })
    } else if (route.app !== 'home') {
      this.send('lumiphone:mark_read', { app: route.app })
    }
    this.announceView()
    this.render(true)
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

  private render(transition = false): void {
    const oldView = this.screen.querySelector<HTMLElement>('.lumiphone-app-view')
    const oldViewScroll = oldView?.scrollTop || 0
    const oldThread = this.screen.querySelector<HTMLElement>('[data-pocket-thread]')
    const oldThreadScroll = oldThread?.scrollTop
    const focusedComposer = document.activeElement instanceof HTMLTextAreaElement ? document.activeElement.dataset.pocketComposer : ''
    const selection = document.activeElement instanceof HTMLTextAreaElement ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] as const : null
    for (const cleanup of this.viewCleanups.splice(0)) cleanup()
    if (!this.state) {
      this.screen.replaceChildren(this.loadingView())
      return
    }
    this.applyAppearance()
    const view = this.currentApp === 'home' ? this.renderHome()
      : this.currentApp === 'messages' ? this.renderMessages()
      : this.currentApp === 'contacts' ? this.renderContacts()
      : this.currentApp === 'gallery' ? this.renderGallery()
      : this.currentApp === 'camera' ? this.renderCamera()
      : this.currentApp === 'notes' ? this.renderNotes()
      : this.currentApp === 'weather' ? this.renderWeather()
      : this.currentApp === 'calendar' ? this.renderCalendar()
      : this.currentApp === 'trackers' ? this.renderTrackers()
      : this.currentApp === 'notifications' ? this.renderNotifications()
      : this.renderSettings()
    view.classList.add('lumiphone-app-view')
    view.dataset.pocketApp = this.currentApp
    const animation = this.preferences.reducedMotion ? 'none' : this.preferences.animation
    if (transition && animation !== 'none') {
      view.dataset.animate = animation
      view.addEventListener('animationend', () => view.removeAttribute('data-animate'), { once: true })
    }
    this.screen.replaceChildren(view)
    if (!transition) requestAnimationFrame(() => {
      view.scrollTop = oldViewScroll
      const thread = this.screen.querySelector<HTMLElement>('[data-pocket-thread]')
      if (thread && oldThreadScroll !== undefined) thread.scrollTop = oldThreadScroll
      if (focusedComposer) {
        const composer = this.screen.querySelector<HTMLTextAreaElement>(`[data-pocket-composer="${CSS.escape(focusedComposer)}"]`)
        composer?.focus({ preventScroll: true })
        if (composer && selection) composer.setSelectionRange(selection[0], selection[1])
      }
    })
  }

  private loadingView(): HTMLElement {
    const node = el('div', 'lp-page lp-empty')
    const inner = el('div')
    inner.innerHTML = `${PHONE_ICON}<p>Waking Pocket…</p>`
    node.appendChild(inner)
    return node
  }

  private page(title: string, subtitle = '', action?: PageAction): { page: HTMLDivElement; content: HTMLDivElement } {
    const page = el('div', 'lp-page')
    const nav = el('header', 'lp-nav')
    const back = button('‹ Back', 'lp-nav-action')
    back.addEventListener('click', () => this.back())
    const heading = el('div', 'lp-nav-title', title)
    if (subtitle) heading.appendChild(el('span', 'lp-nav-subtitle', subtitle))
    const right = button(action?.label || '', 'lp-nav-action')
    right.disabled = !action || action.enabled === false
    if (action?.ariaLabel) right.setAttribute('aria-label', action.ariaLabel)
    if (action) right.addEventListener('click', action.callback)
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
    const recentNotifications = state.notifications.filter((entry) => !entry.dismissedAt && !entry.read).slice(0, 3)
    for (const item of recentNotifications) {
      const receipt = button('', 'lp-home-activity-item')
      receipt.append(el('strong', '', item.title), el('span', '', item.body || item.app), el('span', 'lp-home-activity-arrow', '›'))
      receipt.setAttribute('aria-label', `Open ${item.title}`)
      receipt.addEventListener('click', () => {
        this.send('lumiphone:notification_mark_read', { notificationId: item.id })
        this.openPocket(item.route || { app: item.app })
      })
      activity.appendChild(receipt)
    }
    if (recentNotifications.length) {
      const all = button('View all notifications', 'lp-home-notifications-all')
      all.addEventListener('click', () => this.openPocket({ app: 'notifications' }))
      activity.appendChild(all)
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
      ? this.state!.conversations.reduce((sum, conversation) => sum + conversation.unread, 0)
      : this.state!.notifications.filter((item) => !item.read && !item.dismissedAt && item.app === meta.app).length
    if (unread) box.appendChild(el('span', 'lp-app-dot', unread > 99 ? '99+' : String(unread)))
    node.append(box, el('span', 'lp-app-label', meta.label))
    node.addEventListener('click', () => this.openApp(meta.app))
    return node
  }

  private renderMessages(): HTMLDivElement {
    return renderMessagesView({
      state: this.state!, selectedConversationId: this.selectedConversationId,
      selectedMessageId: this.selectedMessageId,
      selectedView: this.selectedConversationView,
      generationAvailable: Boolean(this.caps?.generation), busyConversations: new Map([...this.messageRequests.values()].map((entry) => [entry.conversationId, { speakerContactId: entry.speakerContactId, phase: entry.phase }])),
      draft: this.messageDrafts.get(this.selectedConversationId) || '',
      updateDraft: (conversationId, value) => { if (value) this.messageDrafts.set(conversationId, value); else this.messageDrafts.delete(conversationId) },
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      empty: (title, copy) => this.empty('messages', title, copy), iconButton,
      selectConversation: (conversationId, view = 'thread') => this.openPocket({ app: 'messages', conversationId: conversationId || undefined, view }),
      openContact: (contactId) => this.openPocket({ app: 'contacts', contactId, view: 'detail' }),
      send: (type, payload) => { this.send(type, payload) },
      generateReply: (conversationId, speakerContactId) => this.generateReply(conversationId, speakerContactId),
      back: () => this.back(),
    })
  }

  private generateReply(conversationId: string, speakerContactId = ''): void {
    if ([...this.messageRequests.values()].some((entry) => entry.conversationId === conversationId)) return
    const id = requestId('reply')
    this.messageRequests.set(id, { conversationId, speakerContactId, phase: 'pending' })
    this.send('lumiphone:generate_message', { requestId: id, conversationId, speakerContactId })
    this.render()
  }

  private renderContacts(): HTMLDivElement {
    return renderContactsView({
      state: this.state!, selectedContactId: this.selectedContactId, selectedView: this.selectedContactView,
      sources: this.contactSources, capabilities: this.caps,
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      empty: (title, copy) => this.empty('contacts', title, copy),
      operations: this.operations,
      select: (contactId, view = contactId ? 'detail' : 'list') => this.openPocket({ app: 'contacts', contactId: contactId || undefined, view }),
      openDirect: (contactId) => this.send('lumiphone:open_direct', { contactId }),
      requestSources: () => {
        if (this.contactSourcesRequested) return
        this.contactSourcesRequested = true
        this.send('lumiphone:list_contact_sources')
      },
      send: (type, payload) => { this.send(type, payload) }, showError: (message) => this.showError(message),
    })
  }

  private requestGallery(scope: string): void {
    this.galleryScope = scope
    this.send('lumiphone:gallery_list', { scope })
  }

  private renderGallery(): HTMLDivElement {
    const { page, content } = this.page('Gallery', `${this.gallery.total} assets`, { label: 'Refresh', callback: () => this.requestGallery(this.galleryScope) })
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
      tile.addEventListener('click', () => this.inspectImage(item))
      grid.appendChild(tile)
    }
    content.appendChild(grid)
    if (!this.gallery.data.length) content.appendChild(this.empty('gallery', 'Nothing here yet', 'Take a photo with Camera or switch the gallery filter.'))
    return page
  }

  private inspectImage(item: GalleryResult['data'][number]): void {
    const modal = this.ctx.ui.showModal({ title: item.filename || 'Pocket photo', size: 'lg' } as any)
    const image = el('img')
    image.src = item.url
    image.alt = item.filename || 'Pocket photo'
    image.style.cssText = 'display:block;width:100%;max-height:76vh;object-fit:contain;border-radius:12px;background:#080808'
    const actions = el('div', 'lp-gallery-actions')
    const open = button('Open image', 'lp-button')
    open.addEventListener('click', () => window.open(item.url, '_blank', 'noopener,noreferrer'))
    const attach = button('Add to current RP chat', 'lp-button')
    attach.disabled = !this.caps?.sceneSync
    attach.addEventListener('click', () => this.send('lumiphone:gallery_add_to_chat', { imageId: item.id, imageUrl: item.url, filename: item.filename }))
    const homeWallpaper = button('Set as home wallpaper', 'lp-button lp-button-quiet')
    homeWallpaper.addEventListener('click', () => this.send('lumiphone:gallery_set_wallpaper', { imageUrl: item.url, target: 'home' }))
    const chatWallpaper = button('Set as chat wallpaper', 'lp-button lp-button-quiet')
    chatWallpaper.addEventListener('click', () => this.send('lumiphone:gallery_set_wallpaper', { imageUrl: item.url, target: 'chat' }))
    const contact = el('select', 'lp-select')
    const choose = el('option', '', 'Choose a contact photo…'); choose.value = ''; contact.appendChild(choose)
    for (const entry of this.state?.contacts || []) {
      const option = el('option', '', entry.name); option.value = entry.id; contact.appendChild(option)
    }
    const setPhoto = button('Set contact photo', 'lp-button lp-button-quiet')
    setPhoto.addEventListener('click', () => {
      if (!contact.value) { this.showError('Choose a contact first.'); return }
      this.send('lumiphone:set_contact_photo', { contactId: contact.value, imageUrl: item.url })
    })
    actions.append(open, attach, homeWallpaper, chatWallpaper, contact, setPhoto)
    modal.root.append(image, actions)
  }

  private renderCamera(): HTMLDivElement {
    const page = el('div', 'lp-camera')
    const nav = el('header', 'lp-nav')
    const back = button('‹ Back', 'lp-nav-action')
    back.addEventListener('click', () => this.back())
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
    const { page, content } = this.page('Notes', `${state.notes.length} journal entries`, { label: 'New', callback: () => this.openPocket({ app: 'notes', noteId: '__new__' }) })
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
      card.addEventListener('click', () => this.openPocket({ app: 'notes', noteId: note.id }))
      content.appendChild(card)
    }
    if (!state.notes.length) content.appendChild(this.empty('notes', 'The journal is blank', 'You or the character can write the first entry.'))
    return page
  }

  private renderNoteEditor(note: PhoneNote | null): HTMLDivElement {
    const { page, content } = this.page(note ? 'Edit Note' : 'New Note', note?.mood || 'Character journal', { label: 'Save', callback: () => save() })
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
      this.back()
    }
    content.append(title, mood, body, pinRow)
    if (note) {
      const remove = button('Delete note', 'lp-button lp-button-danger')
      remove.addEventListener('click', () => {
        this.send('lumiphone:delete', { kind: 'note', id: note.id })
        this.back()
      })
      content.appendChild(remove)
    }
    return page
  }

  private renderWeather(): HTMLDivElement {
    const weather = this.state!.weather
    const { page, content } = this.page('Weather', weather.location, { label: 'Save', callback: () => save() })
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
    const save = () => this.send('lumiphone:action', { action: 'weather', payload: {
      location: inputValue(location.input), condition: inputValue(condition.input), temperature: Number(temperature.input.value), unit: unit.value,
      high: Number(high.input.value), low: Number(low.input.value), details: details.value,
    } })
    return page
  }

  private renderCalendar(): HTMLDivElement {
    const state = this.state!
    const selected = state.events.find((item) => item.id === this.selectedEventId)
    if (this.selectedEventId === '__new__' || selected) return this.renderEventEditor(selected || null)
    const { page, content } = this.page('Timeline', formatDate(state.roleplayNow, true), { label: 'Add', callback: () => this.openPocket({ app: 'calendar', eventId: '__new__' }) })
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
      card.addEventListener('click', () => this.openPocket({ app: 'calendar', eventId: event.id }))
      row.append(dot, card)
      timeline.appendChild(row)
    }
    content.appendChild(timeline)
    if (!events.length) content.appendChild(this.empty('calendar', 'No timeline events', 'Schedule story beats, dates, appointments, or alternate-timeline milestones.'))
    return page
  }

  private renderEventEditor(event: CalendarEvent | null): HTMLDivElement {
    const { page, content } = this.page(event ? 'Edit Event' : 'New Event', 'Roleplay timeline', { label: 'Save', callback: () => save() })
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
    const save = () => {
      const startDate = new Date(start.input.value)
      const endDate = new Date(end.input.value)
      this.send('lumiphone:action', { action: 'event', payload: {
        id: event?.id, title: inputValue(title.input), lane: inputValue(lane.input), description: description.value,
        start: Number.isNaN(startDate.getTime()) ? this.state!.roleplayNow : startDate.toISOString(),
        end: Number.isNaN(endDate.getTime()) ? this.state!.roleplayNow : endDate.toISOString(),
        whenKind: whenKind.value, whenText: inputValue(whenText.input), completed: completed.checked,
      } })
      this.back()
    }
    if (event) {
      const remove = button('Delete event', 'lp-button lp-button-danger')
      remove.addEventListener('click', () => { this.send('lumiphone:delete', { kind: 'event', id: event.id }); this.back() })
      content.appendChild(remove)
    }
    return page
  }

  private renderTrackers(): HTMLDivElement {
    return renderTrackersView({
      state: this.state!, selectedId: this.selectedTrackerId, selectedView: this.selectedTrackerView,
      accent: this.preferences.colors.accent,
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      field: (label, value, type) => this.field(label, value, type),
      send: (type, payload) => { this.send(type, payload) },
      select: (id, view = 'detail') => this.openPocket({ app: 'trackers', trackerId: id || undefined, view }),
      back: () => this.back(),
      onCleanup: (cleanup) => this.viewCleanups.push(cleanup),
    })
  }

  private renderNotifications(): HTMLDivElement {
    return renderNotificationsView({
      notifications: this.state!.notifications,
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      navigate: (route) => this.openPocket(route),
      send: (type, payload) => { this.send(type, payload) },
    })
  }

  private renderSettings(): HTMLDivElement {
    this.settingsDraft ||= structuredClone(this.preferences)
    return renderSettingsView({
      draft: this.settingsDraft,
      section: this.selectedSettingsSection,
      activePersona: this.activePersona,
      capabilities: this.caps,
      swarmProfile: this.swarmProfile,
      generation: this.generation,
      page: (title, subtitle, action) => this.page(title, subtitle, action),
      update: (preferences, options) => this.updatePreferences(preferences, options),
      navigate: (section) => this.openPocket({ app: 'settings', section }),
      send: (type, payload) => { this.send(type, payload) },
      requestPermissions: () => { void this.requestPermissions() },
      showError: (message) => this.showError(message),
    })
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
