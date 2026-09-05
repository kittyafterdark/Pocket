import type { DiscoveredActor, PhoneState, PocketContact, PocketConversation, PocketRelationship } from '../types.js'
import { contactAccent, contactAvatar, stableContactAccent } from './contacts.js'

type ActorSource = DiscoveredActor['source']

export interface PocketActorPresentation {
  actorId: string
  kind: 'persona' | 'contact' | 'discovered'
  name: string
  role: string
  identityBrief: string
  accent: string
  avatarUrl: string
  relationship: PocketRelationship
  contact?: PocketContact
  discovered?: DiscoveredActor
}

export function normalizeActorName(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLocaleLowerCase().slice(0, 160)
    : ''
}

export function normalizeDiscoveredActors(value: unknown, chatId: string, now: string): DiscoveredActor[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.slice(-160).flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
    const raw = entry as Record<string, unknown>
    const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim().slice(0, 120) : ''
    const normalizedName = normalizeActorName(raw.normalizedName || displayName)
    const id = typeof raw.id === 'string' ? raw.id.trim().slice(0, 180) : ''
    if (!id || !displayName || !normalizedName || seen.has(id)) return []
    seen.add(id)
    const source: ActorSource = raw.source === 'roleplay' || raw.source === 'messages' || raw.source === 'group-chat' ? raw.source : 'model-tool'
    return [{
      id,
      chatId,
      displayName,
      normalizedName,
      firstSeenAt: validDate(raw.firstSeenAt, now),
      lastSeenAt: validDate(raw.lastSeenAt, now),
      source,
      relationship: raw.relationship === 'close' ? 'close' : 'background',
      promotedContactId: typeof raw.promotedContactId === 'string' && raw.promotedContactId.trim() ? raw.promotedContactId.trim().slice(0, 180) : undefined,
    }]
  })
}

function validDate(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.trim().slice(0, 40) : ''
  return Number.isFinite(Date.parse(text)) ? text : fallback
}

export function conversationActorIds(conversation: Pick<PocketConversation, 'participantActorIds' | 'participantContactIds'>): string[] {
  return conversation.participantActorIds?.length ? conversation.participantActorIds : conversation.participantContactIds
}

export function resolvePocketActor(
  state: Pick<PhoneState, 'contacts' | 'discoveredActors'> & Partial<Pick<PhoneState, 'pocketPersona' | 'pocketPersonaActorId'>>,
  actorId: string,
): PocketActorPresentation | null {
  if (state.pocketPersona && state.pocketPersonaActorId && actorId === state.pocketPersonaActorId) {
    return {
      actorId, kind: 'persona', name: state.pocketPersona.displayName || 'You', role: state.pocketPersona.role || 'Persona',
      identityBrief: state.pocketPersona.identityBrief || '', accent: state.pocketPersona.accent || '#8b7dff',
      avatarUrl: state.pocketPersona.avatarUrl || '', relationship: 'close',
    }
  }
  const contact = state.contacts.find((entry) => entry.id === actorId)
  if (contact) return contactPresentation(contact, actorId)
  const discovered = state.discoveredActors.find((entry) => entry.id === actorId)
  if (!discovered) return null
  const promoted = discovered.promotedContactId
    ? state.contacts.find((entry) => entry.id === discovered.promotedContactId)
    : undefined
  if (promoted) return { ...contactPresentation(promoted, actorId), discovered }
  return {
    actorId,
    kind: 'discovered',
    name: discovered.displayName,
    role: discovered.relationship === 'close' ? 'Close connection' : 'Discovered actor',
    identityBrief: '',
    accent: stableContactAccent(discovered.normalizedName || discovered.id),
    avatarUrl: '',
    relationship: discovered.relationship,
    discovered,
  }
}

