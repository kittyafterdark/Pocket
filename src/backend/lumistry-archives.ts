import {creationDisposition} from '../domain/lumistry-creation-telemetry.js';
import type {PhoneState} from '../types.js';
import {datingFor} from '../domain/lumistry.js';
import {POPULATION_SCHEMA} from '../domain/lumistry-population.js';
export interface ArchiveHost {
 loadState(chat:string,character:string,user?:string):Promise<PhoneState>;
 saveState(state:PhoneState,user?:string):Promise<void>;
 withStateLock<T>(key:string,fn:()=>Promise<T>):Promise<T>;
 stateKey(chat:string,character:string):string;
 nowIso():string;
 writeAuthoringArchive?(id:string,value:unknown,user?:string):Promise<void>;
 readAuthoringArchive?(id:string,user?:string):Promise<unknown>;
 deleteAuthoringArchive?(id:string,user?:string):Promise<void>;
}
export const archiveHash=(text:string)=>{let h=2166136261;for(const ch of text)h=Math.imul(h^ch.charCodeAt(0),16777619);return(h>>>0).toString(16)};
/** Retention is copy/readback/compare/remove, never a deletion policy. */
export async function reserveDiscoveryCapacity(h:ArchiveHost,chat:string,character:string,owner:string,needed:number,user?:string,check:()=>void=()=>{}) {
 for(let attempts=0;attempts<100;attempts++) {
  check();
  const snapshot=await h.withStateLock(h.stateKey(chat,character),async()=>{
   const s=await h.loadState(chat,character,user),d=datingFor(s,owner);
   if(s.pocketPersonaActorId!==owner)throw new Error('The phone owner changed. Saved profiles were kept.');
   if(d.profiles.length+needed<=100)return;
   const profile=d.profiles.find(p=>{
    const decision=d.decisions.find(x=>x.profileId===p.id);
    return !p.contactId&&decision?.status==='passed'&&!decision.conversationId&&!decision.exchanged&&!d.relationships.events.some(e=>e.profileId===p.id)&&![d.discoveryJob,d.draftJob].some(j=>j?.status==='filling'&&j.acceptedIds.includes(p.id));
   });
   if(!profile)throw new Error('Profile storage is full. No passed profile can safely be archived. Saved people were kept; no new generation was started.');
   return {profile,decision:d.decisions.find(x=>x.profileId===profile.id)};
  });
  if(!snapshot)return;
  const body=JSON.stringify(snapshot),id=`profile_${archiveHash(JSON.stringify([chat,character,owner,snapshot.profile.id]))}_${archiveHash(body)}`;
  const archive={version:1,kind:'profile',owner,chatId:chat,characterId:character,...snapshot};
  await verifiedRetention(h,id,archive,user);check();
  await h.withStateLock(h.stateKey(chat,character),async()=>{
   check();const s=await h.loadState(chat,character,user),d=datingFor(s,owner),profile=d.profiles.find(p=>p.id===snapshot.profile.id);
   if(s.pocketPersonaActorId!==owner||JSON.stringify({profile,decision:d.decisions.find(x=>x.profileId===snapshot.profile.id)})!==body)throw new Error('The profile changed during archival. Saved work was kept.');
   if(profile?.contactId||d.relationships.events.some(e=>e.profileId===profile?.id))throw new Error('This profile acquired a connection. Saved work was kept.');
   d.authoringArchives||=[];if(!d.authoringArchives.some(a=>a.id===id))d.authoringArchives.push({id,jobId:snapshot.profile.id,kind:'profile',createdAt:h.nowIso()});
   d.profiles=d.profiles.filter(p=>p.id!==snapshot.profile.id);d.decisions=d.decisions.filter(x=>x.profileId!==snapshot.profile.id);
   await h.saveState(s,user);
  });
 }
 throw new Error('The discovery pool changed repeatedly. Try Find more again; saved work was kept.');
}
async function verifiedRetention(h:ArchiveHost,id:string,value:unknown,user?:string) {
 if(!h.writeAuthoringArchive||!h.readAuthoringArchive)throw new Error('Private archive storage is unavailable. Saved work was kept; no model request was made.');
 await h.writeAuthoringArchive(id,value,user);
 if(JSON.stringify(await h.readAuthoringArchive(id,user))!==JSON.stringify(value))throw new Error('The archive could not be verified. Saved work was kept.');
}
export async function compactArchivedConversations(h:ArchiveHost,chat:string,character:string,owner:string,user?:string) {
 for(let attempts=0;attempts<80;attempts++) {
  const snapshot=await h.withStateLock(h.stateKey(chat,character),async()=>{
   const s=await h.loadState(chat,character,user);if(s.pocketPersonaActorId!==owner)throw new Error('The phone owner changed.');
   if(s.conversations.length<80)return;
   const c=s.conversations.find(c=>c.archived&&c.includesPocketPersona!==false&&(c.channel!=='dating'||c.datingOwnerId===owner)&&!c.outgoingBurst?.open&&!c.messages.some(m=>m.status==='pending'||m.candidateCommitState==='provisional'));
   if(!c)throw new Error('The active conversation store is full. Archive an inactive conversation first. No generation was started.');
   return structuredClone(c);
  });
  if(!snapshot)return;
  const body=JSON.stringify(snapshot),id=`conversation_${archiveHash(JSON.stringify([chat,character,owner,snapshot.id]))}_${archiveHash(body)}`;
  await verifiedRetention(h,id,{version:1,kind:'conversation',owner,chatId:chat,characterId:character,conversation:snapshot},user);
  await h.withStateLock(h.stateKey(chat,character),async()=>{
   const s=await h.loadState(chat,character,user),d=datingFor(s,owner);
   if(s.pocketPersonaActorId!==owner||JSON.stringify(s.conversations.find(c=>c.id===snapshot.id))!==body)throw new Error('The conversation changed during archival. Its messages were kept.');
   d.authoringArchives||=[];if(!d.authoringArchives.some(a=>a.id===id))d.authoringArchives.push({id,jobId:snapshot.id,kind:'conversation',createdAt:h.nowIso()});
   s.conversations=s.conversations.filter(c=>c.id!==snapshot.id);await h.saveState(s,user);
  });
 }
}
/** Copy-and-verify precedes replacement. No archive migration ever generates or rerolls a person. */
export async function archivePreviousAuthoring(h:ArchiveHost,chat:string,character:string,owner:string,user?:string,check:()=>void=()=>{},replaceIf?:(job:NonNullable<ReturnType<typeof datingFor>['discoveryJob']>,kind:'discoveryJob'|'draftJob')=>boolean) {
 for(const kind of ['discoveryJob','draftJob'] as const){
  for(let attempt=0;attempt<3;attempt++){
   check();
   const snapshot=await h.withStateLock(h.stateKey(chat,character),async()=>{
    check();const s=await h.loadState(chat,character,user);if(s.pocketPersonaActorId!==owner)throw new Error('The phone owner changed. Saved drafts were kept.');
    const job=datingFor(s,owner)[kind];return job&&(job.planSchema!==POPULATION_SCHEMA||replaceIf?.(job,kind))?structuredClone(job):undefined;
   });
   if(!snapshot)break;
   if(!h.writeAuthoringArchive||!h.readAuthoringArchive)throw new Error('Private authoring archive storage is unavailable. Existing drafts were kept; no model request was made.');
   const body=JSON.stringify(snapshot),id=`authoring_${archiveHash(JSON.stringify([chat,character,owner]))}_${snapshot.id}_${archiveHash(body)}`;
   const archive={version:1,owner,chatId:chat,characterId:character,kind,job:snapshot};
   await h.writeAuthoringArchive(id,archive,user);
   if(JSON.stringify(await h.readAuthoringArchive(id,user))!==JSON.stringify(archive))throw new Error('The authoring archive could not be verified. Existing drafts were kept.');
   let replaced=false;
   await h.withStateLock(h.stateKey(chat,character),async()=>{
    check();const s=await h.loadState(chat,character,user),d=datingFor(s,owner);
    if(s.pocketPersonaActorId!==owner)return;
    const matches=JSON.stringify(d[kind])===body;
    d.authoringArchives||=[];
    if(!d.authoringArchives.some(a=>a.id===id))d.authoringArchives.push({id,jobId:snapshot.id,createdAt:h.nowIso(),kind});
    if(matches){if(d.creationTelemetry)creationDisposition(d.creationTelemetry,snapshot.id,'abandoned');delete d[kind];}await h.saveState(s,user);replaced=matches;
   });
   if(replaced)break;
   if(attempt===2)throw new Error('The unfinished job changed during archival. Saved work was kept; retry after editing finishes.');
  }
 }
}
