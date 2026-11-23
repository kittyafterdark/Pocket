import { normalizePromptPlacement, type PromptPlacement } from '../../domain/prompt-delivery.js'
import { button, el } from '../shared.js'
import { fieldBlock } from './ui.js'
import type { PhoneState } from '../../types.js'

export function promptPlacementControls(value: PromptPlacement, change: (next: PromptPlacement) => void) {
  const root = el('div', 'lp-settings-section')
  const role = el('select', 'lp-select')
  for (const name of ['system', 'assistant', 'user']) { const option = el('option', '', name[0].toUpperCase() + name.slice(1)); option.value = name; role.append(option) }
  role.value = value.role
  const position = el('select', 'lp-select')
  for (const [key, label] of [['prompt_end', 'After prompt (Pocket default)'], ['pre_history', 'Before chat history'], ['post_history', 'After chat history'], ['in_history', 'At depth']]) {
    const option = el('option', '', label); option.value = key; position.append(option)
  }
  position.value = value.position
  const depth = el('input', 'lp-input'); depth.type = 'number'; depth.min = '0'; depth.max = '10000'; depth.step = '1'; depth.value = String(value.depth)
  const depthField = fieldBlock('Injection depth', depth, '0 is immediately after the latest chat turn; 1 is before it. Counts real chat turns, excluding preset and injected blocks. Depth beyond available history goes before the oldest turn.')
  const sync = () => { depthField.hidden = position.value !== 'in_history' }
  const update = () => { const next = normalizePromptPlacement({ role: role.value, position: position.value, depth: depth.value }); depth.value = String(next.depth); sync(); change(next) }
  role.onchange = position.onchange = depth.onchange = update
  depth.oninput = () => change(normalizePromptPlacement({ role: role.value, position: position.value, depth: depth.value }))
  root.append(fieldBlock('Message role', role), fieldBlock('Injection position', position, 'History placement uses Lumiverse’s tagged chat turns. After prompt preserves Pocket’s original placement after all preset content.'), depthField)
  sync()
  return root
}

export function trackerMacroLibrary(state: PhoneState) {
  const section = el('section', 'lp-card lp-tracker-macros')
  section.append(el('h3', 'lp-eyebrow', 'RP preset macros'), el('p', 'lp-copy', 'Paste these into your RP preset. They resolve only in tracker macro mode, using the current chat. Hidden trackers are excluded.'))
  const add = (macro: string, help: string) => {
    const row = el('div', 'lp-settings-section'), copy = button('Copy macro', 'lp-button lp-button-quiet')
    copy.setAttribute('aria-label', `Copy ${macro}`)
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(macro); copy.textContent = 'Copied' }
      catch { copy.textContent = 'Select the macro to copy'; code.focus() }
    }
    const code = el('code', '', macro); code.tabIndex = 0
    row.append(code, el('p', 'lp-copy', help), copy); section.append(row)
  }
  add('{{pocket_trackers}}', 'The context prompt, permissions, and all visible tracker results.')
  add('{{pocket_tracker::stable_key}}', 'One current value, including its unit. Replace stable_key with a tracker key. Individual values do not include update instructions.')
  for (const tracker of state.trackers.filter(entry => entry.visibleToModel)) add(`{{pocket_tracker::${tracker.key}}}`, tracker.label)
  return section
}
