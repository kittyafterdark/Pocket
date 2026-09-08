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
    case 'batch': return 'Chat'
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

function recipientLine(activity: PocketActivity): string {
  const presentation = activity.presentation
  if (!presentation) return ''
  const recipients = presentation.recipientNames?.filter(Boolean) || []
  if (recipients.length === 1) return recipients[0]
  if (recipients.length > 1) return presentation.conversationTitle || recipients.join(', ')
  return presentation.conversationTitle || ''
}

function observedDeviceLine(activity: PocketActivity): string {
  const recipient = recipientLine(activity)
  return recipient ? `${recipient}'s phone` : 'Another phone'
}

function messageChrome(stateText = 'now'): HTMLSpanElement {
  const chrome = document.createElement('span')
  chrome.className = 'pocket-inline-artifact-chrome'
  const app = document.createElement('span')
  app.className = 'pocket-inline-artifact-app'
  app.textContent = 'Messages'
  const state = document.createElement('span')
  state.className = 'pocket-inline-artifact-state'
  state.textContent = stateText
  chrome.append(app, state)
  return chrome
}

function buildBatchArtifact(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
): HTMLElement | null {
  const presentation = activity.presentation
  if (presentation?.kind !== 'batch' || !presentation.batchMessages?.length) return null

  const primary = document.createElement('button')
  primary.type = 'button'
  primary.className = 'pocket-inline-artifact pocket-inline-chat-transcript'
  primary.dataset.kind = 'batch'
  primary.appendChild(messageChrome(`${presentation.batchMessages.length} messages`))

  const title = document.createElement('strong')
  title.className = 'pocket-inline-transcript-title'
  title.textContent = presentation.conversationTitle || activity.title || 'Group chat'
  primary.appendChild(title)

  const transcript = document.createElement('span')
  transcript.className = 'pocket-inline-transcript'
  const visible = presentation.batchMessages.slice(0, 8)
  for (const item of visible) {
    const row = document.createElement('span')
    row.className = 'pocket-inline-transcript-row'
    row.dataset.direction = item.direction

    const sender = document.createElement('strong')
    sender.className = 'pocket-inline-transcript-sender'
    sender.textContent = item.senderName

    const bubble = document.createElement('span')
    bubble.className = 'pocket-inline-transcript-bubble lp-message-surface'
    bubble.textContent = item.text

    row.append(sender, bubble)
    transcript.appendChild(row)
  }
  if (presentation.batchMessages.length > visible.length) {
    const more = document.createElement('span')
    more.className = 'pocket-inline-transcript-more'
    more.textContent = `+ ${presentation.batchMessages.length - visible.length} more message${presentation.batchMessages.length - visible.length === 1 ? '' : 's'}`
    transcript.appendChild(more)
  }
  primary.appendChild(transcript)
  primary.setAttribute('aria-label', `Open ${presentation.conversationTitle || activity.title || 'group chat'} in Pocket`)
  primary.addEventListener('click', () => openRoute(activity.route))
  return primary
}

function buildMessageArtifact(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
): HTMLElement | null {
  const presentation = activity.presentation
  if (!presentation || !['sent', 'received', 'observed'].includes(presentation.kind)) return null

  const primary = document.createElement(presentation.kind === 'observed' ? 'div' : 'button')
  if (primary instanceof HTMLButtonElement) primary.type = 'button'
  primary.className = 'pocket-inline-artifact'
  primary.dataset.kind = presentation.kind

  const copy = document.createElement('span')
  copy.className = 'pocket-inline-artifact-copy'
  copy.textContent = activity.summary || ''

  if (presentation.kind === 'sent') {
    const recipient = document.createElement('span')
    recipient.className = 'pocket-inline-artifact-recipient'
    const recipientName = recipientLine(activity)
    recipient.textContent = recipientName ? `To ${recipientName}` : 'Sent message'

    const bubble = document.createElement('span')
    bubble.className = 'pocket-inline-chat-bubble lp-message-surface'
    bubble.append(copy)

    const status = document.createElement('span')
    status.className = 'pocket-inline-sent-status'
    status.textContent = 'sent'
    primary.append(recipient, bubble, status)
  } else {
    if (presentation.kind === 'observed') {
      const device = document.createElement('span')
      device.className = 'pocket-inline-artifact-device'
      device.textContent = observedDeviceLine(activity)
      primary.appendChild(device)
    }

    primary.appendChild(messageChrome('now'))

    const sender = document.createElement('strong')
    sender.className = 'pocket-inline-artifact-actors'
    sender.textContent = presentation.senderName || presentation.conversationTitle || activity.title
    primary.append(sender, copy)
  }

  if (primary instanceof HTMLButtonElement) {
    primary.setAttribute('aria-label', `Open ${presentation.conversationTitle || activity.title} in Pocket`)
    primary.addEventListener('click', () => openRoute(activity.route))
  } else {
    primary.setAttribute('aria-label', `Message visible on ${observedDeviceLine(activity)}`)
  }
  return primary
}

function buildActivityStack(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: { includeReceipt?: boolean; includeArtifact?: boolean } = {},
): HTMLSpanElement {
  const stack = document.createElement('span')
  stack.className = 'pocket-artifact-stack'

  if (options.includeArtifact !== false) {
    const artifact = buildBatchArtifact(activity, openRoute) || buildMessageArtifact(activity, openRoute)
    if (artifact) stack.appendChild(artifact)
  }

  if (options.includeReceipt !== false) {
    const interactive = activity.presentation?.kind !== 'observed'
    const receipt = document.createElement(interactive ? 'button' : 'span')
    if (receipt instanceof HTMLButtonElement) receipt.type = 'button'
    receipt.className = 'pocket-receipt'

    const label = document.createElement('span')
    label.className = 'pocket-receipt-kind'
    label.textContent = 'Pocket'

    const copy = document.createElement('span')
    copy.className = 'pocket-receipt-copy'
    const title = document.createElement('strong')
    const conversation = activity.presentation?.conversationTitle || activity.title
    title.textContent = conversation ? `${presentationLabel(activity)} · ${conversation}` : presentationLabel(activity)
    copy.appendChild(title)

    const arrow = document.createElement('span')
    arrow.className = 'pocket-receipt-arrow'
    arrow.setAttribute('aria-hidden', 'true')
    arrow.textContent = receipt instanceof HTMLButtonElement ? '›' : '·'
    receipt.append(label, copy, arrow)

    if (receipt instanceof HTMLButtonElement) {
      receipt.setAttribute('aria-label', `Open ${activity.presentation?.conversationTitle || activity.title} in Pocket`)
      receipt.addEventListener('click', () => openRoute(activity.route))
    }
    stack.appendChild(receipt)

    const detail = actorLine(activity) || activity.summary
    if (detail) {
      const details = document.createElement('details')
      details.className = 'pocket-receipt-details'
      const toggle = document.createElement('summary')
      toggle.textContent = 'Provenance'
      const summary = document.createElement('span')
      summary.textContent = detail
      details.append(toggle, summary)
      stack.appendChild(details)
    }
  }

  return stack
}

export function renderActivityHost(
  host: Element,
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: { includeReceipt?: boolean; includeArtifact?: boolean } = {},
): Element {
  host.replaceChildren(buildActivityStack(activity, openRoute, options))
  return host
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
  wrapper.classList.add('pocket-receipt-host')
  wrapper.setAttribute('data-pocket-activity-id', activity.id)
  return renderActivityHost(wrapper, activity, openRoute, { includeArtifact: false, includeReceipt: true })
}
