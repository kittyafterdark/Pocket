import {normalizeClientException} from '../domain/lumistry-client-diagnostic.js';
import {backendPerformance,performanceNow} from '../domain/performance.js';
import {normalizeReliabilityDiagnostic} from '../domain/reliability.js';

export const DIAGNOSTIC_LIMIT=1000;
const str=(v:unknown)=>typeof v==='string'?v.replace(/[^a-zA-Z0-9_.:/ -]/g,'').slice(0,180):undefined;
const numbers=['latencyMs','promptCharacters','promptBytes','outputBytes','requestedMaxTokens','promptTokens','completionTokens','totalTokens','reasoningTokens','cachedTokens','streamEvents','answerBytesObserved','reasoningEvents','firstAnswerMs','lastActivityMs','attempts'];
export function generationDiagnostic(r:any) {
 return {...Object.fromEntries(['appScope','requestId','task','status','startedAt','completedAt','model','provider','connectionId','reasoningSource','transport','finishReason','usageStatus'].flatMap(k=>typeof r?.[k]==='string'?[[k,str(r[k])]]:[])),
  ...Object.fromEntries(numbers.flatMap(k=>typeof r?.[k]==='number'&&Number.isFinite(r[k])&&r[k]>=0?[[k,r[k]]]:[])),diagnostic:normalizeReliabilityDiagnostic(r?.diagnostic)};
}
export function errorCode(v:unknown):string {
 const text=typeof v==='string'?v:v instanceof Error?v.message:'';
 return /timeout|timed out|did not finish/i.test(text)?'timeout':/permission|revoked|enable .*permission/i.test(text)?'permission':/output.*limit|reasoning.*tokens/i.test(text)?'output-limit':/JSON|parse/i.test(text)?'parse':/changed|stale|removed/i.test(text)?'stale-context':/storage|checkpoint|persist/i.test(text)?'storage':'operation-failed';
}
export function diagnosticEvent(payload:any,now:string):any|undefined {
 if(!payload||typeof payload!=='object')return;
 const run=payload.run;
 if(payload.appScope!=='lumistry'&&run?.appScope!=='lumistry'&&!run?.task?.startsWith('lumistry-')&&!payload.type?.startsWith('lumiphone:dating'))return;
 const base={at:now,requestId:str(payload.requestId),chatId:str(payload.chatId),characterId:str(payload.characterId),conversationId:str(payload.conversationId),operation:str(payload.operation||payload.type)};
 if(payload.type==='lumiphone:generation_status'&&payload.run)return {...base,id:'generation:'+str(payload.run.requestId),kind:'generation',run:generationDiagnostic(payload.run)};
 if(payload.type==='lumiphone:diagnostic')return {...base,kind:'diagnostic',diagnostic:normalizeReliabilityDiagnostic(payload.diagnostic)};
 if(payload.type==='lumiphone:error'||payload.error||payload.status==='error'||payload.phase==='error')return {...base,kind:'error',code:str(payload.code)||errorCode(payload.error||payload.message),errorName:str(payload.errorName),...(payload.code==='frontend-exception'?{client:normalizeClientException(payload.client)}:{})};
}
const empty=()=>({version:1,totalCaptured:0,dropped:0,events:[] as any[]});
/** Lumistry numeric/typed diagnostics. No prompts, messages, credentials or reasoning text. */
export class PocketDiagnosticJournal {
 private tails=new Map<string,Promise<void>>();
 private pending=new Map<string,any[]>();
 private failures=new Map<string,number>();
 private pendingDropped=new Map<string,number>();
 constructor(private read:(user?:string)=>Promise<any>,private write:(value:unknown,user?:string)=>Promise<unknown>){}
 append(payload:unknown,user?:string):void {
  const event=diagnosticEvent(payload,new Date().toISOString());if(!event)return;
  const key=user||'_default';const pending=this.pending.get(key)||[];pending.push(event);this.pendingDropped.set(key,(this.pendingDropped.get(key)||0)+Math.max(0,pending.length-DIAGNOSTIC_LIMIT));this.pending.set(key,pending.slice(-DIAGNOSTIC_LIMIT));
  const tail=(this.tails.get(key)||Promise.resolve()).then(async()=>{
   const batch=(this.pending.get(key)||[]).slice();if(!batch.length)return;
   try{
    const started=performanceNow(),raw=await this.read(user),state=raw?.version===1?{version:1,totalCaptured:Number(raw.totalCaptured)||0,dropped:Number(raw.dropped)||0,events:Array.isArray(raw.events)?raw.events.slice(-DIAGNOSTIC_LIMIT):[]}:empty();
    for(const event of batch){const i=event.id?state.events.findIndex((e:any)=>e.id===event.id):-1;if(i>=0)state.events[i]=event;else{state.events.push(event);state.totalCaptured++;}}
    state.dropped+=Math.max(0,state.events.length-DIAGNOSTIC_LIMIT);state.events=state.events.slice(-DIAGNOSTIC_LIMIT);
    await this.write(state,user);backendPerformance.record(key,'diagnostics.write',performanceNow()-started,batch.length);const committed=new Set(batch);this.pending.set(key,(this.pending.get(key)||[]).filter(event=>!committed.has(event)));
   }catch{this.failures.set(key,(this.failures.get(key)||0)+1);}
  });
  this.tails.set(key,tail);void tail.finally(()=>{if(this.tails.get(key)===tail)this.tails.delete(key)});
 }
 async snapshot(user?:string):Promise<unknown>{
  const key=user||'_default';await this.tails.get(key);
  try{const state=await this.read(user);return {...(state?.version===1?state:empty()),pending:structuredClone(this.pending.get(key)||[]),writeFailures:this.failures.get(key)||0,retentionLimit:DIAGNOSTIC_LIMIT,pendingDropped:this.pendingDropped.get(key)||0};}
  catch{return {...empty(),available:false,pending:structuredClone(this.pending.get(key)||[]),writeFailures:this.failures.get(key)||0,retentionLimit:DIAGNOSTIC_LIMIT,pendingDropped:this.pendingDropped.get(key)||0};}
 }
}
