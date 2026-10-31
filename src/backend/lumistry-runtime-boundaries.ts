import type {PhoneState} from '../types.js';
/** Current-schema reads remain fresh under the caller's lock; host reconciliation is a separate boundary. */
export async function readTransactionState(raw:unknown,version:number,normalize:(raw:any,name:string)=>PhoneState,reconcile:()=>Promise<PhoneState>):Promise<PhoneState>{
 if(raw&&typeof raw==='object'&&Number((raw as any).version)>version)throw new Error('This phone state was created by a newer Pocket version.');
 const v=raw as any;
 if(!v||v.version!==version||v.settings!==undefined||v.actorMemoryVersion<1||typeof v.characterName!=='string')return reconcile();
 return normalize(v,v.characterName);
}
export function eligiblePromotionContacts(state:PhoneState,ids?:Set<string>){
 const d=state.lumistry?.[state.pocketPersonaActorId];if(!d)return [];
 const generated=new Set(d.profiles.filter(p=>p.id.startsWith('dating_npc_')).map(p=>p.contactId)),exchanged=new Set(d.decisions.filter(x=>x.exchanged).map(x=>d.profiles.find(p=>p.id===x.profileId)?.contactId));
 return state.contacts.filter(c=>(!ids||ids.has(c.id))&&generated.has(c.id)&&c.source.kind==='npc'&&!c.source.bankId&&(c.presence.inScene||exchanged.has(c.id)));
}
/** In-memory pending work is reconstructed from durable qualification facts after recovery. */
export class PromotionQueue {
 private pending=new WeakMap<PhoneState,Set<string>>();private recovered=new Set<string>();
 mark(state:PhoneState,id:string){let ids=this.pending.get(state);if(!ids)this.pending.set(state,ids=new Set());ids.add(id);}
 recovery(state:PhoneState,key:string){if(this.recovered.has(key))return;const contacts=eligiblePromotionContacts(state);for(const c of contacts)this.mark(state,c.id);if(!contacts.length)this.complete(state,key);}
 candidates(state:PhoneState){const ids=this.pending.get(state);return ids?.size?eligiblePromotionContacts(state,ids):[];}
 complete(state:PhoneState,key:string){this.pending.delete(state);this.recovered.add(key);if(this.recovered.size>64)this.recovered.delete(this.recovered.values().next().value!);}
}

/** A dating-only event is permitted only if every other persisted domain matches the last full snapshot. */
export function discoveryProjectionCore(state:PhoneState):string {return JSON.stringify({...state,updatedAt:undefined,storageRevision:undefined,lumistry:Object.fromEntries(Object.entries(state.lumistry||{}).filter(([owner])=>owner!==state.pocketPersonaActorId))});}
