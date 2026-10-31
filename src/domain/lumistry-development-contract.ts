import type {PhoneState} from '../types.js';
import {datingFor,type DatingProfile} from './lumistry.js';
export type DevelopmentTriggerKind='MUTUAL_MATCH'|'CONTACT_ONLY'|'ENCOUNTER_CONFIRMED';
export interface DevelopmentTrigger {kind:DevelopmentTriggerKind;evidence:string[];}
export interface DevelopmentModule {key:string;label:string;guidance:string;}
export function verifiedDatingEncounter(s:PhoneState,p:DatingProfile):string[] {
 const contact=s.contacts.find(c=>c.id===p.contactId),scene=s.sceneSnapshot;
 if(contact?.presence.inScene&&scene&&!scene.stale&&scene.sourceMessageId&&scene.actors.some(a=>a.contactId===p.contactId))return [`scene:${scene.sourceMessageId}:${scene.sourceRevision}`];
 const relay=(s.relays||[]).find(r=>r.chatId===s.chatId&&r.characterId===s.characterId&&r.contactId===p.contactId&&r.status==='consumed'&&r.continuation.state==='completed'&&r.consumedMessageId&&r.actorState!=='arriving'&&s.conversations.some(c=>c.id===r.conversationId&&c.includesPocketPersona&&c.participantContactIds.includes(p.contactId)));
 return relay?[`relay:${relay.id}`,`message:${relay.consumedMessageId}`]:[];
}
export function developmentTrigger(s:PhoneState,p:DatingProfile,stage:'match'|'portrayal'):DevelopmentTrigger|undefined {
 const d=datingFor(s),decision=d.decisions.find(x=>x.profileId===p.id);
 if(stage==='match')return decision?.status==='matched'?{kind:'MUTUAL_MATCH',evidence:[`match:${decision.profileId}:${decision.conversationId}`]}:undefined;
 const encounter=verifiedDatingEncounter(s,p);
 if(encounter.length)return {kind:'ENCOUNTER_CONFIRMED',evidence:encounter};
 return decision?.exchanged?{kind:'CONTACT_ONLY',evidence:d.relationships.events.filter(e=>e.profileId===p.id&&e.kind==='exchange'&&e.status==='confirmed').map(e=>`exchange:${e.id}`).concat(`exchange-confirmed:${p.id}:${decision.conversationId}`)}:undefined;
}
const modules:Record<DevelopmentTriggerKind,DevelopmentModule[]>={
 MUTUAL_MATCH:[
  {key:'daily',label:'Unseen daily life',guidance:'Add one compatible ordinary detail. No mandatory project, crisis or major backstory.'},
  {key:'voice',label:'Texting voice in practice',guidance:'A short new voice example, explicitly a sample rather than a committed message.'},
  {key:'disclosure',label:'Trust and disclosure',guidance:'Individual reservations or pace; no promised attraction, intimacy, meeting or exchange.'},
 ],
 CONTACT_ONLY:[
  {key:'knowledge',label:'Who knows what',guidance:'Knowledge from actual public material and exchanged words only; private work/employer details stay private unless disclosed.'},
  {key:'channels',label:'Cross-channel behavior',guidance:'How the same individual uses dating and ordinary contact, without inventing a physical meeting or numeric reply timers.'},
 ],
 ENCOUNTER_CONFIRMED:[
  {key:'knowledge',label:'Who knows what',guidance:'Separate actual observed facts and disclosures from own-private knowledge.'},
  {key:'presence',label:'Physical presence',guidance:'Evidence-backed physical portrayal consistent with accepted anatomy. Compatible occasion clothing may reflect accepted style without rerolling it. Do not invent touching, attraction or further events.'},
  {key:'initiative',label:'Independent initiative',guidance:'Compact performance guidance for choices and refusals; not a new event or fixed script.'},
 ],
};
export function pendingDevelopmentModules(p:DatingProfile,t:DevelopmentTrigger):DevelopmentModule[] {
 if(t.kind==='MUTUAL_MATCH'&&p.development?.match&&!p.development.units)return [];
 if(t.kind==='CONTACT_ONLY'&&p.development?.portrayal&&!p.development.units)return [];
 return modules[t.kind].filter(m=>!p.development?.units?.[`${t.kind}:${m.key}`]&&(p.development?.unitAttempts?.[`${t.kind}:${m.key}`]||0)<2);
}
export type DevelopmentAuthority='witnessed'|'private-background'|'performance'|'diagnostic';
export function developmentAuthority(module:DevelopmentModule,newPerson=false):DevelopmentAuthority {
 if(module.key==='voice')return 'diagnostic';
 if(['knowledge','presence'].includes(module.key))return 'witnessed';
 if(newPerson&&['daily','disclosure'].includes(module.key))return 'private-background';
 return 'performance';
}
export function developmentPrompt(fields:DevelopmentModule[],trigger:DevelopmentTriggerKind,newPerson=false):string {
 return `The verified ${trigger} evidence establishes eligibility, not that the other participant witnessed newly authored background. Respect each module’s authority below. Preserve age, work, identity, commitments, orientation and all accepted facts. This response cannot commit events or disclose secrets to others. Ordinary contentment and little change are valid. No JSON or invented IDs. Return only these labeled answers, usually one short sentence each. Keep the whole record under 4200 characters.\n`+fields.map(m=>`${m.label}: [${({witnessed:'Extract only supplied witnessed facts; unknown stays unknown.', 'private-background':'For this Lumistry-created person, author compatible low-stakes private background. It becomes own-private reality, not another participant’s knowledge or a witnessed event.',performance:'Conditional performance guidance grounded in the accepted person; no new biography or event.',diagnostic:'Diagnostic voice sample only; never a sent message, disclosure or event.'})[developmentAuthority(m,newPerson)]} ${m.guidance}]`).join('\n');
}
export function parseDevelopmentModules(text:string,requested:DevelopmentModule[]):Array<{module:DevelopmentModule;text:string}> {
 const result=new Map<string,string>();let active:DevelopmentModule|undefined,buffer:string[]=[];
 const flush=()=>{if(active&&buffer.join('\n').trim()){if(result.has(active.key))throw new Error('Repeated conflicting development module');result.set(active.key,buffer.join('\n').trim());}};
 for(const line of text.split(/\r?\n/)){
  const label=line.match(/^\s*(?:[-*]\s+)?(?:\*\*)?([^:\n]{1,100}?)(?:\*\*)?\s*:\s*(?:\*\*)?\s*(.*)$/);
  if(label){flush();active=requested.find(m=>m.label.toLowerCase()===label[1].trim().toLowerCase());buffer=active?[label[2]]:[];}
  else if(active)buffer.push(line);
 }
 flush();return requested.flatMap(module=>result.has(module.key)?[{module,text:result.get(module.key)!}]:[]);
}
