import type { CalendarEvent, PhoneMessage, PhoneState, PocketConversation, PocketRoleplayClockSnapshot } from '../types.js'
import { clockLabel } from './clock-label.js'

const clean = (value: unknown, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const validStamp = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))

/** Persist precision with the message rather than retroactively applying today's clock. */
export function normalizeMessageStoryClock(raw: unknown): PocketRoleplayClockSnapshot | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
  const value = raw as Record<string, unknown>
  if (!['manual', 'narrative', 'legacy'].includes(String(value.source))) return
  const precision = ['exact', 'approximate', 'relative', 'unknown'].includes(String(value.precision)) ? value.precision as PocketRoleplayClockSnapshot['precision'] : 'unknown'
  const roleplayNow = clean(value.roleplayNow, 80)
  if ((value.source === 'manual' || precision === 'exact') && !validStamp(roleplayNow)) return
  return { source: value.source as PocketRoleplayClockSnapshot['source'], precision, roleplayNow, label: clean(value.label, 100) }
}

interface StoryClock { kind: 'exact' | 'saved' | 'approximate' | 'unknown'; stamp?: string; day?: string; label: string }
function atOffset(state: PhoneState, stamp: string): Date {
  const raw = state.roleplayTimezoneOffsetMinutes
  const offset = typeof raw === 'number' && Number.isFinite(raw) && Math.abs(raw) <= 840 ? raw : 0
  return new Date(Date.parse(stamp) - offset * 60_000)
}
function clockInfo(state: PhoneState, snapshot: PocketRoleplayClockSnapshot | undefined): StoryClock {
  if (!snapshot) return { kind: 'unknown', label: 'Story time not recorded' }
  if ((snapshot.source === 'manual' || snapshot.precision === 'exact') && validStamp(snapshot.roleplayNow)) {
    const date = atOffset(state, snapshot.roleplayNow)
    return { kind: 'exact', stamp: snapshot.roleplayNow, day: date.toISOString().slice(0, 10), label: `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)}` }
  }
  const label = clockLabel(snapshot.label)
  return { kind: label ? 'approximate' : 'unknown', label: label ? `${label} (${snapshot.precision})` : 'Story time not recorded' }
}
function currentClock(state: PhoneState): StoryClock {
  return clockInfo(state, { roleplayNow: state.roleplayNow, source: state.roleplayClockSource || 'legacy', precision: state.roleplayClockPrecision || 'unknown', label: state.roleplayClockLabel || '' })
}
function messageClock(state: PhoneState, message: PhoneMessage): StoryClock {
  if (message.storyClock) return clockInfo(state, normalizeMessageStoryClock(message.storyClock))
  if (message.origin) {
    const snapshot = [...(state.candidateClocks || [])].reverse().find(clock => clock.hostMessageId === message.origin!.hostMessageId && clock.swipeId === message.origin!.swipeId)
    if (snapshot) return clockInfo(state, snapshot)
  }
  // Older Pocket versions saved story timestamps without the associated precision.
  // Keep that evidence labelled as a legacy record; never derive an elapsed duration from it.
  if (validStamp(message.createdAt)) {
    const date = atOffset(state, message.createdAt)
    return { kind: 'saved', stamp: message.createdAt, day: date.toISOString().slice(0, 10), label: `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)}` }
  }
  return { kind: 'unknown', label: 'Story time not recorded' }
}

export interface ConversationSceneBoundary { event: CalendarEvent; index: number; label: string; detail: string }
/** A scene receipt cuts over by message identity, including when every clock value is unchanged. */
export function conversationSceneBoundary(state: PhoneState, conversation: PocketConversation): ConversationSceneBoundary | undefined {
  const candidates = (state.events || []).flatMap(event => {
    const boundary = event.phoneHistoryBoundary
    if ((!event.startedAt && !event.completed) || boundary?.conversationId !== conversation.id) return []
    const ids = new Set(boundary.messageIds)
    const index = conversation.messages.reduce((last, message, index) => ids.has(message.id) ? index : last, -1)
    if (index < 0) return []
    return [{ event, index, label: event.completed ? `After ${clean(event.title, 72)}` : `${clean(event.title, 72)} · continued in roleplay`, detail: event.completed
      ? 'This event has been completed. Earlier planning messages are conversation history.'
      : 'This plan continued in roleplay. Earlier planning messages are conversation history; this receipt alone does not establish how the scene ended.' }]
  })
  return candidates.sort((a, b) => b.index - a.index || Date.parse(b.event.startedAt || '') - Date.parse(a.event.startedAt || ''))[0]
}

