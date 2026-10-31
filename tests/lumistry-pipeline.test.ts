import {interestContext} from '../src/domain/lumistry-compatibility.js';
import { loadDatingPersonaEvidence } from '../src/backend/lumistry-persona-evidence.js';
import { expect, test } from 'bun:test';
import { projectPhoneContext } from '../src/domain/projection.js';
import { Lumistry } from '../src/backend/lumistry.js';
import { DATING_FIELDS, datingFit, datingFor, datingReplyMessages, normalizeDating, normalizeDatingProfile, publicDatingProfile } from '../src/domain/lumistry.js';
import { PERSON_TEMPLATE } from '../src/domain/lumistry-person.js';
import { normalizeDiscoveryJob, mergeDiscoveryRepair, adaptDiscoveryProfile, adaptDiscoveryPhotos, discoveryProblems, verifiedPhotoCompilation, type DiscoverySlot } from '../src/domain/lumistry-pipeline.js';
import { compileDatingVisual } from '../src/domain/lumistry-visual.js';
import { committedDatingMessages, validateRelationshipEvents, datingPlanContext } from '../src/domain/lumistry-events.js';
import { parseGeneratedObject } from '../src/backend/structured.js';
import { dossier, publicText, photo } from './fixtures/lumistry-v2.js';
import type { PhoneState } from '../src/types.js';
const slot = (extra: Partial<DiscoverySlot> = {}): DiscoverySlot => ({ id: 'slot_0', photoCount: 1, questionCount: 2, variety: {}, presentation: { tropes: [], flavor: '' }, status: 'pending', attempts: 0, ...extra });
function raw(s = slot(), alias = 'Aster') {
    return { slotId: s.id, alias, age: 29, distanceKm: 2, bio: 'fixing my old radio, slowly', fields: Object.fromEntries(DATING_FIELDS.map(k => [k, 'none'])), privateFields: { orientation: 'bisexual', commitments: 'Single; no exclusivity agreements', intentions: 'Casual dating without exclusivity', preferences: 'Slow consensual adult sex', kinks: 'Praise and light bondage, only negotiated', boundaries: 'No humiliation or pain', dealbreakers: 'Exclusivity demanded immediately', behavior: 'Gently direct' }, phoneProfile: { personality: 'Unhurried radio repairer', appearance: 'brown hair and green eyes', textingStyle: 'lowercase brief texts, no emoji; sample: got the radio working' }, interest: { version: 2, status: 'matched', seen: true },
        person: { ...structuredClone(PERSON_TEMPLATE), appearance: { ...PERSON_TEMPLATE.appearance, tags: 'brown hair, green eyes' }, life: { ...PERSON_TEMPLATE.life, routine: 'Repairs radios after work', background: 'Grew up repairing old electronics' }, intimacy: { ...PERSON_TEMPLATE.intimacy, sexualInterests: 'Slow consensual adult sex', role: 'Switch, no fixed role', turnOns: 'Explicit consent and affectionate praise', turnOffs: 'Pressure and humiliation', disclosure: 'Discusses specifics privately after trust', kinks: 'Praise and negotiated light bondage', boundaries: 'No humiliation or pain' }, writingVoice: { ...PERSON_TEMPLATE.writingVoice, register: 'plain casual language', mechanics: 'lowercase and sparse punctuation', rhythm: 'short fragments', effort: 'brief and unpolished', humor: 'dry observational humor', primaryLanguage: 'Turkish', bioLanguage: 'Turkish', sample: 'tamir bitti sonunda' }, prompts: Array.from({ length: s.questionCount }, (_, i) => ({ question: `Question ${i}?`, answer: `my radio ${i}` })) },
        photoPlan: Array.from({ length: s.photoCount }, (_, i) => ({ kind: 'workbench', caption: `radio ${i}`, description: `An adult with a soldering iron at the messy radio workbench, framed from the side, photo ${i}.`, subjectIds: ['self'], subjectPosition: '', aspect: 'portrait' })) };
}
function harness(count = 0) {
    let seq = 0, locked = false;
    let state = { version: 12, chatId: 'c', characterId: 'a', characterName: 'Alice', pocketPersonaActorId: 'owner', pocketPersona: { displayName: 'PRIVATE PERSONA', identityBrief: 'PRIVATE SECRET' }, contacts: [], conversations: [], events: [], relays: [], lumistry: { owner: normalizeDating({ generationSettings:{creation:{readyTarget:25,photoBatchCap:3,workers:1}},self: { alias: 'Moon', age: 30 },filters:{minAge:29,maxAge:29,fields:{occupation:{mode:'required',value:'tradesperson'}}}, profiles: Array.from({ length: count }, (_, i) => ({ ...raw(),fields:{...raw().fields,occupation:'tradesperson'}, alias: 'Legacy ' + i, id: 'legacy_' + i })) }) } } as unknown as PhoneState;
    let callback: ((task: string, req: any) => Promise<any>) | undefined;
    const calls: any[] = [], sent: any[] = []; let active = true, permitted = true;
    const h: any = { loadState: async () => structuredClone(state), saveState: async (s: PhoneState) => { expect(locked).toBe(true); state = structuredClone(s); }, sendState: async () => {}, send: (x: any) => sent.push(x), stateKey: () => 'c/a', nowIso: () => '2026-10-11T00:00:00Z', id: (prefix: string) => `${prefix}_${++seq}`, permitted: () => permitted, activeScope: () => active,
        resolveMacros: async (template: string) => ({ text: template.replace(/\{\{pick::([^}]+)\}\}/g, (_: string, values: string) => values.split('::')[0]), diagnostics: [] }),
        withStateLock: async (_: string, fn: () => Promise<any>) => { expect(locked).toBe(false); locked = true; try { return await fn(); } finally { locked = false; } },
        generate: async (task: string, _request: string, input: any) => { expect(locked).toBe(false); const req = JSON.parse(input.messages[1].content); calls.push({ task, req, input, requestId: _request }); if (callback) return callback(task, req); return {authoredText:req.task==='dossier'?dossier('New Aster'):req.task==='public'?publicText(req.counts.questions,req.counts.photos):Array.from({length:req.batchCount||1},(_,i)=>`Record reference: ${req.photoReferences[i]}\n`+photo()).join('\n'),finishReason:'stop'}; }, getMessages: async () => [], cancelReply: () => {} };
    const app = new Lumistry(h);
    return { app, h, calls, sent, get state() { return state; }, set state(s: PhoneState) { state = s; }, set generate(fn: typeof callback) { callback = fn; }, set active(v: boolean) { active = v; }, set permitted(v: boolean) { permitted = v; }, action: (action: string, input: any = {}) => app.handle({ action, requestId: `r_${++seq}`, ...input }, { chatId: 'c', characterId: 'a' }, 'u') };
}

