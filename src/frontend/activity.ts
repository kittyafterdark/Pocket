import type { PhoneTheme, PocketActivity, PocketRoute } from '../types.js'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { activityClock } from '../domain/activity-clock.js'
import { callSummary } from '../domain/phone-events.js'
import { buildPhoneScreen } from './phone-screen.js'
import { isolatedActivity } from './components/activity-shadow.js'
import { refreshActivityConnectors } from './components/activity-connectors.js'
import { avatarColor } from './components/ui.js'
import { pocketIcon } from './components/pocket-icons.js'
import {
  applyFrameTokens,
  appTile,
  el,
  formatCallDuration,
  portrait,
  renderInlineVoiceNode,
  waveformTrack,
} from './components/inline-primitives.js'

export interface ActivityRenderOptions {
  includeReceipt?: boolean
  includeArtifact?: boolean
  appearance?: 'cards' | 'phone'
  theme?: PhoneTheme
  clock?: ReturnType<typeof import('../domain/activity-clock.js').activityClock>
  accent?: string
  background?: string
  backgroundSize?: string
  backgroundPosition?: string
  avatarUrl?: string
  avatars?: Record<string, string>
  textColor?: string
  surfaceColor?: string
  reducedMotion?: boolean
  renderInlineVoice?: (message: { text: string; senderName: string; senderActorId?: string }) => HTMLElement
}

