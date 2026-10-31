import {committedMessage} from './lumistry-evidence.js';
import { recentOverusedMotifs } from './lumistry-variety.js';
import { normalizeExperience, EXPERIENCE_PRESETS, type LumistryExperience } from './lumistry-experience.js';
/** Operator-owned conveniences. Not NPC identity, relationship scores or a second actor store. */
import type { PhoneState, PhoneMessage } from '../types.js';
import { datingFor, datingFit, publicDatingProfile, type DatingState, type DatingProfile } from './lumistry.js';
export {emptyExperienceTools,normalizeExperienceTools,rememberedClaims,replyClaimProjection} from './lumistry-tools-state.js';
import {emptyExperienceTools,rememberedClaims,type ExperienceTools} from './lumistry-tools-state.js';
export type {ExperienceTools} from './lumistry-tools-state.js';
export const settledMessage = committedMessage;
export function applyExperienceTool(state: PhoneState, owner: string, action: string, input: Record<string, any>, now = ''): string | undefined {
    if (state.pocketPersonaActorId !== owner)
        throw Error('Switch to your Persona device.');
    const d = datingFor(state, owner), p = d.profiles.find(p => p.id === input.profileId);
    if (['shortlist', 'block', 'unblock'].includes(action) && !p)
        throw Error('This profile is no longer available.');
    if (action === 'rewind') {
        const last = d.decisions.at(-1);
        if (last?.action !== 'pass' || last.status !== 'passed' || input.profileId !== last.profileId)
            throw Error('Only the most recent unchanged Pass can be undone.');
        d.decisions.pop();
        return;
    }
    if (action === 'presentation' && !['photo', 'bio'].includes(input.value))
        throw Error('Choose photos or bio first.');
    const tools = d.tools || emptyExperienceTools();
    if (action === 'tone') {
        const current = normalizeExperience(d.generationSettings.experience);
        if (input.baseline !== JSON.stringify(current) || !['grounded', 'balanced', 'chaotic'].includes(input.tone))
            throw Error('Tone changed elsewhere. Review it again; nothing was applied.');
        if (tools.temporaryTone)
            throw Error('Restore your current temporary mood before applying another.');
        const applied = { ...current, scope: current.scope === 'B' ? 'C' as const : current.scope, tone: input.tone as LumistryExperience['tone'], ...EXPERIENCE_PRESETS[input.tone as keyof typeof EXPERIENCE_PRESETS] };
        tools.temporaryTone = { before: structuredClone(current), applied: structuredClone(applied) };
        d.generationSettings.experience = applied;
    }
    else if (action === 'restore_tone') {
        if (!tools.temporaryTone || JSON.stringify(normalizeExperience(d.generationSettings.experience)) !== JSON.stringify(tools.temporaryTone.applied))
            throw Error('Tone settings changed after the temporary mood. Review them directly; nothing was overwritten.');
        d.generationSettings.experience = tools.temporaryTone.before;
        delete tools.temporaryTone;
    }
    else if (action === 'shortlist') {
        if (typeof input.selected !== 'boolean')
            throw Error('Choose whether to save this person.');
        if (input.selected && !tools.blocked.includes(p!.id))
            tools.shortlist = [...new Set([...tools.shortlist, p!.id])];
        else
            tools.shortlist = tools.shortlist.filter(id => id !== p!.id);
    }
    else if (action === 'presentation')
        tools.presentation = input.value;
    else if (action === 'block') {
        if (input.confirm !== true)
            throw Error('Confirm blocking this dating connection.');
        tools.blocked = [...new Set([...tools.blocked, p!.id])];
        tools.shortlist = tools.shortlist.filter(id => id !== p!.id);
        const x = d.decisions.find(x => x.profileId === p!.id);
        if (x) {
            x.status = 'unmatched';
            const c = state.conversations.find(c => c.id === x.conversationId && c.channel === 'dating' && c.datingOwnerId === owner);
            if (c) {
                c.archived = true;
                c.outgoingBurst = undefined;
                d.tools = tools;
                return c.id;
            }
        }
    }
    else if (action === 'unblock')
        tools.blocked = tools.blocked.filter(id => id !== p!.id);
    else if (action === 'life_update') {
        const x = d.decisions.find(x => x.conversationId === input.conversationId && x.status === 'matched'), c = state.conversations.find(c => c.id === input.conversationId && c.channel === 'dating' && c.datingOwnerId === owner && !c.archived), m = c?.messages.find(m => m.id === input.messageId && committedMessage(m,state));
        if (!p || x?.profileId !== p.id || !p.id.startsWith('dating_npc_') || !p.development || tools.blocked.includes(p.id) || !m || (m.senderActorId || m.senderContactId) !== p.contactId || input.confirm !== true || input.baseline !== JSON.stringify([p.privateFields, p.development.revision]))
            throw Error('Review an active Lumistry-created person and the latest saved character before accepting a change. Bank characters use their native profile editor.');
        const keys = { work: 'currentWork', residence: 'currentResidence', routine: 'currentRoutine', pressure: 'currentPressure' } as const;
        const key = keys[input.field as keyof typeof keys];
        if (!key || typeof input.quote !== 'string' || !input.quote.trim() || input.quote.length > 800 || !m.text.includes(input.quote) || typeof input.value !== 'string' || !input.value.trim() || input.value.length > 800 || !input.quote.includes(input.value))
            throw Error('Use an exact value from a statement they actually sent. No inferred identity or relationship change was applied.');
        if (!Object.hasOwn(p.privateFields, key) && Object.keys(p.privateFields).length >= 40)
            throw Error('This private record is full. Review its existing details before adding another current-life fact.');
        p.privateFields[key] = input.value;
        p.development.revision++;
        p.development.units ||= {};
        p.development.units['MUTUAL_MATCH:' + key.toLowerCase()] = { authority: 'private-background', trigger: 'OPERATOR_REVIEW', evidence: [`dating:${c!.id}:${m.id}`], text: 'Operator-reviewed current-life fact: ' + input.value + '\nSource statement: ' + input.quote, createdAt: now, revision: p.development.revision };
        d.tools = tools;
        return c!.id;
    }
    else if (action === 'note') {
        const x = d.decisions.find(x => x.conversationId === input.conversationId && x.status === 'matched'), profile = d.profiles.find(p => p.id === x?.profileId), c = state.conversations.find(c => c.id === input.conversationId && c.channel === 'dating' && c.datingOwnerId === owner && !c.archived), m = c?.messages.find(m => m.id === input.messageId && committedMessage(m,state));
        if (!profile || !m || tools.blocked.includes(profile.id) || (m.senderActorId || m.senderContactId) !== profile.contactId || !['life', 'place', 'routine', 'companion', 'style'].includes(input.kind) || typeof input.quote !== 'string' || !input.quote.trim() || input.quote.length > 800 || !m.text.includes(input.quote))
            throw Error('Choose an exact statement they sent in this active thread.');
        tools.notes = (tools.notes || []).filter(n => !(n.conversationId === c!.id && n.messageId === m.id && n.kind === input.kind));
        tools.notes.push({ profileId: profile.id, conversationId: c!.id, messageId: m.id, kind: input.kind, quote: input.quote });
        tools.notes = tools.notes.slice(-100);
    }
    else if (action === 'reaction') {
        const x = d.decisions.find(x => x.conversationId === input.conversationId && x.status === 'matched'), profile = d.profiles.find(p => p.id === x?.profileId);
        const c = state.conversations.find(c => c.id === input.conversationId && c.channel === 'dating' && c.datingOwnerId === owner && !c.archived);
        const m = c?.messages.find(m => m.id === input.messageId && committedMessage(m,state));
        if (!x || !profile || tools.blocked.includes(profile.id) || !c || !m)
            throw Error('Choose a committed message in an active dating conversation.');
        if (!['heart', 'laugh', 'remove'].includes(input.value))
            throw Error('Choose a reaction.');
        tools.reactions = tools.reactions.filter(r => !(r.conversationId === c.id && r.messageId === m.id && r.actorId === owner));
        if (input.value !== 'remove')
            tools.reactions.push({ conversationId: c.id, messageId: m.id, actorId: owner, value: input.value });
        tools.reactions = tools.reactions.slice(-400);
    }
    else if (!['shortlist', 'presentation', 'block', 'unblock', 'tone', 'restore_tone'].includes(action))
        throw Error('Unknown profile tool.');
    d.tools = tools;
}
export function varietyProfile(profiles: DatingProfile[], key: string) {
    if (!profiles.length)
        return;
    let h = 2166136261;
    for (const c of key + profiles.map(p => p.id).sort().join('|'))
        h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return [...profiles].sort((a, b) => a.id.localeCompare(b.id))[(h >>> 0) % profiles.length];
}
export function publicProfileTips(p: DatingProfile | null): string[] {
    if (!p)
        return ['Create your adult dating profile to start.'];
    return [!p.bio ? 'Add a short introduction in your own voice.' : '', !p.person?.prompts.length ? 'An optional question gives someone an easy opening.' : '', !p.photoPlan.length && !p.photos.length ? 'Describe a photo; rendering it is optional.' : '', !Object.keys(publicDatingProfile(p).fields as object).length ? 'Choose which details you want to share publicly.' : ''].filter(Boolean);
}
export function publicEvidence(p: DatingProfile) { return [{ source: 'Public bio', text: p.bio }, ...(p.person?.prompts || []).map(q => ({ source: q.question, text: q.answer })), ...p.photoPlan.filter(x => x.caption).map(x => ({ source: 'Public caption', text: x.caption }))].filter(x => x.text); }
export function sharedConversationEvidence(state: PhoneState, owner: string, profileId: string) { const d = datingFor(state, owner), x = d.decisions.find(x => x.profileId === profileId), p = d.profiles.find(p => p.id === profileId); const c = state.conversations.find(c => c.id === x?.conversationId && c.channel === 'dating' && c.datingOwnerId === owner); return c && p ? c.messages.filter(m => committedMessage(m,state) && (m.senderActorId || m.senderContactId) === p.contactId && m.text).slice(-3).map(m => ({ source: m.id, text: m.text })) : []; }
export function localQualityReport(d: DatingState) {
    const counts = new Map<string, number>();
    for (const p of d.profiles) {
        const work = p.creationPlan?.work.roleId;
        if (work)
            counts.set(work, (counts.get(work) || 0) + 1);
    }
    return { people: d.profiles.length, repeatedRoles: [...counts].filter(([, n]) => n > 1), emptyBios: d.profiles.filter(p => !p.bio).length, duplicatePublicBios: d.profiles.filter((p, i) => p.bio && d.profiles.slice(0, i).some(q => q.bio.toLowerCase() === p.bio.toLowerCase())).length, voiceSamples: d.profiles.filter(p => p.person?.writingVoice?.mechanics).length, repeatedPublicMotifs: recentOverusedMotifs(d.profiles), notes: 'Local observations only. No publication blocks or automatic rewrites; rendered image identity is not assessed.' };
}
export function discoveryEstimate(d: DatingState) { const ready = d.profiles.filter(p => !d.decisions.some(x => x.profileId === p.id) && datingFit(p, d).eligible).length, target = d.generationSettings.creation?.readyTarget || 5; const deficit = Math.max(0, target - ready); return { ready, target, deficit, typicalCalls: [deficit * 3, deficit * 4], note: 'Clean new profiles typically use 3–4 calls each. Saved work may need fewer; repairs, reasoning and incomplete usage can add work. This is not a token, price or billing limit.' }; }
export function voiceObservations(state: PhoneState, owner: string, id: string) { const d = datingFor(state, owner), x = d.decisions.find(x => x.conversationId === id), p = d.profiles.find(p => p.id === x?.profileId), c = state.conversations.find(c => c.id === id && c.channel === 'dating' && c.datingOwnerId === owner); const texts = c?.messages.filter(m => committedMessage(m,state) && (m.senderActorId || m.senderContactId) === p?.contactId && m.text).slice(-12).map(m => m.text) || []; return { samples: texts.length, averageCharacters: texts.length ? Math.round(texts.reduce((n, s) => n + s.length, 0) / texts.length) : undefined, repeatedTexts: texts.filter((s, i) => texts.indexOf(s) !== i).length, savedVoice: p?.person?.writingVoice ? { mechanics: p.person.writingVoice.mechanics, rhythm: p.person.writingVoice.rhythm } : undefined, note: 'Local observations, not an identity test or automatic correction. A small sample cannot establish voice drift.' }; }
export function publicPresentationQuotes(p: DatingProfile) { const source = [p.bio, ...(p.person?.prompts || []).map(q => q.answer)].join('\n'); return { flags: [...source.matchAll(/(?:green flag|red flag)\s*:\s*[^.!?\n]{1,180}/gi)].map(m => m[0]).slice(0, 2), style: [...source.matchAll(/\bI (?:text|reply|message|prefer texting)[^.!?\n]{0,180}/gi)].map(m => m[0]).slice(0, 2) }; }
export function publicProfileDiff(before: DatingProfile | null, after: DatingProfile) { const a = before ? publicDatingProfile(before) : {}, b = publicDatingProfile(after); return Object.keys(b).filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => ({ field: k, before: a[k] ?? 'not set', after: b[k] })); }
/** Keep thread-note context small; full accepted quotes stay in native storage. */
export function publicHighlight(p: DatingProfile, profiles: DatingProfile[], storyKey = '') {
    const candidates = publicEvidence(p).filter(x => x.source !== 'Public bio');
    const unique = candidates.filter(x => !profiles.some(other => other.id !== p.id && publicEvidence(other).some(y => y.text.toLowerCase() === x.text.toLowerCase())));
    if (!unique.length)
        return;
    let h = 0;
    for (const c of p.id + storyKey)
        h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
    return unique[h % unique.length];
}