test('photo adapter retains whole descriptions without prompt, compiles locally and preserves native reload', () => {
    const r = raw(slot({ photoCount: 5, questionCount: 3 }));
    r.photoPlan[0].description = 'Full visible scene. '.repeat(55).trim();
    const legacy = adaptDiscoveryPhotos({ ...r, photoPlan: [{ ...r.photoPlan[0], prompt: 'EXPLICIT LEGACY PROMPT' }] }); expect(legacy.photoPlan[0].prompt).toBe('EXPLICIT LEGACY PROMPT');
    const adapted = adaptDiscoveryPhotos(r); expect(discoveryProblems(adapted, slot({ photoCount: 5, questionCount: 3 }))).toEqual([]);
    const p = normalizeDatingProfile(adapted)!; expect(p.photoPlan).toHaveLength(5); expect(p.person?.prompts).toHaveLength(3);
    expect(p.photoPlan[0].prompt).toBe(r.photoPlan[0].description); expect(verifiedPhotoCompilation(p)).toBe(true);
    const compiled = compileDatingVisual(p, undefined, p.photoPlan[0].prompt, ['self']);
    expect(compiled).toContain(r.photoPlan[0].description); expect(compiled).toContain('brown hair'); expect(compiled).not.toContain('<region');
    expect(normalizeDatingProfile(JSON.parse(JSON.stringify(p)))!.photoPlan).toEqual(p.photoPlan);
});
test('structured group, pet-only and anonymous photos retain ownership without regions', () => {
    const r: any = raw(); r.person.entities = [{ id: 'friend', kind: 'person', appearance: 'adult, red hair', name: 'Friend', relationship: 'friend' }, { id: 'cat', kind: 'pet', appearance: 'black cat', name: 'Pepper', relationship: 'pet' }];
    r.photoPlan[0].visual = { camera: 'wide', subjects: [{ id: 'self', position: 'left' }, { id: 'friend', position: 'right' }], environment: 'kitchen' }; r.photoPlan[0].subjectIds = ['self', 'friend'];
    const p = normalizeDatingProfile(adaptDiscoveryPhotos(r))!, plan = p.photoPlan[0];
    expect(discoveryProblems(adaptDiscoveryPhotos(r), slot())).toEqual([]);
    const compiled = compileDatingVisual(p, plan.visual, plan.prompt, plan.subjectIds);
    expect(compiled).toContain('Person A — left, brown hair'); expect(compiled).toContain('Person B — right, adult, red hair'); expect(compiled).not.toContain('left:');
    const pet = compileDatingVisual(p, { ...plan.visual!, subjects: [{ ...plan.visual!.subjects[0], id: 'cat' }] }, 'cat', ['cat']); expect(pet).toContain('black cat'); expect(pet).not.toContain('brown hair');
    p.anonymous = true; expect(compileDatingVisual(p, plan.visual, plan.prompt, plan.subjectIds)).not.toContain('brown hair');
});
test('mutual match development is additive, Like/Pass stay free, portrayal waits for exchange', async () => {
    const h = harness(24); await h.action('discover'); h.calls.length = 0; const p = datingFor(h.state).profiles.at(-1)!; const original = structuredClone(p);
    p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))}; const nativeState=h.state; nativeState.lumistry!.owner.profiles.find(x=>x.id===p.id)!.interest=p.interest; h.state=nativeState; await h.action('like', { profileId: p.id }); expect(h.calls).toHaveLength(0); const c = datingFor(h.state).decisions.at(-1)!.conversationId!;
    h.generate = async (task,req) => req.task === 'match' ? { authoredText: req.requestedModules.map((label:string)=>`${label}: Repairs a radio for their sister on Tuesdays.`).join('\n') } : req.task === 'portrayal' ? { authoredText: req.requestedModules.map((label:string)=>`${label}: Speaks quietly; keeps work details private.`).join('\n') } : { events: [] };
    await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u', c); const developed = datingFor(h.state).profiles.at(-1)!;
    expect(developed.development!.match).toBeTruthy(); expect(developed.development!.portrayal).toBeUndefined(); expect(developed.privateFields).toEqual(original.privateFields); expect(developed.photoPlan).toEqual(original.photoPlan); expect(developed.person).toEqual(original.person); expect(publicDatingProfile(developed)).toEqual(publicDatingProfile(original));
    await h.action('exchange', { profileId: p.id, confirmed: true }); await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u', c); expect(datingFor(h.state).profiles.at(-1)!.development!.portrayal).toBeTruthy();
    const ctx = datingReplyMessages(h.state, h.state.conversations.find(x => x.id === c)!, 'Tell me about your sister on Tuesdays.'); expect(ctx[0].content).toContain('sister on Tuesdays');
});
test('profile edits and unmatch during development reject late background facts', async () => {
    for (const edit of [true, false]) {
        const h = harness(24); await h.action('discover'); const p = datingFor(h.state).profiles.at(-1)!; p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))}; const nativeState=h.state; nativeState.lumistry!.owner.profiles.find(x=>x.id===p.id)!.interest=p.interest; h.state=nativeState; await h.action('like', { profileId: p.id });
        h.generate = async () => { if (edit) await h.action('edit', { profile: { ...p, privateFields: { ...p.privateFields, orientation: 'asexual' } } }); else await h.action('unmatch', { profileId: p.id }); return { authoredText: 'LATE FACT' }; };
        await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u'); expect(datingFor(h.state).profiles.at(-1)!.development!.match).toBeUndefined();
    }
});
test('legacy records are not assigned earned development stages or rewritten on maintenance', async () => {
    const h = harness(1), before = structuredClone(datingFor(h.state).profiles); await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u'); expect(h.calls).toHaveLength(0); expect(datingFor(h.state).profiles).toEqual(before);
});

