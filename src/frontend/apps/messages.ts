import type { PhoneMessage, PhoneState, PocketContextReference, PocketConversation, PocketRelay } from '../../types.js'
import { conversationActorIds, listPocketActors, resolvePocketActor } from '../../domain/actors.js'
import { counterpartActorIds, conversationDeviceActorIds, conversationTitleForDevice, conversationUnreadForDevice, conversationVisibleOnDevice, messageDirection } from '../../domain/device.js'
import { avatarColor, showPocketSheet } from '../components/ui.js'
import { eventInvite } from '../components/event-invite.js'
import { button, el, formatTime, inputValue } from '../shared.js'
import type { PageAction } from '../shared.js'
import { fieldBlock, identityBlock, sectionBlock } from '../components/ui.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface MessagesViewHost {
  state: PhoneState
  selectedConversationId: string
  deviceOwnerActorId: string
  readOnlyDevice: boolean
  selectedMessageId: string
  selectedView: 'thread' | 'new-group' | 'group-editor' | 'group-detail'
  groupDraft: { title: string; participants: string[] } | undefined
  updateGroupDraft(draft: { title: string; participants: string[] }): void
  groupSaving: boolean
  saveGroup(type: string, payload: Record<string, unknown>): void
  openContacts(): void
  startContactGroup(title: string, participants: string[]): void
  generationAvailable: boolean
  busyConversations: Map<string, { speakerContactId: string; phase: 'checking' | 'pending' }>
  selectedGroupSpeakerId: string
  draft: string
  updateDraft(conversationId: string, value: string): void
  page(title: string, subtitle?: string, action?: PageAction): Page
  empty(title: string, copy: string): HTMLDivElement
  iconButton(name: string, label: string): HTMLButtonElement
  selectConversation(conversationId: string, view?: 'thread' | 'new-group' | 'group-editor' | 'group-detail'): void
  openActor(actorId: string): void
  openDirect(contactId: string): void
  send(type: string, payload?: Record<string, unknown>): void
  generateReply(conversationId: string, speakerContactId?: string): void
  cancelReply(conversationId: string): void
  selectGroupSpeaker(conversationId: string, speakerContactId: string): void
  composerState(conversationId: string, held: boolean): void
  messageAnyway(conversationId: string): void
  manualOverride: boolean
  continueRelay(): void
  continueArrival(conversationId: string): void
  openRoleplay(): void
  openTimeline(eventId: string): void
  scheduleEventSuggestion(conversationId: string, messageId: string): void
  declineEventSuggestion(conversationId: string, messageId: string): void
  showReferenceSheet(conversationId: string): void
  cancelReference(referenceId: string): void
  rearmReference(referenceId: string): void
  showConversationGenerationInfo(conversationId: string): void
  showOutgoingPrompt(conversationId: string): void
  shouldFocusHandoff(relayId: string): boolean
  showGenerationInfo(message: PhoneMessage): void
  renderVoiceMessage?(message: PhoneMessage): HTMLElement
  back(): void
}

const PAUSE_COPY = {
  ended: 'stopped responding.',
  busy: 'is busy right now.',
  away: 'went unavailable.',
  sleeping: 'went offline for the night.',
  unknown: 'stopped responding.',
} as const

const LOCAL_COPY = {
  in_scene: 'is currently with you.',
  arrived: 'is here now.',
  took_action: 'continued this in the main conversation.',
  continued_in_person: 'continued this in person.',
} as const

function conversationTitle(state: PhoneState, conversation: PocketConversation, deviceOwnerActorId: string): string {
  return conversationTitleForDevice(state, conversation, deviceOwnerActorId)
}


