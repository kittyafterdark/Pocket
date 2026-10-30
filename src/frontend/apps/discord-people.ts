import type { PocketContact, PocketContactGroup, PocketNpcBankEntry } from '../../types.js'
import type { SocialAccount, SocialMutation, SocialServer } from '../../domain/social.js'
import type { SocialSession } from './social.js'
import { el, button } from '../shared.js'
import { socialIcon } from '../components/social-icons.js'

export function discordServerPicture(options: { name: string; url?: string; ui: SocialSession; upload(): void; cancel?(): void }): HTMLElement {
  const row = el('div', 'lp-discord-picture-editor'), preview = el('div', 'lp-discord-picture-preview')
  if (options.url) { const image = el('img'); image.src = options.url; image.alt = options.name + ' server picture'; preview.append(image) }
  else preview.append(socialIcon('camera'))
  const copy = el('div'), change = button(options.url ? 'Change picture' : 'Upload picture', 'lp-discord-soft-button')
  change.setAttribute('aria-label', 'Upload server picture for ' + options.name); change.disabled = Boolean(options.ui.pending || options.ui.imageBusy); change.onclick = options.upload
  copy.append(el('strong', '', options.name), change)
  if (options.ui.imageBusy) {
    const progress = el('span', 'lp-discord-picture-progress', options.ui.imageProgress || 'Uploading picture…'); progress.setAttribute('role', 'status'); copy.append(progress)
    if (options.cancel) { const cancel = button('Cancel upload', 'lp-discord-text-button'); cancel.onclick = options.cancel; copy.append(cancel) }
  }
  row.append(preview, copy); return row
}

