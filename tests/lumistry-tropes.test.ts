import { discoveryFingerprint } from '../src/domain/lumistry-pipeline.js'
import { expect, test } from 'bun:test'
import { DATING_TROPES, MAIN_DATING_TROPES, compatibleDatingTropes, eligibleDatingTropes, normalizeDatingTropeIds, selectDatingPresentation } from '../src/domain/lumistry-tropes.js'
import { DATING_FIELDS, normalizeDating, normalizeDatingProfile, publicDatingProfile } from '../src/domain/lumistry.js'
import { PERSON_TEMPLATE } from '../src/domain/lumistry-person.js'
import { Lumistry } from '../src/backend/lumistry.js'
import type { PhoneState } from '../src/types.js'
const sequence = (...values: number[]) => { let i = 0; return () => values[i++] ?? .99 }

test('full catalog covers 59 documented ideas plus two retained main hooks with stable unique IDs', () => {
  expect(DATING_TROPES).toHaveLength(61)
  expect(new Set(DATING_TROPES.map(t => t.id)).size).toBe(61)
  expect(MAIN_DATING_TROPES.map(t => t.id)).toEqual(['fish-photo', 'group-photos', 'pet-spotlight', 'cropped-ex', 'gym-mirror', 'passport', 'earnest-bio', 'bad-puns', 'image-first'])
  expect(DATING_TROPES.filter(t => !t.main)).toHaveLength(52)
  for (const t of DATING_TROPES) {
    expect(t.profile && t.photos && t.behavior && t.limits).toBeTruthy()
    for (const id of t.excludes) expect(DATING_TROPES.some(x => x.id === id)).toBe(true)
  }
})

function harness() {
  let id = 0, calls: any[] = [], sent: any[] = []
  const profile = () => ({ alias: 'Person ' + (++id), age: 30, distanceKm: 5, fields: Object.fromEntries(DATING_FIELDS.map(k => [k, 'test'])),
    phoneProfile: { appearance: 'brown hair', personality: 'kind', textingStyle: 'concise' },
    person: { ...structuredClone(PERSON_TEMPLATE), writingVoice: { ...PERSON_TEMPLATE.writingVoice, register: 'plain words', effort: 'quickly written', privateContrast: 'more talkative in private' }, life: { ...PERSON_TEMPLATE.life, routine: 'work and hobbies' }, intimacy: { ...PERSON_TEMPLATE.intimacy, kinks: 'vanilla' } },
    photoPlan: [{ prompt: 'A cafe scene', description: 'At a cafe', subjectIds: ['self'] }] })
  let state = { chatId: 'c', characterId: 'a', pocketPersonaActorId: 'owner', pocketPersona: { displayName: 'Persona' }, contacts: [], conversations: [], lumistry: { owner: normalizeDating({ pipeline: { fastDiscovery: false }, self: { ...profile(), alias: 'Moon' } }) } } as unknown as PhoneState
  let callback: (() => void) | undefined
  const host: any = { loadState: async () => structuredClone(state), saveState: async (s: PhoneState) => { state = s }, sendState: async () => {}, send: (m: any) => sent.push(m),
    withStateLock: async (_: string, fn: () => any) => fn(), stateKey: () => 'c/a', nowIso: () => '2026-10-10T00:00:00Z', id: (prefix: string) => prefix + (++id),
    permitted: () => true, getMessages: async () => [], generate: async (...args: any[]) => {
      calls.push(args); callback?.()
      const request = JSON.parse(args[2].messages[1].content)
      return request.batchSize ? { profiles: Array.from({ length: request.batchSize }, profile) } : profile()
    },
  }
  const app = new Lumistry(host)
  return { app, calls, sent, get state() { return state }, set onGenerate(value: (() => void) | undefined) { callback = value }, action: (action: string, input: any = {}) => app.handle({ action, requestId: 'r' + (++id), ...input }, { chatId: 'c', characterId: 'a' }, 'user') }
}

test('settings persist without generation or rewriting saved people and selected IDs stay private on reload', async () => {
  const h = harness()
  const old = normalizeDatingProfile({ alias: 'Existing', age: 32, tropeIds: ['fish-photo'] })!
  h.state.lumistry!.owner.profiles.push(old)
  const before = JSON.stringify(h.state.lumistry!.owner.profiles)
  await h.action('generation_settings', { settings: { allTropes: true } })
  expect(h.calls).toHaveLength(0)
  expect(h.state.lumistry!.owner.generationSettings.allTropes).toBe(true)
  expect(JSON.stringify(h.state.lumistry!.owner.profiles)).toBe(before)
  const reloaded = normalizeDating(JSON.parse(JSON.stringify(h.state.lumistry!.owner)))
  expect(reloaded.generationSettings.allTropes).toBe(true)
  expect(reloaded.profiles[0].tropeIds).toEqual(['fish-photo'])
  expect(JSON.stringify(publicDatingProfile(reloaded.profiles[0]))).not.toContain('tropeIds')
  expect(normalizeDatingTropeIds(['unknown', 'fish-photo', 'fish-photo', 'gym-mirror', 'passport'])).toEqual(['fish-photo', 'gym-mirror'])
})

