import {interestContext} from '../src/domain/lumistry-compatibility.js';
import {WORLD_READING_LIMITS,worldCharacterEvidence,worldRecentEvidence} from '../src/domain/lumistry-world-reading.js';
import { expect, test } from 'bun:test';
import { Lumistry } from '../src/backend/lumistry.js';
import { datingFor, normalizeDating, normalizeDatingProfile, datingFit, publicDatingProfile, datingReplyMessages, datingDisplayState, hiddenDatingContact } from '../src/domain/lumistry.js';
import { normalizeContactCollections, ensureDirectConversation } from '../src/domain/contacts.js';
import { conversationVisibleOnDevice } from '../src/domain/device.js';
import type { PhoneState } from '../src/types.js';
const profile = (extra: any = {}) => normalizeDatingProfile({ id: 'dating_npc_1', alias: 'Juniper', age: 28, distanceKm: 8, fields: { interests: 'books, hiking' }, privateFields: { boundaries: 'secret-boundary' }, phoneProfile: { appearance: 'short brown hair' }, interest: { version: 2, status: 'matched', seen: true }, ...extra })!;
function harness() {
    let seq = 0, state = { version: 12, chatId: 'c', characterId: 'a', characterName: 'Alice', pocketPersonaActorId: 'owner', pocketPersona: { displayName: 'HIDDEN REAL NAME', identityBrief: 'SECRET PERSONA' }, contacts: [], conversations: [], lumistry: { owner: normalizeDating(null) } } as unknown as PhoneState;
    const sent: any[] = [], calls: any[] = [], cancelled: string[] = [], permissions = new Set(['generation', 'image_gen', 'images', 'chat_mutation']);
    let clock = '2026-10-10T12:00:00Z';
    let generate = async () => ({ status: 'matched' } as any), camera = async () => ({ imageId: 'photo-a' } as any);
    const h: any = { loadState: async () => structuredClone(state), saveState: async (s: any) => state = structuredClone(s), sendState: async (s: any) => sent.push({ state: structuredClone(s) }), send: (s: any, user: string) => sent.push({ ...s, user }), withStateLock: async (_: string, fn: any) => fn(), stateKey: () => 'c/a', nowIso: () => clock, id: (p: string) => `${p}_${++seq}`, generate: async (...args: any[]) => { calls.push(args); return generate(); }, permitted: (p: string) => permissions.has(p), camera: () => camera(), cancelCamera: (id: string) => cancelled.push(id), validateImage: async (id: string) => {
            if (id !== 'photo-a')
                throw Error('Image missing');
        }, personaEvidence: async () => ({ displayName: "HIDDEN REAL NAME", description: "Adult Persona" }), getMessages: async () => [], cancelReply: (...args: string[]) => cancelled.push(args[2]) };
    const app = new Lumistry(h), action = (action: string, input: any = {}) => app.handle({ requestId: `r${++seq}`, action, ...input }, { chatId: 'c', characterId: 'a' }, 'test-user');
    return { h, app, action, sent, calls, cancelled, permissions, get state() { return state; }, set now(value: string) { clock = value; }, set generate(fn: () => Promise<any>) { generate = fn; }, set camera(fn: () => Promise<any>) { camera = fn; } };
}
async function setup() { const t = harness(); await t.action('self', { profile: profile({ id: 'self', alias: 'Moon', privateFields: { kinks: 'USER SECRET' }, fields: { religion: 'hidden-religion' }, hiddenFields: ['religion'] }) }); const p=profile();p.interest.context=interestContext(datingFor(t.state));await t.action('accept', { profile: p }); return t; }
test('adult validation, safe structured fields and default unrestricted filters', () => {
    for (const age of [0, 17, 17.9, 'unknown', null])
        expect(normalizeDatingProfile({ alias: 'X', age })).toBeNull();
    expect(normalizeDating(null).filters).toEqual({ minAge: 18, maxAge: 99, maxKm: 50, fields: {} });
    expect(normalizeDatingProfile({ alias: 'X', age: 23 })!.distanceKm).toBeGreaterThan(100000);
    const p = profile({ photos: [{ url: 'javascript:evil', source: { kind: 'url', url: 'https://untrusted' } }] });
    expect(p.photos).toEqual([]);
});
test('required missing or hidden fields fail; preferred fields only rank', () => {
    const d = normalizeDating(null);
    d.filters.fields.religion = { mode: 'required', value: 'none' };
    expect(datingFit(profile(), d).eligible).toBe(false);
    expect(datingFit(profile({ fields: { religion: 'none' }, hiddenFields: ['religion'] }), d).eligible).toBe(false);
    d.filters.fields.religion.mode = 'preferred';
    expect(datingFit(profile(), d).eligible).toBe(true);
    expect(datingFit(profile({ fields: { religion: 'none' } }), d).score).toBe(1);
    d.filters.minAge = 30;
    expect(datingFit(profile(), d).eligible).toBe(false);
});
test('public projection never includes private preferences, identity or hidden fields', () => {
    const result = JSON.stringify(publicDatingProfile(profile({ contactId: 'secret-id', fields: { religion: 'SECRET' }, hiddenFields: ['religion'] })));
    expect(result).not.toContain('secret');
    expect(result).not.toContain('SECRET');
});
test('profiles and reviewed world options persist without changing Persona', async () => {
    const t = await setup();
    await t.action('world_accept', { worldFields: [{ key: 'species', label: 'Species', options: ['human', 'elf'] }] });
    expect(t.state.pocketPersona.displayName).toBe('HIDDEN REAL NAME');
    expect(datingFor(t.state).worldFields[0].key).toBe('species');
    expect(datingFor(t.state).profiles).toHaveLength(1);
    expect(t.state.contacts).toHaveLength(0);
});
test('likes use saved interest without generation and reloads do not reroll outcomes', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    await t.action('like', { profileId: p.id, super: true });
    await t.action('like', { profileId: p.id });
    expect(t.calls).toHaveLength(0);
    expect(datingFor(t.state).decisions[0].status).toBe('matched');
    expect(t.state.conversations[0].channel).toBe('dating');
    expect(JSON.stringify(t.calls)).not.toContain('USER SECRET');
    expect(JSON.stringify(t.calls)).not.toContain('HIDDEN REAL NAME');
    expect(t.sent.filter(x => x.type)).toSatisfy((xs: any[]) => xs.every(x => x.user === 'test-user'));
});
test('dating reply context knows only public user profile, own private data and its thread', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    await t.action('like', { profileId: p.id });
    const c = t.state.conversations[0];
    c.messages.push({ sender: 'persona', text: 'A disclosed fact' } as any);
    const request = JSON.stringify(datingReplyMessages(t.state, c, ''));
    expect(request).toContain('A disclosed fact');
    expect(request).toContain('secret-boundary');
    expect(request).not.toContain('USER SECRET');
    expect(request).not.toContain('hidden-religion');
    expect(request).not.toContain('HIDDEN REAL NAME');
    const display = datingDisplayState(t.state, c.id);
    expect(display.pocketPersona.displayName).toBe('Moon');
    expect(datingDisplayState(t.state).conversations).toHaveLength(0);
    // Like saves a new state snapshot and assigns the dating identity's contact ID.
    // An empty ID means the Persona device, so never reuse the pre-match profile here.
    const contactId = datingFor(t.state).profiles.find(saved => saved.id === p.id)!.contactId;
    expect(contactId).toBeTruthy();
    expect(c.participantContactIds).toContain(contactId);
    expect(conversationVisibleOnDevice(t.state, c, 'owner')).toBe(true);
    expect(conversationVisibleOnDevice(t.state, c, contactId)).toBe(false);
    expect(conversationVisibleOnDevice(t.state, c, 'unrelated-device')).toBe(false);
    expect(conversationVisibleOnDevice(t.state, { ...c, archived: true }, 'owner')).toBe(false);
    expect(hiddenDatingContact(t.state, contactId)).toBe(true);
    expect(t.state.conversations.some(thread => thread.channel !== 'dating')).toBe(false);
});
test('explicit contact exchange links separate phone chat; unmatch preserves ordinary chat', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    await t.action('like', { profileId: p.id });
    const contactId = datingFor(t.state).profiles.find(saved => saved.id === p.id)!.contactId;
    expect(contactId).toBeTruthy();
    expect(hiddenDatingContact(t.state, contactId)).toBe(true);
    await expect(t.action('exchange', { profileId: p.id })).rejects.toThrow('Confirm');
    await t.action('exchange', { profileId: p.id, confirmed: true });
    expect(t.state.conversations).toHaveLength(2);
    expect(hiddenDatingContact(t.state, contactId)).toBe(false);
    const phone = t.state.conversations.find(c => c.channel !== 'dating')!;
    phone.messages.push({ id: 'phone-history', text: 'Ordinary history' } as any);
    await t.action('unmatch', { profileId: p.id });
    const dating = t.state.conversations.find(c => c.channel === 'dating')!;
    expect(dating.archived).toBe(true);
    expect(t.cancelled).toContain(dating.id);
    expect(t.state.conversations.find(c => c.id === phone.id)!.messages[0].id).toBe('phone-history');
    expect(() => datingReplyMessages(t.state, dating, '')).toThrow('no longer active');
    expect(() => datingDisplayState(t.state, dating.id)).not.toThrow();
});
test('photo references survive normalize/reload; failed photo leaves profile intact', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    await t.action('photo_add', { profileId: p.id, imageId: 'photo-a' });
    expect(normalizeDating(datingFor(t.state)).profiles[0].photos[0].source).toEqual({ kind: 'gallery', imageId: 'photo-a' });
    await expect(t.action('photo_add', { profileId: p.id, imageId: 'missing' })).rejects.toThrow('Image missing');
    t.camera = async () => { throw Error('GPU error'); };
    await expect(t.action('photo', { profileId: p.id })).rejects.toThrow('GPU error');
    expect(datingFor(t.state).profiles[0].photos).toHaveLength(1);
});
test('cancelled generation discards late drafts and cancels camera job', async () => {
    const t = await setup();
    let resolve: any;
    t.generate = () => new Promise(r => resolve = r);
    const operation = t.action('enrich',{profileId:datingFor(t.state).profiles[0].id});
    await Bun.sleep(5);
    await t.action('cancel');
    resolve(profile());
    await operation;
    expect(t.sent.some(x => x.phase === 'draft')).toBe(false);
    t.camera = () => new Promise(r => resolve = r);
    const photo = t.action('photo', { profileId: datingFor(t.state).profiles[0].id });
    await Bun.sleep(5);
    await t.action('cancel');
    resolve({ imageId: 'photo-a' });
    await photo;
    expect(t.cancelled.length).toBeGreaterThan(0);
    expect(datingFor(t.state).profiles[0].photos).toHaveLength(0);
});
test('likes and passes do not require generation permission', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    t.permissions.delete('generation');
    await t.action('like', { profileId: p.id });
    expect(datingFor(t.state).decisions[0].status).toBe('matched');
    expect(t.calls).toHaveLength(0);
    await expect(t.action('generate')).rejects.toThrow('Enable generation');
});

