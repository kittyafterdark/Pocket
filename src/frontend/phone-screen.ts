import type { PocketActivity, PocketRoute } from '../types.js'
import type { ActivityRenderOptions } from './activity.js'
import { activityClock } from '../domain/activity-clock.js'
import { callSummary } from '../domain/phone-events.js'

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag); element.className = className; element.textContent = text; return element
}

function portrait(name: string, url?: string): HTMLSpanElement {
  const avatar = node('span', 'pocket-phone-avatar', name.slice(0, 1).toUpperCase()); avatar.setAttribute('aria-hidden', 'true')
  if (url) { const image = document.createElement('img'); image.src = url; image.alt = ''; avatar.replaceChildren(image) }
  return avatar
}

type PocketIconName = 'signal' | 'wifi' | 'battery' | 'back' | 'video' | 'plus' | 'send' | 'message' | 'phone' | 'mute' | 'speaker' | 'contacts'

const ICON_PATHS: Record<Exclude<PocketIconName, 'signal' | 'battery'>, string[]> = {
  wifi: ['M3 9.5a14.5 14.5 0 0 1 18 0', 'M6.5 13a9 9 0 0 1 11 0', 'M10 16.5a3.6 3.6 0 0 1 4 0', 'M12 20h.01'],
  back: ['m15 18-6-6 6-6'],
  video: ['M15 10l4.6-2.6A1 1 0 0 1 21 8.3v7.4a1 1 0 0 1-1.4.9L15 14', 'M4 6.5h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z'],
  plus: ['M12 5v14', 'M5 12h14'],
  send: ['M12 19V5', 'm6 11 6-6 6 6'],
  message: ['M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z'],
  phone: ['M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z'],
  mute: ['M11 5 6 9H3v6h3l5 4V5Z', 'm19 9-6 6', 'm13 9 6 6'],
  speaker: ['M11 5 6 9H3v6h3l5 4V5Z', 'M15 9a4 4 0 0 1 0 6', 'M17.8 6.5a8 8 0 0 1 0 11'],
  contacts: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
}

function icon(name: PocketIconName, className = ''): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true'); if (className) svg.setAttribute('class', className)

  if (name === 'signal') {
    ;[[4, 15, 2, 5], [8, 12, 2, 8], [12, 9, 2, 11], [16, 6, 2, 14]].forEach(([x, y, width, height]) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y)); rect.setAttribute('width', String(width)); rect.setAttribute('height', String(height)); rect.setAttribute('rx', '1'); rect.setAttribute('fill', 'currentColor'); rect.setAttribute('stroke', 'none'); svg.append(rect)
    })
    return svg
  }

  if (name === 'battery') {
    const shell = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); shell.setAttribute('x', '3'); shell.setAttribute('y', '7'); shell.setAttribute('width', '16'); shell.setAttribute('height', '10'); shell.setAttribute('rx', '2')
    const nub = document.createElementNS('http://www.w3.org/2000/svg', 'path'); nub.setAttribute('d', 'M21 10v4')
    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); fill.setAttribute('x', '5'); fill.setAttribute('y', '9'); fill.setAttribute('width', '11'); fill.setAttribute('height', '6'); fill.setAttribute('rx', '1'); fill.setAttribute('fill', 'currentColor'); fill.setAttribute('stroke', 'none')
    svg.append(shell, nub, fill); return svg
  }

  for (const pathData of ICON_PATHS[name]) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', pathData); svg.append(path)
  }
  return svg
}

export function callSymbol(): HTMLSpanElement {
  const symbol = node('span', 'pocket-call-symbol'); symbol.setAttribute('aria-hidden', 'true')
  const handset = icon('phone'); handset.style.transform = 'rotate(135deg)'; symbol.append(handset); return symbol
}

function phoneStatus(time: string): HTMLDivElement {
  const status = node('div', 'pocket-phone-status')
  status.append(node('span', 'pocket-phone-status-time', time || 'Pocket'), node('span', 'pocket-phone-island'))
  const indicators = node('span', 'pocket-phone-indicators')
  indicators.append(icon('signal'), icon('wifi'), icon('battery'))
  status.append(indicators)
  return status
}

