import { LAUNCHER_APPS, POCKET_SYSTEM_APPS, pocketAppInstalled } from '../../domain/launcher.js'
import type { LauncherApp, LauncherLayout } from '../../domain/launcher.js'
import { launcherIcon } from '../components/launcher-icons.js'
import { storeBanner } from '../components/store-banners.js'
import { button, el, requestId } from '../shared.js'

export interface AppStoreSession { query?: string; filter?: 'all' | 'installed' | 'available'; pending?: boolean; error?: string; focusApp?: LauncherApp; actionFocus?: string; scrollTop?: number; rails?: Record<string, number>; retainedApps?: LauncherApp[] }
interface AppStoreHost {
  layout: LauncherLayout
  ui: AppStoreSession
  page(): { page: HTMLDivElement; content: HTMLDivElement }
  open(app: LauncherApp): void
  install(app: LauncherApp, installed: boolean, focusKey?: string): void
  onCleanup?(cleanup: () => void): void
}
const POCKET_APP_DESCRIPTIONS: Record<Exclude<LauncherApp, 'appstore'>, [string, string]> = {
  bank:['For life’s little expenses','A fictional wallet with currencies, transactions, loans and bills.'],
  birthdays:['A little reason to celebrate','Keep birthdays, find dates in saved contact briefs, and add celebrations to Timeline.'],
  browser:['A window into your world','Fictional pages, tabs, bookmarks and playful quizzes generated for your scene.'],
  maps:['Somewhere new to go','Discover fictional places, save favourites and make plans.'],
  twitch:['Your corner of the internet','Watch fictional streams or go live, chat and send gifts from your Pocket wallet.'],
  stickers:['Say it with a little sticker','Upload, generate and collect stickers to send in Pocket conversations.'],
  dating:['Find a little chemistry','Discover people, build profiles and connections, and make plans in your fictional world.'],
  spotify:['Send a song','Share your current Spotify track and selected lyrics through SpotifyControls.'],
  sharing:['Show a little context','Preview and share selected Pocket excerpts and photo descriptions with a conversation.'],
  twitter: ['A little bird told you', 'Quick posts, replies, quotes, and voices from across your world.'],
  discord: ['Find your people', 'Your own servers, channels, and conversations with the community.'],
  instagram: ['Little moments, shared', 'Photos, captions, and comments from your cast and beyond.'],
  tumblr: ['Your very own corner', 'Text posts, tags, art, and reblog trails. Make a little noise.'],
  messages: ['Stay in touch', 'Direct messages, group chats, and voice messages.'],
  contacts: ['Your people', 'Keep your cast and their details close.'],
  camera: ['Capture the moment', 'Turn a moment in your story into a picture.'],
  gallery: ['Little memories', 'Your photos, character images, and wallpapers.'],
  notes: ['Keep a little note', 'A private journal, or memories to share with the story.'],
  weather: ['A world outside', 'The weather where your story takes place.'],
  calendar: ['Make some plans', 'Story time, invitations, and what happens next.'],
  trackers: ['Watch things change', 'Health, relationships, countdowns, and your own trackers.'],
  settings: ['Make it yours', 'Themes, wallpapers, connections, and Pocket preferences.'],
}

const storeViewUpdates = new WeakMap<HTMLDivElement, (layout: LauncherLayout) => void>()
/** Installation updates patch the mounted Store instead of replacing its scroll containers. */
export function updateAppStore(page: HTMLDivElement, layout: LauncherLayout): boolean {
  const update = storeViewUpdates.get(page)
  if (!update) return false
  update(layout); return true
}

