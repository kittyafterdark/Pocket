import type { PhoneState, PocketNpcBank } from '../types.js';
import { datingFor, normalizeDating, normalizeDatingProfile, datingText } from './lumistry.js';
import { contactFromNpcBank } from './npc-bank.js';
import { establishNpcDating } from './lumistry-npcs.js';
/** No off-toggle evidence collection. One saved assessment per established Bank identity. */
export function bankProfileCandidate(state: PhoneState, bank: PocketNpcBank) {
    const data = datingFor(state);
    if (!data.bankDating.enabled || !data.self || state.contacts.length >= 80 || data.profiles.length >= 100)
        return undefined;
    for (const entry of bank.entries) {
        if (data.bankDating.assessments.some(a => a.bankId === entry.id))
            continue;
        const contact = state.contacts.find(c => c.source.kind === 'npc' && c.source.bankId === entry.id);
        if (contact?.presence.inScene)
            continue;
        if (contact && Object.values(state.lumistry || {}).some(d => d.self?.contactId === contact.id || d.profiles.some(p => p.contactId === contact.id)))
            continue;
        // Discovery-born people stay excluded even after being promoted into the Bank.
        if (contact && Object.values(state.lumistry || {}).some(d => d.profiles.some(p => p.id.startsWith('dating_npc_') && p.contactId === contact.id)))
            continue;
        return { bankId: entry.id, entry, contact: contact || null, worldContext: data.worldContext, worldFields: data.worldFields };
    }
    return undefined;
}
export type BankProfileCandidate = NonNullable<ReturnType<typeof bankProfileCandidate>>;
/** Require an exact age-bearing source excerpt, rather than a generated assertion of adulthood. */
function establishedAge(c: BankProfileCandidate, age: number, quote: unknown) {
    const evidence = JSON.stringify({ entry: c.entry, contact: c.contact });
    const excerpt = datingText(quote, 300);
    if (!excerpt || !evidence.includes(excerpt) || age < 18)
        return false;
    const n = String(age);
    return new RegExp(`(?:age[d]?\\s*[:=]?\\s*${n}\\b|\\b${n}\\s*(?:[- ]years?[- ]old|[- ]y[/.]?o\\b)|\\b${n}[- ]year[- ]old|\\b${n}歳)`, 'i').test(excerpt);
}
export function applyBankProfile(state: PhoneState, candidate: BankProfileCandidate, raw: any, now: string, makeId: (p: string) => string) {
    const data = datingFor(state);
    if (!data.bankDating.enabled || !raw || typeof raw.join !== 'boolean')
        return;
    const suitability = Number(raw.suitabilityPercent);
    if (!Number.isFinite(suitability) || suitability < 0 || suitability > 100 || !datingText(raw.reason, 600))
        return;
    const p = raw.join ? normalizeDatingProfile(raw.profile) : null;
    let status: 'joined' | 'declined' | 'unknown' = raw.join ? 'unknown' : 'declined';
    let reason = datingText(raw.reason, 600);
    if (raw.join && p && establishedAge(candidate, p.age, raw.ageEvidence)) {
        delete p.privateFields.bankDatingOnly;
        let contact = state.contacts.find(c => c.source.kind === 'npc' && c.source.bankId === candidate.bankId);
        if (!contact) {
            if (state.contacts.length >= 80)
                return;
            contact = contactFromNpcBank(candidate.entry, now, makeId);
            // A dating signup never grants ordinary phone access or ambient eligibility.
            p.privateFields.bankDatingOnly = 'true';
            contact.messagingPolicy.remoteEligible = false;
            contact.generationPolicy.relevant = false;
            state.contacts.push(contact);
        }
        p.id = `dating_bank_${candidate.bankId}`;
        p.contactId = contact.id;
        p.photos = [];
        p.encounterAvailable = false;
        p.interest = { version: 2, status: 'pending', seen: false };
        // Existing source appearance is authoritative even if the generated plan drifted.
        const establishedAppearance = contact.phoneProfile?.appearance || candidate.entry.phoneProfile?.appearance;
        if (establishedAppearance) {
            p.phoneProfile.appearance = establishedAppearance;
            if (p.person) p.person.appearance = { tags: '', face: '', hair: '', skin: '', build: '', height: '', distinctive: '', usualStyle: '' };
        }
        establishNpcDating(state, { operation: 'profile', ownerActorId: contact.id, profile: p }, now, makeId);
        // Save the listing; discovery applies the user's current filters on every browse.
        if (!data.profiles.some(x => x.contactId === contact!.id) && data.profiles.length < 100)
            data.profiles.push(normalizeDatingProfile(p)!);
        status = 'joined';
    }
    else if (raw.join)
        reason = 'Profile withheld: missing valid profile or an established age excerpt. ' + reason;
    if (!state.lumistry)
        state.lumistry = {};
    state.lumistry[state.pocketPersonaActorId] ||= normalizeDating(null);
    datingFor(state).bankDating.assessments.push({ bankId: candidate.bankId, status, suitability, reason, checkedAt: now });
}
