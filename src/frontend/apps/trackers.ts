import type { PhoneState, PhoneTracker, TrackerKind, TrackerPresentation, TrackerTarget, TrackerUpdateMode } from '../../types.js'
import { materializeTracker, TRACKER_TEMPLATES, trackerBand, trackerKey } from '../../domain/trackers.js'
import { button, el } from '../shared.js'
import { trackerEditor, trackerTemplates } from './tracker-editor.js'
import { trackerDisplay, refreshTrackerDisplay, trackerUpdateDescription } from '../components/tracker-display.js'
import type { PageAction } from '../shared.js'

type Field = { label: HTMLLabelElement; input: HTMLInputElement }
type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface TrackerViewHost {
  state: PhoneState
  selectedId: string
  selectedView: 'detail' | 'config'
  draft: Record<string, unknown> | undefined
  updateDraft(draft: Record<string, unknown>): void
  saving: boolean
  pending: boolean
  save(payload: Record<string, unknown>): void
  accent: string
  page(title: string, subtitle?: string, action?: PageAction): Page
  field(label: string, value?: string, type?: string): Field
  send(type: string, payload?: Record<string, unknown>): void
  select(id: string, view?: 'detail' | 'config', replace?: boolean): void
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

function targetLabel(target: TrackerTarget): string { return target.label || target.type }

function dashboard(host: TrackerViewHost): HTMLDivElement {
  const { page, content } = host.page('Trackers', 'Live roleplay state', { label: 'Add', callback: () => host.select('__templates', 'config') })
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
    const card = trackerDisplay(tracker, host.state)
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
      if (tracker.updateMode !== 'automatic') continue
      const card = content.querySelector<HTMLElement>(`[data-tracker-id="${CSS.escape(tracker.id)}"]`)
      if (card) refreshTrackerDisplay(card, tracker, host.state)
    }
  }, 1_000)
  host.onCleanup(() => window.clearInterval(timer))
  return page
}

