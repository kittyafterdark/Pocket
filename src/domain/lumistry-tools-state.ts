import type {PhoneState} from '../types.js';
import type {LumistryExperience} from './lumistry-experience.js';
import {normalizeExperience} from './lumistry-experience.js';
import {committedMessage} from './lumistry-evidence.js';
export interface ExperienceTools {
    version: 1;
    temporaryTone?: {
        before: LumistryExperience;
        applied: LumistryExperience;
    };
    imageReports?: Array<{
        requestId?: string;
        profileId: string;
        imageId: string;
        identity: string;
        summary: string;
        at: string;
    }>;
    shortlist: string[];
    blocked: string[];
    presentation: 'photo' | 'bio';
    published: Record<string, string>;
    notes?: Array<{
        profileId: string;
        conversationId: string;
        messageId: string;
        kind: 'life' | 'place' | 'routine' | 'companion' | 'style';
        quote: string;
    }>;
    reactions: Array<{
        conversationId: string;
        messageId: string;
        actorId: string;
        value: 'heart' | 'laugh';
    }>;
}
export const emptyExperienceTools = (): ExperienceTools => ({ version: 1, shortlist: [], blocked: [], presentation: 'photo', published: {}, reactions: [] });
const ids = (v: any) => Array.isArray(v) ? [...new Set<string>(v.filter((x: any) => typeof x === 'string' && x.length > 0 && x.length <= 180))].slice(0, 100) : [];
export function normalizeExperienceTools(v: any): ExperienceTools | undefined {
    if (v?.version !== 1)
        return;
    return { version: 1, ...(v.temporaryTone?.before?.version === 2 && v.temporaryTone?.applied?.version === 2 ? { temporaryTone: { before: normalizeExperience(v.temporaryTone.before), applied: normalizeExperience(v.temporaryTone.applied) } } : {}), imageReports: (Array.isArray(v.imageReports) ? v.imageReports : []).slice(-20).filter((r: any) => r && typeof r.profileId === 'string' && r.profileId.length <= 180 && typeof r.imageId === 'string' && r.imageId.length <= 200 && typeof r.identity === 'string' && r.identity.length <= 16000 && typeof r.summary === 'string' && r.summary.length <= 6000 && typeof r.at === 'string').map((r: any) => ({ ...((typeof r.requestId === 'string' && r.requestId.length <= 180) ? { requestId: r.requestId } : {}), profileId: r.profileId, imageId: r.imageId, identity: r.identity, summary: r.summary, at: r.at })), shortlist: ids(v.shortlist), blocked: ids(v.blocked), presentation: v.presentation === 'bio' ? 'bio' : 'photo', notes: (Array.isArray(v.notes) ? v.notes : []).slice(-100).filter((r: any) => r && ['profileId', 'conversationId', 'messageId', 'quote'].every(k => typeof r[k] === 'string' && r[k].length > 0 && r[k].length <= (k === 'quote' ? 800 : 180)) && ['life', 'place', 'routine', 'companion', 'style'].includes(r.kind)).map((r: any) => ({ profileId: r.profileId, conversationId: r.conversationId, messageId: r.messageId, kind: r.kind, quote: r.quote })), published: Object.fromEntries(Object.entries(v.published || {}).filter(([k, x]) => k.length <= 180 && typeof x === 'string' && /^\d{4}-\d\d-\d\dT/.test(x) && Number.isFinite(Date.parse(x))).slice(-100)) as Record<string, string>, reactions: (Array.isArray(v.reactions) ? v.reactions : []).slice(-400).filter((r: any) => r && ['conversationId', 'messageId', 'actorId'].every(k => typeof r[k] === 'string' && r[k].length > 0 && r[k].length <= 180) && ['heart', 'laugh'].includes(r.value)).map((r: any) => ({ conversationId: r.conversationId, messageId: r.messageId, actorId: r.actorId, value: r.value })) };
}
export function rememberedClaims(state: PhoneState, owner: string, id: string) {
    const d = state.lumistry?.[owner];if(!d)return [];const decision = d.decisions.find(x => x.conversationId === id && x.status === 'matched'), profile = d.profiles.find(p => p.id === decision?.profileId), c = state.conversations.find(c => c.id === id && c.channel === 'dating' && c.datingOwnerId === owner && !c.archived);
    if (!profile || d.tools?.blocked.includes(profile.id))
        return [];
    return (d.tools?.notes || []).filter(n => n.profileId === profile.id && n.conversationId === id && c?.messages.some(m => m.id === n.messageId && committedMessage(m,state) && (m.senderActorId || m.senderContactId) === profile.contactId && m.text.includes(n.quote))).slice(-6);
}
export function replyClaimProjection(state: PhoneState, owner: string, id: string, query: string) { const words = new Set((query.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || [])); return rememberedClaims(state, owner, id).map((n, i) => ({ n, i, score: [...words].filter(w => n.quote.toLowerCase().includes(w)).length })).filter(x => x.score > 0 || x.n.kind === 'life').sort((a, b) => b.score - a.score || b.i - a.i).slice(0, 2).map(x => x.n); }