function eventFixture() {
    const h = harness(), c: any = { id: 'thread', messages: [
        { id: 'm1', sender: 'persona', senderActorId: 'owner', status: 'sent', text: 'Yarın kahve içelim mi?', createdAt: '2026-10-11' },
        { id: 'm2', sender: 'contact', senderActorId: 'npc', status: 'delivered', text: 'Evet, yarın kahve içelim.', createdAt: '2026-10-11' },
        { id: 'pending', sender: 'contact', senderActorId: 'npc', status: 'delivered', text: 'provisional', candidateCommitState: 'provisional' },
        { id: 'shared', sender: 'persona', senderActorId: 'owner', status: 'sent', text: 'forwarded', sharedCapture: {} },
    ] };
    const messages = committedDatingMessages(c, 'owner', 'npc');
    const event: any = { kind: 'date', status: 'confirmed', title: 'Coffee tomorrow', whenText: 'yarın', evidence: [{ messageId: 'm1', quote: 'Yarın kahve içelim mi?', intent: 'propose' }, { messageId: 'm2', quote: 'Evet, yarın kahve içelim.', intent: 'accept' }] };
    return { h, c, messages, event };
}
test('committed evidence supports any language; provisional, forwarded and single-author acceptance are rejected', () => {
    const { messages, event } = eventFixture(); expect(messages).toHaveLength(2);
    const validate = (e: any) => validateRelationshipEvents([e], messages, [], 'p', 'thread', 'owner', 'npc', 'now');
    expect(validate(event)).toHaveLength(1); expect(validate({ ...event, evidence: [event.evidence[0]] })).toEqual([]); expect(validate({ ...event, evidence: [{ messageId: 'm2', quote: 'fabricated' }] })).toEqual([]);
    expect(validate({ ...event, status: 'cancelled' })).toEqual([]);
});

