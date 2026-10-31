import {activeWishlistFilters} from './lumistry-wishlist-catalog.js';
import {wishlistValidation,wishlistKeys,wishlistChoices,softValues,traitMatches} from './lumistry-wishlist.js';
import {canonicalFilterValue,connectionBlockers,connectionRequirements,isSpeciesFilter} from './lumistry-compatibility.js';
import {hasKnownDistance,profileSettingKey,reviewedSettingKey} from './lumistry-location.js';
import {heightAlternatives} from './lumistry-height.js';
import type {DatingProfile,DatingState} from './lumistry.js';
import {heightMatches} from './lumistry-height.js';
export type DatingFilters=DatingState['filters'];
export const INTENTION_PRESETS:Record<string,readonly string[]>={
 'Broad dating':['long-term relationship','life partner','short-term dating','casual dating','friends first'],
 'Long-term':['long-term relationship','life partner'],'Casual':['short-term dating','casual dating'],
 'Friendship':['friendship'],'Sugar relationship':['sugar relationship'],
};
export function normalizeExclusions(v:any):Record<string,string[]>|undefined {
 if(!v||typeof v!=='object'||Array.isArray(v))return undefined;
 const entries=Object.entries(v).slice(0,40).flatMap(([key,raw])=>/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key)&&Array.isArray(raw)?[[key,[...new Set(raw.filter((x:unknown)=>typeof x==='string'&&x.trim()&&x.trim().length<=80).map((x:string)=>x.trim()))].slice(0,20)]]:[]).filter(([,values])=>(values as string[]).length);
 return entries.length?Object.fromEntries(entries):undefined;
}
const unknownDisclosure=(v:string)=>/^(?:unknown|not[ _]established|undisclosed|prefer not to say|discuss privately|prefer to discuss privately)[.!]?$/i.test(v.trim());
export function excludedValue(f:DatingFilters,key:string,actual:string):boolean {
 const wanted=Object.hasOwn(f.excludedValues||{},key)?f.excludedValues![key]:[];actual=filterTokens(canonicalFilterValue(key,actual)).filter(v=>!unknownDisclosure(v)).join(', ');return wanted.some(value=>key==='height'?heightMatches(actual,value):filterTokens(actual.toLowerCase()).includes(canonicalFilterValue(key,value).toLowerCase()));
}
export function requiredAlternatives(f:DatingFilters,key:string):string[] {
 const value=canonicalFilterValue(key,f.fields[key]?.value||'');return (key==='height'?heightAlternatives(value):filterTokens(value)).filter(v=>!excludedValue(f,key,v));
}
function disclosedFilterValue(p:DatingProfile,key:string,scope?:DatingState):string {
 if(['parenthood','childrenPlans'].includes(key)&&!Object.hasOwn(p.fields,key)&&!p.hiddenFields.includes('children')){const relevant=key==='parenthood'?['no children','have children']:['want children','do not want children','open to children','undecided'];return filterTokens(p.fields.children||'').filter(v=>relevant.includes(v)).join(', ');}
 const aliases=scope&&isSpeciesFilter(scope,key)?['species','ancestry','race'].filter(k=>isSpeciesFilter(scope,k)):[key];
 return aliases.filter(k=>!p.hiddenFields.includes(k)).map(k=>Object.hasOwn(p.fields,k)?p.fields[k]||'':'').filter(Boolean).join(', ');
}
export function excludedProfileKeys(p:DatingProfile,f:DatingFilters,scope?:DatingState):string[] {
 return Object.keys(f.excludedValues||{}).filter(key=>excludedValue(f,key,disclosedFilterValue(p,key,scope)));
}
export const filterTokens=(s:string)=>s.split(',').map(v=>v.trim()).filter(Boolean);
/** Storage equality protects dormant/legacy values too; meaning equality avoids no-op job invalidation. */
export function filterSignature(f:DatingFilters,meaning=false):string {
 const mode=f.distanceMode==='setting'?'setting':'radius';
 const extras=mode==='setting'||Object.keys(f.excludedValues||{}).length?[[mode,mode==='setting'?f.settingKey||'':meaning?undefined:f.maxKm],Object.entries(f.excludedValues||{}).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,meaning?[...new Set(v.map(s=>s.toLowerCase()))].sort():v])]:[];
 const soft=wishlistKeys(f).map(k=>[k,wishlistChoices(f,k).filter(c=>!c.essential&&c.feeling!=='open').map(c=>[canonicalFilterValue(k,c.value).toLowerCase(),c.feeling]).sort(([a],[b])=>a.localeCompare(b))] as const).filter(([,choices])=>choices.length).sort(([a],[b])=>a.localeCompare(b));
 const fields=Object.entries(f.fields).filter(([,v])=>!meaning||v.mode==='required'&&v.value.trim()).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,v.mode,meaning?[...new Set(filterTokens(canonicalFilterValue(k,v.value)).map(x=>x.toLowerCase()))].sort():v.value]);
 return JSON.stringify([...(meaning?(soft.length?[soft]:[]):f.traits?[f.traits]:[]),...(f.connection?[connectionRequirements(f.connection)]:[]),f.minAge,f.maxAge,meaning&&mode==='setting'?null:f.maxKm,fields,...extras]);
}
export function inspectFilterFit(p:DatingProfile,f:DatingFilters,scope?:DatingState,resolved=false) {
 if(!resolved&&scope&&f.traits)f=activeWishlistFilters({...scope,filters:f});
 const blockers:Array<{kind:'age'|'distance'|'setting'|'excluded'|'required'|'undisclosed'|'connection';key?:string}>=[];
 if(!Number.isInteger(p.age)||p.age<18||p.age<f.minAge||p.age>f.maxAge)blockers.push({kind:'age'});
 const current=scope?reviewedSettingKey(scope):undefined;
 if(current&&profileSettingKey(p)&&profileSettingKey(p)!==current)blockers.push({kind:'setting'});
 if(f.distanceMode==='setting'){if(!f.settingKey||scope&&current!==f.settingKey||profileSettingKey(p)!==f.settingKey)blockers.push({kind:'setting'});}else if(!hasKnownDistance(p)||p.distanceKm>f.maxKm)blockers.push({kind:'distance'});
 if(scope)for(const _reason of connectionBlockers(p,{...scope,filters:f}))blockers.push({kind:'connection'});
 for(const key of excludedProfileKeys(p,f,scope))blockers.push({kind:'excluded',key});
 let score=0;
 for(const [key,field] of Object.entries(f.fields)){
  if(field.mode==='any'||!field.value.trim())continue;
  const actual=disclosedFilterValue(p,key,scope);
  const wanted=filterTokens(canonicalFilterValue(key,field.value).toLowerCase());
  const matched=key==='height'?heightMatches(actual,field.value):filterTokens(canonicalFilterValue(key,actual).toLowerCase()).some(v=>wanted.includes(v));
  if(matched)score++;
  else if(field.mode==='required')blockers.push({kind:actual?'required':'undisclosed',key});
 }
 for(const key of wishlistKeys(f)){const actual=disclosedFilterValue(p,key,scope);if(actual){if(Object.entries(f.traits?.choices[key]||{}).some(([v,feeling])=>feeling==='prefer'&&traitMatches(actual,v,key)))score++;if(Object.entries(f.traits?.choices[key]||{}).some(([v,feeling])=>feeling==='avoid'&&traitMatches(actual,v,key)))score--;}}
 return {eligible:!blockers.length,score:blockers.length?0:score,blockers};
}
export function filterPreview(d:DatingState,f:DatingFilters){
 const unseen=d.profiles.filter(p=>!d.tools?.blocked.includes(p.id)&&!d.decisions.some(x=>x.profileId===p.id));
 const active=f.traits?activeWishlistFilters({...d,filters:f}):f;const checks=unseen.map(p=>inspectFilterFit(p,active,d,true));
 const eligible=checks.filter(c=>c.eligible).length;
 // Counts describe blockers; counterfactual recovery includes every remaining constraint.
 const reasons=(['age','distance','setting','excluded','required','undisclosed','connection'] as const).map(kind=>({kind,
  blocked:checks.filter(c=>c.blockers.some(b=>b.kind===kind)).length,
  recoverable:checks.filter(c=>c.blockers.length&&c.blockers.every(b=>b.kind===kind)).length}));
 return {eligible,unseen:unseen.length,reasons};
}
export function validateFilterDraft(f:DatingFilters):string|undefined{
 if(!f||typeof f!=='object'||Array.isArray(f)||!f.fields||typeof f.fields!=='object'||Array.isArray(f.fields))return 'Choose valid filter categories.';
 const wishlistProblem=wishlistValidation(f.traits);if(wishlistProblem)return wishlistProblem;
 if(f.traits&&Object.keys(f.traits.choices).some(k=>Object.keys(f.traits!.choices[k]).some(v=>f.fields[k]?.mode!=='any'&&filterTokens(f.fields[k]?.value||'').includes(v)||f.excludedValues?.[k]?.includes(v))))return 'A trait cannot be both a soft preference and an essential rule.';
 if(f.connection!==undefined&&(!connectionRequirements(f.connection)||JSON.stringify(f.connection).length>8000||Object.keys(f.connection).some(k=>!['version','sugarRole','parenthood','childrenPlans','partnerRoles','excludedPartnerValues'].includes(k))||Object.entries(f.connection).some(([k,v])=>JSON.stringify((connectionRequirements(f.connection) as any)?.[k])!==JSON.stringify(v))))return 'Review the connection-role and partner requirements before saving.';
 if(!Number.isInteger(f.minAge)||!Number.isInteger(f.maxAge)||f.minAge<18||f.maxAge<f.minAge||f.maxAge>9999)return 'Choose an adult age range from 18 to 9999.';
 if(!Number.isFinite(f.maxKm)||f.maxKm<0||f.maxKm>100000)return 'Distance must be between 0 and 100000 km.';
 if(f.distanceMode!==undefined&&f.distanceMode!=='radius'&&f.distanceMode!=='setting')return 'Choose a supported distance mode.';
 if(f.distanceMode==='setting'&&!/^setting_[a-f0-9]{16}$/.test(f.settingKey||''))return 'Review a world in Settings before choosing Anywhere in this setting.';
 if(f.excludedValues!==undefined){if(!f.excludedValues||typeof f.excludedValues!=='object'||Array.isArray(f.excludedValues)||Object.keys(f.excludedValues).length>40||JSON.stringify(f.excludedValues).length>8000)return 'Exclusions are invalid or too large.';for(const [key,values] of Object.entries(f.excludedValues))if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key)||!Array.isArray(values)||values.length>20||values.some(v=>typeof v!=='string'||!v.trim()||v.length>80||unknownDisclosure(v)))return 'Choose up to 20 excluded values per category, each up to 80 characters.';}
 for(const [key,v] of Object.entries(f.fields))if(v?.mode==='required'&&typeof v.value==='string'&&v.value.trim()&&!requiredAlternatives(f,key).length)return 'All required '+key+' choices are also excluded. Change one of these selections.';
 if(Object.keys(f.fields).length>60)return 'There are too many saved filter categories. Clear an unused legacy category before adding another.';
 for(const v of Object.values(f.fields))if(!v||!['any','preferred','required'].includes(v.mode)||typeof v.value!=='string'||v.value.length>64000)return 'A filter value is invalid or exceeds its supported size.';
 return undefined;
}

export function validateSettingFilter(f:DatingFilters,d:DatingState):string|undefined {return f.distanceMode==='setting'&&f.settingKey!==reviewedSettingKey(d)?'The reviewed setting changed. Reopen Filters and select Anywhere in this setting again.':undefined;}
