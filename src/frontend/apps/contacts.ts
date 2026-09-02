import type { PhoneCapabilities, PhoneState, PocketContact, PocketContactSourceOption, PocketOperationProgress } from '../../types.js'
import { contactAccent, contactAvatar } from '../../domain/contacts.js'
import { button, el, formatDate } from '../shared.js'
import type { PageAction } from '../shared.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface ContactsViewHost {
  state: PhoneState
  selectedContactId: string
  selectedView: 'list' | 'detail' | 'config' | 'import' | 'new'
  sources: PocketContactSourceOption[]
  capabilities: PhoneCapabilities | null
  operations: Map<string, PocketOperationProgress>
  page(title: string, subtitle?: string, action?: PageAction): Page
  empty(title: string, copy: string): HTMLDivElement
  select(contactId: string, view?: 'list' | 'detail' | 'config' | 'import' | 'new'): void
  openDirect(contactId: string): void
  requestSources(): void
  send(type: string, payload?: Record<string, unknown>): void
  showError(message: string): void
}

function avatar(contact: PocketContact): HTMLDivElement {
  const node = el('div', 'lp-avatar', contact.name.slice(0, 1).toUpperCase())
  node.style.setProperty('--contact-accent', contactAccent(contact))
  if (contactAvatar(contact)) {
    const image = el('img'); image.src = contactAvatar(contact); image.alt = ''; node.replaceChildren(image)
  }
  return node
}

