import {normalizeAuthoringIssues,type AuthoringIssue} from './lumistry-authoring-contract.js';
/** Private, last-attempt evidence. These are extension messages BEFORE the
 * native host's provider adaptation, never hidden reasoning or credentials. */
export interface CreationAttemptTrace {
    schema:'lumistry-replay-1';
    reservationId:string;
    requestId?:string;
    planId:string;
    stage:string;
    revision:string;
    prefixSha256:string;
    messages?:Array<{role:'system'|'user';content:string}>;
    responseText?:string;
    outcome:'reserved'|'provider-failed'|'parse-failed'|'validated';
    issues:AuthoringIssue[];
    omitted?:true;
}
export function normalizeCreationTrace(v:any):CreationAttemptTrace|undefined {
    if(v?.schema!=='lumistry-replay-1'||!['reserved','provider-failed','parse-failed','validated'].includes(v.outcome)||typeof v.reservationId!=='string')return;
    const messages=Array.isArray(v.messages)&&v.messages.length<=2&&v.messages.every((m:any)=>['system','user'].includes(m?.role)&&typeof m.content==='string')&&JSON.stringify(v.messages).length<=64000?v.messages.map((m:any)=>({role:m.role,content:m.content})):undefined;
    return {schema:'lumistry-replay-1',reservationId:v.reservationId.slice(0,180),requestId:typeof v.requestId==='string'?v.requestId.slice(0,180):undefined,planId:typeof v.planId==='string'?v.planId.slice(0,180):'',stage:typeof v.stage==='string'?v.stage.slice(0,30):'',revision:typeof v.revision==='string'?v.revision.slice(0,80):'',prefixSha256:typeof v.prefixSha256==='string'?v.prefixSha256.slice(0,64):'',messages,responseText:typeof v.responseText==='string'&&v.responseText.length<=64000?v.responseText:undefined,outcome:v.outcome,issues:normalizeAuthoringIssues(v.issues),omitted:v.omitted===true||v.messages&&!messages||typeof v.responseText==='string'&&v.responseText.length>64000?true:undefined};
}
export function retainCreationTrace(progress:any,trace:CreationAttemptTrace) {
    const normalized=normalizeCreationTrace(trace)!;
    const size=JSON.stringify({...progress,lastAttempt:normalized}).length;
    progress.lastAttempt=size<=890000?normalized:{...normalized,messages:undefined,responseText:undefined,omitted:true};
}