function appHeader(title: string, subtitle: string, openRoute: () => void, avatarUrl?: string): HTMLButtonElement {
  const header = node('button', 'pocket-phone-app-header')
  header.type = 'button'; header.setAttribute('aria-label', `Open ${title} in Pocket`); header.addEventListener('click', openRoute)
  const back = node('span', 'pocket-phone-header-back'); back.append(icon('back'))
  const identity = node('span', 'pocket-phone-header-identity')
  identity.append(portrait(title, avatarUrl), node('strong', 'pocket-phone-conversation-title', title))
  if (subtitle) identity.append(node('span', 'pocket-phone-subtitle', subtitle))
  const video = node('span', 'pocket-phone-header-action'); video.append(icon('video'))
  header.append(back, identity, video)
  return header
}

function composer(): HTMLSpanElement {
  const bar = node('span', 'pocket-mock-composer pocket-phone-composer'); bar.setAttribute('aria-hidden', 'true')
  const add = node('span', 'pocket-phone-composer-action'); add.append(icon('plus'))
  const field = node('span', 'pocket-phone-composer-field', 'Message')
  const send = node('span', 'pocket-phone-composer-send'); send.append(icon('send'))
  bar.append(add, field, send)
  return bar
}

/** A device cutaway, independent of the compact scene-card renderer. */
export function buildPhoneScreen(activity: PocketActivity, openRoute: (route: PocketRoute) => void, options: ActivityRenderOptions): HTMLElement | null {
  const presentation = activity.presentation
  if (!presentation || !['received', 'observed', 'sent', 'batch'].includes(presentation.kind)) return null
  const type = presentation.call ? 'call' : presentation.kind === 'batch' ? 'group' : presentation.kind === 'sent' ? 'chat' : 'lock'
  const phone = node('div', 'pocket-inline-frame pocket-phone-device')
  phone.dataset.pocketUi = 'true'; phone.dataset.appearance = 'phone'; phone.dataset.screen = type
  phone.style.setProperty('--pocket-inline-accent', options.accent || '#8b7dff')
  if (options.textColor) phone.style.setProperty('--pocket-inline-text', options.textColor)
  if (options.surfaceColor) phone.style.setProperty('--pocket-inline-surface', options.surfaceColor)

  const clock = options.clock || activityClock(activity)
  const time = clock.precision === 'exact' ? clock.time : ''
  const screen = node('div', 'pocket-phone-screen')
  screen.append(phoneStatus(time))
  phone.append(screen)

  const routeButton = (label: string, className: string, aria: string) => {
    const button = node('button', className, label); button.type = 'button'; button.setAttribute('aria-label', aria)
    button.addEventListener('click', () => openRoute(activity.route)); return button
  }

  const recipients = presentation.recipientNames?.filter(Boolean).join(', ') || ''
  const title = presentation.conversationTitle || (type === 'lock' ? presentation.senderName : recipients) || activity.title || 'Messages'

  if (type === 'lock') {
    screen.classList.add('pocket-phone-lock')
    if (options.background) screen.style.backgroundImage = `linear-gradient(rgba(12, 10, 18, .18), rgba(12, 10, 18, .36)), ${options.background}`
    screen.style.backgroundSize = options.backgroundSize || 'cover'; screen.style.backgroundPosition = options.backgroundPosition || 'center'

    const lockHero = node('div', 'pocket-phone-lock-hero')
    const deviceLabel = presentation.kind === 'observed' ? `${recipients || 'Another actor'}'s phone` : (recipients ? `${recipients}'s phone` : 'Pocket')
    const display = node('span', 'pocket-phone-clock', clock.time || 'New message')
    display.dataset.precision = clock.precision
    lockHero.append(node('span', 'pocket-phone-lock-label', deviceLabel), display)
    if (clock.date) lockHero.append(node('span', 'pocket-phone-lock-caption', clock.date))

    const notification = routeButton('', 'pocket-phone-notification', `Open ${presentation.kind === 'observed' ? `${recipients}'s phone · ` : ''}${title} in Pocket`)
    const app = node('span', 'pocket-phone-notification-app'); app.append(icon('message'), node('span', 'pocket-phone-app-label', 'Messages'))
    const body = node('span', 'pocket-phone-notification-body')
    body.append(portrait(presentation.senderName || '?', options.avatarUrl))
    const copy = node('span', 'pocket-phone-notification-content')
    copy.append(node('strong', 'pocket-phone-notification-sender', presentation.senderName || 'Message'), node('span', 'pocket-phone-notification-copy', activity.summary || ''))
    body.append(copy); notification.append(app, body)
    screen.append(lockHero, notification, node('span', 'pocket-phone-home-indicator'))
  } else if (type === 'call') {
    screen.classList.add('pocket-phone-call'); screen.dataset.callStatus = presentation.call!.status
    const callHeader = routeButton('', 'pocket-phone-app-header pocket-phone-call-header', 'Open call history in Pocket')
    const back = node('span', 'pocket-phone-header-back'); back.append(icon('back')); callHeader.append(back, node('span', 'pocket-phone-app-label', 'Phone'))

    const identity = node('div', 'pocket-phone-call-identity')
    identity.append(portrait(presentation.senderName || 'Call', options.avatarUrl), node('strong', 'pocket-phone-call-name', [presentation.senderName, recipients].filter(Boolean).join(' → ') || activity.title), node('span', 'pocket-phone-call-status', callSummary(presentation.call!)))

    const controls = node('div', 'pocket-phone-call-controls')
    const control = (name: PocketIconName, label: string, danger = false) => {
      const item = node('span', `pocket-phone-call-control${danger ? ' pocket-phone-call-danger' : ''}`)
      const glyph = node('span', 'pocket-phone-call-control-icon'); glyph.append(name === 'phone' ? callSymbol() : icon(name))
      item.append(glyph, node('span', 'pocket-phone-control-caption', label)); return item
    }
    controls.append(control('mute', 'Mute'), control('speaker', 'Speaker'), control('message', 'Message'), control('phone', presentation.call!.status === 'ended' ? 'Ended' : 'End', true))
    screen.append(callHeader, identity, controls, node('span', 'pocket-phone-home-indicator'))
  } else {
    screen.classList.add('pocket-phone-chat')
    const subtitle = type === 'group' ? `${presentation.batchMessages?.length || 0} messages` : (recipients ? 'Messages' : '')
    screen.append(appHeader(title, subtitle, () => openRoute(activity.route), type === 'chat' ? options.avatarUrl : undefined))

    const thread = node('div', 'pocket-phone-thread'); thread.tabIndex = 0; thread.setAttribute('role', 'region'); thread.setAttribute('aria-label', `${title} conversation`)
    const messages = type === 'group' ? presentation.batchMessages || [] : [{ senderName: presentation.senderName || 'You', senderActorId: presentation.senderActorId, text: activity.summary || '', direction: 'sent' }]
    for (const [index, message] of messages.entries()) {
      const row = node('div', 'pocket-phone-message'); row.dataset.direction = message.direction
      const previous = messages[index - 1]; row.dataset.continuation = String(Boolean(previous && previous.senderName === message.senderName))
      if (message.direction !== 'sent') {
        row.append(portrait(message.senderName, options.avatars?.[message.senderActorId || '']))
        const content = node('span', 'pocket-phone-message-content')
        if (row.dataset.continuation !== 'true') content.append(node('strong', 'pocket-phone-sender', message.senderName))
        content.append(node('span', 'pocket-phone-bubble', message.text)); row.append(content)
      } else {
        const content = node('span', 'pocket-phone-message-content'); content.append(node('span', 'pocket-phone-bubble', message.text)); row.append(content)
      }
      thread.append(row)
    }
    if (type === 'chat') thread.append(node('span', 'pocket-phone-delivery', 'Delivered'))
    screen.append(thread, composer(), node('span', 'pocket-phone-home-indicator'))
  }
  return phone
}
