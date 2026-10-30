import type { PhoneCapabilities, PhoneState, PocketContact, PocketContactDraft, PocketContactSourceOption, PocketNpcBankEntry, PocketOperationProgress, PocketRoute, PocketContactGroup } from '../../types.js'
import { renderContactGroups } from './contact-groups.js'
import { renderContactDirectory, renderContactImport, type ContactBrowserSession } from './contacts-browser.js'
import type { IdentityProfile } from '../../domain/identity-profiles.js'
import { identityProfileControls } from '../components/identity-profiles.js'
import { contactAccent, contactAvatar } from '../../domain/contacts.js'
import { button, el, formatDate } from '../shared.js'
import type { PageAction } from '../shared.js'
import { actionGroup, controlRow, disclosure, fieldBlock, identityBlock, sectionBlock } from '../components/ui.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }
export type ContactView = NonNullable<Extract<PocketRoute, { app: 'contacts' }>['view']>

export interface ContactsViewHost {
  browser?: ContactBrowserSession
  identityProfiles?: IdentityProfile[]
  state: PhoneState
  selectedContactId: string
  selectedView: ContactView
  selectedGroupId: string
  bankGroups: PocketContactGroup[]
  collectionDraft: Record<string, unknown> | undefined
  collectionSaving: boolean
  updateCollectionDraft(draft: Record<string, unknown>): void
  saveCollection(type: string, payload: Record<string, unknown>): void
  selectGroup(id: string, view: ContactView): void
  startGroup(name: string, memberIds: string[]): void
  generationBrief: string
  updateGenerationBrief(brief: string): void
  npcDraft: PocketContactDraft | null
  previousNpcDraft: PocketContactDraft | null
  sources: PocketContactSourceOption[]
  npcBank: PocketNpcBankEntry[]
  capabilities: PhoneCapabilities | null
  operations: Map<string, PocketOperationProgress>
  page(title: string, subtitle?: string, action?: PageAction): Page
  empty(title: string, copy: string): HTMLDivElement
  select(contactId: string, view?: ContactView, replace?: boolean): void
  restorePreviousNpcDraft(): void
  openDirect(contactId: string): void
  choosePhoto(contactId?: string): void
  uploadPhoto(contactId?: string): void
  generatePhoto(contactId: string): void
  generateDraftPhoto(): void
  useSourcePhoto(contactId: string): void
  requestSources(): void
  send(type: string, payload?: Record<string, unknown>): void
  showError(message: string): void
}

function avatar(contact: PocketContact): HTMLDivElement {
  const node = el('div', 'lp-avatar', contact.name.slice(0, 1).toUpperCase())
  node.style.setProperty('--contact-accent', contactAccent(contact))
  if (contactAvatar(contact)) {
      const image = el('img'); image.src = contactAvatar(contact); image.alt = ''; image.style.objectPosition = `${contact.avatarFocus?.x ?? 50}% ${contact.avatarFocus?.y ?? 50}%`; node.replaceChildren(image)
  }
  return node
}

function draftPayload(draft: PocketContactDraft): Record<string, unknown> {
  return {
    name: draft.name, role: draft.role, identityBrief: draft.identityBrief, description: draft.identityBrief, phoneProfile: draft.phoneProfile,
    accent: draft.accent, colorMode: 'pocket', messagingStyle: draft.messagingStyle,
    avatarOverrideUrl: draft.avatarUrl || '', avatarSource: draft.avatarSource, avatarFocus: draft.avatarFocus,
    source: { kind: 'npc', origin: 'generated', description: draft.identityBrief },
    presence: { inScene: false, lastSceneAt: '' }, contextPolicy: { pinned: false }, generationPolicy: { relevant: true },
    messagingPolicy: { remoteEligible: true, allowAmbientInScene: false, lastInitiatedMessageAt: '', lastInitiatedRoleplayAt: '' },
  }
}