export function listPocketActors(state: Pick<PhoneState, 'contacts' | 'discoveredActors'>): PocketActorPresentation[] {
  const promotedContactIds = new Set(state.discoveredActors.map((entry) => entry.promotedContactId).filter((entry): entry is string => Boolean(entry)))
  return [
    ...state.discoveredActors.map((entry) => resolvePocketActor(state, entry.id)).filter((entry): entry is PocketActorPresentation => Boolean(entry)),
    ...state.contacts.filter((entry) => !promotedContactIds.has(entry.id)).map((entry) => contactPresentation(entry, entry.id)),
  ]
}

function contactPresentation(contact: PocketContact, actorId: string): PocketActorPresentation {
  return {
    actorId,
    kind: 'contact',
    name: contact.name,
    role: contact.role,
    identityBrief: contact.identityBrief || contact.description,
    accent: contactAccent(contact),
    avatarUrl: contactAvatar(contact),
    relationship: contact.relationship,
    contact,
  }
}

export function matchingActorIds(state: Pick<PhoneState, 'contacts' | 'discoveredActors'>, name: string, allowedIds?: string[]): string[] {
  const normalized = normalizeActorName(name)
  if (!normalized) return []
  const allowed = allowedIds ? new Set(allowedIds) : null
  const matches: string[] = []
  const promotedActors = new Map(state.discoveredActors.filter((entry) => entry.promotedContactId).map((entry) => [entry.promotedContactId!, entry.id]))
  for (const contact of state.contacts) {
    const actorId = promotedActors.get(contact.id) || contact.id
    if ((!allowed || allowed.has(actorId)) && normalizeActorName(contact.name) === normalized && !matches.includes(actorId)) matches.push(actorId)
  }
  for (const actor of state.discoveredActors) {
    if ((!allowed || allowed.has(actor.id)) && actor.normalizedName === normalized && !matches.includes(actor.id)) matches.push(actor.id)
  }
  return matches
}

export function ensureDiscoveredActor(state: PhoneState, options: {
  name: string
  source: ActorSource
  relationship?: PocketRelationship
  now: string
  makeId: (prefix: string) => string
}): DiscoveredActor {
  const displayName = options.name.trim().replace(/\s+/g, ' ').slice(0, 120)
  const normalizedName = normalizeActorName(displayName)
  if (!normalizedName) throw new Error('A discovered actor needs a name.')
  const existing = state.discoveredActors.find((entry) => entry.normalizedName === normalizedName)
  if (existing) {
    existing.displayName = displayName
    existing.lastSeenAt = options.now
    if (options.relationship === 'close') existing.relationship = 'close'
    return existing
  }
  const actor: DiscoveredActor = {
    id: options.makeId('actor'),
    chatId: state.chatId,
    displayName,
    normalizedName,
    firstSeenAt: options.now,
    lastSeenAt: options.now,
    source: options.source,
    relationship: options.relationship === 'close' ? 'close' : 'background',
  }
  state.discoveredActors.push(actor)
  state.discoveredActors = state.discoveredActors.slice(-160)
  return actor
}

export function ensureDirectActorConversation(state: PhoneState, actorId: string, now: string, makeId: (prefix: string) => string): PocketConversation {
  const existing = state.conversations.find((conversation) => conversation.kind === 'direct' && conversation.includesPocketPersona !== false && conversationActorIds(conversation)[0] === actorId)
  if (existing) return existing
  const actor = resolvePocketActor(state, actorId)
  if (!actor || actor.kind === 'persona') throw new Error('Choose a valid non-Persona actor before opening a conversation.')
  const participantContactIds = actor.contact ? [actor.contact.id] : []
  const conversation: PocketConversation = {
    id: makeId('conversation'),
    kind: 'direct',
    title: actor.name,
    participantActorIds: [actorId],
    includesPocketPersona: true,
    participantContactIds,
    messages: [],
    unread: 0,
    availability: { state: 'remote' },
    createdAt: now,
    updatedAt: now,
  }
  state.conversations.push(conversation)
  return conversation
}

