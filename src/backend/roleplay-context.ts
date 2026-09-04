import type { DevicePreferences, PhoneState, PocketContact, PocketContextDiagnostics, PocketConversation } from '../types.js'

export type HostMessage = { id?: unknown; index_in_chat?: unknown; revision?: unknown; role?: unknown; content?: unknown }

const BUDGETS = { actor: 1_200, scene: 1_800, thread: 6_000, recent: 3_200, story: 2_400, total: 10_500 } as const

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function messageIndex(message: HostMessage, fallback: number): number {
  const parsed = Number(message.index_in_chat)
  return Number.isFinite(parsed) ? parsed : fallback
}

function storyLines(state: PhoneState, contact: PocketContact): string[] {
  const name = contact.name.toLocaleLowerCase()
  const events = state.events.filter((event) => !event.completed && `${event.title} ${event.description}`.toLocaleLowerCase().includes(name)).slice(0, 3)
  const trackers = state.trackers.filter((tracker) => tracker.visibleToModel && (`${tracker.target.id} ${tracker.target.label}`.includes(contact.id) || `${tracker.target.label}`.toLocaleLowerCase().includes(name))).slice(0, 4)
  const notes = state.notes.filter((note) => note.pinned).slice(0, 2)
  return [
    `Roleplay time: ${state.roleplayNow}`,
    `Scene: ${state.weather.location}; ${state.weather.condition}.`,
    ...events.map((entry) => `Timeline: ${entry.whenText}: ${entry.title}`),
    ...trackers.map((entry) => `Tracker: ${entry.label}=${entry.kind === 'state' ? entry.state : entry.value}`),
    ...notes.map((entry) => `Pinned note: ${entry.title}: ${entry.body.slice(0, 180)}`),
  ]
}

function sceneLines(state: PhoneState): string[] {
  const snapshot = state.sceneSnapshot
  if (!snapshot) return []
  return snapshot.actors.slice(0, 8).map((actor) => {
    const contact = state.contacts.find((entry) => entry.id === actor.contactId)
    return `${contact?.name || actor.contactId}${actor.roleHint ? ` (${actor.roleHint})` : ''}${actor.sceneBrief ? ` — ${actor.sceneBrief}` : ''}`
  })
}

function participantActorIds(conversation: PocketConversation): string[] {
  return conversation.participantActorIds?.length ? conversation.participantActorIds : conversation.participantContactIds
}
function actorDisplayName(state: PhoneState, actorId: string): string {
  const direct = state.contacts.find((entry) => entry.id === actorId)
  if (direct) return direct.name
  const discovered = state.discoveredActors?.find((entry) => entry.id === actorId)
  if (!discovered) return actorId
  const promoted = discovered.promotedContactId ? state.contacts.find((entry) => entry.id === discovered.promotedContactId) : undefined
  return promoted?.name || discovered.displayName
}
function currentChannelLines(state: PhoneState, contact: PocketContact, conversation: PocketConversation): string[] {
  const persona = state.pocketPersona.displayName?.trim() || 'You'
  const actorIds = participantActorIds(conversation)
  const actorNames = actorIds.map((actorId) => actorDisplayName(state, actorId)).filter(Boolean)
  if (conversation.kind === 'direct') {
    const other = actorNames[0] || contact.name || conversation.title || 'the contact'
    return [
      'TYPE: DIRECT MESSAGE',
      `PERSONA / PHONE OWNER / RECIPIENT: ${persona}`,
      `CONTACT / GENERATED SPEAKER: ${contact.name}`,
      `DM PARTICIPANTS: ${persona}, ${other}`,
      `TARGET LOCK: ${contact.name} is writing this phone message TO ${persona}. ${persona} is the current interlocutor and recipient.`,
      `This private DM belongs only to ${persona} and ${other}.`,
      'The active roleplay character, scene focal actor, recently mentioned actor, or actor from another phone thread is NOT the recipient merely because they are salient.',
      'Other actors may be discussed as third parties. Do not address them as though they can read this DM.',
      `Never replace ${persona} as the recipient unless the channel itself changes.`,
    ]
  }
  return [
    'TYPE: GROUP CHAT',
    `PERSONA / PHONE OWNER: ${persona}`,
    `CURRENT GROUP ACTORS: ${actorNames.join(', ') || '(none)'}`,
    `CURRENT CHANNEL MEMBERS: ${[persona, ...actorNames].join(', ')}`,
    'TARGET LOCK: generated group messages are visible only to the CURRENT CHANNEL MEMBERS listed above.',
    'Messages from actors who have since left the group remain historical context only; they are not current participants, recipients, or eligible speakers.',
    'A former/absent actor may be discussed as a third party, but must not be directly addressed as though they can read this group chat.',
    'Actors mentioned only in scene, story, recent roleplay, another phone conversation, or message text do not become group members.',
  ]
}
function threadLine(state: PhoneState, conversation: PocketConversation, message: PocketConversation['messages'][number]): string {
  const persona = state.pocketPersona.displayName || 'You'
  const sender = message.sender === 'persona' ? persona : message.senderName || 'Pocket'
  if (conversation.kind !== 'group' || message.sender !== 'contact') return `${sender}: ${clean(message.text, 520)}`
  const currentIds = new Set([...participantActorIds(conversation), ...conversation.participantContactIds])
  const senderId = message.senderActorId || message.senderContactId || ''
  const former = Boolean(senderId && !currentIds.has(senderId))
  return `${sender}${former ? ' [former participant; historical only]' : ''}: ${clean(message.text, 520)}`
}
function trimBlock(lines: string[], budget: number): string { return lines.filter(Boolean).join('\n').slice(0, budget) }

