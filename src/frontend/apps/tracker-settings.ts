import { normalizePromptPlacement } from '../../domain/prompt-delivery.js'
import { promptPlacementControls, trackerMacroLibrary } from '../components/prompt-delivery.js'
import { uuid } from '../../domain/uuid.js'
import { DEFAULT_TRACKER_PROMPT, normalizeTrackerContextSettings, trackerContext, TRACKER_PROMPT_LIMIT } from '../../domain/tracker-context.js'
import { button, el } from '../shared.js'
import { fieldBlock } from '../components/ui.js'
import { trackerUsesRealClock } from '../components/tracker-display.js'
import type { TrackerViewHost } from './trackers.js'

export function trackerSettings(host: TrackerViewHost): HTMLDivElement {
  const { page, content } = host.page('Tracker settings', 'Saved with this roleplay')
  const saved = normalizeTrackerContextSettings(host.state.trackerSettings)
  const settings = normalizeTrackerContextSettings(host.draft || saved)
  const delivery = el('select', 'lp-select')
  delivery.dataset.trackerContextControl = 'delivery'
  for (const [value, label] of [['injection', 'Automatic live injection'], ['macros', 'Macros in RP preset']]) {
    const option = el('option', '', label); option.value = value; delivery.append(option)
  }
  delivery.value = settings.delivery
  let placement = settings.placement
  const placementControls = promptPlacementControls(normalizePromptPlacement(placement), next => { placement = next; update(true) })
  const prompt = el('textarea', 'lp-textarea'); prompt.rows = 7; prompt.maxLength = TRACKER_PROMPT_LIMIT; prompt.value = settings.prompt
  prompt.dataset.trackerContextControl = 'prompt'
  content.append(
    fieldBlock('Send tracker context using', delivery, 'Choose one delivery path. Automatic injection adds the tracker prompt and live state to each RP request. Macro mode lets your preset choose where they appear.'),
    fieldBlock('Live state context prompt', prompt, 'Live tracker data and write permissions are always appended. Leave this blank for data and built-in guidance only.'),
  )
  const reset = button('Restore default prompt', 'lp-button lp-button-quiet')
  delivery.disabled = prompt.disabled = reset.disabled = host.pending
  for (const control of placementControls.querySelectorAll('input,select')) (control as HTMLInputElement).disabled = host.pending
  const macros = trackerMacroLibrary(host.state)
  const previewLabel = el('div', 'lp-eyebrow', 'Live tracker context preview')
  previewLabel.id = `tracker-preview-${uuid()}`
  const preview = el('pre', 'lp-tracker-context-preview'); preview.tabIndex = 0
  preview.setAttribute('role', 'region')
  preview.setAttribute('aria-labelledby', previewLabel.id)
  const save = button(host.pending ? 'Saving…' : 'Save tracker settings'); save.disabled = host.pending
  const update = (draft = false) => {
    const next = normalizeTrackerContextSettings({ delivery: delivery.value, prompt: prompt.value, ...(placement ? { placement } : {}) })
    macros.hidden = next.delivery !== 'macros'
    placementControls.hidden = next.delivery === 'macros'
    const context = trackerContext(host.state, next)
    if (preview.textContent !== context) preview.textContent = context
    if (draft) { host.updateDraft({ ...next }); save.textContent = 'Save tracker settings' }
  }
  delivery.addEventListener('change', () => update(true)); prompt.addEventListener('input', () => update(true))
  reset.addEventListener('click', () => { prompt.value = DEFAULT_TRACKER_PROMPT; update(true) })
  save.addEventListener('click', () => host.send('lumiphone:save_tracker_settings', { settings: { delivery: delivery.value, prompt: prompt.value, ...(placement ? { placement } : {}) } }))
  content.append(placementControls, reset, macros, save, previewLabel, preview)
  update()
  if (host.state.trackers.some(tracker => tracker.visibleToModel && trackerUsesRealClock(tracker))) {
    const timer = window.setInterval(() => {
      if (page.isConnected && !page.closest('[hidden]')) update()
    }, 1000)
    host.onCleanup(() => window.clearInterval(timer))
  }
  return page
}
