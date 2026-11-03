import type { PocketLorebookContactDraft, PocketOperationProgress } from '../../types.js'
import { button, el } from '../shared.js'
import { fieldBlock, showPocketSheet } from './ui.js'
import { lorebookEntryTitle, rankLorebookSearch } from '../../domain/lorebook-search.js'

type Book = { id: string; name: string; attachedTo?: Array<'chat' | 'character'> }
type Entry = { id: string; title: string; keys?: string[]; disabled: boolean; preview: string }
export type LorebookContactProgress = Pick<PocketOperationProgress, 'phase' | 'message'> & { completedEntries?: number; totalEntries?: number }
type Source = { bookId: string; entryId: string; title: string }
export type LorebookContactRequest = (type: string, payload: Record<string, unknown>, progress?: (value: LorebookContactProgress) => void) => Promise<{
  books?: Book[]; entries?: Entry[]; drafts?: PocketLorebookContactDraft[]; addedCount?: number; reusedCount?: number
}>

/** Entries are evidence, not character boundaries. Selection and review stay local until Save. */
export function showLorebookContactPicker(anchor: HTMLElement, request: LorebookContactRequest): (() => void) | undefined {
  const body = el('div', 'lp-lorebook'), stage = el('div', 'lp-lorebook-stage'), status = el('p', 'lp-lorebook-status')
  status.setAttribute('role', 'status'); body.append(stage, status)
  const bookSearch = el('input', 'lp-input'), query = el('input', 'lp-input'), people = el('input', 'lp-input')
  bookSearch.type = query.type = 'search'; bookSearch.placeholder = 'Search your lorebooks'; query.placeholder = 'Search names, keywords, or text'
  people.maxLength = 500; people.placeholder = 'Names or aliases, separated by commas'
  const library = el('aside', 'lp-lorebook-library'), bookRows = el('div', 'lp-lorebook-books'), scopes = el('div', 'lp-lorebook-scopes')
  const attached = button('Attached', 'lp-lorebook-filter'), all = button('All lorebooks', 'lp-lorebook-filter')
  scopes.setAttribute('role', 'group'); scopes.setAttribute('aria-label', 'Lorebook library filter'); scopes.append(attached, all)
  library.append(fieldBlock('Search lorebooks', bookSearch), scopes, bookRows)
  const entriesPane = el('section', 'lp-lorebook-entries'), entryHeader = el('div', 'lp-lorebook-entry-header'), bookTitle = el('h3', '', 'Choose a lorebook'), entryTotal = el('span', 'lp-lorebook-meta')
  entryHeader.append(bookTitle, entryTotal)
  const rows = el('div', 'lp-lorebook-rows'), count = el('p', 'lp-lorebook-selection')
  rows.setAttribute('role', 'group'); rows.setAttribute('aria-label', 'Source entries')
  const selectVisible = button('Select visible entries', 'lp-lorebook-link'), clear = button('Clear selection', 'lp-lorebook-link')
  const entryTools = el('div', 'lp-lorebook-tools'); entryTools.append(selectVisible, clear)
  entriesPane.append(entryHeader, fieldBlock('Find source entries', query), entryTools, rows)
  const scan = button('Find NPCs', 'lp-button lp-button-primary'), selection = new Map<string, Source>()
  let books: Book[] = [], activeBookId = '', scope: 'attached' | 'all' = 'all'
  let entries: Entry[] = [], revision = 0, closed = false, busy = false, progressTimer = 0
  bookSearch.disabled = query.disabled = true
  const surface = anchor.closest('.lumiphone-shell') || anchor.parentElement
  const sheet = showPocketSheet(anchor, 'Import from lorebook', body, { closeLabel: 'Close', className: 'lp-lorebook-dialog', viewportWidth: 980, onDismiss: () => {
    closed = true; revision++; window.clearInterval(progressTimer)
    if (!anchor.isConnected && document.activeElement === document.body) surface?.querySelector<HTMLElement>('[data-lorebook-import]')?.focus({ preventScroll: true })
  } })
  if (!sheet) return
  const fail = (error: unknown) => { status.textContent = error instanceof Error ? error.message : 'Lorebook import failed. Try again.' }
  const visible = () => rankLorebookSearch(entries, query.value, entry => entry)
  const updateCount = () => {
    const books = new Set([...selection.values()].map(source => source.bookId)).size
    count.textContent = `${selection.size} source entries selected${books > 1 ? ` across ${books} lorebooks` : ''}`
    scan.disabled = busy || !selection.size; clear.disabled = busy || !selection.size
    selectVisible.disabled = busy || !visible().some(entry => !entry.disabled)
  }
  const renderEntries = () => {
    rows.replaceChildren()
    for (const item of visible()) {
      const row = el('article', 'lp-lorebook-entry'), label = el('label', 'lp-lorebook-choice'), checked = el('input')
      const title = lorebookEntryTitle(item.title), text = el('span', 'lp-lorebook-entry-text')
      text.append(el('strong', '', title.name)); if (title.category) text.append(el('small', '', title.category))
      checked.type = 'checkbox'; checked.checked = selection.has(item.id); checked.disabled = item.disabled || busy
      if (item.disabled) text.append(el('small', '', 'Disabled entry'))
      label.append(checked, text)
      checked.onchange = () => {
        if (checked.checked && selection.size >= 24) { checked.checked = false; status.textContent = 'Choose up to 24 source entries for one pass.'; return }
        if (checked.checked) selection.set(item.id, { bookId: activeBookId, entryId: item.id, title: item.title })
        else selection.delete(item.id)
        updateCount()
      }
      const preview = el('details', 'lp-lorebook-preview'); preview.append(el('summary', '', `Preview ${title.name}`), el('p', '', item.preview))
      row.append(label, preview); rows.append(row)
    }
    if (!rows.childElementCount) rows.append(el('p', 'lp-lorebook-empty', activeBookId ? 'No matching entries. Try a name, keyword, or phrase.' : 'Choose a lorebook to browse its entries.'))
    entryTotal.textContent = `${visible().length} ${query.value.trim() ? 'matches' : 'entries'}`
    updateCount()
  }
  const renderSources = () => {
    const layout = el('div', 'lp-lorebook-source-layout'), footer = el('footer', 'lp-lorebook-footer')
    const target = el('details', 'lp-lorebook-target'); target.append(el('summary', '', 'Looking for specific people?'), fieldBlock('People to find (optional)', people))
    layout.append(library, entriesPane); footer.append(count, target, scan)
    stage.replaceChildren(el('p', 'lp-lorebook-intro', 'Gather the sources. We’ll find the people, then you choose who to add.'), layout, footer)
    updateCount()
  }
  query.oninput = renderEntries
  clear.onclick = () => { selection.clear(); renderEntries() }
  selectVisible.onclick = () => {
    const sources = visible().filter(entry => !entry.disabled)
    if (new Set([...selection.keys(), ...sources.map(entry => entry.id)]).size > 24) { status.textContent = 'Filter the list or choose fewer entries; each pass accepts up to 24.'; return }
    for (const source of sources) selection.set(source.id, { bookId: activeBookId, entryId: source.id, title: source.title })
    renderEntries()
  }
  const renderBooks = () => {
    attached.setAttribute('aria-pressed', String(scope === 'attached')); all.setAttribute('aria-pressed', String(scope === 'all'))
    bookRows.replaceChildren()
    const filtered = rankLorebookSearch(books.filter(book => scope === 'all' || book.attachedTo?.length), bookSearch.value, book => ({ title: book.name }))
    for (const book of filtered) {
      const choice = button('', 'lp-lorebook-book'); choice.disabled = busy; choice.setAttribute('aria-pressed', String(book.id === activeBookId))
      choice.append(el('strong', '', book.name))
      const badges = el('span', 'lp-lorebook-badges')
      for (const tag of book.attachedTo || []) badges.append(el('span', '', tag === 'chat' ? 'This chat' : 'Character'))
      if (!badges.childElementCount) badges.append(el('span', '', 'Library'))
      choice.append(badges); choice.onclick = () => { void chooseBook(book) }; bookRows.append(choice)
    }
    if (!filtered.length) bookRows.append(el('p', 'lp-lorebook-empty', scope === 'attached' ? 'No matching attached lorebooks. Browse all lorebooks, or check Chat and Character permissions.' : 'No lorebooks match your search.'))
  }
  bookSearch.oninput = renderBooks
  attached.onclick = () => { scope = 'attached'; renderBooks() }; all.onclick = () => { scope = 'all'; renderBooks() }
  const chooseBook = async (book: Book) => {
    if (busy) return
    const current = ++revision; activeBookId = book.id; bookTitle.textContent = book.name
    entries = []; query.value = ''; renderEntries(); renderBooks(); query.disabled = true
    status.textContent = 'Loading entries…'
    try {
      const response = await request('lumiphone:lorebook_contact_entries', { bookId: book.id })
      if (closed || current !== revision) return
      entries = response.entries || []; query.disabled = false; renderEntries(); status.textContent = ''
    } catch (error) { if (!closed && current === revision) fail(error) }
  }
  const reviewDrafts = (drafts: PocketLorebookContactDraft[]) => {
    const form = el('fieldset', 'lp-lorebook-review-grid')
    const selected = new Set(drafts.flatMap((draft, index) => !draft.existingContactId && !draft.matchWarning ? [index] : []))
    const save = button('Save selected contacts', 'lp-button lp-button-primary'), back = button('Change source entries', 'lp-button lp-button-quiet')
    const updateSave = () => { save.disabled = busy || !selected.size; save.textContent = `Save ${selected.size} selected contact${selected.size === 1 ? '' : 's'}` }
    for (const [index, draft] of drafts.entries()) {
      const card = el('fieldset', 'lp-lorebook-person')
      const legend = el('legend', 'lp-title', draft.name); card.append(legend)
      const label = el('label', 'lp-lorebook-person-choice'), check = el('input'); check.type = 'checkbox'; check.checked = selected.has(index)
      const addLabel = el('span', '', `Add ${draft.name}`)
      const avatar = el('span', 'lp-lorebook-monogram', draft.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('')); avatar.setAttribute('aria-hidden', 'true')
      label.append(avatar, addLabel, check); check.onchange = () => { if (check.checked) selected.add(index); else selected.delete(index); updateSave() }
      card.append(label)
      if (draft.existingContactId) card.append(el('p', 'lp-copy', 'Already in Contacts. Selecting this profile reuses that contact and preserves its current details.'))
      if (draft.matchWarning) card.append(el('p', 'lp-copy', draft.matchWarning))
      const evidence = draft.evidenceEntryIds.map(id => selection.get(id)?.title || id)
      const evidenceBlock = el('details', 'lp-lorebook-evidence'); evidenceBlock.append(el('summary', '', `${evidence.length} source ${evidence.length === 1 ? 'entry' : 'entries'}`), el('p', '', evidence.join(' · '))); card.append(evidenceBlock)
      const field = (title: string, value: string, max: number, update: (value: string) => void, multiline = false) => {
        const input = multiline ? el('textarea', 'lp-textarea') : el('input', 'lp-input')
        input.value = value; input.maxLength = max; input.oninput = () => update(input.value)
        return fieldBlock(title, input)
      }
      card.append(field('Name', draft.name, 120, value => { draft.name = value; legend.textContent = value.trim() || 'Unnamed NPC'; addLabel.textContent = `Add ${value.trim() || 'unnamed NPC'}` }), field('Compact profile', draft.identityBrief, 1_200, value => { draft.identityBrief = value }, true))
      const details = el('details', 'lp-lorebook-profile-details'); details.append(el('summary', '', 'Role, aliases & phone profile'))
      details.append(field('Role', draft.role, 120, value => { draft.role = value }), fieldBlock('Aliases (one per line)', (() => {
        const aliases = el('textarea', 'lp-textarea'); aliases.value = draft.aliases.join('\n'); aliases.maxLength = 2_880
        aliases.oninput = () => { draft.aliases = aliases.value.split('\n').map(alias => alias.trim()).filter(Boolean) }; return aliases
      })()))
      draft.phoneProfile ||= { personality: '', appearance: '', textingStyle: '' }
      for (const [key, title, max] of [['personality', 'Personality', 600], ['appearance', 'Appearance', 360], ['textingStyle', 'Texting style', 600]] as const) details.append(field(title, draft.phoneProfile[key], max, value => { draft.phoneProfile![key] = value }, true))
      card.append(details); form.append(card)
    }
    back.onclick = () => { renderSources(); status.textContent = '' }
    save.onclick = async () => {
      if (save.disabled) return
      busy = true; form.disabled = back.disabled = true; updateSave(); status.textContent = 'Saving reviewed contacts…'
      try {
        const result = await request('lumiphone:lorebook_contacts_save', { drafts: drafts.filter((_, index) => selected.has(index)) })
        if (closed) return
        const summary = el('section', 'lp-lorebook-result'), ornament = el('span', 'lp-lorebook-progress-symbol', '✦'); ornament.setAttribute('aria-hidden', 'true')
        summary.append(ornament, el('h3', '', 'Contacts ready'), el('p', 'lp-copy', `Added ${result.addedCount || 0} contact${result.addedCount === 1 ? '' : 's'}. Reused ${result.reusedCount || 0} existing profile${result.reusedCount === 1 ? '' : 's'}.`), el('p', 'lp-copy', 'Open a contact to save its reusable identity to NPC Bank.'))
        status.textContent = ''; const done = button('Done', 'lp-button lp-button-primary'); done.onclick = () => sheet.dismiss(); summary.append(done); stage.replaceChildren(summary); done.focus()
      } catch (error) { if (!closed) fail(error) }
      finally { busy = false; form.disabled = back.disabled = false; updateSave() }
    }
    const heading = el('h3', 'lp-title', 'Review NPCs'); heading.tabIndex = -1
    const reviewIntro = el('div', 'lp-lorebook-review-intro'); reviewIntro.append(heading, el('p', '', 'A little context, a familiar voice. Choose and refine the people joining your Contacts.'))
    const footer = el('footer', 'lp-lorebook-footer'); footer.append(back, save)
    stage.replaceChildren(reviewIntro, form, footer)
    if (!drafts.length) form.append(el('p', 'lp-copy', 'No supported NPC profiles found. Try other source entries or specify names.'))
    updateSave(); heading.focus()
  }
  scan.onclick = async () => {
    if (scan.disabled) return
    const current = ++revision; busy = true; updateCount()
    const progressView = el('div', 'lp-lorebook-progress'), symbol = el('div', 'lp-lorebook-progress-symbol', '✦')
    symbol.setAttribute('aria-hidden', 'true')
    const steps = el('ol'), meter = el('progress'), elapsed = el('p', 'lp-lorebook-meta'), started = Date.now()
    meter.setAttribute('aria-label', 'Finding NPCs')
    for (const title of ['Read selected entries', 'Build the profiles', 'Check existing contacts']) steps.append(el('li', '', title))
    progressView.append(symbol, el('h3', '', 'Finding your NPCs'), el('p', '', 'Turning scattered lore into familiar faces.'), steps, meter, elapsed)
    stage.replaceChildren(progressView); status.textContent = 'Reading selected lorebooks…'
    progressTimer = window.setInterval(() => { elapsed.textContent = `${Math.floor((Date.now() - started) / 1000)} seconds elapsed` }, 1000)
    const progress = (value: LorebookContactProgress) => {
      if (closed || current !== revision) return
      const active = value.phase === 'request' ? 0 : value.phase === 'parsing' ? 2 : 1
      for (const [index, step] of [...steps.children].entries()) { step.classList.toggle('is-done', index < active); if (index === active) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current') }
      status.textContent = value.message
      if (value.phase === 'request' && value.totalEntries) { meter.max = value.totalEntries; meter.value = value.completedEntries || 0; meter.setAttribute('aria-label', 'Reading source entries') }
      else { meter.removeAttribute('value'); meter.setAttribute('aria-label', 'Finding NPCs') }
    }
    progress({ phase: 'request', message: 'Reading selected lorebooks…' })
    try {
      const response = await request('lumiphone:lorebook_contacts_extract', { sources: [...selection.values()].map(({ bookId, entryId }) => ({ bookId, entryId })), people: people.value }, progress)
      if (closed || current !== revision) return
      busy = false; status.textContent = ''; reviewDrafts(response.drafts || [])
    } catch (error) { if (!closed && current === revision) { renderSources(); fail(error) } }
    finally { busy = false; window.clearInterval(progressTimer); updateCount(); renderBooks() }
  }
  renderSources(); renderEntries(); status.textContent = 'Loading lorebooks…'
  void request('lumiphone:lorebook_contact_books', {}).then(response => {
    if (closed) return
    books = response.books || []; bookSearch.disabled = false
    scope = books.some(book => book.attachedTo?.length) ? 'attached' : 'all'; renderBooks()
    const preferred = books.find(book => book.attachedTo?.length) || books[0]
    if (preferred) void chooseBook(preferred)
    else status.textContent = 'No lorebooks available.'
  }).catch(error => { if (!closed) fail(error) })
  return () => { if (!closed) sheet.dismiss() }
}
