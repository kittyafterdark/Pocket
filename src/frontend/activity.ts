import type { PocketActivity, PocketRoute } from '../types.js'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { callSummary } from '../domain/phone-events.js'
import { buildPhoneScreen, callSymbol } from './phone-screen.js'
import { isolatedActivity } from './components/activity-shadow.js'

export interface ActivityRenderOptions {
  includeReceipt?: boolean
  includeArtifact?: boolean
  appearance?: 'cards' | 'phone'
  accent?: string
  background?: string
  backgroundSize?: string
  backgroundPosition?: string
  avatarUrl?: string
  avatars?: Record<string, string>
  textColor?: string
  surfaceColor?: string
}

function frameArtifact(artifact: HTMLElement, activity: PocketActivity, options: ActivityRenderOptions): HTMLElement {
  const frame = document.createElement('div'); frame.className = 'pocket-inline-frame'
  frame.dataset.pocketUi = 'true'; frame.dataset.appearance = options.appearance || 'cards'; frame.dataset.kind = activity.presentation?.kind || activity.kind
  if (options.accent) frame.style.setProperty('--pocket-inline-accent', options.accent)
  if (options.background) frame.style.setProperty('--pocket-inline-bg', options.background)
  if (options.backgroundSize) frame.style.backgroundSize = options.backgroundSize
  if (options.backgroundPosition) frame.style.backgroundPosition = options.backgroundPosition
  if (options.textColor) frame.style.setProperty('--pocket-inline-text', options.textColor)
  if (options.surfaceColor) frame.style.setProperty('--pocket-inline-surface', options.surfaceColor)
  frame.append(artifact)
  return frame
}

function avatar(name: string, url?: string): HTMLSpanElement {
  const icon = document.createElement('span'); icon.className = 'pocket-inline-avatar'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = name.slice(0, 1).toUpperCase()
  if (url) { const image = document.createElement('img'); image.src = url; image.alt = ''; icon.replaceChildren(image) }
  return icon
}

