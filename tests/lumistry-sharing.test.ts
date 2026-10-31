import { expect, test } from 'bun:test'
import { createLumistryCapture, lumistryCaptureText, normalizeLumistryCapture, ordinaryCaptureTarget } from '../src/domain/lumistry-sharing.js'
import { normalizeDating, normalizeDatingProfile } from '../src/domain/lumistry.js'
import { normalizeContactCollections } from '../src/domain/contacts.js'
import { assemblePocketContext } from '../src/backend/roleplay-context.js'
import { defaultPreferences } from '../src/domain/preferences.js'
import type { PhoneState, PocketConversation } from '../src/types.js'

function fixture() {
  const self = normalizeDatingProfile({ id: 'self', alias: 'Moon', age: 30 })!
  const profile = normalizeDatingProfile({ id: 'dating_npc_1', alias: 'NightOwl', age: 29,
    privateFields: { preferences: 'PRIVATE PREFERENCE', behavior: 'SECRET REAL NAME' },
    phoneProfile: { appearance: 'PRIVATE IDENTITY TAGS' },
    photoPlan: [{ prompt: 'PRIVATE GENERATION PROMPT', description: 'A selfie in a blue shirt.', caption: 'Friday', subjectIds: ['self'] }],
  })!
  const dating = { id: 'dating', channel: 'dating', datingOwnerId: 'owner', kind: 'direct', includesPocketPersona: true,
    participantContactIds: ['match'], participantActorIds: ['match'], messages: [
      { id: 'a', sender: 'contact', senderName: 'SECRET REAL NAME', text: 'Weird opening line', createdAt: 'now' },
      { id: 'b', sender: 'persona', senderName: 'HIDDEN PERSONA', text: 'Seriously?', createdAt: 'now' },
      { id: 'c', sender: 'contact', senderName: 'SECRET REAL NAME', text: 'Look', datingPhoto: { description: 'An unsolicited explicit adult photo.', prompt: 'PRIVATE DIFFUSION PROMPT', anchor: 'HIDDEN TAGS', subjectIds: ['self'] }, createdAt: 'now' },
      { id: 'd', sender: 'system', text: 'SYSTEM SECRET' },
      { id: 'e', sender: 'contact', text: 'PROVISIONAL SECRET', candidateCommitState: 'provisional' },
    ], availability: { state: 'remote' }, title: 'SECRET REAL NAME' } as PocketConversation
  const friend = { id: 'friend', kind: 'direct', includesPocketPersona: true, participantContactIds: ['friend-id'], participantActorIds: ['friend-id'], messages: [], title: 'Friend', availability: { state: 'remote' } } as unknown as PocketConversation
  const data = normalizeDating({ self, profiles: [profile], decisions: [{ profileId: profile.id, action: 'like', status: 'matched', conversationId: dating.id }] })
  const state = { pocketPersonaActorId: 'owner', chatId: 'chat', characterId: 'character', pocketPersona: { displayName: 'HIDDEN PERSONA' }, lumistry: { owner: data }, conversations: [dating, friend], contacts: [] } as unknown as PhoneState
  return { state, dating, friend, profile }
}

test('screenshot copies only selected words and public aliases in chronological order', () => {
  const { state } = fixture()
  const capture = createLumistryCapture(state, { kind: 'screenshot', conversationId: 'dating', messageIds: ['b', 'a'], caption: 'Look at this' })
  expect(capture.entries.map(e => e.speaker)).toEqual(['NightOwl', 'Moon'])
  expect(capture.entries.map(e => e.text)).toEqual(['Weird opening line', 'Seriously?'])
  const text = lumistryCaptureText(capture)
  expect(text).toContain('Look at this')
  expect(text).not.toContain('SECRET')
  expect(text).not.toContain('HIDDEN')
  expect(text).not.toContain('Look"')
})

test('chat and profile photos share descriptions without pixels, prompts or private identity', () => {
  const { state, profile } = fixture()
  const chat = createLumistryCapture(state, { kind: 'message_photos', conversationId: 'dating', messageIds: ['c'] })
  expect(chat.entries[0].text).toBe('')
  expect(chat.entries[0].photoDescription).toBe('An unsolicited explicit adult photo.')
  const photos = createLumistryCapture(state, { kind: 'profile_photos', profileId: profile.id, photoIndexes: [0] })
  expect(photos.entries[0].photoDescription).toBe('A selfie in a blue shirt.')
  for (const capture of [chat, photos]) {
    const text = JSON.stringify(capture)
    expect(text).not.toContain('PRIVATE')
    expect(text).not.toContain('SECRET')
    expect(text).not.toContain('subjectIds')
    expect(text).not.toContain('imageId')
  }
})

test('capture rejects NPC-owned threads, missing/deleted/system/provisional selections and invalid photos', () => {
  const { state, dating, profile } = fixture()
  for (const id of ['missing', 'd', 'e']) expect(() => createLumistryCapture(state, { kind: 'screenshot', conversationId: 'dating', messageIds: [id] })).toThrow()
  expect(() => createLumistryCapture(state, { kind: 'message_photos', conversationId: 'dating', messageIds: ['a'] })).toThrow()
  expect(() => createLumistryCapture(state, { kind: 'profile_photos', profileId: profile.id, photoIndexes: [-1] })).toThrow()
  dating.datingOwnerId = 'another-npc'
  expect(() => createLumistryCapture(state, { kind: 'screenshot', conversationId: 'dating', messageIds: ['a'] })).toThrow()
})