test('a height-only Persona cannot spend an image call on an invented portrait', async () => {
    const t = harness();
    await t.action('self', { profile: profile({ id: 'self', alias: 'Moon', fields: { height: '178 cm' }, phoneProfile: { appearance: '' } }) });
    let renders = 0;
    t.camera = async () => { renders++; return { imageId: 'photo-a' }; };
    await expect(t.action('photo', { profileId: 'self' })).rejects.toThrow('no saved appearance');
    expect(renders).toBe(0);
});
test('a Persona without appearance can still render a scenery-only photo', async () => {
    const t = harness();
    await t.action('self', { profile: profile({ id: 'self', alias: 'Moon', phoneProfile: { appearance: '' }, photoPlan: [{ prompt: 'A quiet garden', subjectIds: [], visual: { subjects: [], environment: 'A quiet garden' } }] }) });
    let renders = 0;
    t.camera = async () => { renders++; return { imageId: 'garden' }; };
    await t.action('photo', { profileId: 'self', planIndex: 0 });
    expect(renders).toBe(1);
    expect(datingFor(t.state).self!.photos[0].source.imageId).toBe('garden');
});
test('a reroll replaces exactly one photo and preserves it if camera fails', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    await t.action('photo_add', { profileId: p.id, imageId: 'photo-a' });
    await t.action('photo_add', { profileId: p.id, imageId: 'photo-a' });
    t.camera = async () => ({ imageId: 'replacement' });
    await t.action('photo', { profileId: p.id, index: 0 });
    expect(datingFor(t.state).profiles[0].photos.map(x => x.source)).toEqual([{ kind: 'gallery', imageId: 'replacement' }, { kind: 'gallery', imageId: 'photo-a' }]);
    t.camera = async () => { throw Error('GPU error'); };
    await expect(t.action('photo', { profileId: p.id, index: 0 })).rejects.toThrow('GPU error');
    expect(datingFor(t.state).profiles[0].photos[0].source).toEqual({ kind: 'gallery', imageId: 'replacement' });
});
test('ordinary conversation defaults and normalization never deduplicate dating into phone', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    await t.action('like', { profileId: p.id });
    await t.action('exchange', { profileId: p.id, confirmed: true });
    const c = normalizeContactCollections(t.state, { characterId: 'a', characterName: 'Alice', now: '2026-10-10T12:00:00Z', makeId: p => p + 'test', personaActorId: 'owner' });
    expect(c.conversations.filter(c => c.channel === 'dating')).toHaveLength(1);
    expect(c.conversations.filter(c => c.channel === 'phone').length).toBeGreaterThan(0);
});
test('NPC-owned dating reuses identities, persists interest once and remains inspection-only', async () => {
    const { establishNpcDating } = await import('../src/domain/lumistry-npcs.js'), t = await setup();
    await t.action('like', { profileId: datingFor(t.state).profiles[0].id });
    let n = 0;
    const makeId = (p: string) => `${p}_${++n}`;
    const collections = normalizeContactCollections({}, { characterId: 'a', characterName: 'Alice', now: '2026-10-10T12:00:00Z', makeId, personaActorId: 'owner' });
    const s = { ...t.state, discoveredActors: [], contacts: [...collections.contacts, ...t.state.contacts] };
    const owner = s.contacts[0].id, partner = s.contacts[1].id;
    expect(() => establishNpcDating(s, { operation: 'profile', ownerActorId: 'owner', profile: profile() }, '', makeId)).toThrow();
    establishNpcDating(s, { operation: 'profile', ownerActorId: owner, profile: profile({ alias: 'Rose' }) }, '', makeId);
    const matched = establishNpcDating(s, { operation: 'match', ownerActorId: owner, partnerActorId: partner, status: 'matched', profile: profile({ alias: 'Star' }) }, '', makeId);
    expect(establishNpcDating(s, { operation: 'match', ownerActorId: owner, partnerActorId: partner, status: 'declined' }, '', makeId).status).toBe('matched');
    const c = s.conversations.find(c => c.id === matched.conversationId)!;
    expect(c.includesPocketPersona).toBe(false);
    expect(c.participantActorIds).toContain(owner);
    expect(conversationVisibleOnDevice(s, c, 'owner')).toBe(false);
    c.messages.push({ sender: 'contact', senderActorId: owner, senderName: 'Alice', text: 'Hello from my alias' } as any);
    expect(datingDisplayState(s, c.id).conversations[0].messages[0].senderName).toBe('Rose');
});
test('pending interest has no prewritten outcome and only selected activity updates can match', async () => {
    const t = await setup();
    await t.action('accept', { profile: profile({ id: 'second', alias: 'Ash', interest: { version: 2, status: 'pending', seen: false } }) });
    const p = datingFor(t.state).profiles.find(p => p.alias === 'Ash')!;
    await t.action('like', { profileId: p.id });
    expect(t.calls).toHaveLength(0);
    expect(datingFor(t.state).decisions[0].status).toBe('pending');
    expect(JSON.stringify(datingFor(t.state))).not.toContain('laterStatus');
    const snapshot = structuredClone(t.state);
    await t.app.applyInterestUpdates({ chatId: 'c', characterId: 'a' }, snapshot, [{ profileId: 'unselected', status: 'matched' }, { profileId: p.id, status: 'pending' }], 'test-user');
    expect(t.state.conversations).toHaveLength(0);
    t.now = '2026-10-10T12:20:00Z';
    await t.app.applyInterestUpdates({ chatId: 'c', characterId: 'a' }, structuredClone(t.state), [{ profileId: p.id, status: 'matched' }], 'test-user');
    expect(datingFor(t.state).decisions[0].status).toBe('matched');
    expect(t.state.conversations).toHaveLength(1);
    await t.app.applyInterestUpdates({ chatId: 'c', characterId: 'a' }, structuredClone(t.state), [{ profileId: p.id, status: 'declined' }], 'test-user');
    expect(datingFor(t.state).decisions[0].status).toBe('matched');
});
test('variable photos and persistent pet-only identity do not insert the NPC into a cat photo', async () => {
    const { PERSON_TEMPLATE, normalizeDatingPerson } = await import('../src/domain/lumistry-person.js');
    const { datingPhotoAnchor } = await import('../src/domain/lumistry.js');
    for (const count of [1, 2, 4, 8]) {
        const p = profile({ photoPlan: Array.from({ length: count }, (_, i) => ({ kind: 'candid', description: `Scene ${i}`, caption: `Photo ${i}`, prompt: `Unique scene ${i}`, subjectIds: ['cat'] })) });
        expect(normalizeDatingProfile(p)!.photoPlan).toHaveLength(count);
    }
    const p = profile({ person: normalizeDatingPerson({ ...PERSON_TEMPLATE, appearance: { ...PERSON_TEMPLATE.appearance, face: 'NPC face' }, entities: [{ id: 'cat', kind: 'pet', name: 'Miso', appearance: 'orange tabby with white paws', relationship: 'pet' }] }) });
    expect(datingPhotoAnchor(p, ['cat'])).toBe('orange tabby with white paws');
    expect(datingPhotoAnchor(p, ['cat'])).not.toContain('NPC face');
});
test('described photo messages survive reload and can render later without losing their description', async () => {
    const t = await setup(), p = datingFor(t.state).profiles[0];
    await t.action('like', { profileId: p.id });
    const c = t.state.conversations[0];
    c.messages.push({ id: 'described', sender: 'contact', senderActorId: p.contactId, senderName: p.alias, senderAccent: '', text: '', createdAt: '2026-10-10T12:00:00Z', read: false, status: 'delivered', datingPhoto: { description: 'Miso sleeping on a keyboard', prompt: 'Orange tabby asleep across a keyboard', subjectIds: ['cat'], anchor: 'orange tabby with white paws' } });
    const normalized = normalizeContactCollections(t.state, { characterId: 'a', characterName: 'Alice', now: '2026-10-10T12:00:00Z', makeId: x => x, personaActorId: 'owner' });
    expect(normalized.conversations[0].messages[0].datingPhoto!.description).toContain('Miso');
    expect(JSON.stringify(datingReplyMessages(t.state, c, ''))).toContain('Miso sleeping');
    t.camera = async () => { throw Error('GPU error'); };
    await expect(t.action('message_photo', { conversationId: c.id, messageId: 'described' })).rejects.toThrow('GPU error');
    expect(t.state.conversations[0].messages[0].datingPhoto!.description).toContain('Miso');
});

