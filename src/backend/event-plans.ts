import type { CalendarEvent, PhoneEventSuggestion, PhoneState, PocketConversation } from '../types.js'
import { generatedEventSuggestion } from '../domain/scheduler.js'

const key = (value = '') => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const active = (event: CalendarEvent) => !event.completed && !event.startedAt

/** Bounded, conversation-scoped plan identities for generation; never another thread's plans. */
export function conversationEventPlans(state: PhoneState, conversation: PocketConversation) {
  const plans = new Map<string, { id: string; title: string; whenKind: string; whenText: string; start?: string; phase?: 'completed' | 'started' | 'upcoming'; status: string }>()
  for (const message of conversation.messages) {
    const suggestion = message.eventSuggestion
    if (!suggestion) continue
    const event = state.events.find(event => event.id === (suggestion.scheduledEventId || suggestion.updateEventId))
    const inactive = Boolean((suggestion.scheduledEventId || suggestion.updateEventId) && (!event || !active(event)))
    const details = event && suggestion.status !== 'pending' ? event : suggestion
    plans.set(suggestion.id, { id: suggestion.id, title: details.title, whenKind: details.whenKind, whenText: details.whenText, start: details.start, phase: event?.completed ? 'completed' : event?.startedAt ? 'started' : 'upcoming', status: inactive ? 'closed' : event && suggestion.status === 'declined' ? 'scheduled' : suggestion.status })
  }
  for (const event of state.events.filter(event => event.source?.conversationId === conversation.id && active(event))) {
    if (![...conversation.messages].some(message => message.eventSuggestion?.scheduledEventId === event.id)) plans.set(event.id, { id: event.id, title: event.title, whenKind: event.whenKind, whenText: event.whenText, start: event.start, status: 'scheduled' })
  }
  return [...plans.values()].slice(-12)
}

/** Refine one plan in place; Timeline changes remain proposals until the human saves them. */
export function reconcileMessageEventSuggestion(state: PhoneState, conversation: PocketConversation, value: unknown, makeId: (prefix: string) => string): PhoneEventSuggestion | undefined {
  const next = generatedEventSuggestion(value, makeId)
  if (!next) return undefined
  const reference = next.planId; delete next.planId
  const prior = [...conversation.messages].reverse().map(message => message.eventSuggestion).find((suggestion): suggestion is PhoneEventSuggestion => Boolean(suggestion && (reference ? suggestion.id === reference : key(suggestion.title) === key(next.title))))
  const eventId = prior?.scheduledEventId || prior?.updateEventId || (!prior ? reference : undefined)
  const event = state.events.find(event => event.id === eventId && (event.source?.conversationId === conversation.id || conversation.messages.some(message => message.eventSuggestion?.scheduledEventId === event.id)))
  if (reference && !prior && !event) return undefined
  if ((prior?.status === 'declined' && !prior.updateEventId) || (eventId && prior && (!event || !active(event))) || (event && !active(event))) return undefined
  if (prior) next.id = prior.id
  if (event) {
    const revision = [...conversation.messages].reverse().find(message => message.eventSuggestion?.updateEventId === event.id)?.eventSuggestion
    if (revision) next.id = revision.id
    // Paraphrasing or mentioning an existing plan does not reopen its invitation.
    const changedTime = next.whenKind !== 'unscheduled' && (next.start ? next.start !== event.start : key(next.whenText) !== key(event.whenText))
    const changedDetails = Boolean(reference) && key(next.description) !== key(event.description) && Boolean(next.description)
    const changedPeople = Boolean(reference) && next.participantNames.length > 0 && next.participantNames.map(key).sort().join('|') !== (event.participantNames || []).map(key).sort().join('|')
    if (!changedTime && !changedDetails && !changedPeople) return undefined
    next.updateEventId = event.id
  }
  return next
}


/** Recover scene boundaries from accepted Quickstarts, including already-started legacy events. */
export function recoverStartedEventPlans(state: PhoneState, messages: Array<{ role?: string; content?: string; metadata?: Record<string, unknown> }>): boolean {
  let changed = false
  for (let index = 0; index < messages.length - 1; index++) {
    const turn = messages[index], reply = messages[index + 1]
    if (turn.role !== 'user' || turn.metadata?.source !== 'pocket' || turn.metadata?.pocketContinuation !== true || reply.role !== 'assistant' || !reply.content?.trim()) continue
    const event = state.events.find(event => event.id === turn.metadata?.pocketEventId && (!event.startedAt || !event.phoneHistoryBoundary))
    if (!event) continue
    const conversations = state.conversations.filter(conversation => event.source?.conversationId === conversation.id || conversation.messages.some(message => message.eventSuggestion?.scheduledEventId === event.id))
    if (!conversations.length) continue
    const timestamp = /^Story time: ([^\r\n]+)$/m.exec(turn.content || '')?.[1]
    if (!timestamp || !Number.isFinite(Date.parse(timestamp))) continue
    if (!event.startedAt) { event.startedAt = new Date(timestamp).toISOString(); changed = true }
    if (event.phoneHistoryBoundary) continue
    const conversation = turn.metadata?.pocketConversationId
      ? conversations.find(conversation => conversation.id === turn.metadata!.pocketConversationId)
      : conversations.length === 1 ? conversations[0] : undefined
    if (!conversation?.id) continue
    const supplied = Array.isArray(turn.metadata?.pocketPhoneMessageIds) ? turn.metadata.pocketPhoneMessageIds : []
    let messageIds = [...new Set(supplied.filter((id): id is string => typeof id === 'string' && conversation.messages.some(message => message.id === id)))].slice(-80)
    if (!messageIds.length && !supplied.length) {
      // Legacy cards quote phone dialogue. Require an unambiguous text match in this
      // conversation; never label today's whole tail historical just because a scene started.
      const content = turn.content || '', start = Math.max(content.indexOf('Referenced phone messages:'), content.indexOf('INVITATION LEAD-UP + RECENT EXCHANGE'))
      if (start >= 0) for (const line of content.slice(start).split(/\r?\n/)) {
        const quoted = /:\s*("(?:[^"\\]|\\.)*")\s*$/.exec(line)?.[1]
        if (!quoted) continue
        try {
          const excerpt: unknown = JSON.parse(quoted)
          if (typeof excerpt !== 'string' || excerpt.length < 24) continue
          const matches = conversation.messages.filter(message => { const text = message.text.replace(/\s+/g, ' ').trim(); return message.sender !== 'system' && (message.text === excerpt || text === excerpt || (excerpt.length >= 48 && (message.text.startsWith(excerpt) || text.startsWith(excerpt)))) })
          if (matches.length === 1) messageIds.push(matches[0].id)
        } catch { /* A malformed quote provides no boundary evidence. */ }
      }
      messageIds = [...new Set(messageIds)].slice(-80)
    }
    if (messageIds.length) { event.phoneHistoryBoundary = { conversationId: conversation.id, messageIds }; changed = true }
  }
  return changed
}
