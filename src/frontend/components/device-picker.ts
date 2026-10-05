import type { PhoneState, PocketRoute } from '../../types.js'
import { resolvePocketActor } from '../../domain/actors.js'
import { conversationDeviceActorIds, conversationTitleForDevice, conversationUnreadForDevice, latestDeviceInteraction, notificationBelongsToDevice, pocketPersonaActorId } from '../../domain/device.js'
import { button, el } from '../shared.js'

export function renderDevicePicker(state: PhoneState, selected: string, deviceKey: (actorId: string) => string, select: (actorId: string, route?: PocketRoute) => void): HTMLElement {
  const personaId = pocketPersonaActorId(state)
  const ids = new Set([personaId])
  for (const conversation of state.conversations) for (const id of conversationDeviceActorIds(state, conversation)) ids.add(id)
  const list = el('div', 'lumiphone-device-list')
  for (const actorId of ids) {
    const actor = resolvePocketActor(state, actorId)
    if (!actor) continue
    const isPersona = actorId === personaId
    const item = el('div', 'lumiphone-device-item')
    item.dataset.selected = String(actorId === selected)
    const row = button('', 'lumiphone-device-row')
    row.dataset.selected = String(actorId === selected)
    row.dataset.pocketDeviceOwner = actorId
    row.dataset.pocketDeviceKey = deviceKey(actorId)
    row.setAttribute('aria-label', `Open ${actor.name}'s phone${actorId === selected ? ', selected' : ''}`)
    const avatar = el('span', 'lumiphone-device-avatar', actor.name.trim().slice(0, 1).toUpperCase() || '?')
    if (actor.avatarUrl) {
      const image = el('img'); image.src = actor.avatarUrl; image.alt = ''; image.loading = 'lazy'
      image.addEventListener('error', () => image.remove(), { once: true }); avatar.append(image)
    }
    const identity = el('span', 'lumiphone-device-identity')
    identity.append(el('strong', '', actor.name), el('span', '', isPersona ? 'Roleplay Persona' : actor.role || 'Pocket actor'))
    const meta = el('span', 'lumiphone-device-meta')
    if (isPersona) {
      meta.append(el('span', 'lumiphone-device-rp', 'Your phone'))
      const messages = state.conversations.reduce((sum, conversation) => sum + conversationUnreadForDevice(state, conversation, actorId), 0)
      const notifications = state.notifications.filter(entry => !entry.read && !entry.dismissedAt && notificationBelongsToDevice(state, actorId, entry.deviceOwnerActorId)).length
      const unread = Math.max(messages, notifications)
      if (unread) {
        const badge = el('span', 'lumiphone-device-unread', unread > 99 ? '99+' : String(unread))
        badge.setAttribute('aria-label', `${unread} unread`); meta.append(badge)
      }
    } else {
      const arrow = el('span', 'lumiphone-device-chevron'); arrow.setAttribute('aria-hidden', 'true')
      arrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 6 6 6-6 6"/></svg>'
      meta.append(arrow)
    }
    row.append(avatar, identity, meta)
    row.addEventListener('click', () => select(actorId))
    item.append(row)
    if (!isPersona) {
      const latest = latestDeviceInteraction(state, actorId)
      if (latest) {
        const jump = button('', 'lumiphone-device-jump')
        jump.setAttribute('aria-label', `Last interaction on ${actor.name}'s phone: ${conversationTitleForDevice(state, latest.conversation, actorId)}`)
        const preview = latest.message.call ? `Call ${latest.message.call.status}` : latest.message.text || (latest.message.imageId || latest.message.imageUrl ? 'Photo' : 'Message')
        jump.append(el('span', 'lumiphone-device-jump-label', 'Last interaction'), el('span', 'lumiphone-device-preview', `${conversationTitleForDevice(state, latest.conversation, actorId)} · ${preview}`))
        jump.addEventListener('click', () => select(actorId, { app: 'messages', conversationId: latest.conversation.id, messageId: latest.message.id, view: 'thread' }))
        item.append(jump)
      } else item.append(el('span', 'lumiphone-device-empty', 'No interactions yet'))
    }
    list.append(item)
  }
  return list
}