test('height ranges match inclusive canonical or imperial heights and withhold hidden/unknown values', async () => {
    const d = normalizeDating({ filters: { fields: { height: { mode: 'required', value: '160–185 cm' } } } });
    for (const height of ['160 cm', '185 cm', '1.78 m', "5'10\""]) expect(datingFit(profile({ fields: { height } }), d).eligible).toBe(true);
    for (const height of ['159 cm', '186 cm', 'unknown', '']) expect(datingFit(profile({ fields: { height } }), d).eligible).toBe(false);
    expect(datingFit(profile({ fields: { height: '178 cm' }, hiddenFields: ['height'] }), d).eligible).toBe(false);
    d.filters.fields.height.mode = 'preferred';
    expect(datingFit(profile({ fields: { height: '178 cm' } }), d)).toEqual({ eligible: true, score: 1 });
    expect(datingFit(profile({ fields: {} }), d)).toEqual({ eligible: true, score: 0 });
    d.filters.fields.height = { mode: 'required', value: '160 cm, 185 cm' };
    expect(datingFit(profile({ fields: { height: '170 cm' } }), d).eligible).toBe(false);
    const t = await setup(); await t.action('height_units', { unit: 'imperial' });
    expect(normalizeDating(datingFor(t.state)).heightUnit).toBe('imperial');
    expect(t.calls).toHaveLength(0);
});