const ICONS: Record<PocketActivity['kind'], string> = {
  message: 'Pocket', 'tracker-change': 'Tracker', timeline: 'Timeline', note: 'Journal',
  contact: 'Contact', image: 'Photo', weather: 'Weather', system: 'Pocket', call: 'Call',
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

function messageChrome(stateText = '', appName = 'Messages'): HTMLSpanElement {
  const chrome = document.createElement('span')
  chrome.className = 'pocket-inline-artifact-chrome'
  const app = document.createElement('span')
  app.className = 'pocket-inline-artifact-app'
  app.textContent = appName
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('fill', 'none'); icon.setAttribute('stroke', 'currentColor')
  icon.setAttribute('stroke-width', '1.8'); icon.setAttribute('stroke-linecap', 'round'); icon.setAttribute('stroke-linejoin', 'round'); icon.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', appName === 'Phone'
    ? 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z'
    : 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z')
  icon.append(path); app.prepend(icon)
  const state = document.createElement('span')
  state.className = 'pocket-inline-artifact-state'
  state.textContent = stateText
  chrome.append(app, state)
  return chrome
}

function buildBatchArtifact(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: ActivityRenderOptions,
): HTMLElement | null {
  const presentation = activity.presentation
  if (presentation?.kind !== 'batch' || !presentation.batchMessages?.length) return null

  const primary = document.createElement('button')
  primary.type = 'button'
  primary.className = 'pocket-inline-artifact pocket-inline-chat-transcript'
  primary.dataset.kind = 'batch'

  const header = document.createElement('span')
  header.className = 'pocket-inline-transcript-header'
  header.appendChild(messageChrome(`${presentation.batchMessages.length} messages`))
  const title = document.createElement('strong')
  title.className = 'pocket-inline-transcript-title'
  title.textContent = presentation.conversationTitle || activity.title || 'Group chat'
  header.appendChild(title)
  primary.appendChild(header)

  const transcript = document.createElement('span')
  transcript.className = 'pocket-inline-transcript'
  const visible = presentation.batchMessages
  for (const [index, item] of visible.entries()) {
    const row = document.createElement('span')
    row.className = 'pocket-inline-transcript-row'
    row.dataset.direction = item.direction
    const previous = visible[index - 1]
    row.dataset.continuation = String(Boolean(previous && (previous.senderActorId || previous.senderName) === (item.senderActorId || item.senderName)))
    row.hidden = index >= 3

    const content = document.createElement('span')
    content.className = 'pocket-inline-transcript-content'
    const sender = document.createElement('strong')
    sender.className = 'pocket-inline-transcript-sender'
    sender.textContent = item.senderName

    const bubble = document.createElement('span')
    bubble.className = 'pocket-inline-transcript-bubble'
    bubble.textContent = item.text

    content.append(sender, bubble)
    row.append(avatar(item.senderName, options.avatars?.[item.senderActorId || '']), content)
    transcript.appendChild(row)
  }
  primary.appendChild(transcript)
  primary.setAttribute('aria-label', `Open ${presentation.conversationTitle || activity.title || 'group chat'} in Pocket`)
  primary.addEventListener('click', () => openRoute(activity.route))
  const group = document.createElement('div'); group.className = 'pocket-inline-batch'; group.append(primary)
  if (visible.length > 3) {
    const more = document.createElement('button'); more.type = 'button'; more.className = 'pocket-inline-transcript-more'; more.setAttribute('aria-expanded', 'false')
    const collapsed = `Show ${visible.length - 3} more messages`; more.textContent = collapsed
    more.addEventListener('click', () => {
      const expanded = more.getAttribute('aria-expanded') !== 'true'; more.setAttribute('aria-expanded', String(expanded)); more.textContent = expanded ? 'Show fewer messages' : collapsed
      for (const [index, row] of [...transcript.children].entries()) (row as HTMLElement).hidden = !expanded && index >= 3
    }); group.append(more)
  }
  return frameArtifact(group, activity, options)
}

function buildMessageArtifact(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: ActivityRenderOptions,
): HTMLElement | null {
  const presentation = activity.presentation
  if (!presentation || !['sent', 'received', 'observed'].includes(presentation.kind)) return null

  const primary = document.createElement('button')
  primary.type = 'button'
  primary.className = 'pocket-inline-artifact'
  primary.dataset.kind = presentation.kind

  const copy = document.createElement('span')
  copy.className = 'pocket-inline-artifact-copy'
  copy.textContent = activity.summary || ''

  if (presentation.call) {
    primary.classList.add('pocket-inline-call'); primary.dataset.callStatus = presentation.call.status
    const identity = document.createElement('span'); identity.className = 'pocket-inline-call-identity'
    identity.append(avatar(presentation.senderName || 'Call', options.avatarUrl))
    const details = document.createElement('span'); details.className = 'pocket-inline-call-details'
    details.append(messageChrome('', 'Phone'))
    const name = document.createElement('strong'); name.className = 'pocket-inline-artifact-actors'; name.textContent = actorLine(activity) || activity.title
    const status = document.createElement('span'); status.className = 'pocket-inline-artifact-copy'; status.textContent = callSummary(presentation.call)
    details.append(name, status); identity.append(details)
    primary.append(identity, callSymbol())
  } else if (presentation.kind === 'sent') {
    const header = document.createElement('span'); header.className = 'pocket-inline-artifact-header'
    const recipient = document.createElement('span')
    recipient.className = 'pocket-inline-artifact-recipient'
    const recipientName = recipientLine(activity)
    recipient.textContent = recipientName ? `To ${recipientName}` : 'Sent message'
    header.append(messageChrome('sent'), recipient)

    const bubble = document.createElement('span')
    bubble.className = 'pocket-inline-chat-bubble'
    bubble.append(copy)

    primary.append(header, bubble)
  } else {
    if (presentation.kind === 'observed') {
      const device = document.createElement('span')
      device.className = 'pocket-inline-artifact-device'
      device.textContent = observedDeviceLine(activity)
      primary.appendChild(device)
    }

    primary.appendChild(messageChrome(presentation.storyAt?.slice(11, 16) || ''))
    const body = document.createElement('span'); body.className = 'pocket-inline-message-body'
    body.append(avatar(presentation.senderName || 'Messages', options.avatarUrl))
    const content = document.createElement('span'); content.className = 'pocket-inline-message-content'
    const sender = document.createElement('strong')
    sender.className = 'pocket-inline-artifact-actors'
    sender.textContent = presentation.senderName || presentation.conversationTitle || activity.title
    content.append(sender, copy); body.append(content); primary.append(body)
  }

  primary.setAttribute('aria-label', `Open ${presentation.kind === 'observed' ? `${observedDeviceLine(activity)} · ` : ''}${presentation.conversationTitle || activity.title} in Pocket`)
  primary.addEventListener('click', () => openRoute(activity.route))
  return frameArtifact(primary, activity, options)
}

function buildActivityStack(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: ActivityRenderOptions = {},
): HTMLSpanElement {
  const stack = document.createElement('span')
  stack.className = 'pocket-artifact-stack'; stack.dataset.pocketUi = 'true'

  if (options.includeArtifact !== false) {
    const artifact = options.appearance === 'phone' ? buildPhoneScreen(activity, openRoute, options) : buildBatchArtifact(activity, openRoute, options) || buildMessageArtifact(activity, openRoute, options)
    if (artifact) stack.appendChild(artifact)
  }

  if (options.includeReceipt !== false) {
    const receipt = document.createElement('button')
    receipt.type = 'button'
    receipt.className = 'pocket-receipt'

    const label = document.createElement('span')
    label.className = 'pocket-receipt-kind'
    label.textContent = ICONS[activity.kind]

    const copy = document.createElement('span')
    copy.className = 'pocket-receipt-copy'
    const title = document.createElement('strong')
    const conversation = activity.presentation?.conversationTitle || activity.title
    title.textContent = conversation ? `${presentationLabel(activity)} · ${conversation}` : presentationLabel(activity)
    copy.appendChild(title)
    if (activity.summary) {
      const summary = document.createElement('span'); summary.textContent = activity.summary; copy.append(summary)
    }

    const arrow = document.createElement('span')
    arrow.className = 'pocket-receipt-arrow'
    arrow.setAttribute('aria-hidden', 'true')
    arrow.textContent = '›'
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
  options: ActivityRenderOptions = {},
): Element {
  host.setAttribute('data-pocket-host', 'true')
  host.replaceChildren(isolatedActivity(buildActivityStack(activity, openRoute, options)))
  return host
}

export function activityReceipt(
  ctx: SpindleFrontendContext,
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: ActivityRenderOptions = {},
): Element | null {
  const messageId = activity.source?.messageId
  if (!messageId) return null
  const bubble = ctx.dom.findMessageElement(messageId)
  if (!bubble) return null
  const wrapper = ctx.dom.inject(bubble, '<span class="pocket-receipt-host"></span>', 'beforeend')
  wrapper.classList.add('pocket-receipt-host')
  wrapper.setAttribute('data-pocket-activity-id', activity.id)
  const communication = activity.kind === 'message' || activity.kind === 'call'
  return renderActivityHost(wrapper, activity, openRoute, { ...options, includeArtifact: communication, includeReceipt: !communication })
}
