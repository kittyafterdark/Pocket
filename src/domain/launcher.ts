import type { PhoneApp } from '../types.js'

export const LAUNCHER_APPS = [
  { app: 'messages', label: 'Messages', icon: 'messages' },
  { app: 'camera', label: 'Camera', icon: 'camera' },
  { app: 'gallery', label: 'Gallery', icon: 'gallery' },
  { app: 'notes', label: 'Notes', icon: 'notes' },
  { app: 'weather', label: 'Weather', icon: 'weather' },
  { app: 'contacts', label: 'Contacts', icon: 'contacts' },
  { app: 'calendar', label: 'Timeline', icon: 'calendar' },
  { app: 'trackers', label: 'Trackers', icon: 'trackers' },
  { app: 'settings', label: 'Settings', icon: 'settings' },
  { app: 'appstore', label: 'App Store', icon: 'appstore' },
  { app: 'twitter', label: 'Twitter', icon: 'twitter' },
  { app: 'discord', label: 'Discord', icon: 'discord' },
  { app: 'instagram', label: 'Instagram', icon: 'instagram' },
  { app: 'tumblr', label: 'Tumblr', icon: 'tumblr' },
  {app:'dating',label:'Lumistry',icon:'dating'},
  {app:'spotify',label:'Spotify Share',icon:'spotify'},
  {app:'sharing',label:'Screenshots',icon:'sharing'},
  {app:'bank',label:'Pocket Bank',icon:'bank'},
  {app:'birthdays',label:'Birthdays',icon:'birthdays'},
  {app:'browser',label:'Browser',icon:'browser'},
  {app:'maps',label:'Maps',icon:'maps'},
  {app:'twitch',label:'Twitch',icon:'twitch'},
  {app:'stickers',label:'Stickers',icon:'stickers'},
] as const satisfies ReadonlyArray<{ app: PhoneApp; label: string; icon: string }>
export type LauncherApp = typeof LAUNCHER_APPS[number]['app']
export type LauncherItem = { id: string; kind: 'app'; app: LauncherApp }
  | { id: string; kind: 'folder'; name: string; apps: LauncherApp[] }
  | { id: string; kind: 'tracker'; trackerId: string; size: 'compact' | 'wide' }
  | { id: string; kind: 'weather'; size: 'compact' | 'wide'; variant?: 'card' | 'stripe' }
  | { id: string; kind: 'clock'; size: 'compact' | 'wide' }