test('Persona enhancement omits the legacy token cap and failed enhancement preserves saved state', async () => {
    const t=await setup();const before=structuredClone(t.state);
    t.generate=async()=>{throw new Error('provider exhausted its reasoning budget');};
    await expect(t.action('self_generate')).rejects.toThrow('reasoning budget');
    const request=t.calls.at(-1);
    expect(request[0]).toBe('lumistry-self_generate');expect(request[2].parameters).toEqual({temperature:.2});
    expect(t.state).toEqual(before);expect(t.sent.some(e=>e.phase==='self_draft')).toBe(false);
});

test('photo rendering saves the final Camera prompt and preserves it through normalization',async()=>{
 const t=await setup();const renderInfo={compiler:'visual-2',dialect:'anima',sceneCharacters:100,promptCharacters:120,negativePrompt:'bad artifacts'};t.camera=async()=>({imageId:'photo-a',prompt:'native final prompt with saved brown hair',renderInfo});
 const profileId=datingFor(t.state,'owner').profiles[0].id;await t.action('photo',{profileId,description:'standing outdoors'});
 const p=datingFor(t.state,'owner').profiles.find(p=>p.id===profileId)!;
 expect(p.photos[0].renderInfo).toEqual(renderInfo);expect(t.calls).toHaveLength(0);
 expect(p.photos[0].compiledPrompt).toBe('native final prompt with saved brown hair');expect(normalizeDatingProfile(JSON.parse(JSON.stringify(p)))!.photos[0].compiledPrompt).toBe(p.photos[0].compiledPrompt);
});

