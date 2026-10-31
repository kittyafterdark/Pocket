import {experienceContentGuidance} from '../domain/lumistry-experience-preferences.js';
import {developmentTrigger,developmentAuthority,pendingDevelopmentModules,developmentPrompt,parseDevelopmentModules,verifiedDatingEncounter} from '../domain/lumistry-development-contract.js';
import {V2_AUTHOR_RULES} from './lumistry-v2-prompts.js';
import {auxiliary} from '../domain/reliability.js';
import { classifyFailure } from '../domain/reliability.js';
import { v2AuthorPrompt } from './lumistry-v2-prompts.js';
import type { PhoneState } from '../types.js';
import { datingFor } from '../domain/lumistry.js';
import { relationshipEventsPrompt } from './lumistry-prompts.js';
import { committedDatingMessages, eventReceipt, shouldExtractDatingEvents, validateRelationshipEvents } from '../domain/lumistry-events.js';
import { ensureDirectConversation } from '../domain/contacts.js';
import type { DiscoveryHost } from './lumistry-discovery.js';
interface Host extends DiscoveryHost {
    generate(task: string, request: string, input: any, user?: string): Promise<Record<string, any>>;
}
/** Uses native activity/reply opportunities, no poller and no generation from Like/Pass. */
export class LumistryDevelopment {
    private flights = new Map<string, AbortController>();
    constructor(private h: Host) { }
    cancelAll(user?: string) { for (const [key, c] of this.flights)
        if (user === undefined || key.startsWith(JSON.stringify(user) + ':')) {
            c.abort();
            this.flights.delete(key);
        } }
    async maintain(context: {
        chatId: string;
        characterId: string;
    }, user?: string, conversationId = '', externalSignal?: AbortSignal, mode: 'background' | 'events' = 'background') {
        const h = this.h, { chatId, characterId } = context, key = h.stateKey(chatId, characterId), flightKey = JSON.stringify(user) + ':' + key;
        if (this.flights.has(flightKey) || !h.permitted('generation'))
            return;
        const controller = new AbortController();
        this.flights.set(flightKey, controller);
        const abort = () => controller.abort();
        externalSignal?.addEventListener('abort', abort, { once: true });
        if (externalSignal?.aborted)
            abort();
        const check = () => { controller.signal.throwIfAborted(); if (!h.permitted('generation') || h.activeScope?.(chatId, characterId, user) === false)
            throw new Error('Generation permission revoked.'); };
        const generate = (task: string, system: string, data: unknown, tokens: number) => h.generate(task, h.id(task), { type: 'quiet', signal: controller.signal, messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(data) }], ...(task === 'lumistry-author' ? {} : {parameters: { temperature: .35, max_tokens: tokens }}), userId: user }, user);
        try {
            await h.withStateLock(key, async () => {
                check();
                const s = await h.loadState(chatId, characterId, user), data = datingFor(s);
                let changed = false;
                if (!data.pipeline.events)
                    return;
                for (const e of data.relationships.events)
                    if (e.kind === 'date' && e.status === 'confirmed' && e.timelineId && s.events.some(x => x.id === e.timelineId && x.completed) && data.profiles.some(p=>p.id===e.profileId&&verifiedDatingEncounter(s,p).length>0)&&(s.relays||[]).some(r=>r.timelineEventId===e.timelineId&&r.status==='consumed'&&r.continuation.state==='completed'&&r.actorState!=='arriving')) {
                        e.status = 'completed';
                        e.updatedAt = h.nowIso();
                        changed = true;
                    }
                if (changed) {
                    await h.saveState(s, user);
                    await h.sendState(s, user, 'dating');
                }
            });
            check();
            const snapshot = await h.withStateLock(key,()=>h.loadState(chatId, characterId, user)), owner = snapshot.pocketPersonaActorId, d = datingFor(snapshot, owner);
            const active = d.profiles.filter(p => p.development && (!conversationId || d.decisions.some(x => x.profileId === p.id && x.conversationId === conversationId) || snapshot.conversations.some(c => c.id === conversationId && c.channel !== 'dating' && c.participantContactIds.includes(p.contactId))));
            // Reply opportunities process relevant events only; optional development belongs to native background activity or an explicit editor request.
            let budget = mode === 'events' ? 0 : conversationId ? 2 : 1;
            for (const p of active) {
                if (!d.pipeline.enrichment || budget <= 0)
                    break;
                const decision = d.decisions.find(x => x.profileId === p.id), contact = snapshot.contacts.find(c => c.id === p.contactId);
                for (const stage of ['match', 'portrayal'] as const) {
                    const trigger=developmentTrigger(snapshot,p,stage);
                    const selectedModules=trigger?pendingDevelopmentModules(p,trigger):[];
                    if (!trigger || !selectedModules.length || budget <= 0)
                        continue;
                    let claimed = false, identity = '', world = '', contentPreferences = '';let contentGuide:string|undefined;
                    let claimedProfile = p;
                    const fingerprint = (profile: typeof p) => JSON.stringify({ ...profile, photos: undefined, development: undefined, developmentRevision: profile.development?.revision, contactId: undefined });
                    await h.withStateLock(key, async () => {
                        check();
                        const s = await h.loadState(chatId, characterId, user), data = datingFor(s, owner), current = data.profiles.find(x => x.id === p.id), dec = data.decisions.find(x => x.profileId === p.id);
                        if (s.pocketPersonaActorId !== owner || !data.pipeline.enrichment || !current?.development)
                            return;
                        if(JSON.stringify(developmentTrigger(s,current,stage))!==JSON.stringify(trigger)||pendingDevelopmentModules(current,trigger).map(m=>m.key).join(',')!==selectedModules.map(m=>m.key).join(','))return;
                        current.development.unitAttempts||={};for(const module of selectedModules){const id=`${trigger.kind}:${module.key}`;current.development.unitAttempts[id]=(current.development.unitAttempts[id]||0)+1;}
                        current.development.attempts[stage]=Math.min(2,current.development.attempts[stage]+1);
                        current.development.error = undefined;
                        identity = fingerprint(current);
                        claimedProfile = structuredClone(current);
                        world = data.worldContext;contentPreferences=JSON.stringify(data.experiencePreferences);contentGuide=experienceContentGuidance(data.experiencePreferences);
                        claimed = true;
                        await h.saveState(s, user);
                    });
                    if (!claimed)
                        continue;
                    budget--;
                    try {
                        const result = await generate('lumistry-author',V2_AUTHOR_RULES+'\n'+(contentGuide||'')+'\n'+developmentPrompt(selectedModules,trigger.kind,claimedProfile.development?.origin==='profile_first'),{task:stage,trigger:trigger.kind,evidence:trigger.evidence,requestedModules:selectedModules.map(m=>m.label),savedIdentity:{...claimedProfile,creationPlan:undefined,authoring:undefined,photos:undefined},workFacts:claimedProfile.creationPlan?{title:claimedProfile.creationPlan.work.title,situation:claimedProfile.creationPlan.work.situation}:undefined,worldContext:world,committedMessages:snapshot.conversations.filter(c=>c.id===decision?.conversationId||(decision?.exchanged&&c.kind==='direct'&&c.includesPocketPersona&&c.participantContactIds.includes(p.contactId))).flatMap(c=>committedDatingMessages(c,owner,p.contactId,snapshot))},2400);
                        check();
                        const value = result.authoredText;
                        if (typeof value !== 'string' || !value.trim() || value.length > 6000 || result.finishReason === 'length')
                            throw new Error('Development returned an invalid additive record.');
                        await h.withStateLock(key, async () => {
                            check();
                            const s = await h.loadState(chatId, characterId, user), data = datingFor(s, owner), current = data.profiles.find(x => x.id === p.id), dec = data.decisions.find(x => x.profileId === p.id);
                            if (s.pocketPersonaActorId !== owner || !data.pipeline.enrichment || !current?.development || fingerprint(current) !== identity || data.worldContext !== world || JSON.stringify(data.experiencePreferences)!==contentPreferences)
                                return;
                            if(JSON.stringify(developmentTrigger(s,current,stage))!==JSON.stringify(trigger))return;
                            const accepted=parseDevelopmentModules(value,selectedModules);
                            if(!accepted.length)throw new Error('No requested development modules were returned.');
                            current.development.units||={};
                            current.development.revision++;
                            for(const record of accepted)current.development.units[`${trigger.kind}:${record.module.key}`]={trigger:trigger.kind,authority:developmentAuthority(record.module,current.development.origin==='profile_first'),evidence:trigger.evidence,text:record.text,createdAt:h.nowIso(),revision:current.development.revision};
                            const aggregate=Object.entries(current.development.units).filter(([id,unit])=>unit.authority!=='diagnostic'&&(stage==='match'?id.startsWith('MUTUAL_MATCH:'):!id.startsWith('MUTUAL_MATCH:'))).map(([,r])=>r.text).join('\n');
                            if(stage==='match')current.development.match={facts:aggregate,createdAt:h.nowIso()};
                            else current.development.portrayal={behavior:aggregate,createdAt:h.nowIso()};
                            current.development.error = undefined;
                            p.development = structuredClone(current.development);
                            await h.saveState(s, user);
                            await auxiliary(()=>h.sendState(s,user,'dating'),d=>h.reportDiagnostic?.(d,user));
                        });
                    }
                    catch (error) {
                        if (controller.signal.aborted || !h.permitted('generation'))
                            throw error;
                        await h.withStateLock(key, async () => { const s = await h.loadState(chatId, characterId, user), current = datingFor(s, owner).profiles.find(x => x.id === p.id); if (current?.development && fingerprint(current) === identity) {
                            current.development.error = 'Background development paused. Your saved profile is available; retry from profile options.';
                            await h.saveState(s, user);
                            await auxiliary(()=>h.sendState(s,user,'dating'),d=>h.reportDiagnostic?.(d,user));
                        } });
                    }
                }
            }
            if (!d.pipeline.events)
                return;
            if (!conversationId)
                conversationId = snapshot.conversations.find(c => c.channel === 'dating' && !c.archived && d.decisions.some(x => x.conversationId === c.id && x.status === 'matched') && eventReceipt(committedDatingMessages(c, owner, c.participantContactIds[0],snapshot)) !== d.relationships.receipts[c.id])?.id || '';
            if (!conversationId)
                return;
            const latest = await h.withStateLock(key,()=>h.loadState(chatId, characterId, user)), data = datingFor(latest, owner), c = latest.conversations.find(c => c.id === conversationId && c.channel === 'dating' && !c.archived), decision = data.decisions.find(x => x.conversationId === conversationId && x.status === 'matched'), p = data.profiles.find(x => x.id === decision?.profileId);
            if (latest.pocketPersonaActorId !== owner || !data.pipeline.events || !c || !p)
                return;
            const messages = committedDatingMessages(c, owner, p.contactId,latest), receipt = eventReceipt(messages);
            if (messages.length < 2 || data.relationships.receipts[c.id] === receipt)
                return;
            const existingEvents=data.relationships.events.filter(e=>e.profileId===p.id && e.conversationId===c.id);
            if(!shouldExtractDatingEvents(messages,existingEvents,data.relationships.receipts[c.id])) {
                await h.withStateLock(key,async()=>{
                    check();
                    const state=await h.loadState(chatId,characterId,user), current=datingFor(state,owner), thread=state.conversations.find(x=>x.id===c.id && x.channel==='dating' && !x.archived);
                    if(state.pocketPersonaActorId!==owner || !current.pipeline.events || !thread || !current.decisions.some(x=>x.profileId===p.id && x.conversationId===c.id && x.status==='matched') || eventReceipt(committedDatingMessages(thread,owner,p.contactId,state))!==receipt)return;
                    current.relationships.receipts[c.id]=receipt;
                    await h.saveState(state,user);
                });
                return;
            }
            let eventClaimed = false;
            await h.withStateLock(key, async () => {
                check();
                const s = await h.loadState(chatId, characterId, user), data = datingFor(s, owner), current = s.conversations.find(x => x.id === c.id && !x.archived);
                if (s.pocketPersonaActorId !== owner || !data.pipeline.events || !current || !data.decisions.some(x => x.profileId === p.id && x.status === 'matched') || eventReceipt(committedDatingMessages(current, owner, p.contactId,s)) !== receipt)
                    return;
                const attempt = data.relationships.attempts[c.id];
                if (attempt?.receipt === receipt && attempt.count >= 2)
                    return;
                data.relationships.attempts[c.id] = { receipt, count: attempt?.receipt === receipt ? attempt.count + 1 : 1 };
                eventClaimed = true;
                await h.saveState(s, user);
            });
            if (!eventClaimed)
                return;
            const result = await generate('lumistry-events', relationshipEventsPrompt, { owner, contact: p.contactId, messages, existingEvents: data.relationships.events.filter(e => e.profileId === p.id) }, 1100);
            check();
            if (!Array.isArray(result.events))
                throw new Error('Invalid relationship event list.');
            await h.withStateLock(key, async () => {
                check();
                const s = await h.loadState(chatId, characterId, user), current = datingFor(s, owner), conv = s.conversations.find(x => x.id === c.id && !x.archived), dec = current.decisions.find(x => x.profileId === p.id && x.status === 'matched');
                if (s.pocketPersonaActorId !== owner || !current.pipeline.events || !conv || !dec || eventReceipt(committedDatingMessages(conv, owner, p.contactId,s)) !== receipt || current.relationships.receipts[c.id] === receipt)
                    return;
                const events = validateRelationshipEvents(result.events, messages, current.relationships.events, p.id, c.id, owner, p.contactId, h.nowIso());
                for (const event of events) {
                    if (event.kind === 'exchange' && event.status === 'confirmed') {
                        dec.exchanged = true;
                        const contact = s.contacts.find(x => x.id === p.contactId);
                        if (contact) {
                            contact.messagingPolicy.remoteEligible = true;
                            contact.generationPolicy.relevant = true;
                            ensureDirectConversation(s, contact.id, h.nowIso(), h.id);
                        }
                    }
                    if (event.kind === 'date' && event.status === 'confirmed') {
                        event.timelineId ||= h.id('dating_plan');
                        const old = s.events.find(x => x.id === event.timelineId);
                        if (old) {
                            old.title = event.title;
                            old.whenText = event.whenText;
                        }
                        else
                            s.events.push({ id: event.timelineId, title: event.title, description: 'Mutually agreed Lumistry plan; attendance remains unestablished.', start: '', end: '', whenKind: event.whenText ? 'relative' : 'unscheduled', whenText: event.whenText, color: '', lane: 'Lumistry plans', completed: false, createdBy: 'model', kind: 'event', actorContactIds: [p.contactId], participantActorIds: [owner, p.contactId], source: { app: 'messages', conversationId: c.id, messageId: event.evidence.at(-1)?.messageId } });
                    }
                    else if (event.timelineId && ['cancelled', 'postponed'].includes(event.status)) {
                        const row = s.events.find(x => x.id === event.timelineId);
                        if (row) {
                            row.description = `Lumistry plan ${event.status}; no meeting established.`;
                            row.title = `${event.status === 'cancelled' ? 'Cancelled' : 'Postponed'}: ${event.title}`;
                            row.completed = false;
                        }
                    }
                    const index = current.relationships.events.findIndex(x => x.id === event.id);
                    if (index >= 0)
                        current.relationships.events[index] = event;
                    else
                        current.relationships.events.push(event);
                }
                current.relationships.events = current.relationships.events.slice(-100);
                current.relationships.receipts[c.id] = receipt;
                await h.saveState(s, user);
                await h.sendState(s, user, 'dating');
            });
        }
        catch(error){h.reportDiagnostic?.({...classifyFailure(error),task:'optional-maintenance',saved:true},user);}
        finally {
            externalSignal?.removeEventListener('abort', abort);
            if (this.flights.get(flightKey) === controller)
                this.flights.delete(flightKey);
        }
    }
}
