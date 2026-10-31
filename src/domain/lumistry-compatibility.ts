import {softValues,preferenceWeight} from './lumistry-wishlist.js';
import {activeWishlistFilters} from './lumistry-wishlist-catalog.js';
import {selectedValue} from './lumistry-persona.js';
import {DATING_OPTIONS} from './lumistry-options.js';
import type {DatingProfile,DatingState} from './lumistry.js';
export const COMPATIBILITY_POLICY='compatibility-1';
export type SugarRole='receive support'|'provide support'|'either';
export interface ConnectionRequirements {version:1;sugarRole?:SugarRole;parenthood?:'no children'|'have children';childrenPlans?:'want children'|'do not want children'|'open to children';partnerRoles?:string[];excludedPartnerValues?:Record<string,string[]>;}
export function connectionRequirements(v:any):ConnectionRequirements|undefined {
 if(v?.version!==1)return;
 return {version:1,...(['receive support','provide support','either'].includes(v.sugarRole)?{sugarRole:v.sugarRole}:{}),...(['no children','have children'].includes(v.parenthood)?{parenthood:v.parenthood}:{}),...(['want children','do not want children','open to children'].includes(v.childrenPlans)?{childrenPlans:v.childrenPlans}:{}),...(Array.isArray(v.partnerRoles)?{partnerRoles:[...new Set<string>(v.partnerRoles.filter((x:any)=>DATING_OPTIONS.sexualRole.includes(x)))].slice(0,6)}:{}),...(v.excludedPartnerValues&&typeof v.excludedPartnerValues==='object'&&!Array.isArray(v.excludedPartnerValues)?{excludedPartnerValues:Object.fromEntries(Object.entries(v.excludedPartnerValues).filter(([k])=>Object.hasOwn(DATING_OPTIONS,k)).slice(0,20).map(([k,x])=>[k,Array.isArray(x)?x.filter(v=>typeof v==='string'&&v.length<=80).slice(0,20):[]]))}:{})};
}
export const canonicalFilterValue=(key:string,value:string)=>selectedValue(key,value,true);
export const values=(key:string,value:string)=>canonicalFilterValue(key,value).split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const canonical=(p:DatingProfile,key:string)=>{const privateValue=values(key,p.privateFields?.[key]||''),allowed=DATING_OPTIONS[key];return privateValue.length&&allowed&&privateValue.every(v=>allowed.includes(v))?privateValue:values(key,p.fields[key]||'');};
export function ownSugarRole(p:DatingProfile|null):SugarRole|undefined {
 if(!p)return;const explicit=canonical(p,'sugarRole');for(const v of explicit)if(['receive support','provide support','either'].includes(v))return v as SugarRole;
 // Only explicit role names establish direction. A job, gender, income or general kink does not.
 const source=[p.privateFields?.sugarRole,p.privateFields?.intentions,p.fields.intentions,p.privateFields?.preferences].filter(Boolean).join('; ');
 const statements=source.split(/[;\n]/).map(s=>s.trim());
 const receive=statements.some(s=>/^(?:(?:I am|I'm) (?:a )?)?sugar[ -]?baby(?:[.!]|$)/i.test(s)||/^(?:I want to|I am looking to|I seek to) receive financial support[.!]?$/i.test(s));
 const provide=statements.some(s=>/^(?:(?:I am|I'm) (?:a )?)?sugar[ -]?(?:daddy|momm?y|parent|provider)(?:[.!]|$)/i.test(s)||/^(?:I want to|I am looking to|I seek to) provide financial support[.!]?$/i.test(s));
 return receive&&provide?'either':receive?'receive support':provide?'provide support':undefined;
}
export function romanticDiscovery(d:Pick<DatingState,'filters'>):boolean {
 const f=d.filters.fields.intentions;const soft=softValues(d.filters,'intentions','prefer');if((!f||f.mode==='any')&&soft.length)return !soft.every(v=>v==='friendship');return !(f&&f.mode!=='any'&&values('intentions',f.value).length&&values('intentions',f.value).every(v=>v==='friendship'));
}
/** Only clear supported cases. Conditions such as asexual/demisexual never identify target genders. */
export function attractionAllows(person:DatingProfile,target:DatingProfile):boolean|undefined {
 const explicit=values('gender',person.privateFields?.romanticAttractedGenders||person.privateFields?.attractedGenders||'');
 const orientation=canonical(person,'orientation'),gender=canonical(person,'gender'),other=canonical(target,'gender');
 if(!other.length||other.some(g=>!['woman','man'].includes(g)))return;
 if(explicit.length&&explicit.every(v=>DATING_OPTIONS.gender.includes(v)))return other.some(g=>explicit.includes(g));
 if(orientation.some(o=>['bisexual','pansexual'].includes(o)))return true;
 if(orientation.includes('lesbian'))return other.includes('woman');
 if(orientation.includes('straight')&&gender.length===1&&['woman','man'].includes(gender[0]))return !other.includes(gender[0]);
 if(orientation.includes('gay')&&gender.length===1&&['woman','man'].includes(gender[0]))return other.includes(gender[0]);
 return;
}
export function connectionBlockers(p:DatingProfile,d:Pick<DatingState,'self'|'filters'>):string[] {
 const result:string[]=[],self=d.self,req=d.filters.connection;
 if(romanticDiscovery(d)){
  if(self&&(attractionAllows(p,self)===false||attractionAllows(self,p)===false))result.push('attraction');
  const status=canonical(p,'relationshipStatus'),style=canonical(p,'monogamy');
  if(status.some(s=>['married','partnered'].includes(s))&&style.includes('monogamous')&&!style.some(s=>['polyamorous','nonmonogamous','open relationship'].includes(s)))result.push('availability');
 }
 const sugar=values('intentions',d.filters.fields.intentions?.mode!=='any'?d.filters.fields.intentions?.value||'':'').includes('sugar relationship')||softValues(d.filters,'intentions','prefer').includes('sugar relationship');
 if(sugar&&values('intentions',p.fields.intentions||'').includes('sugar relationship')){const mine=req?.sugarRole||ownSugarRole(self),theirs=ownSugarRole(p);if(mine&&mine!=='either'&&theirs&&theirs!=='either'&&mine===theirs)result.push('sugar-role');}
 if(req?.parenthood&&!values('children',p.hiddenFields.includes('children')?'':p.fields.children||'').includes(req.parenthood))result.push('parenthood');
 if(req?.childrenPlans&&!values('children',p.hiddenFields.includes('children')?'':p.fields.children||'').includes(req.childrenPlans))result.push('children-plans');
 if(req?.partnerRoles?.length&&!values('sexualRole',p.hiddenFields.includes('sexualRole')?'':p.fields.sexualRole||'').some(r=>req.partnerRoles!.includes(r)))result.push('partner-role');
 for(const [key,excluded] of Object.entries(req?.excludedPartnerValues||{}))if(!p.hiddenFields.includes(key)&&values(key,p.fields[key]||'').some(v=>excluded.some(x=>values(key,x).includes(v))))result.push('partner-exclusion');
 return result;
}
/** Engine-only dependency; never copy this private context into an NPC's public/known Persona summary. */
export function compatibilitySnapshot(d:Pick<DatingState,'self'|'filters'>):string {
 const s=d.self;return JSON.stringify([COMPATIBILITY_POLICY,d.filters.connection,s&&{age:s.age,gender:canonical(s,'gender'),orientation:canonical(s,'orientation'),sugar:ownSugarRole(s),preferences:s.privateFields?.preferences,attraction:s.person?.life.attraction,intimacy:s.person?.intimacy,adultPreferences:s.adultPreferences,explicitAttraction:{romantic:s.privateFields?.romanticAttractedGenders,sexual:s.privateFields?.sexualAttractedGenders,genders:s.privateFields?.attractedGenders},commitments:s.privateFields?.commitments,fields:s.fields,hidden:s.hiddenFields}]);
}
export function compatibilityFingerprint(d:Pick<DatingState,'self'|'filters'>):string {return contextDigest(compatibilitySnapshot(d));}
function contextDigest(text:string):string {let a=2166136261,b=333555777;for(const c of text){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b^c.charCodeAt(0),16777619);}return `${text.length}:${(a>>>0).toString(16)}:${(b>>>0).toString(16)}`;}
export function interestContext(d:Pick<DatingState,'self'|'filters'>):string {
 // Small deterministic fingerprint, with full native snapshots still protecting in-flight work.
 const text=JSON.stringify([d.self&&{alias:d.self.alias,age:d.self.age,bio:d.self.bio,fields:Object.fromEntries(Object.entries(d.self.fields).filter(([k])=>!d.self!.hiddenFields.includes(k)))},compatibilitySnapshot(d)]);return contextDigest(text);
}
export function currentPriorLike(p:DatingProfile,d:Pick<DatingState,'self'|'filters'>):boolean {
 return p.interest?.status==='matched'&&p.interest.seen===true&&p.interest.context===interestContext(d)&&!connectionBlockers(p,d).length;
}
export const isSpeciesFilter=(d:Pick<DatingState,'worldFields'>,key:string)=>key==='species'||['ancestry','race'].includes(key)&&!d.worldFields.some(w=>w.key===key);
export function validateReviewedRequirements(d:DatingState,additional:Record<string,string[]>={}):string|undefined {
 d={...d,filters:activeWishlistFilters(d)};
 const extra={...Object.fromEntries(d.worldFields.map(f=>[f.key,f.options])),...additional};
 for(const [key,f] of Object.entries(d.filters.fields)){
  if(f.mode==='any'||!f.value.trim())continue;
  if(isSpeciesFilter(d,key)){
   if(!d.worldGuide?.species.length&&f.mode==='required')return 'Review an enabled species palette before requiring '+key+'. Saved choices are kept; no model request was made.';
   continue;
  }
  const allowed=extra[key]||DATING_OPTIONS[key];
  if(!allowed)return 'Review saved '+key+' choices against the current world vocabulary before generating. Saved values are kept.';
  if(key!=='height'&&values(key,f.value).some(v=>!allowed.some(a=>values(key,a).includes(v))))return 'Review unsupported '+key+' choices before generating. Saved values are kept.';
 }
}
/** Joint feasible alternatives are selected locally before any prose; private facts need not be public badges. */
export function planConnectionFacts(d:DatingState,alternatives:(key:string)=>string[],random:()=>number,manual=false):Record<string,string>{
 const pool=(key:string,fallback:string[])=>{const f=d.filters.fields[key];const a=f?.mode==='required'?alternatives(key):fallback;return [...new Set(a)].filter(v=>!(d.filters.excludedValues?.[key]||[]).some(x=>values(key,x).includes(v.toLowerCase())));};
 const choose=(input:Record<string,string|undefined>[])=>{
  const choices=input.map(c=>Object.fromEntries(Object.entries(c).filter(([,v])=>typeof v==='string')) as Record<string,string>);
  if(!choices.length)throw new Error('No compatible combination of attraction, relationship roles and required choices remains. Review preferences; no model request was made.');
  const weight=(c:Record<string,string>)=>Object.entries(c).reduce((n,[key,value])=>n*preferenceWeight(d.filters,key,value),1);
  let draw=Math.min(.999999999,Math.max(0,random()))*choices.reduce((n,c)=>n+weight(c),0);for(const c of choices){draw-=weight(c);if(draw<0)return c;}return choices.at(-1)!;
 };
 const req=d.filters.connection,fields:Record<string,string>={};
 const children=pool('children',['']),parenthood=pool('parenthood',req?.parenthood?[req.parenthood]:['']),childrenPlans=pool('childrenPlans',req?.childrenPlans?[req.childrenPlans]:['']);
 const combinations:Record<string,string>[]=[];for(const child of children)for(const parent of parenthood)for(const future of childrenPlans){const all=[...new Set([child,parent,future,req?.parenthood,req?.childrenPlans].filter((v):v is string=>!!v))];if(all.includes('no children')&&all.includes('have children')||all.includes('want children')&&all.includes('do not want children'))continue;combinations.push({...all.length?{children:all.join(', ')}:{},...(parent?{parenthood:parent}:{}),...(future?{childrenPlans:future}:{})});}Object.assign(fields,choose(combinations));
 const roles=pool('sexualRole',req?.partnerRoles?.length?req.partnerRoles:['']).filter(r=>!req?.partnerRoles?.length||req.partnerRoles.includes(r));Object.assign(fields,choose(roles.map(r=>r?{sexualRole:r}:{})));
 const intentions=pool('intentions',d.filters.fields.intentions?.mode==='preferred'||softValues(d.filters,'intentions','prefer').length?DATING_OPTIONS.intentions:['']);Object.assign(fields,choose(intentions.map(v=>v?{intentions:v}:{})));
 const sugar=values('intentions',fields.intentions||'').includes('sugar relationship'),mine=req?.sugarRole||ownSugarRole(d.self);
 const sugarChoices=pool('sugarRole',sugar&&mine&&mine!=='either'?[mine==='receive support'?'provide support':'receive support']:['']).filter(v=>!sugar||!mine||mine==='either'||!v||v==='either'||v!==mine);
 Object.assign(fields,choose(sugarChoices.map(v=>v?{sugarRole:v}:{})));
 const needsAttractionPlan=!manual&&!!d.self&&(canonical(d.self,'gender').length>0||canonical(d.self,'orientation').length>0)||d.filters.fields.gender?.mode==='required'||d.filters.fields.orientation?.mode==='required';
 const genders=pool('gender',DATING_OPTIONS.gender.filter(g=>!['prefer not to say','self-described'].includes(g))),orientations=pool('orientation',DATING_OPTIONS.orientation.filter(o=>!['prefer not to say','self-described'].includes(o)));
 const pairs:Record<string,string>[]=[];for(const gender of needsAttractionPlan?genders:[''])for(const orientation of needsAttractionPlan?orientations:['']){const f={...fields,...(gender?{gender}:{}),...(orientation?{orientation}:{})};if(!connectionBlockers({fields:f,privateFields:{},hiddenFields:[]} as unknown as DatingProfile,d).length)pairs.push(f);}Object.assign(fields,choose(pairs));
 const status=pool('relationshipStatus',['']),style=pool('monogamy',['']),commitments:Record<string,string>[]=[];for(const relationshipStatus of status)for(const monogamy of style){const f={...fields,...(relationshipStatus?{relationshipStatus}:{}),...(monogamy?{monogamy}:{})};if(!connectionBlockers({fields:f,privateFields:{},hiddenFields:[]} as unknown as DatingProfile,d).length)commitments.push(f);}return choose(commitments);
}
