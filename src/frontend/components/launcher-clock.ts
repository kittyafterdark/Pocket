import type { PhoneState } from '../../types.js'
import { clockLabel } from '../../domain/clock-label.js'
import { el, formatDate, formatTime } from '../shared.js'

export function launcherClockWidget(state: PhoneState): HTMLElement {
  const card = el('div', 'lp-launcher-clock-card')
  const time = state.roleplayClockSource === 'narrative' && state.roleplayClockPrecision !== 'exact'
    ? clockLabel(state.roleplayClockLabel) || 'Story time'
    : formatTime(state.roleplayNow)
  card.dataset.clockKind = state.roleplayClockSource === 'narrative' && state.roleplayClockPrecision !== 'exact' ? 'label' : 'time'
  card.append(el('p', 'lp-launcher-clock-date', formatDate(state.roleplayNow, false)), el('strong', 'lp-launcher-clock-time', time))
  return card
}
