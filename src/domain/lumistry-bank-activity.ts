import { datingFact, datingPhoneProfile, datingOwnContext } from './lumistry-facts.js';
import type { PhoneState, PocketNpcBank } from '../types.js';
import { datingFor, normalizeDatingProfile, publicDatingProfile, type DatingProfile } from './lumistry.js';
import { normalizePocketContact } from './contacts.js';
import { establishNpcDating } from './lumistry-npcs.js';
const available = (p: DatingProfile) => {
    const orientation = datingFact(p, 'orientation');
    if (!p.fields.gender || !orientation || /^(unknown|undisclosed|not disclosed|discuss privately|prefer not to say|withheld|not specified|private|n\/a)$/i.test(orientation.trim()))
        return false;
    const intentions = p.fields.intentions || '';
    if (!intentions || /^(unknown|undisclosed|not sure yet|prefer not to say|friendship)$/i.test(intentions))
        return false;
    const status = p.fields.relationshipStatus || '';
    return !/married|partnered/i.test(status) || /nonmonogamous|polyamorous|open relationship/i.test(p.fields.monogamy || '');
};
/** Only already-profiled Bank NPCs can initiate. Unknown adulthood/intentions are never invented. */
export function bankDatingCandidates(state: PhoneState, bank: PocketNpcBank, now: string) {
    if (!datingFor(state).bankDating.enabled) return [];
    const pool = datingFor(state).profiles.filter(p => p.id.startsWith('dating_npc_') && available(p));
    return state.contacts.flatMap(contact => {
        if (Object.values(state.lumistry || {}).some(d => d.profiles.some(p => p.id.startsWith('dating_npc_') && p.contactId === contact.id)))
            return []; // Lumistry-born NPCs never initiate autonomous dating.
        if (contact.source.kind !== 'npc' || !contact.source.bankId || !bank.entries.some(e => e.id === (contact.source.kind === 'npc' ? contact.source.bankId : '')) || contact.presence.inScene)
            return [];
        const data = state.lumistry?.[contact.id];
        if (data?.npcActivityAt && Date.parse(now) - Date.parse(data.npcActivityAt) < 24 * 60 * 60 * 1000)
            return [];
        const owner = data?.self || Object.values(state.lumistry || {}).flatMap(d => d.profiles).find(p => p.contactId === contact.id);
        if (!owner || owner.age < 18 || !available(owner))
            return [];
        const open = data?.decisions.find(d => d.status === 'matched' || d.status === 'pending');
        const sharedIntention = (p: DatingProfile) => (p.fields.intentions || '').split(',').some(x => (owner.fields.intentions || '').split(',').some(y => x.trim().toLowerCase() === y.trim().toLowerCase()));
        const candidates = open ? pool.filter(p => p.contactId !== contact.id && p.id === open.profileId) : pool.filter(p => p.contactId !== contact.id && sharedIntention(p) && !data?.profiles.some(x => x.id === p.id)).slice(0, 3);
        if (!candidates.length)
            return [];
        return [{ ownerActorId: contact.id, owner, profiles: candidates, prior: open, thread: open?.conversationId ? state.conversations.find(c => c.id === open.conversationId)?.messages.slice(-8).map(m => ({ speaker: m.senderActorId, text: m.text })) : [] }];
    }).slice(0, 1);
}
export function bankDatingEvidence(c: ReturnType<typeof bankDatingCandidates>[number]) {
    return { ownerActorId: c.ownerActorId, ownerOwnProfile: datingOwnContext(c.owner), ownerPublicProfile: publicDatingProfile(c.owner), profiles: c.profiles.map(p => ({ id: p.id, publicProfile: publicDatingProfile(p), ownPrivateEvidence: datingOwnContext(p) })), prior: c.prior, thread: c.thread };
}
export function applyBankDatingActivity(state: PhoneState, c: ReturnType<typeof bankDatingCandidates>[number], raw: any, now: string, makeId: (prefix: string) => string) {
    if (!datingFor(state).bankDating.enabled) return undefined;
    const contact = state.contacts.find(x => x.id === c.ownerActorId);
    if (!contact || contact.source.kind !== 'npc' || !contact.source.bankId || contact.presence.inScene)
        return undefined;
    const liveOwner = state.lumistry?.[contact.id]?.self || Object.values(state.lumistry || {}).flatMap(d => d.profiles).find(p => p.contactId === contact.id);
    if (JSON.stringify(liveOwner) !== JSON.stringify(c.owner))
        return undefined;
    establishNpcDating(state, { operation: 'profile', ownerActorId: contact.id, profile: c.owner }, now, makeId);
    const data = datingFor(state, contact.id);
    data.npcActivityAt = now;
    if (!raw || raw.ownerActorId !== contact.id || !['pending', 'matched', 'declined'].includes(raw.status))
        return undefined;
    const original = c.profiles.find(p => p.id === raw.profileId), profile = datingFor(state).profiles.find(p => p.id === original?.id);
    if (!profile || JSON.stringify(profile) !== JSON.stringify(original))
        return undefined;
    let partner = state.contacts.find(x => x.id === profile.contactId);
    if (!partner && raw.status === 'matched') {
        if (state.contacts.length >= 80 || state.conversations.length >= 80)
            return undefined;
        partner = normalizePocketContact({ id: makeId('contact'), name: profile.alias, role: 'Lumistry', identityBrief: profile.bio, phoneProfile: datingPhoneProfile(profile), source: { kind: 'npc', origin: 'generated', description: profile.bio }, generationPolicy: { relevant: false }, messagingPolicy: { remoteEligible: false }, createdAt: now }, { characterId: state.characterId, characterName: state.characterName, now, makeId }) || undefined;
        if (!partner)
            return undefined;
        state.contacts.push(partner);
        profile.contactId = partner.id;
    }
    let saved = data.profiles.find(p => p.id === profile.id);
    if (!saved) {
        saved = normalizeDatingProfile({ ...profile })!;
        data.profiles.push(saved);
    }
    let decision = data.decisions.find(d => d.profileId === saved!.id);
    if (!decision) {
        decision = { profileId: saved.id, action: 'like', status: raw.status === 'matched' ? 'pending' : raw.status, likedAt: now };
        data.decisions.push(decision);
    }
    decision.checkedAt = now;
    if (decision.status === 'declined' || decision.status === 'unmatched')
        return undefined;
    if (raw.status === 'declined' && decision.status !== 'matched') {
        decision.status = 'declined';
        return undefined;
    }
    if (raw.status !== 'matched' || !partner)
        return undefined;
    if (!decision.conversationId) {
        if (state.conversations.length >= 80)
            return undefined;
        decision.status = 'matched';
        decision.conversationId = makeId('dating_thread');
        saved.contactId = partner.id;
        state.conversations.push({ id: decision.conversationId, channel: 'dating', datingOwnerId: contact.id, kind: 'direct', title: saved.alias, participantActorIds: [contact.id, partner.id], participantContactIds: [contact.id, partner.id], includesPocketPersona: false, messages: [], unread: 0, availability: { state: 'remote' }, createdAt: now, updatedAt: now });
    }
    // This is an intention to explore, never a completed date, sexual encounter or financial agreement.
    const intentions = (c.owner.fields.intentions || '').split(',').map(x => x.trim().toLowerCase());
    const shared = (profile.fields.intentions || '').split(',').map(x => x.trim().toLowerCase()).filter(x => intentions.includes(x));
    if (typeof raw.connectionIntent === 'string' && shared.includes(raw.connectionIntent.toLowerCase()))
        decision.connectionIntent = raw.connectionIntent;
    const message = typeof raw.message === 'string' ? raw.message.trim().slice(0, 1200) : '';
    const speaker = [contact.id, partner.id].includes(raw.speakerActorId) ? raw.speakerActorId : contact.id;
    return message ? { conversationId: decision.conversationId, speakerActorId: speaker, text: message } : undefined;
}
