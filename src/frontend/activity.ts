import type { PocketActivity, PocketRoute } from '../types.js'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

const ICONS: Record<PocketActivity['kind'], string> = {
  message: 'Pocket', 'tracker-change': 'Tracker', timeline: 'Timeline', note: 'Journal',
  contact: 'Contact', image: 'Photo', weather: 'Weather', system: 'Pocket',
}

function presentationLabel(activity: PocketActivity): string {
  switch (activity.presentation?.kind) {
    case 'sent': return 'Sent'
    case 'received': return 'Received'
    case 'observed': return 'Observed'
    case 'referenced': return 'Referenced'
    default: return ICONS[activity.kind]
  }
}

function actorLine(activity: PocketActivity): string {
  const presentation = activity.presentation
  if (!presentation) return ''
  const sender = presentation.senderName || ''
  const recipients = presentation.recipientNames?.filter(Boolean).join(', ') || ''
  if (sender && recipients) return `${sender} → ${recipients}`
  return sender || recipients || presentation.conversationTitle || ''
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
  const stack = document.createElement('span')
  stack.className = 'pocket-artifact-stack'

  const presentation = activity.presentation
  if (presentation && (presentation.kind === 'sent' || presentation.kind === 'received' || presentation.kind === 'observed')) {
    const primary = document.createElement(presentation.kind === 'observed' ? 'div' : 'button')
    if (primary instanceof HTMLButtonElement) primary.type = 'button'
    primary.className = 'pocket-inline-artifact'
    primary.dataset.kind = presentation.kind
    const eyebrow = document.createElement('span')
    eyebrow.className = 'pocket-inline-artifact-kind'
    eyebrow.textContent = `Pocket · ${presentationLabel(activity)}`
    const actors = document.createElement('strong')
    actors.textContent = actorLine(activity) || presentation.conversationTitle || activity.title
    const copy = document.createElement('span')
    copy.className = 'pocket-inline-artifact-copy'
    copy.textContent = activity.summary || ''
    primary.append(eyebrow, actors, copy)
    if (primary instanceof HTMLButtonElement) {
      primary.setAttribute('aria-label', `Open ${presentation.conversationTitle || activity.title} in Pocket`)
      primary.addEventListener('click', () => openRoute(activity.route))
    } else {
      primary.setAttribute('aria-label', 'Observed external Pocket communication')
    }
    stack.appendChild(primary)
  }

  const receipt = document.createElement(activity.presentation?.kind === 'observed' ? 'span' : 'button')
  if (receipt instanceof HTMLButtonElement) receipt.type = 'button'
  receipt.className = 'pocket-receipt'
  const label = document.createElement('span')
  label.className = 'pocket-receipt-kind'
  label.textContent = `Pocket · ${presentationLabel(activity)}`
  const copy = document.createElement('span')
  copy.className = 'pocket-receipt-copy'
  const title = document.createElement('strong')
  title.textContent = presentation?.conversationTitle || activity.title
  copy.appendChild(title)
  const detail = actorLine(activity) || activity.summary
  if (detail) {
    const summary = document.createElement('span')
    summary.textContent = detail
    copy.appendChild(summary)
  }
  const arrow = document.createElement('span')
  arrow.className = 'pocket-receipt-arrow'
  arrow.setAttribute('aria-hidden', 'true')
  arrow.textContent = receipt instanceof HTMLButtonElement ? '›' : '·'
  receipt.append(label, copy, arrow)
  if (receipt instanceof HTMLButtonElement) {
    receipt.setAttribute('aria-label', `Open ${presentation?.conversationTitle || activity.title} in Pocket`)
    receipt.addEventListener('click', () => openRoute(activity.route))
  }
  stack.appendChild(receipt)
  wrapper.replaceChildren(stack)
  return wrapper
}
