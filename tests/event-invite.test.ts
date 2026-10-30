import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { eventStripe as eventInvite } from '../src/frontend/components/event-invite.js'
import type { PhoneMessage } from '../src/types.js'

test('invite actions keep their originating message and scheduled event identities', () => {
  const old = globalThis.document, dom = new JSDOM()
  try {
    globalThis.document = dom.window.document
    const calls: string[][] = []
    const host = { scheduleEventSuggestion: (...args: string[]) => calls.push(['schedule', ...args]), declineEventSuggestion: (...args: string[]) => calls.push(['decline', ...args]), openTimeline: (...args: string[]) => calls.push(['open', ...args]), quickstartEvent: (...args: string[]) => calls.push(['quickstart', ...args]) }
    const message = { id: 'message', eventSuggestion: { id: 'invite', title: 'Movie night', description: 'Takeout and a film.', whenText: 'Tonight', participantNames: ['Alex', 'Sam'], status: 'pending' } } as PhoneMessage
    const card = eventInvite(message, 'thread', host)
    expect(card.textContent).toContain('Tonight')
    expect(card.classList.contains('lp-plan-stripe')).toBe(true)
    const buttons = card.querySelectorAll('button'); buttons[0].click(); buttons[1].click()
    expect(calls).toEqual([['schedule', 'thread', 'message'], ['decline', 'thread', 'message']])
    message.eventSuggestion!.status = 'scheduled'; message.eventSuggestion!.scheduledEventId = 'event'
    eventInvite(message, 'thread', host).querySelector('button')!.click()
    expect(calls.at(-1)).toEqual(['open', 'event'])
    const scheduled = eventInvite(message, 'thread', host)
    const quickstart = [...scheduled.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Quickstart event: Movie night')!
    expect(quickstart.getAttribute('aria-label')).toBe('Quickstart event: Movie night')
    quickstart.click()
    expect(calls.at(-1)).toEqual(['quickstart', 'thread', 'event'])
    message.eventSuggestion!.status = 'declined'
    expect(eventInvite(message, 'thread', host).querySelectorAll('button').length).toBe(0)
  } finally { globalThis.document = old; dom.window.close() }
})


test('plan readiness hides vague offers and preserves grounded approximate times', async () => {
  const { eventSuggestionReady, generatedEventSuggestion } = await import('../src/domain/scheduler.js')
  const make = (whenKind: string, whenText: string, start?: string) => generatedEventSuggestion({ title:'Coffee',whenKind,whenText,start },()=> 'plan')!
  expect(eventSuggestionReady(make('unscheduled','soon, no time set yet'))).toBe(false)
  expect(eventSuggestionReady(make('relative','sometime soon'))).toBe(false)
  expect(eventSuggestionReady(make('exact','at five'))).toBe(false)
  expect(eventSuggestionReady(make('approximate','Tomorrow afternoon'))).toBe(true)
  expect(eventSuggestionReady(make('exact','at five','2026-10-30T17:00:00Z'))).toBe(true)
})

test('plan references refine one invitation and scheduled revisions wait for confirmation', async () => {
  const { reconcileMessageEventSuggestion, conversationEventPlans } = await import('../src/backend/event-plans.js')
  const state:any = { events:[] }, conversation:any={id:'thread',messages:[]}
  const seed={title:'Coffee',description:'At the cafe',whenKind:'unscheduled',whenText:'soon',participants:['Alex','Sam']}
  const first=reconcileMessageEventSuggestion(state,conversation,seed,()=> 'plan')!
  conversation.messages.push({id:'one',eventSuggestion:first})
  const refined=reconcileMessageEventSuggestion(state,conversation,{...seed,title:'Just the two of us',planId:'plan',whenKind:'exact',whenText:'Tomorrow at five',start:'2026-10-30T17:00:00Z'},()=> 'new')!
  expect(refined.id).toBe('plan'); expect(refined.planId).toBeUndefined()
  conversation.messages.push({id:'two',eventSuggestion:{...refined,status:'scheduled',scheduledEventId:'event'}})
  state.events=[{...refined,id:'event',participantNames:refined.participantNames,completed:false,source:{conversationId:'thread'}}]
  expect(conversationEventPlans(state,conversation)).toHaveLength(1)
  expect(reconcileMessageEventSuggestion(state,conversation,{...refined,planId:'plan'},()=> 'new')).toBeUndefined()
  const update=reconcileMessageEventSuggestion(state,conversation,{...refined,planId:'plan',whenText:'At six instead',start:'2026-10-30T18:00:00Z'},()=> 'new')!
  expect(update.updateEventId).toBe('event'); expect(update.status).toBe('pending'); expect(update.id).toBe('plan')
  expect(state.events[0].start).toBe('2026-10-30T17:00:00Z')
  state.events[0].startedAt='2026-10-30T17:00:00Z'
  expect(reconcileMessageEventSuggestion(state,conversation,{...refined,planId:'plan'},()=> 'new')).toBeUndefined()
  expect(conversationEventPlans(state,conversation)[0].status).toBe('closed')
  state.events=[]
  expect(reconcileMessageEventSuggestion(state,conversation,{...refined,planId:'plan'},()=> 'new')).toBeUndefined()
  expect(reconcileMessageEventSuggestion(state,{id:'other',messages:[]},{...refined,planId:'event'},()=> 'new')).toBeUndefined()
})


test('legacy quickstarts require Pocket metadata, a story timestamp, and an actual RP reply', async () => {
  const { recoverStartedEventPlans } = await import('../src/backend/event-plans.js')
  const state:any={events:[{id:'event',completed:false}],conversations:[{messages:[{eventSuggestion:{scheduledEventId:'event'}}]}]}
  const turn={role:'user',content:'Begin event\n\nStory time: 2026-10-30T17:00:00Z',metadata:{source:'pocket',pocketContinuation:true,pocketEventId:'event'}}
  expect(recoverStartedEventPlans(state,[turn])).toBe(false)
  expect(recoverStartedEventPlans(state,[{...turn,metadata:{}},{role:'assistant',content:'Arriving at the cafe.'}])).toBe(false)
  expect(recoverStartedEventPlans(state,[turn,{role:'assistant',content:'Arriving at the cafe.'}])).toBe(true)
  expect(state.events[0].startedAt).toBe('2026-10-30T17:00:00.000Z')
  expect(recoverStartedEventPlans(state,[turn,{role:'assistant',content:'Arriving at the cafe.'}])).toBe(false)
})


test('quickstart carries the invitation lead-up and preserves evidence without imposing a mood', async () => {
  const { buildEventQuickstart } = await import('../src/backend/event-quickstart.js')
  const state:any={chatId:'chat',characterId:'char',pocketPersonaActorId:'me',pocketPersona:{displayName:'Till'},contacts:[],discoveredActors:[],conversations:[],events:[],relays:[],roleplayNow:'2026-10-29T17:00:00Z'}
  const messages=Array.from({length:45},(_,n)=>({id:`m${n}`,sender:n%2?'contact':'persona',senderName:n%2?'Ivan':'Till',text:n===5?'I am flirting with you, obviously.':n===6?'I like this. Come have coffee with me.':`Scheduling detail ${n}`,createdAt:state.roleplayNow}))
  const conversation:any={id:'thread',kind:'direct',title:'Ivan',messages,participantActorIds:['me'],participantContactIds:[],includesPocketPersona:true,availability:{state:'remote'}}
  state.conversations=[conversation,{id:'other',messages:[{text:'OTHER PRIVATE THREAD'}]}]
  const event:any={id:'event',title:'Coffee',description:'Quiet cafe',participantNames:['Till','Ivan'],source:{messageId:'m10'}}
  const built=buildEventQuickstart(state,conversation,event,state.roleplayNow)
  expect(built.content).toContain('I am flirting with you, obviously.');expect(built.content).toContain('I like this. Come have coffee with me.')
  expect(built.content).toContain('Scheduling detail 44');expect(built.content).not.toContain('OTHER PRIVATE THREAD')
  expect(built.content).toContain('not evidence of hostility');expect(built.content).toContain('or dictate the Persona')
  expect(built.content).toContain('<pocket-event-start card=');expect(built.card.messageCount).toBeGreaterThan(8)
  const { stripPocketPresentationMarkup, sanitizeNarrativeContent }=await import('../src/backend/narrative-content.js')
  expect(stripPocketPresentationMarkup(built.content)).toContain('I am flirting with you, obviously.')
  expect(stripPocketPresentationMarkup(built.content)).not.toContain('card=')
  expect(sanitizeNarrativeContent(built.content)).toBe('')
})

test('quickstart display cards escape text and clean up on chat changes and unload', async () => {
  const { eventQuickstartHtml, installEventQuickstartCards }=await import('../src/frontend/components/event-quickstart.js')
  const card={eventId:'event',title:'Coffee <script>alert(1)</script>',description:'At the cafe',when:'2026-10-29T17:00:00Z',people:'Till & Ivan',messageCount:24}
  const html=eventQuickstartHtml(card)
  expect(html).not.toContain('<script>');expect(html).toContain('&lt;script&gt;');expect(html).toContain('24 texts carried')
  let intercept:any,switched:any,disposed=0,registrations=0
  const ctx:any={getActiveChat:()=>({chatId:'chat'}),events:{on:(_name:string,handler:any)=>{switched=handler;return()=>{switched=undefined}}},messages:{registerTagInterceptor:(_options:any,handler:any)=>{intercept=handler;return()=>{intercept=undefined}},renderWidget:(options:any)=>{registrations++;expect(options.html).toContain('Quiet') ;return()=>{disposed++}}}}
  const cleanup=installEventQuickstartCards(ctx)
  const payload={chatId:'chat',messageId:'message',isUser:true,attrs:{card:encodeURIComponent(JSON.stringify({...card,description:'Quiet cafe'}))}}
  intercept({...payload,isStreaming:true});expect(registrations).toBe(0)
  intercept({...payload,isUser:false});expect(registrations).toBe(0)
  intercept(payload);intercept(payload);expect(registrations).toBe(1)
  switched();expect(disposed).toBe(1)
  intercept(payload);expect(registrations).toBe(2);cleanup();expect(disposed).toBe(2);expect(intercept).toBeUndefined()
  expect(()=>installEventQuickstartCards({messages:{}} as any)()).not.toThrow()
})

test('existing Quickstarts recover a boundary from quoted dialogue without swallowing later same-clock texts', async () => {
  const { recoverStartedEventPlans } = await import('../src/backend/event-plans.js')
  const before = { id: 'before', sender: 'contact', text: "not a chance. i'll be there at 5:15 and look desperate about it." }
  const after = { id: 'after', sender: 'persona', text: 'The scene already happened. Good to see you.' }
  const state: any = { events: [{ id: 'event', title: 'Coffee', completed: false, startedAt: '2026-10-30T17:00:00Z' }], conversations: [
    { id: 'thread', messages: [{ ...before, eventSuggestion: { scheduledEventId: 'event' } }, after] },
    { id: 'unrelated', messages: [{ id: 'stranger', text: before.text }] },
  ] }
  const turn = { role: 'user', content: `Begin event\nStory time: 2026-10-30T17:00:00Z\nReferenced phone messages:\nIvan: ${JSON.stringify(before.text)}`, metadata: { source: 'pocket', pocketContinuation: true, pocketEventId: 'event' } }
  expect(recoverStartedEventPlans(state, [turn])).toBe(false)
  expect(recoverStartedEventPlans(state, [turn, { role: 'assistant', content: 'They met at the cafe and talked.' }])).toBe(true)
  expect(state.events[0].phoneHistoryBoundary).toEqual({ conversationId: 'thread', messageIds: ['before'] })
  expect(recoverStartedEventPlans(state, [turn, { role: 'assistant', content: 'They met at the cafe and talked.' }])).toBe(false)
  delete state.events[0].phoneHistoryBoundary; state.conversations[0].messages.push({ ...before, id: 'same-text-later' })
  expect(recoverStartedEventPlans(state, [turn, { role: 'assistant', content: 'They met at the cafe and talked.' }])).toBe(false)
  expect(state.events[0].phoneHistoryBoundary).toBeUndefined()
  state.conversations[0].messages.pop()
  state.conversations[0].messages[0].text = "not a chance.\n\ni'll be there at 5:15 and look desperate about it."
  const compactTurn = { ...turn, content: turn.content.replace(JSON.stringify(before.text), JSON.stringify(state.conversations[0].messages[0].text.replace(/\s+/g, ' '))) }
  expect(recoverStartedEventPlans(state, [compactTurn, { role: 'assistant', content: 'They met at the cafe and talked.' }])).toBe(true)
  delete state.events[0].phoneHistoryBoundary
  const explicit = { ...turn, metadata: { ...turn.metadata, pocketConversationId: 'thread', pocketPhoneMessageIds: ['before', 'missing', 'stranger'] } }
  expect(recoverStartedEventPlans(state, [explicit, { role: 'assistant', content: 'They met at the cafe and talked.' }])).toBe(true)
  expect(state.events[0].phoneHistoryBoundary.messageIds).toEqual(['before'])
})
