import {test,expect} from 'bun:test'
import {defaultPreferences,normalizePreferences} from '../src/domain/preferences.js'
import {normalizeChatAppearance} from '../src/domain/chat-appearance.js'

test('appearance defaults migrate safely and separate platform scales remain bounded',()=>{
  const old=normalizePreferences({uiScale:1.2})
  expect(old.independentUiScale).toBe(false);expect(old.mobileUiScale).toBe(1.2);expect(old.desktopUiScale).toBe(1.2)
  const malformed=normalizePreferences({...defaultPreferences(),mobileUiScale:99,desktopUiScale:-2,iconPack:'unknown',iconBackground:'url(evil)',bubblePadding:0})
  expect(malformed.mobileUiScale).toBe(1.3);expect(malformed.desktopUiScale).toBe(.7)
  expect(malformed.iconPack).toBe('classic');expect(malformed.iconBackground).toBe('#524478');expect(malformed.bubblePadding).toBe(4)
  expect(normalizeChatAppearance({radius:99,padding:Infinity})).toEqual({radius:32})
})


test('Persona icon packs are optional, validated, and preserve device defaults',()=>{
  const preferences=normalizePreferences({...defaultPreferences(),iconPack:'paper',personaAppearance:{fern:{enabled:true,iconPack:'midnight',iconBackground:'bad',iconForeground:'#abcdef'},legacy:{enabled:true},unknown:{enabled:true,iconPack:'invalid'}}})
  expect(preferences.iconPack).toBe('paper')
  expect(preferences.personaAppearance.fern.iconPack).toBe('midnight')
  expect(preferences.personaAppearance.fern.iconBackground).toBe('#524478')
  expect(preferences.personaAppearance.fern.iconForeground).toBe('#abcdef')
  expect(preferences.personaAppearance.legacy.iconPack).toBeUndefined()
  expect(preferences.personaAppearance.unknown.iconPack).toBeUndefined()
})