test('sharing requires an ordinary direct thread; captured evidence is immutable and bounded', () => {
  const { state, dating, friend } = fixture()
  expect(ordinaryCaptureTarget(state, friend)).toBe(true)
  expect(ordinaryCaptureTarget(state, dating)).toBe(false)
  expect(ordinaryCaptureTarget(state, { ...friend, kind: 'group' })).toBe(false)
  expect(ordinaryCaptureTarget(state, { ...friend, archived: true })).toBe(false)
  const capture = createLumistryCapture(state, { kind: 'screenshot', conversationId: 'dating', messageIds: ['a'] })
  const before = lumistryCaptureText(capture)
  dating.messages[0].text = 'Changed source'
  expect(lumistryCaptureText(capture)).toBe(before)
  expect(lumistryCaptureText(createLumistryCapture(state, { kind: 'screenshot', conversationId: 'dating', messageIds: ['a'] }))).not.toBe(before)
  const large = normalizeLumistryCapture({ kind: 'screenshot', title: 'x'.repeat(1000), caption: 'x'.repeat(1000), entries: Array.from({length: 20}, () => ({ speaker: 'x'.repeat(1000), text: 'x'.repeat(1000), photoDescription: 'x'.repeat(1000), private: 'NEVER COPIED' })) })!
  expect(large).toBeUndefined() // Oversized evidence is rejected, never reduced to misleading prefixes.
  expect(JSON.stringify(normalizeLumistryCapture({kind:'screenshot',entries:[{speaker:'A',text:'Complete words',private:'NEVER COPIED'}]}))).not.toContain('NEVER COPIED')
})

test('native message normalization retains capture and canonical text through reload and selected-thread context', async () => {
  const { state, friend } = fixture()
  const capture = createLumistryCapture(state, { kind: 'message_photos', conversationId: 'dating', messageIds: ['c'] })
  friend.messages.push({ id: 'shared', sender: 'persona', senderName: 'You', senderAccent: '', sharedCapture: capture, text: lumistryCaptureText(capture), createdAt: '2026-10-10T12:00:00Z', read: true, status: 'sent' })
  const normalized = normalizeContactCollections(JSON.parse(JSON.stringify(state)), { characterId: 'character', characterName: 'Character', now: '2026-10-10T12:00:00Z', makeId: p => p + 'test', personaActorId: 'owner' })
  const saved = normalized.conversations.find(c => c.id === friend.id)!
  expect(saved.messages[0].sharedCapture).toEqual(capture)
  expect(saved.messages[0].text).toBe(lumistryCaptureText(capture))
  const preferences = defaultPreferences(); preferences.roleplayContextMode = 'off'
  const context = await assemblePocketContext({ state, conversation: saved, contact: { name: 'Friend', id: 'friend-id', identityBrief: 'Friend' } as any, preferences })
  expect(context.text).toContain('An unsolicited explicit adult photo.')
  expect(context.text).not.toContain('Weird opening line')
})

test('share sheet previews chat photos and emits a native send to the chosen friend without image data', async () => {
  const { JSDOM } = await import('jsdom')
  const { lumistryShareSheet } = await import('../src/frontend/components/lumistry-share-sheet.js')
  const dom = new JSDOM('<!doctype html><body></body>')
  const previous = globalThis.document
  globalThis.document = dom.window.document
  try {
    const { state } = fixture()
    let payload: any, dismissed = false
    const sheet = lumistryShareSheet({ state, targetConversationId: 'friend', send: value => { payload = value }, dismiss: () => { dismissed = true } })
    const mode = sheet.querySelectorAll('select')[0]
    mode.value = 'message_photos'; mode.dispatchEvent(new dom.window.Event('change'))
    expect(sheet.textContent).not.toContain('SECRET REAL NAME')
    expect(sheet.textContent).not.toContain('PRIVATE DIFFUSION PROMPT')
    const check = sheet.querySelector<HTMLInputElement>('input[type=checkbox]')!
    check.checked = true; check.dispatchEvent(new dom.window.Event('change'))
    const caption = sheet.querySelector('textarea')!
    caption.value = 'Can you believe this?'; caption.dispatchEvent(new dom.window.Event('input'))
    expect(sheet.querySelector('.lp-shared-capture')?.textContent).toContain('An unsolicited explicit adult photo.')
    const send = [...sheet.querySelectorAll('button')].find(b => b.textContent === 'Send to friend')!
    expect(send.disabled).toBe(false)
    send.click()
    expect(dismissed).toBe(true)
    expect(payload.action).toBe('message')
    expect(payload.payload.conversationId).toBe('friend')
    expect(payload.payload.lumistryCapture.kind).toBe('message_photos')
    expect(payload.payload.text).toContain('Can you believe this?')
    expect(payload.payload.text).toContain('An unsolicited explicit adult photo.')
    expect(payload.payload.text).not.toContain('PRIVATE')
    expect(payload.payload.imageId).toBeUndefined()
  } finally { globalThis.document = previous; dom.window.close() }
})
