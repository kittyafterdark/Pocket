import type { PhoneState, PocketRoute } from '../../types.js'
import { resolvePocketActor } from '../../domain/actors.js'
import { conversationDeviceActorIds, conversationTitleForDevice, conversationUnreadForDevice, latestDeviceInteraction, notificationBelongsToDevice, pocketPersonaActorId } from '../../domain/device.js'
import { button, el, formatDate } from '../shared.js'

const GLYPHS = {
  phone: '<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M10 18h4"/>',
  message: '<path d="M20 11a8 8 0 0 1-8 8H4l1-4a8 8 0 1 1 15-4Z"/>',
  call: '<path d="m5 3 4 1 1 5-2 2a15 15 0 0 0 5 5l2-2 5 1 1 4c-7 4-22-11-16-16Z"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
}
function glyph(kind: keyof typeof GLYPHS): HTMLElement {
  const node = el('span', 'lumiphone-device-glyph')
  node.setAttribute('aria-hidden', 'true')
  node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[kind]}</svg>`
  return node
}

export function renderDevicePicker(state: PhoneState, selected: string, deviceKey: (actorId: string) => string, select: (actorId: string, route?: PocketRoute) => void): HTMLElement {
  const personaId = pocketPersonaActorId(state)
  const ids = new Set([personaId])
  for (const conversation of state.conversations) for (const id of conversationDeviceActorIds(state, conversation)) ids.add(id)
  const entries = [...ids].map(actorId => ({ actorId, actor: resolvePocketActor(state, actorId), latest: latestDeviceInteraction(state, actorId) })).filter(entry => entry.actor)
  const list = el('div', 'lumiphone-device-list')
  const section = (title: string, kind: string) => {
    const group = el('section', 'lumiphone-device-section'); group.dataset.section = kind
    group.append(el('h3', 'lumiphone-device-section-title', title)); list.append(group)
    return group
  }
  const addRow = (entry: typeof entries[number], group: HTMLElement) => {
    const { actorId, actor, latest } = entry
    if (!actor) return
    const isPersona = actorId === personaId
    const row = button('', 'lumiphone-device-row')
    row.dataset.selected = String(actorId === selected)
    row.dataset.recent = String(Boolean(latest) && !isPersona)
    row.dataset.persona = String(isPersona)
    row.dataset.pocketDeviceOwner = actorId
    row.dataset.pocketDeviceKey = deviceKey(actorId)
    row.setAttribute('aria-label', `${isPersona || !latest ? 'Open' : 'Last interaction on'} ${actor.name}'s phone${actorId === selected ? ', current device' : ''}`)
    row.setAttribute('aria-pressed', String(actorId === selected))
    const avatar = el('span', 'lumiphone-device-avatar', actor.name.trim().slice(0, 1).toUpperCase() || '?')
    if (actor.avatarUrl) {
      const image = el('img'); image.src = actor.avatarUrl; image.alt = ''; image.loading = 'lazy'
      image.addEventListener('error', () => image.remove(), { once: true }); avatar.append(image)
    }
    const identity = el('span', 'lumiphone-device-identity')
    identity.append(el('strong', '', actor.name), el('span', 'lumiphone-device-role', isPersona ? 'Roleplay Persona' : actor.role || 'Pocket actor'))
    const meta = el('span', 'lumiphone-device-meta')
    if (isPersona) {
      row.classList.add('lumiphone-device-rp')
      const status = el('span', 'lumiphone-device-current', actorId === selected ? 'Current' : 'Open phone')
      status.prepend(glyph('phone')); meta.append(status)
      const messages = state.conversations.reduce((sum, conversation) => sum + conversationUnreadForDevice(state, conversation, actorId), 0)
      const notifications = state.notifications.filter(entry => !entry.read && !entry.dismissedAt && notificationBelongsToDevice(state, actorId, entry.deviceOwnerActorId)).length
      const unread = Math.max(messages, notifications)
      if (unread) {
        const badge = el('span', 'lumiphone-device-unread', unread > 99 ? '99+' : String(unread))
        badge.setAttribute('aria-label', `${unread} unread`); meta.append(badge)
      }
    } else {
      if (latest) {
        const preview = latest.message.call ? `Call ${latest.message.call.status}` : latest.message.text || (latest.message.imageId || latest.message.imageUrl ? 'Photo' : 'Message')
        const line = el('span', 'lumiphone-device-preview')
        line.append(glyph(latest.message.call ? 'call' : 'message'), el('span', '', preview)); identity.append(line)
        row.title = `${conversationTitleForDevice(state, latest.conversation, actorId)}: ${preview}`
        if (Number.isFinite(Date.parse(latest.message.createdAt))) {
          const time = el('time', 'lumiphone-device-time', formatDate(latest.message.createdAt))
          time.dateTime = latest.message.createdAt; time.title = formatDate(latest.message.createdAt, true); meta.append(time)
        }
      }
      if (actorId === selected) meta.append(el('span', 'lumiphone-device-current', 'Viewing'))
      else meta.append(glyph('chevron'))
    }
    row.append(avatar, identity, meta)
    row.addEventListener('click', () => select(actorId, !isPersona && latest ? { app: 'messages', conversationId: latest.conversation.id, messageId: latest.message.id, view: 'thread' } : undefined))
    group.append(row)
  }
  const own = entries.find(entry => entry.actorId === personaId)
  if (own) addRow(own, section('Your phone', 'persona'))
  const recent = entries.filter(entry => entry.actorId !== personaId && entry.latest).sort((a, b) => (Date.parse(b.latest!.message.createdAt) || 0) - (Date.parse(a.latest!.message.createdAt) || 0))
  if (recent.length) { const group = section('Recent', 'recent'); for (const entry of recent) addRow(entry, group) }
  const others = entries.filter(entry => entry.actorId !== personaId && !entry.latest)
  if (others.length) { const group = section('Others', 'others'); for (const entry of others) addRow(entry, group) }
  return list
}
