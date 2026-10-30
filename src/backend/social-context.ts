import type { PhoneState, PocketContact } from '../types.js'
import type { SocialAccount, SocialGuestCard } from '../domain/social.js'
import { socialDirectApp, type SocialDirectMessage, type SocialDirectThread, type SocialDmApp } from '../domain/social-dms.js'
import { SOCIAL_NAMES } from '../domain/social.js'
import { actorPhoneMemoryContext, normalizeActorMemories, upsertActorMemory } from '../domain/actor-memory.js'
import { conversationDeviceActorIds, messageSenderActorId, pocketPersonaActorId } from '../domain/device.js'

export type SocialContextAudience = 'private' | 'public'
export interface SocialKnownProfile extends SocialGuestCard { identityBrief?: string; textingStyle?: string }
export interface SocialKnownContext {
  accountId: string
  name: string
  actorIds: string[]
  profile: { role: string; identity: string; personality: string; textingStyle: string }
  continuity: string
  phoneMemory?: string
  directHistory?: Array<{ speaker: string; text: string }>
}
const clean = (value: unknown, max = 500): string => typeof value === 'string' ? value.trim().slice(0, max) : ''

/** Stable profile sources keep memory linked when a card/Bank person gains a local Contact. */
export function socialContactMemoryIds(contact: PocketContact, actorId?: string): string[] {
  return [...new Set([
    actorId, contact.id,
    contact.source?.kind === 'character' ? `card:${contact.source.characterId}` : undefined,
    contact.source?.kind === 'npc' && contact.source.bankId ? `bank:${contact.source.bankId}` : undefined,
    contact.source?.kind === 'npc' ? contact.source.discoveredActorId : undefined,
  ].filter((id): id is string => Boolean(id))) ]
}

/** Stable source links identify a familiar person. A stranger's matching display name does not. */
function knownIdentity(state: PhoneState, account: SocialAccount, profile?: SocialKnownProfile) {
  const contacts = state.contacts || [], discovered = state.discoveredActors || []
  let contact: PocketContact | undefined
  const ids = new Set<string>()
  const bindActor = (actorId?: string) => {
    if (!actorId || actorId === pocketPersonaActorId(state)) return
    const actor = discovered.find(actor => actor.id === actorId)
    const linked = contacts.find(contact => contact.id === actorId || contact.id === actor?.promotedContactId)
    if (!actor && !linked) return
    ids.add(actorId); contact ||= linked
  }
  bindActor(account.actorId); bindActor(profile?.actorId)
  contact ||= contacts.find(contact => (account.bankId && contact.source?.kind === 'npc' && contact.source.bankId === account.bankId)
    || (account.cardId && contact.source?.kind === 'character' && contact.source.characterId === account.cardId))
  if (contact) {
    for (const id of socialContactMemoryIds(contact)) ids.add(id)
    for (const actor of discovered) if (actor.promotedContactId === contact.id) ids.add(actor.id)
    if (contact.source?.kind === 'npc' && contact.source.discoveredActorId) ids.add(contact.source.discoveredActorId)
  }
  if (account.bankId) ids.add(`bank:${account.bankId}`)
  if (account.cardId) ids.add(`card:${account.cardId}`)
  if (!ids.size) return null
  const actor = discovered.find(actor => ids.has(actor.id))
  const name = clean(contact?.name || actor?.displayName || profile?.name || account.name, 100)
  return { ids: [...ids], contact, name, names: contact || actor ? [...new Set([name, contact?.name, actor?.displayName].filter((name): name is string => Boolean(name)))] : [] }
}

/** Use the same actor-memory store as Messages, with explicit public/private projection. */
export function buildSocialKnownContext(state: PhoneState, account: SocialAccount, owner: string, options: {
  profile?: SocialKnownProfile; continuity?: string; audience?: SocialContextAudience; app?: SocialDmApp
} = {}): SocialKnownContext | null {
  const identity = knownIdentity(state, account, options.profile)
  if (!identity) return null
  const privateView = options.audience !== 'public', contact = identity.contact, profile = options.profile
  const result: SocialKnownContext = {
    accountId: account.id, name: identity.name, actorIds: identity.ids,
    profile: {
      role: clean(contact?.role || profile?.role || account.bio, 160),
      identity: privateView ? clean([contact?.identityBrief || contact?.description || profile?.identityBrief, contact?.sceneNote].filter(Boolean).join('\n'), 900) : '',
      personality: clean(contact?.phoneProfile?.personality || profile?.personality, 420),
      textingStyle: clean(contact?.phoneProfile?.textingStyle || profile?.textingStyle, 420),
    },
    continuity: clean(options.continuity, 2800),
  }
  if (!privateView) return result
  const currentThread = state.social?.dmThreads?.find(thread => thread.owner === owner && thread.account.id === account.id && socialDirectApp(thread) === (options.app || 'instagram'))
  result.phoneMemory = actorPhoneMemoryContext(normalizeActorMemories(state.actorMemories), {
    actorIds: identity.ids, actorNames: identity.names, actorName: identity.name,
    excludeConversationId: currentThread ? `${socialDirectApp(currentThread)}:${currentThread.id}` : undefined, maxChars: 2400,
  })
  const knownIds = new Set(identity.ids)
  result.directHistory = (state.conversations || []).filter(conversation => {
    const participants = conversationDeviceActorIds(state, conversation)
    return conversation.kind === 'direct' && participants.includes(owner) && participants.some(id => knownIds.has(id))
  }).flatMap(conversation => (conversation.messages || []).filter(message => message.sender !== 'system' && message.candidateCommitState !== 'provisional')
    .slice(-10).map(message => ({ speaker: message.senderName || (messageSenderActorId(state, message) === owner ? 'Phone owner' : identity.name), text: clean(message.text, 600) })))
    .filter(message => message.text).slice(-12)
  return result
}

/** A DM becomes memory for its two participants, while remaining a separate app-specific private thread. */
export function rememberSocialDirectMessage(state: PhoneState, thread: SocialDirectThread, message: SocialDirectMessage): void {
  const identity = knownIdentity(state, thread.account)
  if (!identity) return
  const ownerName = thread.owner === pocketPersonaActorId(state) ? state.pocketPersona?.displayName || 'You'
    : state.contacts?.find(contact => contact.id === thread.owner)?.name || state.discoveredActors?.find(actor => actor.id === thread.owner)?.displayName || 'Phone owner'
  state.actorMemories = upsertActorMemory(normalizeActorMemories(state.actorMemories), {
    id: `memory:${message.id}`, messageId: message.id, conversationId: `${socialDirectApp(thread)}:${thread.id}`,
    conversationTitle: `${SOCIAL_NAMES[socialDirectApp(thread)]} · ${ownerName} & ${identity.name}`, conversationKind: 'direct',
    speakerActorId: message.sender === 'owner' ? thread.owner : identity.ids[0],
    speakerName: message.sender === 'owner' ? ownerName : identity.name, text: message.text,
    knownByActorIds: [...new Set([thread.owner, ...identity.ids])],
    knownByNames: [], createdAt: message.createdAt,
  })
}
