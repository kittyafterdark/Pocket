import {emptyCreationTelemetry,normalizeCreationTelemetry,type CreationTelemetry} from './lumistry-creation-telemetry.js';
import {normalizeUsageTotals,type UsageTotals} from './reliability.js';
export interface MeasurementBaseline {startedAt:string;telemetry:CreationTelemetry;accounting:UsageTotals;}
export interface MeasurementArchive {id:string;createdAt:string;calls:number;input:number;output:number;}
export function normalizeMeasurementBaseline(v:any):MeasurementBaseline|undefined {
 return typeof v?.startedAt==='string'?{startedAt:v.startedAt,telemetry:normalizeCreationTelemetry(v.telemetry),accounting:normalizeUsageTotals(v.accounting)}:undefined;
}
export const subtractUsage=(current:UsageTotals,baseline?:UsageTotals):UsageTotals=>Object.fromEntries(Object.entries(current).map(([k,v])=>[k,Math.max(0,v-((baseline as any)?.[k]||0))])) as unknown as UsageTotals;
/** A fresh comparison view; lifetime receipts, budgets and candidate provenance remain authoritative. */
export function measurementTelemetry(current:CreationTelemetry,baseline?:MeasurementBaseline):CreationTelemetry {
 if(!baseline)return current;
 const out=emptyCreationTelemetry(),seen=new Set(baseline.telemetry.receipts);out.receipts=current.receipts.filter(id=>!seen.has(id));
 for(const [id,c] of Object.entries(current.candidates)){
  const old=baseline.telemetry.candidates[id],copy=structuredClone(c);copy.stages={};copy.carryIn=!!old;
  for(const [task,s] of Object.entries(c.stages)){
   const previous=old?.stages[task],delta=structuredClone(s);delta.usage=subtractUsage(s.usage,previous?.usage);delta.repairUsage=subtractUsage(s.repairUsage,previous?.repairUsage);
   for(const k of Object.keys(s).filter(k=>k!=='usage'&&k!=='repairUsage'&&k!=='promptSections'&&k!=='repairOperations'))(delta as any)[k]=Math.max(0,(s as any)[k]-((previous as any)?.[k]||0));
   for(const key of ['promptSections','repairOperations'] as const)if(s[key])delta[key]=Object.fromEntries(Object.entries(s[key]!).map(([k,v])=>[k,Math.max(0,v-(previous?.[key]?.[k]||0))]));
   if(delta.usage.calls)copy.stages[task]=delta;
  }
  const newlyPublished=c.status==='published'&&old?.status!=='published';
  if(Object.keys(copy.stages).length||newlyPublished){if(old?.status==='published')copy.status='unfinished';out.candidates[id]=copy;}
 }
 return out;
}
