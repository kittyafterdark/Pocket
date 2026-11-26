import type { PocketActivity, PocketRoute } from '../types.js'
import type { ActivityRenderOptions } from './activity.js'
import { activityClock } from '../domain/activity-clock.js'
import { callSummary } from '../domain/phone-events.js'
import { avatarColor } from './components/ui.js'
import { pocketIcon, type PocketIconName } from './components/pocket-icons.js'
import {
  applyFrameTokens,
  appTile,
  el,
  equalizerBars,
  formatCallDuration,
  portrait,
  renderInlineVoiceNode,
  waveformTrack,
} from './components/inline-primitives.js'

function phoneStatus(time: string, callStatus = ''): HTMLDivElement {
  const status = el('div', 'pocket-phone-status')
  const island = el('span', 'pocket-phone-island')
  if (callStatus) {
    island.dataset.call = callStatus
    if (callStatus === 'connected') {
      const wave = el('span', 'pocket-phone-island-wave')
      wave.setAttribute('aria-hidden', 'true')
      wave.append(document.createElement('i'), document.createElement('i'), document.createElement('i'))
      island.append(wave)
    }
  }
  island.append(el('span', 'pocket-phone-island-dot'))

  const indicators = el('span', 'pocket-phone-indicators')
  indicators.append(pocketIcon('signal'), pocketIcon('wifi'), pocketIcon('battery'))
  status.append(el('span', 'pocket-phone-status-time', time || 'Pocket'), island, indicators)
  return status
}

function appHeader(
  title: string,
  subtitle: string,
  openRoute: () => void,
  avatarUrl?: string,
  groupSpeakers?: Array<{ name: string; url?: string }>,
): HTMLButtonElement {
  const header = el('button', 'pocket-phone-app-header')
  header.type = 'button'
  header.setAttribute('aria-label', `Open ${title} in Pocket`)
  header.addEventListener('click', openRoute)

  const back = el('span', 'pocket-phone-header-back')
  back.append(pocketIcon('back'))

  const identity = el('span', 'pocket-phone-header-identity')
  if (groupSpeakers && groupSpeakers.length >= 2) {
    const stack = el('span', 'pk-group-stack')
    stack.setAttribute('aria-hidden', 'true')
    for (const speaker of groupSpeakers.slice(0, 2)) {
      stack.append(portrait(speaker.name, 'pocket-phone-avatar', speaker.url))
    }
    identity.append(stack)
  } else {
    identity.append(portrait(title, 'pocket-phone-avatar', avatarUrl))
  }
  identity.append(el('strong', 'pocket-phone-conversation-title', title))
  if (subtitle) identity.append(el('span', 'pocket-phone-subtitle', subtitle))

  const video = el('span', 'pocket-phone-header-action')
  video.append(pocketIcon('video'))
  header.append(back, identity, video)
  return header
}

function composer(): HTMLSpanElement {
  const bar = el('span', 'pocket-mock-composer pocket-phone-composer')
  bar.setAttribute('aria-hidden', 'true')
  const add = el('span', 'pocket-phone-composer-action')
  add.append(pocketIcon('plus'))
  const field = el('span', 'pocket-phone-composer-field', 'Message')
  const send = el('span', 'pocket-phone-composer-send')
  send.append(pocketIcon('send'))
  bar.append(add, field, send)
  return bar
}

function makeCallControl(
  iconName: PocketIconName,
  label: string,
  options: { active?: boolean; danger?: boolean; answer?: boolean; pressed?: boolean; onClick?: (event: MouseEvent) => void } = {},
): HTMLDivElement {
  const wrap = el('div', `pocket-phone-call-control${options.danger ? ' pocket-phone-call-danger' : ''}`)
  const button = el('button', 'pk-call-btn is-circle')
  button.type = 'button'
  button.setAttribute('aria-label', label)
  if (options.active) button.classList.add('is-active')
  if (options.danger) button.classList.add('is-danger')
  if (options.answer) button.classList.add('is-answer')
  if (typeof options.pressed === 'boolean') button.setAttribute('aria-pressed', String(options.pressed))
  button.append(pocketIcon(iconName))
  if (options.onClick) button.addEventListener('click', options.onClick)
  wrap.append(button, el('span', 'pocket-phone-control-caption', label))
  return wrap
}