test('explicit force match reuses the native dating identity without model calls, ordinary access or duplicate threads',async()=>{
 const t=await setup(),d=datingFor(t.state,'owner'),p=d.profiles[0];
 p.interest={version:2,status:'declined',seen:true};const original=JSON.stringify(p.privateFields);
 await t.action('force_match',{profileId:p.id});
 const matched=datingFor(t.state,'owner'),decision=matched.decisions.find(x=>x.profileId===p.id)!;const thread=t.state.conversations.find(c=>c.id===decision.conversationId)!;
 expect(decision.status).toBe('matched');expect(decision.forcedMatch).toBe(true);expect(thread.channel).toBe('dating');expect(thread.datingOwnerId).toBe('owner');expect(t.calls).toHaveLength(0);
 const contact=t.state.contacts.find(c=>c.id===matched.profiles[0].contactId)!;expect(contact.messagingPolicy.remoteEligible).toBe(false);expect(contact.generationPolicy.relevant).toBe(false);expect(decision.exchanged).not.toBe(true);expect(JSON.stringify(matched.profiles[0].privateFields)).toBe(original);
 await t.action('force_match',{profileId:p.id});expect(t.state.conversations).toHaveLength(1);expect(t.state.contacts).toHaveLength(1);
 await t.action('unmatch',{profileId:p.id});await t.action('force_match',{profileId:p.id});expect(t.state.conversations).toHaveLength(1);expect(t.state.conversations[0].archived).toBe(false);expect(datingFor(t.state,'owner').decisions[0].conversationId).toBe(thread.id);
});

test('dating history supplies message envelopes without changing stored dialogue or promoting a hobby into a script',async()=>{
 const t=await setup(),p=datingFor(t.state,'owner').profiles[0];await t.action('like',{profileId:p.id});const c=t.state.conversations[0];
 c.messages.push({id:'history',sender:'contact',senderActorId:p.contactId,text:'Thursday works.\nBring your coat.',createdAt:'2026-10-15T00:00:00Z',status:'delivered'} as any);
 const messages=datingReplyMessages(t.state,c,'Reply naturally');const assistant=messages.find(m=>m.role==='assistant')!;
 expect(JSON.parse(assistant.content)).toEqual({message:'Thursday works.\nBring your coat.'});expect(c.messages.at(-1)?.text).toBe('Thursday works.\nBring your coat.');expect(messages[0].content).toContain('a saved hobby, job, joke or small quirk is context');
});


