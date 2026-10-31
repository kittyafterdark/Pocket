import { expect, test } from 'bun:test';
import { normalizeDatingProfile, publicDatingProfile } from '../src/domain/lumistry.js';
import { datingFact, datingAppearance, datingPhoneProfile, datingOwnContext } from '../src/domain/lumistry-facts.js';
import { compileDatingVisual } from '../src/domain/lumistry-visual.js';
import { discoveryProblems, adaptDiscoveryPhotos, type DiscoverySlot } from '../src/domain/lumistry-pipeline.js';
import { PERSON_TEMPLATE } from '../src/domain/lumistry-person.js';

const profile = () => normalizeDatingProfile({ alias: 'Moon', age: 32, distanceKm: 1, fields: { height: '178 cm', orientation: 'bisexual', kinks: 'bondage', boundaries: 'no choking' }, hiddenFields: ['orientation', 'kinks', 'boundaries'], privateFields: { orientation: 'Bisexual', kinks: 'bondage', boundaries: 'no choking', commitments: 'No exclusivity agreements', kinksDetail: 'bondage' }, phoneProfile: { appearance: 'silver curls, brown eyes, freckles', textingStyle: 'lowercase', personality: 'curious' }, person: { ...structuredClone(PERSON_TEMPLATE), appearance: { ...PERSON_TEMPLATE.appearance, tags: 'silver curls, brown eyes', hair: 'silver curls', face: 'brown eyes', height: '178 cm' }, life: { routine: 'Works late' }, availability: { routine: 'Works late' }, intimacy: { kinks: 'bondage', boundaries: 'No choking.' }, prompts: [{ question: 'A small victory?', answer: 'fixed my radio' }] }, photoPlan: [{ prompt: 'reading outdoors', description: 'reading outdoors' }] })!;

test('canonical facts normalize idempotently, keeping hidden knowledge without mirrored records', () => {
    const p = profile();
    expect(p.privateFields).toEqual({ commitments: 'No exclusivity agreements' });
    expect(p.person?.intimacy.kinks).toBe(''); expect(p.person?.intimacy.boundaries).toBe('');
    expect(datingFact(p, 'kinks')).toBe('bondage'); expect(datingFact(p, 'orientation')).toBe('bisexual');
    expect(publicDatingProfile(p).fields).toEqual({ height: '178 cm' });
    expect(normalizeDatingProfile(p)).toEqual(p);
});
test('one appearance supplies native projection and photos without losing legacy traits', () => {
    const p = profile(); expect(p.phoneProfile.appearance).toBe(''); expect(p.person?.appearance.height).toBe('');
    const anchor = datingAppearance(p); for (const trait of ['silver curls', 'brown eyes', 'freckles', '178 cm']) expect(anchor.split(trait)).toHaveLength(2);
    expect(datingPhoneProfile(p).appearance).toBe(anchor); expect(p.phoneProfile.appearance).toBe('');
    const rendered = compileDatingVisual(p, undefined, 'reading outdoors'); expect(rendered).toContain('freckles'); expect(rendered).toContain('178 cm');
    p.anonymous = true; expect(compileDatingVisual(p, undefined, 'reading outdoors')).not.toContain('silver curls');
    expect(p.photoPlan[0].prompt).toBe('reading outdoors');
});
test('different actual truths, intimate qualifications and independent negative facts survive', () => {
    const p = profile(); p.privateFields.orientation = 'Not out to coworkers'; p.person!.intimacy.kinks = 'Bondage only after negotiation and with a stop word'; p.privateFields.preferences = 'none'; p.privateFields.dealbreakers = 'none';
    const clean = normalizeDatingProfile(p)!; expect(clean.privateFields.orientation).toBe('Not out to coworkers'); expect(clean.person!.intimacy.kinks).toContain('stop word'); expect(clean.privateFields.preferences).toBe('none'); expect(clean.privateFields.dealbreakers).toBe('none');
    const own = datingOwnContext(clean); expect(own.hiddenFields.kinks).toBe('bondage'); expect(own.person?.prompts).toBeUndefined(); expect(publicDatingProfile(clean).prompts).toHaveLength(1);
});
test('discovery accepts single authoritative agency facts and requires actual agency without compulsory intimacy', () => {
    const p: any = profile(); p.slotId = 'slot'; p.distanceKm = 1; p.fields.intentions = 'Casual dates'; p.fields.preferences = 'Gentle direct communication'; p.fields.dealbreakers = 'Pressure'; p.person.prompts.push({ question: 'On Sundays?', answer: 'radio repairs' });
    p.person.life.routine = 'Works late'; Object.assign(p.person.intimacy, { sexualInterests: 'Slow consensual sex', role: 'switch', turnOns: 'Praise', turnOffs: 'Pressure', disclosure: 'After trust' });
    Object.assign(p.person.writingVoice, { primaryLanguage: 'English', bioLanguage: 'English', register: 'plain', mechanics: 'lowercase', rhythm: 'brief', effort: 'hurried', humor: 'dry', sample: 'hi there' });
    p.photoPlan[0].aspect = 'portrait';
    const slot = { id: 'slot', photoCount: 1, questionCount: 2 } as DiscoverySlot;
    expect(discoveryProblems(adaptDiscoveryPhotos(p), slot)).toEqual([]);
    p.fields.orientation = 'prefer not to say'; delete p.privateFields.orientation; expect(discoveryProblems(adaptDiscoveryPhotos(p), slot)).toContain('privateFields.orientation');
    p.privateFields.orientation = 'bisexual'; expect(discoveryProblems(adaptDiscoveryPhotos(p), slot)).toEqual([]);
    delete p.fields.kinks; delete p.privateFields.kinks; p.person.intimacy={}; expect(discoveryProblems(adaptDiscoveryPhotos(p),slot)).toEqual([]);
});

