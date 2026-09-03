import type { PhoneMessage, PhoneState, PocketContact, PocketContextReference, PocketConversation, PocketRelay } from '../../types.js'
import { contactAvatar, contactAccent } from '../../domain/contacts.js'
import { button, el, formatTime, inputValue } from '../shared.js'
import type { PageAction } from '../shared.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface MessagesViewHost {
  state: PhoneState
  selectedConversationId: string
  selectedMessageId: string
  selectedView: 'thread' | 'new-group' | 'group-detail'
  generationAvailable: boolean
  busyConversations: Map<string, { speakerContactId: string; phase: 'checking' | 'pending' }>
  selectedGroupSpeakerId: string
  draft: string
  updateDraft(conversationId: string, value: string): void
  page(title: string, subtitle?: string, action?: PageAction): Page
  empty(title: string, copy: string): HTMLDivElement
  iconButton(name: string, label: string): HTMLButtonElement
  selectConversation(conversationId: string, view?: 'thread' | 'new-group' | 'group-detail'): void
  openContact(contactId: string): void
  send(type: string, payload?: Record<string, unknown>): void
  generateReply(conversationId: string, speakerContactId?: string): void
  selectGroupSpeaker(conversationId: string, speakerContactId: string): void
  composerState(conversationId: string, held: boolean): void
  messageAnyway(conversationId: string): void
  manualOverride: boolean
  continueRelay(): void
  openRoleplay(): void
  openTimeline(eventId: string): void
  showReferenceSheet(conversationId: string): void
  cancelReference(referenceId: string): void
  rearmReference(referenceId: string): void
  showConversationGenerationInfo(conversationId: string): void
  shouldFocusHandoff(relayId: string): boolean
  showGenerationInfo(message: PhoneMessage): void
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

function conversationTitle(state: PhoneState, conversation: PocketConversation): string {
  if (conversation.kind === 'group') return conversation.title || 'Group'
  return state.contacts.find((entry) => entry.id === conversation.participantContactIds[0])?.name || conversation.title || conversation.messages.at(-1)?.senderName || 'Conversation'
}

function groupEditor(host: MessagesViewHost, conversation: PocketConversation | null): HTMLDivElement {
  let saveGroup = () => {}
  const { page, content } = host.page(conversation ? 'Group Details' : 'New Group', 'Choose at least two contacts', { label: 'Save', callback: () => saveGroup() })
  const title = el('input', 'lp-input')
  title.placeholder = 'Group name'
  title.value = conversation?.title || ''
  const choices = el('div', 'lp-contact-checklist')
  const selected = new Set(conversation?.participantContactIds || [])
  for (const contact of host.state.contacts) {
    const row = el('label', 'lp-card lp-row-between')
    const copy = el('span')
    copy.append(el('strong', '', contact.name), el('span', 'lp-copy', contact.role))
    const checkbox = el('input')
    checkbox.type = 'checkbox'; checkbox.value = contact.id; checkbox.checked = selected.has(contact.id)
    row.append(copy, checkbox)
    choices.appendChild(row)
  }
  saveGroup = () => {
    const participantContactIds = [...choices.querySelectorAll<HTMLInputElement>('input:checked')].map((entry) => entry.value)
    host.send(conversation ? 'lumiphone:update_conversation' : 'lumiphone:create_conversation', {
      conversationId: conversation?.id, title: title.value.trim(), participantContactIds,
    })
  }
  content.append(title, choices)
  if (conversation) {
    const remove = button('Delete group', 'lp-button lp-button-danger')
    remove.addEventListener('click', () => host.send('lumiphone:delete', { kind: 'conversation', id: conversation.id }))
    content.appendChild(remove)
  }
  return page
}

