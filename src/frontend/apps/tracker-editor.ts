import type { PhoneTracker, TrackerTarget, TrackerKind } from '../../types.js'
import { normalizeTracker, TRACKER_TEMPLATES, trackerKey, validateTrackerConfig } from '../../domain/trackers.js'
import { listPocketActors } from '../../domain/actors.js'
import { button, el } from '../shared.js'
import { controlRow, disclosure, fieldBlock, sectionBlock } from '../components/ui.js'
import type { TrackerViewHost } from './trackers.js'
import { trackerDisplay } from '../components/tracker-display.js'

function choice(label: string, values: Array<[string, string]>, value: string) {
  const control = el('select', 'lp-select')
  for (const [id, name] of values) { const option = el('option', '', name); option.value = id; option.selected = id === value; control.append(option) }
  return { control, field: fieldBlock(label, control) }
}

export function trackerTemplates(host: TrackerViewHost): HTMLDivElement {
  const { page, content } = host.page('New Tracker', 'Track your story')
  content.append(el('p', 'lp-copy', 'Pick a starting point. You can make it yours next.'))
  const grid = el('div', 'lp-template-grid')
  const marks = ['♡', '◔', '✿', '♥', 'ϟ', '▥', '◈', '◷', '✧', '＋']
  TRACKER_TEMPLATES.forEach((template, index) => {
    const card = button('', 'lp-template-card')
    card.append(el('span', 'lp-template-mark', marks[index]), el('strong', '', template.name), el('small', '', template.group))
    card.addEventListener('click', () => host.select(`__template:${index}`, 'config'))
    grid.append(card)
  })
  content.append(grid)
  return page
}