test('pending matching and replies retain own hidden facts without repeating public Q&A or leaking the human Persona', async () => {
    const { normalizeDating, pendingDatingCandidates, datingReplyMessages } = await import('../src/domain/lumistry.js');
    const d = normalizeDating(null), p = profile(); p.id = 'dating_npc_1'; p.contactId = 'npc';
    d.self = normalizeDatingProfile({ alias: 'User alias', age: 30, fields: { kinks: 'HUMAN SECRET' }, hiddenFields: ['kinks'] })!;
    d.profiles = [p]; d.decisions = [{ profileId: p.id, action: 'like', status: 'pending' } as any];
    const state: any = { pocketPersonaActorId: 'owner', lumistry: { owner: d }, contacts: [], conversations: [], memories: [] };
    const pending = pendingDatingCandidates(state, '2026-10-11T12:00:00Z')[0];
    expect(pending.ownPrivate.kinks).toBe('bondage'); expect(pending.ownPrivate.orientation).toBe('bisexual');
    expect(pending.ownLife?.prompts).toBeUndefined(); expect(JSON.stringify(pending)).not.toContain('HUMAN SECRET');
    d.decisions[0].status = 'matched'; d.decisions[0].conversationId = 'dating';
    const c: any = { id: 'dating', datingOwnerId: 'owner', messages: [] };
    const request = JSON.stringify(datingReplyMessages(state, c, ''));
    expect(request).not.toContain('fixed my radio');
    c.messages=[{sender:'persona',text:'Your profile answer about a small victory and the radio?',status:'sent'}];
    expect(JSON.stringify(datingReplyMessages(state,c,'' )).split('fixed my radio')).toHaveLength(2); expect(request).toContain('bondage'); expect(request).not.toContain('HUMAN SECRET');
});

test('a disclosure placeholder does not shadow an available actual private fact', async () => {
    const { datingFact } = await import('../src/domain/lumistry-facts.js');
    expect(datingFact({ privateFields: { orientation: 'not disclosed' }, fields: { orientation: 'bisexual' } }, 'orientation')).toBe('bisexual');
    expect(datingFact({ privateFields: { orientation: 'pansexual' }, fields: { orientation: 'bisexual' } }, 'orientation')).toBe('pansexual');
    expect(datingFact({ privateFields: { kinks: 'discuss privately' }, person: { intimacy: { kinks: 'Negotiated praise' } } }, 'kinks')).toBe('Negotiated praise');
    expect(datingFact({ privateFields: { orientation: 'not disclosed' } }, 'orientation')).toBe('not disclosed');
});