test('event confirmation rejects unclear/refused/revoked evidence, reversed acceptance and omitted latest messages', () => {
    const { messages, event } = eventFixture();
    const validate = (e: any, ms = messages, existing: any[] = []) => validateRelationshipEvents([e], ms, existing, 'p', 'thread', 'owner', 'npc', 'now');
    for (const intent of ['unclear', 'refuse', 'revoke', undefined]) {
        expect(validate({ ...event, evidence: [event.evidence[0], { ...event.evidence[1], intent }] })).toEqual([]);
    }
    expect(validate({ ...event, evidence: [{ ...event.evidence[0], intent: 'accept' }, { ...event.evidence[1], intent: 'propose' }] })).toEqual([]);
    const later = [...messages, { id: 'm3', speaker: 'npc', text: 'No, I changed my mind.', createdAt: 'later' }];
    expect(validate(event, later)).toEqual([]);
    expect(validate({ ...event, evidence: [...event.evidence, { messageId: 'm3', quote: 'No, I changed my mind.', intent: 'revoke' }] }, later)).toEqual([]);
    const old = validate(event)[0]; old.status = 'cancelled';
    expect(validate({ ...event, eventId: old.id }, messages, [old])).toEqual([]);
});

test('dating reply decisions retain own agency and current text without gallery/authoring payloads or human secrets', async () => {
    const { datingDecisionMessages } = await import('../src/domain/lumistry.js');
    const h = harness(24); await h.action('discover'); const p = datingFor(h.state).profiles.at(-1)!;
    p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))}; const nativeState=h.state; nativeState.lumistry!.owner.profiles.find(x=>x.id===p.id)!.interest=p.interest; h.state=nativeState; await h.action('like', { profileId: p.id });
    // Establish the explicit native match for this context fixture.
    const d = datingFor(h.state); d.decisions.at(-1)!.status = 'matched';
    (h.app as any).connect(h.state, h.state.pocketPersonaActorId, p, d.decisions.at(-1));
    const c = h.state.conversations.find(x => x.id === d.decisions.at(-1)!.conversationId)!;
    c.messages.push({ id: 'latest', sender: 'persona', status: 'sent', text: 'Would Saturday work?', createdAt: 'now' } as any);
    const messages = datingDecisionMessages(h.state, c, 'Classify'); const text = JSON.stringify(messages);
    expect(text).toContain('Would Saturday work?'); expect(text).toContain(p.privateFields.orientation);
    expect(JSON.parse(messages[1].content).ownPrivate.actualFields.boundaries).toBe(p.fields.boundaries);
    expect(text).not.toContain('PRIVATE SECRET'); expect(text).not.toContain('photoPlan'); expect(text).not.toContain('visual');
    expect(text.length).toBeLessThan(JSON.stringify(datingReplyMessages(h.state, c, 'Classify')).length);
});
test('evidence replay is idempotent; cancellation updates the same event', () => {
    const { messages, event } = eventFixture(); const first = validateRelationshipEvents([event], messages, [], 'p', 'thread', 'owner', 'npc', 'now')[0];
    expect(validateRelationshipEvents([event], messages, [first], 'p', 'thread', 'owner', 'npc', 'later')[0].id).toBe(first.id);
    const cancel = validateRelationshipEvents([{ ...event, eventId: first.id, status: 'cancelled' }], messages, [first], 'p', 'thread', 'owner', 'npc', 'later')[0]; expect(cancel.id).toBe(first.id); expect(cancel.status).toBe('cancelled'); expect(cancel.history?.[0].status).toBe('confirmed');
});