function participantAvatar(contact: PocketContact, continuation = false): HTMLDivElement {
  const node = el('div', continuation ? 'lp-group-avatar lp-group-avatar-spacer' : 'lp-group-avatar', contact.name.slice(0, 1).toUpperCase())
  node.style.setProperty('--message-accent', contactAccent(contact))
  if (!continuation && contactAvatar(contact)) {
    const image = el('img'); image.src = contactAvatar(contact); image.alt = ''; node.replaceChildren(image)
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
  const title = completed ? 'Continued in roleplay' : failed ? 'Couldn’t continue in roleplay' : generating ? 'Continuing in roleplay…' : accepted ? 'Host accepted the handoff' : 'Preparing roleplay handoff…'
  const subtitle = completed ? `${actor} continued in the main RP.` : failed ? continuation.error || relay.injectionError || 'The handoff is still pending.' : generating ? 'Pocket delivered the conversation context to the scene.' : accepted ? 'Waiting for relay injection.' : 'Gathering the latest phone exchange.'
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
  const selectedConversation = host.state.conversations.find((item) => item.id === host.selectedConversationId) || null
  if (host.selectedView === 'new-group') return groupEditor(host, null)
  if (selectedConversation?.kind === 'group' && host.selectedView === 'group-detail') return groupEditor(host, selectedConversation)

  if (!selectedConversation) {
    const conversations = [...host.state.conversations].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    const { page, content } = host.page('Messages', `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`, {
      label: 'New Group', callback: () => host.selectConversation('', 'new-group'), enabled: host.state.contacts.length >= 2,
    })
    for (const conversation of conversations) {
      const card = el('div', 'lp-card')
      card.dataset.clickable = 'true'; card.tabIndex = 0; card.setAttribute('role', 'button')
      const row = el('div', 'lp-row')
      const titleText = conversationTitle(host.state, conversation)
      const avatar = el('div', 'lp-avatar', conversation.kind === 'group' ? String(conversation.participantContactIds.length) : titleText.slice(0, 1).toUpperCase())
      const directContact = conversation.kind === 'direct' ? host.state.contacts.find((entry) => entry.id === conversation.participantContactIds[0]) : null
      if (directContact && contactAvatar(directContact)) {
        const image = el('img'); image.src = contactAvatar(directContact); image.alt = ''; avatar.replaceChildren(image)
      }
      const latest = conversation.messages.at(-1)
      const copy = el('div', 'lp-grow')
      const nameRow = el('div', 'lp-row-between')
      nameRow.append(el('h3', 'lp-title', titleText), el('span', 'lp-copy', latest ? formatTime(latest.createdAt) : ''))
      copy.append(nameRow, el('p', 'lp-copy', latest ? `${conversation.kind === 'group' && latest.sender === 'contact' ? `${latest.senderName}: ` : ''}${latest.text}` : 'Start a conversation'))
      row.append(avatar, copy)
      if (conversation.unread) row.appendChild(el('span', 'lp-unread', String(conversation.unread)))
      card.appendChild(row)
      const open = () => host.selectConversation(conversation.id)
      card.addEventListener('click', open)
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open() } })
      content.appendChild(card)
    }
    if (!conversations.length) content.appendChild(host.empty('No conversations yet', 'Open Contacts to message a character, Council member, or Pocket NPC.'))
    return page
  }

  const conversation = selectedConversation
  const titleText = conversationTitle(host.state, conversation)
  const page = el('div', 'lp-thread')
  const nav = el('header', 'lp-nav')
  const back = button('‹ Back', 'lp-nav-action')
  back.addEventListener('click', () => host.back())
  const title = el('div', 'lp-nav-title', titleText)
  title.appendChild(el('span', 'lp-nav-subtitle', conversation.kind === 'group' ? `${conversation.participantContactIds.length} contacts` : 'Direct message'))
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
    else host.openContact(conversation.participantContactIds[0])
  }))
  const referenceAction = menuAction('Reference in roleplay', () => host.showReferenceSheet(conversation.id))
  referenceAction.disabled = !conversation.messages.some((message) => message.sender !== 'system')
  menuSheet.appendChild(referenceAction)
  menuSheet.appendChild(menuAction('View Timeline', () => host.openTimeline('')))
  menuSheet.appendChild(menuAction('Generation info', () => host.showConversationGenerationInfo(conversation.id)))
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
  const directContact = conversation.kind === 'direct' ? host.state.contacts.find((entry) => entry.id === conversation.participantContactIds[0]) : null
  const scenePresent = Boolean(directContact?.presence.inScene)
  const bubbles = el('div', 'lp-bubbles')
  bubbles.dataset.pocketThread = conversation.id
  const conversationRelays = host.state.relays.filter((entry) => entry.conversationId === conversation.id && entry.status !== 'dismissed')
  const renderedRelayIds = new Set<string>()
  let priorGroupSpeakerId = ''
  for (const message of conversation.messages) {
    const bubble = el('div', 'lp-bubble')
    bubble.dataset.messageId = message.id
    bubble.dataset.selected = String(message.id === host.selectedMessageId)
    bubble.dataset.sender = message.sender
    const senderContact = message.sender === 'contact' ? host.state.contacts.find((entry) => entry.id === message.senderContactId) : undefined
    const resolvedAccent = senderContact ? contactAccent(senderContact) : message.senderAccent || (directContact ? contactAccent(directContact) : '')
    if (message.sender === 'contact') bubble.style.setProperty('--message-accent', resolvedAccent)
    const continuesRun = conversation.kind === 'group' && message.sender === 'contact' && priorGroupSpeakerId === message.senderContactId
    if (conversation.kind === 'group' && message.sender === 'contact' && !continuesRun) bubble.appendChild(el('strong', 'lp-bubble-sender', senderContact?.name || message.senderName))
    bubble.append(document.createTextNode(message.text), el('span', 'lp-bubble-time', `${formatTime(message.createdAt)} · ${message.status}`))
    if (message.generation) {
      const retry = button('Retry', 'lp-bubble-action')
      retry.type = 'button'
      retry.setAttribute('aria-label', `Retry message from ${message.senderName}`)
      retry.addEventListener('click', () => host.send('lumiphone:retry_message', { conversationId: conversation.id, messageId: message.id }))
      const generationInfo = button('Generation info', 'lp-bubble-action')
      generationInfo.type = 'button'
      generationInfo.addEventListener('click', () => host.showGenerationInfo(message))
      bubble.append(retry, generationInfo)
    }
    if (conversation.kind === 'group' && message.sender === 'contact' && senderContact) {
      const row = el('div', 'lp-group-message')
      row.style.setProperty('--message-accent', resolvedAccent)
      row.dataset.continuation = String(continuesRun)
      row.append(participantAvatar(senderContact, continuesRun), bubble)
      bubbles.appendChild(row)
      priorGroupSpeakerId = senderContact.id
    } else {
      bubbles.appendChild(bubble)
      priorGroupSpeakerId = ''
    }
    for (const relay of conversationRelays.filter((entry) => entry.sourceMessageId === message.id)) {
      bubbles.appendChild(handoffActivity(host, conversation, relay))
      renderedRelayIds.add(relay.id)
    }
  }
  for (const relay of conversationRelays.filter((entry) => !renderedRelayIds.has(entry.id))) bubbles.appendChild(handoffActivity(host, conversation, relay))
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
    const busyContact = host.state.contacts.find((entry) => entry.id === busy.speakerContactId)
    if (conversation.kind === 'group') pending.appendChild(el('span', '', `${busyContact?.name || 'Someone'} is typing…`))
    else pending.dataset.sender = 'contact'
    pending.setAttribute('role', 'status'); pending.setAttribute('aria-label', conversation.kind === 'group' ? `${busyContact?.name || 'Someone'} is typing` : 'Contact is typing')
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
    const banner = el('div', 'lp-conversation-status', `${directContact?.name || titleText} ${reason}`)
    banner.dataset.pauseReason = availability.state === 'local' ? availability.reason : availability.state === 'arriving' ? 'arriving' : availability.state === 'paused' ? availability.reason : conversation.pause!.reason
    bubbles.appendChild(banner)
  }
  if (!conversation.messages.length) bubbles.appendChild(host.empty('Say hello', 'This thread is private to this Pocket roleplay state.'))

  if (availability.state === 'local' && !host.manualOverride) {
    if (!conversationRelays.length) bubbles.appendChild(el('div', 'lp-conversation-status', `${directContact?.name || titleText} is currently with you.`))
    page.appendChild(bubbles)
    return page
  }

  const compose = el('form', 'lp-compose')
  const sparkle = scenePresent || conversation.pause
    ? button('⋯', 'lp-button lp-button-icon lp-manual-reply')
    : host.iconButton('sparkle', 'Generate one contact reply')
  const selectedGroupSpeaker = conversation.kind === 'group' && conversation.participantContactIds.includes(host.selectedGroupSpeakerId) ? host.selectedGroupSpeakerId : 'auto'
  const selectedGroupContact = selectedGroupSpeaker === 'auto' ? null : host.state.contacts.find((entry) => entry.id === selectedGroupSpeaker)
  const generationLabel = conversation.kind === 'group' ? selectedGroupContact ? `Generate one reply from ${selectedGroupContact.name}` : 'Generate the next natural group burst' : 'Generate one contact reply'
  sparkle.setAttribute('aria-label', scenePresent ? 'Manually generate a reply while contact is here' : conversation.pause ? 'Manually generate a reply in paused conversation' : generationLabel)
  sparkle.title = scenePresent ? 'Manual reply — this contact is currently with you' : conversation.pause ? 'Manual reply — conversation is paused' : generationLabel
  sparkle.disabled = !host.generationAvailable || replyBusy
  const speakerMenu = el('details', 'lp-speaker-menu')
  if (conversation.kind === 'group') {
    const summary = el('summary', '', selectedGroupContact ? `Next reply: ${selectedGroupContact.name} ×` : `${conversation.participantContactIds.length} contacts · Auto speaker`)
    const sheet = el('div', 'lp-speaker-sheet')
    sheet.appendChild(el('strong', '', 'Who replies?'))
    const auto = button(`${selectedGroupSpeaker === 'auto' ? '✓ ' : ''}Auto`, 'lp-speaker-option')
    auto.addEventListener('click', () => { speakerMenu.open = false; host.selectGroupSpeaker(conversation.id, 'auto') })
    sheet.appendChild(auto)
    for (const contactId of conversation.participantContactIds) {
      const contact = host.state.contacts.find((entry) => entry.id === contactId)
      if (!contact) continue
      const option = button(`${selectedGroupSpeaker === contact.id ? '✓ ' : ''}${contact.name}`, 'lp-speaker-option')
      option.addEventListener('click', () => { speakerMenu.open = false; host.selectGroupSpeaker(conversation.id, contact.id) })
      sheet.appendChild(option)
    }
    speakerMenu.append(summary, sheet)
  } else speakerMenu.hidden = true
  sparkle.addEventListener('click', () => host.generateReply(conversation.id, conversation.kind === 'group' ? selectedGroupSpeaker : conversation.participantContactIds[0]))
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