import {datingMessageHistory,datingReplyContextInfo,localDatingReplyDecision,datingDecisionMessages} from '../src/domain/lumistry.js';
import {normalizeDatingAttachment} from '../src/domain/lumistry-person.js';

test('dating history is bounded to 10k actual characters and contains descriptions rather than photo prompts',async()=>{
 const t=await setup();await t.action('like',{profileId:datingFor(t.state).profiles[0].id});const c=t.state.conversations[0];
 for(let i=0;i<20;i++)c.messages.push({id:'turn'+i,sender:i%2?'contact':'persona',text:(i%2?'quote " newline\n':'x').repeat(500),status:'delivered',datingPhoto:i===19?{description:'Photo: standing under a tree',prompt:'PRIVATE RENDER PROMPT',anchor:'RENDER ANCHOR',visual:{camera:'RENDER CAMERA'}}:undefined} as any);
 const before=JSON.stringify(c),history=datingMessageHistory(c),size=history.reduce((n,m)=>n+m.content.length,0);
 expect(size).toBeLessThanOrEqual(10000);expect(size).toBeGreaterThan(6500);expect(JSON.stringify(history)).toContain('standing under a tree');expect(JSON.stringify(history)).not.toContain('PRIVATE RENDER PROMPT');expect(JSON.stringify(history)).not.toContain('RENDER CAMERA');
 for(const m of history.filter(m=>m.role==='assistant'))expect(typeof JSON.parse(m.content).message).toBe('string');
 const prompt=datingReplyMessages(t.state,c,'reply'),stats=datingReplyContextInfo(t.state,c,prompt);
 expect(stats.promptChars).toBe(prompt.reduce((n,m)=>n+m.content.length,0));expect(stats.threadChars).toBe(size);expect(stats.threadCount).toBe(history.length);
 expect(prompt[0].content).not.toContain('Fill visual');expect(prompt[0].content).not.toContain('spatial, environment');expect(prompt[0].content).not.toContain('"prompt":');
 expect(JSON.stringify(datingDecisionMessages(t.state,c,'classify'))).not.toContain('PRIVATE RENDER PROMPT');expect(JSON.stringify(c)).toBe(before);
});

test('local decisions only skip structurally inactive bursts or simple acknowledgements',async()=>{
 const t=await setup();await t.action('like',{profileId:datingFor(t.state).profiles[0].id});const c=t.state.conversations[0];
 const contact:any={id:'contact',sender:'contact',text:'See you later.',status:'delivered'};
 for(const text of ['okay','thanks!','good night','👍']){c.messages=[contact,{id:'user',sender:'persona',text,status:'sent'} as any];expect(localDatingReplyDecision(t.state,c)?.action).toBe('none');}
 for(const text of ['okay, where?','thanks, can you help?','bye for now — tomorrow at six?','I like you','yes']){c.messages=[contact,{id:'user',sender:'persona',text,status:'sent'} as any];expect(localDatingReplyDecision(t.state,c)).toBeUndefined();}
 c.messages=[{id:'user',sender:'persona',text:'okay',status:'sent'} as any];expect(localDatingReplyDecision(t.state,c)).toBeUndefined();
 c.messages=[contact,{id:'user',sender:'persona',text:'thanks',status:'sent',datingPhoto:{description:'A shared photo'}} as any];expect(localDatingReplyDecision(t.state,c)).toBeUndefined();
 c.archived=true;expect(localDatingReplyDecision(t.state,c)?.action).toBe('none');
});

test('rendered dating photos retain description and subject references without render instructions on reload',async()=>{
 const t=await setup(),p=datingFor(t.state).profiles[0];await t.action('like',{profileId:p.id});const c=t.state.conversations[0];
 c.messages.push({id:'photo-message',sender:'contact',senderName:p.alias,text:'',status:'delivered',createdAt:'now',datingPhoto:{description:'A portrait in a red coat.',prompt:'PRIVATE COMPILED PROMPT',anchor:'PRIVATE ANCHOR',subjectIds:['self'],aspect:'portrait'}} as any);
 // Save a fixture through the same host used by the action handler.
 (t.state as any).conversations[0]=c;
 await t.action('message_photo',{conversationId:c.id,messageId:'photo-message'});
 const rendered=t.state.conversations[0].messages.find(m=>m.id==='photo-message')!;
 expect(rendered.imageId).toBe('photo-a');expect(rendered.datingPhoto?.description).toBe('A portrait in a red coat.');expect(rendered.datingPhoto?.prompt).toBe('');expect(rendered.datingPhoto?.anchor).toBe('');expect(rendered.datingPhoto?.visual).toBeUndefined();
 expect(normalizeDatingAttachment(JSON.parse(JSON.stringify(rendered.datingPhoto)))?.prompt).toBe('');
 const legacy=normalizeDatingAttachment({description:'Old photo',prompt:'OLD PROMPT',anchor:'OLD ANCHOR',subjectIds:['self']},true)!;expect(legacy.prompt).toBe('');expect(legacy.subjectIds).toEqual(['self']);
 expect(normalizeDatingAttachment({description:'Not rendered yet',rendered:true},false)?.prompt).toBe('Not rendered yet');
});