export function messageHistoryContextLabel(state: PhoneState, message: PhoneMessage, conversation?: PocketConversation): string {
  const clock = messageClock(state, message), now = currentClock(state)
  const boundary = conversation ? conversationSceneBoundary(state, conversation) : undefined
  const beforeScene = Boolean(boundary && conversation && conversation.messages.indexOf(message) >= 0 && conversation.messages.indexOf(message) <= boundary.index)
  const historical = beforeScene ? '; BEFORE ROLEPLAY EVENT — historical planning exchange, already handed off'
    : clock.day && now.day && clock.day < now.day ? '; EARLIER STORY DAY — historical exchange' : ''
  return clock.kind === 'saved'
    ? `Saved story timestamp: ${clock.label} (legacy clock precision not recorded)${historical}`
    : `Story time: ${clock.label}${historical}`
}

export interface MessageContinuityBoundary { label: string; detail: string }
/** A separator uses recorded story days, never wall-clock silence or guessed elapsed time. */
export function messageContinuityBoundary(state: PhoneState, previous: PhoneMessage, next?: PhoneMessage): MessageContinuityBoundary | undefined {
  const before = messageClock(state, previous), after = next ? messageClock(state, next) : currentClock(state)
  if (!before.day || !after.day || before.day === after.day) return
  if (before.kind === 'saved' || after.kind === 'saved') {
    // Legacy dates are displayable only when today's story clock is explicitly anchored.
    if (!currentClock(state).day) return
  }
  const day = new Date(after.day + 'T12:00:00Z')
  return {
    label: new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(day),
    detail: next ? 'A different story day. Earlier messages remain part of the conversation history.' : 'Current story day. Earlier messages are from a previous exchange.',
  }
}