function newConversationView(host: MessagesViewHost): HTMLDivElement {
  if (host.readOnlyDevice) return host.empty('Inspection mode', 'Switch back to the roleplay Persona device to create or send conversations.')
  const { page, content } = host.page('New Message', 'Choose a contact or start a group')
  const search = el('input', 'lp-input')
  search.type = 'search'; search.placeholder = 'Who are we texting?'; search.setAttribute('aria-label', 'Search recipients')
  const startGroup = button('＋ New group', 'lp-button lp-button-primary')
  startGroup.disabled = listPocketActors(host.state).length < 2
  startGroup.addEventListener('click', () => host.selectConversation('', 'group-editor'))
  content.append(search, startGroup)
  const collections = host.state.contactGroups || []
  if (collections.length) {
    const { section, body } = sectionBlock('Your contact groups', 'Start a chat with a saved collection.')
    for (const group of collections) {
      const start = button(`${group.name} · ${group.memberIds.length}`, 'lp-button lp-button-quiet')
      start.disabled = group.memberIds.length < 2
      start.addEventListener('click', () => host.startContactGroup(group.name, group.memberIds))
      body.append(start)
    }
    content.append(section)
  }

  const { section: directSection, body: directBody } = sectionBlock(
    'Direct message',
    'Start or reopen a private Pocket conversation.',
  )
  const latest = new Map<string, number>()
  for (const conversation of host.state.conversations) {
    if (conversation.kind !== 'direct' || !conversationVisibleOnDevice(host.state, conversation, host.deviceOwnerActorId)) continue
    const time = Date.parse(conversation.messages.at(-1)?.createdAt || conversation.updatedAt || '') || 0
    for (const id of conversationActorIds(conversation)) latest.set(id, Math.max(latest.get(id) || 0, time))
  }
  const contacts = [...host.state.contacts].sort((a, b) => (latest.get(b.id) || 0) - (latest.get(a.id) || 0) || a.name.localeCompare(b.name))
  let sectionLabel = ''
  for (const contact of contacts) {
    const label = latest.has(contact.id) ? 'Recent' : 'All contacts'
    if (label !== sectionLabel) { directBody.append(el('div', 'lp-eyebrow', label)); sectionLabel = label }
    const row = button('', 'lp-message-picker-row')
    row.type = 'button'
    const actor = resolvePocketActor(host.state, contact.id)
    const avatar = el('span', 'lp-avatar', contact.name.slice(0, 1).toUpperCase())
    if (actor?.accent) avatar.style.setProperty('--contact-accent', actor.accent)
    if (actor?.avatarUrl) {
      const image = el('img'); image.src = actor.avatarUrl; image.alt = ''; image.style.objectPosition = `${contact.avatarFocus?.x ?? 50}% ${contact.avatarFocus?.y ?? 50}%`; avatar.replaceChildren(image)
    }
    row.append(
      avatar,
      identityBlock({ name: contact.name, meta: contact.role }),
      el('span', 'lp-message-picker-chevron', '›'),
    )
    row.addEventListener('click', () => host.openDirect(contact.id))
    row.dataset.search = `${contact.name} ${contact.role}`.toLocaleLowerCase()
    directBody.appendChild(row)
  }
  if (!contacts.length) directBody.appendChild(el('p', 'lp-copy', 'No contacts are available yet.'))

  const { section: groupSection, body: groupBody } = sectionBlock(
    'Someone missing?',
    'Bring another person into your Pocket.',
  )
  const addContact = button('＋ Add a contact', 'lp-button lp-button-quiet')
  addContact.addEventListener('click', () => host.openContacts())
  groupBody.appendChild(addContact)
  const noMatches = el('p', 'lp-copy', 'Nobody by that name yet. Try another search or add a contact.')
  noMatches.hidden = true
  search.addEventListener('input', () => {
    let count = 0
    for (const row of directBody.querySelectorAll<HTMLElement>('[data-search]')) {
      row.hidden = !row.dataset.search!.includes(search.value.trim().toLocaleLowerCase())
      if (!row.hidden) count++
    }
    noMatches.hidden = count > 0 || !search.value.trim()
  })
  directBody.appendChild(noMatches)

  content.append(directSection, groupSection)
  return page
}

function groupEditor(host: MessagesViewHost, conversation: PocketConversation | null): HTMLDivElement {
  if (host.readOnlyDevice) return host.empty('Inspection mode', 'Switch back to the roleplay Persona device to modify group membership.')
  let saveGroup = () => {}
  const { page, content } = host.page(conversation ? 'Group Details' : 'New Group', 'Choose at least two contacts', { label: 'Save', callback: () => saveGroup() })
  const title = el('input', 'lp-input')
  title.placeholder = 'Group name'
  title.value = host.groupDraft?.title ?? conversation?.title ?? ''
  const choices = el('div', 'lp-contact-checklist lp-participant-picker')
  const selected = new Set(host.groupDraft?.participants ?? (conversation ? conversationActorIds(conversation) : []))
  const count = el('p', 'lp-copy')
  const selectedNames = el('div', 'lp-selected-members')
  const save = page.querySelector<HTMLButtonElement>('.lp-nav-action:last-child')!
  const remember = () => {
    const participants = [...choices.querySelectorAll<HTMLInputElement>('input:checked')].map(entry => entry.value)
    host.updateGroupDraft({ title: title.value, participants })
    count.textContent = `${participants.length} selected · choose at least two people`
    selectedNames.replaceChildren(...participants.map(id => el('span', 'lp-chip', resolvePocketActor(host.state, id)?.name || id)))
    save.disabled = participants.length < 2 || host.groupSaving
    if (host.groupSaving) save.textContent = 'Saving…'
  }
  title.addEventListener('input', remember)
  const search = el('input', 'lp-input'); search.type = 'search'; search.placeholder = 'Search group members'
  search.addEventListener('input', () => { for (const row of choices.querySelectorAll<HTMLElement>('.lp-picker-row')) row.hidden = !row.textContent!.toLowerCase().includes(search.value.trim().toLowerCase()) })

  for (const actor of listPocketActors(host.state)) {
    const row = el('label', 'lp-picker-row')
    const checkbox = el('input', 'lp-visually-hidden')
    checkbox.type = 'checkbox'
    checkbox.value = actor.actorId
    checkbox.checked = selected.has(actor.actorId)

    const avatar = el('span', 'lp-picker-avatar', actor.name.slice(0, 1).toUpperCase())
    avatar.style.setProperty('--message-accent', actor.accent)
    if (actor.avatarUrl) {
      const image = el('img'); image.src = actor.avatarUrl; image.alt = ''; avatar.replaceChildren(image)
    }

    const identity = identityBlock({
      name: actor.name,
      meta: `${actor.role}${actor.kind === 'discovered' ? ' · discovered' : ''}`,
    })
    const check = el('span', 'lp-picker-check', '✓')
    const sync = () => { row.dataset.selected = String(checkbox.checked) }
    checkbox.addEventListener('change', sync)
    checkbox.addEventListener('change', remember)
    sync()
    row.append(avatar, identity, checkbox, check)
    choices.appendChild(row)
  }

  saveGroup = () => {
    const participantActorIds = [...choices.querySelectorAll<HTMLInputElement>('input:checked')].map((entry) => entry.value)
    if (participantActorIds.length < 2) return
    save.disabled = true; save.textContent = 'Creating…'
    if (host.groupSaving) return
    host.saveGroup(conversation ? 'lumiphone:update_conversation' : 'lumiphone:create_conversation', {
      conversationId: conversation?.id, title: title.value.trim(), participantActorIds,
    })
  }

  content.append(fieldBlock('Group name', title), count, selectedNames, search, choices)
  remember()
  if (conversation) {
    const remove = button('Delete group', 'lp-button lp-button-danger')
    remove.addEventListener('click', () => host.send('lumiphone:delete', { kind: 'conversation', id: conversation.id }))
    content.appendChild(remove)
  }
  return page
}
function participantAvatar(actor: NonNullable<ReturnType<typeof resolvePocketActor>>, continuation = false): HTMLDivElement {
  const node = el('div', continuation ? 'lp-group-avatar lp-group-avatar-spacer' : 'lp-group-avatar', actor.name.slice(0, 1).toUpperCase())
  node.style.setProperty('--message-accent', actor.accent)
  if (!continuation && actor.avatarUrl) {
    const image = el('img'); image.src = actor.avatarUrl; image.alt = ''; node.replaceChildren(image)
  }
  return node
}

