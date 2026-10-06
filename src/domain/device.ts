import type { PhoneMessage, PhoneState, PocketConversation, PocketMessageDirection, PocketActivity } from '../types.js'
import { normalizeActorName, resolvePocketActor } from './actors.js'

export function pocketPersonaActorId(state: Pick<PhoneState, 'pocketPersonaActorId' | 'pocketPersona' | 'chatId' | 'characterId'>): string {
  const persisted = typeof state.pocketPersonaActorId === 'string' ? state.pocketPersonaActorId.trim() : ''
  if (persisted) return persisted
  const linked = state.pocketPersona?.linkedPersonaId?.trim()
  const name = normalizeActorName(state.pocketPersona?.displayName).replace(/\s+/g, '_').slice(0, 120)
  return `persona:${linked || name || `${state.chatId}:${state.characterId}` || 'owner'}`
}

export function messageSenderActorId(state: PhoneState, message: PhoneMessage): string {
  if (message.sender === 'persona') return message.senderActorId || pocketPersonaActorId(state)
  return message.senderActorId || message.senderContactId || ''
}

export function conversationDeviceActorIds(state: PhoneState, conversation: PocketConversation): string[] {
  const result = conversation.includesPocketPersona ? [pocketPersonaActorId(state)] : []
  for (const actorId of conversation.participantActorIds || conversation.participantContactIds || []) {
    if (actorId && !result.includes(actorId)) result.push(actorId)
  }
  return result
}

export function conversationVisibleOnDevice(state: PhoneState, conversation: PocketConversation, deviceOwnerActorId: string): boolean {
  return conversationDeviceActorIds(state, conversation).includes(deviceOwnerActorId || pocketPersonaActorId(state))
}

/** Latest committed communication visible on this phone, independent of unread state. */
export function latestDeviceInteraction(state: PhoneState, owner: string): { conversation: PocketConversation; message: PhoneMessage } | null {
  let latest: { conversation: PocketConversation; message: PhoneMessage } | null = null
  let latestTime = -Infinity
  for (const conversation of state.conversations) {
    if (!conversationVisibleOnDevice(state, conversation, owner)) continue
    for (const message of conversation.messages) {
      if (message.candidateCommitState === 'provisional' || (message.sender === 'system' && !message.call)) continue
      const time = Date.parse(message.createdAt)
      // Undated entries retain storage order, but never displace a dated interaction.
      const rank = Number.isFinite(time) ? time : -Infinity
      if (!latest || rank >= latestTime) { latest = { conversation, message }; latestTime = rank }
    }
  }
  return latest
}

/** Build the device activity index once, preserving storage-order ties and ownership. */
export function latestDeviceInteractions(state: PhoneState): Map<string, { conversation: PocketConversation; message: PhoneMessage }> {
  const index = new Map<string, { conversation: PocketConversation; message: PhoneMessage }>()
  const rank = (message: PhoneMessage) => Number.isFinite(Date.parse(message.createdAt)) ? Date.parse(message.createdAt) : -Infinity
  for (const conversation of state.conversations) {
    let latest: PhoneMessage | undefined
    for (const message of conversation.messages) {
      if (message.candidateCommitState === 'provisional' || (message.sender === 'system' && !message.call)) continue
      if (!latest || rank(message) >= rank(latest)) latest = message
    }
    if (!latest) continue
    for (const owner of conversationDeviceActorIds(state, conversation)) {
      const prior = index.get(owner)
      if (!prior || rank(latest) >= rank(prior.message)) index.set(owner, { conversation, message: latest })
    }
  }
  return index
}

/** Choose an actual participating phone, preferring the observed recipient. */
export function activityDeviceOwner(state: PhoneState, activity: PocketActivity, currentOwner: string): string | null {
  if (activity.scope.chatId !== state.chatId || activity.scope.characterId !== state.characterId) return null
  if (activity.route.app !== 'messages' || !activity.route.conversationId) return currentOwner
  const conversationId = activity.route.conversationId
  const conversation = state.conversations.find(entry => entry.id === conversationId)
  if (!conversation) return null
  const participants = conversationDeviceActorIds(state, conversation)
  const preferred = activity.presentation?.kind === 'observed' ? activity.presentation.recipientActorIds || [] : []
  return [...preferred, currentOwner, ...participants].find(actorId => participants.includes(actorId) && resolvePocketActor(state, actorId)) || null
}

export function messageDirection(
  state: PhoneState,
  conversation: PocketConversation,
  message: PhoneMessage,
  deviceOwnerActorId: string,
): PocketMessageDirection {
  const owner = deviceOwnerActorId || pocketPersonaActorId(state)
  const sender = messageSenderActorId(state, message)
  if (sender && sender === owner) return 'outbound'
  const recipients = message.recipientActorIds?.length
    ? message.recipientActorIds
    : conversationDeviceActorIds(state, conversation).filter((actorId) => actorId !== sender)
  return recipients.includes(owner) ? 'inbound' : 'external'
}

export function messageReadByDevice(state: PhoneState, message: PhoneMessage, deviceOwnerActorId: string): boolean {
  const owner = deviceOwnerActorId || pocketPersonaActorId(state)
  if (messageSenderActorId(state, message) === owner) return true
  if (message.readByActorIds?.includes(owner)) return true
  return owner === pocketPersonaActorId(state) ? Boolean(message.read) : false
}

export function conversationUnreadForDevice(state: PhoneState, conversation: PocketConversation, deviceOwnerActorId: string): number {
  const owner = deviceOwnerActorId || pocketPersonaActorId(state)
  if (!conversationVisibleOnDevice(state, conversation, owner)) return 0
  return conversation.messages.reduce((count, message) => {
    if (message.sender === 'system') return count
    return messageDirection(state, conversation, message, owner) === 'inbound' && !messageReadByDevice(state, message, owner) ? count + 1 : count
  }, 0)
}

export function counterpartActorIds(state: PhoneState, conversation: PocketConversation, deviceOwnerActorId: string): string[] {
  const owner = deviceOwnerActorId || pocketPersonaActorId(state)
  return conversationDeviceActorIds(state, conversation).filter((actorId) => actorId !== owner)
}

export function deviceActorName(state: PhoneState, actorId: string): string {
  if (actorId === pocketPersonaActorId(state)) return state.pocketPersona.displayName || 'You'
  return resolvePocketActor(state, actorId)?.name || 'Unknown actor'
}

export function conversationTitleForDevice(state: PhoneState, conversation: PocketConversation, deviceOwnerActorId: string): string {
  if (conversation.kind === 'group') return conversation.title || 'Group'
  const counterparts = counterpartActorIds(state, conversation, deviceOwnerActorId)
  if (counterparts.length) return counterparts.map((actorId) => deviceActorName(state, actorId)).join(' & ')
  return conversation.title || 'Conversation'
}

export function notificationBelongsToDevice(state: PhoneState, deviceOwnerActorId: string, targetOwnerActorId?: string): boolean {
  const owner = deviceOwnerActorId || pocketPersonaActorId(state)
  return (targetOwnerActorId || pocketPersonaActorId(state)) === owner
}
