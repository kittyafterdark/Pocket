import {WORLD_CAPABILITIES,type WorldCapability} from './lumistry-world-core.js';
import {speciesDiscovery,SPECIES_CATALOG,type SpeciesDefinition} from './lumistry-world-catalog.js';
import type {CandidatePlan} from './lumistry-population.js';
export const CUSTOM_SPECIES_LABEL='Custom species proposal';
export interface CustomSpeciesProposal {name:string;bodyPlan:string;limbs:string;surface:string;face:string;currentForm:string;compatibility:string;adultSentient:true;minAdultAge:number;requires:string[];}
export interface CreativeSpeciesSelection {version:1;status:'reserved'|'accepted'|'rejected';constraints:string;proposal?:CustomSpeciesProposal;definition?:SpeciesDefinition;acceptedAt?:string;}
const text=(v:unknown,n:number)=>typeof v==='string'&&!!v.trim()&&v===v.trim()&&v.length<=n;
export function parseCustomSpecies(raw:unknown,plan:CandidatePlan):CustomSpeciesProposal|undefined {
 let p:any;try{p=typeof raw==='string'?JSON.parse(raw):raw;}catch{return undefined;}
 if(!p||!text(p.name,80)||!['bodyPlan','limbs','surface','face','currentForm'].every(k=>text(p[k],120))||!text(p.compatibility,240)||p.adultSentient!==true||!Number.isInteger(p.minAdultAge)||p.minAdultAge<18||p.minAdultAge>plan.age||!Array.isArray(p.requires)||p.requires.length>WORLD_CAPABILITIES.length||p.requires.some((v:any)=>!WORLD_CAPABILITIES.includes(v)||!plan.world.capabilities.includes(v))||new Set(p.requires).size!==p.requires.length)return undefined;
 if(SPECIES_CATALOG.some(s=>[s.label,s.id].some(v=>v.toLowerCase().replaceAll('_',' ')===p.name.toLowerCase().replaceAll('_',' ')))||plan.worldGuide?.species.some(s=>s.label.toLowerCase()===p.name.toLowerCase()))return undefined;
 return {name:p.name,bodyPlan:p.bodyPlan,limbs:p.limbs,surface:p.surface,face:p.face,currentForm:p.currentForm,compatibility:p.compatibility,adultSentient:true,minAdultAge:p.minAdultAge,requires:[...p.requires]};
}
export function customSpeciesDefinition(p:CustomSpeciesProposal,planId:string):SpeciesDefinition {
 let hash=2166136261;for(const char of planId+'\n'+p.name)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return {id:'custom_candidate_'+(hash>>>0).toString(16),label:p.name,family:'custom',appearance:[p.bodyPlan,p.limbs,p.surface,p.face,p.currentForm].join('; '),...(p.requires.length?{requiredCapabilities:[...p.requires] as WorldCapability[]}:{}),minAdultAge:p.minAdultAge};
}
export function validCreativeSelection(p:CandidatePlan):boolean {
 const c=p.creativeSpecies,g=speciesDiscovery(p.worldGuide);
 if(!c||c.version!==1||!['reserved','accepted','rejected'].includes(c.status)||g.mode!=='creative_discovery_opt_in'||g.creativePercent<=0||p.world.reviewed!==true||!p.worldContext.trim()||typeof c.constraints!=='string'||c.constraints!==g.constraints||p.selectionAudit?.manualSpecies||['species','ancestry','race'].some(k=>p.filters.fields[k]?.mode==='required'||p.filters.excludedValues?.[k]?.length)||p.appearance)return false;
 if(c.status!=='accepted')return !p.species&&!c.definition&&!c.proposal;
 const proposal=parseCustomSpecies(c.proposal,p);return !!proposal&&typeof c.acceptedAt==='string'&&!!c.acceptedAt&&JSON.stringify(c.definition)===JSON.stringify(customSpeciesDefinition(proposal,p.id))&&JSON.stringify(c.definition)===JSON.stringify(p.species);
}
export function acceptCustomSpecies(plan:CandidatePlan,proposal:CustomSpeciesProposal,acceptedAt:string):CandidatePlan {
 if(plan.creativeSpecies?.status!=='reserved'||!validCreativeSelection(plan))throw new Error('This candidate has no active creative species reservation.');
 const parsed=parseCustomSpecies(proposal,plan);if(!parsed)throw new Error('Review incomplete or incompatible custom anatomy before accepting.');
 const next=structuredClone(plan);next.species=customSpeciesDefinition(parsed,plan.id);next.creativeSpecies={...next.creativeSpecies!,status:'accepted',proposal:parsed,definition:next.species,acceptedAt};next.revision++;return next;
}
export const CUSTOM_SPECIES_GUIDANCE='Only for this saved creative reservation: return one compact JSON object with name, bodyPlan, limbs, surface, face, currentForm, compatibility, adultSentient:true, minAdultAge and requires (an array of already supplied capability keys, or empty). Describe concrete adult anatomy, including absent features. Use an original name, not a renamed bundled species or a single person’s augmentation. No invented supporting sources. Explain compatibility with the accepted world and user constraints. Physiology and appearance fields describe the same proposed person. This proposal requires user approval before public writing/photos; it never enables a population globally.';