export function discordPeople(options: {
  server: SocialServer; ui: SocialSession; contacts: PocketContact[]; bank: PocketNpcBankEntry[]; casts: PocketContactGroup[]
  avatar(name: string, actorId?: string, url?: string): HTMLElement
  render(): void; request(input: SocialMutation): void; generate?(): void; upload?(): void; cancelUpload?(): void
}): HTMLElement {
  const { server, ui, contacts, bank, casts } = options, page = el('section', 'lp-discord-people lp-discord-member-manager')
  page.setAttribute('aria-label', 'People in ' + server.name)
  page.append(discordServerPicture({ name: server.name, url: server.imageUrl, ui, upload: () => options.upload?.(), cancel: options.cancelUpload }))
  const tabs = el('div', 'lp-discord-member-tabs'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Server people views')
  const selected = ui.peopleViews?.[server.id] || 'members'
  for (const [view, label] of [['members', 'Members'], ['add', 'Add people']] as const) {
    const control = button(label + (view === 'members' ? ' · ' + (server.participants?.length || 0) : ''), 'lp-discord-member-tab')
    control.setAttribute('aria-label', label + ' in ' + server.name); control.setAttribute('aria-pressed', String(view === selected)); control.dataset.socialFocus = view + ':' + server.id
    control.onclick = () => {
      ui.peopleViews ||= {}; ui.peopleViews[server.id] = view; ui.scrollTop = 0
      const mount = page.closest('.lp-social-page')?.parentElement || page.ownerDocument.body; options.render()
      mount?.querySelector<HTMLElement>(`[data-social-focus="${view}:${server.id}"]`)?.focus({ preventScroll: true })
    }; tabs.append(control)
  }
  page.append(tabs)
  const body = el('div', 'lp-discord-member-body'); page.append(body)
  const action = (label: string, name: string, run: () => void, added = false) => {
    const node = button(label, 'lp-discord-soft-button'); node.setAttribute('aria-label', name); node.disabled = added || Boolean(ui.pending || ui.imageBusy); node.onclick = run; node.dataset.socialFocus = name; return node
  }
  const disclosure = (key: string, label: string, count: number, initiallyOpen = false) => {
    const group = el('details', 'lp-discord-picker-group'), summary = el('summary'), inner = el('div', 'lp-discord-picker-body'), id = server.id + ':' + key
    group.open = ui.peopleFriendsOpen?.[id] ?? initiallyOpen
    summary.append(el('strong', '', label)); if (count) summary.append(el('span', 'lp-discord-group-count', String(count))); group.append(summary, inner)
    summary.onclick = () => { ui.peopleFriendsOpen ||= {}; ui.peopleFriendsOpen[id] = !group.open }
    return { group, inner }
  }
  if (selected === 'members') {
    const heading = el('div', 'lp-discord-members-heading'); heading.append(el('h2', '', 'Server members'))
    const generate = action('Generate people', 'Generate people for ' + server.name, () => options.generate?.()); generate.disabled ||= !options.generate
    heading.append(generate); body.append(heading)
    const list = el('ul', 'lp-discord-people-list'); list.setAttribute('aria-label', server.name + ' members')
    for (const person of server.participants || []) {
      const item = el('li'), member = disclosure('member:' + person.id, person.name, 0)
      member.group.className = 'lp-discord-member-card'
      const summary = member.group.querySelector('summary')!, copy = el('span', 'lp-discord-member-copy')
      copy.append(el('strong', '', person.name), el('small', '', '@' + person.handle))
      const chevron = el('span', 'lp-discord-member-chevron', '›'); chevron.setAttribute('aria-hidden','true')
      summary.replaceChildren(options.avatar(person.name, person.actorId, person.avatarUrl), copy, chevron)
      member.inner.append(el('p', '', person.bio || 'No bio yet.')); item.append(member.group); list.append(item)
    }
    body.append(list)
    if (!server.participants?.length) body.append(el('p', 'lp-discord-member-empty', 'A quiet server, for now. Add a cast, invite someone, or generate a few new faces.'))
    return page
  }
  body.append(el('h2', '', 'Bring your people'), el('p', 'lp-discord-picker-hint', 'Add a whole cast in one click, or choose individual people.'))
  const castSection = disclosure('casts', 'Portable casts', casts.length, true)
  for (const cast of casts) {
    const entries = bank.filter(entry => cast.memberIds.includes(entry.id)), added = entries.filter(entry => server.participants?.some(person => person.bankId === entry.id)).length
    const card = el('div', 'lp-discord-cast-card'), preview = el('div', 'lp-discord-cast-avatars'), copy = el('div', 'lp-discord-cast-copy')
    for (const entry of entries.slice(0, 3)) preview.append(options.avatar(entry.name, undefined, entry.avatarUrl))
    copy.append(el('strong', '', cast.name), el('small', '', entries.length + ' people' + (added ? ' · ' + added + ' already here' : '')))
    const add = action(added === entries.length ? 'Added' : 'Add cast', 'Add ' + cast.name + ' cast to ' + server.name, () => options.request({ action: 'participant', app: 'discord', serverId: server.id, castId: cast.id }), !entries.length || added === entries.length)
    card.append(preview, copy, add); castSection.inner.append(card)
  }
  if (!casts.length) castSection.inner.append(el('p', 'lp-discord-picker-hint', 'Your saved portable casts will appear here.'))
  body.append(castSection.group)
  const picker = (label: string, key: string, entries: Array<{ id: string; name: string; role?: string; actorId?: string; avatarUrl?: string }>, bankSource: boolean) => {
    const section = disclosure(key, label, entries.length)
    for (const entry of entries) {
      const added = Boolean(server.participants?.some(person => bankSource ? person.bankId === entry.id : person.actorId === entry.id)), row = el('div', 'lp-discord-picker-row'), copy = el('span', 'lp-discord-member-copy')
      copy.append(el('strong', '', entry.name), el('small', '', entry.role || 'Pocket contact'))
      const name = bankSource ? `Add ${entry.name} to ${server.name}` : `Add ${entry.name} from Characters to ${server.name}`
      row.append(options.avatar(entry.name, entry.actorId, entry.avatarUrl), copy, action(added ? 'Added' : 'Add', name, () => options.request({ action: 'participant', app: 'discord', serverId: server.id, ...(bankSource ? { bankEntryId: entry.id } : { accountId: entry.id }) }), added)); section.inner.append(row)
    }
    return section.group
  }
  body.append(picker('Characters', 'characters', contacts.map(contact => ({ ...contact, actorId: contact.id })), false), picker('NPC Bank', 'bank', bank, true))
  const manual = disclosure('manual', 'Create a person', 0), form = el('form', 'lp-discord-person-form'); form.setAttribute('aria-label', 'Add person to ' + server.name)
  ui.personDrafts ||= {}; const draft = ui.personDrafts[server.id] ||= { name: '', bio: '' }
  for (const [key, label] of [['name', 'Person name'], ['bio', 'Person bio']] as const) {
    const field = el('label', 'lp-social-field'), input = key === 'name' ? el('input', 'lp-input') : el('textarea', 'lp-input')
    input.value = draft[key]; input.maxLength = key === 'name' ? 100 : 280; input.required = key === 'name'; input.disabled = Boolean(ui.pending); input.dataset.socialFocus = server.id + ':' + label
    input.oninput = () => { draft[key] = input.value }; field.append(el('span', '', label), input); form.append(field)
  }
  const add = action('Add person', 'Add person', () => {}); add.type = 'submit'; form.append(add)
  form.onsubmit = event => { event.preventDefault(); options.request({ action: 'participant', app: 'discord', serverId: server.id, name: draft.name, bio: draft.bio }) }
  manual.inner.append(form); body.append(manual.group); return page
}
