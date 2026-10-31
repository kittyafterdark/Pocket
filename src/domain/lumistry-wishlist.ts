import {heightMatches} from './lumistry-height.js';
import type {DatingState,DatingProfile} from './lumistry.js';
import {selectedValue} from './lumistry-persona.js';
export type WishlistFeeling='prefer'|'open'|'avoid';
export interface WishlistTraits {version:1;allOpen?:string[];choices:Record<string,Record<string,WishlistFeeling>>;}
export type WishlistChoice={value:string;feeling:WishlistFeeling;essential:boolean};
type Filters=DatingState['filters'];
export const wishlistTokens=(s:string)=>s.split(',').map(s=>s.trim()).filter(Boolean);
export function normalizeWishlist(v:any):WishlistTraits|undefined {
 if(v?.version!==1||!v.choices||typeof v.choices!=='object'||Array.isArray(v.choices))return;
 return {version:1,...(Array.isArray(v.allOpen)?{allOpen:[...new Set<string>(v.allOpen.filter((k:any)=>typeof k==='string'&&/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(k)))].slice(0,60)}:{}),choices:Object.fromEntries(Object.entries(v.choices).filter(([k])=>/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(k)).slice(0,60).map(([k,raw])=>[k,Object.fromEntries(Object.entries(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}).filter(([v,f])=>!!v.trim()&&v.length<=160&&['prefer','open','avoid'].includes(f as string)).slice(0,600))]))};
}
export function wishlistChoices(f:Filters,key:string):WishlistChoice[]{
 const map=new Map<string,WishlistChoice>(),field=f.fields[key];
 for(const value of field?.mode!=='any'?wishlistTokens(field?.value||''):[])map.set(value,{value,feeling:'prefer',essential:field.mode==='required'});
 for(const [value,feeling] of Object.entries(f.traits?.choices[key]||{}))map.set(value,{value,feeling,essential:false});
 for(const value of f.excludedValues?.[key]||[])map.set(value,{value,feeling:'avoid',essential:true});
 return [...map.values()];
}
/** Migration is staged in the existing draft. Each trait is stored in exactly one location. */
export function migrateWishlist(f:Filters):Filters {
 const next=structuredClone(f);next.traits||={version:1,choices:{}};
 for(const [key,field] of Object.entries(next.fields))if(field.mode==='preferred'){
  next.traits.choices[key]||={};for(const value of wishlistTokens(field.value))if(!Object.hasOwn(next.traits.choices[key],value))next.traits.choices[key][value]='prefer';next.fields[key]={mode:'any',value:''};
 }return next;
}
export function setWishlistChoice(f:Filters,key:string,value:string,feeling:WishlistFeeling|'unspecified',essential=false):void {
 const all=wishlistChoices(f,key).filter(c=>c.value!==value);if(feeling!=='unspecified')all.push({value,feeling,essential:feeling!=='open'&&essential});
 f.traits||={version:1,choices:{}};if(feeling!=='unspecified'&&f.traits.allOpen)f.traits.allOpen=f.traits.allOpen.filter(k=>k!==key);const hard=all.filter(c=>c.essential&&c.feeling==='prefer').map(c=>c.value),excluded=all.filter(c=>c.essential&&c.feeling==='avoid').map(c=>c.value);
 f.fields[key]={mode:hard.length?'required':'any',value:hard.join(', ')};f.traits.choices[key]=Object.fromEntries(all.filter(c=>!c.essential).map(c=>[c.value,c.feeling]));
 if(!Object.keys(f.traits.choices[key]).length)delete f.traits.choices[key];
 f.excludedValues||={};if(excluded.length)f.excludedValues[key]=excluded;else delete f.excludedValues[key];
}
export const wishlistKeys=(f:Filters)=>[...new Set([...Object.keys(f.fields),...Object.keys(f.excludedValues||{}),...Object.keys(f.traits?.choices||{})])];
export const softValues=(f:Filters,key:string,feeling:WishlistFeeling)=>wishlistChoices(f,key).filter(c=>!c.essential&&c.feeling===feeling).map(c=>c.value);
export const preferenceWeight=(f:Filters,key:string,value:string)=>{
 const actual=wishlistTokens(selectedValue(key,value,true)).map(v=>v.toLowerCase());
 return wishlistChoices(f,key).filter(c=>!c.essential&&c.feeling!=='open').reduce((n,c)=>actual.some(v=>wishlistTokens(selectedValue(key,c.value,true)).map(x=>x.toLowerCase()).includes(v))?n*(c.feeling==='prefer'?3:.3):n,1);
};
export function wishlistGuidance(f:Filters){
 return Object.fromEntries(wishlistKeys(f).flatMap(k=>{const prefer=softValues(f,k,'prefer').slice(0,8),avoid=softValues(f,k,'avoid').slice(0,8);return prefer.length||avoid.length?[[k,{prefer,avoid}]]:[];}));
}
export function wishlistValidation(v:any):string|undefined {
 if(v===undefined)return;
 const normalized=normalizeWishlist(v);
 if(!normalized||Object.keys(v).some(k=>!['version','choices','allOpen'].includes(k))||JSON.stringify(v).length>100000||Object.keys(v.choices).length>60)return 'The wishlist is invalid or too large. Your saved preferences were kept.';
 if(v.allOpen!==undefined&&(!Array.isArray(v.allOpen)||JSON.stringify(v.allOpen)!==JSON.stringify(normalized.allOpen)))return 'Review open-to-all categories.';
 for(const [k,raw] of Object.entries(v.choices))if(!Object.hasOwn(normalized.choices,k)||!raw||typeof raw!=='object'||Array.isArray(raw)||Object.entries(raw).some(([value,feeling])=>normalized.choices[k][value]!==feeling))return 'Review the saved wishlist choices before saving.';
}
export function traitMatches(actual:string,wanted:string,key:string):boolean {
 if(key==='height')return heightMatches(actual,wanted);
 const a=wishlistTokens(selectedValue(key,actual,true)).map(v=>v.toLowerCase());return wishlistTokens(selectedValue(key,wanted,true)).some(v=>a.includes(v.toLowerCase()));
}
