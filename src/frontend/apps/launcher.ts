import { LAUNCHER_APPS, MAX_LAUNCHER_ITEMS, MAX_LAUNCHER_PAGES, launcherItemCount, normalizeLauncherLayout, placeLauncherApp, pocketAppInstalled, removeLauncherItem, removeLauncherPage } from '../../domain/launcher.js'
import type { LauncherApp, LauncherItem, LauncherLayout } from '../../domain/launcher.js'
import type { PhoneState } from '../../types.js'
import { trackerDisplay, refreshTrackerDisplay } from '../components/tracker-display.js'
import { launcherWeatherWidget } from '../components/launcher-weather.js'
import { launcherClockWidget } from '../components/launcher-clock.js'
import { button, el, requestId } from '../shared.js'

export interface LauncherSession {
  drawer?: boolean
  query?: string
  draft?: LauncherLayout
  selected?: LauncherApp
  selectedItem?: string
  pageId?: string
  folderId?: string
  widgetPicker?: boolean
  scrollTop?: number
  placingSlot?: number
  pending?: boolean
  error?: string
}
interface LauncherHost {
  state: PhoneState
  layout: LauncherLayout
  ui: LauncherSession
  appIcon(meta: typeof LAUNCHER_APPS[number], activate: () => void): HTMLButtonElement
  open(app: LauncherApp): void
  openTracker(id: string): void
  onCleanup(cleanup: () => void): void
  save(layout: LauncherLayout): void
}

