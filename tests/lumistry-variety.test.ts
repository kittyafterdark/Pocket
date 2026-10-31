import { expect, test } from 'bun:test'
import { datingReplyMessages, normalizeDating, normalizeDatingProfile, publicDatingProfile } from '../src/domain/lumistry.js'
import { normalizeDatingPerson, PERSON_TEMPLATE } from '../src/domain/lumistry-person.js'
import { v2AuthorPrompt } from '../src/backend/lumistry-v2-prompts.js'
import { lumistryHarness } from './fixtures/lumistry-harness.js'
import type { PhoneState, PocketConversation } from '../src/types.js'
import { BIO_SHAPES, RELATIONSHIP_FOCUSES, QUESTION_FOCUSES, recentDatingProse, selectDatingVariety } from '../src/domain/lumistry-variety.js'

test('variety plans vary writing structures without imposing name or detail initials', () => {
  const profiles = ['Ada', 'Alex', 'Amir'].map(alias => normalizeDatingProfile({ alias, age: 30 })!)
  const plans = selectDatingVariety(profiles, 2, () => 0)
  for(const p of plans){expect(p).not.toHaveProperty('nameInitial');expect(p).not.toHaveProperty('detailInitial')}
  expect(new Set(plans.map(p => p.bioShape)).size).toBe(2)
  expect(new Set(plans.map(p => p.characterFocus)).size).toBe(2)
  expect(new Set(plans.map(p => p.photoApproach)).size).toBe(2)
  expect(profiles.map(p => p.alias)).toEqual(['Ada', 'Alex', 'Amir'])
})

test('writing structures remain reachable and larger batches safely refill without alphabetical name quotas', () => {
  const plans = selectDatingVariety([], 26, () => 0)
  expect(new Set(plans.map(p => p.bioShape)).size).toBe(BIO_SHAPES.length)
  for (const p of plans) {
    expect(p).not.toHaveProperty('nameInitial')
    expect(p).not.toHaveProperty('detailInitial')
    expect(p.bioShape && p.characterFocus && p.photoApproach).toBeTruthy()
  }
  expect(selectDatingVariety([], 1, () => .999)[0]).not.toHaveProperty('nameInitial')
})

test('repetition references are bounded public prose without private identity or diffusion data', () => {
  const profiles = Array.from({ length: 20 }, (_, i) => normalizeDatingProfile({
    alias: `Public ${i}`, age: 30, bio: 'b'.repeat(1000), privateFields: { behavior: 'PRIVATE' },
    person: { ...PERSON_TEMPLATE, life: { ...PERSON_TEMPLATE.life, routine: 'PRIVATE' }, prompts: Array.from({length: 5}, () => ({question: 'q'.repeat(120), answer: 'a'.repeat(360)})) },
    photoPlan: Array.from({ length: 5 }, () => ({ caption: 'c'.repeat(200), description: 'd'.repeat(400), prompt: 'DIFFUSION', subjectIds: ['PRIVATE'] })),
  })!)
  const refs = recentDatingProse(profiles)
  expect(refs).toHaveLength(16)
  expect(refs[0].alias).toBe('Public 4')
  expect(refs[0].bio.length).toBeLessThanOrEqual(300)
  expect(refs[0].photos).toHaveLength(1)
  expect(refs[0].questions).toHaveLength(3)
  expect(refs[0].questions[0].question).toHaveLength(90)
  expect(refs[0].questions[0].answer).toHaveLength(180)
  const oldReference = {alias:profiles[4].alias,bio:profiles[4].bio.slice(0,500),photos:profiles[4].photoPlan.slice(0,3).map(p=>({caption:p.caption.slice(0,120),description:p.description.slice(0,240)}))}
  expect(JSON.stringify(refs[0]).length).toBeLessThan(JSON.stringify(oldReference).length)
  expect(refs[0].photos[0].caption.length).toBeLessThanOrEqual(90)
  expect(refs[0].photos[0].description.length).toBeLessThanOrEqual(180)
  expect(JSON.stringify(refs)).not.toMatch(/PRIVATE|DIFFUSION/)
})

