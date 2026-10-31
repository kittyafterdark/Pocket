import {emptyUsageTotals,normalizeUsageTotals,recordUsage,type UsageTotals} from './reliability.js';
export const normalizeByteSections=(v:any):Record<string,number>=>Object.fromEntries(Object.entries(v||{}).filter(([k,n])=>/^[a-zA-Z][a-zA-Z0-9_.-]{0,99}$/.test(k)&&typeof n==='number'&&Number.isFinite(n)&&n>=0)) as Record<string,number>;
export interface CreationStageTotals {validationReported:number;validResponses:number;invalidResponses:number;sectionReported:number;promptSections?:Record<string,number>;repairOperations?:Record<string,number>;usage:UsageTotals;repairUsage:UsageTotals;interrupted:number;firstPass:number;firstPassAccepted:number;repairs:number;repairsAccepted:number;photoRecords:number;cachedInput:number;cachedReported:number;latencyMs:number;}
export interface CandidateTelemetry {carryIn?:boolean;planId:string;jobId:string;slotId:string;status:'unfinished'|'published'|'abandoned'|'review';startedAt:string;publishedAt?:string;stages:Record<string,CreationStageTotals>;}
export interface CreationTelemetry {version:1;receipts:string[];candidates:Record<string,CandidateTelemetry>;}
export const emptyCreationTelemetry=():CreationTelemetry=>({version:1,receipts:[],candidates:{}});
const stage=():CreationStageTotals=>({validationReported:0,validResponses:0,invalidResponses:0,sectionReported:0,usage:emptyUsageTotals(),repairUsage:emptyUsageTotals(),interrupted:0,firstPass:0,firstPassAccepted:0,repairs:0,repairsAccepted:0,photoRecords:0,cachedInput:0,cachedReported:0,latencyMs:0});
export function normalizeCreationTelemetry(v:any):CreationTelemetry {
 const out=emptyCreationTelemetry();if(v?.version!==1)return out;
 out.receipts=[...new Set((Array.isArray(v.receipts)?v.receipts:[]).filter((s:any)=>typeof s==='string'&&s.length<=300))] as string[];
 for(const [key,c] of Object.entries(v.candidates||{}) as [string,any][]){
  if(!c||typeof c.planId!=='string'||typeof c.jobId!=='string'||typeof c.slotId!=='string')continue;
  const stages:CandidateTelemetry['stages']={};for(const [task,s] of Object.entries(c.stages||{}) as [string,any][]){if(!['dossier','index','public','photos'].includes(task))continue;const n=stage();n.usage=normalizeUsageTotals(s.usage);n.repairUsage=normalizeUsageTotals(s.repairUsage);if(s.promptSections)n.promptSections=normalizeByteSections(s.promptSections);if(s.repairOperations)n.repairOperations=normalizeByteSections(s.repairOperations);for(const k of Object.keys(n).filter(k=>k!=='usage'&&k!=='repairUsage'&&k!=='promptSections'&&k!=='repairOperations'))(n as any)[k]=typeof s[k]==='number'&&Number.isFinite(s[k])?Math.max(0,s[k]):0;stages[task]=n;}
  out.candidates[key]={planId:c.planId,jobId:c.jobId,slotId:c.slotId,status:['published','abandoned','review'].includes(c.status)?c.status:'unfinished',startedAt:String(c.startedAt||''),publishedAt:typeof c.publishedAt==='string'?c.publishedAt:undefined,stages};
 }
 return out;
}
const receiptSets=new WeakMap<CreationTelemetry,{length:number;ids:Set<string>}>();
/** Durable request identity deduplication outlives both UI history windows. Unknown usage remains uncovered. */
export function recordCreation(t:CreationTelemetry,identity:{jobId:string;slotId:string;planId?:string;startedAt:string},m:any):boolean {
 if(!m.requestId)throw new Error('A creation request requires its reserved receipt identity.');
 let seen=receiptSets.get(t);if(!seen||seen.length!==t.receipts.length){seen={length:t.receipts.length,ids:new Set(t.receipts)};receiptSets.set(t,seen);}
 if(seen.ids.has(m.requestId))return false;
 t.receipts.push(m.requestId);seen.ids.add(m.requestId);seen.length=t.receipts.length;const id=identity.planId||`${identity.jobId}:${identity.slotId}`;
 const c=t.candidates[id]||={...identity,planId:id,status:'unfinished',stages:{}};
 const s=c.stages[m.task]||=stage();recordUsage(s.usage,m);if(m.interrupted)s.interrupted++;if(m.repair){recordUsage(s.repairUsage,m);s.repairs++;if(m.checkpoint)s.repairsAccepted++;}else{s.firstPass++;if(m.checkpoint)s.firstPassAccepted++;}
 if(typeof m.invalid==='number'){s.validationReported++;if(m.invalid)s.invalidResponses++;else s.validResponses++;}
 if(m.promptSections){s.sectionReported++;s.promptSections||={};for(const [k,v] of Object.entries(normalizeByteSections(m.promptSections)))s.promptSections[k]=(s.promptSections[k]||0)+v;}
 if(m.repairOperation){s.repairOperations||={};s.repairOperations[m.repairOperation]=(s.repairOperations[m.repairOperation]||0)+1;}
 s.photoRecords+=m.savedUnits||0;if(m.cachedTokens!==undefined){s.cachedReported++;s.cachedInput+=m.cachedTokens;}s.latencyMs+=m.latencyMs||0;return true;
}
export function creationDisposition(t:CreationTelemetry,jobId:string,status:CandidateTelemetry['status'],at?:string,slotId?:string){for(const c of Object.values(t.candidates))if(c.jobId===jobId&&(!slotId||c.slotId===slotId)&&c.status==='unfinished'){c.status=status;if(status==='published')c.publishedAt=at;}}
export function creationSummary(t:CreationTelemetry){
 const candidates=Object.values(t.candidates),stages=candidates.flatMap(c=>Object.values(c.stages)),usage=emptyUsageTotals();
 for(const s of stages)for(const k of Object.keys(usage) as (keyof UsageTotals)[])usage[k]+=s.usage[k];
 const published=candidates.filter(c=>c.status==='published'),publishedStages=published.flatMap(c=>Object.values(c.stages)),photoCalls=candidates.reduce((n,c)=>n+(c.stages.photos?.usage.calls||0),0);return {usage,validationReported:stages.reduce((n,s)=>n+s.validationReported,0),validResponses:stages.reduce((n,s)=>n+s.validResponses,0),invalidResponses:stages.reduce((n,s)=>n+s.invalidResponses,0),sectionReported:stages.reduce((n,s)=>n+s.sectionReported,0),interrupted:stages.reduce((n,s)=>n+s.interrupted,0),repairUsage:stages.reduce((t,s)=>{for(const k of Object.keys(t) as (keyof UsageTotals)[])t[k]+=s.repairUsage[k];return t;},emptyUsageTotals()),firstPass:stages.reduce((n,s)=>n+s.firstPass,0),firstPassAccepted:stages.reduce((n,s)=>n+s.firstPassAccepted,0),repairs:stages.reduce((n,s)=>n+s.repairs,0),repairsAccepted:stages.reduce((n,s)=>n+s.repairsAccepted,0),photoCalls,tokensPerPublished:published.length&&!published.some(c=>c.carryIn)&&publishedStages.every(s=>s.usage.calls===s.usage.reported)?publishedStages.reduce((n,s)=>n+s.usage.input+s.usage.output,0)/published.length:undefined,published:published.length,unfinished:candidates.filter(c=>c.status==='unfinished').length,abandoned:candidates.filter(c=>c.status==='abandoned').length,cachedReported:stages.reduce((n,s)=>n+s.cachedReported,0),cachedInput:stages.reduce((n,s)=>n+s.cachedInput,0),photoRecords:stages.reduce((n,s)=>n+s.photoRecords,0),callsPerPublished:published.length&&!published.some(c=>c.carryIn)?published.reduce((n,c)=>n+Object.values(c.stages).reduce((n,s)=>n+s.usage.calls,0),0)/published.length:undefined};
}