/** Canonical state wins over old promises, while unfinished plans remain unfinished. */
export function conversationContinuityContext(state: PhoneState, conversation: PocketConversation, actorIds: readonly string[] = []): string {
  const ids = new Set([...actorIds, ...(conversation.participantActorIds || []), ...(conversation.participantContactIds || [])])
  const contacts = (state.contacts || []).filter(contact => ids.has(contact.id) || (state.discoveredActors || []).some(actor => ids.has(actor.id) && actor.promotedContactId === contact.id))
  const now = currentClock(state), messages = conversation.messages.filter(message => message.sender !== 'system' && message.candidateCommitState !== 'provisional')
  const sceneBoundary = conversationSceneBoundary(state, conversation)
  const currentMessages = sceneBoundary ? conversation.messages.slice(sceneBoundary.index + 1).filter(message => message.sender !== 'system' && message.candidateCommitState !== 'provisional') : messages
  const latest = currentMessages.at(-1), older = now.day ? [...messages].reverse().find(message => { const day = messageClock(state, message).day; return day && day < now.day! }) : undefined
  const lines = [
    'CURRENT CONVERSATION STATE — authoritative over historical message wording',
    `CURRENT STORY TIME: ${now.label}${now.kind === 'unknown' ? '; do not invent a date or elapsed duration' : ''}.`,
  ]
  const availability = conversation.availability, present = contacts.filter(contact => contact.presence?.inScene)
  if (present.length) {
    const names = present.slice(0, 2).map(contact => clean(contact.name, 48)).join(', ') + (present.length > 2 ? ` and ${present.length - 2} more` : '')
    lines.push(`CURRENT PRESENCE: ${names} ${present.length === 1 ? 'is' : 'are'} already here with the phone owner. Do not start a new approach.`)
  }
  if (availability?.state === 'local') lines.push(`CURRENT CHANNEL: continued in person (${clean(availability.reason, 30)}); its prior remote exchange already transitioned to roleplay.`)
  else if (availability?.state === 'arriving') lines.push('CURRENT CHANNEL: arriving is still recorded. An arrival bridge alone does not confirm arrival.')
  else if (availability?.state === 'paused') lines.push(`CURRENT CHANNEL: paused (${clean(availability.reason, 30)}).`)
  else lines.push('CURRENT CHANNEL: remote. This neither erases an earlier in-person transition nor implies a new trip.')
  if (older) {
    const old = messageClock(state, older)
    if (old.kind === 'exact' && now.kind === 'exact') {
      const days = Math.round((Date.parse(now.day! + 'T00:00:00Z') - Date.parse(old.day! + 'T00:00:00Z')) / 86_400_000)
      lines.push(`The story calendar advanced ${days} day${days === 1 ? '' : 's'} since that earlier exchange (${old.day} → ${now.day}).`)
    } else lines.push(`Earlier saved exchange: ${old.day}; current story day: ${now.day}. Legacy precision is unknown; no exact elapsed duration is inferred.`)
    lines.push('Earlier countdowns (“in 20 minutes”, “tonight”, “on my way”) belong to that exchange; reassess current state rather than restart them today.')
  }
  if (sceneBoundary) {
    lines.push(`EVENT PHONE BOUNDARY: ${clean(sceneBoundary.event.title, 72)}. The planning exchange through message ${clean(conversation.messages[sceneBoundary.index].id, 80)} was handed into roleplay. It is historical even on the same story day.`)
    lines.push('Do not resume or clarify old ETAs, promise the same arrival again, or replay pre-event logistics. Later phone messages that conflict with this recorded transition are continuity mistakes, not evidence that the scene reset.')
    if (!currentMessages.some(message => message.sender === 'persona')) lines.push('No new human phone message is recorded after this event boundary. Reopen from the current roleplay state instead of answering the old scheduling exchange.')
  }
  // Each category has a reserved, bounded slot. Long history cannot push out the current message or state.
  if (latest) {
    const clock = messageClock(state, latest), oldDay = Boolean(clock.day && now.day && clock.day < now.day)
    lines.push(oldDay ? 'No new message from the current story day is recorded. Reopen from current continuity, without reenacting the last exchange.'
      : `LATEST PHONE MESSAGE (${clean(latest.senderName || (latest.sender === 'persona' ? 'Phone owner' : contacts[0]?.name || 'Contact'), 48)}): ${clean(latest.text, 220)}`)
  }
  const relays = (state.relays || []).filter(relay => relay.conversationId === conversation.id).reverse()
  const consumed = relays.find(relay => relay.status === 'consumed'), pending = relays.find(relay => relay.status === 'pending')
  if (consumed) lines.push(consumed.kind === 'arrival'
    ? 'CONSUMED ARRIVAL BRIDGE: context was delivered to roleplay. Do not issue it again; this receipt alone does not prove arrival. Use current presence and channel state.'
    : `COMPLETED HANDOFF: this exchange already continued in roleplay (${clean(consumed.actorState, 30)}). Do not repeat its action or treat its old approach as pending.`)
  if (pending) lines.push(`PENDING ${pending.kind === 'arrival' ? 'ARRIVAL BRIDGE' : 'HANDOFF'}: still pending in canonical state; do not claim it was consumed.`)
  const events = (state.events || []).filter(event => event.source?.conversationId === conversation.id
    || (event.participantActorIds || []).some(id => ids.has(id)) || (event.actorContactIds || []).some(id => ids.has(id))).reverse()
  for (const phase of ['completed', 'started', 'open'] as const) {
    const event = events.find(event => phase === 'completed' ? event.completed : phase === 'started' ? !event.completed && event.startedAt : !event.completed && !event.startedAt)
    if (event) lines.push(`${phase.toUpperCase()} TIMELINE: ${clean(event.title, 72)}${event.whenText ? ` — ${clean(event.whenText, 48)}` : ''}${phase === 'completed' ? '; already performed/resolved, not a new pending instruction.' : phase === 'started' ? '; already handed into roleplay, not an upcoming invitation. Do not promise or reschedule the same arrival. Current scene evidence determines whether it is still unfolding or has ended; starting alone does not prove completion.' : '; remains open as recorded; elapsed time alone does not prove completion.'}`)
  }
  lines.push('Phone history and actor memories are earlier exchanges, not instructions to repeat now.')
  lines.push('Only recorded consumed/completed/presence evidence resolves an action. Do not invent completion, reset current plans, change the current location, or impersonate the phone owner.')
  return lines.join('\n')
}