function contactEditor(host: ContactsViewHost, contact: PocketContact | null, draft: PocketContactDraft | null = null): HTMLDivElement {
  let saveContact = () => {}
  const { page, content } = host.page(contact ? 'Contact Settings' : draft ? 'Edit Draft' : 'New Contact', contact?.source.kind || (draft ? 'Generated preview · unsaved' : 'Pocket NPC'), { label: 'Save', callback: () => saveContact() })
  page.classList.add('lp-contact-create')
  const name = el('input', 'lp-input'); name.placeholder = 'Name'; name.value = contact?.name || draft?.name || ''
  const role = el('input', 'lp-input'); role.placeholder = 'Role'; role.value = contact?.role || draft?.role || ''
  const description = el('textarea', 'lp-textarea'); description.placeholder = 'Compact profile — stable identity, role, relationship'; description.maxLength = 500; description.value = contact?.identityBrief || contact?.description || draft?.identityBrief || ''
  const phoneProfile = contact?.phoneProfile || draft?.phoneProfile || { personality: '', appearance: '', textingStyle: '' }
  const personality = el('textarea', 'lp-textarea'); personality.placeholder = 'Personality — stable traits that shape conversation'; personality.maxLength = 600; personality.value = phoneProfile.personality
  const appearance = el('textarea', 'lp-textarea'); appearance.placeholder = 'Minimal appearance — only a few recognizable details'; appearance.maxLength = 360; appearance.value = phoneProfile.appearance
  const textingStyle = el('textarea', 'lp-textarea'); textingStyle.placeholder = 'Texting quirks — casing, punctuation, slang/register, emoji/kaomoji habits, fragmentation…'; textingStyle.maxLength = 600; textingStyle.value = phoneProfile.textingStyle
  const sceneNote = el('textarea', 'lp-textarea'); sceneNote.placeholder = 'Current scene note — temporary state, objective, or reason they are here'; sceneNote.maxLength = 600; sceneNote.value = contact?.sceneNote || ''
  const accent = el('input', 'lp-color-input'); accent.type = 'color'; accent.value = /^#[0-9a-f]{6}$/i.test(contact?.accent || draft?.accent || '') ? (contact?.accent || draft!.accent) : '#8b7dff'
  const colorRow = controlRow('Contact color', accent)
  const colorMode = el('select', 'lp-select')
  for (const [value, label] of [['pocket', 'Pocket color'], ['source', contact?.sourceAccent ? 'Inherit source color' : 'Inherit source color (unavailable)']] as const) {
    const option = el('option', '', label); option.value = value; option.selected = (contact?.colorMode || 'pocket') === value; option.disabled = value === 'source' && !contact?.sourceAccent; colorMode.appendChild(option)
  }
  const colorModeLabel = fieldBlock('Color source', colorMode)
  const relationship = el('select', 'lp-select')
  for (const [value, label] of [['background', 'Background / plot actor'], ['close', 'Close to this character']] as const) {
    const option = el('option', '', label); option.value = value; option.selected = (contact?.relationship || 'background') === value; relationship.appendChild(option)
  }
  const relationshipLabel = fieldBlock('Relationship importance', relationship)
  const inScene = el('input'); inScene.type = 'checkbox'; inScene.checked = contact?.presence.inScene || false
  const sceneRow = controlRow('Here in current scene', inScene)
  const pinned = el('input'); pinned.type = 'checkbox'; pinned.checked = contact?.contextPolicy.pinned || false
  const pinRow = controlRow('Pin compact brief to model context', pinned)
  const relevant = el('input'); relevant.type = 'checkbox'; relevant.checked = contact?.generationPolicy.relevant ?? true
  const relevantRow = controlRow('Relevant to Pocket generation', relevant)
  const remote = el('input'); remote.type = 'checkbox'; remote.checked = contact?.messagingPolicy.remoteEligible ?? true
  const remoteRow = controlRow('Eligible for remote messages', remote)
  const ambientHere = el('input'); ambientHere.type = 'checkbox'; ambientHere.checked = contact?.messagingPolicy.allowAmbientInScene || false
  const ambientHereRow = controlRow('Allow ambient texts while in scene', ambientHere)
  const style = contact?.messagingStyle || draft?.messagingStyle || { talkativeness: 50, fragmentation: 35 }
  const talkativeness = el('input'); talkativeness.type = 'range'; talkativeness.min = '0'; talkativeness.max = '100'; talkativeness.value = String(style.talkativeness)
  const talkValue = el('span', 'lp-copy', `${talkativeness.value}%`); talkativeness.addEventListener('input', () => { talkValue.textContent = `${talkativeness.value}%` })
  const talkHead = el('span', 'lp-row-between'); talkHead.append(el('strong', '', 'Talkativeness'), talkValue)
  const talkEnds = el('span', 'lp-range-ends'); talkEnds.append(el('span', '', 'Quiet'), el('span', '', 'Chatty'))
  const talkRow = el('label', 'lp-style-control'); talkRow.append(talkHead, talkativeness, talkEnds)
  const fragmentation = el('input'); fragmentation.type = 'range'; fragmentation.min = '0'; fragmentation.max = '100'; fragmentation.value = String(style.fragmentation)
  const fragmentValue = el('span', 'lp-copy', `${fragmentation.value}%`); fragmentation.addEventListener('input', () => { fragmentValue.textContent = `${fragmentation.value}%` })
  const fragmentHead = el('span', 'lp-row-between'); fragmentHead.append(el('strong', '', 'Texting style'), fragmentValue)
  const fragmentEnds = el('span', 'lp-range-ends'); fragmentEnds.append(el('span', '', 'Compact'), el('span', '', 'Bursty'))
  const fragmentRow = el('label', 'lp-style-control'); fragmentRow.append(fragmentHead, fragmentation, fragmentEnds)
  let photoCard: HTMLElement | null = null
  if (contact) {
    const { section, body } = sectionBlock(
      'Contact photo',
      contact.sourceAvatarUrl ? 'Uses the linked source image unless you choose a Pocket override.' : 'Choose any Pocket/Lumiverse gallery image as a local override.',
      'lp-card lp-contact-photo-editor',
    )
    const actions = actionGroup()
    const choosePhoto = button('Choose from Gallery', 'lp-button lp-button-quiet')
    choosePhoto.addEventListener('click', () => host.choosePhoto(contact.id))
    actions.appendChild(choosePhoto)
    const uploadPhoto = button('Upload avatar', 'lp-button lp-button-quiet'); uploadPhoto.disabled = !host.capabilities?.images
    uploadPhoto.addEventListener('click', () => host.uploadPhoto(contact.id)); actions.append(uploadPhoto)
    const generatePhoto = button('Quick Generate', 'lp-button')
    generatePhoto.addEventListener('click', () => host.generatePhoto(contact.id))
    actions.appendChild(generatePhoto)
    if (contact.sourceAvatarUrl && contact.avatarOverrideUrl) {
      const sourcePhoto = button('Use linked image', 'lp-button lp-button-quiet')
      sourcePhoto.addEventListener('click', () => host.useSourcePhoto(contact.id))
      actions.appendChild(sourcePhoto)
    }
    body.append(avatar(contact), actions)
    photoCard = section
  }
  saveContact = () => {
    if (!name.value.trim()) { host.showError('A contact needs a name.'); return }
    host.send('lumiphone:save_contact', { contact: {
      id: contact?.id, name: name.value.trim(), role: role.value.trim(), identityBrief: description.value.trim(), description: description.value.trim(),
      phoneProfile: {
        personality: personality.value.trim(),
        appearance: appearance.value.trim(),
        textingStyle: textingStyle.value.trim(),
      }, sceneNote: sceneNote.value.trim(), accent: accent.value, colorMode: colorMode.value,
      relationship: relationship.value,
      presence: { inScene: inScene.checked, lastSceneAt: inScene.checked ? new Date().toISOString() : contact?.presence.lastSceneAt || '' },
      contextPolicy: { pinned: pinned.checked },
      generationPolicy: { relevant: relevant.checked },
      messagingPolicy: {
        remoteEligible: remote.checked, allowAmbientInScene: ambientHere.checked,
        lastInitiatedMessageAt: contact?.messagingPolicy.lastInitiatedMessageAt || '',
        lastInitiatedRoleplayAt: contact?.messagingPolicy.lastInitiatedRoleplayAt || '',
      },
      messagingStyle: { talkativeness: Number(talkativeness.value), fragmentation: Number(fragmentation.value) },
      ...(draft ? { avatarOverrideUrl: draft.avatarUrl || '', avatarSource: draft.avatarSource, avatarFocus: draft.avatarFocus } : {}),
      source: contact?.source || (draft ? { kind: 'npc', origin: 'generated', description: description.value.trim() } : { kind: 'npc', origin: 'manual', description: description.value.trim() }),
    } })
  }
  if (photoCard) content.appendChild(photoCard)
  content.append(
    fieldBlock('Name', name),
    fieldBlock('Role', role),
    fieldBlock('Compact profile', description, 'Stable identity, role, and relationship summary.'),
    fieldBlock('Personality', personality, 'Stable social and temperamental traits that shape conversation.'),
    fieldBlock('Minimal appearance', appearance, 'Only recognizable details worth occasional reference in texts.'),
    fieldBlock('Texting quirks', textingStyle, 'Casing, punctuation, slang/register, dialect when established, emoji or kaomoji habits, abbreviations, and message rhythm.'),
    fieldBlock('Current scene note', sceneNote, 'Temporary state, objective, or reason they are here.'),
    colorRow, colorModeLabel, relationshipLabel, talkRow, fragmentRow,
    sceneRow, pinRow, relevantRow, remoteRow, ambientHereRow,
  )
  if (contact) {
    if (contact.source.kind === 'character') content.append(identityProfileControls(host.identityProfiles || [], 'character', contact.id, host.send, () => ({ name: name.value, role: role.value, identityBrief: description.value, phoneProfile: { personality: personality.value, appearance: appearance.value, textingStyle: textingStyle.value } })))
    if (contact.avatarOverrideUrl && contact.sourceAvatarUrl) {
      const sourcePhoto = button('Use source photo', 'lp-button lp-button-quiet')
      sourcePhoto.addEventListener('click', () => host.send('lumiphone:set_contact_photo', { contactId: contact.id, useSource: true }))
      content.appendChild(sourcePhoto)
    }
    const remove = button('Delete contact', 'lp-button lp-button-danger')
    remove.addEventListener('click', () => { host.send('lumiphone:delete', { kind: 'contact', id: contact.id }); host.select('', 'list') })
    content.appendChild(remove)
  }
  return page
}