test('confirmed dates use one native Timeline row; plans are scoped and cancellation never invents a meeting', async () => {
    const h = harness(24); await h.action('discover'); const p = datingFor(h.state).profiles.at(-1)!;
    p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))}; const nativeState=h.state; nativeState.lumistry!.owner.profiles.find(x=>x.id===p.id)!.interest=p.interest; h.state=nativeState; await h.action('like', { profileId: p.id }); const c = h.state.conversations.at(-1)!; p.contactId = c.participantContactIds[0];
    c.messages.push({ id: 'm1', sender: 'persona', senderActorId: 'owner', senderName: 'Moon', senderAccent: '', text: 'Coffee tomorrow?', status: 'sent', createdAt: 'now', read: true }, { id: 'm2', sender: 'contact', senderActorId: p.contactId, senderName: p.alias, senderAccent: '', text: 'Yes, coffee tomorrow.', status: 'delivered', createdAt: 'now', read: true });
    h.generate = async (task,req) => req.task === 'match' ? { authoredText: req.requestedModules.map((label:string)=>`${label}: Repairs radios for friends.`).join('\n') } : { events: [{ kind: 'date', status: 'confirmed', title: 'PRIVATE COFFEE PLAN', whenText: 'tomorrow', evidence: [{ messageId: 'm1', quote: 'Coffee tomorrow?', intent: 'propose' }, { messageId: 'm2', quote: 'Yes, coffee tomorrow.', intent: 'accept' }] }] };
    await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u', c.id);
    expect(h.state.events).toHaveLength(1); expect(h.state.events[0].completed).toBe(false); expect(h.state.events[0].start).toBe(''); expect(h.state.events[0].whenText).toBe('tomorrow');
    expect(datingPlanContext(h.state, 'I stay home')).toBe(''); expect(datingPlanContext(h.state, 'I prepare to meet ' + p.alias)).toContain('PRIVATE COFFEE PLAN');
    expect(datingFor(h.state).decisions.at(-1)!.exchanged).toBeFalsy(); expect(datingFor(h.state).profiles.at(-1)!.development?.portrayal).toBeUndefined();
    const calls = h.calls.length; await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u', c.id); expect(h.calls).toHaveLength(calls); expect(h.state.events).toHaveLength(1);
    const event = datingFor(h.state).relationships.events[0];
    h.state.conversations.find(x => x.id === c.id)!.messages.push({ id: 'm3', sender: 'persona', senderActorId: 'owner', senderName: 'Moon', senderAccent: '', text: 'Cancel the coffee plan.', status: 'sent', createdAt: 'later', read: true });
    h.generate = async () => ({ events: [{ eventId: event.id, kind: 'date', status: 'cancelled', title: event.title, evidence: [{ messageId: 'm3', quote: 'Cancel the coffee plan.' }] }] });
    await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u', c.id); expect(h.state.events).toHaveLength(1); expect(h.state.events[0].title).toContain('Cancelled:'); expect(h.state.events[0].completed).toBe(false); expect(datingPlanContext(h.state, 'meet ' + p.alias)).toBe('');
});
test('evidence-backed number exchange reuses canonical actor and ordinary thread; repeated processing is harmless', async () => {
    const h = harness(24); await h.action('discover'); const p = datingFor(h.state).profiles.at(-1)!; p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))}; const nativeState=h.state; nativeState.lumistry!.owner.profiles.find(x=>x.id===p.id)!.interest=p.interest; h.state=nativeState; await h.action('like', { profileId: p.id }); const c = h.state.conversations.at(-1)!; p.contactId = c.participantContactIds[0];
    c.messages.push({ id: 'm1', sender: 'persona', senderActorId: 'owner', senderName: 'Moon', senderAccent: '', text: 'Let us exchange contact details.', status: 'sent', createdAt: 'now', read: true }, { id: 'm2', sender: 'contact', senderActorId: p.contactId, senderName: p.alias, senderAccent: '', text: 'Agreed, here are mine; saved yours.', status: 'delivered', createdAt: 'now', read: true });
    h.generate = async (task,req) => req.task === 'match' ? { authoredText: req.requestedModules.map((label:string)=>`${label}: Repairs radios.`).join('\n') } : req.task === 'portrayal' ? { authoredText: req.requestedModules.map((label:string)=>`${label}: Quiet measured speech.`).join('\n') } : { events: [{ kind: 'exchange', status: 'confirmed', title: 'Exchanged contact details', evidence: [{ messageId: 'm1', quote: 'Let us exchange contact details.', intent: 'propose' }, { messageId: 'm2', quote: 'Agreed, here are mine; saved yours.', intent: 'accept' }] }] };
    await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u', c.id); await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u', c.id);
    expect(h.state.contacts).toHaveLength(1); expect(h.state.contacts[0].messagingPolicy.remoteEligible).toBe(true); expect(h.state.conversations.filter(x => x.channel !== 'dating')).toHaveLength(1); expect(datingFor(h.state).decisions.at(-1)!.exchanged).toBe(true); expect(datingFor(h.state).profiles.at(-1)!.development!.portrayal).toBeTruthy();
});
test('flags independently stop enrichment, extraction and RP plans while preserving all saved people', async () => {
    const h = harness(24); await h.action('discover'); const p = datingFor(h.state).profiles.at(-1)!; p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))}; const nativeState=h.state; nativeState.lumistry!.owner.profiles.find(x=>x.id===p.id)!.interest=p.interest; h.state=nativeState; await h.action('like', { profileId: p.id });
    const before = structuredClone(datingFor(h.state).profiles); h.calls.length = 0;
    await h.action('pipeline_settings', { settings: { fastDiscovery: false, enrichment: false, events: false, rpBridge: false } });
    await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u'); expect(h.calls).toHaveLength(0); expect(datingFor(h.state).profiles).toEqual(before); expect(datingPlanContext(h.state, 'meet ' + p.alias)).toBe('');
});
test('canonical face-to-face unlocks portrayal without inventing a match or phone access', async () => {
    const h = harness(24); await h.action('discover'); const p = datingFor(h.state).profiles.at(-1)!; await h.action('encounter', { profileId: p.id });
    h.calls.length = 0; h.generate = async (_task,req) => ({ authoredText: req.requestedModules.map((label:string)=>`${label}: Quiet direct speech, keeps distance.`).join('\n') });
    await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u'); expect(h.calls).toHaveLength(0);
    h.state.contacts.at(-1)!.presence.lastSceneAt = '2026-10-11T00:00:00Z';
    await h.app.maintain({chatId:'c',characterId:'a'},'u');expect(h.calls).toHaveLength(0);
    h.state.contacts.at(-1)!.presence.inScene=true;h.state.sceneSnapshot={actors:[{contactId:h.state.contacts.at(-1)!.id,roleHint:'',sceneBrief:'Present in the current scene.'}],capturedAt:'now',sourceMessageId:'actual-scene',sourceMessageIndex:1,sourceRevision:1,stale:false};
    await h.app.maintain({ chatId: 'c', characterId: 'a' }, 'u'); expect(h.calls[0].req.task).toBe('portrayal'); expect(datingFor(h.state).profiles.at(-1)!.development!.match).toBeUndefined(); expect(datingFor(h.state).decisions).toHaveLength(0); expect(h.state.conversations).toHaveLength(0);
});

