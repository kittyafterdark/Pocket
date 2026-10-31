import type {DatingState} from './lumistry.js';
import {DATING_OPTIONS} from './lumistry-options.js';
import {SPECIES_CATALOG} from './lumistry-species.js';
import {ADULT_PREFERENCES,preferenceEligible} from './lumistry-adult-preferences.js';
import {extraWorldOptions,speciesCompatible} from './lumistry-world-catalog.js';
import {worldDefaults} from './lumistry-world-core.js';
import {allowedTheme} from './lumistry-experience-preferences.js';
import {wishlistKeys,wishlistChoices,type WishlistFeeling} from './lumistry-wishlist.js';
export interface WishlistEntry {value:string;label:string;group:string;active:boolean;reason?:string;swatch?:string;}
export const APPEARANCE_CHOICES={skinTone:DATING_OPTIONS.skinTone,hairTexture:DATING_OPTIONS.hairTexture,eyeColor:DATING_OPTIONS.eyeColor};
const colors=['#f1d5cb','#e9c8b2','#e2b58c','#c79570','#ab8b61','#aa794f','#926b50','#754b35','#593b2c','#38271f'];
export function wishlistCatalog(d:DatingState,key:string):WishlistEntry[]{
 const world=d.populationWorld||worldDefaults('modern');
 if(key==='species')return [...SPECIES_CATALOG,...(d.worldGuide?.species||[]).filter(s=>!SPECIES_CATALOG.some(c=>c.id===s.id))].map(s=>({value:s.label,label:s.label,group:s.group||s.family,active:!!d.worldGuide?.species.some(v=>v.id===s.id)&&speciesCompatible(s,world),reason:'Not enabled in the reviewed world. Change World & people to enable it.'}));
 if(key==='kinks')return [...new Map([...DATING_OPTIONS.kinks.map(value=>({value,label:value,group:'General',active:!d.experiencePreferences||d.experiencePreferences.text!=='nonsexual'&&!d.experiencePreferences.paused,reason:'Paused by your content preferences.'})),...ADULT_PREFERENCES.map(t=>({value:t.label,label:t.label,group:t.category,active:preferenceEligible(t,world)&&(!d.experiencePreferences||allowedTheme(t,d.experiencePreferences,world)),reason:'Unavailable under the reviewed world or content preferences.'}))].map(e=>[e.value,e])).values()];
 if(Object.hasOwn(APPEARANCE_CHOICES,key))return APPEARANCE_CHOICES[key as keyof typeof APPEARANCE_CHOICES].map((value,i)=>({value,label:value,group:'Appearance',active:key!=='skinTone'||(d.worldGuide?d.worldGuide.species.some(s=>s.id==='human'):['modern','historical'].includes(world.kind)),reason:'Human complexion choices are inactive without a compatible human population.',...(key==='skinTone'?{swatch:colors[i]}:{})}));
 const extra=extraWorldOptions(d),options=Object.hasOwn(extra,key)?extra[key]:Object.hasOwn(DATING_OPTIONS,key)?DATING_OPTIONS[key]:[];
 return options.map(value=>({value,label:value,group:d.worldFields.some(w=>w.key===key)?'World':'General',active:true}));
}
/** Only reviewed unavailability becomes inactive. Unknown legacy vocabulary still needs review. */
export function wishlistAvailable(d:DatingState,key:string,value:string):boolean {
 const entry=wishlistCatalog(d,key).find(e=>e.value.toLowerCase()===value.toLowerCase());return entry?.active!==false;
}
export function activeWishlistFilters(d:DatingState):DatingState['filters'] {
 const f=d.filters;if(!f.traits)return f;
 const result=structuredClone(f);
 for(const key of wishlistKeys(f)){
  const availability=new Map(wishlistCatalog(d,key).map(e=>[e.value.toLowerCase(),e.active]));const available=(v:string)=>availability.get(v.toLowerCase())!==false;
  const field=result.fields[key];if(field?.mode!=='any'&&field?.value) {const values=field.value.split(',').map(v=>v.trim()).filter(v=>available(v));result.fields[key]={mode:values.length?field.mode:'any',value:values.join(', ')};}
  if(result.excludedValues?.[key])result.excludedValues[key]=result.excludedValues[key].filter(v=>available(v));
  if(result.traits?.choices[key])result.traits.choices[key]=Object.fromEntries(Object.entries(result.traits.choices[key]).filter(([v])=>available(v)));
 }return result;
}
export function inactiveWishlist(d:DatingState,f=d.filters){return wishlistKeys(f).flatMap(key=>{const entries=new Map(wishlistCatalog(d,key).map(e=>[e.value,e.active]));return wishlistChoices(f,key).filter(c=>entries.get(c.value)===false).map(c=>({key,...c}));});}
export const wishlistLabels:Record<string,string>={parenthood:'Current parenthood',childrenPlans:'Plans for children',temperament:'Personality',gender:'Who',intentions:'Connections',orientation:'Their orientation',sugarRole:'Their sugar role',skinTone:'Skin tone',hairTexture:'Hair texture',eyeColor:'Eye colour',bodyType:'Build',occupation:'Work',interests:'Interests',preferences:'Connection style',species:'Species',children:'Children',relationshipStatus:'Relationship status',monogamy:'Relationship style',sexualRole:'Partner roles',sexualInterests:'Adult connection',kinks:'Adult interests',libido:'Libido',drinking:'Drinking',smoking:'Smoking',religion:'Beliefs',boundaries:'Their boundaries',dealbreakers:'Their dealbreakers',height:'Height'};
export const wishlistLabel=(key:string)=>(Object.hasOwn(wishlistLabels,key)?wishlistLabels[key]:undefined)||key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,s=>s.toUpperCase());
