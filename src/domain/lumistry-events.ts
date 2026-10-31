import {committedConversationMessages} from './lumistry-evidence.js';
import type { PhoneState, PocketConversation } from '../types.js';
import { datingFor, publicDatingProfile } from './lumistry.js';
export {normalizeRelationships} from './lumistry-relationship-state.js';
export type {DatingRelationshipEvent,DatingRelationshipState} from './lumistry-relationship-state.js';
import type {DatingRelationshipEvent,DatingRelationshipState} from './lumistry-relationship-state.js';
const text = (s: any, n = 300) => typeof s === 'string' ? s.trim().slice(0, n) : '';
export const relationshipSourceHash=(s:string)=>{let a=2166136261;for(const ch of s)a=Math.imul(a^ch.charCodeAt(0),16777619);return (a>>>0).toString(16)+':'+s.length;};
export function reconcileRelationshipSources(state:PhoneState):boolean {
 const data=state.lumistry?.[state.pocketPersonaActorId];if(!data)return false;let changed=false;
 for(const event of data.relationships.events){
  const c=state.conversations.find(c=>c.id===event.conversationId),p=data.profiles.find(p=>p.id===event.profileId);
  if(!c&&data.authoringArchives?.some(a=>a.kind==='conversation'&&a.jobId===event.conversationId))continue;
  const messages=c&&p?committedDatingMessages(c,state.pocketPersonaActorId,p.contactId,state):[];
  const supported=event.evidence.length>0&&event.evidence.every(e=>{const m=messages.find(m=>m.id===e.messageId);return m&&m.text.includes(e.quote)&&(!event.sourceHashes?.[m.id]||event.sourceHashes[m.id]===relationshipSourceHash(m.text));});
  if(!event.sourceHashes&&supported){event.sourceHashes=Object.fromEntries(event.evidence.map(e=>[e.messageId,relationshipSourceHash(messages.find(m=>m.id===e.messageId)!.text)]));changed=true;}
  if(event.needsReview!==!supported){event.needsReview=!supported;changed=true;}
  const row=event.timelineId&&state.events.find(x=>x.id===event.timelineId);
  if(row&&row.createdBy!=='user'){
   const prefix='[Source needs review; no current agreement established] ';
   if(!supported&&!row.description.startsWith(prefix)){row.description=prefix+row.description;changed=true;}
   else if(supported&&row.description.startsWith(prefix)){row.description=row.description.slice(prefix.length);changed=true;}
  }
 }
 return changed;
}
export function committedDatingMessages(c: PocketConversation, owner: string, contact: string, state?:PhoneState) {
    return committedConversationMessages(c,state).filter(m => m.sender !== 'system' && m.status !== 'pending' && m.candidateCommitState !== 'provisional' && m.status !== 'failed' && !m.sharedCapture && !!m.text?.trim())
        .flatMap(m => {
        const speaker = m.senderActorId || (m.sender === 'persona' ? owner : m.senderContactId);
        return speaker === owner || speaker === contact ? [{ id: m.id, speaker, text: m.text, createdAt: m.createdAt }] : [];
    }).slice(-32);
}
export const eventReceipt = (messages: ReturnType<typeof committedDatingMessages>): string => {
    let hash = 2166136261;
    for (const ch of JSON.stringify(messages))
        hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
    return (messages.at(-1)?.id || '') + ':' + hash.toString(16);
};
/** Recall-oriented scheduling gate only. It never establishes an event, agreement or consent. */
export function shouldExtractDatingEvents(messages: ReturnType<typeof committedDatingMessages>, existing: DatingRelationshipEvent[], previousReceipt?: string) {
    const previousId=previousReceipt?.slice(0,previousReceipt.lastIndexOf(':'));
    const index=previousId?messages.findIndex(m=>m.id===previousId):-1;
    const changed=index>=0?messages.slice(index+1):messages;
    if(!changed.length)return false;
    const value=changed.map(m=>m.text).join('\n').replace(/[’‘]/g,"'");
    const open=existing.some(e=>!['cancelled','completed'].includes(e.status));
    const cue=(value:string)=> {
        if(/\b(meet|meeting|date|hang(?:ing)? out|get together|go out|grab a bite|swing by|stop by|come (?:over|round|around)|see you|pick you up|schedule|reservation|number|contact|address|whatsapp|telegram|signal|text me|call me|are you free|let's)\b|\+?\d[\d ().-]{7,}\d/i.test(value))return true;
        const invitation=/\?|\b(for|grab|join|with (?:me|you)|how about|want to|wanna|shall|could we|would you)\b/i.test(value);
        if(/\b(coffee|dinner|lunch|drinks|visit)\b/i.test(value) && invitation)return true;
        return /\b(tonight|tomorrow|today|weekend|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|noon|midnight|available)\b|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(value) && (open || /\b(free|work|works|how about|want to|wanna|shall|could we|would you)\b/i.test(value));
    };
    if(cue(value))return true;
    const recentCue=messages.slice(-6).some(m=>cue(m.text.replace(/[’‘]/g,"'")));
    return (open || recentCue) && /\b(yes|yeah|yep|sure|okay|ok|no|nah|cancel|postpone|reschedule|instead|later|earlier|busy|sorry|can't|cannot|won't|don't|not anymore|changed my mind|sounds good|works for me|agreed|deal|off|stop)\b|[👍👌👎✅]/iu.test(value);
}
const oldTerminal = (events: DatingRelationshipEvent[], id: unknown) => typeof id === 'string' && events.some(e => e.id === id && ['cancelled', 'completed'].includes(e.status));
/** Deterministic evidence gates; extraction's semantic judgement never bypasses authorship. */
export function validateRelationshipEvents(raw: any, messages: ReturnType<typeof committedDatingMessages>, existing: DatingRelationshipEvent[], profileId: string, conversationId: string, owner: string, contact: string, now: string): DatingRelationshipEvent[] {
    return (Array.isArray(raw) ? raw : []).slice(0, 3).flatMap((e: any) => {
        if (!e || !['date', 'exchange'].includes(e.kind) || !['proposed', 'negotiating', 'confirmed', 'postponed', 'cancelled'].includes(e.status) || !Array.isArray(e.evidence) || !e.evidence.length || e.evidence.length > 6)
            return [];
        const evidence = e.evidence.map((x: any) => ({ messageId: text(x?.messageId, 180), quote: text(x?.quote, 800), intent: ['propose', 'accept', 'refuse', 'revoke', 'unclear'].includes(x?.intent) ? x.intent : 'unclear' }));
        if (evidence.some((x: any) => !x.quote || !messages.some(m => m.id === x.messageId && m.text.includes(x.quote))))
            return [];
        const speakers = new Set(evidence.map((x: any) => messages.find(m => m.id === x.messageId)!.speaker));
        if (e.status === 'confirmed') {
            if (!speakers.has(owner) || !speakers.has(contact)) return [];
            const ordered = evidence.map((x: any) => ({ ...x, order: messages.findIndex(m => m.id === x.messageId), speaker: messages.find(m => m.id === x.messageId)!.speaker })).sort((a: any, b: any) => a.order - b.order);
            const proposal = ordered.find((x: any) => x.intent === 'propose');
            const acceptance = proposal && ordered.find((x: any) => x.intent === 'accept' && x.speaker !== proposal.speaker && x.order > proposal.order);
            // Language-independent structural gates over explicit contextual judgement.
            // Exact quotes alone cannot prove agreement; missing/unclear intent never confirms.
            if (!acceptance || ordered.some((x: any) => ['refuse', 'revoke'].includes(x.intent) && x.order >= proposal.order)) return [];
            // Both speakers' latest messages in the supplied window must be represented,
            // preventing a classifier from confirming old quotes while ignoring a new refusal.
            for (const speaker of [owner, contact]) {
                const latest = messages.filter(m => m.speaker === speaker).at(-1);
                if (latest && !ordered.some((x: any) => x.messageId === latest.id && ['propose', 'accept'].includes(x.intent))) return [];
            }
            if (oldTerminal(existing, e.eventId)) return [];
        }
        const old = e.eventId ? existing.find(x => x.id === e.eventId && x.profileId === profileId && x.conversationId === conversationId && x.kind === e.kind) : undefined;
        if (e.eventId && !old || ['postponed', 'cancelled'].includes(e.status) && !old)
            return [];
        const identity = eventReceipt(evidence.map((x: any) => ({ id: x.messageId, speaker: '', text: x.quote, createdAt: '' }))).replace(/[^a-zA-Z0-9_-]/g, '_');
        const id = old?.id || `dating_event_${e.kind}_${identity}`;
        // Replayed source evidence cannot create a second event under a new title.
        const replay = existing.find(x => x.id === id);
        return [{ sourceHashes:Object.fromEntries(evidence.map((v:any)=>[v.messageId,relationshipSourceHash(messages.find(m=>m.id===v.messageId)!.text)])),needsReview:false,id, profileId, conversationId, kind: e.kind, status: e.status, title: text(e.title) || old?.title || (e.kind === 'date' ? 'Date plan' : 'Contact exchange'), whenText: text(e.whenText) || old?.whenText || '', evidence, createdAt: old?.createdAt || replay?.createdAt || now, updatedAt: now, timelineId: old?.timelineId || replay?.timelineId, history: [...((old || replay)?.history || []), ...((old || replay) && ((old || replay)!.status !== e.status || JSON.stringify((old || replay)!.evidence) !== JSON.stringify(evidence)) ? [{ status: (old || replay)!.status, evidence: (old || replay)!.evidence, updatedAt: (old || replay)!.updatedAt }] : [])].slice(-12) }];
    });
}
export function datingPlanContext(state: PhoneState, direction: string): string {
    const d = datingFor(state);
    if (!d.pipeline.rpBridge)
        return '';
    const plans = d.relationships.events.filter(e => !e.needsReview && e.kind === 'date' && e.status === 'confirmed' && d.decisions.some(x => x.profileId === e.profileId && x.status === 'matched')).flatMap(e => {
        const p = d.profiles.find(x => x.id === e.profileId), contact = p && state.contacts.find(c => c.id === p.contactId);
        if (!p || !contact || !(contact.presence.inScene || (' ' + direction.toLocaleLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, ' ') + ' ').includes(' ' + p.alias.toLocaleLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, ' ') + ' ')))
            return [];
        const thread = state.conversations.find(c => c.id === e.conversationId);
        return [{ actorId: p.contactId, profileId: p.id, alias: p.alias, plan: e.title, when: e.whenText, sourceMessageIds: e.evidence.map(x => x.messageId), state: 'pending plan, not a completed meeting', publicCharacterFacts: { alias: p.alias, age: p.age, pronouns: p.pronouns, fields: publicDatingProfile(p).fields }, sharedWithPersona: thread ? committedDatingMessages(thread, state.pocketPersonaActorId, p.contactId,state).slice(-4).map(m => ({ speaker: m.speaker === p.contactId ? p.alias : d.self?.alias, text: m.text })) : [], npcPortrayalOnly: { phoneProfile: p.phoneProfile, privateFields: p.privateFields, background: p.development?.match?.facts.slice(0, 1600) } }];
    }).slice(-3);
    return plans.length ? `SCOPED LUMISTRY PLANS: ${JSON.stringify(plans)}. The same canonical actor must be reused. Public facts and actual shared words are pair knowledge; npcPortrayalOnly is that NPC's own private knowledge, never Persona/other-actor knowledge or automatic narration. Saved orientation, commitments, sexuality, intentions and boundaries remain authoritative. These plans never advance time, establish recognition/presence, compel attendance or complete themselves. Follow the user's actual scene direction and native actor state.` : '';
}
