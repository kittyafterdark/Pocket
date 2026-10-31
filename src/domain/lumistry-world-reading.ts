import {DATING_OPTIONS} from './lumistry-options.js';
/** World extraction reads a larger source once; only its reviewed summary reaches creation. */
export const WORLD_READING_LIMITS={description:30000,scenario:20000,personality:10000,recentMessages:24,recentMessage:2000,context:12000,outputTokens:12000,reviewCharacters:256000} as const;
const bounded=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
export function worldCharacterEvidence(character:any) {
 return {name:character?.name,description:bounded(character?.description,WORLD_READING_LIMITS.description),scenario:bounded(character?.scenario,WORLD_READING_LIMITS.scenario),personality:bounded(character?.personality,WORLD_READING_LIMITS.personality)};
}
export function worldRecentEvidence(messages:readonly {role:unknown;content:unknown}[]) {
 return messages.slice(-WORLD_READING_LIMITS.recentMessages).map(m=>({role:m.role,content:bounded(m.content,WORLD_READING_LIMITS.recentMessage)}));
}

import {WORLD_CAPABILITIES,normalizePopulationWorld,type PopulationWorld} from './lumistry-world-core.js';
import {emptyWorldGuide,normalizeWorldGuide,SPECIES_BY_ID,speciesDiscovery,assertWorldGuide,WORLD_PRESENTATION_KEYS,type WorldGuide} from './lumistry-world-catalog.js';
export interface WorldSource {id:string;label:string;text:string;originalCharacters:number;includedCharacters:number;truncated:boolean;}
export interface WorldSourceChoice {id:string;label:string;originalCharacters?:number;selected:boolean;reason?:string;}
export interface WorldCoverage {sources:WorldSource[];warnings:string[];availableSources?:WorldSourceChoice[];}
export interface WorldProposal {id:string;kind:'context'|'capability'|'species'|'presentation'|'category'|'kind';key:string;value:string;label:string;options:string[];minAdultAge?:number;evidence:Array<{sourceId:string;quote:string}>;supported:boolean;selected:boolean;}
export interface WorldReview {version:1;baseline:string;fingerprint:string;sourceKey?:string;proposals:WorldProposal[];warnings:string[];coverage:Array<Omit<WorldSource,'text'>>;}
export interface WorldAccepted {worldContext:string;worldFields:Array<{key:string;label:string;options:string[]}>;populationWorld?:PopulationWorld;worldGuide?:WorldGuide;}
export const worldBaseline=(d:WorldAccepted)=>JSON.stringify([d.worldContext,d.worldFields,d.populationWorld,d.worldGuide]);
export function worldSource(id:string,label:string,value:unknown,max:number):WorldSource|undefined {
 if(typeof value!=='string'||!value.trim())return undefined;const full=value.trim();return {id,label,text:full.slice(0,max),originalCharacters:full.length,includedCharacters:Math.min(max,full.length),truncated:full.length>max};
}
export function sourceFingerprint(sources:WorldSource[],baseline:string):string {
 const text=JSON.stringify([baseline,sources.map(s=>[s.id,s.text,s.originalCharacters])]);let a=2166136261,b=2246822507;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b^text.charCodeAt(i),3266489909);}return (a>>>0).toString(16)+(b>>>0).toString(16)+':'+text.length;
}
const short=(v:unknown,max=800)=>typeof v==='string'?v.trim().slice(0,max):'';
export function validateWorldCategories(raw:unknown):Array<{key:string;label:string;options:string[]}> {
 if(!Array.isArray(raw)||raw.length>16||JSON.stringify(raw).length>24000)throw new Error('Use at most 16 setting categories; existing categories were kept.');
 const keys=new Set<string>();
 return raw.map(v=>{const key=short(v?.key,40),label=short(v?.label,60);if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key)||Object.hasOwn(DATING_OPTIONS,key)||keys.has(key.toLowerCase())||!label||!Array.isArray(v.options)||!v.options.length||v.options.length>80||v.options.some((o:unknown)=>typeof o!=='string'||!o.trim()||o.length>80))throw new Error('Review duplicate/invalid setting keys or incomplete options before saving.');keys.add(key.toLowerCase());return {key,label,options:[...new Set(v.options.map((o:string)=>o.trim()))] as string[]};});
}
export function reviewWorldResult(raw:any,bundle:WorldCoverage,d:WorldAccepted):WorldReview {
 const baseline=worldBaseline(d),warnings=[...bundle.warnings],proposals:WorldProposal[]=[];
 const input=Array.isArray(raw?.proposals)?raw.proposals:[];
 if(!input.length&&typeof raw?.worldContext==='string'){
  input.push({kind:'context',value:raw.worldContext});
  for(const category of Array.isArray(raw.worldFields)?raw.worldFields:[])input.push({kind:'category',...category});
  warnings.push('The provider returned legacy suggestions without evidence. Review and select them explicitly.');
 }
 if(input.length>50)warnings.push('Only the first 50 proposals fit this review; additional suggestions were omitted and can be added through the editable catalogs.');
 for(const item of input.slice(0,50)){
  if(typeof item?.key==='string'&&item.key.length>(item.kind==='species'?47:40)||typeof item?.value==='string'&&item.value.length>(item.kind==='context'?WORLD_READING_LIMITS.context:1200)){warnings.push('An oversized suggestion was omitted rather than clipped; accepted settings were kept.');continue;}
  if(Array.isArray(item?.options)&&item.options.length>80)warnings.push('A category had more than 80 options; review the retained options and add any missing values manually.');
  const kind=item?.kind;let key=short(item?.key,item?.kind==='species'?47:40),value=short(item?.value,item?.kind==='context'?WORLD_READING_LIMITS.context:1200),label=short(item?.label,60),options=(Array.isArray(item?.options)?item.options:[]).map((v:unknown)=>short(v,80)).filter(Boolean).slice(0,80);
  const evidence=(Array.isArray(item?.evidence)?item.evidence:[]).slice(0,3).flatMap((e:any)=>{const source=bundle.sources.find(s=>s.id===e?.sourceId),quote=short(e?.quote,240);return source&&quote&&typeof e?.quote==='string'&&e.quote.trim().length<=240&&source.text.includes(quote)?[{sourceId:source.id,quote}]:[];});
  const supported=evidence.length>0&&item.certainty==='supported';
  if(kind==='species'&&key.startsWith('custom_')){const existing=[...SPECIES_BY_ID.values(),...(d.worldGuide?.species||[])].find(s=>[s.id.replaceAll('_',' '),s.label].some(v=>v.toLowerCase()===label.toLowerCase()));if(existing)key=existing.id;}
  const valid=kind==='context'&&value||kind==='capability'&&WORLD_CAPABILITIES.includes(key as any)&&['present','absent'].includes(value)||kind==='species'&&(SPECIES_BY_ID.has(key)||/^custom_[a-z0-9_]{1,40}$/.test(key)&&label&&value)||kind==='presentation'&&WORLD_PRESENTATION_KEYS.includes(key as any)&&value||kind==='kind'&&['modern','historical','fantasy','cyberpunk','spacefaring','custom'].includes(value)||kind==='category'&&!Object.hasOwn(DATING_OPTIONS,key)&&/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key)&&label&&options.length;
  if(!valid){warnings.push('An invalid or incomplete world suggestion was omitted; accepted settings were kept.');continue;}
  if(proposals.some(p=>p.kind===kind&&p.key===key&&p.value===value))continue;
  const prior=kind==='presentation'?d.worldGuide?.[key as keyof WorldGuide]:kind==='kind'&&d.populationWorld?.reviewed===true?d.populationWorld.kind:undefined;
  const changesCapability=kind==='capability'&&d.populationWorld?.reviewed===true&&(d.populationWorld.capabilities.includes(key as any)!==(value==='present'));
  const minAdultAge=Number.isInteger(item.minAdultAge)&&item.minAdultAge>=18&&item.minAdultAge<=9999&&evidence.some((e:{quote:string})=>e.quote.includes(String(item.minAdultAge)))?item.minAdultAge:undefined;
  proposals.push({minAdultAge,id:'world_'+(proposals.length+1),kind,key,value,label,options,evidence,supported,selected:supported&&!(kind==='species'&&speciesDiscovery(d.worldGuide).mode==='strict_reviewed'&&!d.worldGuide?.species.some(s=>s.id===key))&&!changesCapability&&!(kind==='species'&&value==='absent'&&d.worldGuide?.species.some(s=>s.id===key))&&(!prior||prior===value)});
  if(!supported)warnings.push('Some suggestions lack verified supporting excerpts and start unselected.');
 }
 if(!proposals.length){if(Array.isArray(raw?.proposals)&&raw.proposals.length===0)warnings.push('No new world suggestions. Accepted settings were kept; use editable catalogs or add missing evidence if needed.');else throw new Error('No usable world suggestions were returned. Your accepted world was kept.');}
 return {version:1,baseline,fingerprint:sourceFingerprint(bundle.sources,baseline),sourceKey:sourceFingerprint(bundle.sources,''),proposals,warnings:[...new Set(warnings)],coverage:bundle.sources.map(({text,...coverage})=>coverage)};
}
export function applyWorldReview(d:WorldAccepted,r:WorldReview):WorldAccepted {
 if(r.baseline!==worldBaseline(d))throw new Error('The accepted world changed during review. Read it again before accepting suggestions.');
 if(!r.proposals.some(p=>p.selected))return structuredClone({worldContext:d.worldContext,worldFields:d.worldFields,populationWorld:d.populationWorld,worldGuide:d.worldGuide});
 const world=d.populationWorld?.reviewed===true?normalizePopulationWorld(d.populationWorld,d.worldContext):{kind:'custom' as PopulationWorld['kind'],capabilities:[] as PopulationWorld['capabilities'],maxAdultAge:d.populationWorld?.maxAdultAge||99},guide=normalizeWorldGuide(d.worldGuide)||emptyWorldGuide(),categories=structuredClone(d.worldFields),context=[d.worldContext].filter(Boolean);
 for(const p of r.proposals.filter(p=>p.selected)){
  if(p.kind==='context'&&!context.some(s=>s.includes(p.value)))context.push(p.value);
  if(p.kind==='capability'){world.capabilities=world.capabilities.filter(c=>c!==p.key);if(p.value==='present')world.capabilities.push(p.key as any);}
  if(p.kind==='kind')world.kind=p.value as PopulationWorld['kind'];
  if(p.kind==='species'){if(p.value==='absent')guide.species=guide.species.filter(s=>s.id!==p.key);else if(!guide.species.some(s=>s.id===p.key))guide.species.push(SPECIES_BY_ID.has(p.key)?{...SPECIES_BY_ID.get(p.key)!,...(p.minAdultAge?{minAdultAge:p.minAdultAge}:{})}:{id:p.key,label:p.label,family:'custom',appearance:p.value,...(p.minAdultAge?{minAdultAge:p.minAdultAge}:{})});}
  if(p.kind==='presentation') (guide as any)[p.key]=p.value;
  if(p.kind==='category'){const prior=categories.find(c=>c.key===p.key);if(prior)prior.options=[...new Set([...prior.options,...p.options])];else categories.push({key:p.key,label:p.label,options:p.options});}
 }
 const worldContext=context.join('\n');if(worldContext.length>WORLD_READING_LIMITS.context)throw new Error('The combined summary is too long. Edit the review before accepting; nothing was removed.');
 return {worldContext,worldFields:validateWorldCategories(categories),populationWorld:{...world,reviewed:true},worldGuide:assertWorldGuide(guide)};
}
export function normalizeWorldReview(raw:any):WorldReview|undefined {
 if(raw?.version!==1||typeof raw.baseline!=='string'||typeof raw.fingerprint!=='string'||!Array.isArray(raw.warnings)||!Array.isArray(raw.coverage)||!Array.isArray(raw.proposals)||raw.proposals.length>50||JSON.stringify(raw).length>WORLD_READING_LIMITS.reviewCharacters)return undefined;
 if(raw.proposals.some((p:any)=>!['context','capability','species','presentation','category','kind'].includes(p?.kind)||typeof p.id!=='string'||typeof p.value!=='string'||typeof p.key!=='string'||typeof p.label!=='string'||typeof p.selected!=='boolean'||typeof p.supported!=='boolean'||!Array.isArray(p.evidence)||!Array.isArray(p.options)))return undefined;
 return structuredClone(raw);
}