test('general RP projection excludes dating Timeline rows even with a known contact alias', () => {
    const h = harness(); const state = { ...h.state, notes: [], trackers: [], weather: { location: '', condition: '', details: '' }, conversations: [{ id: 'dating', channel: 'dating' }], events: [{ title: 'PRIVATE DATE PLAN', start: '', completed: false, source: { conversationId: 'dating' } }, { title: 'PUBLIC FESTIVAL', whenText: 'tonight', start: '', completed: false }] } as unknown as PhoneState;
    const projection = projectPhoneContext(state); expect(projection).not.toContain('PRIVATE DATE PLAN'); expect(projection).toContain('PUBLIC FESTIVAL');
});
test('malformed field types produce validation failures rather than throwing', () => {
    const r: any = adaptDiscoveryPhotos(raw()); r.person.prompts[0].question = ['wrong']; r.phoneProfile.appearance = ['wrong'];
    expect(discoveryProblems(r, slot())).toContain('questions');
    expect(discoveryProblems(r, slot())).toContain('identity/voice/routine');
});
test('Persona enhancement preserves edits and explicit height despite sparse model output', async () => {
    const h = harness(); h.h.personaEvidence = async (state: PhoneState, user: string) => loadDatingPersonaEvidence(state.pocketPersona, { get: async () => null, getActive: async () => ({ id: 'original', name: 'Moon', title: '', description: 'Height: 178 cm\nHair: silver curls', metadata: {} } as any) }, () => true, user);
    h.generate = async () => ({ alias: 'Moon', age: 30, fields: { occupation: 'Writer' }, phoneProfile: { appearance: 'silver curls, brown eyes' } });
    await h.action('self_generate', { profile: { alias: 'My alias', age: 35, fields: { occupation: 'Lawyer' } } });
    const draft = h.sent.find((e: any) => e.phase === 'self_draft')?.draft;
    expect(draft.age).toBe(35); expect(draft.fields.height).toBe('178 cm'); expect(draft.person?.appearance?.height || '').toBe(''); expect(draft.alias).toBe('My alias'); expect(draft.fields.occupation).toBe('law'); expect(draft.privateFields.occupationDetail).toBe('Lawyer');
    expect(h.calls[0].input.parameters.max_tokens).toBeUndefined();
    expect(h.calls[0].req.persona.originalPersona.description).toContain('Height: 178 cm');
    expect(h.calls[0].req.persona.pocketPersona.identityBrief).toBe('PRIVATE SECRET');
    expect(h.calls[0].req.persona.sourceSelection).toBe('active');
    expect(h.sent.filter((e: any) => e.phase === 'working').map((e: any) => e.message).join(' ')).toContain('Extracting identity, life, preferences, intimacy and boundaries');
    expect(datingFor(h.state).self?.fields.height).toBeUndefined();
});
test('photo request compiles saved fallback appearance and attaches only the chosen planned image', async () => {
    const h = harness(); const d = datingFor(h.state); d.self = normalizeDatingProfile({ id: 'self', alias: 'Moon', age: 30, person: { version: 1 }, phoneProfile: { appearance: 'silver curls, brown eyes' }, photoPlan: [{ prompt: 'first shot', description: 'first shot' }, { prompt: 'second shot', description: 'second shot' }] })!;
    const state = h.state; state.lumistry!.owner = d; h.state = state;
    let camera: any; h.h.camera = async (input: any) => { camera = input; return { imageId: 'synthetic' }; };
    await h.action('photo', { profileId: 'self', planIndex: 1 });
    expect(camera.scene).toContain('silver curls, brown eyes'); expect(camera.scene).toContain('second shot'); expect(camera.scene).not.toContain('first shot'); expect(camera.enhance).toBe(false);
    expect(datingFor(h.state).self?.photos[0].planIndex).toBe(1);
});

