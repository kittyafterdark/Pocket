import type { ContactsViewHost } from './contacts.js'
import { button, el } from '../shared.js'
import { actionGroup, fieldBlock, identityBlock, sectionBlock } from '../components/ui.js'

function members(host: ContactsViewHost, bank: boolean) {
  return bank ? host.npcBank : host.state.contacts
}

function groupEditor(host: ContactsViewHost, bank: boolean, importing = false) {
  const group = (bank ? host.bankGroups : host.state.contactGroups || []).find(group => group.id === host.selectedGroupId)
  if (host.selectedGroupId && !group) return host.empty('Group unavailable', 'This group has been removed.')
  const { page, content } = host.page(importing ? 'Import Cast' : group ? `Edit ${group.name}` : bank ? 'New Portable Cast' : 'New Contact Group', bank ? 'Saved NPC identities across chats' : 'Contacts in this roleplay')
  const name = el('input', 'lp-input'); name.value = host.collectionDraft?.name as string ?? group?.name ?? ''; name.placeholder = 'Group name'
  const selected = new Set(host.collectionDraft?.memberIds as string[] ?? group?.memberIds ?? [])
  const choices = el('div', 'lp-contact-checklist lp-participant-picker')
  const available = members(host, bank).filter(entry => !importing || group?.memberIds.includes(entry.id))
  const count = el('p', 'lp-copy')
  const actions = actionGroup()
  const save = button(host.collectionSaving ? 'Saving…' : importing ? 'Import selected' : 'Save group', 'lp-button')
  const remember = () => {
    const memberIds = [...choices.querySelectorAll<HTMLInputElement>('input:checked')].map(input => input.value)
    host.updateCollectionDraft({ name: name.value, memberIds })
    count.textContent = `${memberIds.length} selected${importing ? ' · linked members will be reused' : ''}`
    save.disabled = host.collectionSaving || !memberIds.length || (!importing && !name.value.trim())
  }
  for (const entry of available) {
    const row = el('label', 'lp-picker-row')
    const check = el('input'); check.type = 'checkbox'; check.value = entry.id; check.checked = selected.has(entry.id)
    const linked = bank && host.state.contacts.some(contact => contact.source.kind === 'npc' && contact.source.bankId === entry.id)
    row.append(check, identityBlock({ name: entry.name, meta: `${entry.role}${linked ? ' · already in this chat' : ''}` }))
    check.addEventListener('change', remember); choices.append(row)
  }
  const all = button('Select all', 'lp-button lp-button-quiet')
  all.addEventListener('click', () => { for (const input of choices.querySelectorAll<HTMLInputElement>('input')) input.checked = true; remember() })
  const none = button('Clear', 'lp-button lp-button-quiet')
  none.addEventListener('click', () => { for (const input of choices.querySelectorAll<HTMLInputElement>('input')) input.checked = false; remember() })
  actions.append(all, none)
  name.addEventListener('input', remember)
  save.addEventListener('click', () => {
    const memberIds = [...choices.querySelectorAll<HTMLInputElement>('input:checked')].map(input => input.value)
    host.saveCollection(importing ? 'lumiphone:npc_cast_import' : bank ? 'lumiphone:npc_cast_save' : 'lumiphone:contact_group_save', { groupId: group?.id, name: name.value.trim(), memberIds })
  })
  if (!importing) content.append(fieldBlock('Name', name))
  else content.append(el('p', 'lp-copy', 'Import stable profiles and photos. Presence, relationships, messages, and tracker values stay in their original chats.'))
  content.append(count, actions, choices, save)
  if (!available.length) content.append(el('p', 'lp-copy', bank ? 'Save some NPC profiles to the Bank first.' : 'Add contacts first.'))
  remember()
  return page
}

function bankEditor(host: ContactsViewHost) {
  const entry = host.npcBank.find(entry => entry.id === host.selectedContactId)
  if (!entry) return host.empty('Profile unavailable', 'This NPC Bank profile has been removed.')
  const { page, content } = host.page('Edit Bank Profile', 'Changes affect future imports')
  const source = { ...entry, ...host.collectionDraft }
  const fields: Record<string, HTMLInputElement | HTMLTextAreaElement> = {}
  for (const [key, label, multiline, value] of [
    ['name', 'Name', false, source.name], ['role', 'Role', false, source.role], ['identityBrief', 'Compact profile', true, source.identityBrief],
    ['personality', 'Personality', true, source.phoneProfile?.personality], ['appearance', 'Appearance', true, source.phoneProfile?.appearance], ['textingStyle', 'Texting style', true, source.phoneProfile?.textingStyle],
    ['aliases', 'Aliases · one per line', true, (source.aliases as string[]).join('\n')], ['tags', 'Tags · one per line', true, (source.tags as string[]).join('\n')],
  ] as const) {
    const input = multiline ? el('textarea', 'lp-textarea') : el('input', 'lp-input'); input.value = String(value || ''); fields[key] = input; content.append(fieldBlock(label, input))
  }
  const collect = () => ({ name: fields.name.value, role: fields.role.value, identityBrief: fields.identityBrief.value, phoneProfile: { personality: fields.personality.value, appearance: fields.appearance.value, textingStyle: fields.textingStyle.value }, aliases: fields.aliases.value.split('\n').filter(Boolean), tags: fields.tags.value.split('\n').filter(Boolean) })
  content.addEventListener('input', () => host.updateCollectionDraft(collect()))
  const save = button(host.collectionSaving ? 'Saving…' : 'Save Bank profile'); save.disabled = host.collectionSaving
  save.addEventListener('click', () => host.saveCollection('lumiphone:npc_bank_edit', { bankId: entry.id, entry: collect() }))
  content.append(save)
  return page
}

