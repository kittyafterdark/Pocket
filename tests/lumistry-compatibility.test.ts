import { expect, test } from 'bun:test';
import { normalizeDating, normalizeDatingProfile, publicDatingProfile } from '../src/domain/lumistry.js';
import { PERSON_TEMPLATE, normalizeDatingAttachment } from '../src/domain/lumistry-person.js';
import { datingContinuityContext } from '../src/domain/lumistry-continuity.js';
import { compileDatingVisual, normalizeDatingVisual } from '../src/domain/lumistry-visual.js';
import { bankDatingCandidates, bankDatingEvidence, applyBankDatingActivity } from '../src/domain/lumistry-bank-activity.js';
import type { PhoneState, PocketNpcBank } from '../src/types.js';

const profile = (extra: any = {}) => normalizeDatingProfile({ id: 'dating_npc_candidate', alias: 'Juniper', age: 28, distanceKm: 3, fields: { gender: 'woman', intentions: 'casual dating', relationshipStatus: 'single' }, privateFields: { orientation: 'bisexual', commitments: 'Single, no exclusivity agreements' }, phoneProfile: { appearance: 'short brown hair' }, person: structuredClone(PERSON_TEMPLATE), ...extra })!;
function bankFixture() {
    const owner = profile({ id: 'dating_bank_bank', contactId: 'bank-owner', alias: 'Robin' });
    const state = { pocketPersonaActorId: 'human', contacts: [{ id: 'bank-owner', source: { kind: 'npc', bankId: 'bank' }, presence: { inScene: false } }], conversations: [], lumistry: { human: normalizeDating({ bankDating: { enabled: true }, self: profile({ id: 'self', alias: 'Human' }), profiles: [profile()] }), 'bank-owner': normalizeDating({ self: owner }) } } as unknown as PhoneState;
    const bank = { entries: [{ id: 'bank' }] } as PocketNpcBank;
    return { state, bank };
}

test('private-first known orientation is usable as own Bank evidence without becoming public disclosure', () => {
    const { state, bank } = bankFixture();
    const candidates = bankDatingCandidates(state, bank, '2026-10-11T00:00:00Z');
    expect(candidates).toHaveLength(1);
    const evidence = bankDatingEvidence(candidates[0]);
    expect(evidence.ownerOwnProfile.privateFields.orientation).toBe('bisexual');
    expect(evidence.ownerPublicProfile.fields).not.toHaveProperty('orientation');
    expect(evidence.profiles[0].publicProfile.fields).not.toHaveProperty('orientation');
    expect(JSON.stringify(publicDatingProfile(candidates[0].owner))).not.toContain('bisexual');
});

test('disabled Bank dating does not inspect Bank entries or apply a previously collected candidate', () => {
    const { state, bank } = bankFixture();
    // Public legacy fields allow the pre-fix code to reach the Bank lookup.
    state.lumistry!.human.profiles[0].fields.orientation = 'bisexual';
    state.lumistry!['bank-owner'].self!.fields.orientation = 'bisexual';
    const candidate = bankDatingCandidates(state, bank, '2026-10-11T00:00:00Z')[0];
    expect(candidate).toBeTruthy();
    state.lumistry!.human.bankDating.enabled = false;
    const unreadableBank = { get entries() { throw Error('disabled evidence collection'); } } as unknown as PocketNpcBank;
    expect(bankDatingCandidates(state, unreadableBank, '2026-10-11T00:00:00Z')).toEqual([]);
    const before = JSON.stringify(state);
    expect(applyBankDatingActivity(state, candidate, { ownerActorId: 'bank-owner', profileId: 'dating_npc_candidate', status: 'matched' }, 'now', p => p + '_new')).toBeUndefined();
    expect(JSON.stringify(state)).toBe(before);
});

