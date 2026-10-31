import type { PhoneState } from '../types.js';
import { normalizeDating, normalizeDatingProfile, datingFor } from './lumistry.js';
import { resolvePocketActor } from './actors.js';
/** Roleplay-owned NPC activity; the human UI cannot use this command to impersonate an NPC. */
export function establishNpcDating(state: PhoneState, input: Record<string, any>, now: string, makeId: (prefix: string) => string): Record<string, unknown> {
    const owner = resolvePocketActor(state, String(input.ownerActorId || ''));
    if (!owner || owner.kind === 'persona')
        throw new Error('Lumistry NPC activity requires an existing NPC device owner, never the human Persona.');
    state.lumistry ||= {};
    state.lumistry[owner.actorId] ||= normalizeDating(null);
    const d = datingFor(state, owner.actorId);
    if (input.operation === 'profile') {
        const p = normalizeDatingProfile({ ...input.profile, id: 'self', contactId: owner.actorId });
        if (!p)
            throw new Error('An NPC dating profile requires an established adult age and alias.');
        d.self = p;
        return { ownerActorId: owner.actorId, profileSaved: true };
    }
    if (input.operation === 'match') {
        if (!d.self)
            throw new Error('Establish the adult NPC owner profile first.');
        const partner = resolvePocketActor(state, String(input.partnerActorId || ''));
        if (!partner || partner.kind === 'persona' || partner.actorId === owner.actorId)
            throw new Error('Choose a different established adult NPC partner.');
        let p = d.profiles.find(p => p.contactId === partner.actorId);
        if (!p) {
            const parsed = normalizeDatingProfile({ ...input.profile, id: makeId('dating_contact'), contactId: partner.actorId });
            if (!parsed)
                throw new Error('The partner needs an established adult profile.');
            p = parsed;
            d.profiles.push(p);
        }
        const prior = d.decisions.find(x => x.profileId === p!.id);
        if (prior)
            return { ownerActorId: owner.actorId, status: prior.status, conversationId: prior.conversationId, deduplicated: true };
        if (!['matched', 'pending', 'declined'].includes(input.status))
            throw new Error('Establish matched, pending or declined interest; a like alone does not establish a match.');
        const conversationId = input.status === 'matched' ? makeId('dating_thread') : undefined;
        d.decisions.push({ profileId: p.id, action: 'like', status: input.status, conversationId });
        if (conversationId)
            state.conversations.push({ id: conversationId, channel: 'dating', datingOwnerId: owner.actorId, kind: 'direct', title: p.alias, participantActorIds: [p.contactId, owner.actorId], participantContactIds: [p.contactId, owner.actorId].filter(id => state.contacts.some(c => c.id === id)), includesPocketPersona: false, messages: [], unread: 0, availability: { state: 'remote' }, createdAt: now, updatedAt: now });
        return { ownerActorId: owner.actorId, status: input.status, conversationId };
    }
    if (input.operation === 'unmatch') {
        const x = d.decisions.find(x => x.conversationId === input.conversationId);
        if (!x)
            throw new Error('Match not found.');
        x.status = 'unmatched';
        const c = state.conversations.find(c => c.id === x.conversationId);
        if (c) {
            c.archived = true;
            c.outgoingBurst = undefined;
        }
        return { ownerActorId: owner.actorId, status: 'unmatched', conversationId: x.conversationId };
    }
    throw new Error('NPC Lumistry operations are profile, match, or unmatch. Use the existing message action with the returned dating conversationId for NPC texts.');
}