test('public writing voice survives saved-profile reload but remains outside public and repetition references', () => {
  const writingVoice = { basis: 'PRIVATE: friends write short messages', register: 'plain casual vocabulary', mechanics: 'lowercase, sparse punctuation',
    rhythm: 'brief fragments', effort: 'written quickly', audience: 'people with similar free evenings', selfImage: 'easygoing, hides nervousness', privateContrast: 'longer messages once comfortable' }
  const p = normalizeDatingProfile({ alias: 'Public', age: 22, bio: 'usually out late',
    phoneProfile: { textingStyle: 'lowercase fragments; longer with friends' },
    person: { ...PERSON_TEMPLATE, writingVoice },
  })!
  const reloaded = normalizeDating(JSON.parse(JSON.stringify({ profiles: [p] }))).profiles[0]
  expect(reloaded.person?.writingVoice).toEqual(writingVoice)
  expect(reloaded.phoneProfile.textingStyle).toBe(p.phoneProfile.textingStyle)
  expect(JSON.stringify(publicDatingProfile(reloaded))).not.toMatch(/writingVoice|PRIVATE|selfImage/)
  expect(JSON.stringify(recentDatingProse([reloaded]))).not.toMatch(/writingVoice|PRIVATE|selfImage/)
})

test('legacy people do not acquire a writing voice and malformed voice data is bounded or ignored', () => {
  const legacy = { ...PERSON_TEMPLATE } as Record<string, unknown>
  delete legacy.writingVoice
  expect(normalizeDatingPerson(legacy)?.writingVoice).toBeUndefined()
  expect(normalizeDatingPerson({ ...legacy, writingVoice: ['bad'] })?.writingVoice).toBeUndefined()
  const voice = normalizeDatingPerson({ ...legacy, writingVoice: { register: 'r'.repeat(1000), mechanics: 7, extra: 'discard' } })?.writingVoice
  expect(voice?.register).toHaveLength(600)
  expect(voice?.mechanics).toBe('')
  expect(voice).not.toHaveProperty('extra')
})

test('native dating reply receives only its own saved writing voice, not another profile or Persona private style', () => {
  const person = (alias: string, marker: string) => normalizeDatingProfile({ alias, age: 30, id: alias,
    person: { ...PERSON_TEMPLATE, writingVoice: { ...PERSON_TEMPLATE.writingVoice, basis: marker, privateContrast: 'more relaxed in messages' } },
    phoneProfile: { textingStyle: marker + ' texting habits' },
  })!
  const self = person('Persona', 'PERSONA_PRIVATE_VOICE'), own = person('Match', 'OWN_SAVED_VOICE'), other = person('Other', 'OTHER_PRIVATE_VOICE')
  const conversation = { id: 'thread', channel: 'dating', datingOwnerId: 'owner', messages: [] } as unknown as PocketConversation
  const state = { pocketPersonaActorId: 'owner', contacts: [], conversations: [conversation],
    lumistry: { owner: normalizeDating({ self, profiles: [own, other], decisions: [{ profileId: own.id, conversationId: conversation.id, action: 'like', status: 'matched' }] }) },
  } as unknown as PhoneState
  const request = JSON.stringify(datingReplyMessages(state, conversation, ''))
  expect(request).toContain('OWN_SAVED_VOICE')
  expect(request).toContain('more relaxed in messages')
  expect(request).not.toContain('PERSONA_PRIVATE_VOICE')
  expect(request).not.toContain('OTHER_PRIVATE_VOICE')
})


test('relationship and question lenses vary without replacement, refill and survive persisted job normalization', () => {
  const plans = selectDatingVariety([], 26, () => 0)
  expect(new Set(plans.slice(0, RELATIONSHIP_FOCUSES.length).map(p => p.relationshipFocus)).size).toBe(RELATIONSHIP_FOCUSES.length)
  expect(new Set(plans.slice(0, 4).flatMap(p => p.questionFocuses)).size).toBe(QUESTION_FOCUSES.length)
  for (const plan of plans) expect(new Set(plan.questionFocuses).size).toBe(3)
  const data = normalizeDating({discoveryJob:{version:2,id:'job',fingerprint:'f',status:'filling',slots:[{id:'slot_0',status:'pending',variety:plans[0],photoCount:1,questionCount:1}]}})
  const reloaded = normalizeDating(JSON.parse(JSON.stringify(data)))
  expect(reloaded.discoveryJob?.slots[0].variety).toEqual(plans[0])
})

