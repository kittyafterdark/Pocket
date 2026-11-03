import type { DiscoveredActor, PhoneState, PocketContact, PocketConversation, PocketRelationship } from '../types.js'
import { contactAccent, contactAvatar, stableContactAccent } from './contacts.js'
import { identityMatches, uniqueIdentityMatch } from './actor-identity.js'

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
    ? value
      .normalize('NFKD')
      .replace(/\p{M}+/gu, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase()
      .slice(0, 160)
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
  const promoted = (discovered.promotedContactId
    ? state.contacts.find((entry) => entry.id === discovered.promotedContactId)
    : undefined) || (() => {
      const matches = identityMatches(discovered.displayName, state.contacts, entry => [entry.name, ...(entry.aliases || [])])
      return matches.length === 1 ? matches[0] : undefined
    })()
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
  const result = new Map<string, PocketActorPresentation>()
  for (const actorId of [...state.discoveredActors.map(actor => actor.id), ...state.contacts.map(contact => contact.id)]) {
    const actor = resolvePocketActor(state, actorId)
    if (actor && !result.has(actor.contact?.id || actor.actorId)) result.set(actor.contact?.id || actor.actorId, actor)
  }
  return [...result.values()]
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

export function canonicalActorId(state: Pick<PhoneState, 'contacts' | 'discoveredActors'>, actorId: string): string {
  return resolvePocketActor(state, actorId)?.contact?.id || actorId
}

export function matchingActorIds(state: Pick<PhoneState, 'contacts' | 'discoveredActors'>, name: string, allowedIds?: string[]): string[] {
  const allowed = allowedIds ? new Set(allowedIds.map(id => canonicalActorId(state, id))) : null
  const actors = listPocketActors(state).filter(actor => !allowed || allowed.has(canonicalActorId(state, actor.actorId)))
  const matches = identityMatches(name, actors, actor => [actor.name, ...(actor.contact?.aliases || []), ...(actor.discovered ? [actor.discovered.displayName] : [])])
  const byIdentity = new Map<string, string>()
  for (const actor of matches) {
    const key = canonicalActorId(state, actor.actorId)
    if (!allowed || allowed.has(key)) byIdentity.set(key, allowedIds?.find(id => canonicalActorId(state, id) === key) || actor.actorId)
  }
  return [...byIdentity.values()]
}

export function groupTitleMatches(thread: PocketConversation, title: string): boolean {
  const wanted = normalizeActorName(title)
  return Boolean(wanted && [thread.title, ...(thread.titleAliases || [])].some(name => normalizeActorName(name) === wanted))
}

export function rememberGroupTitle(thread: PocketConversation, title: string): void {
  const next = title.trim().replace(/\s+/g, ' ').slice(0, 120)
  if (!next || normalizeActorName(next) === normalizeActorName(thread.title)) return
  const names = [...(thread.titleAliases || []), thread.title, next], seen = new Set<string>()
  const aliases = names.filter(name => { const key = normalizeActorName(name); if (!key || seen.has(key)) return false; seen.add(key); return true })
  thread.titleAliases = aliases.length > 24 ? [aliases[0], ...aliases.slice(-23)] : aliases
}

export function matchingGroupConversation(
  state: PhoneState, actorIds: string[], includesPersona: boolean, title = '',
  options: { allowPartial?: boolean; personaUnspecified?: boolean; relatedTitlesOnly?: boolean } = {},
): PocketConversation | undefined {
  const roster = (ids: string[]) => new Set(ids.filter(id => id !== state.pocketPersonaActorId).map(id => canonicalActorId(state, id)))
  const titleWords = (value: string) => normalizeActorName(value).replace(/([\p{L}])([\p{N}])/gu, '$1 $2').replace(/([\p{N}])([\p{L}])/gu, '$1 $2').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/)
  const relatedTitle = (candidate: string) => {
    const a = titleWords(title), b = titleWords(candidate), shorter = a.length <= b.length ? a : b, longer = a.length <= b.length ? b : a
    return shorter.length >= 2 && shorter.join(' ').length >= 4 && shorter.every((word, index) => word === longer[index])
  }
  const wanted = roster(actorIds)
  if (!wanted.size) return undefined
  const matches = state.conversations.filter(thread => {
    if (thread.kind !== 'group' || thread.channel === 'dating') return false
    const samePersona = (thread.includesPocketPersona !== false) === includesPersona
    const named = groupTitleMatches(thread, title)
    const related = [thread.title, ...(thread.titleAliases || [])].some(relatedTitle)
    if (!samePersona && !(options.allowPartial && options.personaUnspecified && (related || named))) return false
    if (named && options.allowPartial) return true
    const existing = roster(conversationActorIds(thread)), shared = [...wanted].filter(id => existing.has(id)).length
    if (samePersona && wanted.size === existing.size && shared === wanted.size) return true
    if (!options.allowPartial || (options.relatedTitlesOnly && !related)) return false
    const descriptiveTitle = /^(?:messages? group|group chat|gc)(?:\s|:|$)/i.test(title.trim())
    if (samePersona && descriptiveTitle && wanted.size >= 2 && shared === wanted.size) return true
    // A named existing group can be addressed by only its current speakers.
    if (related && shared > 0) return true
    // Model-created copies often omit/add one member of a larger roster.
    return samePersona && Math.min(wanted.size, existing.size) >= 4
      && Math.abs(wanted.size - existing.size) === 1 && shared === Math.min(wanted.size, existing.size)
  })
  return matches.sort((a, b) => {
    const age = (thread: PocketConversation) => { const at = Date.parse(thread.createdAt); return Number.isFinite(at) ? at : Number.MAX_SAFE_INTEGER }
    return age(a) - age(b) || state.conversations.indexOf(a) - state.conversations.indexOf(b)
  })[0]
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
  const existing = state.conversations.find((conversation) => conversation.kind === 'direct' && conversation.channel !== 'dating' && conversation.includesPocketPersona !== false && canonicalActorId(state, conversationActorIds(conversation)[0]) === canonicalActorId(state, actorId))
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
  const wanted = [leftActorId, rightActorId].map(id => canonicalActorId(state, id)).sort()
  if (wanted[0] === wanted[1]) throw new Error('An external conversation needs two distinct actors.')
  const existing = state.conversations.find((conversation) =>
    conversation.kind === 'direct'
    && conversation.includesPocketPersona === false
    && conversation.channel !== 'dating'
    && conversationActorIds(conversation).map(id => canonicalActorId(state, id)).sort().join('\u0000') === wanted.join('\u0000')
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
    messagingPolicy: { remoteEligible: true, ambientEnabled: false, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' },
    messagingStyle: { talkativeness: actor.relationship === 'close' ? 58 : 42, fragmentation: 35 },
    createdAt: actor.discovered?.firstSeenAt || now,
    updatedAt: actor.discovered?.lastSeenAt || now,
  }
}

export function promoteDiscoveredActor(state: PhoneState, actorId: string, now: string, makeId: (prefix: string) => string): PocketContact {
  const actor = state.discoveredActors.find((entry) => entry.id === actorId)
  if (!actor) throw new Error('That discovered actor no longer exists.')
  const existing = (actor.promotedContactId ? state.contacts.find((entry) => entry.id === actor.promotedContactId) : undefined)
    || uniqueIdentityMatch(actor.displayName, state.contacts, entry => [entry.name, ...(entry.aliases || [])])
  if (existing) {
    actor.promotedContactId = existing.id
    actor.lastSeenAt = now
    for (const conversation of state.conversations) {
      if (conversationActorIds(conversation).includes(actor.id) && !conversation.participantContactIds.includes(existing.id)) conversation.participantContactIds.push(existing.id)
    }
    return existing
  }
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
    messagingPolicy: { remoteEligible: true, ambientEnabled: false, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' },
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
