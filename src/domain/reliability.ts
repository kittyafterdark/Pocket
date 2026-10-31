export type FailureLayer = 'provider' | 'parse' | 'validation' | 'protected-field' | 'stale-context' | 'storage' | 'ui-sync';
export interface ReliabilityDiagnostic { layer:FailureLayer; code:string; task?:string; recordId?:string; saved:boolean; retryable:boolean; }
export class PocketFailure extends Error {
    constructor(public readonly diagnostic:ReliabilityDiagnostic,message:string) {super(message);this.name='PocketFailure';}
}
/** Diagnostic codes are application-owned. Never copy provider text, reasoning or credentials. */
export function classifyFailure(error:unknown):ReliabilityDiagnostic {
    if(error instanceof PocketFailure)return {...error.diagnostic};
    const e=error as any;
    if(e?.name==='AbortError')return {layer:'stale-context',code:'cancelled',saved:false,retryable:false};
    if(e?.name==='StructuredOutputError')return {layer:e.details?.answerBytes===0?'provider':e.details?.code==='task-envelope'?'validation':'parse',code:e.details?.code||e.kind||'invalid-response',saved:false,retryable:!['reasoning-exhausted','output-exhausted','refused'].includes(e.details?.code)};
    if(Array.isArray(e?.issues))return {layer:e.issues.some((x:any)=>x.code==='locked-field'||x.code==='companion-identity')?'protected-field':'validation',code:e.issues[0]?.code||'invalid-authoring',saved:false,retryable:true};
    return {layer:'provider',code:'request-failed',saved:false,retryable:true};
}
/** Auxiliary work may retry once, but can never turn a durable success into a rejected operation. */
export async function auxiliary(work:()=>Promise<unknown>,report:(diagnostic:ReliabilityDiagnostic)=>void=()=>{},layer:'storage'|'ui-sync'='ui-sync'):Promise<boolean> {
    for(let attempt=0;attempt<2;attempt++)try{await work();return true;}catch{if(attempt)try{report({layer,code:layer==='storage'?'history-write-failed':'refresh-deferred',saved:true,retryable:true});}catch{}}
    return false;
}
export interface UsageTotals { calls:number; reported:number; input:number; output:number; reasoning:number; failures:number; }
export const emptyUsageTotals=():UsageTotals=>({calls:0,reported:0,input:0,output:0,reasoning:0,failures:0});
export function normalizeUsageTotals(v:any):UsageTotals {return Object.fromEntries(Object.keys(emptyUsageTotals()).map(k=>[k,typeof v?.[k]==='number'&&Number.isFinite(v[k])&&v[k]>=0?v[k]:0])) as unknown as UsageTotals;}
export function recordUsage(total:UsageTotals,m:{promptTokens?:number;completionTokens?:number;reasoningTokens?:number;invalid?:number}) {
    total.calls++;if(m.promptTokens!==undefined&&m.completionTokens!==undefined){total.reported++;total.input+=m.promptTokens;total.output+=m.completionTokens;}
    total.reasoning+=m.reasoningTokens||0;total.failures+=m.invalid?1:0;
}
export function normalizeReliabilityDiagnostic(v:any):ReliabilityDiagnostic|undefined {
    if(!v||!['provider','parse','validation','protected-field','stale-context','storage','ui-sync'].includes(v.layer)||typeof v.code!=='string')return;
    return {layer:v.layer,code:v.code.slice(0,80),saved:v.saved===true,retryable:v.retryable===true,task:typeof v.task==='string'?v.task.slice(0,40):undefined,recordId:typeof v.recordId==='string'?v.recordId.slice(0,80):undefined};
}
