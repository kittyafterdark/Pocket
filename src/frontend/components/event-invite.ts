import type { PhoneMessage } from '../../types.js'
import { button, el } from '../shared.js'

interface InviteHost {
  scheduleEventSuggestion(conversationId: string, messageId: string): void
  declineEventSuggestion(conversationId: string, messageId: string): void
  openTimeline(eventId: string): void
  quickstartEvent?(conversationId: string, eventId: string): void
}

export function eventInvite(message: PhoneMessage, conversationId: string, host: InviteHost): HTMLElement {
  const invite = message.eventSuggestion!
  const card = el('section', 'lp-event-invite')
  card.dataset.suggestionId = invite.id
  card.dataset.status = invite.status
  card.setAttribute('aria-label', `Event invitation: ${invite.title}`)
  const icon = el('span', 'lp-event-invite-icon')
  icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/></svg>'
  const heading = el('div', 'lp-event-invite-heading')
  heading.append(el('span', 'lp-event-invite-eyebrow', invite.status === 'pending' ? 'You’re invited' : invite.status === 'scheduled' ? 'On your timeline' : 'Invitation declined'), el('h3', '', invite.title))
  const top = el('div', 'lp-event-invite-top'); top.append(icon, heading)
  card.append(top)
  if (invite.whenText) card.append(el('p', 'lp-event-invite-when', invite.whenText))
  if (invite.description) card.append(el('p', 'lp-event-invite-description', invite.description))
  if (invite.participantNames.length) card.append(el('p', 'lp-event-invite-people', invite.participantNames.join(' · ')))
  const actions = el('div', 'lp-event-invite-actions')
  if (invite.status === 'pending') {
    const accept = button('Schedule event', 'lp-button')
    accept.setAttribute('aria-label', `Schedule event: ${invite.title}`)
    accept.addEventListener('click', () => host.scheduleEventSuggestion(conversationId, message.id))
    const decline = button('Decline', 'lp-button lp-button-quiet')
    decline.setAttribute('aria-label', `Decline invitation: ${invite.title}`)
    decline.addEventListener('click', () => host.declineEventSuggestion(conversationId, message.id))
    actions.append(accept, decline)
  } else if (invite.status === 'scheduled' && invite.scheduledEventId) {
    const open = button('Open event', 'lp-button lp-button-quiet')
    open.setAttribute('aria-label', `Open event: ${invite.title}`)
    open.addEventListener('click', () => host.openTimeline(invite.scheduledEventId!))
    actions.append(open)
    if (host.quickstartEvent) {
      const start = button('Quickstart event', 'lp-button')
      start.setAttribute('aria-label', `Quickstart event: ${invite.title}`)
      start.addEventListener('click', () => host.quickstartEvent!(conversationId, invite.scheduledEventId!))
      actions.append(start)
    }
  }
  if (actions.childElementCount) card.append(actions)
  return card
}
