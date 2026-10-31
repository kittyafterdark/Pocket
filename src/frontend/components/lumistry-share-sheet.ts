import type { PhoneState } from '../../types.js'
import { hiddenDatingContact } from '../../domain/lumistry.js'
import { createLumistryCapture, lumistryCaptureText, ordinaryCaptureTarget, type LumistryCaptureRequest } from '../../domain/lumistry-sharing.js'
import { renderLumistryCapture } from './lumistry-capture.js'
import { button, el } from '../shared.js'
import { fieldBlock } from './ui.js'

export function lumistryShareSheet(options: {
  state: PhoneState
  sourceConversationId?: string
  targetConversationId?: string
  send(payload: Record<string, unknown>): void
  dismiss(): void
}): HTMLDivElement {
  const { state } = options
  const content = el('div', 'lp-stack')
  content.append(el('p', 'lp-copy', 'Choose what to show your friend. Photos share their saved descriptions. Preview contains exactly the captured excerpt, up to six items.'))
  const mode = el('select', 'lp-select')
  for (const [value, label] of [['screenshot', 'Conversation screenshot'], ['message_photos', 'Chat photos'], ['profile_photos', 'Profile photos']]) {
    const option = el('option', '', label); option.value = value; mode.append(option)
  }
  const source = el('select', 'lp-select'), target = el('select', 'lp-select')
  const targets = state.conversations.filter(c => ordinaryCaptureTarget(state, c) && !(c.participantActorIds || c.participantContactIds).some(id => hiddenDatingContact(state, id)))
  const blank = el('option', '', 'Choose a friend’s conversation'); blank.value = ''; target.append(blank)
  for (const c of targets) { const option = el('option', '', c.title); option.value = c.id; target.append(option) }
  target.value = options.targetConversationId || ''
  const choices = el('div', 'lp-reference-message-list'), preview = el('div', 'lp-stack')
  const caption = el('textarea', 'lp-textarea'); caption.rows = 2; caption.maxLength = 500; caption.placeholder = 'Look what they sent me…'
  const error = el('p', 'lp-copy'); error.setAttribute('role', 'status')
  const send = button('Send to friend', 'lp-button lp-button-primary')
  let selected = new Set<string>(), request: LumistryCaptureRequest | undefined, previewText = ''
  const update = () => {
    request = undefined; previewText = ''; preview.replaceChildren(); error.textContent = ''
    if (!targets.length) error.textContent = 'Open a normal conversation with a friend first.'
    try {
      if (!selected.size) { send.disabled = true; return }
      const kind = mode.value as LumistryCaptureRequest['kind']
      const draft: LumistryCaptureRequest = { kind, caption: caption.value, ...(kind === 'profile_photos' ? { profileId: source.value, photoIndexes: [...selected].map(Number) } : { conversationId: source.value, messageIds: [...selected] }) }
      const capture = createLumistryCapture(state, draft)
      preview.append(renderLumistryCapture(capture))
      request = draft; previewText = lumistryCaptureText(capture)
    } catch (e) { error.textContent = e instanceof Error ? e.message : 'Unable to preview.' }
    send.disabled = !request || !target.value
  }
  const renderChoices = () => {
    selected = new Set(); choices.replaceChildren()
    const add = (id: string, label: string) => {
      const row = el('label', 'lp-reference-message-choice'), check = el('input'); check.type = 'checkbox'
      const copy = el('span', 'lp-copy', label)
      check.addEventListener('change', () => {
        if (check.checked && selected.size >= 6) { check.checked = false; error.textContent = 'Choose up to six items.'; return }
        if (check.checked) selected.add(id); else selected.delete(id)
        update()
      })
      row.append(check, copy); choices.append(row)
    }
    if (mode.value === 'profile_photos') {
      const profile = state.lumistry?.[state.pocketPersonaActorId]?.profiles.find(p => p.id === source.value)
      profile?.photoPlan.forEach((photo, i) => { if (photo.description) add(String(i), `${photo.caption || `Photo ${i + 1}`} · ${photo.description}`) })
    } else {
      const conversation = state.conversations.find(c => c.id === source.value)
      for (const m of conversation?.messages.filter(m => m.sender !== 'system' && m.candidateCommitState !== 'provisional' && (mode.value !== 'message_photos' || m.datingPhoto?.description)) || []) {
        // Alias labels are supplied by the capture builder, never native actor identities.
        const single = createLumistryCapture(state, { kind: mode.value as 'screenshot' | 'message_photos', conversationId: source.value, messageIds: [m.id] })
        const row = single.entries[0]
        add(m.id, `${row.speaker}: ${row.text}${row.photoDescription ? ` · Photo: ${row.photoDescription}` : ''}`)
      }
    }
    if (!choices.childElementCount) choices.append(el('p', 'lp-copy', 'No saved items available here.'))
    update()
  }
  const sources = () => {
    source.replaceChildren()
    const data = state.lumistry?.[state.pocketPersonaActorId]
    if (mode.value === 'profile_photos') {
      for (const p of data?.profiles || []) if (p.photoPlan.some(photo => photo.description)) { const option = el('option', '', p.alias); option.value = p.id; source.append(option) }
    } else {
      for (const c of state.conversations.filter(c => c.channel === 'dating' && c.datingOwnerId === state.pocketPersonaActorId && c.includesPocketPersona)) {
        const decision = data?.decisions.find(d => d.conversationId === c.id), profile = data?.profiles.find(p => p.id === decision?.profileId)
        if (!profile) continue
        const option = el('option', '', profile.alias); option.value = c.id; source.append(option)
      }
      if (options.sourceConversationId && [...source.options].some(o => o.value === options.sourceConversationId)) source.value = options.sourceConversationId
    }
    renderChoices()
  }
  mode.addEventListener('change', sources); source.addEventListener('change', renderChoices)
  target.addEventListener('change', update); caption.addEventListener('input', update)
  send.addEventListener('click', () => {
    if (!request || !target.value) return
    send.disabled = true
    options.send({ action: 'message', payload: { conversationId: target.value, sender: 'persona', text: previewText, lumistryCapture: { ...request, previewText } } })
    options.dismiss()
  })
  content.append(fieldBlock('Share', mode), fieldBlock('From Lumistry', source), choices, fieldBlock('Send to', target), fieldBlock('Your comment (optional)', caption), preview, error, send)
  sources()
  return content
}
