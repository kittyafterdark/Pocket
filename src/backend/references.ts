import type {
  PhoneState,
  PocketContextReference,
  PocketConversation,
  PocketReferenceMessage,
  PocketReferenceScope,
} from '../types.js'
import { resolvePocketActor } from '../domain/actors.js'
import { conversationDeviceActorIds } from '../domain/device.js'

function compact(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max)
}

function availabilityCopy(conversation: PocketConversation): string {
  if (conversation.availability.state === 'local') return 'The direct conversation is currently local, but this reference itself does not establish anyone’s presence.'
  if (conversation.availability.state === 'arriving') return 'The conversation says a participant is arriving; only explicit scene state may establish physical presence.'
  if (conversation.availability.state === 'paused') return `The remote conversation is paused (${conversation.availability.reason}).`
  return 'This is a remote phone conversation.'
}

export function createPocketReference(input: {
  state: PhoneState
  conversation: PocketConversation
  scope: PocketReferenceScope
  selectedMessageIds?: string[]
  createdAt: string
  makeId: (prefix: string) => string
}): PocketContextReference {
  const { state, conversation, scope, createdAt, makeId } = input
  const selected = new Set((input.selectedMessageIds || []).slice(0, 12))
  const sourceMessages = scope === 'selected_messages'
    ? conversation.messages.filter((message) => selected.has(message.id)).slice(-8)
    : conversation.messages.slice(scope === 'recent_messages' ? -6 : -8)
  const messages: PocketReferenceMessage[] = sourceMessages.flatMap((message) => message.sender === 'system' ? [] : [{
    messageId: message.id,
    sender: message.sender,
    senderActorId: message.senderActorId,
    senderContactId: message.senderContactId,
    senderName: compact(message.senderName || (message.sender === 'persona' ? state.pocketPersona.displayName : 'Participant'), 120),
    text: compact(message.text, 420),
    createdAt: message.createdAt,
  }])
  const participants = conversationDeviceActorIds(state, conversation).slice(0, 16).flatMap((actorId) => {
    const actor = resolvePocketActor(state, actorId)
    if (!actor) return []
    return [{
      actorId,
      contactId: actor.contact?.id,
      name: compact(actor.name, 120),
      role: compact(actor.role, 100),
      identityBrief: compact(actor.identityBrief, 180),
    }]
  })
  const kind = conversation.kind === 'group' ? 'Group chat' : 'Direct message'
  const participantNames = participants.map((entry) => entry.name).join(', ') || 'Unknown participants'
  return {
    id: makeId('reference'),
    chatId: state.chatId,
    characterId: state.characterId,
    sourceApp: 'messages',
    conversationId: conversation.id,
    conversationTitle: compact(conversation.title || participantNames, 120) || 'Pocket conversation',
    conversationKind: conversation.kind,
    scope,
    visibility: 'context',
    participants,
    snapshot: compact(`${kind} with ${participantNames}. ${availabilityCopy(conversation)}`, 600),
    messages,
    createdAt,
    status: 'armed',
  }
}

export function serializePocketReference(reference: PocketContextReference, maxChars = 2_200): string {
  const budget = Math.max(1_200, Math.min(3_000, maxChars))
  const participantNames = compact(reference.participants.map((entry) => entry.name).join(', '), 360) || 'Unknown participants'
  const identityRows = reference.participants.slice(0, 8).map((entry) => {
    const detail = [entry.role, entry.identityBrief].filter(Boolean).join(' — ')
    return detail ? `- ${entry.name}: ${detail}` : `- ${entry.name}`
  })
  const messageRows = reference.messages.map((message) => `${message.senderName}: ${JSON.stringify(compact(message.text, 360))}`)
  const fixedStart = [
    '=== POCKET USER REFERENCE — THIS TURN ===',
    `referenceId: ${reference.id}`,
    `source: messages/${reference.conversationId}`,
    `scope: ${reference.scope}`,
    `Conversation: ${reference.conversationTitle}`,
    `Participants: ${participantNames}`,
    '',
    `Pocket context: ${compact(reference.snapshot, 320)}`,
  ]
  const fixedEnd = [
    '',
    'This is phone/social context explicitly attached by the user for this roleplay turn. It does not hand off the conversation, change channel ownership, or establish that any participant is physically present.',
    'Use it only to understand the user’s roleplay message. Do not assume a scene actor saw, heard, or knows the phone content unless the user’s narration establishes that.',
    '=== END POCKET USER REFERENCE ===',
  ]
  const render = () => [
    ...fixedStart,
    ...(identityRows.length ? ['', 'Participant context:', ...identityRows] : []),
    '',
    'Referenced phone messages:',
    ...messageRows,
    ...fixedEnd,
  ].join('\n')
  let serialized = render()
  while (serialized.length > budget && identityRows.length > 2) {
    identityRows.pop()
    serialized = render()
  }
  while (serialized.length > budget && messageRows.length > 1) {
    messageRows.shift()
    serialized = render()
  }
  if (serialized.length <= budget) return serialized
  const ending = `\n${fixedEnd.join('\n')}`
  const beginning = [...fixedStart, '', 'Referenced phone messages:', messageRows.at(-1) || '(No referenced message text was available.)'].join('\n')
  return `${beginning.slice(0, Math.max(0, budget - ending.length)).trimEnd()}${ending}`
}

export function referenceForGeneration(state: PhoneState, generationId: string): PocketContextReference | undefined {
  return state.references.find((reference) => reference.status === 'injected' && reference.injectedGenerationId === generationId)
}

export function latestArmedReference(state: PhoneState): PocketContextReference | undefined {
  return [...state.references].reverse().find((reference) => reference.status === 'armed')
}