import {filterSignature as filtersSignature,INTENTION_PRESETS as filtersIntents} from '../src/domain/lumistry-filters.js';
import {discoveryFingerprint as filterJobFingerprint} from '../src/domain/lumistry-pipeline.js';
test('filter save preserves unknown fields, published identities, messages and matching with zero generation',async()=>{
 const t=await setup();await t.action('like',{profileId:datingFor(t.state).profiles[0].id});let d=datingFor(t.state);d.filters.fields.legacy={mode:'required',value:'saved legacy'};d.filters.fields.species={mode:'preferred',value:'elf'};
 const existing=JSON.stringify([d.profiles,d.decisions,t.state.conversations]);await t.action('filters',{baseline:filtersSignature(d.filters),filters:{...d.filters,minAge:22,maxAge:38,maxKm:50,fields:{gender:{mode:'required',value:'woman'},intentions:{mode:'preferred',value:filtersIntents['Broad dating'].join(', ')}}}});
 d=datingFor(t.state);expect(d.filters.fields.legacy.value).toBe('saved legacy');expect(d.filters.fields.species.value).toBe('elf');expect(JSON.stringify([d.profiles,d.decisions,t.state.conversations])).toBe(existing);expect(t.calls).toHaveLength(0);
});
test('equivalent filter saves retain the exact active discovery fingerprint',async()=>{
 const t=await setup(),d=datingFor(t.state);d.filters.fields.gender={mode:'required',value:'woman, nonbinary'};const before=filterJobFingerprint(d),filters=structuredClone(d.filters);filters.fields={unused:{mode:'any',value:''},gender:{mode:'required',value:'nonbinary, woman'}};
 await t.action('filters',{baseline:filtersSignature(d.filters),filters});expect(filterJobFingerprint(datingFor(t.state))).toBe(before);expect(datingFor(t.state).filters.fields.gender.value).toBe('woman, nonbinary');expect(t.calls).toHaveLength(0);
});
test('stale and invalid filter saves fail without overwriting newer state or spending tokens',async()=>{
 const t=await setup(),old=filtersSignature(datingFor(t.state).filters);datingFor(t.state).filters.maxKm=70;const current=JSON.stringify(datingFor(t.state).filters);
 await expect(t.action('filters',{baseline:old,filters:{minAge:22,maxAge:38,maxKm:50,fields:{}}})).rejects.toThrow('changed elsewhere');expect(JSON.stringify(datingFor(t.state).filters)).toBe(current);
 for(const patch of [{minAge:17},{minAge:40,maxAge:30},{maxKm:-1},{maxKm:NaN}])await expect(t.action('filters',{filters:{...datingFor(t.state).filters,...patch}})).rejects.toThrow();expect(JSON.stringify(datingFor(t.state).filters)).toBe(current);expect(t.calls).toHaveLength(0);
});

test('Persona photo rendering needs known appearance and rejects changes while native Camera runs',async()=>{
 const t=await setup();await t.action('like',{profileId:datingFor(t.state,'owner').profiles[0].id});
 const c=t.state.conversations.find(c=>c.channel==='dating')!;
 c.messages.push({id:'own-photo',sender:'persona',text:'',createdAt:'2026-10-15T00:00:00Z',status:'sent',datingPhoto:{description:'Me at the workshop.',prompt:'Me at the workshop.',anchor:'',subjectIds:['self']}} as any);
 const self=datingFor(t.state,'owner').self!;self.person=undefined;self.phoneProfile.appearance='';let rendered=0;
 t.camera=async()=>{rendered++;return {imageId:'photo-a'}};
 await expect(t.action('message_photo',{conversationId:c.id,messageId:'own-photo'})).rejects.toThrow('Save your Persona appearance');expect(rendered).toBe(0);
 datingFor(t.state,'owner').self!.phoneProfile.appearance='short brown hair';
 t.camera=async()=>{rendered++;datingFor(t.state,'owner').self!.phoneProfile.appearance='long red hair';return {imageId:'photo-a'}};
 await expect(t.action('message_photo',{conversationId:c.id,messageId:'own-photo'})).rejects.toThrow('saved appearance changed');expect(rendered).toBe(1);
 const saved=t.state.conversations.find(x=>x.id===c.id)!.messages.find(m=>m.id==='own-photo')!;expect(saved.imageId).toBeUndefined();expect(saved.datingPhoto?.description).toBe('Me at the workshop.');
});

