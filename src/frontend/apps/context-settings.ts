import { normalizePromptDelivery, placementLabel } from '../../domain/prompt-delivery.js'
import { normalizeTrackerContextSettings } from '../../domain/tracker-context.js'
import { promptPlacementControls, trackerMacroLibrary } from '../components/prompt-delivery.js'
import { fieldBlock } from '../components/ui.js'
import { button, el } from '../shared.js'
import type { SettingsViewHost } from './settings.js'

export function contextCategories(host: SettingsViewHost) {
  const { page, content } = host.page('Context', 'Sources, delivery, and prompt review')
  content.classList.add('lp-settings-list')
  for (const [id, title, help] of [
    ['context-sources', 'Sources & scenario', 'Character profiles, lorebooks, and this session’s scenario'],
    ['context-delivery', 'Roleplay delivery', 'Automatic injection, message roles, depth, and macro mode'],
    ['prompt-review', 'Prompt review', 'Read the Pocket blocks prepared for the main roleplay'],
    ['tracker-macros', 'Tracker macros', 'Copy live tracker macros for your roleplay preset'],
  ]) {
    const row = button('', 'lp-card lp-settings-category')
    const copy = el('span'); copy.append(el('strong', '', title), el('span', 'lp-copy', help))
    row.append(copy, el('span', 'lp-settings-chevron', '›')); row.onclick = () => host.navigate(id); content.append(row)
  }
  return page
}

export function roleplayDelivery(host: SettingsViewHost) {
  const { page, content } = host.page('Roleplay delivery', 'Saved with this Pocket chat')
  let draft = normalizePromptDelivery(host.promptDraft || host.state.promptSettings)
  const delivery = el('select', 'lp-select')
  for (const [value, label] of [['injection', 'Automatic injection'], ['macros', 'Macro in RP preset']]) {
    const option = el('option', '', label); option.value = value; delivery.append(option)
  }
  delivery.value = draft.delivery
  const section = el('section', 'lp-card lp-settings-section')
  section.append(el('h3', 'lp-eyebrow', 'Pocket memory'), fieldBlock('Send Pocket memory using', delivery, 'Includes phone guidance, authorship rules, the current snapshot, and phone recall. Tracker delivery is configured separately.'))
  const save = button(host.promptPending ? 'Saving…' : 'Save delivery settings')
  save.disabled = delivery.disabled = Boolean(host.promptPending)
  const changed = () => { host.updatePromptDraft?.(draft); save.textContent = 'Save delivery settings' }
  const placement = promptPlacementControls(draft.placement, next => { draft = { ...draft, placement: next }; changed() })
  for (const control of placement.querySelectorAll('input,select')) (control as HTMLInputElement).disabled = Boolean(host.promptPending)
  const macro = el('div', 'lp-settings-section')
  macro.append(el('code', '', '{{pocket_memory}}'), el('p', 'lp-copy', 'Paste this into your RP preset to place Pocket memory yourself. It resolves only in memory macro mode. Include it once to avoid duplication; the preset chooses its role and position.'))
  const sync = () => { placement.hidden = draft.delivery === 'macros'; macro.hidden = draft.delivery !== 'macros' }
  delivery.onchange = () => { draft = { ...draft, delivery: delivery.value === 'macros' ? 'macros' : 'injection' }; changed(); sync() }
  save.onclick = () => host.savePromptDraft?.(draft)
  section.append(placement, macro, save); sync(); content.append(section)
  const trackers = normalizeTrackerContextSettings(host.state.trackerSettings)
  const trackerSection = el('section', 'lp-card lp-settings-section')
  const open = button('Configure tracker delivery', 'lp-button lp-button-quiet'); open.onclick = () => host.openTrackerSettings?.()
  trackerSection.append(el('h3', 'lp-eyebrow', 'Live trackers'), el('p', 'lp-copy', trackers.delivery === 'macros' ? 'Tracker macro mode is active.' : `Automatic injection · ${placementLabel(normalizePromptDelivery({ placement: trackers.placement }).placement)}`), open)
  content.append(trackerSection, el('p', 'lp-copy', 'Continuity relays and one-shot references keep their automatic delivery and receipt tracking. Changing memory delivery does not disable phone tools.'))
  return page
}

export function promptReview(host: SettingsViewHost) {
  const { page, content } = host.page('Prompt review', 'Pocket → main roleplay')
  const refresh = button(host.promptReviewPending ? 'Loading…' : 'Refresh prompt review', 'lp-button')
  refresh.disabled = Boolean(host.promptReviewPending); refresh.onclick = () => host.loadPromptReview?.()
  content.append(el('p', 'lp-copy', 'Read-only preview of saved Pocket settings and current live data. Save delivery or tracker changes before refreshing. This is Pocket’s contribution; Lumiverse’s full prompt and final provider formatting are available in its Prompt Breakdown.'), refresh)
  if (host.promptReviewPending) content.append(el('p', 'lp-copy', 'Loading saved Pocket prompt…'))
  else if (host.promptReviewError) { const error = el('p', 'lp-warning', host.promptReviewError); error.setAttribute('role', 'alert'); content.append(error) }
  else if (!host.promptReview) content.append(el('p', 'lp-copy', 'Refresh to load the current Pocket blocks.'))
  else {
    const review = host.promptReview
    content.append(el('p', 'lp-copy', `Reviewed ${new Date(review.createdAt).toLocaleTimeString()}`))
    if (!review.enabled) content.append(el('p', 'lp-warning', 'Pocket is disabled or roleplay tools are suppressed. These blocks will not be sent.'))
    for (const block of review.blocks) {
      const details = el('details', 'lp-card lp-settings-section'); details.open = true
      details.append(el('summary', 'lp-title', block.name), el('p', 'lp-copy', block.delivery === 'macros' ? `Macro mode · ${block.macro} · role and position chosen by your preset` : `${block.delivery === 'conditional' ? 'Conditional injection · ' : ''}${placementLabel(block.placement)}`))
      const exact = el('pre', 'lp-prompt-review-text', block.content); exact.tabIndex = 0; exact.setAttribute('role', 'region'); exact.setAttribute('aria-label', `${block.name} prompt`)
      details.append(exact); content.append(details)
    }
  }
  content.append(el('p', 'lp-copy', 'Continuity relays are selected for a matching generation; armed references are attached only to an eligible user-led turn. Reviewing this page does not consume either attachment. Hidden trackers are excluded.'))
  return page
}

export function trackerMacros(host: SettingsViewHost) {
  const { page, content } = host.page('Tracker macros', 'Live values in your RP preset')
  const active = normalizeTrackerContextSettings(host.state.trackerSettings).delivery === 'macros'
  content.append(el('p', active ? 'lp-copy' : 'lp-warning', active ? 'Tracker macro mode is active for this Pocket.' : 'Automatic tracker injection is active. Switch tracker delivery to macro mode before using these in a preset.'))
  const open = button('Configure tracker delivery', 'lp-button'); open.onclick = () => host.openTrackerSettings?.()
  content.append(open, trackerMacroLibrary(host.state))
  return page
}
