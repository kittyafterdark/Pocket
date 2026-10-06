import type { IdentityProfile } from '../../domain/identity-profiles.js'
import { button, el } from '../shared.js'

export function identityProfileControls(profiles: IdentityProfile[], kind: IdentityProfile['kind'], contactId: string | undefined, send: (type: string, payload?: Record<string, unknown>) => unknown, readProfile?: () => Record<string, unknown>): HTMLElement {
  const panel = el('section', 'lp-card lp-settings-section lp-identity-library')
  panel.dataset.profileKind = kind
  panel.append(el('strong', '', 'Reusable phone profiles'), el('p', 'lp-copy', 'Save stable identity and texting style for other chats. Scene state and phone history stay here.'))
  const options = profiles.filter(entry => entry.kind === kind)
  const select = el('select', 'lp-select'); select.setAttribute('aria-label', `Saved ${kind} profile`)
  select.append(new Option(options.length ? 'Choose a saved profile' : 'No saved profiles yet', ''))
  for (const entry of options) select.append(new Option(entry.name, entry.id))
  const use = button('Use profile', 'lp-button lp-button-quiet'); use.disabled = true
  select.addEventListener('change', () => { use.disabled = !select.value })
  use.addEventListener('click', () => send('lumiphone:identity_profile_apply', { profileId: select.value, kind, contactId }))
  const save = button('Save current profile', 'lp-button')
  save.dataset.identitySave = 'true'
  save.addEventListener('click', () => {
    const requestId = send('lumiphone:identity_profile_save', { kind, contactId, profile: readProfile?.() })
    panel.dataset.identityRequest = String(requestId || '')
    save.textContent = 'Saving…'; save.disabled = true
  })
  const actions = el('div', 'lp-row'); actions.append(save, use); panel.append(select, actions)
  return panel
}

export function refreshIdentityProfileControls(root: HTMLElement, profiles: IdentityProfile[], failed = false): void {
  for (const panel of root.querySelectorAll<HTMLElement>('.lp-identity-library')) {
    const select = panel.querySelector('select')!
    const selected = select.value
    const entries = profiles.filter(entry => entry.kind === panel.dataset.profileKind)
    select.replaceChildren(new Option(entries.length ? 'Choose a saved profile' : 'No saved profiles yet', ''))
    for (const entry of entries) select.append(new Option(entry.name, entry.id))
    select.value = selected
    const save = panel.querySelector<HTMLButtonElement>('[data-identity-save]')!
    if (save.disabled) { save.disabled = false; save.textContent = failed ? 'Retry saving profile' : 'Saved · save again' }
    delete panel.dataset.identityRequest
  }
}
