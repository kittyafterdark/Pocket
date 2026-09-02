import type { PhoneState, PhoneTracker, TrackerKind, TrackerPresentation, TrackerTarget, TrackerUpdateMode } from '../../types.js'
import { materializeTracker, TRACKER_TEMPLATES, trackerBand, trackerKey } from '../../domain/trackers.js'
import { button, el } from '../shared.js'
import type { PageAction } from '../shared.js'

type Field = { label: HTMLLabelElement; input: HTMLInputElement }
type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface TrackerViewHost {
  state: PhoneState
  selectedId: string
  selectedView: 'detail' | 'config'
  accent: string
  page(title: string, subtitle?: string, action?: PageAction): Page
  field(label: string, value?: string, type?: string): Field
  send(type: string, payload?: Record<string, unknown>): void
  select(id: string, view?: 'detail' | 'config'): void
  back(): void
  onCleanup(cleanup: () => void): void
}

function selectField(labelText: string, options: Array<[string, string]>, selected: string): { label: HTMLLabelElement; select: HTMLSelectElement } {
  const label = el('label', 'lp-label', labelText)
  const select = el('select', 'lp-select')
  for (const [value, name] of options) {
    const option = el('option', '', name)
    option.value = value
    option.selected = selected === value
    select.appendChild(option)
  }
  label.appendChild(select)
  return { label, select }
}

function toggle(labelText: string, initial: boolean): { row: HTMLDivElement; button: HTMLButtonElement } {
  const row = el('div', 'lp-card lp-row-between')
  const copy = el('div')
  copy.appendChild(el('div', 'lp-title', labelText))
  const control = button('', 'lp-toggle')
  control.setAttribute('aria-pressed', String(initial))
  control.setAttribute('aria-label', labelText)
  control.addEventListener('click', () => control.setAttribute('aria-pressed', String(control.getAttribute('aria-pressed') !== 'true')))
  row.append(copy, control)
  return { row, button: control }
}

function displayValue(tracker: PhoneTracker): string {
  return tracker.kind === 'state' ? tracker.state : `${Number(tracker.value.toFixed(2))}${tracker.unit}`
}

function liveTracker(tracker: PhoneTracker, roleplayNow: string): PhoneTracker {
  return tracker.clock === 'real' ? materializeTracker(tracker, roleplayNow).tracker : tracker
}

function percent(tracker: PhoneTracker): number {
  return Math.max(0, Math.min(100, ((tracker.value - tracker.min) / Math.max(.00001, tracker.max - tracker.min)) * 100))
}

function targetLabel(target: TrackerTarget): string {
  return `${target.type[0].toUpperCase()}${target.type.slice(1)} · ${target.label || target.id || 'Unassigned'}`
}

function renderPresentation(tracker: PhoneTracker, roleplayNow: string): HTMLDivElement {
  const current = liveTracker(tracker, roleplayNow)
  const card = el('div', `lp-card lp-tracker-card lp-tracker-${current.presentation}`)
  card.dataset.trackerId = current.id
  card.dataset.kind = current.kind
  card.dataset.target = current.target.type
  const heading = el('div', 'lp-row-between')
  const left = el('div')
  left.append(el('div', 'lp-eyebrow', targetLabel(current.target)), el('h3', 'lp-title', current.label))
  const value = el('div', 'lp-tracker-value', displayValue(current))
  value.dataset.trackerLiveValue = current.id
  heading.append(left, value)
  card.appendChild(heading)
  if (current.kind !== 'state' && current.presentation !== 'counter' && current.presentation !== 'compact') {
    const progress = el('div', current.presentation === 'segmented' ? 'lp-progress lp-progress-segmented' : 'lp-progress')
    const fill = el('span')
    fill.dataset.trackerLiveFill = current.id
    fill.style.setProperty('--progress', `${percent(current)}%`)
    fill.style.setProperty('--tracker-color', current.color)
    progress.appendChild(fill)
    card.appendChild(progress)
  }
  const band = current.kind === 'state' ? null : trackerBand(current)
  const footer = el('div', 'lp-tracker-meta')
  footer.append(
    el('span', '', band?.label || current.kind),
    el('span', '', current.updateMode === 'automatic' ? `${current.clock === 'roleplay' ? 'Roleplay' : 'Human'} clock` : current.updateMode),
  )
  card.appendChild(footer)
  return card
}