function contactEditor(host: ContactsViewHost, contact: PocketContact | null): HTMLDivElement {
  let saveContact = () => {}
  const { page, content } = host.page(contact ? 'Contact Settings' : 'New Contact', contact?.source.kind || 'Pocket NPC', { label: 'Save', callback: () => saveContact() })
  const name = el('input', 'lp-input'); name.placeholder = 'Name'; name.value = contact?.name || ''
  const role = el('input', 'lp-input'); role.placeholder = 'Role'; role.value = contact?.role || ''
  const description = el('textarea', 'lp-textarea'); description.placeholder = 'Stable identity brief — role, personality, relationship, enduring traits'; description.maxLength = 1_200; description.value = contact?.identityBrief || contact?.description || ''
  const sceneNote = el('textarea', 'lp-textarea'); sceneNote.placeholder = 'Current scene note — temporary state, objective, or reason they are here'; sceneNote.maxLength = 600; sceneNote.value = contact?.sceneNote || ''
  const accent = el('input', 'lp-color-input'); accent.type = 'color'; accent.value = /^#[0-9a-f]{6}$/i.test(contact?.accent || '') ? contact!.accent : '#8b7dff'
  const colorRow = el('label', 'lp-card lp-row-between'); colorRow.append(el('span', 'lp-title', 'Contact color'), accent)
  const colorMode = el('select', 'lp-select')
  for (const [value, label] of [['pocket', 'Pocket color'], ['source', contact?.sourceAccent ? 'Inherit source color' : 'Inherit source color (unavailable)']] as const) {
    const option = el('option', '', label); option.value = value; option.selected = (contact?.colorMode || 'pocket') === value; option.disabled = value === 'source' && !contact?.sourceAccent; colorMode.appendChild(option)
  }
  const colorModeLabel = el('label', 'lp-label', 'Color source'); colorModeLabel.appendChild(colorMode)
  const inScene = el('input'); inScene.type = 'checkbox'; inScene.checked = contact?.presence.inScene || false
  const sceneRow = el('label', 'lp-card lp-row-between'); sceneRow.append(el('span', 'lp-title', 'Here in current scene'), inScene)
  const pinned = el('input'); pinned.type = 'checkbox'; pinned.checked = contact?.contextPolicy.pinned || false
  const pinRow = el('label', 'lp-card lp-row-between'); pinRow.append(el('span', 'lp-title', 'Pin compact brief to model context'), pinned)
  const relevant = el('input'); relevant.type = 'checkbox'; relevant.checked = contact?.generationPolicy.relevant ?? true
  const relevantRow = el('label', 'lp-card lp-row-between'); relevantRow.append(el('span', 'lp-title', 'Relevant to Pocket generation'), relevant)
  const remote = el('input'); remote.type = 'checkbox'; remote.checked = contact?.messagingPolicy.remoteEligible ?? true
  const remoteRow = el('label', 'lp-card lp-row-between'); remoteRow.append(el('span', 'lp-title', 'Eligible for remote messages'), remote)
  const ambientHere = el('input'); ambientHere.type = 'checkbox'; ambientHere.checked = contact?.messagingPolicy.allowAmbientInScene || false
  const ambientHereRow = el('label', 'lp-card lp-row-between'); ambientHereRow.append(el('span', 'lp-title', 'Allow ambient texts while in scene'), ambientHere)
  saveContact = () => {
    if (!name.value.trim()) { host.showError('A contact needs a name.'); return }
    host.send('lumiphone:save_contact', { contact: {
      id: contact?.id, name: name.value.trim(), role: role.value.trim(), identityBrief: description.value.trim(), description: description.value.trim(), sceneNote: sceneNote.value.trim(), accent: accent.value, colorMode: colorMode.value,
      presence: { inScene: inScene.checked, lastSceneAt: inScene.checked ? new Date().toISOString() : contact?.presence.lastSceneAt || '' },
      contextPolicy: { pinned: pinned.checked },
      generationPolicy: { relevant: relevant.checked },
      messagingPolicy: {
        remoteEligible: remote.checked, allowAmbientInScene: ambientHere.checked,
        lastInitiatedMessageAt: contact?.messagingPolicy.lastInitiatedMessageAt || '',
        lastInitiatedRoleplayAt: contact?.messagingPolicy.lastInitiatedRoleplayAt || '',
      },
    } })
    host.select(contact?.id || '', 'list')
  }
  content.append(name, role, description, sceneNote, colorRow, colorModeLabel, sceneRow, pinRow, relevantRow, remoteRow, ambientHereRow)
  if (contact) {
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
  const { page, content } = host.page('Add Contact', 'Character, Council, or Pocket NPC')
  const manual = el('section', 'lp-card lp-contact-import')
  manual.appendChild(el('div', 'lp-eyebrow', 'Pocket NPC'))
  const description = el('textarea', 'lp-textarea'); description.placeholder = 'Describe someone; Pocket will generate one compact contact profile.'; description.maxLength = 2_000
  const generate = button('Generate NPC')
  const npcOperation = [...host.operations.values()].find((entry) => entry.task === 'npc-contact' && entry.phase !== 'complete' && entry.phase !== 'error')
  generate.disabled = !host.capabilities?.generation || Boolean(npcOperation)
  generate.addEventListener('click', () => {
    if (!description.value.trim()) { host.showError('Describe the NPC first.'); return }
    host.send('lumiphone:generate_contact', { description: description.value.trim() })
  })
  const primitive = button('Create manually', 'lp-button lp-button-quiet')
  primitive.addEventListener('click', () => host.select('', 'new'))
  manual.append(description, generate, primitive)
  if (npcOperation) {
    const progress = el('div', 'lp-operation-progress')
    progress.dataset.operationRequest = npcOperation.requestId
    progress.dataset.phase = npcOperation.phase
    progress.setAttribute('role', 'status')
    const message = el('strong', '', npcOperation.message || 'Generating contact…'); message.dataset.operationMessage = 'true'
    progress.append(el('span', 'lp-indeterminate'), message)
    manual.appendChild(progress)
  }
  content.appendChild(manual)

  const grouped = new Map<string, PocketContactSourceOption[]>()
  for (const option of host.sources) grouped.set(option.kind, [...(grouped.get(option.kind) || []), option])
  for (const [kind, sources] of grouped) {
    const section = el('section', 'lp-contact-source-section')
    section.appendChild(el('div', 'lp-eyebrow', kind === 'character' ? 'Lumiverse Characters' : 'Active Council'))
    for (const source of sources) {
      const row = el('div', 'lp-card lp-row-between')
      const copy = el('div'); copy.append(el('strong', '', source.name), el('span', 'lp-copy', source.role))
      const add = button(source.importedContactId ? 'Imported' : 'Add', 'lp-button lp-button-quiet')
      add.disabled = Boolean(source.importedContactId)
      add.addEventListener('click', () => host.send('lumiphone:import_contact', { kind: source.kind, sourceId: source.sourceId, itemId: source.itemId }))
      row.append(copy, add); section.appendChild(row)
    }
    content.appendChild(section)
  }
  if (!host.sources.length) content.appendChild(el('p', 'lp-copy', 'No importable Characters or active Council members were returned. Manual NPC contacts remain available.'))
  return page
}

export function renderContactsView(host: ContactsViewHost): HTMLDivElement {
  const contact = host.state.contacts.find((entry) => entry.id === host.selectedContactId) || null
  if (host.selectedView === 'import') { host.requestSources(); return importView(host) }
  if (host.selectedView === 'new') return contactEditor(host, null)
  if (contact && host.selectedView === 'config') return contactEditor(host, contact)
  if (contact && host.selectedView === 'detail') {
    const { page, content } = host.page(contact.name, contact.role, { label: 'Edit', callback: () => host.select(contact.id, 'config') })
    const hero = el('div', 'lp-card lp-contact-detail')
    hero.append(avatar(contact), el('h2', 'lp-title', contact.name), el('p', 'lp-copy', contact.identityBrief || contact.description || 'No compact identity brief.'))
    if (contact.sceneNote) hero.append(el('p', 'lp-scene-note', contact.sceneNote))
    const source = contact.source.kind === 'character' ? 'Linked Character' : contact.source.kind === 'council' ? 'Linked Council member' : `Pocket NPC · ${contact.source.origin}`
    hero.append(el('span', 'lp-eyebrow', source))
    const presence = el('div', 'lp-card')
    presence.append(
      el('div', 'lp-title', contact.presence.inScene ? 'Here now' : 'Not in current scene'),
      el('p', 'lp-copy', `${contact.contextPolicy.pinned ? 'Pinned to model context' : 'Included only while in scene'}${contact.presence.lastSceneAt ? ` · last scene ${formatDate(contact.presence.lastSceneAt)}` : ''}`),
      el('p', 'lp-copy', `${contact.generationPolicy.relevant ? 'Generation-relevant' : 'Excluded from Pocket generation'} · ${contact.messagingPolicy.remoteEligible ? 'Remote-message eligible' : 'No remote messages'}${contact.messagingPolicy.allowAmbientInScene ? ' · ambient override while here' : ''}`),
    )
    const message = button('Message')
    message.addEventListener('click', () => host.openDirect(contact.id))
    content.append(hero, presence)
    if (contact.source.kind !== 'npc') {
      const profileOperation = [...host.operations.values()].find((entry) => entry.task === 'profile-refresh' && entry.phase !== 'complete' && entry.phase !== 'error')
      const refresh = button('Refresh compact profile ✦', 'lp-button lp-button-quiet')
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

  const { page, content } = host.page('Contacts', `${host.state.contacts.length} people`, { label: 'Add', callback: () => host.select('', 'import') })
  const search = el('input', 'lp-input'); search.type = 'search'; search.placeholder = 'Search contacts'
  const filters = el('div', 'lp-chipbar')
  const all = button('All', 'lp-chip'); const here = button('Here', 'lp-chip'); const recent = button('Recent', 'lp-chip')
  all.setAttribute('aria-pressed', 'true'); filters.append(all, here, recent)
  const sync = button('Sync current scene', 'lp-button lp-button-quiet')
  const sceneOperation = [...host.operations.values()].find((entry) => entry.task === 'scene-sync' && entry.phase !== 'complete' && entry.phase !== 'error')
  sync.disabled = !host.capabilities?.generation || !host.capabilities?.sceneSync || Boolean(sceneOperation)
  sync.addEventListener('click', () => host.send('lumiphone:sync_scene_contacts'))
  const snapshot = host.state.sceneSnapshot
  const snapshotStatus = el('p', snapshot?.stale ? 'lp-warning' : 'lp-copy', !snapshot
    ? 'No scene snapshot yet.'
    : `${snapshot.stale ? 'Scene snapshot is stale' : 'Scene snapshot is current'} · ${snapshot.actors.length} actor${snapshot.actors.length === 1 ? '' : 's'} · source turn ${snapshot.sourceMessageIndex}`)
  const list = el('div', 'lp-contact-list')
  const renderList = (filter: 'all' | 'here' | 'recent' = 'all') => {
    list.replaceChildren()
    const query = search.value.trim().toLocaleLowerCase()
    const contacts = host.state.contacts.filter((entry) => {
      if (query && !`${entry.name} ${entry.role}`.toLocaleLowerCase().includes(query)) return false
      if (filter === 'here') return entry.presence.inScene
      if (filter === 'recent') return Boolean(entry.presence.lastSceneAt)
      return true
    }).sort((a, b) => Number(b.presence.inScene) - Number(a.presence.inScene) || Date.parse(b.presence.lastSceneAt || '0') - Date.parse(a.presence.lastSceneAt || '0'))
    for (const entry of contacts) {
      const row = button('', 'lp-card lp-contact-row')
      const copy = el('div', 'lp-grow'); copy.append(el('strong', '', entry.name), el('span', 'lp-copy', entry.role))
      row.append(avatar(entry), copy, el('span', entry.presence.inScene ? 'lp-presence' : 'lp-presence lp-presence-away'))
      row.addEventListener('click', () => host.select(entry.id, 'detail'))
      list.appendChild(row)
    }
    if (!contacts.length) list.appendChild(host.empty('No matching contacts', 'Try another search or sync the current scene.'))
  }
  let active: 'all' | 'here' | 'recent' = 'all'
  const useFilter = (next: typeof active) => { active = next; for (const chip of [all, here, recent]) chip.setAttribute('aria-pressed', String(chip === ({ all, here, recent }[next]))); renderList(active) }
  all.addEventListener('click', () => useFilter('all')); here.addEventListener('click', () => useFilter('here')); recent.addEventListener('click', () => useFilter('recent'))
  search.addEventListener('input', () => renderList(active))
  renderList()
  content.append(search, filters, sync, snapshotStatus)
  if (sceneOperation) {
    const progress = el('div', 'lp-operation-progress')
    progress.dataset.operationRequest = sceneOperation.requestId
    progress.dataset.phase = sceneOperation.phase
    progress.setAttribute('role', 'status')
    const message = el('strong', '', sceneOperation.message || 'Syncing scene…'); message.dataset.operationMessage = 'true'
    progress.append(el('span', 'lp-indeterminate'), message)
    content.appendChild(progress)
  }
  content.appendChild(list)
  return page
}
