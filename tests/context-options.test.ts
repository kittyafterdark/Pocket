import { expect, test } from 'bun:test'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { fullProfile, profileContext, freeformLore } from '../src/backend/context-options.js'

test('profile preference migrates safely and contact overrides win', () => {
  const preferences = normalizePreferences({ preferFullProfiles: true, enableLorebooks: true })
  expect(defaultPreferences().enableLorebooks).toBe(false)
  const contact: any = { contextPolicy: { profileMode: 'default' } }
  expect(fullProfile(contact, preferences)).toBe(true)
  contact.contextPolicy.profileMode = 'compact'
  expect(profileContext(contact, {description:'Full definition', personality:'Voice', behavior:'Scenario'}, preferences, 'Brief')).toBe('Brief')
  contact.contextPolicy.profileMode = 'full'
  expect(profileContext(contact, {description:'Full definition', personality:'Voice', behavior:'Scenario'}, defaultPreferences(), 'Brief')).toContain('Full definition')
})

test('Freeform lore respects disabled, constant, literal keys, secondary keys and deduplication', () => {
  const entries = [
    {id:'always', constant:true, content:'World facts'},
    {id:'disabled', constant:true, disabled:true, content:'Hidden'},
    {id:'key', key:['library'], content:'Library facts'},
    {id:'secondary', key:['library'], selective:true, keysecondary:['night'], content:'Night facts'},
    {id:'word', key:['cat'], match_whole_words:true, content:'Cat facts'},
    {id:'regex', key:['.*'], use_regex:true, content:'Regex facts'},
    {id:'key', constant:true, content:'Duplicate'},
  ]
  const result = freeformLore(entries, 'The LIBRARY is open at night. A catalogue awaits.')
  expect(result).toContain('World facts'); expect(result).toContain('Library facts'); expect(result).toContain('Night facts')
  for (const absent of ['Hidden', 'Cat facts', 'Regex facts', 'Duplicate']) expect(result).not.toContain(absent)
  expect(freeformLore(entries, 'Daytime library')).not.toContain('Night facts')
})