/** A device cutaway, independent of the compact scene-card renderer. */
export function buildPhoneScreen(activity: PocketActivity, openRoute: (route: PocketRoute) => void, options: ActivityRenderOptions): HTMLElement | null {
  const presentation = activity.presentation
  if (!presentation || !['received', 'observed', 'sent', 'batch'].includes(presentation.kind)) return null

  const type = presentation.call ? 'call' : presentation.kind === 'batch' ? 'group' : presentation.kind === 'sent' ? 'chat' : 'lock'
  const phone = el('div', 'pocket-inline-frame pocket-phone-device')
  phone.dataset.pocketUi = 'true'
  phone.dataset.appearance = 'phone'
  phone.dataset.screen = type
  applyFrameTokens(phone, options)

  const clock = options.clock || activityClock(activity)
  const time = clock.precision === 'exact' ? clock.time : ''
  const screen = el('div', 'pocket-phone-screen')
  screen.append(phoneStatus(time, type === 'call' ? presentation.call!.status : ''))
  phone.append(screen)

  const routeButton = (label: string, className: string, aria: string) => {
    const button = el('button', className, label)
    button.type = 'button'
    button.setAttribute('aria-label', aria)
    button.addEventListener('click', () => openRoute(activity.route))
    return button
  }

  const recipients = presentation.recipientNames?.filter(Boolean).join(', ') || ''
  const title = presentation.conversationTitle || (type === 'lock' ? presentation.senderName : recipients) || activity.title || 'Messages'

  if (type === 'lock') {
    screen.classList.add('pocket-phone-lock')
    const hasCustomWallpaper = Boolean(options.background && /url\(/i.test(options.background))
    if (hasCustomWallpaper && options.background) {
      screen.dataset.customWallpaper = 'true'
      screen.style.backgroundImage = `linear-gradient(rgba(12, 10, 18, .18), rgba(12, 10, 18, .36)), ${options.background}`
      screen.style.backgroundSize = options.backgroundSize || 'cover'
      screen.style.backgroundPosition = options.backgroundPosition || 'center'
    }

    const lockHero = el('div', 'pocket-phone-lock-hero')
    const deviceLabel = presentation.kind === 'observed' ? `${recipients || 'Another actor'}'s phone` : (recipients ? `${recipients}'s phone` : 'Pocket')
    const display = el('span', 'pocket-phone-clock', clock.time || 'New message')
    display.dataset.precision = clock.precision
    lockHero.append(el('span', 'pocket-phone-lock-label', deviceLabel), display)
    if (clock.date) lockHero.append(el('span', 'pocket-phone-lock-caption', clock.date))

    const isVoice = presentation.format === 'voice'
    const openAria = `Open ${presentation.kind === 'observed' ? `${recipients}'s phone · ` : ''}${title} in Pocket`
    const notification = isVoice ? el('div', 'pocket-phone-notification') : routeButton('', 'pocket-phone-notification', openAria)
    if (isVoice) notification.setAttribute('role', 'region')

    const app = el('span', 'pocket-phone-notification-app')
    app.append(pocketIcon('message'), el('span', 'pocket-phone-app-label', 'Messages'))
    if (isVoice) {
      const openChip = routeButton('Open', 'pk-notif-open-chip', openAria)
      app.append(openChip)
    } else if (time) {
      app.append(el('span', 'pk-notif-time', time))
    }

    const body = el('span', 'pocket-phone-notification-body')
    const avatarWrap = el('span', 'pk-avatar-wrap')
    avatarWrap.append(portrait(presentation.senderName || '?', 'pocket-phone-avatar', options.avatarUrl))
    const badge = el('span', 'pk-app-corner-badge')
    badge.dataset.app = 'messages'
    badge.setAttribute('aria-hidden', 'true')
    badge.append(pocketIcon('message'))
    avatarWrap.append(badge)

    const copy = el('span', 'pocket-phone-notification-content')
    copy.append(el('strong', 'pocket-phone-notification-sender', presentation.senderName || 'Message'))
    if (isVoice) {
      copy.append(renderInlineVoiceNode({
        text: activity.summary || '',
        senderName: presentation.senderName || 'Message',
        senderActorId: presentation.senderActorId,
      }, options.renderInlineVoice))
    } else {
      copy.append(el('span', 'pocket-phone-notification-copy', activity.summary || ''))
    }
    body.append(avatarWrap, copy)
    notification.append(app, body)
    screen.append(lockHero, notification, el('span', 'pocket-phone-home-indicator'))
  } else if (type === 'call') {
    const call = presentation.call!
    screen.classList.add('pocket-phone-call')
    screen.dataset.callStatus = call.status

    const callerName = presentation.senderName || recipients || activity.title || 'Call'
    const isSent = presentation.kind === 'sent'
    const isObserved = presentation.kind === 'observed'
    const displayName = isSent ? `To ${callerName}` : callerName
    const durationText = formatCallDuration(call.durationSeconds)
    const glowColor = avatarColor(presentation.senderActorId || callerName)
    screen.style.setProperty('--caller-glow', glowColor)

    const topbar = el('div', 'pk-ios-topbar')
    const callHeader = routeButton('', 'pocket-phone-app-header pocket-phone-call-header', 'Open call history in Pocket')
    const back = el('span', 'pocket-phone-header-back')
    back.append(pocketIcon('back'))
    callHeader.append(back, el('span', 'pocket-phone-app-label', 'Phone'))
    topbar.append(callHeader)
    if (isObserved) {
      const ownerPill = el('span', 'pk-lock-owner-pill')
      ownerPill.append(pocketIcon('lock'), el('span', '', `${recipients || 'Another actor'}'s phone`))
      topbar.append(ownerPill)
    } else if (isSent) {
      topbar.append(el('span', 'pk-call-chip', 'Outgoing'))
    }

    const body = el('div', 'pk-ios-call')

    const poster = el('div', 'pk-ios-poster')
    const kicker = el('div', 'pk-ios-kicker')
    if (call.status === 'connected') kicker.append(equalizerBars())
    kicker.append(el('span', 'pocket-phone-call-status', callSummary(call)))

    const name = el('strong', 'pocket-phone-call-name pk-ios-name', displayName)
    const portraitBox = el('div', 'pk-ios-portrait')
    const halo = el('span', 'pk-call-avatar-ring')
    halo.append(portrait(callerName, 'pocket-phone-avatar', options.avatarUrl, glowColor))
    portraitBox.append(halo)
    poster.append(kicker, name, portraitBox)

    if (call.speakerphone && call.status === 'connected') {
      const speakerBadge = el('span', 'pk-call-chip')
      speakerBadge.append(pocketIcon('speaker'), el('span', '', 'Speakerphone'))
      poster.append(speakerBadge)
    }

    const dock = el('div', 'pk-ios-dock')
    const activityRow = el('div', 'pk-ios-activity-row')
    const activityLeft = el('span', 'pk-ios-activity-label')
    activityLeft.append(
      appTile('phone'),
      el('span', '', call.status === 'connected' ? 'Live Audio' : call.status === 'missed' ? 'Missed Call' : 'Call Summary'),
    )
    const statusChip = el('span', 'pk-call-chip')
    if (call.status === 'connected') {
      statusChip.classList.add('is-live')
      statusChip.textContent = 'Live'
    } else if (call.status === 'missed') {
      statusChip.classList.add('is-missed')
      statusChip.append(pocketIcon('missed'), el('span', '', 'Missed'))
    } else {
      statusChip.textContent = [call.speakerphone ? 'Speaker' : '', durationText || 'Ended'].filter(Boolean).join(' · ')
    }
    activityRow.append(activityLeft, waveformTrack(call.status === 'ended'), statusChip)

    const controls = el('div', 'pocket-phone-call-controls')
    if (call.status === 'connected') {
      controls.dataset.cols = '4'
      const togglePressed = (eventTarget: EventTarget | null) => {
        const button = eventTarget as HTMLElement | null
        if (!button || typeof button.getAttribute !== 'function') return
        const next = button.getAttribute('aria-pressed') !== 'true'
        button.setAttribute('aria-pressed', String(next))
        button.classList.toggle('is-active', next)
      }
      controls.append(
        makeCallControl('speaker', 'Speaker', {
          active: call.speakerphone,
          pressed: call.speakerphone,
          onClick: (event) => togglePressed(event.currentTarget),
        }),
        makeCallControl('mute', 'Mute', {
          pressed: false,
          onClick: (event) => togglePressed(event.currentTarget),
        }),
        makeCallControl('chatOutline', 'Message', { onClick: () => openRoute(activity.route) }),
        makeCallControl('phoneEnd', 'End', { danger: true, onClick: () => openRoute(activity.route) }),
      )
    } else {
      controls.dataset.cols = '3'
      controls.append(
        makeCallControl('chatOutline', 'Message', { onClick: () => openRoute(activity.route) }),
        makeCallControl('phone', call.status === 'missed' ? 'Call back' : 'Call again', {
          answer: call.status === 'missed',
          onClick: () => openRoute(activity.route),
        }),
        makeCallControl('back', 'History', { onClick: () => openRoute(activity.route) }),
      )
    }

    dock.append(activityRow, controls)
    body.append(poster, dock)
    screen.append(topbar, body, el('span', 'pocket-phone-home-indicator'))
  } else {
    screen.classList.add('pocket-phone-chat')
    const rawMessages = type === 'group'
      ? presentation.batchMessages || []
      : [{ senderName: presentation.senderName || 'You', senderActorId: presentation.senderActorId, format: presentation.format, text: activity.summary || '', direction: 'sent' as const }]

    const groupSpeakers: Array<{ name: string; url?: string }> = []
    if (type === 'group') {
      const seen = new Set<string>()
      for (const msg of rawMessages) {
        if (msg.direction === 'sent') continue
        const key = msg.senderActorId || msg.senderName
        if (!seen.has(key)) {
          seen.add(key)
          groupSpeakers.push({ name: msg.senderName, url: options.avatars?.[msg.senderActorId || ''] })
        }
        if (groupSpeakers.length >= 2) break
      }
    }

    const subtitle = type === 'group' ? `${rawMessages.length} messages` : (recipients ? 'Messages' : '')
    screen.append(appHeader(title, subtitle, () => openRoute(activity.route), type === 'chat' ? options.avatarUrl : undefined, groupSpeakers))

    const thread = el('div', 'pocket-phone-thread')
    thread.tabIndex = 0
    thread.setAttribute('role', 'region')
    thread.setAttribute('aria-label', `${title} conversation`)

    for (const [index, message] of rawMessages.entries()) {
      const row = el('div', 'pocket-phone-message')
      row.dataset.direction = message.direction
      const previous = rawMessages[index - 1]
      row.dataset.continuation = String(Boolean(previous && (previous.senderActorId || previous.senderName) === (message.senderActorId || message.senderName)))
      const isVoice = message.format === 'voice'

      const content = el('span', 'pocket-phone-message-content')
      const bubble = el('span', `pocket-phone-bubble${isVoice ? ' is-voice' : ''}`)
      if (isVoice) {
        bubble.append(renderInlineVoiceNode({
          text: message.text,
          senderName: message.senderName,
          senderActorId: message.senderActorId,
        }, options.renderInlineVoice))
      } else {
        bubble.textContent = message.text
      }

      if (message.direction !== 'sent') {
        const hue = avatarColor(message.senderActorId || message.senderName)
        row.style.setProperty('--speaker-accent', hue)
        row.append(portrait(message.senderName, 'pocket-phone-avatar', options.avatars?.[message.senderActorId || ''], hue))
        if (row.dataset.continuation !== 'true') content.append(el('strong', 'pocket-phone-sender', message.senderName))
      }
      content.append(bubble)
      row.append(content)
      thread.append(row)
    }

    if (type === 'chat') thread.append(el('span', 'pocket-phone-delivery', 'Delivered'))
    screen.append(thread, composer(), el('span', 'pocket-phone-home-indicator'))
  }

  return phone
}