function handoffActivity(host: MessagesViewHost, conversation: PocketConversation, relay: PocketRelay): HTMLDivElement {
  const continuation = relay.continuation
  const failed = relay.status === 'pending' && (continuation.state === 'blocked' || continuation.state === 'failed' || continuation.state === 'stopped' || Boolean(relay.injectionError))
  const completed = relay.status === 'consumed' || continuation.state === 'completed'
  const generating = !failed && !completed && Boolean(relay.injectedAt || continuation.state === 'started')
  const accepted = !failed && !completed && !generating && continuation.state === 'accepted'
  const state = completed ? 'completed' : failed ? 'failed' : generating ? 'generating' : accepted ? 'accepted' : 'preparing'
  const actor = host.state.contacts.find((entry) => entry.id === relay.contactId)?.name || conversation.title || 'Conversation'
  const activity = el('div', 'lp-handoff-activity')
  activity.dataset.relayId = relay.id
  activity.dataset.state = state
  activity.setAttribute('role', 'status')
  const primary = el('div', 'lp-handoff-primary')
  const mark = el('span', 'lp-handoff-mark', completed ? '✓' : failed ? '!' : '')
  const copy = el('div', 'lp-grow')
  const arrival = relay.kind === 'arrival'
  const title = arrival
    ? completed ? 'Continued toward arrival' : failed ? 'Couldn’t continue toward arrival' : generating ? 'Continuing toward arrival…' : accepted ? 'Host accepted the arrival bridge' : 'Preparing arrival bridge…'
    : completed ? 'Continued in roleplay' : failed ? 'Couldn’t continue in roleplay' : generating ? 'Continuing in roleplay…' : accepted ? 'Host accepted the handoff' : 'Preparing roleplay handoff…'
  const subtitle = arrival
    ? completed ? `${actor} is still marked on the way until the RP establishes arrival.` : failed ? continuation.error || relay.injectionError || 'The arrival bridge is still pending.' : generating ? `${actor} is moving toward you; you can continue chatting.` : accepted ? 'Waiting for arrival-relay injection.' : `${actor} is moving toward you; you can continue chatting. After a quiet moment, Pocket continues the roleplay.`
    : completed ? `${actor} continued in the main RP.` : failed ? continuation.error || relay.injectionError || 'The handoff is still pending.' : generating ? 'Pocket delivered the conversation context to the scene.' : accepted ? 'Waiting for relay injection.' : 'Gathering the latest phone exchange.'
  copy.append(el('strong', '', title), el('span', 'lp-copy', subtitle))
  primary.append(mark, copy)
  if (completed) {
    const open = button('Open RP', 'lp-handoff-action'); open.addEventListener('click', () => host.openRoleplay()); primary.appendChild(open)
  } else if (failed) {
    const retry = button('Retry', 'lp-handoff-action'); retry.addEventListener('click', () => host.continueRelay()); primary.appendChild(retry)
  }
  activity.appendChild(primary)

  const more = el('details', 'lp-handoff-more')
  const summary = el('summary', '', 'More')
  const secondary = el('div', 'lp-handoff-secondary')
  if (relay.status === 'pending') {
    const anyway = button('Message anyway', 'lp-button lp-button-quiet'); anyway.addEventListener('click', () => host.messageAnyway(conversation.id)); secondary.appendChild(anyway)
  }
  if (relay.timelineEventId) {
    const timeline = button('Timeline handoff', 'lp-button lp-button-quiet'); timeline.addEventListener('click', () => host.openTimeline(relay.timelineEventId)); secondary.appendChild(timeline)
  }
  const permissions = continuation.permissions
    ? `chat mutation ${continuation.permissions.chatMutation ? 'granted' : 'missing'} · generation ${continuation.permissions.generation ? 'granted' : 'missing'}`
    : 'not checked'
  const diagnostics = el('div', 'lp-handoff-diagnostics')
  for (const row of [
    `Relay: ${relay.id}`,
    `State: ${continuation.state}`,
    `Invoked: ${continuation.invokedAt || 'not yet'}`,
    `Permissions: ${permissions}`,
    `Method: ${continuation.method || 'not called'}`,
    `Host accepted: ${continuation.hostAcceptedAt || 'no'}`,
    `Generation event: ${continuation.generationStartedAt || 'not observed'}`,
    `Generation completed: ${continuation.generationCompletedAt || 'not observed'}`,
    `Generation ID: ${continuation.generationId || 'none'}`,
    `Relay snapshot: ${relay.conversationTail.text.length} chars`,
    `Recent exchange: ${relay.relayExchangeMessageCount ?? relay.conversationTail.recentMessageIds.length} messages`,
    `Serialized relay: ${relay.serializedRelayChars || 0} chars`,
    `Injected: ${relay.injectedAt ? `yes · ${relay.injectedGenerationId || 'generation association pending'}` : 'no'}`,
    `Consumption: ${relay.status}`,
    relay.injectionError ? `Injection error: ${relay.injectionError}` : '',
    continuation.error ? `Error: ${continuation.error}` : '',
  ].filter(Boolean)) diagnostics.appendChild(el('span', 'lp-copy', row))
  const decision = conversation.lastDecision
  if (decision?.relayId === relay.id) diagnostics.appendChild(el('span', 'lp-copy', `Channel decision: ${decision.rawAction} → ${decision.normalizedAction}${decision.reason ? ` · ${decision.reason}` : ''}${decision.normalizationReason ? ` · ${decision.normalizationReason}` : ''}`))
  secondary.appendChild(diagnostics)
  if (relay.serializedRelay) {
    const serialized = el('details', 'lp-channel-diagnostic')
    serialized.append(el('summary', '', 'View serialized relay'), el('pre', 'lp-code-block', relay.serializedRelay))
    secondary.appendChild(serialized)
  }
  more.append(summary, secondary)
  activity.appendChild(more)
  if (host.shouldFocusHandoff(relay.id)) requestAnimationFrame(() => activity.scrollIntoView?.({ block: 'center', behavior: 'smooth' }))
  return activity
}

