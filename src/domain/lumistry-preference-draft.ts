import {normalizeAdultPreferences,type AdultPreferences,type AdultPreferenceState} from './lumistry-adult-preferences-core.js';
export type PreferenceKind='terms'|'species';
export const emptyPreferences=():AdultPreferences=>({version:1,terms:{},species:{}});
export function preferenceSignature(raw:AdultPreferences|undefined):string {
 const p=normalizeAdultPreferences(raw)||emptyPreferences();
 return JSON.stringify(['terms','species'].map(k=>Object.entries(p[k as PreferenceKind]).sort(([a],[b])=>a<b?-1:a>b?1:0)));
}
export interface PreferenceDraft {
 views?:Partial<Record<PreferenceKind,{search:string;shown:number;category:string;picked?:number}>>;
 scope:string;kind:PreferenceKind;selecting?:boolean;baseline:string;value:AdultPreferences;
 undo:Array<AdultPreferences>;selected:string[];search:string;category:string;state:string;world:string;page:number;review:boolean;
}
export function makePreferenceDraft(scope:string,kind:PreferenceKind,raw?:AdultPreferences):PreferenceDraft {
 return {scope,kind,baseline:preferenceSignature(raw),value:structuredClone(raw||emptyPreferences()),undo:[],selected:[],search:'',category:'',state:'',world:'',page:0,review:false};
}
export const preferenceDraftDirty=(d:PreferenceDraft)=>preferenceSignature(d.value)!==d.baseline;
export function assignPreferences(d:PreferenceDraft,ids:readonly string[],state:AdultPreferenceState|''):void {
 const previous=structuredClone(d.value);for(const id of ids){if(state)d.value[d.kind][id]=state;else delete d.value[d.kind][id];}
 if(preferenceSignature(previous)!==preferenceSignature(d.value)){d.undo.push(previous);if(d.undo.length>20)d.undo.shift();}d.review=false;
}
export function preferenceChanges(d:PreferenceDraft):Array<{id:string;before:string;after:string}> {
 const [terms,species]=JSON.parse(d.baseline) as Array<Array<[string,string]>>;
 const before=Object.fromEntries(d.kind==='terms'?terms:species),after=d.value[d.kind];
 return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(id=>before[id]!==after[id]).map(id=>({id,before:before[id]||'',after:after[id]||''}));
}
export function setPreference(d:PreferenceDraft,kind:PreferenceKind,id:string,state:AdultPreferenceState|''):void {
 const previous=structuredClone(d.value);if(state)d.value[kind][id]=state;else delete d.value[kind][id];
 if(preferenceSignature(previous)!==preferenceSignature(d.value)){d.undo.push(previous);if(d.undo.length>20)d.undo.shift();}d.review=false;
}
export function allPreferenceChanges(d:PreferenceDraft):Array<{kind:PreferenceKind;id:string;before:string;after:string}> {
 const [terms,species]=JSON.parse(d.baseline) as Array<Array<[string,string]>>,out:Array<{kind:PreferenceKind;id:string;before:string;after:string}>=[];
 for(const [kind,saved] of [['terms',terms],['species',species]] as const){const before=Object.fromEntries(saved),after=d.value[kind];for(const id of new Set([...Object.keys(before),...Object.keys(after)]))if(before[id]!==after[id])out.push({kind,id,before:before[id]||'',after:after[id]||''});}
 return out;
}