export function renderContactGroups(host: ContactsViewHost) {
  if (host.selectedView === 'group-config') return groupEditor(host, false)
  if (host.selectedView === 'cast-config') return groupEditor(host, true)
  if (host.selectedView === 'cast-import') return groupEditor(host, true, true)
  if (host.selectedView === 'bank-entry') return bankEditor(host)
  const bank = host.selectedView === 'bank'
  const { page, content } = host.page(bank ? 'NPC Bank' : 'Contact Groups', bank ? `${host.npcBank.length} reusable profiles` : 'Collections for this roleplay', { label: 'New', callback: () => host.selectGroup('', bank ? 'cast-config' : 'group-config') })
  const groups = bank ? host.bankGroups : host.state.contactGroups || []
  const search = el('input', 'lp-input'); search.type = 'search'; search.placeholder = bank ? 'Search casts and saved NPCs' : 'Search contact groups'
  const cards: Array<{ node: HTMLElement; terms: string }> = []
  content.append(search)
  if (!bank) { const portable = button('NPC Bank & portable casts', 'lp-button lp-button-quiet'); portable.addEventListener('click', () => host.selectGroup('', 'bank')); content.append(portable) }
  const casts = bank ? sectionBlock('Portable casts', 'Groups you can bring into another chat.', 'lp-bank-casts') : null
  const profiles = bank ? sectionBlock('Individual NPCs', 'Saved identities, ready to reuse.', 'lp-bank-individuals') : null
  if (casts) content.append(casts.section)
  for (const group of groups) {
    const people = group.memberIds.map(id => members(host, bank).find(entry => entry.id === id)).filter(entry => Boolean(entry))
    const { section, body } = sectionBlock(group.name, `${people.length} members${bank ? ' · portable cast' : ''}`, 'lp-card lp-contact-group')
    body.append(el('p', 'lp-copy', people.map(entry => entry!.name).join(' · ') || 'No members left. Edit this group to add people.'))
    const actions = actionGroup()
    const edit = button('Edit', 'lp-button lp-button-quiet'); edit.addEventListener('click', () => host.selectGroup(group.id, bank ? 'cast-config' : 'group-config')); actions.append(edit)
    if (bank) {
      const importCast = button('Import…'); importCast.disabled = !people.length; importCast.addEventListener('click', () => host.selectGroup(group.id, 'cast-import')); actions.append(importCast)
    } else {
      const chat = button('Start group chat'); chat.disabled = group.memberIds.length < 2; chat.addEventListener('click', () => host.startGroup(group.name, group.memberIds)); actions.append(chat)
      const save = button(group.bankGroupId ? 'Update saved cast' : 'Save as portable cast', 'lp-button lp-button-quiet'); save.disabled = !people.length || people.some(entry => !entry || !('source' in entry) || entry.source.kind !== 'npc') || host.collectionSaving
      save.addEventListener('click', () => host.saveCollection('lumiphone:contact_group_bank', { groupId: group.id })); actions.append(save)
      if (save.disabled && people.length) body.append(el('p', 'lp-copy', 'Portable casts contain Pocket NPCs. Linked Characters stay local.'))
    }
    const remove = button('Remove group', 'lp-button lp-button-danger'); remove.disabled = host.collectionSaving
    remove.addEventListener('click', () => host.saveCollection(bank ? 'lumiphone:npc_cast_delete' : 'lumiphone:contact_group_delete', { groupId: group.id }))
    actions.append(remove); body.append(actions); (casts?.body || content).append(section); cards.push({ node: section, terms: `${group.name} ${people.map(entry => entry!.name).join(' ')}`.toLowerCase() })
  }
  if (!groups.length) (casts?.body || content).append(el('p', 'lp-copy', bank ? 'Save a cast to reuse the same NPCs in other chats.' : 'Organize a cast, family, team, or faction here.'))
  if (profiles) content.append(profiles.section)
  if (bank && !host.npcBank.length) profiles!.body.append(el('p', 'lp-copy', 'Save an NPC contact to reuse their profile in other chats.'))
  if (bank) for (const entry of host.npcBank) {
    const row = el('div', 'lp-card lp-bank-profile')
    row.append(identityBlock({ name: entry.name, meta: entry.role, description: entry.identityBrief }))
    const actions = actionGroup()
    const edit = button('Edit saved profile', 'lp-button lp-button-quiet'); edit.addEventListener('click', () => host.select(entry.id, 'bank-entry')); actions.append(edit)
    const linked = host.state.contacts.find(contact => contact.source.kind === 'npc' && contact.source.bankId === entry.id)
    const add = button(linked ? 'Open local contact' : 'Add to this chat'); add.addEventListener('click', () => linked ? host.select(linked.id, 'detail') : host.send('lumiphone:npc_bank_add', { bankId: entry.id })); actions.append(add)
    row.append(actions); profiles!.body.append(row); cards.push({ node: row, terms: `${entry.name} ${entry.role} ${entry.tags.join(' ')}`.toLowerCase() })
  }
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase()
    for (const card of cards) card.node.hidden = !card.terms.includes(query)
    for (const group of [casts, profiles]) if (group) group.section.hidden = Boolean(query && !cards.some(card => group.body.contains(card.node) && !card.node.hidden))
  })
  return page
}
