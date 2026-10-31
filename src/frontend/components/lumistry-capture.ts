import type { LumistryCapture } from '../../domain/lumistry-sharing.js'
import { el } from '../shared.js'

export function renderLumistryCapture(capture: LumistryCapture): HTMLDivElement {
  const card = el('div', 'lp-shared-capture')
  const heading=el('div','lp-shared-capture-heading'),mark=el('span','lp-shared-capture-mark','▧')
  mark.setAttribute('aria-hidden','true');heading.append(mark,el('strong', '', `${capture.kind === 'screenshot' ? 'Screenshot' : 'Photos'} · ${capture.title}`));card.append(heading)
  for (const entry of capture.entries) {
    const row = el('div', 'lp-shared-capture-row')
    row.append(el('strong', '', entry.speaker))
    if (entry.text) row.append(el('p', '', entry.text))
    if (entry.photoDescription) row.append(el('p', 'lp-shared-capture-photo', `Photo: ${entry.photoDescription}`))
    card.append(row)
  }
  if(capture.caption)card.append(el('p','lp-shared-capture-caption',capture.caption))
  return card
}