test('Lumistry settings exposes one opt-in switch while preserving the always-available main nine', async () => {
  const { JSDOM } = await import('jsdom')
  const { renderLumistry, newDatingUI } = await import('../src/frontend/apps/lumistry.js')
  const dom = new JSDOM('<!doctype html><body></body>'), previous = globalThis.document,previousInput=globalThis.HTMLInputElement
  globalThis.document = dom.window.document;globalThis.HTMLInputElement=dom.window.HTMLInputElement
  try {
    const h = harness(), actions: any[] = []
    const page = renderLumistry({ state: h.state, owner: 'owner', ui: { ...newDatingUI(), tab: 'settings',settingsPage:'world' }, generation: false, images: false, backgroundEnabled: false, automaticReplies: false,
      action: (...args: any[]) => actions.push(args), render: () => {}, back: () => {}, openConversation: () => {}, gallery: () => {} })
    expect(page.textContent).toContain('all 61 tropes')
    expect(page.textContent).toContain('Off uses the nine main tropes')
    const toggle = [...page.querySelectorAll<HTMLInputElement>('input[type=checkbox]')].find(x=>x.parentElement?.textContent?.includes('Use the full trope catalog'))!
    expect(toggle.checked).toBe(false)
    const adult=[...page.querySelectorAll<HTMLInputElement>('input[type=checkbox]')].find(x=>x.parentElement?.textContent?.includes('Include adult-industry jobs'))!;expect(adult.checked).toBe(true)
    expect(page.querySelector('[aria-label="Population world profile"]')).not.toBeNull();expect(page.textContent).not.toContain('Private archived authoring')
    toggle.checked = true; toggle.dispatchEvent(new dom.window.Event('change'))
    const save = [...page.querySelectorAll('button')].find(b => b.textContent?.includes('Save world & people'))!
    expect(save.disabled).toBe(false)
    save.click()
    expect(actions[0][0]).toBe('setup_direct'); expect((actions[0][1] as any).value.allTropes).toBe(true);expect((actions[0][1] as any).value.experience).toBeUndefined()
  } finally { globalThis.document = previous;globalThis.HTMLInputElement=previousInput; dom.window.close() }
})


test('appearance persists independently of generation settings and rejects NPC-device edits', async () => {
  const h = harness(), before = JSON.stringify(h.state.lumistry!.owner.profiles)
  expect(normalizeDating(null).theme).toBe('sticker')
  await h.action('theme', { theme: 'distillery' })
  expect(normalizeDating(JSON.parse(JSON.stringify(h.state.lumistry!.owner))).theme).toBe('distillery')
  expect(h.state.lumistry!.owner.generationSettings.allTropes).toBe(false)
  expect(JSON.stringify(h.state.lumistry!.owner.profiles)).toBe(before)
  expect(h.calls).toHaveLength(0)
  await expect(h.action('theme', { theme: 'sticker', deviceOwnerActorId: 'npc' })).rejects.toThrow('Persona device')
  expect(h.state.lumistry!.owner.theme).toBe('distillery')
  const fingerprint = discoveryFingerprint(h.state.lumistry!.owner);
  await h.action('theme', { theme: 'modern' });
  expect(normalizeDating(JSON.parse(JSON.stringify(h.state.lumistry!.owner))).theme).toBe('modern');
  expect(discoveryFingerprint(h.state.lumistry!.owner)).toBe(fingerprint);
  expect(JSON.stringify(h.state.lumistry!.owner.profiles)).toBe(before);
  expect(h.calls).toHaveLength(0);
  await h.action('theme', { theme: 'invalid' })
  expect(h.state.lumistry!.owner.theme).toBe('sticker')
})
test('V2 trope selection is engine-owned, parody opt-in and all retained seeds are reachable',()=>{
 expect(normalizeDating(null).generationSettings.allTropes).toBe(false);
 expect(selectDatingPresentation(false,'',sequence(.01,.01)).flavor).not.toContain('parody');
 expect(selectDatingPresentation(false,'',sequence(.01),{version:2,scope:'A',tone:'balanced',tropeRate:28,exaggeration:45,socialLift:25,socialIntensity:40,parody:true,voiceLab:false}).flavor).toContain('parody');
 for(let i=0;i<9;i++)expect(selectDatingPresentation(false,'',sequence(.01,(i+.5)/9)).tropes[0].id).toBe(MAIN_DATING_TROPES[i].id);
 const world='A cyberpunk small town';const extra=eligibleDatingTropes(true,world).filter(t=>!t.main);
 for(let i=0;i<extra.length;i++)expect(selectDatingPresentation(true,world,sequence(.01,.9,(i+.5)/extra.length,.99)).tropes[0].id).toBe(extra[i].id);
 expect(eligibleDatingTropes(true,'A modern city')).toHaveLength(55);
 for(const t of eligibleDatingTropes(true,''))expect(t.condition).toBe('any');
 const group=DATING_TROPES.find(t=>t.id==='group-photos')!,selfie=DATING_TROPES.find(t=>t.id==='identical-selfies')!;expect(compatibleDatingTropes(group,selfie)).toBe(false);
});