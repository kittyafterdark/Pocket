import {normalizeLoveState,type LoveState} from './lumistry-love.js';
export interface DatingRelationshipEvent {
    id: string;
    profileId: string;
    conversationId: string;
    kind: 'date' | 'exchange';
    status: 'proposed' | 'negotiating' | 'confirmed' | 'postponed' | 'cancelled' | 'completed';
    title: string;
    whenText: string;
    evidence: Array<{
        messageId: string;
        quote: string;
        intent?: 'propose' | 'accept' | 'refuse' | 'revoke' | 'unclear';
    }>;
    createdAt: string;
    updatedAt: string;
    timelineId?: string;
    needsReview?: boolean;
    sourceHashes?:Record<string,string>;
    history?: Array<{
        status: string;
        evidence: Array<{
            messageId: string;
            quote: string;
        }>;
        updatedAt: string;
    }>;
}
export interface DatingRelationshipState extends LoveState {
    version: 1;
    receipts: Record<string, string>;
    attempts: Record<string, {
        receipt: string;
        count: number;
    }>;
    events: DatingRelationshipEvent[];
}
const text = (s:any,n=300)=>typeof s==='string'?s.trim().slice(0,n):'';
export function normalizeRelationships(v: any): DatingRelationshipState {
    return { ...normalizeLoveState(v), version: 1, attempts: Object.fromEntries(Object.entries(v?.attempts || {}).slice(-100).flatMap(([key, value]: [
            string,
            any
        ]) => value && typeof value.receipt === 'string' ? [[key.slice(0, 180), { receipt: value.receipt.slice(0, 200), count: Math.max(0, Math.min(2, Number(value.count) || 0)) }]] : [])), receipts: Object.fromEntries(Object.entries(v?.receipts || {}).slice(-100).filter(([k, x]) => k.length < 180 && typeof x === 'string' && x.length < 200)) as Record<string, string>,
        events: (Array.isArray(v?.events) ? v.events : []).slice(-100).flatMap((e: any) => e && ['date', 'exchange'].includes(e.kind) && ['proposed', 'negotiating', 'confirmed', 'postponed', 'cancelled', 'completed'].includes(e.status) && text(e.id, 180) && text(e.profileId, 180) ? [{ id: text(e.id, 180), profileId: text(e.profileId, 180), conversationId: text(e.conversationId, 180), kind: e.kind, status: e.status, title: text(e.title), whenText: text(e.whenText), evidence: (Array.isArray(e.evidence) ? e.evidence : []).slice(0, 6).map((x: any) => ({ messageId: text(x.messageId, 180), quote: text(x.quote, 800), ...( ['propose', 'accept', 'refuse', 'revoke', 'unclear'].includes(x.intent) ? { intent: x.intent } : {} ) })), createdAt: text(e.createdAt, 40), updatedAt: text(e.updatedAt, 40), timelineId: text(e.timelineId, 180),needsReview:e.needsReview===true,sourceHashes:e.sourceHashes&&typeof e.sourceHashes==='object'?Object.fromEntries(Object.entries(e.sourceHashes).filter(([k,v])=>k.length<180&&typeof v==='string'&&v.length<100)):undefined, history: (Array.isArray(e.history) ? e.history : []).slice(-12).map((h: any) => ({ status: text(h.status, 40), evidence: (Array.isArray(h.evidence) ? h.evidence : []).slice(0, 6).map((x: any) => ({ messageId: text(x.messageId, 180), quote: text(x.quote, 800), ...( ['propose', 'accept', 'refuse', 'revoke', 'unclear'].includes(x.intent) ? { intent: x.intent } : {} ) })), updatedAt: text(h.updatedAt, 40) })) }] : []) };
}