function dashboard(host: TrackerViewHost): HTMLDivElement {
  const { page, content } = host.page('Trackers', 'Live roleplay state', { label: 'Add', callback: () => host.select('__template:9', 'config') })
  const filters = el('div', 'lp-tracker-filters')
  const all = button('All', 'lp-chip'); all.setAttribute('aria-pressed', 'true')
  filters.appendChild(all)
  const choices = [...new Set(host.state.trackers.flatMap((tracker) => [tracker.kind, tracker.target.type]))]
  for (const choice of choices) {
    const filter = button(choice[0].toUpperCase() + choice.slice(1), 'lp-chip')
    filter.dataset.filter = choice
    filters.appendChild(filter)
  }
  const applyFilter = (choice = '') => {
    for (const card of content.querySelectorAll<HTMLElement>('.lp-tracker-card')) {
      card.hidden = Boolean(choice && card.dataset.kind !== choice && card.dataset.target !== choice)
    }
    for (const chip of filters.querySelectorAll<HTMLButtonElement>('.lp-chip')) chip.setAttribute('aria-pressed', String((chip.dataset.filter || '') === choice))
  }
  all.addEventListener('click', () => applyFilter())
  for (const filter of filters.querySelectorAll<HTMLButtonElement>('[data-filter]')) filter.addEventListener('click', () => applyFilter(filter.dataset.filter))
  content.appendChild(filters)
  for (const tracker of host.state.trackers) {
    const card = renderPresentation(tracker, host.state.roleplayNow)
    card.dataset.clickable = 'true'
    card.tabIndex = 0
    card.setAttribute('role', 'button')
    const open = () => host.select(tracker.id, 'detail')
    card.addEventListener('click', open)
    card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() } })
    content.appendChild(card)
  }
  if (!host.state.trackers.length) {
    const empty = el('div', 'lp-empty')
    empty.appendChild(el('p', 'lp-copy', 'Add Health, Trust, Hunger, Ammo, a roleplay countdown, a state, or a blank custom tracker.'))
    content.appendChild(empty)
  }
  const timer = window.setInterval(() => {
    for (const tracker of host.state.trackers) {
      if (tracker.clock !== 'real' || tracker.updateMode !== 'automatic') continue
      const current = liveTracker(tracker, host.state.roleplayNow)
      const value = content.querySelector<HTMLElement>(`[data-tracker-live-value="${CSS.escape(tracker.id)}"]`)
      const fill = content.querySelector<HTMLElement>(`[data-tracker-live-fill="${CSS.escape(tracker.id)}"]`)
      if (value) value.textContent = displayValue(current)
      if (fill) fill.style.setProperty('--progress', `${percent(current)}%`)
    }
  }, 15_000)
  host.onCleanup(() => window.clearInterval(timer))
  return page
}