export function trackerEditor(host: TrackerViewHost, current: PhoneTracker | null, templateIndex = 9): HTMLDivElement {
  const template = TRACKER_TEMPLATES[templateIndex] || TRACKER_TEMPLATES[9]
  const target: TrackerTarget = template.values.target || { type: 'character', id: host.state.characterId, label: host.state.characterName }
  const seed = normalizeTracker({ ...template.values, target, color: host.accent }, { roleplayNow: host.state.roleplayNow })!
  const source = { ...(current || seed), ...host.draft } as PhoneTracker
  let commit = () => {}
  const { page, content } = host.page(current ? 'Edit Tracker' : template.name, 'Choose a target and update behavior', { label: host.saving ? 'Saving…' : 'Save', enabled: !host.saving, callback: () => commit() })
  const preview = el('div', 'lp-tracker-preview')
  const error = el('p', 'lp-warning'); error.setAttribute('role', 'alert'); error.hidden = true
  const name = el('input', 'lp-input'); name.value = source.label
  const kind = choice('Track', [['meter', 'A value'], ['counter', 'A quantity'], ['state', 'A state'], ['timer', 'A timer']], source.kind)
  const targets: TrackerTarget[] = ([
    { type: 'character', id: host.state.characterId, label: host.state.characterName },
    { type: 'persona', id: host.state.pocketPersonaActorId, label: host.state.pocketPersona.displayName || 'You' },
    ...listPocketActors(host.state).map(actor => ({ type: 'character' as const, id: actor.actorId, label: actor.name })),
    ...listPocketActors(host.state).map(actor => ({ type: 'relationship' as const, id: actor.actorId, label: `You & ${actor.name}` })),
    { type: 'scene', id: '', label: 'Current scene' }, { type: 'world', id: '', label: 'World' }, { type: 'custom', id: '', label: 'Something else' },
  ] as TrackerTarget[]).filter((entry, index, all) => all.findIndex(other => other.type === entry.type && other.id === entry.id) === index)
  if (!targets.some(entry => entry.type === source.target.type && entry.id === source.target.id)) targets.unshift(source.target)
  const targetIndex = targets.findIndex(entry => entry.type === source.target.type && entry.id === source.target.id)
  const belongs = choice('For', targets.map((entry, index) => [String(index), entry.label]), String(targetIndex))
  const custom = el('input', 'lp-input'); custom.value = source.target.label; custom.placeholder = 'What are we tracking?'
  const customField = fieldBlock('Target name', custom)
  const value = el('input', 'lp-input'); value.type = 'number'; value.step = 'any'; value.value = String(source.value)
  const states = el('textarea', 'lp-textarea'); states.value = source.kind === 'state' ? source.states.join('\n') : 'Stable\nWounded\nRecovering'
  const state = choice('Current state', [], source.kind === 'state' ? source.state : '')
  const mode = choice('Updates', [['manual', 'By hand'], ['model', 'With the story'], ['automatic', 'Over time'], ['jev', 'Open JEV']], source.updateMode)
  const jev = sectionBlock('Open JEV', 'Estimates this value from recent story messages. Uncertain answers keep the current value.')
  const question = el('textarea', 'lp-textarea'); question.maxLength = 240; question.value = source.jev?.question || `What is the current ${source.label.toLowerCase()}?`; question.placeholder = 'Ask one specific question about this target.'
  const confidence = el('input', 'lp-input'); confidence.type = 'number'; confidence.min = '0'; confidence.max = '1'; confidence.step = '.05'; confidence.value = String(source.jev?.minConfidence ?? .65)
  const levels = el('textarea', 'lp-textarea'); levels.value = (source.jev?.levels.length ? source.jev.levels : [{ value: source.min, label: source.bands[0]?.label || 'Low' }, { value: (source.min + source.max) / 2, label: source.bands[Math.floor(source.bands.length / 2)]?.label || 'Moderate' }, { value: source.max, label: source.bands.at(-1)?.label || 'High' }]).map(level => `${level.value} | ${level.label}`).join('\n')
  const levelField = fieldBlock('Rubric', levels, '2–10 levels, low to high: value | description. Describe what each level looks like in the story.')
  jev.body.append(fieldBlock('Question', question), levelField, fieldBlock('Minimum confidence', confidence, '0–1. Open JEV uses the strongest option probability.'))
  const visible = el('input'); visible.type = 'checkbox'; visible.checked = source.visibleToModel
  const visibleField = controlRow('Include in model context', visible, 'Story updates allow the model to change this tracker. Other modes keep it read-only.')
  const valueField = fieldBlock('Starting value', value)
  const stateFields = el('div', 'lp-tracker-config-fields'); stateFields.append(fieldBlock('Allowed states', states, 'One state per line.'), state.field)
  const basic = sectionBlock('The essentials')
  basic.body.append(fieldBlock('Name', name), belongs.field, customField, kind.field, valueField, stateFields, mode.field, visibleField)
  const clock = choice('Clock', [['roleplay', 'Story time'], ['real', 'Real time']], source.clock)
  const rate = el('input', 'lp-input'); rate.type = 'number'; rate.step = 'any'; rate.value = String(source.ratePerHour)
  const direction = choice('Direction', [['down', 'Count down'], ['up', 'Count up']], source.kind === 'timer' ? source.direction : 'down')
  const automatic = sectionBlock('Passing time', 'Story time waits when the scene clock is uncertain.')
  automatic.body.append(clock.field, direction.field, fieldBlock('Change per hour', rate, 'Positive adds; negative subtracts. Timers use their chosen direction.'))
  const min = el('input', 'lp-input'); min.type = 'number'; min.step = 'any'; min.value = String(source.min)
  const max = el('input', 'lp-input'); max.type = 'number'; max.step = 'any'; max.value = String(source.max)
  const initial = el('input', 'lp-input'); initial.type = 'number'; initial.step = 'any'; initial.value = String(source.initialValue)
  const unit = el('input', 'lp-input'); unit.value = source.unit
  const step = el('input', 'lp-input'); step.type = 'number'; step.step = 'any'; step.value = String(source.kind === 'counter' ? source.step : 1)
  const stepField = fieldBlock('Step size', step)
  const key = el('input', 'lp-input'); key.value = source.key
  const color = el('input', 'lp-color-input'); color.type = 'color'; color.value = /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : host.accent
  const presentation = choice('Display', [], source.presentation)
  const range = el('div', 'lp-tracker-config-fields'); range.append(fieldBlock('Minimum', min), fieldBlock('Maximum', max), fieldBlock('Reset value', initial), fieldBlock('Unit', unit), stepField)
  const bandList = el('div', 'lp-band-list')
  const bandRows: Array<{ row: HTMLElement; min: HTMLInputElement; max: HTMLInputElement; label: HTMLInputElement; color: HTMLInputElement; meaning: HTMLSelectElement }> = []
  const addBand = (band: { min: number; max: number; label: string; color: string; meaning?: string }) => {
    const row = el('div', 'lp-band-editor')
    const low = el('input', 'lp-input'); low.type = 'number'; low.step = 'any'; low.value = String(band.min); low.setAttribute('aria-label', 'Band minimum')
    const high = el('input', 'lp-input'); high.type = 'number'; high.step = 'any'; high.value = String(band.max); high.setAttribute('aria-label', 'Band maximum')
    const label = el('input', 'lp-input'); label.value = band.label; label.placeholder = 'Band name'; label.setAttribute('aria-label', 'Band name')
    const hue = el('input', 'lp-color-input'); hue.type = 'color'; hue.value = /^#[0-9a-f]{6}$/i.test(band.color) ? band.color : host.accent; hue.setAttribute('aria-label', 'Band color')
    const remove = button('×', 'lp-button lp-button-quiet'); remove.setAttribute('aria-label', 'Remove band')
    const meaning = choice('Meaning', [['neutral', 'Neutral'], ['good', 'Favorable'], ['bad', 'Warning']], band.meaning || 'neutral')
    meaning.field.classList.add('lp-band-meaning')
    const entry = { row, min: low, max: high, label, color: hue, meaning: meaning.control }; bandRows.push(entry)
    remove.addEventListener('click', () => { bandRows.splice(bandRows.indexOf(entry), 1); row.remove(); remember() })
    row.append(label, low, high, hue, remove, meaning.field); bandList.append(row)
  }
  for (const band of source.bands) addBand(band)
  const bands = sectionBlock('Meaningful ranges', 'Name what each range means. High does not always mean good.')
  const add = button('＋ Add a range', 'lp-button lp-button-quiet')
  add.addEventListener('click', () => { addBand({ min: Number(min.value), max: Number(max.value), label: 'New range', color: color.value }); remember() })
  bands.body.append(bandList, add)
  const advanced = disclosure('Fine tuning', presentation.field, range, fieldBlock('Color', color), bands.section, fieldBlock('Stable key', key, 'Used by model tools. New trackers receive a unique key.'))
  const allowed: Record<TrackerKind, string[]> = { meter: ['meter', 'vitals', 'relationship', 'segmented', 'compact'], counter: ['counter', 'compact'], state: ['state', 'compact'], timer: ['timer', 'compact'] }
  const collect = () => {
    const kindValue = kind.control.value as TrackerKind
    const selected = targets[Number(belongs.control.value)]
    return {
      label: name.value.trim(), key: trackerKey(key.value || name.value), kind: kindValue, presentation: presentation.control.value,
      target: { ...selected, label: selected.type === 'custom' ? custom.value.trim() : selected.label },
      value: Number(value.value), initialValue: Number(initial.value), min: Number(min.value), max: Number(max.value), unit: unit.value,
      state: state.control.value, initialState: current?.kind === 'state' ? current.initialState : state.control.value,
      states: [...new Set(states.value.split('\n').map(entry => entry.trim()).filter(Boolean))],
      step: Number(step.value), direction: direction.control.value, color: color.value,
      updateMode: mode.control.value, allowModelWrite: mode.control.value === 'model', visibleToModel: visible.checked, clock: clock.control.value,
      jev: { question: question.value.trim(), minConfidence: Number(confidence.value), levels: levels.value.split('\n').filter(line => line.trim()).map(line => { const delimiter = line.indexOf('|'); return { value: delimiter < 0 ? NaN : Number(line.slice(0, delimiter).trim()), label: delimiter < 0 ? '' : line.slice(delimiter + 1).trim() } }) },
      ratePerHour: kindValue === 'timer' ? Math.abs(Number(rate.value)) * (direction.control.value === 'down' ? -1 : 1) : Number(rate.value),
      bands: kindValue === 'state' ? [] : bandRows.map(entry => ({ min: Number(entry.min.value), max: Number(entry.max.value), label: entry.label.value.trim(), color: entry.color.value, meaning: entry.meaning.value })),
    }
  }
  const refreshFields = () => {
    const kindValue = kind.control.value as TrackerKind
    customField.hidden = targets[Number(belongs.control.value)].type !== 'custom'
    valueField.hidden = kindValue === 'state'; stateFields.hidden = kindValue !== 'state'; range.hidden = kindValue === 'state'; bands.section.hidden = kindValue === 'state'; stepField.hidden = kindValue !== 'counter'
    automatic.section.hidden = mode.control.value !== 'automatic'; direction.field.hidden = kindValue !== 'timer'
    jev.section.hidden = mode.control.value !== 'jev'; levelField.hidden = kindValue === 'state'
    const jevOption = mode.control.querySelector<HTMLOptionElement>('option[value="jev"]')!; jevOption.disabled = kindValue === 'counter' || kindValue === 'timer'
    if (jevOption.disabled && mode.control.value === 'jev') mode.control.value = 'manual'
    const autoOption = mode.control.querySelector<HTMLOptionElement>('option[value="automatic"]')!; autoOption.disabled = kindValue === 'state'
    if (kindValue === 'state' && mode.control.value === 'automatic') mode.control.value = 'manual'
    const display = presentation.control.value || source.presentation
    presentation.control.replaceChildren()
    for (const id of allowed[kindValue]) { const option = el('option', '', id[0].toUpperCase() + id.slice(1)); option.value = id; presentation.control.append(option) }
    presentation.control.value = allowed[kindValue].includes(display) ? display : allowed[kindValue][0]
    const previous = state.control.value || (source.kind === 'state' ? source.state : '')
    state.control.replaceChildren()
    for (const label of [...new Set(states.value.split('\n').map(entry => entry.trim()).filter(Boolean))]) { const option = el('option', '', label); option.value = label; state.control.append(option) }
    if ([...state.control.options].some(option => option.value === previous)) state.control.value = previous
  }
  const remember = () => {
    refreshFields()
    const draft = collect(); host.updateDraft(draft)
    const sample = normalizeTracker({ ...source, ...draft }, { roleplayNow: host.state.roleplayNow })!
    preview.replaceChildren(trackerDisplay(sample, host.state))
    preview.style.setProperty('--tracker-color', draft.color)
  }
  content.append(preview, error, basic.section, automatic.section, jev.section, advanced)
  content.addEventListener('input', remember); content.addEventListener('change', remember)
  refreshFields(); remember()
  commit = () => {
    const draft = collect()
    try { validateTrackerConfig(draft) } catch (failure) { error.textContent = failure instanceof Error ? failure.message : String(failure); error.hidden = false; error.scrollIntoView({ block: 'nearest' }); return }
    if (host.saving) return
    const save = page.querySelector<HTMLButtonElement>('.lp-nav-action:last-child')!; save.disabled = true; save.textContent = 'Saving…'
    host.save({ ...draft, id: current?.id, command: current ? 'configure' : 'create' })
  }
  if (current) { const remove = button('Delete tracker', 'lp-button lp-button-danger'); remove.addEventListener('click', () => host.send('lumiphone:delete', { kind: 'tracker', id: current.id })); content.append(remove) }
  return page
}