function importView(host: ContactsViewHost): HTMLDivElement {
  return renderContactImport(host)
}

function quickGenerateView(host: ContactsViewHost): HTMLDivElement {
  const active=[...host.operations.values()].find(entry=>entry.task==='npc-contact'&&!['complete','error'].includes(entry.phase))
  const draft=host.npcDraft
  const {page,content}=host.page(draft?'Review contact':'Quick Generate',active?'Writing profile…':draft?'Unsaved profile':'Make someone for this story')
  page.classList.add('lp-npc-review')
  if(draft){
    if(draft.avatarUrl){const image=el('img','lp-npc-review-photo');image.src=draft.avatarUrl;image.alt=`${draft.name} portrait`;image.style.objectPosition=`${draft.avatarFocus?.x??50}% ${draft.avatarFocus?.y??50}%`;content.append(image)}
    else {const placeholder=el('div','lp-npc-review-placeholder',draft.name.slice(0,1));placeholder.setAttribute('aria-hidden','true');content.append(placeholder)}
    const heading=el('div','lp-npc-review-heading');heading.append(el('h2','',draft.name),el('p','lp-copy',draft.role))
    const details=disclosure('Profile details',el('p','lp-copy',draft.identityBrief))
    if(draft.phoneProfile?.personality)details.append(el('p','lp-copy',draft.phoneProfile.personality))
    const save=button(draft.avatarUrl?`Save ${draft.name}`:'Save without photo','lp-button lp-button-primary')
    save.disabled=Boolean(active)||Boolean(host.collectionSaving)
    if(host.collectionSaving)save.textContent='Saving contact…'
    save.onclick=()=>{save.disabled=true;save.textContent='Saving contact…';host.saveCollection('lumiphone:save_contact',{contact:draftPayload(draft)})}
    const portraits=el('div','lp-npc-review-tools');portraits.setAttribute('role','group');portraits.setAttribute('aria-label','Contact portrait')
    const gallery=button('Gallery','lp-button lp-button-quiet');gallery.disabled=!host.capabilities?.images;gallery.onclick=()=>host.choosePhoto()
    const upload=button('Upload','lp-button lp-button-quiet');upload.disabled=!host.capabilities?.images;upload.onclick=()=>host.uploadPhoto()
    const generate=button(draft.avatarUrl?'Retake portrait':'Generate portrait','lp-button lp-button-quiet');generate.disabled=!host.capabilities?.imageGen||Boolean(active);generate.onclick=()=>host.generateDraftPhoto()
    portraits.append(gallery,upload,generate)
    const secondary=el('div','lp-npc-review-tools'),edit=button('Edit profile','lp-directory-link'),retry=button('Regenerate profile','lp-directory-link')
    edit.onclick=()=>host.select('','draft');retry.disabled=Boolean(active)||!host.capabilities?.generation
    retry.onclick=()=>host.send('lumiphone:generate_contact',{description:draft.sourceDescription})
    secondary.append(edit,retry)
    if(host.previousNpcDraft){const previous=button('Previous version','lp-directory-link');previous.onclick=()=>host.restorePreviousNpcDraft();secondary.append(previous)}
    content.append(heading,save,portraits,details,secondary)
  }else{
    const brief=el('textarea','lp-textarea');brief.value=host.generationBrief;brief.rows=4;brief.maxLength=2000;brief.placeholder='A sleepy florist with a sharp wit…';brief.oninput=()=>host.updateGenerationBrief(brief.value)
    const generate=button(active?'Generating…':'Generate NPC','lp-button lp-button-primary');generate.disabled=Boolean(active)||!host.capabilities?.generation
    generate.onclick=()=>{if(!brief.value.trim()){brief.focus();return}generate.disabled=true;host.send('lumiphone:generate_contact',{description:brief.value.trim()})}
    content.append(fieldBlock('Character brief',brief),generate)
    const manual=button('Create manually','lp-directory-link');manual.onclick=()=>host.select('','new');content.append(manual)
  }
  if(active){const progress=el('div','lp-operation-progress');progress.dataset.operationRequest=active.requestId;progress.dataset.phase=active.phase;progress.setAttribute('role','status');const message=el('strong','',active.message||'Writing profile…');message.dataset.operationMessage='true';progress.append(el('span','lp-indeterminate'),message);content.append(progress)}
  return page
}

