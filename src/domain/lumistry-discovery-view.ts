import {currentPriorLike} from './lumistry-compatibility.js';
import type {PopulationWorld} from './lumistry-world-core.js';
/** Local view projections only. Never author facts or request generation. */
import type {PhoneState} from '../types.js';
import {datingFor,datingFit,publicDatingProfile,type DatingProfile,type DatingState} from './lumistry.js';
export function publicInterests(p:DatingProfile|null):string[]{
 if(!p)return [];const fields=publicDatingProfile(p).fields as Record<string,string>;
 return [...new Map((fields.interests||'').split(/[,;\n|]/).map(v=>v.trim()).filter(Boolean).map(v=>[v.toLocaleLowerCase(),v])).values()];
}
export function sharedInterestHints(self:DatingProfile|null,p:DatingProfile):string[]{const own=new Set(publicInterests(self).map(v=>v.toLocaleLowerCase()));return publicInterests(p).filter(v=>own.has(v.toLocaleLowerCase())).slice(0,2).map(v=>'Both list '+v);}
export const hasPriorLike=(p:DatingProfile,d?:DatingState)=>d?currentPriorLike(p,d):p.interest?.version===2&&p.interest.seen===true&&p.interest.status==='matched';
export function discoverProfiles(d:DatingState,likedOnly=false):DatingProfile[]{const decided=new Set(d.decisions.map(x=>x.profileId));return d.profiles.filter(p=>!decided.has(p.id)&&(!likedOnly||hasPriorLike(p,d))).map(profile=>({profile,fit:datingFit(profile,d)})).filter(x=>x.fit.eligible).sort((a,b)=>b.fit.score-a.fit.score).map(x=>x.profile);}
export function frontQuestion(p:DatingProfile){const all=p.person?.prompts||[];let hash=0;for(const c of p.id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return all.length?all[hash%all.length]:undefined;}
export function openingStarters(p:DatingProfile,world?:PopulationWorld):string[]{const out:string[]=[];const q=frontQuestion(p);if(q)out.push(`Hi ${p.alias}! I'd love to hear more about your answer to “${q.question}”`);for(const interest of publicInterests(p)){if(out.length===3)break;out.push(`Hi ${p.alias}! What do you enjoy most about ${interest}?`);}if(out.length<3&&world?.reviewed){if(world.capabilities.includes('fantasy_magic'))out.push('Is there anything about magic here you enjoy talking about?');else if(world.capabilities.includes('starships'))out.push('Is there somewhere among the stars you would like to hear more about?');}return out.length?out:[`Hi ${p.alias}! How's your day going?`];}
export function activeDatingMatch(state:PhoneState,owner:string,id:string){const d=datingFor(state,owner),c=state.conversations.find(c=>c.id===id&&!c.archived&&c.channel==='dating'&&c.datingOwnerId===owner&&c.kind==='direct');const x=d.decisions.find(x=>x.conversationId===id&&x.status==='matched');const p=x&&d.profiles.find(p=>p.id===x.profileId);return c&&p&&[...(c.participantActorIds||[]),...(c.participantContactIds||[])].includes(p.contactId)&&owner===state.pocketPersonaActorId?{d,c,p,x:x!}:undefined;}
export function needsStarter(state:PhoneState,owner:string,id:string){const m=activeDatingMatch(state,owner,id);return !!m&&!m.c.messages.some(x=>(x.senderActorId|| (x.sender==='persona'?owner:undefined))===owner&&x.sender!=='system'&&x.status!=='pending'&&x.status!=='failed'&&x.candidateCommitState!=='provisional');}
export function dateActivities(d:DatingState,_p:DatingProfile):string[]{
 // No assumptions about locomotion, food, alcohol, or named venues. These
 // activities allow individual adaptation regardless of body plan.
 const out=['A quiet conversation'];const w=d.populationWorld;
 if(w?.reviewed&&w.capabilities.includes('digital_networks'))out.push('An online game together');
 if(w?.reviewed&&w.capabilities.includes('fantasy_magic'))out.push('Sharing stories about magic');
 if(w?.reviewed&&w.capabilities.includes('starships'))out.push('Sharing stories about space travel');
 return out.slice(0,3);
}
export interface DateInvitationDraft {activity:string;place:string;when:string;}
export function invitationText(v:DateInvitationDraft):string{return `Would you be interested in a date together — ${v.activity.trim()}${v.place.trim()?` at ${v.place.trim()}`:''}${v.when.trim()?` — ${v.when.trim()}`:''}? We can choose something else or another time if you prefer.`;}
export function agreedDates(state:PhoneState,owner:string,id:string){const m=activeDatingMatch(state,owner,id);if(!m||!m.d.pipeline.events)return [];return m.d.relationships.events.filter(e=>!e.needsReview&&e.profileId===m.p.id&&e.conversationId===id&&e.kind==='date'&&e.status==='confirmed').map(e=>({event:e,timeline:e.timelineId?state.events?.find(t=>t.id===e.timelineId&&t.source?.conversationId===id&&t.participantActorIds?.includes(owner)&&t.participantActorIds?.includes(m.p.contactId)):undefined}));}
export interface MatchNotice {profileId:string;conversationId:string;forced:boolean;}
export class MatchAnnouncements {
 private scopes=new Map<string,Set<string>>();private scope='';pending:MatchNotice[]=[];
 observe(state:PhoneState,owner:string){const scope=JSON.stringify([state.chatId,state.characterId,owner]);if(scope!==this.scope){this.scope=scope;this.pending=[];}const d=datingFor(state,owner);const seen=this.scopes.get(scope);const ids=d.decisions.filter(x=>x.status==='matched'&&x.conversationId);if(!seen){this.scopes.set(scope,new Set(d.decisions.filter(x=>x.status==='matched').map(x=>x.profileId)));return;}
 for(const x of ids){if(!seen.has(x.profileId)&&activeDatingMatch(state,owner,x.conversationId!)){this.pending.push({profileId:x.profileId,conversationId:x.conversationId!,forced:!!x.forcedMatch});seen.add(x.profileId);}}
 this.pending=this.pending.filter(n=>!!activeDatingMatch(state,owner,n.conversationId));
 }
 dismiss(){this.pending=[];}
}