export function ensureExternalDirectConversation(
  state: PhoneState,
  leftActorId: string,
  rightActorId: string,
  now: string,
  makeId: (prefix: string) => string,
): PocketConversation {
  if (!leftActorId || !rightActorId || leftActorId === rightActorId) throw new Error('An external direct conversation needs two distinct actors.')
  const wanted = [leftActorId, rightActorId].sort()
  const existing = state.conversations.find((conversation) =>
    conversation.kind === 'direct'
    && conversation.includesPocketPersona === false
    && [...conversationActorIds(conversation)].sort().join('\u0000') === wanted.join('\u0000')
  )
  if (existing) return existing
  const actors = wanted.map((actorId) => resolvePocketActor(state, actorId))
  if (actors.some((actor) => !actor || actor.kind === 'persona')) throw new Error('Choose two valid non-Persona actors before opening an external conversation.')
  const participantContactIds = actors.flatMap((actor) => actor?.contact?.id || []).filter((entry, index, all) => all.indexOf(entry) === index)
  const conversation: PocketConversation = {
    id: makeId('conversation'),
    kind: 'direct',
    title: actors.map((actor) => actor!.name).join(' & ').slice(0, 120),
    participantActorIds: wanted,
    includesPocketPersona: false,
    participantContactIds,
    messages: [],
    unread: 0,
    availability: { state: 'remote' },
    createdAt: now,
    updatedAt: now,
  }
  state.conversations.push(conversation)
  return conversation
}

export function actorAsGenerationContact(actor: PocketActorPresentation, now: string): PocketContact {
  if (actor.contact) return actor.contact
  return {
    id: actor.actorId,
    name: actor.name,
    role: actor.role,
    description: '',
    identityBrief: '',
    sceneNote: '',
    avatarUrl: '',
    sourceAvatarUrl: '',
    avatarOverrideUrl: '',
    accent: actor.accent,
    sourceAccent: '',
    colorMode: 'pocket',
    source: { kind: 'npc', origin: 'discovered', description: '', discoveredActorId: actor.actorId },
    relationship: actor.relationship,
    presence: { inScene: false, lastSceneAt: '' },
    contextPolicy: { pinned: actor.relationship === 'close' },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' },
    messagingStyle: { talkativeness: actor.relationship === 'close' ? 58 : 42, fragmentation: 35 },
    createdAt: actor.discovered?.firstSeenAt || now,
    updatedAt: actor.discovered?.lastSeenAt || now,
  }
}

export function promoteDiscoveredActor(state: PhoneState, actorId: string, now: string, makeId: (prefix: string) => string): PocketContact {
  const actor = state.discoveredActors.find((entry) => entry.id === actorId)
  if (!actor) throw new Error('That discovered actor no longer exists.')
  const existing = actor.promotedContactId ? state.contacts.find((entry) => entry.id === actor.promotedContactId) : undefined
  if (existing) return existing
  const contactId = makeId('contact')
  const contact: PocketContact = {
    id: contactId,
    name: actor.displayName,
    role: 'Pocket NPC',
    description: '',
    identityBrief: '',
    sceneNote: '',
    avatarUrl: '',
    sourceAvatarUrl: '',
    avatarOverrideUrl: '',
    accent: stableContactAccent(actor.normalizedName),
    sourceAccent: '',
    colorMode: 'pocket',
    source: { kind: 'npc', origin: 'discovered', description: '', discoveredActorId: actor.id },
    relationship: actor.relationship,
    presence: { inScene: false, lastSceneAt: '' },
    contextPolicy: { pinned: actor.relationship === 'close' },
    generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' },
    messagingStyle: { talkativeness: actor.relationship === 'close' ? 58 : 42, fragmentation: 35 },
    createdAt: now,
    updatedAt: now,
  }
  state.contacts.push(contact)
  actor.promotedContactId = contact.id
  actor.lastSeenAt = now
  for (const conversation of state.conversations) {
    if (conversationActorIds(conversation).includes(actor.id) && !conversation.participantContactIds.includes(contact.id)) conversation.participantContactIds.push(contact.id)
  }
  return contact
}