test('unknown actual orientation is withheld and Lumistry-born people cannot become autonomous Bank owners', () => {
    const { state, bank } = bankFixture();
    for (const placeholder of ['unknown', 'discuss privately', 'undisclosed']) {
        state.lumistry!['bank-owner'].self!.privateFields.orientation = placeholder;
        expect(bankDatingCandidates(state, bank, 'now')).toEqual([]);
    }
    state.lumistry!['bank-owner'].self!.privateFields.orientation = 'bisexual';
    state.lumistry!.human.profiles.push(profile({ id: 'dating_npc_promoted', contactId: 'bank-owner' }));
    expect(bankDatingCandidates(state, bank, 'now')).toEqual([]);
});

test('long canonical appearance remains complete in structured nonregional image compilation', () => {
    const person = structuredClone(PERSON_TEMPLATE);
    person.appearance.tags = Array.from({ length: 170 }, (_, i) => `individual visible detail number ${i}`).join(', ');
    person.appearance.hair = 'DISTINCTIVE HAIR ANCHOR';
    const p = profile({ person, phoneProfile: {}, fields: { height: '178 cm' } });
    const visual = normalizeDatingVisual({ subjects: [{ id: 'self', clothing: 'a plain coat' }] })!;
    const prompt = compileDatingVisual(p, visual, 'a quiet street', ['self']);
    expect(prompt).toContain('DISTINCTIVE HAIR ANCHOR');
    expect(prompt).toContain('178 cm'); expect(prompt).toContain('Person A —');
    expect(prompt).not.toContain('<region');
    p.anonymous = true;
    expect(compileDatingVisual(p, visual, '', ['self'])).not.toContain('DISTINCTIVE HAIR ANCHOR');
});

test('authorized scene/ordinary continuity never cuts off private agency inside a large JSON identity', () => {
    const person = structuredClone(PERSON_TEMPLATE);
    person.entities = Array.from({ length: 24 }, (_, i) => ({ id: 'friend_' + i, kind: 'person', name: 'Adult friend ' + i, appearance: 'adult; ' + 'a particular visible trait '.repeat(18), relationship: 'friend' }));
    const p = profile({ contactId: 'match', person, privateFields: { orientation: 'bisexual', commitments: 'AGENCY: existing partner, no permission for outside sex', intentions: 'Friendship only', boundaries: 'No explicit images' } });
    const state = { pocketPersonaActorId: 'human', contacts: [], conversations: [], lumistry: { human: normalizeDating({ self: profile({ id: 'self' }), profiles: [p], decisions: [{ profileId: p.id, action: 'like', status: 'matched', exchanged: true, conversationId: 'dating' }] }) } } as unknown as PhoneState;
    const block = datingContinuityContext(state, 'match');
    expect(block).toContain('AGENCY: existing partner, no permission for outside sex');
    expect(block).toContain('Friendship only'); expect(block).toContain('No explicit images');
    const identity = block.split('\n\n').find(s => s.startsWith("NPC'S OWN SAVED IDENTITY"))!.split(': ').slice(1).join(': ');
    expect(() => JSON.parse(identity)).not.toThrow();
    state.lumistry!.human.decisions[0].exchanged = false;
    expect(datingContinuityContext(state, 'match')).toBe('');
});

test('compiled photo attachments preserve later subject anchors across normalization/reload', () => {
    const person = structuredClone(PERSON_TEMPLATE);
    person.appearance.tags = 'a visible identity detail, '.repeat(230);
    person.appearance.hair = 'FINAL HAIR';
    const p = profile({ person });
    const visual = normalizeDatingVisual({ subjects: [{ id: 'self', pose: 'standing' }] })!;
    const compiled = compileDatingVisual(p, visual, '', ['self']);
    // Legacy snapshots can also contain an independently saved anchor.
    const attachment = { description: 'An everyday photograph', prompt: 'scene '.repeat(1400) + compiled, subjectIds: ['self'], anchor: compiled };
    const restored = normalizeDatingAttachment(JSON.parse(JSON.stringify(attachment)))!;
    expect(restored.prompt).toBe(attachment.prompt);
    expect(restored.anchor).toBe(attachment.anchor);
});