test('world reading retains larger authoritative passages and recent evidence under shared caps',()=>{
 const marker=' IMPORTANT SETTING FACT';const source=worldCharacterEvidence({name:'World',description:'d'.repeat(20000)+marker,scenario:'s'.repeat(15000)+marker,personality:'p'.repeat(7000)+marker});
 for(const value of [source.description,source.scenario,source.personality])expect(value).toContain(marker);
 const max=worldCharacterEvidence({description:'d'.repeat(40000),scenario:'s'.repeat(30000),personality:'p'.repeat(20000)});expect(max.description.length).toBe(30000);expect(max.scenario.length).toBe(20000);expect(max.personality.length).toBe(10000);
 const recent=worldRecentEvidence(Array.from({length:30},(_,i)=>({role:'assistant',content:String(i)+'x'.repeat(3000)})));expect(recent).toHaveLength(24);expect(recent[0].content.startsWith('6')).toBe(true);expect(recent.every(m=>m.content.length===2000)).toBe(true);
});
test('world reading uses the larger allowance and preserves reviewed summaries through save and reload',async()=>{
 const t=harness();const summary='Modern human setting. '+'a'.repeat(10000)+' Tail fact.';
 t.h.worldEvidence=async()=>worldCharacterEvidence({description:'d'.repeat(20000)+' source-tail'});
 t.h.getMessages=async()=>Array.from({length:25},()=>({role:'assistant',content:'m'.repeat(1900)}));
 t.generate=async()=>({worldContext:summary,worldFields:[]});await t.action('world');
 expect(t.calls).toHaveLength(1);expect(t.calls[0][2].parameters.max_tokens).toBe(WORLD_READING_LIMITS.outputTokens);
 const input=JSON.parse(t.calls[0][2].messages[1].content);expect(input.evidence.description).toContain('source-tail');expect(input.recent).toHaveLength(24);expect(input.recent[0].content).toHaveLength(1900);
 const preview=t.sent.find(m=>m.phase==='world');expect(preview.worldContext).toBe(summary);expect(datingFor(t.state).worldContext).toBe('');
 await t.action('world_accept',{worldContext:preview.worldContext,worldFields:[]});expect(normalizeDating(datingFor(t.state)).worldContext).toBe(summary);
 expect(normalizeDating({worldContext:'x'.repeat(13000)}).worldContext.length).toBe(WORLD_READING_LIMITS.context);
});

import {reviewedSettingKey} from '../src/domain/lumistry-location.js';
test('Release B filter actions preserve legacy fields and exclusions, switch distance modes, and clear explicitly without calls',async()=>{
 const t=await setup();await t.action('world_accept',{worldContext:'A reviewed modern town.',worldFields:[]});let d=datingFor(t.state);const key=reviewedSettingKey(d)!;
 await t.action('filters',{filters:{distanceMode:'setting',settingKey:key,fields:{oldCustom:{mode:'preferred',value:'kept'}},excludedValues:{smoking:['regularly']}}});d=datingFor(t.state);expect(d.filters.distanceMode).toBe('setting');expect(d.filters.excludedValues).toEqual({smoking:['regularly']});
 await t.action('filters',{filters:{...d.filters,distanceMode:undefined,settingKey:undefined,maxKm:50,excludedValues:{}}});d=datingFor(t.state);expect(d.filters.distanceMode).toBeUndefined();expect(d.filters.excludedValues).toBeUndefined();expect(d.filters.fields.oldCustom.value).toBe('kept');expect(t.calls).toHaveLength(0);
});
test('Release B world review keeps setting identity and separate settings preserve matches/history without generation',async()=>{
 const t=await setup();await t.action('world_accept',{worldContext:'A reviewed modern town.',worldFields:[]});let d=datingFor(t.state);const key=reviewedSettingKey(d)!;await t.action('filters',{filters:{distanceMode:'setting',settingKey:key}});
 const saved=JSON.stringify(d.profiles),decisions=JSON.stringify(d.decisions),conversations=JSON.stringify(t.state.conversations);
 await t.action('world_accept',{worldContext:'A more detailed modern town summary.',worldFields:[]});d=datingFor(t.state);expect(reviewedSettingKey(d)).toBe(key);expect(d.filters.settingKey).toBe(key);
 await t.action('setting_new');d=datingFor(t.state);expect(reviewedSettingKey(d)).not.toBe(key);expect(d.filters.settingKey).toBe(reviewedSettingKey(d));expect(JSON.stringify(d.profiles)).toBe(saved);expect(JSON.stringify(d.decisions)).toBe(decisions);expect(JSON.stringify(t.state.conversations)).toBe(conversations);expect(t.calls).toHaveLength(0);
});
test('Release B rejects unsupported setting scope and contradictory exclusions without changing saved filters',async()=>{
 const t=await setup(),before=JSON.stringify(datingFor(t.state).filters);
 await expect(t.action('filters',{filters:{distanceMode:'setting',settingKey:'setting_0000000000000000'}})).rejects.toThrow('reviewed setting changed');expect(JSON.stringify(datingFor(t.state).filters)).toBe(before);
 await expect(t.action('filters',{filters:{fields:{smoking:{mode:'required',value:'regularly'}},excludedValues:{smoking:['regularly']}}})).rejects.toThrow('also excluded');expect(JSON.stringify(datingFor(t.state).filters)).toBe(before);expect(t.calls).toHaveLength(0);
});