test('malformed gallery rows report a repairable problem rather than throwing', () => { const r: any = raw(); r.photoPlan = [null]; expect(discoveryProblems(r, slot())).toContain('photo 0 content'); });


test('list canonicalization preserves existing exact private/public deduplication', () => {
    const original: any = raw(); original.fields.preferences = '["quiet evenings","conversation"]';
    original.privateFields.preferences = original.fields.preferences;
    const saved = normalizeDatingProfile(original)!;
    expect(saved.fields.preferences).toBe('quiet evenings, conversation');
    expect(saved.privateFields.preferences).toBeUndefined();
});

test('reply maintenance skips optional development and event calls for ordinary chatter', async () => {
    const h=harness(24);await h.action('discover');const p=datingFor(h.state).profiles.at(-1)!;
    p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))};await h.action('like',{profileId:p.id});
    const contactId=datingFor(h.state).profiles.find(x=>x.id===p.id)!.contactId;
    const d=datingFor(h.state),c=h.state.conversations.find(x=>x.id===d.decisions.at(-1)!.conversationId)!;
    c.messages.push({id:'greet',sender:'persona',senderActorId:'owner',status:'sent',text:'Hi, how are you?',createdAt:'now'} as any,{id:'answer',sender:'contact',senderActorId:contactId,status:'sent',text:'Fine, thanks. How are you?',createdAt:'now'} as any);
    h.calls.length=0;
    h.generate=async()=>{throw new Error('No model call is expected for ordinary event maintenance');};
    await h.app.maintain({chatId:'c',characterId:'a'},'u',c.id,undefined,'events');
    expect(h.calls).toHaveLength(0);expect(datingFor(h.state).profiles.at(-1)?.development?.match).toBeUndefined();
    expect(datingFor(h.state).relationships.events).toEqual([]);
    expect(datingFor(h.state).relationships.receipts[c.id]).toBeTruthy();
});

