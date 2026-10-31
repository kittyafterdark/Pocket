// Individual selected values; no vocabulary/catalog evaluation.
export type AdultPreferenceState='opt_in'|'opt_out'|'opt_for_now'|'unknown'|'private_not_shared';
export const ADULT_PREFERENCE_STATES:readonly [AdultPreferenceState,string][]=[['unknown','Unknown'],['opt_in','Interested'],['opt_for_now','Interested for now'],['opt_out','Not interested'],['private_not_shared','In-character secret · do not disclose']];
export interface AdultPreferences {version:1;terms:Record<string,AdultPreferenceState>;species:Record<string,AdultPreferenceState>;}
const validKey=(s:string)=>/^[a-z][a-z0-9_]{0,99}$/.test(s)&&!['constructor','prototype','__proto__'].includes(s);
export function normalizeAdultPreferences(raw:any):AdultPreferences|undefined {
 if(raw===undefined)return undefined;if(raw?.version!==1||!raw.terms||!raw.species||typeof raw.terms!=='object'||typeof raw.species!=='object'||Array.isArray(raw.terms)||Array.isArray(raw.species)||JSON.stringify(raw).length>80000)return undefined;
 const rows=(v:any,max:number)=>{const entries=Object.entries(v);if(entries.length>max||entries.some(([id,state])=>!validKey(id)||!ADULT_PREFERENCE_STATES.some(([s])=>s===state)))return undefined;return Object.fromEntries(entries) as Record<string,AdultPreferenceState>;};
 const terms=rows(raw.terms,500),species=rows(raw.species,400);return terms&&species?{version:1,terms,species}:undefined;
}
export function assertAdultPreferences(raw:any):void {if(raw!==undefined&&!normalizeAdultPreferences(raw))throw new Error('Review invalid private preference states before saving. Existing preferences were kept.');}