/** State belongs to the controller's logical device, never a module-global phone. */
export function renderLauncher(host: LauncherHost, extras: HTMLElement[]): HTMLDivElement {
  const root = el('div', 'lp-home lp-launcher'), { ui } = host
  const liveWidgets = new Map<HTMLElement, { trackerId: string; compact: boolean }>()
  const meta = (app: LauncherApp) => LAUNCHER_APPS.find(entry => entry.app === app)!
  const trackerLabel = (id: string) => {
    const tracker = host.state.trackers.find(entry => entry.id === id)
    if (!tracker) return 'Unavailable tracker'
    const duplicates = host.state.trackers.filter(entry => entry.label === tracker.label)
    return duplicates.length > 1 ? `${tracker.label} · ${tracker.target.label || tracker.target.type} (${duplicates.findIndex(entry => entry.id === id) + 1})` : tracker.label
  }
  const clearSelection = () => { ui.selected = undefined; ui.selectedItem = undefined; ui.placingSlot = undefined }
  const folderLabel = (layout: LauncherLayout, folder: Extract<LauncherItem, { kind: 'folder' }>) => {
    if (layout.pages.flatMap(page => page.items).filter(item => item.kind === 'folder' && item.name === folder.name).length < 2) return folder.name
    const page = layout.pages.find(page => page.items.some(item => item.id === folder.id))!
    return `${folder.name} (${page.name}, position ${page.items.findIndex(item => item.id === folder.id) + 1})`
  }
  const action = (text: string, name: string, run: () => void) => {
    const control = button(text, 'lp-launcher-action')
    control.setAttribute('aria-label', name); control.dataset.launcherFocus = name
    control.disabled = Boolean(ui.pending); control.onclick = run; return control
  }
  const paint = (focus?: string) => {
    const scroll = ui.scrollTop || 0
    liveWidgets.clear()
    root.replaceChildren()
    root.dataset.editing = String(Boolean(ui.draft))
    root.dataset.drawer = String(Boolean(ui.drawer))
    const layout = ui.draft || normalizeLauncherLayout(host.layout)
    const installed = (app: LauncherApp) => pocketAppInstalled(layout, app)
    const page = layout.pages.find(page => page.id === ui.pageId) || layout.pages[0]
    ui.pageId = page.id
    const allItems = () => layout.pages.flatMap(page => page.items)
    const widgetLabel = (item: Extract<LauncherItem, { kind: 'tracker' }>) => {
      const missing = allItems().filter(item => item.kind === 'tracker' && !host.state.trackers.some(tracker => tracker.id === item.trackerId))
      return !host.state.trackers.some(tracker => tracker.id === item.trackerId) && missing.length > 1 ? `Unavailable tracker ${missing.findIndex(entry => entry.id === item.id) + 1}` : trackerLabel(item.trackerId)
    }
    const canAdd = launcherItemCount(layout) < MAX_LAUNCHER_ITEMS
    const selectedItem = allItems().find(item => item.id === ui.selectedItem)
    let selectedLabel = ui.selected ? meta(ui.selected).label : selectedItem?.kind === 'folder' ? selectedItem.name : selectedItem?.kind === 'clock' ? 'Clock & date widget' : selectedItem?.kind === 'weather' ? 'Weather widget' : selectedItem?.kind === 'tracker' ? `${widgetLabel(selectedItem)} widget` : ''
    const toolbar = el('div', 'lp-launcher-toolbar')
    toolbar.append(action(ui.drawer ? '‹ Home' : 'All apps', ui.drawer ? 'Return to Home' : 'Open app drawer', () => {
      ui.drawer = !ui.drawer; ui.placingSlot = undefined; ui.widgetPicker = false; ui.folderId = undefined; ui.query = ''; paint(ui.drawer ? 'Search apps' : 'Open app drawer')
    }))
    if (ui.draft) {
      toolbar.append(action('Cancel', 'Cancel layout changes', () => { ui.draft = undefined; clearSelection(); ui.folderId = undefined; ui.widgetPicker = false; ui.error = undefined; ui.drawer = false; paint('Edit home screen') }),
        action(ui.pending ? 'Saving…' : 'Done', 'Save home layout', () => { ui.pending = true; ui.error = undefined; host.save(structuredClone(ui.draft!)); paint('Save home layout') }))
    } else toolbar.append(action('Edit', 'Edit home screen', () => { ui.draft = structuredClone(layout); paint('Cancel layout changes') }))
    root.append(toolbar)
    if (ui.error) { const error = el('p', 'lp-launcher-error', ui.error); error.setAttribute('role', 'alert'); root.append(error) }
    const appButton = (app: LauncherApp) => {
      const control = host.appIcon(meta(app), () => {
        if (ui.pending) return
        if (ui.draft) {
          if (ui.placingSlot !== undefined) ui.draft = placeLauncherApp(ui.draft, app, ui.placingSlot, page.id)
          clearSelection(); ui.selected = app; ui.drawer = false; ui.folderId = undefined; paint(`Move ${meta(app).label} to`)
        }
        else host.open(app)
      })
      control.dataset.launcherFocus = `Arrange ${meta(app).label}`
      control.disabled = Boolean(ui.pending)
      if (ui.draft) {
        control.setAttribute('aria-label', `Arrange ${meta(app).label}`)
        control.setAttribute('aria-pressed', String(ui.selected === app))
      }
      return control
    }
    if (ui.widgetPicker && ui.draft) {
      const picker = el('section', 'lp-launcher-widget-picker'); picker.setAttribute('aria-label', 'Widgets')
      picker.append(el('h2', 'lp-launcher-title', 'Widgets'), action('‹ Home', 'Close widget picker', () => { ui.widgetPicker = false; paint('Add widget') }))
      if (installed('weather') && !allItems().some(item => item.kind === 'weather')) {
        const add = action('Weather · Current story weather', 'Add Weather widget', () => {
          const item: LauncherItem = { id: requestId('weather'), kind: 'weather', size: 'compact', variant: 'stripe' }
          page.items.push(item); clearSelection(); ui.selectedItem = item.id; ui.widgetPicker = false; paint('Move Weather widget to')
        })
        add.disabled ||= !canAdd; picker.append(add)
      }
      if (!installed('weather')) picker.append(action('Get Weather in App Store', 'Get Weather in App Store', () => host.open('weather')))
      if (!allItems().some(item => item.kind === 'clock')) {
        const add = action('Clock & date · Story time', 'Add Clock & date widget', () => {
          const item: LauncherItem = { id: requestId('clock'), kind: 'clock', size: 'compact' }
          page.items.push(item); clearSelection(); ui.selectedItem = item.id; ui.widgetPicker = false; paint('Move Clock & date widget to')
        })
        add.disabled ||= !canAdd; picker.append(add)
      }
      picker.append(el('h3', 'lp-title', 'Trackers'))
      const pinned = new Set(allItems().flatMap(item => item.kind === 'tracker' ? [item.trackerId] : []))
      const available = host.state.trackers.filter(tracker => !pinned.has(tracker.id))
      for (const tracker of installed('trackers') ? available : []) {
        const add = action(`${trackerLabel(tracker.id)} · ${tracker.target.label || tracker.target.type}`, `Add ${trackerLabel(tracker.id)} widget`, () => {
          const item: LauncherItem = { id: requestId('widget'), kind: 'tracker', trackerId: tracker.id, size: 'compact' }
          page.items.push(item); clearSelection(); ui.selectedItem = item.id; ui.widgetPicker = false; paint(`Move ${trackerLabel(tracker.id)} widget to`)
        })
        add.disabled ||= !canAdd; picker.append(add)
      }
      if (!installed('trackers')) picker.append(action('Get Trackers in App Store', 'Get Trackers in App Store', () => host.open('trackers')))
      else if (!available.length) picker.append(el('p', 'lp-launcher-subtitle', host.state.trackers.length ? 'Every tracker already has a widget.' : 'No trackers yet. Create one in Trackers.'), action('Open Trackers', 'Open Trackers', () => host.open('trackers')))
      root.append(picker)
    } else if (ui.drawer) {
      const drawer = el('section', 'lp-launcher-drawer'); drawer.setAttribute('aria-label', 'App drawer')
      drawer.append(el('h2', 'lp-launcher-title', 'All apps'), el('p', 'lp-launcher-subtitle', ui.draft ? 'Choose an app to place on your phone.' : 'Everything on your phone.'))
      const label = el('label', 'lp-launcher-search'), search = el('input')
      label.append(el('span', 'lp-sr-only', 'Search apps'), search)
      search.type = 'search'; search.placeholder = 'Search apps'; search.value = ui.query || ''; search.dataset.launcherFocus = 'Search apps'
      const grid = el('div', 'lp-app-grid'), empty = el('p', 'lp-launcher-subtitle', 'No matching apps.')
      const apps = [...LAUNCHER_APPS].filter(entry => installed(entry.app)).sort((a, b) => a.label.localeCompare(b.label)).map(entry => {
        const control = appButton(entry.app); grid.append(control); return { control, label: entry.label.toLowerCase() }
      })
      const filter = () => {
        const query = (ui.query || '').trim().toLowerCase()
        for (const entry of apps) entry.control.hidden = !entry.label.includes(query)
        empty.hidden = apps.some(entry => !entry.control.hidden)
      }
      search.oninput = () => { ui.query = search.value; filter() }; filter()
      drawer.append(label, grid, empty, action('Find apps in App Store', 'Open App Store', () => host.open('appstore'))); root.append(drawer)
    } else {
      const body = el('div', 'lp-launcher-body')
      body.onscroll = () => { ui.scrollTop = body.scrollTop }
      root.append(body)
      const openFolder = allItems().find(item => item.kind === 'folder' && item.id === ui.folderId)
      if (openFolder?.kind === 'folder') {
        const folderHead = el('div', 'lp-launcher-folder-heading')
        folderHead.append(el('h2', 'lp-launcher-title', openFolder.name), action('Close', 'Close folder', () => { ui.folderId = undefined; paint(`Open folder: ${folderLabel(layout, openFolder)}`) }))
        body.append(folderHead)
      } else ui.folderId = undefined
      if (ui.draft) {
        const tools = el('div', 'lp-launcher-edit-tools')
        const widget = action('Widget', 'Add widget', () => { ui.widgetPicker = true; ui.folderId = undefined; paint('Close widget picker') })
        const folder = action('Folder', 'Create folder', () => {
          const names = new Set(allItems().flatMap(item => item.kind === 'folder' ? [item.name] : []))
          let name = 'Folder'
          for (let number = 2; names.has(name); number++) name = `Folder ${number}`
          const item: LauncherItem = { id: requestId('folder'), kind: 'folder', name, apps: [] }
          page.items.push(item); clearSelection(); ui.folderId = undefined; ui.selectedItem = item.id; paint('Folder name')
        })
        widget.disabled ||= !canAdd; folder.disabled ||= !canAdd; tools.append(widget, folder)
        if (layout.pages.length > 1) {
          const receiver = layout.pages[layout.pages.indexOf(page) === 0 ? 1 : layout.pages.indexOf(page) - 1]
          tools.append(action('Remove screen', `Remove ${page.name} screen and move its items to ${receiver.name}`, () => {
            ui.draft = removeLauncherPage(layout, page.id); ui.pageId = receiver.id; ui.folderId = undefined; clearSelection(); paint('Cancel layout changes')
          }))
        }
        body.append(tools)
      }
      const grid = el('section', 'lp-app-grid'); grid.setAttribute('aria-label', 'Home apps')
      if (openFolder?.kind === 'folder') {
        grid.setAttribute('aria-label', `${openFolder.name} folder apps`)
        for (const app of openFolder.apps.filter(installed)) grid.append(appButton(app))
        if (!openFolder.apps.some(installed)) grid.append(el('p', 'lp-launcher-empty', 'No installed apps in this folder. Find apps in App Store.'))
      } else for (const item of page.items) {
        if (item.kind === 'app' && !installed(item.app) || item.kind === 'weather' && !installed('weather') || item.kind === 'tracker' && !installed('trackers')) continue
        if (item.kind === 'app') { grid.append(appButton(item.app)); continue }
        if (item.kind === 'folder') {
          const name = ui.draft ? `Arrange folder: ${folderLabel(layout, item)}` : `Open folder: ${folderLabel(layout, item)}`
          const tile = action('', name, () => {
            if (ui.draft) { clearSelection(); ui.selectedItem = item.id; paint('Folder name') }
            else { ui.folderId = item.id; paint('Close folder') }
          })
          tile.className = 'lp-app-icon'
          tile.dataset.launcherItem = item.id
          if (ui.draft) tile.setAttribute('aria-pressed', String(ui.selectedItem === item.id))
          const box = el('span', 'lp-app-icon-box lp-launcher-folder'), preview = el('span', 'lp-launcher-folder-preview')
          preview.setAttribute('aria-hidden', 'true')
          for (const app of item.apps.filter(installed).slice(0, 4)) {
            const miniature = host.appIcon(meta(app), () => {}).querySelector('.lp-app-icon-box')?.cloneNode(true) as HTMLElement | undefined
            miniature?.querySelectorAll('.lp-app-dot').forEach(dot => dot.remove())
            if (miniature) preview.append(miniature)
          }
          box.append(preview); tile.append(box, el('span', 'lp-app-label', item.name)); grid.append(tile)
        } else if (item.kind === 'weather' || item.kind === 'clock') {
          const name = item.kind === 'weather' ? 'Weather' : 'Clock & date'
          const widget = el('div', 'lp-launcher-widget'); widget.dataset.size = item.size; widget.dataset.systemWidget = item.kind
          if (item.kind === 'weather') widget.dataset.weatherVariant = item.variant || 'card'
          const open = action('', ui.draft ? `Arrange ${name} widget` : `Open ${name} widget`, () => {
            if (ui.draft) { clearSelection(); ui.selectedItem = item.id; paint(`Move ${name} widget to`) }
            else host.open(item.kind === 'weather' ? 'weather' : 'calendar')
          })
          open.className = 'lp-launcher-widget-open'
          if (ui.draft) open.setAttribute('aria-pressed', String(ui.selectedItem === item.id))
          widget.append(item.kind === 'weather' ? launcherWeatherWidget(host.state.weather, item.variant) : launcherClockWidget(host.state), open); grid.append(widget)
        } else {
          const tracker = host.state.trackers.find(tracker => tracker.id === item.trackerId)
          const widget = el('div', 'lp-launcher-widget'); widget.dataset.size = item.size
          widget.dataset.trackerWidget = item.trackerId
          const label = widgetLabel(item)
          const card = tracker ? trackerDisplay(item.size === 'compact' ? { ...tracker, presentation: 'compact' } : tracker, host.state) : el('div', 'lp-card lp-launcher-missing-widget', 'Tracker unavailable · remove this widget in Edit.')
          const open = action('', ui.draft ? `Arrange ${label} widget` : `Open tracker: ${label}`, () => {
            if (ui.draft) { clearSelection(); ui.selectedItem = item.id; paint(`Move ${label} widget to`) }
            else if (tracker) host.openTracker(tracker.id)
          })
          open.className = 'lp-launcher-widget-open'; open.disabled ||= !tracker && !ui.draft
          if (ui.draft) open.setAttribute('aria-pressed', String(ui.selectedItem === item.id))
          widget.append(card, open); grid.append(widget)
          if (tracker?.updateMode === 'automatic') liveWidgets.set(card, { trackerId: tracker.id, compact: item.size === 'compact' })
        }
      }
      if (!openFolder && !page.items.length) grid.append(el('p', 'lp-launcher-empty', ui.draft ? 'Add apps, folders, or tracker widgets to this screen.' : 'A little room to breathe. Find your apps in All apps.'))
      body.append(grid)
      if (ui.draft) {
        const editor = el('section', 'lp-launcher-editor'); editor.setAttribute('aria-label', 'Arrange shortcut')
        const selected = ui.selected
        const heading = el('div', 'lp-launcher-editor-heading')
        heading.append(el('strong', '', selectedLabel || 'Arrange your apps'))
        editor.append(heading)
        if (selected || selectedItem) {
          heading.append(action('Remove', `Remove ${selectedLabel}${selected ? ' shortcut' : ''}`, () => {
            if (selected) {
              ui.draft = removeLauncherItem(layout, allItems().find(item => item.kind === 'app' && item.app === selected)?.id || '')
              ui.draft.dock = ui.draft.dock.map(app => app === selected ? null : app)
              for (const page of ui.draft.pages) for (const item of page.items) if (item.kind === 'folder') item.apps = item.apps.filter(app => app !== selected)
            } else ui.draft = removeLauncherItem(layout, selectedItem!.id)
            clearSelection(); paint('Cancel layout changes')
          }))
          if (selectedItem?.kind === 'folder') {
            const name = el('label', 'lp-launcher-location'), input = el('input')
            name.append(el('span', 'lp-sr-only', 'Folder name'), input); input.type = 'text'; input.maxLength = 40; input.value = selectedItem.name; input.dataset.launcherFocus = 'Folder name'; input.disabled = Boolean(ui.pending)
            input.oninput = () => {
              const previous = selectedLabel
              selectedItem.name = input.value.trim().slice(0, 40) || 'Folder'; selectedLabel = selectedItem.name
              heading.querySelector('strong')!.textContent = selectedLabel
              const names = new Map([['Remove ' + previous, 'Remove ' + selectedLabel], ['Edit apps in ' + previous, 'Edit apps in ' + selectedLabel], ['Move ' + previous + ' to', 'Move ' + selectedLabel + ' to'], ['Move earlier: ' + previous, 'Move earlier: ' + selectedLabel], ['Move later: ' + previous, 'Move later: ' + selectedLabel]])
              for (const control of editor.querySelectorAll<HTMLElement>('[aria-label],[data-launcher-focus]')) {
                const name = control.getAttribute('aria-label'), focus = control.dataset.launcherFocus
                if (name && names.has(name)) control.setAttribute('aria-label', names.get(name)!)
                if (focus && names.has(focus)) control.dataset.launcherFocus = names.get(focus)!
              }
              for (const label of editor.querySelectorAll('label > .lp-sr-only')) if (names.has(label.textContent || '')) label.textContent = names.get(label.textContent!)!
              for (const tile of root.querySelectorAll<HTMLElement>('[data-launcher-item]')) if (tile.dataset.launcherItem === selectedItem.id) {
                tile.querySelector('.lp-app-label')!.textContent = selectedLabel
                tile.setAttribute('aria-label', `Arrange folder: ${folderLabel(layout, selectedItem)}`); tile.dataset.launcherFocus = `Arrange folder: ${folderLabel(layout, selectedItem)}`
              }
            }
            editor.append(name, action('Open folder', `Edit apps in ${selectedItem.name}`, () => { ui.folderId = selectedItem.id; clearSelection(); paint('Close folder') }))
          }
          const controls = el('div', 'lp-launcher-editor-actions'), location = el('label', 'lp-launcher-location')
          location.append(el('span', 'lp-sr-only', `Move ${selectedLabel} to`))
          const destination = el('select')
          for (const screen of layout.pages) { const option = el('option', '', screen.name); option.value = `page:${screen.id}`; destination.append(option) }
          if (selected) layout.dock.forEach((app, index) => {
            const option = el('option', '', `Dock ${index + 1} · ${app ? meta(app).label : 'Empty'}`)
            option.value = String(index); destination.append(option)
          })
          if (selected) for (const folder of allItems().filter(item => item.kind === 'folder')) {
            const option = el('option', '', `Folder · ${folderLabel(layout, folder)}`); option.value = `folder:${folder.id}`; destination.append(option)
          }
          const sourcePage = layout.pages.find(page => page.items.some(item => item.id === selectedItem?.id || (item.kind === 'app' && item.app === selected)))
          const sourceFolder = selected ? allItems().find(item => item.kind === 'folder' && item.apps.includes(selected)) : null
          const dockIndex = selected ? layout.dock.indexOf(selected) : -1
          // An app chosen from the drawer can have no shortcut yet.
          const hidden = !sourcePage && !sourceFolder && dockIndex < 0
          if (hidden) {
            const option = el('option', '', 'Choose location…'); option.value = ''; option.disabled = true; destination.prepend(option)
          }
          destination.value = hidden ? '' : dockIndex >= 0 ? String(dockIndex) : sourceFolder ? `folder:${sourceFolder.id}` : `page:${sourcePage!.id}`
          destination.disabled = Boolean(ui.pending); destination.dataset.launcherFocus = `Move ${selectedLabel} to`
          destination.onchange = () => {
            const value = destination.value
            if (selected) ui.draft = placeLauncherApp(layout, selected, value.startsWith('page:') ? { pageId: value.slice(5) } : value.startsWith('folder:') ? { folderId: value.slice(7) } : Number(value), page.id)
            else if (selectedItem && value.startsWith('page:')) {
              for (const screen of layout.pages) screen.items = screen.items.filter(item => item.id !== selectedItem.id)
              layout.pages.find(page => page.id === value.slice(5))!.items.push(selectedItem)
            }
            if (value.startsWith('page:')) { ui.pageId = value.slice(5); ui.folderId = undefined }
            paint(`Move ${selectedLabel} to`)
          }
          location.append(destination); controls.append(location)
          const siblings = sourceFolder?.kind === 'folder' ? sourceFolder.apps : sourcePage?.items
          const index = selected && sourceFolder?.kind === 'folder' ? sourceFolder.apps.indexOf(selected) : sourcePage?.items.findIndex(item => item.id === selectedItem?.id || (item.kind === 'app' && item.app === selected)) ?? -1
          for (const [offset, text] of [[-1, 'Move earlier'], [1, 'Move later']] as const) {
            const move = action(offset < 0 ? '←' : '→', `${text}: ${selectedLabel}`, () => {
              if (siblings) [siblings[index], siblings[index + offset]] = [siblings[index + offset], siblings[index]]; paint(`${text}: ${selectedLabel}`)
            })
            move.title = text
            move.disabled ||= index < 0 || index + offset < 0 || index + offset >= (siblings?.length || 0)
            controls.append(move)
          }
          editor.append(controls)
          if (selectedItem?.kind === 'tracker' || selectedItem?.kind === 'weather' || selectedItem?.kind === 'clock') {
            const name = selectedItem.kind === 'weather' ? 'Weather' : selectedItem.kind === 'clock' ? 'Clock & date' : trackerLabel(selectedItem.trackerId)
            const label = el('label', 'lp-launcher-location'), size = el('select')
            label.append(el('span', 'lp-sr-only', `Widget size: ${name}`), size)
            for (const value of ['compact', 'wide'] as const) { const option = el('option', '', value === 'compact' ? 'Compact · half width' : 'Wide · full width'); option.value = value; size.append(option) }
            size.value = selectedItem.size; size.disabled = Boolean(ui.pending); size.dataset.launcherFocus = `Widget size: ${name}`
            size.onchange = () => { selectedItem.size = size.value === 'wide' ? 'wide' : 'compact'; paint(size.dataset.launcherFocus) }; editor.append(label)
          }
          if (selectedItem?.kind === 'weather') {
            const label = el('label', 'lp-launcher-location'), variant = el('select')
            label.append(el('span', 'lp-sr-only', 'Weather layout'), variant)
            for (const [value, text] of [['card', 'Card · 2 app rows'], ['stripe', 'Stripe · 1 app row']]) { const option = el('option', '', text); option.value = value; variant.append(option) }
            variant.value = selectedItem.variant || 'card'; variant.disabled = Boolean(ui.pending); variant.dataset.launcherFocus = 'Weather layout'
            variant.onchange = () => { if (variant.value === 'stripe') selectedItem.variant = 'stripe'; else delete selectedItem.variant; paint('Weather layout') }
            editor.append(label)
          }
        } else editor.append(el('p', '', 'Select an app, or add one from All apps.'))
        body.append(editor)
      } else body.append(...extras)
      const footer = el('div', 'lp-launcher-footer'), dock = el('nav', 'lp-home-dock'); dock.setAttribute('aria-label', 'Dock')
      const dots = el('nav', 'lp-launcher-pages'); dots.setAttribute('aria-label', 'Home screens')
      layout.pages.forEach((screen, index) => {
        const dot = action('', `Go to Home screen ${index + 1}: ${screen.name}`, () => { ui.pageId = screen.id; ui.folderId = undefined; clearSelection(); ui.scrollTop = 0; paint(`Go to Home screen ${index + 1}: ${screen.name}`) })
        dot.classList.add('lp-launcher-page-dot'); dot.title = screen.name
        if (screen.id === page.id) dot.setAttribute('aria-current', 'page')
        const mark = el('span'); mark.setAttribute('aria-hidden', 'true'); dot.append(mark); dots.append(dot)
      })
      if (ui.draft) {
        const add = action('+', 'Add Home screen', () => {
          let number = layout.pages.length + 1
          while (layout.pages.some(page => page.name === `Screen ${number}`)) number++
          const screen = { id: requestId('screen'), name: `Screen ${number}`, items: [] }
          layout.pages.push(screen); ui.pageId = screen.id; ui.folderId = undefined; ui.scrollTop = 0; clearSelection(); paint('Add Home screen')
        })
        add.classList.add('lp-launcher-page-add'); add.disabled ||= layout.pages.length >= MAX_LAUNCHER_PAGES; dots.append(add)
        add.title = `Up to ${MAX_LAUNCHER_PAGES} Home screens`
      }
      layout.dock.forEach((app, index) => {
        if (app && installed(app)) dock.append(appButton(app))
        else {
          const empty = action('+', `Choose app for dock slot ${index + 1}`, () => { ui.draft ||= structuredClone(layout); ui.placingSlot = index; ui.drawer = true; ui.query = ''; paint('Search apps') })
          empty.classList.add('lp-launcher-empty-slot'); dock.append(empty)
        }
      })
      footer.append(dots, dock); root.append(footer)
      body.scrollTop = scroll
      if (!root.isConnected) root.ownerDocument.defaultView?.requestAnimationFrame?.(() => { if (body.isConnected) body.scrollTop = scroll })
    }
    if (focus) root.querySelectorAll<HTMLElement>('[data-launcher-focus]').forEach(node => {
      if (node.dataset.launcherFocus !== focus) return
      node.focus({ preventScroll: true })
      const body = node.closest('.lp-launcher-body')
      if (body && root.isConnected) { const bounds = body.getBoundingClientRect(), target = node.getBoundingClientRect(); if (target.top < bounds.top || target.bottom > bounds.bottom) node.scrollIntoView?.({ block: 'nearest' }) }
    })
  }
  // The controller handles the phone-level Escape path after this local surface.
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || ui.pending) return
    if (ui.folderId) { const layout = ui.draft || host.layout; const folder = layout.pages.flatMap(page => page.items).find(item => item.id === ui.folderId); ui.folderId = undefined; paint(folder?.kind === 'folder' ? `Open folder: ${folderLabel(layout, folder)}` : 'Open app drawer') }
    else if (ui.widgetPicker) { ui.widgetPicker = false; paint('Add widget') }
    else if (ui.drawer) { ui.placingSlot = undefined; ui.drawer = false; ui.query = ''; paint('Open app drawer') }
    else if (ui.draft) { ui.draft = undefined; clearSelection(); ui.error = undefined; paint('Edit home screen') }
    else return
    event.preventDefault(); event.stopPropagation()
  })
  paint()
  if (host.state.trackers.some(tracker => tracker.updateMode === 'automatic')) {
    const timer = setInterval(() => {
      if (!root.isConnected || root.closest('[hidden]')) return
      for (const [card, entry] of liveWidgets) {
        const tracker = host.state.trackers.find(tracker => tracker.id === entry.trackerId)
        if (tracker) refreshTrackerDisplay(card, entry.compact ? { ...tracker, presentation: 'compact' } : tracker, host.state)
      }
    }, 1000)
    host.onCleanup(() => clearInterval(timer))
  }
  return root
}