export function renderContactsView(host: ContactsViewHost): HTMLDivElement {
  if (['groups', 'group-config', 'bank', 'cast-config', 'cast-import', 'bank-entry'].includes(host.selectedView)) return renderContactGroups(host)
  if (host.selectedView === 'quick-gen') return quickGenerateView(host)
  const contact = host.state.contacts.find((entry) => entry.id === host.selectedContactId) || null
  if (host.selectedView === 'import') { host.requestSources(); return importView(host) }
  if (host.selectedView === 'draft' && host.npcDraft) return contactEditor(host, null, host.npcDraft)
  if (host.selectedView === 'new') return contactEditor(host, null)
  if (contact && host.selectedView === 'config') return contactEditor(host, contact)
  if (contact && host.selectedView === 'detail') {
    const { page, content } = host.page(contact.name, contact.role, { label: 'Edit', callback: () => host.select(contact.id, 'config') })
    const hero = el('div', 'lp-card lp-contact-detail')
    hero.append(avatar(contact), identityBlock({ name: contact.name, description: contact.identityBrief || contact.description || 'No compact identity brief.', prominent: true, centered: true }))
    if (contact.sceneNote) hero.append(el('p', 'lp-scene-note', contact.sceneNote))
    const phoneProfile = contact.phoneProfile
    if (phoneProfile && (phoneProfile.personality || phoneProfile.appearance || phoneProfile.textingStyle)) {
      const profileCard = el('div', 'lp-card lp-contact-phone-profile')
      profileCard.appendChild(el('div', 'lp-eyebrow', 'Phone profile'))
      if (phoneProfile.personality) profileCard.appendChild(el('p', 'lp-copy', `Personality: ${phoneProfile.personality}`))
      if (phoneProfile.appearance) profileCard.appendChild(el('p', 'lp-copy', `Appearance: ${phoneProfile.appearance}`))
      if (phoneProfile.textingStyle) profileCard.appendChild(el('p', 'lp-copy', `Texting: ${phoneProfile.textingStyle}`))
      content.appendChild(disclosure('Phone voice & appearance', profileCard))
    }
    const source = contact.source.kind === 'character' ? 'Linked Character' : contact.source.kind === 'council' ? 'Linked Council member' : `Pocket NPC · ${contact.source.origin}`
    hero.append(el('span', 'lp-eyebrow', `${source} · ${contact.relationship === 'close' ? 'Close connection' : 'Background actor'}`))
    const presence = el('div', 'lp-card')
    presence.append(
      el('div', 'lp-title', contact.presence.inScene ? 'Here now' : 'Not in current scene'),
      el('p', 'lp-copy', `${contact.contextPolicy.pinned ? 'Pinned to model context' : 'Included only while in scene'}${contact.presence.lastSceneAt ? ` · last scene ${formatDate(contact.presence.lastSceneAt)}` : ''}`),
      el('p', 'lp-copy', `${contact.generationPolicy.relevant ? 'Generation-relevant' : 'Excluded from Pocket generation'} · ${contact.messagingPolicy.remoteEligible ? 'Remote-message eligible' : 'No remote messages'}${contact.messagingPolicy.allowAmbientInScene ? ' · ambient override while here' : ''}`),
    )
    const presenceControls = el('div', 'lp-row')
    presenceControls.setAttribute('role', 'group')
    presenceControls.setAttribute('aria-label', 'Current scene presence')
    for (const [label, inScene] of [['Here', true], ['Away', false]] as const) {
      const choice = button(label, 'lp-button lp-button-quiet')
      choice.setAttribute('aria-pressed', String(contact.presence.inScene === inScene))
      choice.disabled = contact.presence.inScene === inScene
      choice.addEventListener('click', () => host.send('lumiphone:set_presence', { contactId: contact.id, inScene }))
      presenceControls.appendChild(choice)
    }
    presence.append(presenceControls, el('p', 'lp-copy', 'Correct their location now. Later story updates can change it.'))
    const message = button('Message')
    message.addEventListener('click', () => host.openDirect(contact.id))
    content.prepend(hero); content.append(presence)
    if (contact.source.kind === 'npc') {
      const bankId = contact.source.bankId
      const bankEntry = bankId ? host.npcBank.find((entry) => entry.id === bankId) || null : null
      const { section: bankCard, body: bankBody } = sectionBlock(
        bankEntry ? 'Saved to NPC Bank' : contact.source.bankId ? 'NPC Bank copy missing' : 'Reusable NPC',
        'Stable identity and texting style saved separately from this story.',
        'lp-card',
      )
      const saveBank = button(bankEntry ? 'Update NPC Bank' : contact.source.bankId ? 'Restore NPC Bank' : 'Save to NPC Bank', 'lp-button lp-button-quiet')
      saveBank.addEventListener('click', () => host.send('lumiphone:npc_bank_save', { contactId: contact.id }))
      bankBody.appendChild(saveBank)
      content.appendChild(bankCard)
    }
    if (contact.source.kind !== 'npc' || contact.source.origin === 'discovered') {
      const profileOperation = [...host.operations.values()].find((entry) => entry.task === 'profile-refresh' && entry.phase !== 'complete' && entry.phase !== 'error')
      const refresh = button(profileOperation ? (contact.source.kind === 'npc' ? 'Describing…' : 'Refreshing…') : (contact.source.kind === 'npc' ? 'Describe from RP ✦' : 'Refresh compact profile ✦'), 'lp-button lp-button-quiet')
      refresh.disabled = !host.capabilities?.generation || Boolean(profileOperation)
      refresh.addEventListener('click', () => host.send('lumiphone:refresh_contact_profile', { contactId: contact.id }))
      content.appendChild(refresh)
      if (profileOperation) {
        const progress = el('div', 'lp-operation-progress'); progress.dataset.operationRequest = profileOperation.requestId; progress.dataset.phase = profileOperation.phase; progress.setAttribute('role', 'status')
        const progressMessage = el('strong', '', profileOperation.message); progressMessage.dataset.operationMessage = 'true'; progress.append(el('span', 'lp-indeterminate'), progressMessage); content.appendChild(progress)
      }
    }
    content.append(message)
    return page
  }

  return renderContactDirectory(host)
}
