import {attachDiscoveryRun,discoveryRun,type DiscoveryRunReceipt} from './lumistry-run-receipts.js';
/** Bounded volatile authoring receipts bridge a transient checkpoint write failure.
 * No provider reasoning/raw payloads are retained. Receipts are removed after durable checkpointing. */
const pending=new Map<string,{expires:number;value:{content:string;finish_reason?:string;usage?:unknown;receipt?:DiscoveryRunReceipt};bytes:number}>();
const owners=new WeakMap<object,string>();
const MAX_BYTES=2_000_000;
function prune(){let bytes=0;for(const [key,entry] of pending){if(entry.expires<Date.now())pending.delete(key);else bytes+=entry.bytes;}while(bytes>MAX_BYTES||pending.size>24){const first=pending.entries().next().value;if(!first)break;bytes-=first[1].bytes;pending.delete(first[0]);}}
export async function pendingKey(scope:string,request:unknown):Promise<string>{const bytes=new TextEncoder().encode(JSON.stringify(request));const digest=await crypto.subtle.digest('SHA-256',bytes);return scope+':'+[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function readPending(key:string):any|undefined{prune();const entry=pending.get(key);if(!entry)return;const result=structuredClone(entry.value);owners.set(result,key);if(result.receipt)attachDiscoveryRun(result,result.receipt);return result;}
export function keepPending(key:string,result:any){if(typeof result?.content!=='string'||result.content.length>128000)return;const u=result.usage;const value={receipt:discoveryRun(result),content:result.content,finish_reason:result.finish_reason,usage:u?{prompt_tokens:u.prompt_tokens,completion_tokens:u.completion_tokens,total_tokens:u.total_tokens,prompt_tokens_details:{cached_tokens:u.cached_tokens??u.prompt_tokens_details?.cached_tokens},reasoning_tokens:u.reasoning_tokens??u.completion_tokens_details?.reasoning_tokens}:undefined};const bytes=JSON.stringify(value).length;pending.set(key,{value:structuredClone(value),bytes,expires:Date.now()+600000});owners.set(result,key);prune();}
export function forwardPendingReceipt(from:object,to:object){const key=owners.get(from);if(key)owners.set(to,key);const receipt=discoveryRun(from);if(receipt)attachDiscoveryRun(to,receipt);}
export function acknowledgeGenerationReceipt(result:unknown){if(result&&typeof result==='object'){const key=owners.get(result);if(key)pending.delete(key);}}
