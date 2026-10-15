import type { PocketActivity, PocketRoute } from '../../types.js'
import { renderActivityHost, type ActivityRenderOptions } from '../activity.js'
import { buildPhoneScreen } from '../phone-screen.js'
import { isolatedActivity } from './activity-shadow.js'

export interface PhoneSequenceEntry {
  host: HTMLElement
  activity: PocketActivity
  options: ActivityRenderOptions
  owner: string
}

function key(entry: PhoneSequenceEntry): string {
  const { activity, options, owner } = entry
  const kind = activity.presentation?.kind
  if (options.appearance !== 'phone' || activity.kind !== 'message' || activity.presentation?.call || !owner || !activity.source?.messageId ||
      !kind || !['received', 'observed', 'sent', 'batch'].includes(kind) || activity.route.app !== 'messages' || !activity.route.conversationId) return ''
  return JSON.stringify([activity.scope, activity.source?.messageId, owner, activity.route.conversationId,
    kind === 'received' || kind === 'observed' ? kind : 'chat'])
}

// Markdown may wrap each standalone insert in its own otherwise empty paragraph.
function container(host: HTMLElement): Element {
  const parent = host.parentElement
  return parent?.tagName === 'P' && [...parent.childNodes].every(node => node === host ||
    node.nodeType === 8 || (node.nodeType === 3 && !node.textContent?.trim())) ? parent : host
}

function next(host: HTMLElement, entries: Map<Element, PhoneSequenceEntry>): PhoneSequenceEntry | undefined {
  let sibling = container(host).nextSibling
  while (sibling && (sibling.nodeType === 8 || (sibling.nodeType === 3 && !sibling.textContent?.trim()))) sibling = sibling.nextSibling
  return sibling ? entries.get(sibling as Element) : undefined
}

/** Keep prose anchors in place; combine only adjacent cutaways from the same turn/device. */
export function refreshPhoneSequences(entries: PhoneSequenceEntry[], open: (activity: PocketActivity, route: PocketRoute) => void): void {
  const byContainer = new Map(entries.map(entry => [container(entry.host), entry]))
  const followers = new Set<PhoneSequenceEntry>()
  for (const entry of entries) {
    const following = next(entry.host, byContainer)
    if (key(entry) && following && key(entry) === key(following)) followers.add(following)
  }
  for (const entry of entries) {
    if (followers.has(entry)) continue
    const group = [entry]
    let following = next(entry.host, byContainer)
    while (key(entry) && following && key(entry) === key(following)) {
      group.push(following); following = next(following.host, byContainer)
    }
    const cache = JSON.stringify(group.map(item => [item.activity, item.options, item.owner]))
    entry.host.hidden = false
    if (entry.host.dataset.pocketSequence !== cache || !entry.host.childElementCount) {
      if (entry.options.appearance === 'phone') {
        const phone = sequence(group, open)
        if (phone) {
          const stack = document.createElement('span'); stack.className = 'pocket-artifact-stack'; stack.dataset.pocketUi = 'true'; stack.append(phone)
          entry.host.setAttribute('data-pocket-host', 'true'); entry.host.replaceChildren(isolatedActivity(stack))
        }
        else renderActivityHost(entry.host, entry.activity, route => open(entry.activity, route), { ...entry.options, includeArtifact: true, includeReceipt: false })
      } else renderActivityHost(entry.host, entry.activity, route => open(entry.activity, route), { ...entry.options, includeArtifact: true, includeReceipt: false })
      entry.host.dataset.pocketSequence = cache
    }
    for (const item of group.slice(1)) {
      item.host.hidden = true; item.host.replaceChildren(); delete item.host.dataset.pocketSequence
    }
  }
}

function sequence(group: PhoneSequenceEntry[], open: (activity: PocketActivity, route: PocketRoute) => void): HTMLElement | null {
  const first = group[0]
  const phone = buildPhoneScreen(first.activity, route => open(first.activity, route), first.options)
  if (!phone || first.activity.presentation?.call) return phone
  const lock = phone.dataset.screen === 'lock'
  const target = lock ? phone.querySelector('.pocket-phone-lock')! : phone.querySelector('.pocket-phone-thread')!
  if (lock) {
    const notifications = document.createElement('div'); notifications.className = 'pocket-phone-notifications'
    const notification = phone.querySelector('.pocket-phone-notification')!
    notification.replaceWith(notifications); notifications.append(notification)
    const voice = phone.querySelector('.lp-voice-message'); if (voice) notifications.append(voice)
  }
  const destination = lock ? phone.querySelector('.pocket-phone-notifications')! : target
  const selector = lock ? '.pocket-phone-notification' : '.pocket-phone-message'
  const delivery = lock ? null : target.querySelector('.pocket-phone-delivery')
  for (const entry of group.slice(1)) {
    const extra = buildPhoneScreen(entry.activity, route => open(entry.activity, route), entry.options)
    for (const row of extra?.querySelectorAll(selector) || []) destination.append(row)
    if (lock) { const voice = extra?.querySelector('.lp-voice-message'); if (voice) destination.append(voice) }
  }
  if (delivery) destination.append(delivery)
  const steps = [...phone.querySelectorAll<HTMLElement>(selector)]
  if (!steps.length) return phone
  const interval = Math.min(.9, 12 / Math.max(steps.length - 1, 1))
  for (const [index, step] of steps.entries()) {
    step.classList.add('pocket-phone-step')
    step.style.setProperty('--pocket-step-delay', `${index * interval}s`)
  }
  phone.dataset.playback = 'playing'
  phone.dataset.reducedMotion = String(Boolean(first.options.reducedMotion))
  const controls = document.createElement('div'); controls.className = 'pocket-phone-playback'
  for (const label of ['Replay', 'Show all']) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label
    button.setAttribute('aria-label', `${label} phone messages`)
    button.addEventListener('click', () => {
      phone.dataset.playback = 'complete'
      if (label === 'Replay') { void phone.offsetWidth; phone.dataset.playback = 'playing' }
    })
    controls.append(button)
  }
  if (lock) target.append(controls)
  else target.after(controls)
  return phone
}
