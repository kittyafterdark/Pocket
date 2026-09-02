import type { PocketActivity, PocketRoute } from '../types.js'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

const ICONS: Record<PocketActivity['kind'], string> = {
  message: 'Message', 'tracker-change': 'Tracker', timeline: 'Timeline', note: 'Journal',
  contact: 'Contact', image: 'Photo', weather: 'Weather', system: 'Pocket',
}

export function activityReceipt(
  ctx: SpindleFrontendContext,
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
): Element | null {
  const messageId = activity.source?.messageId
  if (!messageId) return null
  const bubble = ctx.dom.findMessageElement(messageId)
  if (!bubble) return null
  const wrapper = ctx.dom.inject(bubble, '<span class="pocket-receipt-host"></span>', 'beforeend')
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'pocket-receipt'
  button.setAttribute('aria-label', `Open ${activity.title} in Pocket`)
  const label = document.createElement('span')
  label.className = 'pocket-receipt-kind'
  label.textContent = ICONS[activity.kind]
  const copy = document.createElement('span')
  copy.className = 'pocket-receipt-copy'
  const title = document.createElement('strong')
  title.textContent = activity.title
  copy.appendChild(title)
  if (activity.summary) {
    const summary = document.createElement('span')
    summary.textContent = activity.summary
    copy.appendChild(summary)
  }
  const arrow = document.createElement('span')
  arrow.className = 'pocket-receipt-arrow'
  arrow.setAttribute('aria-hidden', 'true')
  arrow.textContent = '›'
  button.append(label, copy, arrow)
  button.addEventListener('click', () => openRoute(activity.route))
  wrapper.replaceChildren(button)
  return wrapper
}
