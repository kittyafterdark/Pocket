import type { PocketActivity, PocketRoute } from '../types.js'
import type { ActivityRenderOptions } from './activity.js'
import { callSummary } from '../domain/phone-events.js'

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag); element.className = className; element.textContent = text; return element
}

function portrait(name: string, url?: string): HTMLSpanElement {
  const avatar = node('span', 'pocket-phone-avatar', name.slice(0, 1).toUpperCase()); avatar.setAttribute('aria-hidden', 'true')
  if (url) { const image = document.createElement('img'); image.src = url; image.alt = ''; avatar.replaceChildren(image) }
  return avatar
}

export function callSymbol(): HTMLSpanElement {
  const icon = node('span', 'pocket-call-symbol'); icon.setAttribute('aria-hidden', 'true')
  const handset = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) handset.setAttribute(key, value)
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M3 15.5v-3a2 2 0 0 1 .7-1.5c4.7-4 11.9-4 16.6 0a2 2 0 0 1 .7 1.5v3a1 1 0 0 1-1.2 1l-4-.8a1 1 0 0 1-.8-1v-2.3a12 12 0 0 0-6 0v2.3a1 1 0 0 1-.8 1l-4 .8a1 1 0 0 1-1.2-1Z')
  handset.append(path); icon.append(handset); return icon
}

/** A device cutaway, independent of the compact scene-card renderer. */
export function buildPhoneScreen(activity: PocketActivity, openRoute: (route: PocketRoute) => void, options: ActivityRenderOptions): HTMLElement | null {
  const presentation = activity.presentation
  if (!presentation || !['received', 'observed', 'sent', 'batch'].includes(presentation.kind)) return null
  const type = presentation.call ? 'call' : presentation.kind === 'batch' ? 'group' : presentation.kind === 'sent' ? 'chat' : 'lock'
  const phone = node('div', 'pocket-inline-frame pocket-phone-device')
  phone.dataset.appearance = 'phone'; phone.dataset.screen = type
  phone.style.setProperty('--pocket-inline-accent', options.accent || '#8b7dff')
  const time = presentation.storyAt?.slice(11, 16)
  const status = node('div', 'pocket-phone-status', time || 'Pocket')
  const indicators = node('span', 'pocket-phone-indicators', '▮▮▮  ▰'); indicators.setAttribute('aria-hidden', 'true'); status.append(indicators)
  const screen = node('div', 'pocket-phone-screen'); phone.append(status, screen)
  const routeButton = (label: string, className: string, aria: string) => {
    const button = node('button', className, label); button.type = 'button'; button.setAttribute('aria-label', aria)
    button.addEventListener('click', () => openRoute(activity.route)); return button
  }
  const recipients = presentation.recipientNames?.filter(Boolean).join(', ') || ''
  const title = presentation.conversationTitle || (type === 'lock' ? presentation.senderName : recipients) || activity.title || 'Messages'
  if (type === 'lock') {
    screen.classList.add('pocket-phone-lock')
    if (options.background) screen.style.background = options.background
    screen.style.backgroundSize = options.backgroundSize || 'cover'; screen.style.backgroundPosition = options.backgroundPosition || 'center'
    screen.append(node('span', 'pocket-phone-lock-label', presentation.kind === 'observed' ? `${recipients || 'Another actor'}'s phone` : 'Locked'))
    screen.append(node('span', 'pocket-phone-clock', time || 'Locked'))
    screen.append(node('span', 'pocket-phone-lock-caption', 'Tap notification to open'))
    const notification = routeButton('', 'pocket-phone-notification', `Open ${presentation.kind === 'observed' ? `${recipients}'s phone · ` : ''}${title} in Pocket`)
    notification.append(node('span', 'pocket-phone-app-label', 'Messages'), portrait(presentation.senderName || '?', options.avatarUrl), node('strong', 'pocket-phone-notification-sender', presentation.senderName || 'Message'), node('span', 'pocket-phone-notification-copy', activity.summary || ''))
    screen.append(notification)
  } else if (type === 'call') {
    screen.classList.add('pocket-phone-call'); screen.dataset.callStatus = presentation.call!.status
    screen.append(routeButton('Phone · Call history ↗', 'pocket-phone-app-header', 'Open call history in Pocket'))
    const identity = node('div', 'pocket-phone-call-identity')
    identity.append(portrait(presentation.senderName || 'Call', options.avatarUrl), node('span', 'pocket-phone-call-label', 'Phone'), node('strong', 'pocket-phone-call-name', [presentation.senderName, recipients].filter(Boolean).join(' → ') || activity.title), node('span', 'pocket-phone-call-status', callSummary(presentation.call!)))
    const controls = node('div', 'pocket-phone-call-controls')
    controls.append(callSymbol(), node('span', 'pocket-phone-control-caption', presentation.call!.status === 'connected' ? 'Connected' : presentation.call!.status === 'ended' ? 'Call ended' : 'Missed call'))
    screen.append(identity, controls)
  } else {
    screen.classList.add('pocket-phone-chat')
    const header = routeButton('', 'pocket-phone-app-header', `Open ${title} in Pocket`)
    header.append(node('span', 'pocket-phone-app-label', '‹  Messages'), node('strong', 'pocket-phone-conversation-title', title))
    if (type === 'group') header.append(node('span', 'pocket-phone-subtitle', `${presentation.batchMessages?.length || 0} messages`))
    const thread = node('div', 'pocket-phone-thread'); thread.tabIndex = 0; thread.setAttribute('role', 'region'); thread.setAttribute('aria-label', `${title} conversation`)
    const messages = type === 'group' ? presentation.batchMessages || [] : [{ senderName: presentation.senderName || 'You', senderActorId: presentation.senderActorId, text: activity.summary || '', direction: 'sent' }]
    for (const [index, message] of messages.entries()) {
      const row = node('div', 'pocket-phone-message'); row.dataset.direction = message.direction
      const previous = messages[index - 1]; row.dataset.continuation = String(Boolean(previous && previous.senderName === message.senderName))
      if (message.direction !== 'sent') row.append(portrait(message.senderName, options.avatars?.[message.senderActorId || '']), node('strong', 'pocket-phone-sender', message.senderName))
      row.append(node('span', 'pocket-phone-bubble', message.text)); thread.append(row)
    }
    if (type === 'chat') thread.append(node('span', 'pocket-phone-delivery', 'Sent'))
    const composer = node('span', 'pocket-mock-composer pocket-phone-composer', '＋    Message'); composer.setAttribute('aria-hidden', 'true')
    screen.append(header, thread, composer)
  }
  return phone
}