function detail(host: TrackerViewHost, tracker: PhoneTracker): HTMLDivElement {
  const { page, content } = host.page(tracker.label, targetLabel(tracker.target), { label: '⚙', callback: () => host.select(tracker.id, 'config'), ariaLabel: 'Tracker settings' })
  content.appendChild(renderPresentation(tracker, host.state.roleplayNow))
  const policy = el('div', 'lp-card lp-tracker-policy')
  policy.append(
    el('div', 'lp-row-between', ''),
    el('p', 'lp-copy', `${tracker.visibleToModel ? 'Visible' : 'Hidden'} in model context · ${tracker.allowModelWrite ? 'Model may write' : 'Model read-only'} · ${tracker.updateMode} updates`),
  )
  if (tracker.pausedReason) policy.appendChild(el('p', 'lp-warning', tracker.pausedReason))
  content.appendChild(policy)

  const operations = el('section', 'lp-card lp-tracker-operations')
  operations.appendChild(el('div', 'lp-eyebrow', 'Update'))
  if (tracker.kind === 'state') {
    const state = selectField('State', tracker.states.map((value) => [value, value]), tracker.state)
    const apply = button('Set state')
    apply.addEventListener('click', () => host.send('lumiphone:action', { action: 'tracker', payload: { trackerId: tracker.id, operation: 'set_state', state: state.select.value, reason: 'Changed in Pocket' } }))
    operations.append(state.label, apply)
  } else {
    const amount = el('input', 'lp-input'); amount.type = 'number'; amount.step = 'any'; amount.value = tracker.kind === 'counter' ? String(tracker.step) : '1'
    amount.setAttribute('aria-label', 'Tracker amount')
    const row = el('div', 'lp-tracker-operation-row')
    for (const [operation, label] of [['subtract', '−'], ['add', '+'], ['set', 'Set']] as const) {
      const control = button(label)
      control.addEventListener('click', () => host.send('lumiphone:action', { action: 'tracker', payload: { trackerId: tracker.id, operation, amount: Number(amount.value), reason: 'Changed in Pocket' } }))
      row.appendChild(control)
    }
    const reset = button('Reset', 'lp-button lp-button-quiet')
    reset.addEventListener('click', () => host.send('lumiphone:action', { action: 'tracker', payload: { trackerId: tracker.id, operation: 'reset', reason: 'Reset in Pocket' } }))
    operations.append(amount, row, reset)
  }
  content.appendChild(operations)

  const history = el('section', 'lp-tracker-history')
  history.appendChild(el('div', 'lp-eyebrow', `History · last ${tracker.history.length}`))
  for (const entry of [...tracker.history].reverse()) {
    const row = el('div', 'lp-card lp-history-row')
    row.append(
      el('strong', '', `${entry.previous} → ${entry.next}`),
      el('span', 'lp-copy', `${entry.operation} · ${entry.source}${entry.reason ? ` · ${entry.reason}` : ''}`),
      el('time', 'lp-copy', entry.roleplayAt || entry.createdAt),
    )
    history.appendChild(row)
  }
  if (!tracker.history.length) history.appendChild(el('p', 'lp-copy', 'No changes recorded yet.'))
  content.appendChild(history)
  return page
}

