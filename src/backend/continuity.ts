import type {
  ConversationLocalReason,
  ConversationPauseReason,
  PhoneState,
  PocketContact,
  PocketConversation,
  PocketConversationSnapshot,
  PocketRelay,
  PocketReplyDecision,
  ReplyDecisionAction,
} from '../types.js'

const PAUSE_REASONS = new Set<ConversationPauseReason>(['ended', 'busy', 'away', 'sleeping', 'unknown'])
const LOCAL_REASONS = new Set<ConversationLocalReason>(['in_scene', 'arrived', 'took_action', 'continued_in_person'])

function compact(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

export function conversationSnapshot(conversation: PocketConversation, createdAt: string): PocketConversationSnapshot {
  const recent = conversation.messages.slice(-6)
  return {
    summary: recent.map((message) => `${message.senderName}: ${compact(message.text, 360)}`).join('\n').slice(0, 2_400),
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

export function pendingRelayContext(state: PhoneState): string {
  const pending = state.relays.filter((relay) => relay.status === 'pending').slice(-3)
  if (!pending.length) return ''
  return pending.map((relay) => {
    const contact = state.contacts.find((entry) => entry.id === relay.contactId)
    return [
      'POCKET CONTINUITY RELAY (newer than older scene summaries)',
      `Actor: ${contact?.name || relay.contactId}`,
      `Channel transition: phone -> in-person (${relay.reason})`,
      `Latest exchange:\n${relay.latestExchange}`,
      `Conversation snapshot:\n${relay.conversationSnapshot.summary}`,
      'Continue the physical roleplay from this handoff. Do not generate another remote phone reply unless the user explicitly texts from the scene.',
      `Relay provenance: ${relay.id}`,
    ].join('\n')
  }).join('\n\n')
}

export function relayLatestExchange(conversation: PocketConversation): string {
  return conversation.messages.slice(-3).map((message) => `${message.senderName}: ${compact(message.text, 520)}`).join('\n').slice(0, 1_800)
}

export function relayForGeneration(state: PhoneState, generationId: string): PocketRelay | undefined {
  return state.relays.find((relay) => relay.status === 'pending' && relay.continuation.generationId === generationId)
}