test('event scheduling includes short replies, invitations and revocations, but never establishes consent locally', async () => {
    const {shouldExtractDatingEvents,eventReceipt}=await import('../src/domain/lumistry-events.js');
    const prior=[{id:'a',speaker:'owner',text:'Coffee on Saturday?',createdAt:'now'},{id:'b',speaker:'npc',text:'Maybe.',createdAt:'now'}];
    const receipt=eventReceipt(prior);
    for(const text of ['Yes.','I can’t anymore.','👍','Let’s get together','My number is +90 555 123 4567']) {
        expect(shouldExtractDatingEvents([...prior,{id:'c',speaker:'owner',text,createdAt:'now'}],[],receipt)).toBe(true);
    }
    expect(shouldExtractDatingEvents([...prior,{id:'c',speaker:'owner',text:'Your dog is adorable.',createdAt:'now'}],[],receipt)).toBe(false);
    expect(shouldExtractDatingEvents(prior,[],receipt)).toBe(false);
    expect(shouldExtractDatingEvents([{id:'x',speaker:'owner',text:'I changed my mind.',createdAt:'now'}],[{status:'confirmed'}] as any)).toBe(true);
});

test('relevant reply maintenance uses only the event classifier and preserves exact evidence gates', async () => {
    const h=harness(24);await h.action('discover');const p=datingFor(h.state).profiles.at(-1)!;
    p.interest={version:2,status:'matched',seen:true,context:interestContext(datingFor(h.state))};await h.action('like',{profileId:p.id});
    const contactId=datingFor(h.state).profiles.find(x=>x.id===p.id)!.contactId;
    const c=h.state.conversations.find(x=>x.id===datingFor(h.state).decisions.at(-1)!.conversationId)!;
    c.messages.push({id:'offer',sender:'persona',senderActorId:'owner',status:'sent',text:'Coffee on Saturday?',createdAt:'now'} as any,{id:'refusal',sender:'contact',senderActorId:contactId,status:'sent',text:'No, I cannot.',createdAt:'now'} as any);
    h.calls.length=0;
    h.generate=async(task,req)=>{expect(task).toBe('lumistry-events');expect(req.messages.map((m:any)=>m.id)).toEqual(['offer','refusal']);return {events:[{kind:'date',status:'confirmed',title:'Invalid plan',whenText:'Saturday',evidence:[{messageId:'offer',quote:'Coffee on Saturday?',intent:'propose'},{messageId:'refusal',quote:'No, I cannot.',intent:'refuse'}]}]};};
    await h.app.maintain({chatId:'c',characterId:'a'},'u',c.id,undefined,'events');
    expect(h.calls).toHaveLength(1);expect(datingFor(h.state).relationships.events).toEqual([]);expect(h.state.events).toEqual([]);
    await h.app.maintain({chatId:'c',characterId:'a'},'u',c.id,undefined,'events');expect(h.calls).toHaveLength(1);
});
