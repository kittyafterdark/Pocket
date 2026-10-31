import {parseLumistryRequest} from '../protocol/lumistry.js';
/** Trusted document ownership comes only from the native callback, never a payload field. */
export class FrontendOperations {
 private requests=new Map<string,{session:string;controller:AbortController;settled:boolean;closed:boolean}>();
 private key(user:string|undefined,request:string){return JSON.stringify([user||'_default',request]);}
 async run<T>(user:string|undefined,session:string,request:string,work:(signal:AbortSignal)=>Promise<T>):Promise<T> {
  const key=this.key(user,request),old=this.requests.get(key);
  if(old)throw new Error('This operation is already owned by another request.');
  const entry={session,controller:new AbortController(),settled:false,closed:false};this.requests.set(key,entry);
  try{return await work(entry.controller.signal);}finally{entry.settled=true;this.trim();}
 }
 destination(user:string|undefined,request:string):{session:string;closed:boolean}|undefined {const e=this.requests.get(this.key(user,request));return e?{session:e.session,closed:e.closed}:undefined;}
 invalidate(user:string|undefined,session:string,except?:string){for(const [key,e] of this.requests){const [owner,request]=JSON.parse(key);if(owner===(user||'_default')&&e.session===session&&request!==except){e.closed=true;e.controller.abort();}}}
 close(user:string|undefined,session:string){for(const [key,e] of this.requests){if(JSON.parse(key)[0]===(user||'_default')&&e.session===session){e.closed=true;e.controller.abort();}}this.trim();}
 private trim(){if(this.requests.size<=512)return;for(const [key,e] of this.requests){if(e.settled)this.requests.delete(key);if(this.requests.size<=512)break;}}
}
export interface FrontendEnvelope {type:string;requestId?:string;chatId?:string;characterId?:string;action?:string;}
export function frontendEnvelope(value:unknown):FrontendEnvelope|undefined {
 if(!value||typeof value!=='object'||Array.isArray(value))return;
 const v=value as Record<string,unknown>;
 if(typeof v.type!=='string'||!v.type.startsWith('lumiphone:')||v.type.length>120)return;
 for(const key of ['requestId','chatId','characterId','conversationId','deviceOwnerActorId'])if(v[key]!==undefined&&(typeof v[key]!=='string'||(v[key] as string).length>180))throw new Error('Invalid operation scope.');
 if(v.type==='lumiphone:dating')parseLumistryRequest(v);
 return v as unknown as FrontendEnvelope;
}
