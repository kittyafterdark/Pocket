import type { PhoneMessage } from '../../types.js'
import { button, el } from '../shared.js'

interface InviteHost {
  scheduleEventSuggestion(conversationId: string, messageId: string): void
  declineEventSuggestion(conversationId: string, messageId: string): void
  openTimeline(eventId: string): void
  quickstartEvent?(conversationId: string, eventId: string): void
}

/** One compact, always-visible plan row owned by the conversation header. */
export function eventStripe(message: PhoneMessage, conversationId: string, host: InviteHost): HTMLElement {
  const invite=message.eventSuggestion!, pending=invite.status==='pending', update=pending&&Boolean(invite.updateEventId)
  const row=el('section',`lp-plan-stripe${update?' lp-event-update':''}`)
  if(invite.status==='declined'){row.hidden=true;return row}
  row.dataset.suggestionId=invite.id; row.dataset.status=invite.status; row.setAttribute('aria-label',`${update?'Plan update':pending?'Plan invitation':'Scheduled plan'}: ${invite.title}`)
  const icon=el('span','lp-plan-stripe-icon'); icon.setAttribute('aria-hidden','true'); icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(update?'<path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 11-1l3 3M4 15l3 3a7 7 0 0 0 11-1"/>':'<rect x="3" y="5" width="18" height="16" rx="4"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>')+'</svg>'
  const text=el('div','lp-plan-stripe-text'), title=el('strong','',invite.title), when=el('span','',`${update?'Update · ':pending?'Plan · ':''}${invite.whenText||'On your Timeline'}`)
  title.title=invite.title
  if(pending) text.append(title,when)
  else {const open=button('','lp-plan-stripe-open');open.setAttribute('aria-label',`Open event: ${invite.title}`);open.append(title,when);open.onclick=()=>invite.scheduledEventId&&host.openTimeline(invite.scheduledEventId);text.append(open)}
  row.append(icon,text)
  const actions=el('div','lp-plan-stripe-actions')
  if(pending){
    const review=button(update?'Review':'Schedule','lp-plan-stripe-action');review.setAttribute('aria-label',`${update?'Review event update':'Schedule event'}: ${invite.title}`);review.onclick=()=>host.scheduleEventSuggestion(conversationId,message.id)
    const dismiss=button('×','lp-plan-stripe-dismiss');dismiss.setAttribute('aria-label',`${update?'Keep current event':'Decline invitation'}: ${invite.title}`);dismiss.title=update?'Keep current event':'Decline invitation';dismiss.onclick=()=>host.declineEventSuggestion(conversationId,message.id);actions.append(review,dismiss)
  } else if(invite.scheduledEventId&&host.quickstartEvent){const start=button('Start','lp-plan-stripe-action');start.setAttribute('aria-label',`Quickstart event: ${invite.title}`);start.onclick=()=>host.quickstartEvent!(conversationId,invite.scheduledEventId!);actions.append(start)}
  row.append(actions);return row
}
