import type { ConversationLocalReason, ConversationPauseReason, PhoneMessage, PocketContact, PocketContactSource, PocketConversation } from '../types.js'

const MAX_CONTACTS = 80
const MAX_CONVERSATIONS = 80
const MAX_MESSAGES = 240
const ACCENTS = ['#8b7dff', '#ef6f9a', '#55bfa3', '#e19a55', '#5e9ee6', '#b779dc', '#df6f64', '#86a94c']

type AnyRecord = Record<string, unknown>

function record(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function flag(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function timestamp(value: unknown, fallback: string): string {
  const candidate = clean(value, 40)
  return Number.isFinite(Date.parse(candidate)) ? candidate : fallback
}

export function stableContactAccent(seed: string): string {
  let hash = 0
  for (const char of seed) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  return ACCENTS[Math.abs(hash) % ACCENTS.length]
}

export function contactSourceKey(source: PocketContactSource): string {
  if (source.kind === 'character') return `character:${source.characterId}`
  if (source.kind === 'council') return `council:${source.memberId || source.itemId}`
  return `npc:${source.sceneKey || ''}`
}

export function contactAvatar(contact: PocketContact): string {
  return contact.avatarOverrideUrl || contact.sourceAvatarUrl || contact.avatarUrl
}

export function contactAccent(contact: PocketContact): string {
  return contact.colorMode === 'source' && contact.sourceAccent ? contact.sourceAccent : contact.accent
}

function normalizeSource(value: unknown, contactId: string, characterId: string, description: string): PocketContactSource {
  if (record(value) && value.kind === 'character') {
    return { kind: 'character', characterId: clean(value.characterId, 180) || contactId }
  }
  if (record(value) && value.kind === 'council') {
    return {
      kind: 'council',
      memberId: clean(value.memberId, 180),
      itemId: clean(value.itemId, 180),
    }
  }
  if (record(value) && value.kind === 'npc') {
    return {
      kind: 'npc',
      origin: value.origin === 'generated' || value.origin === 'scene' ? value.origin : 'manual',
      description: clean(value.description, 600) || description,
      sceneKey: clean(value.sceneKey, 180) || undefined,
    }
  }
  if (contactId === characterId) return { kind: 'character', characterId }
  return { kind: 'npc', origin: 'manual', description }
}

export function normalizePocketContact(value: unknown, context: {
  characterId: string
  characterName: string
  now: string
  makeId: (prefix: string) => string
}): PocketContact | null {
  if (!record(value)) return null
  const contactId = clean(value.id, 180) || context.makeId('contact')
  const name = clean(value.name, 120)
  if (!name) return null
  const identityBrief = clean(value.identityBrief, 1_200) || clean(value.description, 1_200) || clean(value.subtitle, 160)
  const description = identityBrief
  const source = normalizeSource(value.source, contactId, context.characterId, description)
  const presence = record(value.presence) ? value.presence : {}
  const contextPolicy = record(value.contextPolicy) ? value.contextPolicy : {}
  const generationPolicy = record(value.generationPolicy) ? value.generationPolicy : {}
  const messagingPolicy = record(value.messagingPolicy) ? value.messagingPolicy : {}
  const createdAt = timestamp(value.createdAt, context.now)
  return {
    id: contactId,
    name,
    role: clean(value.role, 120) || clean(value.subtitle, 120) || (source.kind === 'character' ? 'Character' : source.kind === 'council' ? 'Council member' : 'Pocket NPC'),
    description,
    identityBrief,
    sceneNote: clean(value.sceneNote, 600),
    avatarUrl: clean(value.avatarUrl, 2_000),
    sourceAvatarUrl: clean(value.sourceAvatarUrl, 2_000) || clean(value.avatarUrl, 2_000),
    avatarOverrideUrl: clean(value.avatarOverrideUrl, 2_000),
    accent: /^#[0-9a-f]{6}$/i.test(clean(value.accent, 20)) ? clean(value.accent, 20) : stableContactAccent(contactId),
    sourceAccent: /^#[0-9a-f]{6}$/i.test(clean(value.sourceAccent, 20)) ? clean(value.sourceAccent, 20) : '',
    colorMode: value.colorMode === 'source' ? 'source' : 'pocket',
    source,
    presence: {
      inScene: flag(presence.inScene, false),
      lastSceneAt: timestamp(presence.lastSceneAt, ''),
    },
    contextPolicy: { pinned: flag(contextPolicy.pinned) },
    generationPolicy: { relevant: flag(generationPolicy.relevant, true) },
    messagingPolicy: {
      remoteEligible: flag(messagingPolicy.remoteEligible, true),
      allowAmbientInScene: flag(messagingPolicy.allowAmbientInScene, false),
      lastInitiatedMessageAt: timestamp(messagingPolicy.lastInitiatedMessageAt, ''),
      lastInitiatedRoleplayAt: timestamp(messagingPolicy.lastInitiatedRoleplayAt, ''),
    },
    createdAt,
    updatedAt: timestamp(value.updatedAt, createdAt),
  }
}

function normalizeMessage(value: unknown, fallbackContact: PocketContact | undefined, now: string, makeId: (prefix: string) => string): PhoneMessage | null {
  if (!record(value)) return null
  const messageText = clean(value.text, 12_000)
  if (!messageText) return null
  const legacySender = clean(value.sender, 20)
  const sender = legacySender === 'system' ? 'system' : legacySender === 'user' || legacySender === 'persona' ? 'persona' : 'contact'
  const senderContactId = sender === 'contact' ? clean(value.senderContactId, 180) || fallbackContact?.id : undefined
  const read = flag(value.read, sender !== 'contact')
  const status = value.status === 'pending' || value.status === 'failed' || value.status === 'sent' || value.status === 'delivered' || value.status === 'read'
    ? value.status : read ? 'read' : 'delivered'
  return {
    id: clean(value.id, 120) || makeId('msg'),
    sender,
    senderContactId,
    senderName: clean(value.senderName, 120) || (sender === 'persona' ? 'You' : sender === 'system' ? 'Pocket' : fallbackContact?.name || 'Unknown contact'),
    senderAccent: clean(value.senderAccent, 40) || (sender === 'contact' ? fallbackContact?.accent || stableContactAccent(senderContactId || 'unknown') : ''),
    text: messageText,
    createdAt: timestamp(value.createdAt, now),
    read,
    status,
    imageId: clean(value.imageId, 160) || undefined,
    imageUrl: clean(value.imageUrl, 2_000) || undefined,
    generation: record(value.generation) && clean(value.generation.requestId, 180) ? {
      requestId: clean(value.generation.requestId, 180),
      retryOf: clean(value.generation.retryOf, 180) || undefined,
    } : undefined,
  }
}

function normalizeConversation(value: unknown, contacts: PocketContact[], now: string, makeId: (prefix: string) => string): PocketConversation | null {
  if (!record(value)) return null
  const participantContactIds = [...new Set((Array.isArray(value.participantContactIds) ? value.participantContactIds : [])
    .map((entry) => clean(entry, 180)).filter(Boolean))].slice(0, 16)
  if (!participantContactIds.length) return null
  const fallback = contacts.find((contact) => contact.id === participantContactIds[0])
  const messages = (Array.isArray(value.messages) ? value.messages : [])
    .map((entry) => normalizeMessage(entry, fallback, now, makeId))
    .filter((entry): entry is PhoneMessage => Boolean(entry))
    .slice(-MAX_MESSAGES)
  const kind = value.kind === 'group' || participantContactIds.length > 1 ? 'group' : 'direct'
  const createdAt = timestamp(value.createdAt, messages[0]?.createdAt || now)
  const pauseValue = record(value.pause) ? value.pause : null
  const pauseReasons = new Set<ConversationPauseReason>(['ended', 'busy', 'away', 'arriving', 'sleeping', 'unknown'])
  const pauseReason = pauseReasons.has(pauseValue?.reason as ConversationPauseReason) ? pauseValue?.reason as ConversationPauseReason : null
  const availabilityValue = record(value.availability) ? value.availability : null
  const localReasons = new Set<ConversationLocalReason>(['in_scene', 'arriving', 'took_action'])
  const availability = availabilityValue?.state === 'local' && localReasons.has(availabilityValue.reason as ConversationLocalReason)
    ? { state: 'local' as const, reason: availabilityValue.reason as ConversationLocalReason, resumePauseReason: pauseReasons.has(availabilityValue.resumePauseReason as ConversationPauseReason) ? availabilityValue.resumePauseReason as ConversationPauseReason : undefined }
    : availabilityValue?.state === 'paused' && pauseReasons.has(availabilityValue.reason as ConversationPauseReason)
      ? { state: 'paused' as const, reason: availabilityValue.reason as ConversationPauseReason }
      : pauseReason ? { state: 'paused' as const, reason: pauseReason } : { state: 'available' as const }
  const burstValue = record(value.outgoingBurst) ? value.outgoingBurst : null
  const burstId = clean(burstValue?.id, 180)
  return {
    id: clean(value.id, 180) || makeId('conversation'),
    kind,
    title: clean(value.title, 120) || (kind === 'direct' ? fallback?.name || 'Conversation' : participantContactIds.map((entry) => contacts.find((contact) => contact.id === entry)?.name).filter(Boolean).join(', ').slice(0, 120) || 'Group'),
    participantContactIds,
    messages,
    unread: Math.max(0, Math.min(999, Math.floor(Number(value.unread) || messages.filter((entry) => entry.sender === 'contact' && !entry.read).length))),
    pause: pauseReason ? {
      reason: pauseReason,
      createdAt: timestamp(pauseValue?.createdAt, now),
      source: pauseValue?.source === 'scene' ? 'scene' : 'model',
    } : undefined,
    availability,
    outgoingBurst: burstId ? {
      id: burstId,
      messageIds: (Array.isArray(burstValue?.messageIds) ? burstValue.messageIds : []).map((entry) => clean(entry, 180)).filter(Boolean).slice(-12),
      open: flag(burstValue?.open, false),
      held: flag(burstValue?.held, false),
      finalized: flag(burstValue?.finalized, false),
      updatedAt: timestamp(burstValue?.updatedAt, now),
    } : undefined,
    createdAt,
    updatedAt: timestamp(value.updatedAt, messages.at(-1)?.createdAt || createdAt),
  }
}

function activeContact(context: { characterId: string; characterName: string; now: string }): PocketContact {
  const contactId = context.characterId || 'character'
  return {
    id: contactId,
    name: context.characterName || 'Character',
    role: 'Character',
    description: '',
    identityBrief: '',
    sceneNote: '',
    avatarUrl: '',
    sourceAvatarUrl: '',
    avatarOverrideUrl: '',
    accent: stableContactAccent(contactId),
    sourceAccent: '',
    colorMode: 'pocket',
    source: { kind: 'character', characterId: contactId },
    presence: { inScene: false, lastSceneAt: '' },
    contextPolicy: { pinned: false },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' },
    createdAt: context.now,
    updatedAt: context.now,
  }
}

export function ensureDirectConversation(state: { contacts: PocketContact[]; conversations: PocketConversation[] }, contactId: string, now: string, makeId: (prefix: string) => string): PocketConversation {
  const existing = state.conversations.find((conversation) => conversation.kind === 'direct' && conversation.participantContactIds[0] === contactId)
  if (existing) return existing
  const contact = state.contacts.find((entry) => entry.id === contactId)
  const conversation: PocketConversation = {
    id: makeId('conversation'), kind: 'direct', title: contact?.name || 'Conversation', participantContactIds: [contactId],
    messages: [], unread: 0, availability: { state: 'available' }, createdAt: now, updatedAt: now,
  }
  state.conversations.push(conversation)
  return conversation
}

export function normalizeContactCollections(value: AnyRecord, context: {
  characterId: string
  characterName: string
  now: string
  makeId: (prefix: string) => string
}): { contacts: PocketContact[]; conversations: PocketConversation[]; migrated: boolean } {
  const contacts = (Array.isArray(value.contacts) ? value.contacts : [])
    .map((entry) => normalizePocketContact(entry, context))
    .filter((entry): entry is PocketContact => Boolean(entry))
    .slice(0, MAX_CONTACTS)
  let current = contacts.find((entry) => entry.source.kind === 'character' && entry.source.characterId === context.characterId)
  if (!current) {
    current = activeContact(context)
    contacts.unshift(current)
  } else if (context.characterName && context.characterName !== 'Character') {
    current.name = context.characterName
  }

  const legacy = Number(value.version || 0) < 3 || (Array.isArray(value.contacts) && value.contacts.some((entry) => record(entry) && Array.isArray(entry.messages)))
  const rawConversations: unknown[] = Array.isArray(value.conversations) ? [...value.conversations] : []
  if (legacy && Array.isArray(value.contacts)) {
    for (const rawContact of value.contacts) {
      if (!record(rawContact)) continue
      const contactId = clean(rawContact.id, 180) || context.characterId
      const contact = contacts.find((entry) => entry.id === contactId)
      if (!contact) continue
      rawConversations.push({
        id: `dm_${contact.id}`,
        kind: 'direct',
        title: contact.name,
        participantContactIds: [contact.id],
        messages: Array.isArray(rawContact.messages) ? rawContact.messages : [],
        unread: rawContact.unread,
        createdAt: context.now,
        updatedAt: context.now,
      })
    }
  }
  const normalized = rawConversations
    .map((entry) => normalizeConversation(entry, contacts, context.now, context.makeId))
    .filter((entry): entry is PocketConversation => Boolean(entry))
  const conversations: PocketConversation[] = []
  const directByContact = new Map<string, PocketConversation>()
  for (const conversation of normalized) {
    if (conversation.kind !== 'direct') {
      conversations.push(conversation)
      continue
    }
    const contactId = conversation.participantContactIds[0]
    const duplicate = directByContact.get(contactId)
    if (!duplicate) {
      directByContact.set(contactId, conversation)
      conversations.push(conversation)
      continue
    }
    const seen = new Set(duplicate.messages.map((entry) => entry.id))
    duplicate.messages.push(...conversation.messages.filter((entry) => !seen.has(entry.id)))
    duplicate.messages = duplicate.messages.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).slice(-MAX_MESSAGES)
    duplicate.unread = Math.max(duplicate.unread, conversation.unread)
    duplicate.updatedAt = duplicate.messages.at(-1)?.createdAt || duplicate.updatedAt
  }
  ensureDirectConversation({ contacts, conversations }, current.id, context.now, context.makeId)
  return { contacts: contacts.slice(0, MAX_CONTACTS), conversations: conversations.slice(0, MAX_CONVERSATIONS), migrated: legacy }
}