export function renderAppStore(host: AppStoreHost): HTMLDivElement {
  const { page, content } = host.page(), { ui } = host
  let layout = host.layout
  const installControls: Array<() => void> = []
  content.classList.add('lp-store')
  const searchLabel = el('label', 'lp-store-search'), search = el('input', 'lp-input')
  const searchIcon = el('span', 'lp-store-search-icon'); searchIcon.setAttribute('aria-hidden', 'true')
  searchIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>'
  searchLabel.append(el('span', 'lp-sr-only', 'Search Pocket apps'), searchIcon, search)
  search.type = 'search'; search.placeholder = 'Search Pocket apps'; search.value = ui.query || ''; search.dataset.storeFocus = 'search'; search.disabled = Boolean(ui.pending)
  content.append(searchLabel)
  const error = el('p', 'lp-store-error'); error.setAttribute('role', 'alert'); error.hidden = !ui.error; content.append(error)
  const filters = el('div', 'lp-store-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Filter Pocket apps')
  content.append(filters)
  const discovery = el('div', 'lp-store-discovery')
  const intro = el('header', 'lp-store-intro'); intro.append(el('span', 'lp-store-eyebrow', 'DISCOVER'), el('h2', '', 'Made for your pocket.'))
  discovery.append(intro)
  const rails: Array<{ node: HTMLDivElement; key: string; update(): void }> = []
  let scrollRestored = false
  const collection = (title: string, key: string) => {
    const section = el('section', 'lp-store-collection'), heading = el('div', 'lp-store-section-heading'), label = el('h2', '', title), controls = el('div', 'lp-store-rail-controls')
    const rail = el('div', `lp-store-rail lp-store-rail-${key}`), id = requestId('store_rail')
    label.id = id + '_label'; section.setAttribute('aria-labelledby', label.id)
    rail.id = id; rail.tabIndex = 0; rail.setAttribute('role', 'region'); rail.setAttribute('aria-label', `${title} app cards`); rail.dataset.storeFocus = `rail:${key}`
    const previous = button('‹', 'lp-store-rail-control'), next = button('›', 'lp-store-rail-control')
    for (const [control, direction] of [[previous, 'Previous'], [next, 'Next']] as const) { control.setAttribute('aria-label', `${direction} ${title.toLowerCase()} apps`); control.setAttribute('aria-controls', id); control.dataset.storeFocus = `${key}:${direction}`; control.disabled = Boolean(ui.pending) }
    previous.disabled = true
    const update = () => { previous.disabled = Boolean(ui.pending) || rail.scrollLeft < 1; next.disabled = Boolean(ui.pending) || (rail.clientWidth > 0 && rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1) }
    const move = (amount: number) => {
      const reduce = rail.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (rail.scrollBy) rail.scrollBy({ left: amount, behavior: reduce ? 'instant' : 'smooth' }); else rail.scrollLeft += amount
    }
    previous.onclick = () => move(-rail.clientWidth * .9); next.onclick = () => move(rail.clientWidth * .9)
    rail.onscroll = () => { if (!rail.isConnected || !scrollRestored) return; ui.rails ||= {}; ui.rails[key] = rail.scrollLeft; update() }
    rail.onkeydown = event => {
      if (event.target !== rail || ui.pending) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(rail.clientWidth * (event.key === 'ArrowRight' ? .9 : -.9)) }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); rail.scrollLeft = event.key === 'Home' ? 0 : rail.scrollWidth }
    }
    controls.append(previous, next); heading.append(label, controls); section.append(heading, rail); rails.push({ node: rail, key, update }); discovery.append(section)
    return rail
  }
  const rememberScroll = () => {
    if (!scrollRestored) return
    ui.scrollTop = page.scrollTop; ui.rails ||= {}
    for (const rail of rails) ui.rails[rail.key] = rail.node.scrollLeft
  }
  host.onCleanup?.(() => { if (content.isConnected) rememberScroll() })
  const primaryAction = (app: Exclude<LauncherApp, 'appstore'>, context = '', focusKey = `app:${app}`) => {
    const meta = LAUNCHER_APPS.find(meta => meta.app === app)!
    const action = button('', 'lp-store-get'); action.dataset.storeFocus = focusKey
    const update = () => { const verb = pocketAppInstalled(layout, app) ? 'Open' : 'Get'; action.textContent = verb; action.setAttribute('aria-label', `${verb} ${meta.label}${context ? ` from ${context}` : ''}`); action.disabled = Boolean(ui.pending) }
    installControls.push(update); update()
    action.onclick = () => { rememberScroll(); if (pocketAppInstalled(layout, app)) host.open(app); else { if (ui.filter && ui.filter !== 'all') ui.retainedApps = [...new Set([...(ui.retainedApps || []), app])]; host.install(app, true, focusKey) } }
    return action
  }
  const spotlight = collection('Spotlight', 'spotlight')
  for (const [app, kicker, title] of [['camera', 'MAKE A MEMORY', 'Stories, in focus.'], ['weather', 'OUTSIDE YOUR WINDOW', 'A world with weather.'], ['trackers', 'FOLLOW THE STORY', 'Every little change.']] as const) {
    const card = el('article', 'lp-store-feature'), art = storeBanner(app), headline = el('div', 'lp-store-feature-headline')
    art.dataset.bannerApp = app; headline.append(el('span', 'lp-store-eyebrow', kicker), el('h3', '', title)); art.append(headline)
    const caption = el('div', 'lp-store-feature-caption'), icon = el('span', `lp-store-app-icon lp-icon-${app}`), copy = el('div')
    icon.append(launcherIcon(app)); copy.append(el('h3', '', LAUNCHER_APPS.find(meta => meta.app === app)!.label), el('span', '', POCKET_APP_DESCRIPTIONS[app][0]))
    caption.append(icon, copy, primaryAction(app, 'Spotlight', `spotlight:${app}`)); card.append(art, caption); spotlight.append(card)
  }
  const everyday = collection('Everyday favorites', 'everyday')
  for (const app of ['messages', 'notes', 'gallery'] as const) {
    const meta = LAUNCHER_APPS.find(meta => meta.app === app)!
    const tile = button('', 'lp-store-tile'), art = el('span', `lp-store-app-icon lp-icon-${meta.icon}`)
    tile.dataset.storeFocus = `everyday:${app}`
    const action = el('span', 'lp-store-tile-action')
    art.append(launcherIcon(app)); tile.append(art, el('strong', '', meta.label), el('span', 'lp-store-tile-tagline', POCKET_APP_DESCRIPTIONS[app][0]), action)
    const update = () => { const installed = pocketAppInstalled(layout, app); tile.setAttribute('aria-label', `${installed ? 'Open' : 'Get'} ${meta.label} from Everyday favorites`); action.textContent = installed ? 'Open ↗' : 'Get +'; tile.disabled = Boolean(ui.pending) }; installControls.push(update); update()
    tile.onclick = () => { rememberScroll(); if (pocketAppInstalled(layout, app)) host.open(app); else host.install(app, true, `everyday:${app}`) }; everyday.append(tile)
  }
  content.append(discovery)
  const list = el('div', 'lp-store-list'), empty = el('p', 'lp-copy', 'No matching apps.')
  const catalogHeading = el('h2', 'lp-store-catalog-title', 'All Pocket apps')
  const filterButtons: Array<[string, HTMLButtonElement]> = []
  const entries = LAUNCHER_APPS.filter(meta => meta.app !== 'appstore').map(meta => {
    const system = POCKET_SYSTEM_APPS.includes(meta.app)
    const card = el('article', 'lp-store-app'), art = el('span', `lp-store-app-icon lp-icon-${meta.icon}`)
    art.append(launcherIcon(meta.app))
    const copy = el('div', 'lp-store-copy'), [tagline, description] = POCKET_APP_DESCRIPTIONS[meta.app]!
    copy.append(el('h3', '', meta.label), el('span', 'lp-store-tagline', tagline), el('p', '', description))
    const actions = el('div', 'lp-store-actions'), primary = primaryAction(meta.app)
    actions.append(primary)
    if (system) actions.append(el('span', 'lp-store-system', 'System app'))
    else {
      const remove = button('Remove', 'lp-store-remove'); remove.setAttribute('aria-label', `Remove ${meta.label} from this phone`); remove.disabled = Boolean(ui.pending)
      remove.onclick = () => { rememberScroll(); if (ui.filter && ui.filter !== 'all') ui.retainedApps = [...new Set([...(ui.retainedApps || []), meta.app])]; host.install(meta.app, false) }; actions.append(remove)
      installControls.push(() => { const installed = pocketAppInstalled(layout, meta.app); remove.style.visibility = installed ? '' : 'hidden'; remove.disabled = Boolean(ui.pending) || !installed })
    }
    card.append(art, copy, actions)
    if (ui.focusApp === meta.app) card.dataset.highlighted = 'true'
    list.append(card)
    return { card, meta, text: `${meta.label} ${tagline} ${description}`.toLowerCase() }
  })
  const applyFilter = () => {
    for (const entry of entries) entry.card.hidden = !(entry.text.includes((ui.query || '').trim().toLowerCase()) && (ui.retainedApps?.includes(entry.meta.app) || (ui.filter === 'installed' ? pocketAppInstalled(layout, entry.meta.app) : ui.filter === 'available' ? !pocketAppInstalled(layout, entry.meta.app) : true)))
    for (const [value, control] of filterButtons) control.setAttribute('aria-pressed', String(value === (ui.filter || 'all')))
    empty.hidden = entries.some(entry => !entry.card.hidden)
    discovery.hidden = Boolean(ui.query?.trim() || (ui.filter && ui.filter !== 'all'))
    soon.hidden = discovery.hidden
    catalogHeading.textContent = ui.query?.trim() ? 'Search results' : ui.filter === 'installed' ? 'On your phone' : ui.filter === 'available' ? 'Available apps' : 'All Pocket apps'
  }
  for (const [value, name] of [['all', 'All apps'], ['installed', 'On your phone'], ['available', 'Available']] as const) {
    const filter = button(name, 'lp-store-filter'); filter.dataset.storeFocus = `filter:${value}`; filter.disabled = Boolean(ui.pending); filter.onclick = () => { ui.filter = value; ui.retainedApps = []; applyFilter(); page.scrollTop = 0 }; filters.append(filter); filterButtons.push([value, filter])
  }
  search.oninput = () => { ui.query = search.value; ui.retainedApps = []; applyFilter(); page.scrollTop = 0 }
  content.append(catalogHeading, list, empty)
  const soon = el('section', 'lp-store-soon'); soon.setAttribute('aria-label', 'Socials for your pocket')
  soon.append(storeBanner('social'), el('span', 'lp-store-eyebrow', 'A LITTLE MORE WORLD'), el('strong', '', 'Socials are here.'), el('p', '', 'Your cast, your communities, and people you haven’t met yet.'))
  for (const app of ['twitter', 'discord', 'instagram', 'tumblr'] as const) {
    const row = el('div', 'lp-store-feature-caption'), art = el('span', `lp-store-app-icon lp-icon-${app}`), copy = el('div')
    art.append(launcherIcon(app)); copy.append(el('h3', '', LAUNCHER_APPS.find(meta => meta.app === app)!.label), el('span', '', POCKET_APP_DESCRIPTIONS[app][0]))
    row.append(art, copy, primaryAction(app, 'Socials', `socials:${app}`)); soon.append(row)
  }
  discovery.insertBefore(soon, everyday.parentElement)
  const note = el('p', 'lp-store-note', 'Removing an app hides it from this phone. Your saved data and layout stay safe.')
  content.append(note)
  const update = (next: LauncherLayout) => {
    const top = page.scrollTop
    layout = next
    error.textContent = ui.error || ''; error.hidden = !ui.error
    search.disabled = Boolean(ui.pending)
    if (search.value !== (ui.query || '')) search.value = ui.query || ''
    for (const [, control] of filterButtons) control.disabled = Boolean(ui.pending)
    for (const updateControl of installControls) updateControl()
    for (const rail of rails) rail.update()
    applyFilter()
    page.scrollTop = top
  }
  storeViewUpdates.set(page, update); update(layout)
  page.onscroll = () => { if (content.isConnected && scrollRestored) ui.scrollTop = page.scrollTop }
  content.ownerDocument.defaultView?.requestAnimationFrame?.(() => {
    if (!page.isConnected) return
    page.scrollTop = ui.scrollTop || 0
    for (const rail of rails) { rail.node.scrollLeft = ui.rails?.[rail.key] || 0; rail.update() }
    scrollRestored = true
  })
  return page
}