function config(host: TrackerViewHost, current: PhoneTracker | null, templateIndex = 9): HTMLDivElement {
  const template = TRACKER_TEMPLATES[Math.max(0, Math.min(TRACKER_TEMPLATES.length - 1, templateIndex))]
  const source = current || template.values
  const templateTarget: TrackerTarget = template.group === 'Character'
    ? { type: 'character', id: host.state.characterId, label: host.state.characterName }
    : template.group === 'Scene' ? { type: 'scene', id: '', label: 'Current scene' }
      : template.group === 'World' ? { type: 'world', id: '', label: 'Current world' }
        : { type: 'custom', id: '', label: 'Unassigned' }
  const selectedTarget = source.target || templateTarget
  let saveTracker = () => {}
  const { page, content } = host.page(current ? 'Tracker Settings' : 'New Tracker', 'Configuration', { label: 'Save', callback: () => saveTracker() })
  if (!current) {
    const templateField = selectField('Template', TRACKER_TEMPLATES.map((entry, index) => [String(index), `${entry.group} · ${entry.name}`]), String(templateIndex))
    templateField.select.addEventListener('change', () => host.select(`__template:${templateField.select.value}`, 'config'))
    content.appendChild(templateField.label)
  }
  const label = host.field('Label', String(source.label || ''))
  const key = host.field('Stable key', String(source.key || trackerKey(source.label)))
  const kind = selectField('Type', [['meter', 'Meter'], ['counter', 'Counter'], ['state', 'State'], ['timer', 'Timer']], String(source.kind || 'meter'))
  const presentation = selectField('Presentation', ['relationship', 'meter', 'vitals', 'segmented', 'counter', 'timer', 'state', 'compact'].map((value) => [value, value[0].toUpperCase() + value.slice(1)]), String(source.presentation || source.kind || 'meter'))
  const value = host.field('Current value', String(source.value ?? 0), 'number')
  const initial = host.field('Reset value', String(source.initialValue ?? source.value ?? 0), 'number')
  const min = host.field('Minimum', String(source.min ?? 0), 'number')
  const max = host.field('Maximum', String(source.max ?? 100), 'number')
  const unit = host.field('Unit', String(source.unit || ''))
  const state = host.field('Current state', source.kind === 'state' ? String(source.state || '') : '')
  const states = el('textarea', 'lp-textarea'); states.placeholder = 'Allowed states, one per line'; states.value = source.kind === 'state' ? (source.states || []).join('\n') : ''
  const targetType = selectField('Target', ['character', 'persona', 'relationship', 'scene', 'world', 'custom'].map((value) => [value, value[0].toUpperCase() + value.slice(1)]), selectedTarget.type)
  const targetId = host.field('Target ID', selectedTarget.id)
  const targetName = host.field('Target label', selectedTarget.label)
  const mode = selectField('Update mode', [['manual', 'Manual'], ['model', 'Model-directed'], ['automatic', 'Automatic']], source.updateMode || (source.ratePerHour ? 'automatic' : 'manual'))
  const clock = selectField('Automatic clock', [['real', 'Human time (real clock)'], ['roleplay', 'Roleplay time (timeline clock)']], source.clock || 'roleplay')
  const rate = host.field('Change per hour', String(source.ratePerHour ?? 0), 'number')
  const color = el('input', 'lp-color-input'); color.type = 'color'; color.value = /^#[0-9a-f]{6}$/i.test(String(source.color || '')) ? String(source.color) : host.accent
  const colorRow = el('label', 'lp-card lp-row-between'); colorRow.append(el('span', 'lp-title', 'Tracker color'), color)
  const bands = el('textarea', 'lp-textarea')
  bands.placeholder = 'Semantic bands: min | max | label | #color'
  bands.value = (source.bands || []).map((band) => `${band.min} | ${band.max} | ${band.label} | ${band.color}`).join('\n')
  const visible = toggle('Visible in model context', source.visibleToModel !== false)
  const writable = toggle('Allow model changes', source.allowModelWrite === true)
  const configFields = el('div', 'lp-tracker-config-fields')
  configFields.append(label.label, key.label, kind.label, presentation.label, value.label, initial.label, min.label, max.label, unit.label, state.label, states, targetType.label, targetId.label, targetName.label, mode.label, clock.label, rate.label, colorRow, bands, visible.row, writable.row)
  content.appendChild(configFields)
  saveTracker = () => {
    const parsedBands = bands.value.split('\n').flatMap((line) => {
      const [rawMin, rawMax, bandLabel, bandColor] = line.split('|').map((part) => part.trim())
      if (!bandLabel || !Number.isFinite(Number(rawMin)) || !Number.isFinite(Number(rawMax))) return []
      return [{ min: Number(rawMin), max: Number(rawMax), label: bandLabel, color: /^#[0-9a-f]{6}$/i.test(bandColor) ? bandColor : color.value }]
    })
    host.send('lumiphone:action', { action: 'tracker', payload: {
      id: current?.id, label: label.input.value.trim(), key: key.input.value.trim(), kind: kind.select.value as TrackerKind,
      presentation: presentation.select.value as TrackerPresentation, value: Number(value.input.value), initialValue: Number(initial.input.value),
      min: Number(min.input.value), max: Number(max.input.value), unit: unit.input.value.trim(), color: color.value,
      state: state.input.value.trim(), initialState: current?.kind === 'state' ? current.initialState : state.input.value.trim(),
      states: states.value.split('\n').map((entry) => entry.trim()).filter(Boolean),
      target: { type: targetType.select.value as TrackerTarget['type'], id: targetId.input.value.trim(), label: targetName.input.value.trim() },
      updateMode: mode.select.value as TrackerUpdateMode, clock: clock.select.value, ratePerHour: Number(rate.input.value), bands: parsedBands,
      visibleToModel: visible.button.getAttribute('aria-pressed') === 'true', allowModelWrite: writable.button.getAttribute('aria-pressed') === 'true',
    } })
    host.back()
  }
  if (current) {
    const remove = button('Delete tracker', 'lp-button lp-button-danger')
    remove.addEventListener('click', () => { host.send('lumiphone:delete', { kind: 'tracker', id: current.id }); host.back() })
    content.appendChild(remove)
  }
  return page
}

export function renderTrackersView(host: TrackerViewHost): HTMLDivElement {
  const selected = host.state.trackers.find((tracker) => tracker.id === host.selectedId) || null
  if (selected && host.selectedView === 'config') return config(host, selected)
  if (selected) return detail(host, selected)
  if (host.selectedId.startsWith('__template:')) return config(host, null, Number(host.selectedId.split(':')[1]))
  return dashboard(host)
}
