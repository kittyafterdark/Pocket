import type {
  ConversationLocalReason,
  ConversationPauseReason,
  PhoneState,
  PocketContact,
  PocketConversation,
  PocketConversationTailSnapshot,
  PocketRelay,
  PocketReplyDecision,
  ReplyDecisionAction,
} from '../types.js'

const PAUSE_REASONS = new Set<ConversationPauseReason>(['ended', 'busy', 'away', 'sleeping', 'unknown'])
const LOCAL_REASONS = new Set<ConversationLocalReason>(['in_scene', 'arrived', 'took_action', 'continued_in_person'])

function compact(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

export function conversationTailSnapshot(conversation: PocketConversation, createdAt: string): PocketConversationTailSnapshot {
  const recent = conversation.messages.slice(-6)
  return {
    text: recent.map((message) => `${message.senderName}: ${compact(message.text, 360)}`).join('\n').slice(0, 2_400),
    recentMessageIds: recent.map((message) => message.id),
    updatedAt: createdAt,
  }
}

export function normalizeReplyDecision(input: {
  rawAction: unknown
  rawReason?: unknown
  contact: PocketContact
  conversation: PocketConversation
  explicitRemoteOverride: boolean
  createdAt: string
  burstId?: string
}): PocketReplyDecision {
  const candidate = String(input.rawAction || '').toLowerCase()
  const rawAction: ReplyDecisionAction = candidate === 'reply' || candidate === 'pause' || candidate === 'handoff' ? candidate : 'none'
  const rawReason = String(input.rawReason || '').toLowerCase()
  const impossibleRemote = !input.explicitRemoteOverride && (input.contact.presence.inScene || input.conversation.availability.state === 'local')
  if (impossibleRemote) {
    return {
      rawAction,
      normalizedAction: 'handoff',
      reason: LOCAL_REASONS.has(rawReason as ConversationLocalReason) ? rawReason : input.contact.presence.inScene ? 'in_scene' : 'continued_in_person',
      normalizationReason: rawAction === 'handoff' ? 'deterministic_local_channel' : `normalized_${rawAction}_because_actor_is_local`,
      contactInScene: input.contact.presence.inScene,
      remoteEligible: input.contact.messagingPolicy.remoteEligible,
      explicitRemoteOverride: false,
      createdAt: input.createdAt,
      burstId: input.burstId,
    }
  }
  if (rawAction === 'pause') {
    return {
      rawAction, normalizedAction: 'pause', reason: PAUSE_REASONS.has(rawReason as ConversationPauseReason) ? rawReason : 'unknown',
      normalizationReason: '', contactInScene: input.contact.presence.inScene, remoteEligible: input.contact.messagingPolicy.remoteEligible,
      explicitRemoteOverride: input.explicitRemoteOverride, createdAt: input.createdAt, burstId: input.burstId,
    }
  }
  if (rawAction === 'handoff') {
    return {
      rawAction, normalizedAction: 'handoff', reason: rawReason === 'arriving' ? 'arriving' : LOCAL_REASONS.has(rawReason as ConversationLocalReason) ? rawReason : 'continued_in_person',
      normalizationReason: '', contactInScene: input.contact.presence.inScene, remoteEligible: input.contact.messagingPolicy.remoteEligible,
      explicitRemoteOverride: input.explicitRemoteOverride, createdAt: input.createdAt, burstId: input.burstId,
    }
  }
  return {
    rawAction, normalizedAction: rawAction, reason: '', normalizationReason: '',
    contactInScene: input.contact.presence.inScene, remoteEligible: input.contact.messagingPolicy.remoteEligible,
    explicitRemoteOverride: input.explicitRemoteOverride, createdAt: input.createdAt, burstId: input.burstId,
  }
}

export function pendingRelayContext(state: PhoneState, options: { relayId?: string; maxChars?: number } = {}): string {
  const maxChars = Math.max(600, Math.min(6_000, options.maxChars || 3_600))
  const pending = options.relayId
    ? state.relays.filter((relay) => relay.status === 'pending' && relay.id === options.relayId).slice(-1)
    : []
  if (!pending.length) return ''
  return pending.map((relay) => {
    const contact = state.contacts.find((entry) => entry.id === relay.contactId)
    const actorName = contact?.name || relay.contactId
    const personaName = state.pocketPersona.displayName || 'the current Persona'
    const physicalState = relay.reason === 'arrived' || relay.reason === 'in_scene'
      ? `${actorName} is now physically present in the current scene.`
      : `${actorName} has moved the interaction from the phone into the physical scene.`
    return [
      '=== POCKET CONTINUITY RELAY — NEWER STATE ===',
      `relayId: ${relay.id}`,
      `actor: ${actorName}`,
      'transition: remote -> local',
      `reason: ${relay.reason}`,
      '',
      `${actorName} and ${personaName} were texting immediately before this generation. ${physicalState} This information is newer than older roleplay scene state and supersedes conflicting location or presence information.`,
      '',
      `Immediate phone exchange:\n${relay.conversationTail.text}`,
      '',
      'Continue the physical roleplay from this handoff. Do not generate another remote phone reply unless the user explicitly texts from the scene.',
      '=== END POCKET CONTINUITY RELAY ===',
    ].join('\n')
  }).join('\n\n').slice(0, maxChars)
}

export function persistentHandoffContext(
  state: PhoneState,
  options: { maxChars?: number } = {},
): string {
  const maxChars = Math.max(700, Math.min(4_000, options.maxChars || 2_600))
  const relay = [...state.relays].reverse().find((entry) =>
    entry.status === 'consumed'
    && entry.continuation.state === 'completed'
    && Boolean(entry.conversationTail.text.trim())
  )
  if (!relay) return ''

  const contact = state.contacts.find((entry) => entry.id === relay.contactId)
  const actorName = contact?.name || relay.contactId
  const personaName = state.pocketPersona.displayName || 'the current Persona'
  const exchange = relay.conversationTail.text.trim()

  return [
    '=== POCKET HANDOFF MEMORY — ESTABLISHED SHARED HISTORY ===',
    `sourceRelayId: ${relay.id}`,
    `participants: ${actorName} + ${personaName}`,
    '',
    `The following phone exchange happened immediately before a prior transition into the physical scene. It is no longer a live phone channel, but it remains established shared history between ${actorName} and ${personaName}.`,
    'Both participants may remember and act on what was directly said here on later roleplay turns.',
    'Do not make either participant forget this exchange merely because the one-shot handoff relay has already been consumed.',
    'The current roleplay transcript is newer authority for present location, timing, and physical actions. Transitional statements such as “ten minutes away” are historical once the scene has advanced.',
    '',
    `Persisted handoff exchange:\n${exchange}`,
    '',
    'This block preserves prior knowledge and conversation history only. Do not replay, resend, or re-enact these phone messages as new messages.',
    '=== END POCKET HANDOFF MEMORY ===',
  ].join('\n').slice(0, maxChars)
}

export function relayIdFromMessages(messages: ReadonlyArray<Record<string, unknown>>): string {
  for (const message of [...messages].reverse()) {
    const metadata = message.sourceMessageMetadata || message.__sourceMessageMetadata
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) continue
    const value = metadata as Record<string, unknown>
    if (value.pocketContinuation !== true || typeof value.pocketRelayId !== 'string') continue
    return value.pocketRelayId.slice(0, 180)
  }
  return ''
}

export function relayLatestExchange(conversation: PocketConversation): string {
  return conversation.messages.slice(-3).map((message) => `${message.senderName}: ${compact(message.text, 520)}`).join('\n').slice(0, 1_800)
}

export function relayForGeneration(state: PhoneState, generationId: string): PocketRelay | undefined {
  return state.relays.find((relay) => relay.status === 'pending' && relay.continuation.generationId === generationId)
}