function referenceAttachment(host: MessagesViewHost, reference: PocketContextReference): HTMLDivElement {
  const node = el('div', 'lp-reference-attachment')
  node.dataset.referenceId = reference.id
  node.dataset.state = reference.status
  node.setAttribute('role', 'status')
  const copy = el('div', 'lp-grow')
  const title = reference.status === 'failed'
    ? 'Reference wasn’t delivered'
    : reference.status === 'injected'
      ? 'Reference attached to roleplay generation'
      : 'Attached to next roleplay turn'
  const scope = reference.scope === 'selected_messages'
    ? `${reference.messages.length} selected message${reference.messages.length === 1 ? '' : 's'}`
    : reference.scope === 'recent_messages' ? 'Recent messages' : 'Current conversation'
  copy.append(el('strong', '', title), el('span', 'lp-copy', `${reference.conversationTitle} · ${scope}`))
  const mark = el('span', 'lp-reference-mark', reference.status === 'failed' ? '!' : reference.status === 'injected' ? '↗' : '✓')
  const actions = el('div', 'lp-reference-actions')
  if (reference.status === 'armed') {
    const roleplay = button('Return to roleplay', 'lp-reference-action')
    roleplay.addEventListener('click', () => host.openRoleplay())
    const cancel = button('Cancel', 'lp-reference-action lp-reference-action-quiet')
    cancel.addEventListener('click', () => host.cancelReference(reference.id))
    actions.append(roleplay, cancel)
  } else if (reference.status === 'failed') {
    const retry = button('Attach again', 'lp-reference-action')
    retry.addEventListener('click', () => host.rearmReference(reference.id))
    const cancel = button('Dismiss', 'lp-reference-action lp-reference-action-quiet')
    cancel.addEventListener('click', () => host.cancelReference(reference.id))
    actions.append(retry, cancel)
  }
  const head = el('div', 'lp-reference-head')
  head.append(mark, copy, actions)
  node.appendChild(head)
  node.appendChild(el('p', 'lp-reference-safety', reference.status === 'injected'
    ? 'Pocket supplied this as context only; participant scene presence was not changed.'
    : reference.status === 'failed' ? reference.error || 'The reference remains available to attach again.'
      : 'Pocket will wait for your RP message. This does not move any participant into the scene.'))
  const diagnostics = el('details', 'lp-reference-diagnostics')
  const body = el('div', 'lp-handoff-diagnostics')
  for (const row of [
    `Reference: ${reference.id}`,
    `Status: ${reference.status}`,
    `Scope: ${reference.scope}`,
    `Messages: ${reference.messages.length}`,
    `Bound user message: ${reference.boundUserMessageId || 'waiting for next RP turn'}`,
    `Generation: ${reference.injectedGenerationId || 'not bound'}`,
    `Injected: ${reference.injectedAt || 'no'}`,
    `Serialized reference: ${reference.serializedReferenceChars || 0} chars`,
    reference.error ? `Error: ${reference.error}` : '',
  ].filter(Boolean)) body.appendChild(el('span', 'lp-copy', row))
  if (reference.serializedReference) {
    const serialized = el('details', 'lp-channel-diagnostic')
    serialized.append(el('summary', '', 'View serialized reference'), el('pre', 'lp-code-block', reference.serializedReference))
    body.appendChild(serialized)
  }
  diagnostics.append(el('summary', '', 'Diagnostics'), body)
  node.appendChild(diagnostics)
  return node
}

