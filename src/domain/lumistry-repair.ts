import {isUnknown,type AuthoringIssue} from './lumistry-authoring-contract.js';
export const REPAIR_POLICY_VERSION='repair-policy-2';
export type RepairOperation='local'|'extract'|'author'|'rewrite'|'photo'|'blocked'|'resume';
export type CreationTask='dossier'|'index'|'public'|'photos';
export interface RepairPlan {version:1;operation:RepairOperation;task:CreationTask;labels:string[];codes:string[];}
/** Shared source relationships for both evidence projection and authority decisions. */
const sources:Record<string,string[]>={
 'Public alias':['Name and dating alias'],'Pronouns':['Gender and pronouns'],'Exact adult age':['Age and life stage'],
 'Actual orientation':['Actual orientation and attraction'],'Existing commitments':['Existing relationship and commitments'],
 'Dating intentions':['Reason for joining and intentions'],'Personal limits':['Personal comfort and consent'],
};
const categories:Record<string,string>={occupation:'Occupation or role',gender:'Gender and pronouns',height:'Height and build',orientation:'Actual orientation and attraction',relationshipStatus:'Existing relationship and commitments',intentions:'Reason for joining and intentions',interests:'Likes, dislikes and minor pleasures',bodyType:'Height and build',pronouns:'Gender and pronouns'};
export const sourceLabelsFor=(label:string)=>[label,...(sources[label]||[]),...(label.startsWith('Category ')?[categories[label.slice(9)]||label]:[])];
/** Repair authority is explicit when supplied by validation; otherwise evidence decides.
 * Missing authored facts/choices cannot be invented by an evidence-only organizer. */
export function planRepair(task:CreationTask,issues:AuthoringIssue[],labels:string[],fields:Record<string,string>={},newPerson=true):RepairPlan {
 const wanted=[...new Set([...labels,...issues.flatMap(i=>i.labels)])];
 const operations=issues.map(i=>i.repair).filter(Boolean);
 let operation:RepairOperation;
 if(operations.includes('blocked'))operation='blocked';
 else if(operations.includes('resume'))operation='resume';
 else if(operations.includes('author'))operation=newPerson?'author':'blocked';
 else if(task==='photos')operation='photo';
 else if(task==='public')operation='rewrite';
 else if(!wanted.length)operation='local';
 else operation=wanted.every(label=>sourceLabelsFor(label).some(l=>!isUnknown(fields[l]||'')))?'extract':newPerson?'author':'blocked';
 return {version:1,operation,task:operation==='author'?'dossier':operation==='extract'?'index':task,labels:wanted,codes:[...new Set(issues.map(i=>i.code))]};
}
export const aliasKey=(alias:string)=>alias.normalize('NFKC').trim().toLowerCase();
export function aliasCollision(alias:string,aliases:string[]):AuthoringIssue|undefined {
 return alias&&aliases.some(a=>aliasKey(a)===aliasKey(alias))?{code:'alias-collision',message:'Public alias: already exists',labels:['Public alias'],repair:'author',layer:'validation'}:undefined;
}
/** Owner-scoped reservations reuse existing drafts, never another actor/alias store. */
export function reservedAliases(data:any,jobId:string,slotId:string):string[] {
 return [...(data.profiles||[]).map((p:any)=>p.alias),...[data.discoveryJob,data.draftJob].filter(Boolean).flatMap((j:any)=>[
  ...(j.id!==jobId&&j.reviewDraft?[j.reviewDraft.alias]:[]),
  ...j.slots.filter((s:any)=>!(j.id===jobId&&s.id===slotId)&&s.status!=='saved'&&s.progress?.stage!=='identity'&&s.progress?.draft?.alias).map((s:any)=>s.progress.draft.alias)
 ])].filter((s):s is string=>typeof s==='string'&&!!s.trim());
}
export function normalizeRepairPlan(v:any):RepairPlan|undefined {
 return v?.version===1&&['local','extract','author','rewrite','photo','blocked','resume'].includes(v.operation)&&['dossier','index','public','photos'].includes(v.task)?{version:1,operation:v.operation,task:v.task,labels:Array.isArray(v.labels)?v.labels.filter((x:any)=>typeof x==='string').slice(0,100):[],codes:Array.isArray(v.codes)?v.codes.filter((x:any)=>typeof x==='string').slice(0,60):[]}:undefined;
}