function frameArtifact(artifact: HTMLElement, activity: PocketActivity, options: ActivityRenderOptions): HTMLElement {
  const frame = el('div', 'pocket-inline-frame')
  frame.dataset.pocketUi = 'true'
  frame.dataset.appearance = options.appearance || 'cards'
  frame.dataset.dir = 'strip'
  frame.dataset.kind = activity.presentation?.kind || activity.kind
  frame.dataset.reducedMotion = String(Boolean(options.reducedMotion))
  applyFrameTokens(frame, options)
  frame.append(artifact)
  return frame
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

function resolveClockText(activity: PocketActivity, options: ActivityRenderOptions): string {
  const clock = options.clock || activityClock(activity)
  if (clock.precision === 'exact' || clock.precision === 'approximate') return clock.time
  return activity.presentation?.storyAt?.slice(11, 16) || ''
}

function sceneNav(options: {
  title: string
  subtitle: string
  actionIcon: 'phone' | 'video'
  asButton?: boolean
  openAria: string
  onOpen: () => void
  avatarUrl?: string
  groupSpeakers?: Array<{ name: string; url?: string }>
}): HTMLElement {
  const nav = options.asButton ? el('button', 'pk-app-nav pk-app-nav-button') : el('span', 'pk-app-nav')
  if (options.asButton) {
    ;(nav as HTMLButtonElement).type = 'button'
    nav.setAttribute('aria-label', options.openAria)
    nav.addEventListener('click', options.onOpen)
  }

  const back = el('span', 'pk-nav-btn')
  back.append(pocketIcon('back'))

  const identity = el('span', 'pk-nav-identity')
  if (options.groupSpeakers && options.groupSpeakers.length >= 2) {
    const stack = el('span', 'pk-group-stack')
    stack.setAttribute('aria-hidden', 'true')
    for (const speaker of options.groupSpeakers.slice(0, 2)) {
      stack.append(portrait(speaker.name, 'pocket-inline-avatar', speaker.url))
    }
    identity.append(stack)
  } else {
    identity.append(portrait(options.title, 'pocket-inline-avatar', options.avatarUrl))
  }

  const titles = el('span', 'pk-nav-titles')
  titles.append(
    el('strong', 'pk-nav-name pocket-inline-transcript-title', options.title),
    el('span', 'pk-nav-sub', options.subtitle),
  )
  identity.append(titles)

  const right = el('span', 'pk-nav-btn is-action')
  right.append(pocketIcon(options.actionIcon))
  nav.append(back, identity, right)
  return nav
}

function buildBatchArtifact(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: ActivityRenderOptions,
): HTMLElement | null {
  const presentation = activity.presentation
  if (presentation?.kind !== 'batch' || !presentation.batchMessages?.length) return null

  const visible = presentation.batchMessages
  const hasVoice = visible.some((item) => item.format === 'voice')
  const titleText = presentation.conversationTitle || activity.title || 'Group chat'
  const openAria = `Open ${titleText} in Pocket`

  const primary = hasVoice ? el('div', 'pocket-inline-artifact pocket-inline-chat-transcript') : el('button', 'pocket-inline-artifact pocket-inline-chat-transcript')
  primary.dataset.kind = 'batch'
  if (!hasVoice) {
    ;(primary as HTMLButtonElement).type = 'button'
    primary.setAttribute('aria-label', openAria)
    primary.addEventListener('click', () => openRoute(activity.route))
  } else {
    primary.setAttribute('role', 'region')
    primary.setAttribute('aria-label', titleText)
  }

  const speakers: Array<{ name: string; url?: string }> = []
  const seenSpeakers = new Set<string>()
  for (const item of visible) {
    if (item.direction === 'sent') continue
    const key = item.senderActorId || item.senderName
    if (!seenSpeakers.has(key)) {
      seenSpeakers.add(key)
      speakers.push({ name: item.senderName, url: options.avatars?.[item.senderActorId || ''] })
    }
    if (speakers.length >= 2) break
  }

  primary.append(sceneNav({
    title: titleText,
    subtitle: `${visible.length} messages`,
    actionIcon: 'video',
    asButton: hasVoice,
    openAria,
    onOpen: () => openRoute(activity.route),
    groupSpeakers: speakers,
  }))

  const transcript = el('span', 'pocket-inline-transcript pk-thread-canvas')
  for (const [index, item] of visible.entries()) {
    const row = el('span', 'pocket-inline-transcript-row pk-msg-row')
    row.dataset.direction = item.direction
    const previous = visible[index - 1]
    const cont = Boolean(previous && (previous.senderActorId || previous.senderName) === (item.senderActorId || item.senderName))
    row.dataset.continuation = String(cont)
    row.hidden = index >= 3

    const isVoice = item.format === 'voice'
    const isSent = item.direction === 'sent'
    const content = el('span', 'pocket-inline-transcript-content pk-msg-col')
    const bubble = el('span', `pocket-inline-transcript-bubble pk-bubble${isVoice ? ' is-voice' : ''}`)

    if (isVoice) {
      bubble.append(renderInlineVoiceNode({
        text: item.text,
        senderName: item.senderName,
        senderActorId: item.senderActorId,
      }, options.renderInlineVoice))
    } else {
      bubble.textContent = item.text
    }

    if (!isSent) {
      const speakerColor = avatarColor(item.senderActorId || item.senderName)
      row.style.setProperty('--speaker-accent', speakerColor)
      const sender = el('strong', 'pocket-inline-transcript-sender pk-msg-sender', item.senderName)
      content.append(sender, bubble)
      row.append(portrait(item.senderName, 'pocket-inline-avatar', options.avatars?.[item.senderActorId || ''], speakerColor), content)
    } else {
      content.append(bubble)
      row.append(content)
    }
    transcript.appendChild(row)
  }
  primary.appendChild(transcript)

  const group = el('div', 'pocket-inline-batch pk-screen')
  group.dataset.wallpaper = 'chat'
  group.append(primary)

  if (visible.length > 3) {
    const more = el('button', 'pocket-inline-transcript-more pk-thread-more-btn')
    more.type = 'button'
    more.setAttribute('aria-expanded', 'false')
    const collapsed = `Show ${visible.length - 3} more messages`
    more.textContent = collapsed
    more.addEventListener('click', () => {
      const expanded = more.getAttribute('aria-expanded') !== 'true'
      more.setAttribute('aria-expanded', String(expanded))
      more.textContent = expanded ? 'Show fewer messages' : collapsed
      for (const [index, row] of [...transcript.children].entries()) {
        ;(row as HTMLElement).hidden = !expanded && index >= 3
      }
    })
    group.append(more)
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

  const clockTime = resolveClockText(activity, options)

  if (presentation.call) {
    const call = presentation.call
    const primary = el('button', 'pocket-inline-artifact pocket-inline-call pk-call-screen')
    primary.type = 'button'
    primary.dataset.kind = presentation.kind
    primary.dataset.callStatus = call.status

    const callerName = presentation.senderName || recipientLine(activity) || activity.title || 'Call'
    const isObserved = presentation.kind === 'observed'
    const isSent = presentation.kind === 'sent'
    const displayName = isSent ? `To ${callerName}` : callerName
    const durationText = formatCallDuration(call.durationSeconds)
    const ownerLine = observedDeviceLine(activity)

    const standby = el('span', 'pk-standby-card')

    const head = el('span', 'pk-standby-head')
    const headLeft = el('span', 'pk-standby-app')
    headLeft.append(appTile('phone'), el('span', '', isObserved ? `${ownerLine} · Phone` : 'Phone Audio'))

    const headRight = el('span', 'pk-call-chip')
    if (call.status === 'connected') {
      headRight.classList.add('is-live')
      headRight.textContent = clockTime || 'Live'
    } else if (call.status === 'missed') {
      headRight.classList.add('is-missed')
      headRight.append(pocketIcon('missed'), el('span', '', 'Missed'))
    } else {
      headRight.textContent = durationText || 'Ended'
    }
    head.append(headLeft, headRight)

    const body = el('span', 'pk-standby-body')
    const ring = el('span', 'pk-call-avatar-ring')
    ring.append(portrait(callerName, 'pocket-inline-avatar', options.avatarUrl, avatarColor(presentation.senderActorId || callerName)))
    const info = el('span', 'pk-standby-info')
    info.append(
      el('strong', 'pocket-inline-artifact-actors pk-callkit-name', displayName),
      el('span', 'pocket-inline-artifact-copy pk-standby-sub', callSummary(call)),
    )
    body.append(ring, info, waveformTrack(call.status === 'ended'))

    const foot = el('span', 'pk-standby-foot')
    const footChips = el('span', 'pk-standby-chips')
    if (call.status === 'connected') {
      const liveChip = el('span', 'pk-call-chip is-live', 'Live audio')
      footChips.append(liveChip)
    } else if (call.status === 'missed') {
      footChips.append(el('span', 'pk-call-chip', isObserved ? ownerLine : isSent ? 'Outgoing' : 'Incoming'))
    } else {
      footChips.append(el('span', 'pk-call-chip', call.speakerphone ? 'Speaker' : 'Handset'))
    }

    const footDock = el('span', 'pk-call-hud-dock')
    if (call.status === 'connected') {
      const speakerPill = el('span', `pk-call-btn is-pill${call.speakerphone ? ' is-active' : ''}`)
      speakerPill.append(pocketIcon('speaker'), el('span', '', 'Speaker'))
      const mutePill = el('span', 'pk-call-btn is-pill')
      mutePill.append(pocketIcon('mute'), el('span', '', 'Mute'))
      const endCircle = el('span', 'pk-call-btn is-circle is-danger')
      endCircle.append(pocketIcon('phoneEnd'))
      footDock.append(speakerPill, mutePill, endCircle)
    } else {
      const msgPill = el('span', 'pk-call-btn is-pill')
      msgPill.append(pocketIcon('chatOutline'), el('span', '', 'Message'))
      const backPill = el('span', `pk-call-btn is-pill${call.status === 'missed' ? ' is-answer' : ''}`)
      backPill.append(pocketIcon('phone'), el('span', '', call.status === 'missed' ? 'Call back' : 'Call again'))
      footDock.append(msgPill, backPill)
    }

    foot.append(footChips, footDock)
    standby.append(head, body, foot)
    primary.append(standby)
    primary.setAttribute('aria-label', `Open ${isObserved ? `${ownerLine} · ` : ''}${callerName} call in Pocket`)
    primary.addEventListener('click', () => openRoute(activity.route))

    const screen = el('div', 'pk-screen')
    screen.append(primary)
    return frameArtifact(screen, activity, options)
  }

  const isVoice = presentation.format === 'voice'

  if (presentation.kind === 'sent') {
    const recipientName = recipientLine(activity)
    const openAria = `Open ${recipientName || activity.title} in Pocket`
    const primary = isVoice ? el('div', 'pocket-inline-artifact pk-sent-card') : el('button', 'pocket-inline-artifact pk-sent-card')
    primary.dataset.kind = 'sent'
    if (!isVoice) {
      ;(primary as HTMLButtonElement).type = 'button'
      primary.setAttribute('aria-label', openAria)
      primary.addEventListener('click', () => openRoute(activity.route))
    } else {
      primary.setAttribute('role', 'region')
      primary.setAttribute('aria-label', recipientName || 'Sent message')
    }

    primary.append(sceneNav({
      title: recipientName || 'Messages',
      subtitle: 'Messages',
      actionIcon: 'phone',
      asButton: isVoice,
      openAria,
      onOpen: () => openRoute(activity.route),
      avatarUrl: options.avatarUrl,
    }))

    const canvas = el('span', 'pk-thread-canvas')
    const row = el('span', 'pk-msg-row')
    row.dataset.direction = 'sent'
    row.dataset.continuation = 'false'
    const col = el('span', 'pk-msg-col')
    const bubble = el('span', `pocket-inline-chat-bubble pk-bubble${isVoice ? ' is-voice' : ''}`)
    if (isVoice) {
      bubble.append(renderInlineVoiceNode({
        text: activity.summary || '',
        senderName: presentation.senderName || 'You',
        senderActorId: presentation.senderActorId,
      }, options.renderInlineVoice))
    } else {
      bubble.textContent = activity.summary || ''
    }
    col.append(bubble)
    row.append(col)
    canvas.append(row, el('span', 'pk-delivery-receipt', clockTime ? `Delivered · ${clockTime}` : 'Delivered'))
    primary.append(canvas)

    const screen = el('div', 'pk-screen')
    screen.dataset.wallpaper = 'chat'
    screen.append(primary)
    return frameArtifact(screen, activity, options)
  }

  // Received or observed lock-screen notification
  const isObserved = presentation.kind === 'observed'
  const senderName = presentation.senderName || presentation.conversationTitle || activity.title
  const openAria = `Open ${isObserved ? `${observedDeviceLine(activity)} · ` : ''}${presentation.conversationTitle || activity.title} in Pocket`

  const screen = el('div', 'pk-screen')
  screen.dataset.wallpaper = 'lock'
  const lockBody = el('div', 'pk-lock-body')

  if (isObserved) {
    const deviceBar = el('div', 'pk-lock-device-bar')
    const ownerPill = el('span', 'pk-lock-owner-pill')
    ownerPill.append(pocketIcon('lock'), el('span', '', observedDeviceLine(activity)))
    deviceBar.append(ownerPill, el('span', 'pk-lock-clock-mini', clockTime || 'Locked'))
    lockBody.append(deviceBar)
  }

  const primary = isVoice ? el('div', 'pocket-inline-artifact pk-notif-card') : el('button', 'pocket-inline-artifact pk-notif-card')
  primary.dataset.kind = presentation.kind
  if (!isVoice) {
    ;(primary as HTMLButtonElement).type = 'button'
    primary.setAttribute('aria-label', openAria)
    primary.addEventListener('click', () => openRoute(activity.route))
  } else {
    primary.setAttribute('role', 'region')
    primary.setAttribute('aria-label', `Voice message from ${senderName}`)
  }

  const avatarWrap = el('span', 'pk-avatar-wrap')
  avatarWrap.append(portrait(senderName || 'Messages', 'pocket-inline-avatar', options.avatarUrl, avatarColor(presentation.senderActorId || senderName)))
  const appCorner = el('span', 'pk-app-corner-badge')
  appCorner.dataset.app = 'messages'
  appCorner.setAttribute('aria-hidden', 'true')
  appCorner.append(pocketIcon('message'))
  avatarWrap.append(appCorner)

  const main = el('span', 'pk-notif-main')
  const top = el('span', 'pk-notif-top')
  // Keep "Messages" before sender in DOM order while visually ordering sender left & meta right.
  const meta = el('span', 'pk-notif-meta', `Messages${clockTime ? ` · ${clockTime}` : ''}`)
  top.append(meta)

  if (isVoice) {
    const openSender = el('button', 'pk-notif-open-sender')
    openSender.type = 'button'
    openSender.setAttribute('aria-label', openAria)
    openSender.addEventListener('click', () => openRoute(activity.route))
    openSender.append(el('strong', 'pk-notif-sender pocket-inline-artifact-actors', senderName))
    top.append(openSender)
    main.append(
      top,
      renderInlineVoiceNode({
        text: activity.summary || '',
        senderName,
        senderActorId: presentation.senderActorId,
      }, options.renderInlineVoice),
    )
  } else {
    top.append(el('strong', 'pk-notif-sender pocket-inline-artifact-actors', senderName))
    main.append(top, el('span', 'pk-notif-text pocket-inline-artifact-copy', activity.summary || ''))
  }

  primary.append(avatarWrap, main)
  lockBody.append(primary)
  screen.append(lockBody)
  return frameArtifact(screen, activity, options)
}

function buildActivityStack(
  activity: PocketActivity,
  openRoute: (route: PocketRoute) => void,
  options: ActivityRenderOptions = {},
): HTMLSpanElement {
  const stack = document.createElement('span')
  stack.className = 'pocket-artifact-stack'
  stack.dataset.pocketUi = 'true'

  if (options.includeArtifact !== false) {
    const artifact = options.appearance === 'phone'
      ? buildPhoneScreen(activity, openRoute, options)
      : buildBatchArtifact(activity, openRoute, options) || buildMessageArtifact(activity, openRoute, options)
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
      const summary = document.createElement('span')
      summary.textContent = activity.summary
      copy.append(summary)
    }

    const arrow = document.createElement('span')
    arrow.className = 'pocket-receipt-arrow'
    arrow.setAttribute('aria-hidden', 'true')
    arrow.textContent = '›'
    receipt.append(label, copy, arrow)

    receipt.setAttribute('aria-label', `Open ${activity.presentation?.conversationTitle || activity.title} in Pocket`)
    receipt.addEventListener('click', () => openRoute(activity.route))
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
  if (communication) {
    wrapper.setAttribute('data-pocket-host', 'true')
    refreshActivityConnectors([{ host: wrapper, activity, options, owner: '' }], entry => openRoute(entry.route))
    return wrapper
  }
  return renderActivityHost(wrapper, activity, openRoute, { ...options, includeArtifact: false, includeReceipt: true })
}