export interface LauncherPage { id: string; name: string; items: LauncherItem[] }
export interface LauncherLayout { version: 2; pages: LauncherPage[]; dock: Array<LauncherApp | null>; installedApps?: LauncherApp[] }
export const POCKET_SYSTEM_APPS: readonly LauncherApp[] = ['messages', 'contacts', 'settings', 'appstore']
// This list is deliberately explicit: future apps arrive through Get, not automatically on upgrade.
const POCKET_PREINSTALLED_APPS: readonly LauncherApp[] = ['messages', 'contacts', 'settings', 'appstore', 'camera', 'gallery', 'notes', 'weather', 'calendar', 'trackers']
export function pocketInstalledApps(layout: LauncherLayout): LauncherApp[] { return [...new Set([...(layout.installedApps || POCKET_PREINSTALLED_APPS), ...POCKET_SYSTEM_APPS])] }
export function pocketAppInstalled(layout: LauncherLayout, app: string): boolean { return pocketInstalledApps(layout).some(entry => entry === app) }
export const MAX_LAUNCHER_PAGES = 8
export const MAX_LAUNCHER_ITEMS = 64
export type LauncherDestination = 'home' | number | { pageId: string } | { folderId: string }
export const launcherItemCount = (layout: LauncherLayout) => layout.pages.reduce((total, page) => total + page.items.reduce((count, item) => count + 1 + (item.kind === 'folder' ? item.apps.length : 0), 0), 0)
const launcherAppIds = new Set<string>(LAUNCHER_APPS.map(entry => entry.app))
export function defaultLauncherLayout(): LauncherLayout {
  const apps: LauncherItem[] = (['weather', 'contacts', 'calendar', 'trackers', 'settings', 'appstore'] as LauncherApp[]).map(app => ({ id: `app-${app}`, kind: 'app', app }))
  return { version: 2, pages: [{ id: 'home', name: 'Home', items: [{ id: 'widget-clock', kind: 'clock', size: 'compact' }, { id: 'widget-weather', kind: 'weather', size: 'compact', variant: 'stripe' }, ...apps] }], dock: ['messages', 'camera', 'gallery', 'notes'] }
}
const isLauncherRecord = (raw: unknown): raw is Record<string, unknown> => Boolean(raw && typeof raw === 'object' && !Array.isArray(raw))
const launcherText = (raw: unknown, max = 120) => typeof raw === 'string' ? raw.trim().slice(0, max) : ''
export function normalizeLauncherLayout(raw: unknown): LauncherLayout {
  if (!isLauncherRecord(raw) || !Array.isArray(raw.dock)) return defaultLauncherLayout()
  const pages = raw.version === 1 && Array.isArray(raw.home)
    ? [{ id: 'home', name: 'Home', items: raw.home.map(app => ({ id: `app-${app}`, kind: 'app', app })) }]
    : raw.version === 2 && Array.isArray(raw.pages) ? raw.pages : []
  if (!pages.length) return defaultLauncherLayout()
  const used = new Set<string>(), widgets = new Set<string>(), ids = new Set<string>(), pageIds = new Set<string>()
  const unique = (id: string, seen: Set<string>) => {
    let candidate = id
    for (let suffix = 2; seen.has(candidate); suffix++) candidate = `${id}-${suffix}`
    seen.add(candidate); return candidate
  }
  const accept = (app: unknown): app is LauncherApp => {
    if (typeof app !== 'string' || !launcherAppIds.has(app) || used.has(app)) return false
    used.add(app); return true
  }
  const rawDock = raw.dock
  const dock = Array.from({ length: 4 }, (_, index) => accept(rawDock[index]) ? rawDock[index] : null)
  let itemCount = 0
  let weatherAdded = false
  let clockAdded = false
  const normalized: LauncherPage[] = pages.slice(0, MAX_LAUNCHER_PAGES).flatMap((page, index) => {
    if (!isLauncherRecord(page)) return []
    const pageId = unique(launcherText(page.id) || `screen-${index + 1}`, pageIds)
    const items: LauncherItem[] = (Array.isArray(page.items) ? page.items : []).flatMap((item): LauncherItem[] => {
      if (!isLauncherRecord(item) || itemCount >= MAX_LAUNCHER_ITEMS) return []
      const id = () => { itemCount++; return unique(launcherText(item.id) || `item-${itemCount}`, ids) }
      if (item.kind === 'app' && accept(item.app)) return [{ id: id(), kind: 'app', app: item.app }]
      if (item.kind === 'folder' && Array.isArray(item.apps)) {
        const apps = item.apps.filter(accept).slice(0, MAX_LAUNCHER_ITEMS - itemCount - 1)
        itemCount += apps.length
        return [{ id: id(), kind: 'folder', name: launcherText(item.name, 40) || 'Folder', apps }]
      }
      if (item.kind === 'tracker' && launcherText(item.trackerId) && !widgets.has(launcherText(item.trackerId))) {
        widgets.add(launcherText(item.trackerId))
        return [{ id: id(), kind: 'tracker', trackerId: launcherText(item.trackerId), size: item.size === 'wide' ? 'wide' : 'compact' }]
      }
      if (item.kind === 'weather' && !weatherAdded) {
        weatherAdded = true
        return [{ id: id(), kind: 'weather', size: item.size === 'wide' ? 'wide' : 'compact', ...(item.variant === 'stripe' ? { variant: 'stripe' as const } : {}) }]
      }
      if (item.kind === 'clock' && !clockAdded) {
        clockAdded = true
        return [{ id: id(), kind: 'clock', size: item.size === 'wide' ? 'wide' : 'compact' }]
      }
      return []
    })
    return [{ id: pageId, name: launcherText(page.name, 40) || `Screen ${index + 1}`, items }]
  })
  const installedApps = Array.isArray(raw.installedApps) ? [...new Set([...raw.installedApps.filter((app): app is LauncherApp => typeof app === 'string' && launcherAppIds.has(app)), ...POCKET_SYSTEM_APPS])] : undefined
  return normalized.length ? { version: 2, pages: normalized, dock, ...(installedApps ? { installedApps } : {}) } : defaultLauncherLayout()
}
export function normalizeLauncherLayouts(raw: unknown): Record<string, LauncherLayout> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(Object.entries(raw).filter(([owner]) => owner.length > 0 && owner.length <= 180).map(([owner, layout]) => [owner, normalizeLauncherLayout(layout)]))
}
/** Installation is per logical phone. Layout placements and app data survive removal. */
export function setPocketAppInstalled(layout: LauncherLayout, app: LauncherApp, installed: boolean): LauncherLayout {
  const next = normalizeLauncherLayout(layout)
  if (!installed && POCKET_SYSTEM_APPS.includes(app)) return next
  const apps = new Set(pocketInstalledApps(next))
  if (installed) apps.add(app); else apps.delete(app)
  next.installedApps = [...apps]
  const placed = next.dock.includes(app) || next.pages.some(page => page.items.some(item => item.kind === 'app' ? item.app === app : item.kind === 'folder' && item.apps.includes(app)))
  if (installed && !placed && launcherItemCount(next) < MAX_LAUNCHER_ITEMS) next.pages[0].items.push({ id: `app-${app}`, kind: 'app', app })
  return normalizeLauncherLayout(next)
}
/** Moving a dock app home preserves all other shortcuts; replacing a slot returns its app home. */
export function placeLauncherApp(layout: LauncherLayout, app: LauncherApp, target: LauncherDestination, fallbackPageId?: string): LauncherLayout {
  const next = normalizeLauncherLayout(layout)
  const page = next.pages.find(entry => entry.id === fallbackPageId) || next.pages[0]
  const destinationPage = typeof target === 'object' && 'pageId' in target ? next.pages.find(entry => entry.id === target.pageId) : page
  const folder = typeof target === 'object' && 'folderId' in target ? next.pages.flatMap(page => page.items).find(item => item.kind === 'folder' && item.id === target.folderId) : null
  if ((typeof target === 'number' && (!Number.isInteger(target) || target < 0 || target > 3)) || !destinationPage || (typeof target === 'object' && 'folderId' in target && folder?.kind !== 'folder')) return next
  const located = next.pages.flatMap(page => page.items).some(item => item.kind === 'app' ? item.app === app : item.kind === 'folder' && item.apps.includes(app))
  const extra = typeof target === 'number' ? Number(Boolean(next.dock[target] && next.dock[target] !== app)) : 1
  if (launcherItemCount(next) + extra - Number(located) > MAX_LAUNCHER_ITEMS) return next
  for (const page of next.pages) {
    page.items = page.items.filter(item => item.kind !== 'app' || item.app !== app)
    for (const item of page.items) if (item.kind === 'folder') item.apps = item.apps.filter(entry => entry !== app)
  }
  next.dock = next.dock.map(entry => entry === app ? null : entry)
  if (folder?.kind === 'folder') folder.apps.push(app)
  else if (typeof target === 'number') {
    const displaced = next.dock[target]
    next.dock[target] = app
    if (displaced) page.items.push({ id: `app-${displaced}`, kind: 'app', app: displaced })
  } else destinationPage.items.push({ id: `app-${app}`, kind: 'app', app })
  return normalizeLauncherLayout(next)
}

/** Removing a folder or screen releases its shortcuts instead of hiding its contents. */
export function removeLauncherItem(layout: LauncherLayout, itemId: string): LauncherLayout {
  const next = normalizeLauncherLayout(layout)
  for (const page of next.pages) {
    const index = page.items.findIndex(item => item.id === itemId)
    if (index < 0) continue
    const item = page.items[index]
    page.items.splice(index, 1, ...(item.kind === 'folder' ? item.apps.map(app => ({ id: `app-${app}`, kind: 'app' as const, app })) : []))
  }
  return normalizeLauncherLayout(next)
}
export function removeLauncherPage(layout: LauncherLayout, pageId: string): LauncherLayout {
  const next = normalizeLauncherLayout(layout), index = next.pages.findIndex(page => page.id === pageId)
  if (index < 0 || next.pages.length < 2) return next
  const [page] = next.pages.splice(index, 1)
  next.pages[Math.max(0, index - 1)].items.push(...page.items)
  return next
}
