/** Bounded numeric diagnostics only. No messages, identities, URLs or model payloads. */
export interface PerformanceSample {count:number;totalMs:number;maxMs:number;lastMs:number;units:number;}
export class PerformanceLedger {
 private scopes=new Map<string,Map<string,PerformanceSample>>();
 record(scope:string,stage:string,ms:number,units=0){if(!Number.isFinite(ms)||ms<0)return;let entries=this.scopes.get(scope);if(!entries){entries=new Map();this.scopes.set(scope,entries);if(this.scopes.size>32)this.scopes.delete(this.scopes.keys().next().value!);}const previous=entries.get(stage)||{count:0,totalMs:0,maxMs:0,lastMs:0,units:0};if(!entries.has(stage)&&entries.size>=64)entries.delete(entries.keys().next().value!);entries.set(stage,{count:previous.count+1,totalMs:previous.totalMs+ms,maxMs:Math.max(previous.maxMs,ms),lastMs:ms,units:previous.units+Math.max(0,units)});}
 snapshot(scope:string){return Object.fromEntries([...this.scopes.get(scope)||[]].map(([key,value])=>[key,{...value}]));}
}
export const backendPerformance=new PerformanceLedger();
export const frontendPerformance=new PerformanceLedger();
export const performanceNow=()=>globalThis.performance?.now()??Date.now();
export function numericPerformanceSnapshot(v:unknown):Record<string,PerformanceSample>{const result:Record<string,PerformanceSample>={};if(!v||typeof v!=='object')return result;for(const [key,value] of Object.entries(v).slice(0,64)){if(!/^[a-zA-Z0-9_.:-]{1,80}$/.test(key)||!value||typeof value!=='object')continue;const fields=['count','totalMs','maxMs','lastMs','units'] as const;if(fields.every(k=>typeof value[k]==='number'&&Number.isFinite(value[k])&&value[k]>=0))result[key]=Object.fromEntries(fields.map(k=>[k,value[k]])) as unknown as PerformanceSample;}return result;}