test('public generation receives bounded prior Q&A and saved lenses in its existing request', async () => {
  const h = lumistryHarness(24)
  await h.run()
  const dossier = h.calls.find(call => call.req.task === 'dossier')!
  const publicCall = h.calls.find(call => call.req.task === 'public')!
  const plan = h.state.lumistry.owner.discoveryJob!.slots[0].plan!
  const droppedLifeFocus = plan.selectionAudit.rejectedSoftChoices.includes('Dropped extra life-focus demand for an ordinary life configuration')
  const expectedVariety = structuredClone(dossier.req.variety)
  if (droppedLifeFocus) delete expectedVariety.characterFocus
  delete expectedVariety.relationshipFocus
  expect(publicCall.req.variety).toEqual(expectedVariety)
  expect(Boolean(publicCall.req.variety.characterFocus)).toBe(!droppedLifeFocus)
  expect(publicCall.req.variety.questionFocuses).toHaveLength(3)
  expect(publicCall.req.variety).not.toHaveProperty('relationshipFocus')
  expect(publicCall.req.recentPublicWriting[0].questions).toEqual([{question:'a?',answer:'yes'},{question:'b?',answer:'maybe'}])
  expect(JSON.stringify(publicCall.req.recentPublicWriting)).not.toContain('PRIVATE OWNER')
  expect(h.calls.filter(call => !['dossier','index','public','photos'].includes(call.req.task))).toHaveLength(0)
  expect(v2AuthorPrompt('dossier')).toContain('do not infer wealth, hardship, gender roles')
  expect(v2AuthorPrompt('public')).toContain('answer substance and stock phrasing')
})

import {creationTaskContext} from '../src/backend/lumistry-creation-context.js';
import {v2RepairPrompt} from '../src/backend/lumistry-v2-prompts.js';
import {NAME_CRAFT} from '../src/domain/lumistry-craft.js';

test('legacy saved initial hints cannot pressure new dossier or public writing and names remain unchanged',()=>{
 const input={task:'dossier',variety:{nameInitial:'X',detailInitial:'Q',bioShape:'plain',questionFocuses:['ordinary day']}};
 const dossierContext=creationTaskContext(input),publicContext=creationTaskContext({...input,task:'public'});
 for(const context of [dossierContext,publicContext]){expect(context.variety).not.toHaveProperty('nameInitial');expect(context.variety).not.toHaveProperty('detailInitial');expect(context.variety.bioShape).toBe('plain')}
 expect(input.variety.nameInitial).toBe('X');expect(v2AuthorPrompt('dossier')).toContain(NAME_CRAFT);expect(v2RepairPrompt('dossier',['Public alias'])).toContain(NAME_CRAFT);
 expect(v2AuthorPrompt('dossier')).toContain('normally the real first name or a familiar nickname');
 const p=normalizeDatingProfile({alias:'Chosen existing handle',age:30})!;selectDatingVariety([p],25,()=>.5);expect(p.alias).toBe('Chosen existing handle');
});

import {recentOverusedMotifs} from '../src/domain/lumistry-variety.js';
import {INCIDENTAL_DETAIL_RULE} from '../src/domain/lumistry-craft.js';
test('cross-profile motif hints detect repeated public quirks without treating repetition by one person as a population fact',()=>{
 const make=(id:string,bio:string)=>normalizeDatingProfile({id,alias:id,age:30,bio,privateFields:{secret:'hidden parallel parking fact'}})!;
 const a=make('a','Good at fixing things, awful at parallel parking.'),b=make('b','Mental arithmetic is easy. Parallel parking is harder.'),c=make('c','My nephew sent a postcard.');
 expect(recentOverusedMotifs([a,b,c])).toContain('parallel parking');expect(recentOverusedMotifs([a,a,c])).not.toContain('parallel parking');expect(recentOverusedMotifs([c])).toEqual([]);
 expect(v2AuthorPrompt('dossier')).toContain(INCIDENTAL_DETAIL_RULE);expect(v2AuthorPrompt('public')).toContain(INCIDENTAL_DETAIL_RULE);
});
