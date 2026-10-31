import {activeWishlistFilters} from './lumistry-wishlist-catalog.js';
import {softValues,preferenceWeight,wishlistGuidance} from './lumistry-wishlist.js';
import {DATING_OPTIONS} from './lumistry-options.js';
import {planConnectionFacts,COMPATIBILITY_POLICY,validateReviewedRequirements} from './lumistry-compatibility.js';
import {selectThemeInspiration,normalizeThemeInspiration,normalizeExperiencePreferences,experienceContentGuidance,themeConflicts,allowedTheme,type ThemeInspiration,type ExperiencePreferences} from './lumistry-experience-preferences.js';
import {ADULT_PREFERENCES,preferenceEligible} from './lumistry-adult-preferences.js';
import {selectSpecies,SPECIES_POLICY} from './lumistry-species.js';
import {validCreativeSelection,type CreativeSpeciesSelection} from './lumistry-species-discovery.js';
import {normalizeWorldGuide,speciesCompatible,worldVisualGuide,extraWorldOptions,knownSpeciesIn,speciesDiscovery,WORLD_CATALOG_VERSION,type WorldGuide,type SpeciesDefinition} from './lumistry-world-catalog.js';
import {requiredAlternatives,validateFilterDraft,validateSettingFilter} from './lumistry-filters.js';
import {plannedLocation,normalizeDatingLocation,UNKNOWN_DISTANCE_KM,type DatingLocation} from './lumistry-location.js';
import {selectAppearance,validAppearance,appearanceBrief,type AppearancePlan} from './lumistry-appearance.js';
import {selectAesthetic,validAesthetic,type AestheticSelection} from './lumistry-aesthetics.js';
import {CREATION_CONTRACT} from './lumistry-creation-settings.js';
import type {DatingTrope} from './lumistry-tropes.js';
import type { DatingState } from './lumistry.js';
import { selectCharacter, type CharacterSelection, type MacroResolver } from './lumistry-catalog.js';
import { OCCUPATIONS,OCCUPATION_BY_ID,OCCUPATION_VERSION,eligibleOccupation,normalizePopulationWorld,roleCategories,type Occupation,type PopulationWorld } from './lumistry-occupations.js';
import { normalizeExperience,type LumistryExperience } from './lumistry-experience.js';
export const POPULATION_SCHEMA='population-1';
export const POPULATION_POLICY={version:'population-policy-1',domains:{retail_customer:11,office_finance_legal:9,healthcare:8,care_community:5,education_culture:5,hospitality_food:9,transport_logistics:8,trades_construction:9,industrial_utilities:7,agriculture_environment:6,public_safety_government:5,science_engineering:5,technology:3,creative_media:3,performance_sports:2,personal_services:2,occasional_gigs:1,adult_industry:2},rarity:{common:4,uncommon:2,rare:1},situations:{employed:50,self_employed:12,contracting:8,portfolio_work:5,studying:8,apprenticeship:4,between_jobs:5,unpaid_carer:3,retired:4,unemployed_not_searching:1},cooldown:{window:12,role:.1,family:.4,domain:.8},sideGigRate:.15} as const;
export interface WorkSelection {situation:string;roleId:string|null;title:string;domain?:string;family?:string;relationship:string;hours:string;term:string;place:string;secondaryRoleId:string|null;secondaryTitle?:string;secondaryHours?:string;secondaryTerm?:string;publicCategories:string[];source:'catalog'|'manual_brief'|'situation';}
export interface CandidatePlan {
 experiencePreferences?:ExperiencePreferences;themeInspiration?:ThemeInspiration;
 worldGuide?:WorldGuide;species?:SpeciesDefinition;speciesPolicyVersion?:string;speciesCatalogVersion?:string;creativeSpecies?:CreativeSpeciesSelection;
 creationContract?:string;aesthetic?:AestheticSelection;appearance?:AppearancePlan;location?:DatingLocation;
 preferenceGuidance?:ReturnType<typeof wishlistGuidance>;connectionPolicy?:typeof COMPATIBILITY_POLICY;connectionFacts?:Record<string,string>;schema:typeof POPULATION_SCHEMA;tropeIds?:string[];id:string;revision:number;createdAt:string;ownerScope:string;policyVersion:string;catalogVersion:string;fieldLibraryVersion:string;
 world:PopulationWorld;worldContext:string;filters:DatingState['filters'];experience:LumistryExperience;adultJobs:boolean;
 age:number;distanceKm:number;questionCount:number;photoCount:number;selection:CharacterSelection;work:WorkSelection;
 languageNote?:string;
 life:{household:string;leisure:string;configuration:string;pressure:'none'|'low'|'minor'|'substantial'};
 exampleVariant:number;selectionAudit:{method:string;rejectedSoftChoices:string[];manualSpecies?:boolean};
}
export class PopulationPlanningError extends Error {readonly code='unsatisfied-plan';}
export function weightedPick<T>(items:readonly T[],weight:(v:T)=>number,random= Math.random):T {
 const weights=items.map(v=>Math.max(0,weight(v)));const total=weights.reduce((a,b)=>a+b,0);
 if(!items.length||!Number.isFinite(total)||total<=0)throw new PopulationPlanningError('No compatible choices remain. Review the world capabilities or required filters; no model request was made.');
 let n=Math.min(.999999999999,Math.max(0,random()))*total;
 for(let i=0;i<items.length;i++){n-=weights[i];if(n<0)return items[i];}return items.at(-1)!;
}
const take=<T>(v:readonly T[],random:()=>number)=>weightedPick(v,()=>1,random);
const unpaid:Record<string,string>={studying:'student',between_jobs:'between jobs',retired:'retired',unpaid_carer:'other',unemployed_not_searching:'other',unable_to_work_currently:'other',independently_supported:'other'};
const choices=(v:string|undefined)=>[...new Set((v||'').split(',').map(x=>x.trim()).filter(Boolean))];
function recentPlans(d:DatingState) {
 const records=[...d.profiles.flatMap(p=>p.creationPlan?[p.creationPlan]:[]),...[d.discoveryJob,d.draftJob].flatMap(j=>j?.slots.flatMap(s=>s.plan?[s.plan]:[])||[])];
 return [...new Map(records.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).map(p=>[p.id,p])).values()].slice(-12);
}
const workPoolCache=new Map<string,Array<{situation:string;role?:Occupation;relationship:string;categories:string[]}>>();
function workChoices(world:PopulationWorld,adultJobs:boolean,age:number,required:string[],excluded:string[]=[]) {
 const key=JSON.stringify([world.kind,world.capabilities,adultJobs,age>=27?27:age>=21?21:18,required,excluded]);
 const cached=workPoolCache.get(key);if(cached)return cached;
 const results:Array<{situation:string;role?:Occupation;relationship:string;categories:string[]}>=[];
 for(const situation of Object.keys(POPULATION_POLICY.situations)){
  if(situation in unpaid){const categories=[unpaid[situation]].filter(c=>!excluded.includes(c.toLowerCase()));if(categories.length&&(!required.length||required.some(x=>categories.includes(x))))results.push({situation,relationship:situation==='unpaid_carer'?'unpaid_household_carer':'not_applicable',categories});continue;}
  for(const role of OCCUPATIONS){
   if(!eligibleOccupation(role,world,adultJobs,age)||role.use==='G'&&situation!=='portfolio_work'&&situation!=='contracting')continue;
   const relationship=situation==='self_employed'?'independent_business_owner':situation==='contracting'?'contractor':situation==='portfolio_work'?'contractor':'employee';
   if(!role.relationships.includes(relationship))continue;
   if(situation==='apprenticeship'&&(role.domain!=='trades_construction'||role.minAge>18))continue;
   const categories=situation==='apprenticeship'?[...roleCategories(role,situation,relationship),'student']:roleCategories(role,situation,relationship);
   if(categories.some(c=>excluded.includes(c.toLowerCase())))continue;
   if(categories.length&&(!required.length||required.some(x=>categories.includes(x))))results.push({situation,role,relationship,categories});
  }
 }
 if(workPoolCache.size>=256)workPoolCache.delete(workPoolCache.keys().next().value!);workPoolCache.set(key,results);
 return results;
}
/** Only explicitly labeled manual work is engine-locked; ambiguous rough prose is never macro input. */
export function manualWork(brief=''):string|undefined {
 const explicit=brief.match(/(?:^|\n)\s*(?:occupation|job|work|role)\s*:\s*([^\n]{1,240})/i)?.[1]?.trim();if(explicit)return explicit;
 const prefix=brief.match(/^(?:an?\s+)?((?:self[- ]employed|freelance)\s+[^.;\n]{1,160})/i)?.[1]?.trim();if(prefix)return prefix;
 const described=brief.match(/\b(?:works? as|is employed as|occupation is|job is)\s+(?:an? )?([^.;\n]{1,160})/i)?.[1]?.trim();if(described)return described;
 const situation=brief.match(/^(?:an?\s+)?((?:retired|studying|student|between jobs|unemployed|unpaid carer|unpaid caregiver|unable to work currently|independently supported|short-term agency worker|small creator with another day job|creator with another primary occupation)[^.;\n]{0,160})/i)?.[1]?.trim();if(situation)return situation;
 const found=OCCUPATIONS.filter(r=>[r.title,...r.aliases].some(t=>new RegExp('\\b'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(brief)));
 return found.length===1?found[0].title:undefined;
}

export async function selectPopulationPlan(d:DatingState,resolve:MacroResolver,scope:Parameters<MacroResolver>[1],identity:{id:string;createdAt:string;owner:string;questions:number;photos:number;distanceKm:number;brief?:string},random=Math.random):Promise<CandidatePlan> {
 const savedFilters=structuredClone(d.filters);d={...d,filters:activeWishlistFilters(d)};
 const problem=validateFilterDraft(d.filters)||validateSettingFilter(d.filters,d)||validateReviewedRequirements(d,{...extraWorldOptions(d),kinks:[...new Set([...DATING_OPTIONS.kinks,...ADULT_PREFERENCES.map(t=>t.label),...(extraWorldOptions(d).kinks||[])])]});if(problem)throw new PopulationPlanningError(problem);
 let connectionFacts:Record<string,string>;try{connectionFacts=planConnectionFacts(d,key=>requiredAlternatives(d.filters,key),random,!!identity.brief);}catch(error){throw new PopulationPlanningError(error instanceof Error?error.message:'No compatible connection plan.');}
 const placement=plannedLocation(d,()=>0);
 const world=normalizePopulationWorld(d.populationWorld,d.worldContext),adultJobs=d.generationSettings.adultJobs!==false;
 const worldGuide=normalizeWorldGuide(d.worldGuide);
 let speciesPool=worldGuide?.species.filter(s=>speciesCompatible(s,world))||[];
 if(d.filters.fields.skinTone?.mode==='required'&&speciesPool.length)speciesPool=speciesPool.filter(s=>s.id==='human');
 const speciesKeys=['species',...['ancestry','race'].filter(k=>!d.worldFields.some(w=>w.key===k))].filter(key=>d.filters.fields[key]?.mode==='required'&&d.filters.fields[key].value.trim());const speciesKey=speciesKeys[0];
 const speciesFilters=structuredClone(d.filters);const explicitSpecies=identity.brief?.match(/(?:^|\n)\s*(?:species|ancestry|race)\s*:\s*([^\n]+)/i)?.[1]||knownSpeciesIn(identity.brief||'')?.label;const shouldPlanSpecies=!explicitSpecies||!!speciesKey;
 const contentConflicts=themeConflicts(d.filters.fields,d.experiencePreferences,world);if(contentConflicts.length)throw new PopulationPlanningError(contentConflicts.join(' '));
 if(d.filters.fields.kinks?.mode==='required'){const allowed=requiredAlternatives(d.filters,'kinks').filter(value=>{const term=ADULT_PREFERENCES.find(t=>t.label.toLowerCase()===value.toLowerCase());return !term||preferenceEligible(term,world)&&(!d.experiencePreferences||allowedTheme(term,d.experiencePreferences,world));});if(!allowed.length)throw new PopulationPlanningError('No required preference alternative has the necessary reviewed world capabilities. Review the world or filter; no provider call was made.');speciesFilters.fields.kinks={mode:'required',value:allowed.join(', ')};}
 if(worldGuide&&speciesDiscovery(worldGuide).mode==='strict_reviewed'&&!worldGuide.species.length&&shouldPlanSpecies)throw new PopulationPlanningError('Strict species discovery needs an enabled reviewed species. No model call was made.');
 if(shouldPlanSpecies)speciesPool=speciesPool.filter(s=>(s.minAdultAge||18)<=Math.min(d.filters.maxAge,world.maxAdultAge));
 if(worldGuide?.species.length){
  speciesPool=speciesPool.filter(s=>![...new Set(['species',...(speciesKey?[speciesKey]:[]),...['ancestry','race'].filter(k=>!d.worldFields.some(w=>w.key===k))])].flatMap(k=>d.filters.excludedValues?.[k]||[]).some(v=>[s.id,s.label].some(x=>x.toLowerCase()===v.toLowerCase())));
  speciesPool=speciesPool.filter(s=>speciesKeys.every(k=>requiredAlternatives(d.filters,k).some(v=>[s.id,s.label].some(x=>x.toLowerCase()===v.toLowerCase()))));
  if(speciesKey){const alternatives=requiredAlternatives(d.filters,speciesKey).filter(v=>speciesPool.some(s=>[s.id,s.label].some(x=>x.toLowerCase()===v.toLowerCase())));if(!alternatives.length)throw new PopulationPlanningError('No enabled species satisfies the required alternatives and world capabilities. Review the species palette; no model call was made.');speciesFilters.fields[speciesKey]={mode:'required',value:alternatives.map(v=>speciesPool.find(s=>[s.id,s.label].some(x=>x.toLowerCase()===v.toLowerCase()))!.label).join(', ')};}
  if(!speciesPool.length&&shouldPlanSpecies)throw new PopulationPlanningError('No enabled species is compatible with the reviewed world. No model call was made.');
 }
 const suppliedAge=identity.brief?.match(/(?:^|\n)\s*age\s*:\s*(\d{2,4})\b|\b(\d{2,4})[ -]year[ -]old\b/i);
 const languageNote=identity.brief?.match(/(?:^|\n)\s*(?:known\s+)?languages?\s*:\s*([^\n]{1,240})/i)?.[1]?.trim();
 const fixedAge=suppliedAge?Number(suppliedAge[1]||suppliedAge[2]):undefined;
 if(fixedAge!==undefined&&(fixedAge<d.filters.minAge||fixedAge>d.filters.maxAge||fixedAge>world.maxAdultAge))throw new PopulationPlanningError('The supplied age conflicts with the selected adult age range or world lifespan.');
 const min=fixedAge??d.filters.minAge,max=fixedAge??Math.min(d.filters.maxAge,world.maxAdultAge);
 if(min>max)throw new PopulationPlanningError('The selected age range exceeds the reviewed world lifespan. Review age/world settings; no model request was made.');
 const preferredWork=d.filters.fields.occupation?.mode==='preferred'?choices(d.filters.fields.occupation.value).map(v=>v.toLowerCase()):[];
 const preferredWeight=(x:{categories:string[]})=>preferenceWeight(d.filters,'occupation',x.categories.join(', '));
 const required=d.filters.fields.occupation?.mode==='required'?requiredAlternatives(d.filters,'occupation').map(v=>v.toLowerCase()):[];
 const excluded=(d.filters.excludedValues?.occupation||[]).map(v=>v.toLowerCase());
 const manual=manualWork(identity.brief);
 const manualSituation=manual?/\bretired\b/i.test(manual)?'retired':/\bstudent\b|\bstudying\b/i.test(manual)?'studying':/\bbetween jobs\b/i.test(manual)?'between_jobs':/\bunpaid (?:carer|caregiver)\b/i.test(manual)?'unpaid_carer':/\bunemployed\b/i.test(manual)?'unemployed_not_searching':/\bunable to work\b/i.test(manual)?'unable_to_work_currently':/\bindependently supported\b/i.test(manual)?'independently_supported':/\bshort-term agency worker\b/i.test(manual)?'agency_temporary':/\b(?:small creator with another day job|creator with another primary occupation)\b/i.test(manual)?'portfolio_work':undefined:undefined;
 const matched=manual&&!manualSituation?OCCUPATIONS.find(r=>[r.title,...r.aliases].some(x=>x.toLowerCase()===manual.replace(/^(?:self[- ]employed|freelance)\s+/i,'').toLowerCase())):undefined;
 // Eligible age intervals are finite threshold bands; selection preserves uniform eligible ages.
 const edges=[min,max+1,...[25,35,45,55,65,75,100,...OCCUPATIONS.map(r=>r.minAge),...(shouldPlanSpecies?speciesPool.map(s=>s.minAdultAge||18):[])].filter(n=>n>min&&n<=max)].sort((a,b)=>a-b).filter((x,i,a)=>!i||x!==a[i-1]);
 const bands=edges.slice(0,-1).map((low,i)=>({low,high:edges[i+1]-1})).filter(b=>(!shouldPlanSpecies||!worldGuide?.species.length||speciesPool.some(s=>(s.minAdultAge||18)<=b.low))&&(manual? !matched||eligibleOccupation(matched,world,adultJobs,b.low,false,true):workChoices(world,adultJobs,b.low,required,excluded).length>0));
 const band=weightedPick(bands,b=>b.high-b.low+1,random),age=band.low+Math.floor(Math.min(.999999999,random())*(band.high-band.low+1));
 let work:WorkSelection;let method='local_weighted';
 if(manual){
  const isOwner=/^self[- ]employed/i.test(manual),isFreelance=/^freelance/i.test(manual);
  const cats=manualSituation?[unpaid[manualSituation]||(manualSituation==='portfolio_work'?'freelancer':'other')]:matched?roleCategories(matched,isOwner?'self_employed':isFreelance?'contracting':'employed',isOwner?'independent_business_owner':isFreelance?'contractor':'employee'):['other'];
  if(cats.some(c=>excluded.includes(c.toLowerCase())))throw new PopulationPlanningError('The supplied work conflicts with an excluded occupation category. Its category cannot be removed to bypass the exclusion.');
  const allowedCats=cats.filter(c=>!excluded.includes(c.toLowerCase()));if(!allowedCats.length)throw new PopulationPlanningError('The supplied work has no category compatible with your exclusions. Review the brief or filters.');
  if(required.length&&!required.some(x=>allowedCats.includes(x)))throw new PopulationPlanningError('The explicitly supplied work conflicts with the required occupation category. Review the brief or filter.');
  const manualRelationship=manualSituation==='agency_temporary'?'agency_worker':manualSituation==='portfolio_work'?'contractor':manualSituation==='unpaid_carer'?'unpaid_household_carer':manualSituation?'not_applicable':isOwner?'independent_business_owner':isFreelance?'contractor':'employee';
  work={situation:manualSituation||(isOwner?'self_employed':isFreelance?'contracting':'employed'),roleId:matched?.id||null,title:manual,domain:matched?.domain,family:matched?.family,relationship:manualRelationship,hours:manualSituation&&manualSituation!=='agency_temporary'&&manualSituation!=='portfolio_work'?'not_applicable':'variable_hours',term:manualSituation==='agency_temporary'?'temporary':manualSituation==='portfolio_work'?'project_based':manualSituation?'not_applicable':'ongoing',place:manualSituation&&manualSituation!=='agency_temporary'&&manualSituation!=='portfolio_work'?'not_applicable':'on_site',secondaryRoleId:null,publicCategories:allowedCats,source:'manual_brief'};
 }else{
  const all=workChoices(world,adultJobs,age,required,excluded);
  const situation=weightedPick([...new Set(all.map(x=>x.situation))],s=>POPULATION_POLICY.situations[s as keyof typeof POPULATION_POLICY.situations]*Math.max(...all.filter(x=>x.situation===s).map(preferredWeight)),random);
  let eligible=all.filter(x=>x.situation===situation);let chosen=eligible[0];
  if(chosen.role){
   const recent=recentPlans(d),count=(key:'roleId'|'family'|'domain',value:string)=>recent.filter(p=>p.work[key]===value).length;
   const domain=weightedPick([...new Set(eligible.map(x=>x.role!.domain))],v=>(POPULATION_POLICY.domains[v as keyof typeof POPULATION_POLICY.domains]||1)*(.8**count('domain',v))*Math.max(...eligible.filter(x=>x.role!.domain===v).map(preferredWeight)),random);
   eligible=eligible.filter(x=>x.role!.domain===domain);
   const family=weightedPick([...new Set(eligible.map(x=>x.role!.family))],v=>{const r=eligible.filter(x=>x.role!.family===v);return r.reduce((n,x)=>n+POPULATION_POLICY.rarity[x.role!.rarity],0)/r.length*(.4**count('family',v));},random);
   eligible=eligible.filter(x=>x.role!.family===family);
   const weight=(x:typeof chosen)=>POPULATION_POLICY.rarity[x.role!.rarity]*(.1**count('roleId',x.role!.id))*preferredWeight(x);
   if(eligible.every(x=>weight(x)===weight(eligible[0]))){
    const ids=eligible.map(x=>x.role!.id);const result=await resolve(`{{pick::${ids.join('::')}}}`,scope);
    if(result.diagnostics.length||!ids.includes(result.text.trim()))throw new PopulationPlanningError('Occupation macro returned an unresolved or ineligible ID. No model request was made.');
    chosen=eligible.find(x=>x.role!.id===result.text.trim())!;method='native_pick';
   }else chosen=weightedPick(eligible,weight,random);
  }
  const r=chosen.role;
  const hours=r?take(r.hours,random):'not_applicable';
  const second=r&&(situation==='portfolio_work'||['employed','self_employed','contracting'].includes(situation)&&random()<.15)?takeOrNone(OCCUPATIONS.filter(x=>x.id!==r.id&&!x.categories.some(c=>excluded.includes(c.toLowerCase()))&&eligibleOccupation(x,world,adultJobs,age,true)&&(!['full_time','shift_based'].includes(hours)||x.use==='G')),random):undefined;
  work={situation,roleId:r?.id||null,title:r?.title||situation.replaceAll('_',' '),domain:r?.domain,family:r?.family,relationship:chosen.relationship,hours,term:r?.use==='G'?'temporary':r?'ongoing':'not_applicable',place:r?take(r.places,random):'not_applicable',secondaryRoleId:second?.id||null,secondaryTitle:second?.title,secondaryHours:second?'occasional':undefined,secondaryTerm:second?(second.use==='G'?'one_off':'project_based'):undefined,publicCategories:chosen.categories,source:r?'catalog':'situation'};
  if(situation==='portfolio_work'&&!second){work.situation='contracting';work.publicCategories=r?roleCategories(r,'contracting',work.relationship).filter(c=>!excluded.includes(c.toLowerCase())):work.publicCategories;}
 }
 if(shouldPlanSpecies){speciesPool=speciesPool.filter(s=>(s.minAdultAge||18)<=age);if(speciesKey&&worldGuide?.species.length)speciesFilters.fields[speciesKey].value=requiredAlternatives(speciesFilters,speciesKey).filter(v=>speciesPool.some(s=>s.label===v)).join(', ');}
 const filters=speciesFilters;
 if(required.length)filters.fields.occupation={mode:'required',value:take(required.filter(x=>work.publicCategories.includes(x)),random)};
 let species:SpeciesDefinition|undefined;
 if(speciesPool.length&&shouldPlanSpecies){
  let eligible=speciesKey?speciesPool.filter(s=>requiredAlternatives(speciesFilters,speciesKey).includes(s.label)):speciesPool;
  if(explicitSpecies&&speciesKey){const explicit=knownSpeciesIn(explicitSpecies);eligible=eligible.filter(s=>s.id===explicit?.id||s.label.toLowerCase()===explicitSpecies.trim().toLowerCase());if(!eligible.length)throw new PopulationPlanningError('The supplied species conflicts with the reviewed palette or required alternatives. No identity was rerolled.');}
  try{species=await selectSpecies(eligible,recentPlans(d).flatMap(p=>p.species?[p.species]:[]),resolve,scope,random,s=>preferenceWeight(d.filters,'species',s.label));}catch(e){throw new PopulationPlanningError(e instanceof Error?e.message:'Species planning failed.');}
  for(const key of speciesKeys)filters.fields[key]={mode:'required',value:species.label};
 }
 if(d.filters.fields.skinTone?.mode==='required'&&species&&species.id!=='human')throw new PopulationPlanningError('The essential human skin-tone choice needs a compatible human population. Review species or appearance; no model request was made.');
 for(const [key,value] of Object.entries(connectionFacts))if(filters.fields[key]?.mode==='required')filters.fields[key]={mode:'required',value};
 const selection=await selectCharacter({...d,filters},resolve,scope,random,{styleSelected:true});
 if(d.filters.connection?.parenthood||d.filters.connection?.childrenPlans)selection.requiredFields.children=connectionFacts.children;
 if(d.filters.connection?.partnerRoles?.length)selection.requiredFields.sexualRole=connectionFacts.sexualRole;
 const settings=speciesDiscovery(worldGuide);
 const creativeAllowed=!!worldGuide&&settings.mode==='creative_discovery_opt_in'&&world.reviewed===true&&!!d.worldContext.trim()&&!identity.brief&&!speciesKey&&!['species','ancestry','race'].some(k=>d.filters.fields[k]?.mode==='required'||d.filters.excludedValues?.[k]?.length);
 const creativeSpecies:CreativeSpeciesSelection|undefined=creativeAllowed&&random()*100<settings.creativePercent?{version:1,status:'reserved',constraints:settings.constraints}:undefined;
 if(creativeSpecies)species=undefined;
 const configuration=take(['content/settled','busy but content','socially active','quietly independent','ambitious','drifting','in transition','under pressure','indulgent/spontaneous','uneventful month'],random);
 const pressure=configuration==='under pressure'?take(['minor','substantial'] as const,random):weightedPick(['none','low','minor'] as const,x=>x==='none'?8:1,random);
 const household=take(['alone','housemates','family','stable housing, no special story',...(work.situation==='studying'?['student housing']:[]),...(/farm_worker|ship_deckhand|cruise_ship|hotel_housekeeper/.test(work.roleId||'')?['employer-provided housing']:[]),...(['partnered','married'].includes(selection.requiredFields.relationshipStatus)?['with an established partner']:[]),...(selection.requiredFields.children==='have children'?['with established children or dependents']:[]),...(work.situation==='between_jobs'?['temporary accommodation']:[])],random);
 const leisure=weightedPick(['no dedicated hobby','casual/passive leisure','craft/making','performance/creative','outdoors/nature','sport/fitness','social/community','intellectual/reading','collecting/repair','culinary','volunteering','gaming/digital','contemplative/relaxation','transient curiosity'],x=>x==='no dedicated hobby'?6:x==='casual/passive leisure'?6:1,random);
 const rejectedDirections:string[]=[];
 if(leisure==='no dedicated hobby'){const original=selection.tags;selection.tags=original.filter(id=>!['hobby-with-company','hobby-alone'].includes(id));rejectedDirections.push(...original.filter(id=>!selection.tags.includes(id)).map(id=>'direction:'+id+': no dedicated hobby'));}
 let aesthetic:AestheticSelection;try{aesthetic=await selectAesthetic(world,recentPlans(d).flatMap(p=>p.aesthetic?[p.aesthetic]:[]),resolve,scope,random);}catch(error){throw new PopulationPlanningError(error instanceof Error?error.message:'Aesthetic planning failed before provider dispatch.');}
 const exampleVariant=Math.floor(random()*3);
 const preferredTones=softValues(d.filters,'skinTone','prefer'),requiredTones=selection.requiredFields.skinTone?[selection.requiredFields.skinTone]:[];
 const preferredPhysical=Object.entries(d.filters.fields).filter(([k])=>!['skinTone','hairTexture'].includes(k)).some(([k,v])=>v.mode!=='any'&&(/skin|complexion|surface|hair|facial|appearance/i.test(k)||v.mode==='preferred'&&/species|ancestry|physiology/i.test(k)));
 const appearance=d.generationSettings.appearanceDiversity!==false&&!identity.brief?.trim()&&!preferredPhysical&&!creativeSpecies&&(!species||species.id==='human')?selectAppearance(world,Object.fromEntries(Object.entries({...selection.requiredFields,...(species?{species:'human'}:{})}).filter(([key])=>key!=='skinTone')),d.worldContext,recentPlans(d).flatMap(p=>p.appearance?[p.appearance]:[]),random,weightedPick,{prefer:preferredTones,required:requiredTones,avoid:softValues(d.filters,'skinTone','avoid'),excluded:d.filters.excludedValues?.skinTone||[]}):undefined;
 const plan:CandidatePlan={preferenceGuidance:wishlistGuidance(d.filters),connectionPolicy:COMPATIBILITY_POLICY,connectionFacts,experiencePreferences:d.experiencePreferences?structuredClone(d.experiencePreferences):undefined,themeInspiration:identity.brief?undefined:selectThemeInspiration(d.experiencePreferences,world,identity.id),worldGuide,species,speciesPolicyVersion:SPECIES_POLICY.version,speciesCatalogVersion:WORLD_CATALOG_VERSION,creativeSpecies,location:placement.location,appearance,creationContract:CREATION_CONTRACT,aesthetic,schema:POPULATION_SCHEMA,id:identity.id,revision:1,createdAt:identity.createdAt,ownerScope:identity.owner,policyVersion:POPULATION_POLICY.version,catalogVersion:OCCUPATION_VERSION,fieldLibraryVersion:'dynamic-fields-1',world,worldContext:d.worldContext,filters:savedFilters,experience:normalizeExperience(d.generationSettings.experience),adultJobs,age,distanceKm:d.filters.distanceMode==='setting'?placement.distanceKm:identity.distanceKm,questionCount:identity.questions,photoCount:identity.photos,selection,work,languageNote,life:{household,leisure,configuration,pressure},exampleVariant,selectionAudit:{method,rejectedSoftChoices:rejectedDirections,...(explicitSpecies?{manualSpecies:true}:{})}};
 if(JSON.stringify(plan).length>99000)throw new PopulationPlanningError('This world snapshot is too large for a durable candidate plan. Reduce enabled anatomy/vocabulary or the accepted summary before generation; no provider call was made.');
 return plan;
}
function takeOrNone<T>(v:readonly T[],random:()=>number):T|undefined{return v.length?take(v,random):undefined;}
export function normalizeCandidatePlan(v:any):CandidatePlan|undefined {
 if(v?.schema!==POPULATION_SCHEMA||typeof v.id!=='string'||!v.id||typeof v.ownerScope!=='string'||!Number.isInteger(v.age)||v.age<18||v.age>9999||v.policyVersion!==POPULATION_POLICY.version||v.catalogVersion!==OCCUPATION_VERSION||v.fieldLibraryVersion!=='dynamic-fields-1'||!v.work||!v.selection||!v.filters||!v.life||!v.world||typeof v.worldContext!=='string'||typeof v.adultJobs!=='boolean'||!Number.isFinite(v.distanceKm)||v.distanceKm<0||![1,2,3].includes(v.questionCount)||![1,2,3,4,5].includes(v.photoCount)||JSON.stringify(v).length>100000)return undefined;
 if(JSON.stringify(normalizePopulationWorld(v.world))!==JSON.stringify(v.world)||v.age>v.world.maxAdultAge||v.age<v.filters.minAge||v.age>v.filters.maxAge)return undefined;
 if(v.connectionPolicy!==undefined&&v.connectionPolicy!==COMPATIBILITY_POLICY)return undefined;
 if(v.connectionFacts&&(typeof v.connectionFacts!=='object'||Array.isArray(v.connectionFacts)||Object.entries(v.connectionFacts).some(([k,x])=>!['gender','orientation','sugarRole','children','parenthood','childrenPlans','sexualRole','intentions','relationshipStatus','monogamy'].includes(k)||typeof x!=='string'||x.length>300)))return undefined;
 if(v.experiencePreferences&&!normalizeExperiencePreferences(v.experiencePreferences)||v.themeInspiration&&!normalizeThemeInspiration(v.themeInspiration))return undefined;
 if(v.themeInspiration){const term=ADULT_PREFERENCES.find(t=>t.id===v.themeInspiration.id);if(!term||!v.experiencePreferences||!v.experiencePreferences.frequency||term.traitConfirmation||!allowedTheme(term,v.experiencePreferences,v.world))return undefined;}
 const role=v.work.roleId?OCCUPATION_BY_ID.get(v.work.roleId):undefined,side=v.work.secondaryRoleId?OCCUPATION_BY_ID.get(v.work.secondaryRoleId):undefined;
 if(v.work.roleId&&(!role||!eligibleOccupation(role,v.world,v.adultJobs,v.age,false,v.work.source==='manual_brief')||v.work.domain!==role.domain||v.work.family!==role.family))return undefined;
 if(v.work.secondaryRoleId&&(!side||side.id===role?.id||!eligibleOccupation(side,v.world,v.adultJobs,v.age,true)||['full_time','shift_based'].includes(v.work.hours)&&side.use!=='G'))return undefined;
 if(!Array.isArray(v.work.publicCategories)||typeof v.work.title!=='string'||!v.work.title||!['catalog','manual_brief','situation'].includes(v.work.source)||v.selection.version!==2||!Array.isArray(v.selection.tags)||![4,5].includes(v.selection.tags.length)||new Set(v.selection.tags).size!==v.selection.tags.length)return undefined;
 if(v.selection.requiredFields?.occupation&&!v.work.publicCategories.includes(v.selection.requiredFields.occupation))return undefined;
 if(v.creationContract===CREATION_CONTRACT&&!v.aesthetic||v.aesthetic&&!validAesthetic(v.aesthetic,v.world))return undefined;
 if(v.appearance&&!validAppearance(v.appearance,v.world,{...v.selection.requiredFields,...(v.species?.id==='human'?{species:'human'}:{})},v.worldContext))return undefined;
 if(validateFilterDraft(v.filters)||v.filters.distanceMode==='setting'&&(v.location?.mode!=='setting'||v.distanceKm!==UNKNOWN_DISTANCE_KM))return undefined;
 if(v.location&&(!normalizeDatingLocation(v.location)||v.location.mode==='setting'&&(v.filters.distanceMode!=='setting'||v.location.settingKey!==v.filters.settingKey)))return undefined;
 if(v.worldGuide&&JSON.stringify(normalizeWorldGuide(v.worldGuide))!==JSON.stringify(v.worldGuide)||v.worldGuide?.species.length&&!v.species&&!v.selectionAudit?.manualSpecies&&!v.creativeSpecies||v.species&&(!(v.worldGuide?.species.some((s:any)=>JSON.stringify(s)===JSON.stringify(v.species))||v.creativeSpecies?.status==='accepted'&&JSON.stringify(v.creativeSpecies.definition)===JSON.stringify(v.species))||!speciesCompatible(v.species,v.world)||v.age<(v.species.minAdultAge||18)))return undefined;
 if(v.speciesPolicyVersion&&v.speciesPolicyVersion!==SPECIES_POLICY.version||v.speciesCatalogVersion&&v.speciesCatalogVersion!==WORLD_CATALOG_VERSION)return undefined;
 if(v.creativeSpecies&&!validCreativeSelection(v))return undefined;
 const normalized=structuredClone(v);if(typeof normalized.languageNote!=='string'||!normalized.languageNote.trim())delete normalized.languageNote;else normalized.languageNote=normalized.languageNote.trim().slice(0,240);return normalized;
}
export function populationBrief(p:CandidatePlan) {
 return {connectionFacts:p.connectionFacts,softPreferences:p.preferenceGuidance||wishlistGuidance(p.filters),preferredValues:Object.fromEntries(Object.entries(p.filters.fields).filter(([,f])=>f.mode==='preferred'&&f.value.trim()).map(([key,f])=>[key,f.value])),connectionRule:'Saved connection facts are this new person’s own truth, not mandatory public disclosures. Preferences are soft guidance, not a checklist. Never announce filters or infer the Persona’s hidden knowledge. Stay consistent with the saved attraction and arrangement role.',optionalPrivateTheme:p.themeInspiration?{guidance:p.themeInspiration.guidance,rule:'Optional individual nuance only; it may be absent. If appropriate, use the existing Personal comfort and consent or Actual orientation and attraction label; do not add labels. Never announce it in public prose without accepted disclosure. Do not invent traits, consent or a compulsory intimacy inventory.'}:undefined,creativeSpecies:p.creativeSpecies?.status==='reserved'?{task:'Invent one original adult sentient species compatible with this accepted setting. Do not invent institutions, capabilities or a new setting. Return Custom species proposal as requested; anatomy remains provisional until explicit review.',constraints:p.creativeSpecies.constraints}:undefined,species:p.species?{label:p.species.label,anatomy:p.species.appearance,rule:"Canonical adult sentient anatomy; preserve it across appearance, clothing and every photograph. Species does not imply personality, sexual interests or consent."}:undefined,worldPresentation:worldVisualGuide(p.worldGuide)||undefined,physicalAppearance:appearanceBrief(p.appearance),excludedVisibleCategories:p.filters.excludedValues,age:p.age,distanceKm:p.location?.mode==='setting'?undefined:p.distanceKm,placement:p.location?.mode==='setting'?'Within the reviewed setting; kilometre distance is not established.':undefined,work:{title:p.work.title,categoryOptions:p.work.publicCategories,situation:p.work.situation,relationship:p.work.relationship,hours:p.work.hours,term:p.work.term,place:p.work.place,secondary:p.work.secondaryTitle||'None',secondaryHours:p.work.secondaryHours,secondaryTerm:p.work.secondaryTerm},life:p.life,knownLanguages:p.languageNote,settingLanguages:p.worldGuide?.languages||undefined,worldCapabilities:p.world.capabilities,requiredCategories:p.selection.requiredFields};
}

export function compatiblePopulationPresentation(presentation:{flavor:string;tropes:DatingTrope[]},plan:CandidatePlan) {
 const rejected:string[]=[];
 const tropes=presentation.tropes.filter(t=>{
  const supported=t.id==='impossible-location'?plan.location?.mode!=='setting':t.id==='ceo'?plan.work.relationship==='independent_business_owner':t.id==='augmentation'?plan.world.capabilities.includes('augmentation'):t.id==='corporate-name'?['cyberpunk','spacefaring'].includes(plan.world.kind):t.id==='synthetic-perfect'?plan.world.capabilities.includes('digital_networks'):t.id==='niche-hobby'?plan.life.leisure!=='no dedicated hobby':true;
  if(!supported)rejected.push(`presentation:${t.id}: incompatible with saved circumstances`);return supported;
 });
 plan.selectionAudit.rejectedSoftChoices.push(...rejected);
 return {...presentation,tropes,flavor:tropes.length?tropes.map(t=>t.label).join(' + '):presentation.tropes.length?'ordinary':presentation.flavor};
}