function detail(host: TrackerViewHost, tracker: PhoneTracker): HTMLDivElement {
  const { page, content } = host.page(tracker.label, targetLabel(tracker.target), { label: '⚙', callback: () => host.select(tracker.id, 'config'), ariaLabel: 'Tracker settings' })
  const display = trackerDisplay(tracker, host.state)
  content.appendChild(display)
  if (tracker.updateMode === 'automatic') {
    const timer = window.setInterval(() => refreshTrackerDisplay(display, tracker, host.state), 1_000)
    host.onCleanup(() => window.clearInterval(timer))
  }
  const policy = el('div', 'lp-card lp-tracker-policy')
  policy.append(
    el('div', 'lp-row-between', ''),
    el('p', 'lp-copy', `${tracker.visibleToModel ? 'Visible' : 'Hidden'} in model context · ${tracker.allowModelWrite ? 'Model may write' : 'Model read-only'}`),
  )
  policy.appendChild(el('p', 'lp-copy', trackerUpdateDescription(tracker.updateMode)))
  if (tracker.pausedReason) policy.appendChild(el('p', 'lp-warning', tracker.pausedReason))
  if (tracker.updateMode === 'jev') {
    const evaluate = button(host.pending ? 'Reading the story…' : 'Evaluate with judge', 'lp-button lp-button-quiet'); evaluate.disabled = host.pending; evaluate.addEventListener('click', () => host.send('lumiphone:jev_evaluate', { trackerId: tracker.id })); policy.append(evaluate)
    if (tracker.jevResult) policy.append(el('p', tracker.jevResult.status === 'invalid' || tracker.jevResult.status === 'uncertain' ? 'lp-warning' : 'lp-copy', `${tracker.jevResult.message}${tracker.jevResult.confidence === undefined ? '' : ` · ${Math.round(tracker.jevResult.confidence * 100)}%`} · ${tracker.jevResult.evaluatedAt}`))
  }
  content.appendChild(policy)

  const operations = el('section', 'lp-card lp-tracker-operations')
  operations.appendChild(el('div', 'lp-eyebrow', host.pending ? 'Updating…' : tracker.kind === 'counter' ? 'Inventory' : tracker.kind === 'timer' ? 'Clock controls' : tracker.kind === 'state' ? 'Choose a state' : 'Adjust value'))
  operations.setAttribute('aria-busy', String(host.pending))
  const change = (payload: Record<string, unknown>) => host.send('lumiphone:action', { action: 'tracker', payload: { trackerId: tracker.id, reason: 'Changed in Pocket', ...payload } })
  if (tracker.kind === 'state') {
    const choices = el('div', 'lp-state-choices')
    for (const state of tracker.states) {
      const choice = button(state, 'lp-chip'); choice.setAttribute('aria-pressed', String(state === tracker.state)); choice.disabled = host.pending || state === tracker.state
      choice.addEventListener('click', () => change({ operation: 'set_state', state })); choices.append(choice)
    }
    const reset = button(`Reset to ${tracker.initialState}`, 'lp-button lp-button-quiet')
    reset.addEventListener('click', () => change({ operation: 'reset' }))
    operations.append(choices, reset)
  } else {
    if (tracker.kind === 'counter') {
      const steps = el('div', 'lp-counter-controls')
      for (const [operation, label] of [['subtract', `Use ${tracker.step}${tracker.unit}`], ['add', `Add ${tracker.step}${tracker.unit}`]] as const) {
        const control = button(label); control.addEventListener('click', () => change({ operation, amount: tracker.step })); steps.append(control)
      }
      operations.append(steps)
    }
    if (tracker.kind === 'timer' && tracker.updateMode === 'automatic') {
      const pause = button(tracker.clockPaused ? 'Resume clock' : 'Pause clock')
      pause.addEventListener('click', () => change({ command: 'clock', clockAction: tracker.clockPaused ? 'resume' : 'pause' }))
      operations.append(pause, el('p', 'lp-copy', tracker.clockPaused ? 'Resume from this value, without counting the paused time.' : `Runs on ${tracker.clock === 'real' ? 'real time' : 'the story clock'}.`))
    }
    const amount = el('input', 'lp-input'); amount.type = 'number'; amount.step = 'any'; amount.value = String(host.draft?.operationAmount ?? (tracker.kind === 'counter' ? tracker.step : 1))
    amount.addEventListener('input', () => host.updateDraft({ ...host.draft, operationAmount: amount.value }))
    amount.setAttribute('aria-label', 'Tracker amount')
    const row = el('div', 'lp-tracker-operation-row')
    for (const [operation, label] of [['subtract', '−'], ['add', '+'], ['set', 'Set']] as const) {
      const control = button(label)
      control.addEventListener('click', () => { if (amount.value.trim() && Number.isFinite(Number(amount.value))) change({ operation, amount: Number(amount.value) }) })
      row.appendChild(control)
    }
    const reset = button('Reset', 'lp-button lp-button-quiet')
    reset.addEventListener('click', () => change({ operation: 'reset' }))
    if (tracker.kind === 'counter' || tracker.kind === 'timer') {
      const manual = el('details', 'lp-tracker-manual'); manual.append(el('summary', '', 'Adjust precisely'), amount, row); operations.append(manual, reset)
    } else operations.append(amount, row, reset)
  }
  if (host.pending) for (const control of operations.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input')) control.disabled = true
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

export function renderTrackersView(host: TrackerViewHost): HTMLDivElement {
  if (host.selectedId === '__templates') return trackerTemplates(host)
  const selected = host.state.trackers.find((tracker) => tracker.id === host.selectedId) || null
  if (selected && host.selectedView === 'config') return trackerEditor(host, selected)
  if (selected) return detail(host, selected)
  if (host.selectedId.startsWith('__template:')) return trackerEditor(host, null, Number(host.selectedId.split(':')[1]))
  return dashboard(host)
}