export function renderMessagesView(host: MessagesViewHost): HTMLDivElement {
  const selectedConversation = host.state.conversations.find((item) => item.id === host.selectedConversationId && conversationVisibleOnDevice(host.state, item, host.deviceOwnerActorId)) || null
  if (host.selectedView === 'new-group') return newConversationView(host)
  if (host.selectedView === 'group-editor') return groupEditor(host, null)
  if (selectedConversation?.kind === 'group' && host.selectedView === 'group-detail') return groupEditor(host, selectedConversation)

  if (!selectedConversation) {
    const conversations = host.state.conversations.filter((conversation) => conversationVisibleOnDevice(host.state, conversation, host.deviceOwnerActorId)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    const { page, content } = host.page('Messages', `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`, {
      label: host.readOnlyDevice ? '' : 'New', callback: () => host.selectConversation('', 'new-group'), enabled: !host.readOnlyDevice,
    })
    content.classList.add('lp-conversation-list')
    for (const conversation of conversations) {
      const row = button('', 'lp-conversation-row')
      row.dataset.clickable = 'true'; row.tabIndex = 0; row.setAttribute('role', 'button')
      const titleText = conversationTitle(host.state, conversation, host.deviceOwnerActorId)
      const members = counterpartActorIds(host.state, conversation, host.deviceOwnerActorId)
      const avatar = el('div', 'lp-avatar', conversation.kind === 'group' ? String(members.length) : titleText.slice(0, 1).toUpperCase())
      const directActor = conversation.kind === 'direct' ? resolvePocketActor(host.state, members[0]) : null
      if (directActor?.avatarUrl) {
        const image = el('img'); image.src = directActor.avatarUrl; image.alt = ''; avatar.replaceChildren(image)
      }
      avatar.style.background = avatarColor(members[0] || titleText)
      const latest = conversation.messages.at(-1)
      const description = latest
        ? `${conversation.kind === 'group' && latest.sender === 'contact' ? `${latest.senderName}: ` : ''}${latest.text}`
        : ''
      const identity = identityBlock({ name: titleText, meta: latest ? formatTime(latest.createdAt) : '', description })
      row.append(avatar, identity)
      const unread = conversationUnreadForDevice(host.state, conversation, host.deviceOwnerActorId)
      if (unread) row.appendChild(el('span', 'lp-unread', String(unread)))
      const open = () => host.selectConversation(conversation.id)
      row.addEventListener('click', open)
      row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() } })
      content.appendChild(row)
    }
    if (!conversations.length) content.appendChild(host.empty('No conversations yet', 'Open Contacts to message a character, Council member, or Pocket NPC.'))
    return page
  }

  const conversation = selectedConversation
  const titleText = conversationTitle(host.state, conversation, host.deviceOwnerActorId)
  const page = el('div', 'lp-thread')
  const nav = el('header', 'lp-nav')
  const back = button('‹ Back', 'lp-nav-action')
  back.addEventListener('click', () => host.back())
  const title = el('div', 'lp-nav-title', titleText)
  const memberActorIds = conversationDeviceActorIds(host.state, conversation)
  const counterpartIds = counterpartActorIds(host.state, conversation, host.deviceOwnerActorId)
  title.appendChild(el('span', 'lp-nav-subtitle', host.readOnlyDevice ? `${conversation.kind === 'group' ? memberActorIds.length : 2} participants · inspection mode` : conversation.kind === 'group' ? `${memberActorIds.length} participants` : 'Direct message'))
  const menu = el('details', 'lp-conversation-menu')
  const menuToggle = el('summary', 'lp-nav-action', '⋯')
  menuToggle.setAttribute('aria-label', 'Conversation menu')
  const menuSheet = el('div', 'lp-conversation-menu-sheet')
  const menuAction = (label: string, callback: () => void): HTMLButtonElement => {
    const action = button(label, 'lp-conversation-menu-action')
    action.addEventListener('click', () => { menu.open = false; callback() })
    return action
  }
  menuSheet.appendChild(menuAction(conversation.kind === 'group' ? 'Participants' : 'Contact info', () => {
    if (conversation.kind === 'group') host.selectConversation(conversation.id, 'group-detail')
    else if (counterpartIds[0]) host.openActor(counterpartIds[0])
  }))
  const referenceAction = menuAction('Reference in roleplay', () => host.showReferenceSheet(conversation.id))
  referenceAction.disabled = host.readOnlyDevice || !conversation.messages.some((message) => message.sender !== 'system')
  menuSheet.appendChild(referenceAction)
  menuSheet.appendChild(menuAction('View Timeline', () => host.openTimeline('')))
  menuSheet.appendChild(menuAction('Generation info', () => host.showConversationGenerationInfo(conversation.id)))
  menuSheet.appendChild(menuAction('Outgoing prompt', () => host.showOutgoingPrompt(conversation.id)))
  menu.append(menuToggle, menuSheet)
  nav.append(back, title, menu)
  page.appendChild(nav)

  const referenceSlot = el('div', 'lp-reference-slot')
  const activeReference = [...host.state.references].reverse().find((entry) => entry.conversationId === conversation.id && (
    entry.status === 'armed' || entry.status === 'injected' || entry.status === 'failed'
  ))
  if (activeReference) referenceSlot.appendChild(referenceAttachment(host, activeReference))
  page.appendChild(referenceSlot)

  const busy = host.busyConversations.get(conversation.id)
  const replyBusy = Boolean(busy)
  const directActor = conversation.kind === 'direct' ? resolvePocketActor(host.state, counterpartIds[0] || '') : null
  const directContact = directActor?.contact || null
  const scenePresent = Boolean(directContact?.presence.inScene)
  const bubbles = el('div', 'lp-bubbles')
  bubbles.dataset.pocketThread = conversation.id
  bubbles.dataset.conversationKind = conversation.kind
  const conversationRelays = host.readOnlyDevice ? [] : host.state.relays.filter((entry) => entry.conversationId === conversation.id && entry.status !== 'dismissed')
  const renderedRelayIds = new Set<string>()
  let priorGroupSpeakerId = ''
  let priorBurstKey = ''
  for (const message of conversation.messages) {
    const bubble = el('div', 'lp-bubble lp-message-surface')
    bubble.dataset.messageId = message.id
    bubble.dataset.selected = String(message.id === host.selectedMessageId)
    if (message.call) { bubble.classList.add('lp-call-history'); bubble.dataset.callStatus = message.call.status }
    const direction = messageDirection(host.state, conversation, message, host.deviceOwnerActorId)
    bubble.dataset.sender = direction === 'outbound' ? 'persona' : message.sender === 'system' ? 'system' : 'contact'
    const senderActor = message.senderActorId ? resolvePocketActor(host.state, message.senderActorId) : message.sender === 'contact' ? resolvePocketActor(host.state, message.senderContactId || counterpartIds[0] || '') : null
    const resolvedAccent = senderActor?.accent || message.senderAccent || directActor?.accent || ''
    if (direction !== 'outbound') bubble.style.setProperty('--message-accent', resolvedAccent)
    const messageActorId = message.senderActorId || message.senderContactId || ''
    const burstKey = `${bubble.dataset.sender}:${messageActorId}`
    bubble.dataset.burstContinuation = String(priorBurstKey === burstKey && message.sender !== 'system')
    priorBurstKey = burstKey
    const continuesRun = conversation.kind === 'group' && direction !== 'outbound' && priorGroupSpeakerId === messageActorId
    if (conversation.kind === 'group' && direction !== 'outbound' && !continuesRun && senderActor) {
      const sender = button(senderActor?.name || message.senderName, 'lp-bubble-sender lp-actor-link')
      sender.addEventListener('click', () => { if (messageActorId) host.openActor(messageActorId) })
      bubble.appendChild(sender)
    }
    bubble.append(message.format === 'voice' && host.renderVoiceMessage ? host.renderVoiceMessage(message) : document.createTextNode(message.text), el('span', 'lp-bubble-time', `${formatTime(message.createdAt)} · ${message.status}`))
    if (message.generation || message.origin || !host.readOnlyDevice) {
      const tools = el('div', 'lp-bubble-tools')
      if (message.generation && !host.readOnlyDevice) {
        const retry = button('↻', 'lp-bubble-action')
        retry.textContent = 'Retry message'; retry.type = 'button'; retry.title = 'Retry'
        retry.setAttribute('aria-label', `Retry message from ${message.senderName}`)
        retry.addEventListener('click', () => host.send('lumiphone:retry_message', { conversationId: conversation.id, messageId: message.id }))
        tools.appendChild(retry)
      }
      if (message.generation || message.origin) {
        const generationInfo = button('ⓘ', 'lp-bubble-action')
        generationInfo.textContent = 'Generation info'; generationInfo.type = 'button'; generationInfo.title = 'Generation info'
        generationInfo.setAttribute('aria-label', 'Generation info')
        generationInfo.addEventListener('click', () => host.showGenerationInfo(message))
        tools.appendChild(generationInfo)
      }
      if (!host.readOnlyDevice) {
        const remove = button('×', 'lp-bubble-action')
        remove.textContent = 'Delete message'; remove.type = 'button'; remove.title = 'Delete message'
        remove.setAttribute('aria-label', 'Delete message')
        remove.dataset.destructive = 'true'
        remove.addEventListener('click', () => host.send('lumiphone:delete', { kind: 'message', conversationId: conversation.id, id: message.id }))
        tools.appendChild(remove)
      }
      const more = button('⋯', 'lp-message-more'); more.setAttribute('aria-label', 'Message actions')
      more.addEventListener('click', () => showPocketSheet(more, 'Message actions', tools))
      bubble.appendChild(more)
    }
    if (conversation.kind === 'group' && direction !== 'outbound' && senderActor) {
      const row = el('div', 'lp-group-message')
      row.style.setProperty('--message-accent', resolvedAccent)
      row.dataset.continuation = String(continuesRun)
      const avatar = participantAvatar(senderActor, continuesRun)
      if (!continuesRun) {
        avatar.dataset.clickable = 'true'; avatar.tabIndex = 0; avatar.setAttribute('role', 'button')
        avatar.addEventListener('click', () => host.openActor(messageActorId))
        avatar.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); host.openActor(messageActorId) } })
      }
      row.append(avatar, bubble)
      bubbles.appendChild(row)
      priorGroupSpeakerId = messageActorId
    } else {
      bubbles.appendChild(bubble)
      priorGroupSpeakerId = ''
    }
    for (const relay of conversationRelays.filter((entry) => entry.sourceMessageId === message.id)) {
      bubbles.appendChild(handoffActivity(host, conversation, relay))
      renderedRelayIds.add(relay.id)
      priorBurstKey = ''
    }
  }
  for (const relay of conversationRelays.filter((entry) => !renderedRelayIds.has(entry.id))) bubbles.appendChild(handoffActivity(host, conversation, relay))
  if (!host.readOnlyDevice) {
    const seenInvites = new Set<string>()
    for (const message of conversation.messages) {
      if (!message.eventSuggestion || seenInvites.has(message.eventSuggestion.id)) continue
      seenInvites.add(message.eventSuggestion.id)
      bubbles.append(eventInvite(message, conversation.id, host))
    }
  }
  if (busy?.phase === 'checking') {
    const checking = el('div', conversation.kind === 'group' ? 'lp-group-typing' : 'lp-conversation-status')
    checking.appendChild(el('span', '', conversation.kind === 'group' ? titleText : 'Checking for reply…'))
    if (conversation.kind === 'group') {
      const dots = el('span', 'lp-typing-dots'); dots.append(el('i'), el('i'), el('i')); checking.appendChild(dots)
    }
    checking.setAttribute('role', 'status')
    bubbles.appendChild(checking)
  } else if (busy) {
    const pending = el('div', conversation.kind === 'group' ? 'lp-group-typing' : 'lp-bubble lp-bubble-pending')
    const busyActor = resolvePocketActor(host.state, busy.speakerContactId)
    if (conversation.kind === 'group') pending.appendChild(el('span', '', `${busyActor?.name || 'Someone'} is typing…`))
    else pending.dataset.sender = 'contact'
    pending.setAttribute('role', 'status'); pending.setAttribute('aria-label', conversation.kind === 'group' ? `${busyActor?.name || 'Someone'} is typing` : 'Contact is typing')
    const dots = el('span', 'lp-typing-dots')
    dots.append(el('i'), el('i'), el('i'))
    pending.appendChild(dots)
    bubbles.appendChild(pending)
  }
  const availability = scenePresent && conversation.availability.state !== 'local'
    ? { state: 'local' as const, reason: 'in_scene' as const }
    : conversation.availability
  if (!replyBusy && (availability.state === 'arriving' || availability.state === 'paused' || conversation.pause)) {
    const reason = availability.state === 'local' ? LOCAL_COPY[availability.reason] : availability.state === 'arriving' ? 'is on the way.' : PAUSE_COPY[availability.state === 'paused' ? availability.reason : conversation.pause!.reason]
    const banner = el('div', availability.state === 'arriving' ? 'lp-conversation-status lp-arrival-status' : 'lp-conversation-status')
    banner.dataset.pauseReason = availability.state === 'local' ? availability.reason : availability.state === 'arriving' ? 'arriving' : availability.state === 'paused' ? availability.reason : conversation.pause!.reason
    banner.appendChild(el('span', '', `${directContact?.name || titleText} ${reason}`))
    if (availability.state === 'arriving' && directContact && !host.readOnlyDevice) {
      const activeArrivalRelay = conversationRelays.some((entry) => entry.kind === 'arrival' && entry.status === 'pending' && (entry.continuation.state === 'launching' || entry.continuation.state === 'accepted' || entry.continuation.state === 'started'))
      if (!activeArrivalRelay) {
        const continueButton = button('Continue to arrival', 'lp-handoff-action')
        continueButton.type = 'button'
        continueButton.addEventListener('click', () => host.continueArrival(conversation.id))
        banner.appendChild(continueButton)
      }
    }
    bubbles.appendChild(banner)
  }
  if (!conversation.messages.length) bubbles.appendChild(host.empty('Say hello', 'This thread is private to this Pocket roleplay state.'))

  if (host.readOnlyDevice) {
    const inspect = el('div', 'lp-conversation-status', `Viewing ${resolvePocketActor(host.state, host.deviceOwnerActorId)?.name || 'this actor'}'s Pocket · inspection mode`)
    page.append(bubbles, inspect)
    return page
  }

  if (availability.state === 'local' && !host.manualOverride) {
    if (!conversationRelays.length) bubbles.appendChild(el('div', 'lp-conversation-status', `${directContact?.name || titleText} is currently with you.`))
    page.appendChild(bubbles)
    return page
  }

  const compose = el('form', 'lp-compose')
  const sparkle = replyBusy ? button('■', 'lp-button lp-button-icon lp-reply-stop') : scenePresent || conversation.pause
    ? button('⋯', 'lp-button lp-button-icon lp-manual-reply')
    : host.iconButton('sparkle', 'Generate one contact reply')
  const selectedGroupSpeaker = conversation.kind === 'group' && memberActorIds.includes(host.selectedGroupSpeakerId) ? host.selectedGroupSpeakerId : 'auto'
  const selectedGroupActor = selectedGroupSpeaker === 'auto' ? null : resolvePocketActor(host.state, selectedGroupSpeaker)
  const generationLabel = conversation.kind === 'group' ? selectedGroupActor ? `Generate one reply from ${selectedGroupActor.name}` : 'Generate the next natural group burst' : 'Generate one contact reply'
  sparkle.setAttribute('aria-label', scenePresent ? 'Manually generate a reply while contact is here' : conversation.pause ? 'Manually generate a reply in paused conversation' : generationLabel)
  sparkle.title = scenePresent ? 'Manual reply — this contact is currently with you' : conversation.pause ? 'Manual reply — conversation is paused' : generationLabel
  if (replyBusy) {
    sparkle.setAttribute('aria-label', 'Stop generating reply')
    sparkle.title = 'Stop generating reply'
  }
  sparkle.disabled = !host.generationAvailable && !replyBusy
  const speakerMenu = el('details', 'lp-speaker-menu')
  if (conversation.kind === 'group') {
    const summary = el('summary', '', selectedGroupActor ? `Next reply: ${selectedGroupActor.name} ×` : `${memberActorIds.length} participants · Auto speaker`)
    const sheet = el('div', 'lp-speaker-sheet')
    sheet.appendChild(el('strong', '', 'Who replies?'))
    const auto = button(`${selectedGroupSpeaker === 'auto' ? '✓ ' : ''}Auto`, 'lp-speaker-option')
    auto.addEventListener('click', () => { speakerMenu.open = false; host.selectGroupSpeaker(conversation.id, 'auto') })
    sheet.appendChild(auto)
    for (const actorId of memberActorIds) {
      const actor = resolvePocketActor(host.state, actorId)
      if (!actor) continue
      const option = button(`${selectedGroupSpeaker === actor.actorId ? '✓ ' : ''}${actor.name}`, 'lp-speaker-option')
      option.addEventListener('click', () => { speakerMenu.open = false; host.selectGroupSpeaker(conversation.id, actor.actorId) })
      sheet.appendChild(option)
    }
    speakerMenu.append(summary, sheet)
  } else speakerMenu.hidden = true
  sparkle.addEventListener('click', () => replyBusy ? host.cancelReply(conversation.id) : host.generateReply(conversation.id, conversation.kind === 'group' ? selectedGroupSpeaker : counterpartIds[0]))
  const textarea = el('textarea', 'lp-textarea'); textarea.rows = 1; textarea.placeholder = 'Message…'; textarea.value = host.draft
  textarea.dataset.pocketComposer = conversation.id
  const resizeComposer = () => {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`
    textarea.style.overflowY = textarea.scrollHeight > 112 ? 'auto' : 'hidden'
  }
  textarea.addEventListener('focus', () => host.composerState(conversation.id, true))
  textarea.addEventListener('input', () => { host.updateDraft(conversation.id, textarea.value); host.composerState(conversation.id, true); resizeComposer() })
  textarea.addEventListener('blur', () => host.composerState(conversation.id, false))
  const submit = host.iconButton('send', 'Send message')
  submit.type = 'submit'
  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
    event.preventDefault()
    compose.requestSubmit()
  })
  compose.append(sparkle, textarea, submit)
  compose.addEventListener('submit', (event) => {
    event.preventDefault()
    const message = inputValue(textarea)
    if (!message) return
    host.send('lumiphone:action', { action: 'message', payload: { conversationId: conversation.id, text: message, sender: 'persona', explicitRemoteOverride: host.manualOverride } })
    textarea.value = ''
    host.updateDraft(conversation.id, '')
    resizeComposer()
  })
  const composerStack = el('div', 'lp-compose-stack')
  if (conversation.kind === 'group') composerStack.appendChild(speakerMenu)
  composerStack.appendChild(compose)
  page.append(bubbles, composerStack)
  requestAnimationFrame(() => {
    resizeComposer()
    const selected = host.selectedMessageId ? bubbles.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(host.selectedMessageId)}"]`) : null
    if (selected) selected.scrollIntoView({ block: 'center' })
    else bubbles.scrollTop = bubbles.scrollHeight
  })
  return page
}