export async function assemblePocketContext(options: {
  state: PhoneState
  contact: PocketContact
  conversation: PocketConversation
  preferences: DevicePreferences
  actorIdentity?: string
  getMessages?: () => Promise<HostMessage[]>
  includePhoneThread?: boolean
  includeRoleplayBackground?: boolean
}): Promise<{ text: string; diagnostics: PocketContextDiagnostics }> {
  const { state, contact, conversation, preferences } = options
  const mode = preferences.roleplayContextMode
  const includeRoleplayBackground = options.includeRoleplayBackground !== false
  const hostMessages = includeRoleplayBackground && options.getMessages ? await options.getMessages().catch(() => []) : []
  const authoritative = hostMessages.at(-1)
  const authoritativeLatest = authoritative ? {
    id: clean(authoritative.id, 180), index: messageIndex(authoritative, hostMessages.length - 1), excerpt: clean(authoritative.content, 180),
  } : { id: '', index: -1, excerpt: '' }
  const actorIdentity = clean(options.actorIdentity || contact.identityBrief || contact.description, BUDGETS.actor)
  const channel = trimBlock(currentChannelLines(state, contact, conversation), 1_400)
  // Structured Pocket state remains usable even when raw host narrative is isolated.
  const scene = trimBlock(sceneLines(state), BUDGETS.scene)
  const includePhoneThread = options.includePhoneThread !== false
  const threadLines = includePhoneThread ? conversation.messages.slice(-20).map((message) => threadLine(state, conversation, message)) : []
  const thread = trimBlock(threadLines, BUDGETS.thread)
  const wantsRecent = includeRoleplayBackground && (mode === 'recent' || (mode === 'smart' && (conversation.messages.length > 0 || contact.presence.inScene || Boolean(contact.sceneNote))))
  const selectedRecent = mode !== 'off' && wantsRecent && preferences.recentRoleplayMessages > 0 ? hostMessages.slice(-preferences.recentRoleplayMessages) : []
  const recentLines = selectedRecent.map((message, index) => {
    const role = message.role === 'user'
      ? `Pocket Persona (${state.pocketPersona.displayName?.trim() || 'You'})`
      : message.role === 'assistant'
        ? `Active RP Character (${state.characterName || 'Character'})`
        : 'System'
    const anchor = clean(message.id, 180)
    const source = anchor ? ` [${anchor} #${messageIndex(message, hostMessages.length - selectedRecent.length + index)}]` : ''
    return `${role}${source}: ${clean(message.content, 520)}`
  }).filter((line) => !line.endsWith(': '))
  const recent = trimBlock(recentLines, BUDGETS.recent)
  const includedMessage = selectedRecent.at(-1)
  const includedLatest = includedMessage ? {
    id: clean(includedMessage.id, 180), index: messageIndex(includedMessage, hostMessages.length - 1), excerpt: clean(includedMessage.content, 180),
  } : { id: '', index: -1, excerpt: '' }
  const storySource = mode !== 'off' && (mode === 'story' || mode === 'smart' || !includeRoleplayBackground) ? storyLines(state, contact) : []
  const story = trimBlock(storySource, BUDGETS.story)
  const parts = [
    actorIdentity ? `ACTOR IDENTITY\n${actorIdentity}` : '',
    scene ? `SCENE SNAPSHOT${state.sceneSnapshot?.stale ? ' (STALE)' : ''}\n${scene}` : '',
    recent ? `RECENT ROLEPLAY BACKGROUND — NOT PHONE CHANNEL\n${recent}` : '',
    story ? `STORY CONTEXT\n${story}` : '',
    thread ? `PHONE THREAD\n${thread}` : '',
  ].filter(Boolean)
  const bodyText = mode === 'off'
    ? [actorIdentity ? `ACTOR IDENTITY\n${actorIdentity}` : '', thread ? `PHONE THREAD\n${thread}` : ''].filter(Boolean).join('\n\n')
    : parts.join('\n\n')
  const finalLock = channel ? `FINAL CHANNEL LOCK\n${channel}` : ''
  const bodyBudget = Math.max(0, BUDGETS.total - finalLock.length - (finalLock ? 2 : 0))
  const finalText = [bodyText.slice(0, bodyBudget), finalLock].filter(Boolean).join('\n\n')
  const latestMismatch = Boolean(authoritativeLatest.id && (!includedLatest.id || authoritativeLatest.id !== includedLatest.id))
  const freshnessWarning = mode === 'story' || mode === 'off' || !wantsRecent ? '' : latestMismatch
    ? 'The latest committed roleplay message is not included in the selected recent-context window.' : ''
  return {
    text: finalText,
    diagnostics: {
      mode,
      actorIdentityChars: actorIdentity.length,
      sceneSnapshot: { stale: state.sceneSnapshot?.stale ?? true, capturedAt: state.sceneSnapshot?.capturedAt || '', sourceMessageId: state.sceneSnapshot?.sourceMessageId || '', sourceMessageIndex: state.sceneSnapshot?.sourceMessageIndex ?? -1, chars: scene.length },
      phoneThread: { count: threadLines.length, chars: thread.length, budget: BUDGETS.thread },
      recentRoleplay: { count: recentLines.length, chars: recent.length, budget: BUDGETS.recent, latestMessageId: includedLatest.id },
      story: { count: storySource.length, chars: story.length, budget: BUDGETS.story },
      totalChars: finalText.length,
      estimatedTokens: Math.ceil(finalText.length / 4),
      authoritativeLatest,
      includedLatest,
      freshnessWarning,
      assembled: finalText,
    },
  }
}

export async function buildRoleplayContext(options: Parameters<typeof assemblePocketContext>[0]): Promise<string> {
  return (await assemblePocketContext(options)).text
}
