import {WORLD_CAPABILITIES,type PopulationWorld,type WorldCapability} from './lumistry-world-core.js';
export const WORLD_CATALOG_VERSION='species-290-1';
export interface SpeciesDefinition {id:string;label:string;family:string;appearance:string;minAdultAge?:number;requires?:WorldCapability;requiredCapabilities?:WorldCapability[];group?:string;classification?:string;}
export {SPECIES_CATALOG} from './lumistry-species.js';
import {SPECIES_CATALOG,speciesRequirements} from './lumistry-species.js';
export const SPECIES_BY_ID=new Map(SPECIES_CATALOG.map(s=>[s.id,s]));
export const WORLD_PRESENTATION_KEYS=['attire','architecture','technology','magic','languages','medium'] as const;
export type SpeciesDiscoveryMode='strict_reviewed'|'lore_adaptive'|'creative_discovery_opt_in';
export interface SpeciesDiscoverySettings {mode:SpeciesDiscoveryMode;creativePercent:number;constraints:string;}
export const speciesDiscovery=(g?:WorldGuide):SpeciesDiscoverySettings=>g?.discovery||{mode:'lore_adaptive',creativePercent:10,constraints:''};
export interface WorldGuide {vocabulary?:'automatic'|'custom';discovery?:SpeciesDiscoverySettings;version:1;species:SpeciesDefinition[];attire:string;architecture:string;technology:string;magic:string;languages:string;medium:string;intimacyIds:string[];}
export const emptyWorldGuide=():WorldGuide=>({version:1,species:[],attire:'',architecture:'',technology:'',magic:'',languages:'',medium:'',intimacyIds:[]});
export {ADULT_PREFERENCES as GENRE_COMPATIBILITY} from './lumistry-adult-preferences.js';
import {ADULT_PREFERENCES as GENRE_COMPATIBILITY,preferenceEligible,ADULT_PREFERENCE_BY_ID} from './lumistry-adult-preferences.js';
export function eligibleGenreOptions(world:PopulationWorld){return GENRE_COMPATIBILITY.filter(o=>preferenceEligible(o,world));}
export const WORLD_PRESETS=[
 {id:'modern_multispecies',label:'Contemporary mixed-species world',kind:'modern',capabilities:['electricity','digital_networks','broadcast','motor_transport','aviation','railways','industrial','clinical_care','higher_education','large_retail','marine'],species:['human','elf','dwarf','orc','catfolk','lizardfolk'],attire:'Contemporary clothing fitted to each person’s accepted anatomy; no automatic fantasy costume.',architecture:'Contemporary homes, workplaces and streets appropriate to the reviewed locality.',technology:'Contemporary technology; species does not establish supernatural powers.',magic:'No magical capabilities established by this preset; add only those supported by the card or your explicit choices.',medium:'Contemporary photos or other reviewed modern capture methods.'},
 {id:'medieval_fantasy',label:'Medieval high fantasy',kind:'fantasy',capabilities:['historic','fantasy_magic','fantasy_beasts','marine'],species:['human','elf','dwarf','halfling','orc','goblin','dragonborn','tiefling'],attire:'Medieval-inspired linen, wool, leather and period metalwork; individual everyday outfits, not compulsory armor.',architecture:'Timber, stone, plaster, market lanes, workshops and taverns appropriate to the locality.',technology:'Premodern material culture; no modern streetwear, cars, electric appliances or modern city buildings.',magic:'Magic exists; exact methods and limits require local lore.',medium:'In-world portrait or magical likeness; the app interface does not establish smartphones or cameras.'},
 {id:'low_fantasy',label:'Low fantasy / historical adventure',kind:'historical',capabilities:['historic','marine'],species:['human'],attire:'Period linen, wool, leather and individually practical garments.',architecture:'Period stone/timber settlements and rural landscapes.',technology:'Premodern material culture; no modern gadgets or synthetic streetwear.',magic:'No magical capabilities established by this preset.',medium:'Period portrait or illustrated likeness; no implied modern camera.'},
 {id:'modern_fantasy',label:'Modern urban fantasy',kind:'modern',capabilities:['electricity','digital_networks','broadcast','motor_transport','industrial','clinical_care','higher_education','fantasy_magic'],species:['human','elf','vampire','werewolf'],attire:'Contemporary individual clothing with optional lore-supported supernatural details.',architecture:'Contemporary settlements appropriate to the reviewed location.',technology:'Contemporary technology; supernatural institutions require reviewed lore.',magic:'Magic exists; concealment and limits require local lore.',medium:'Contemporary photos or established magical imagery.'},
 {id:'spacefaring',label:'Spacefaring science fiction',kind:'spacefaring',capabilities:['electricity','digital_networks','broadcast','industrial','clinical_care','higher_education','starships','spaceport','orbital_habitats','synthetic_bodies','augmentation'],species:['human','alien_humanoid','android','robot_person','cyborg'],attire:'Setting-specific everyday garments; work and pressure suits only for appropriate occasions.',architecture:'Reviewed orbital, shipboard or planetary environments; no generic modern city default.',technology:'Spacefaring technology as explicitly enabled; no automatic magic.',magic:'No magic established.',medium:'In-world digital photographs or holographic captures.'},
 {id:'cyberpunk',label:'Cyberpunk',kind:'cyberpunk',capabilities:['electricity','digital_networks','broadcast','motor_transport','industrial','clinical_care','higher_education','augmentation','synthetic_bodies'],species:['human','cyborg','android'],attire:'Individual contemporary/futuristic clothing; neon and tactical costumes are optional.',architecture:'Reviewed dense urban or industrial environments; vary ordinary locations.',technology:'Digital networks and reviewed augmentation; no automatic starships.',magic:'No magic established.',medium:'Digital photos in the established setting.'}
] as const;
export function presetWorld(id:string):{world:PopulationWorld;guide:WorldGuide}|undefined {
 const p=WORLD_PRESETS.find(p=>p.id===id);return p?{world:{kind:p.kind,capabilities:[...p.capabilities],maxAdultAge:99,reviewed:true},guide:{...emptyWorldGuide(),species:p.species.map(id=>({...SPECIES_BY_ID.get(id)!})),attire:p.attire,architecture:p.architecture,technology:p.technology,magic:p.magic,medium:p.medium}}:undefined;
}
const short=(v:unknown,n=800)=>typeof v==='string'?v.trim().slice(0,n):'';
export function normalizeWorldGuide(raw:any):WorldGuide|undefined {
 if(!raw||raw.version!==1||!Array.isArray(raw.species))return undefined;
 if(raw.species.some((s:any)=>s?.requiredCapabilities!==undefined&&(!Array.isArray(s.requiredCapabilities)||s.requiredCapabilities.length>WORLD_CAPABILITIES.length||s.requiredCapabilities.some((c:any)=>!WORLD_CAPABILITIES.includes(c))||new Set(s.requiredCapabilities).size!==s.requiredCapabilities.length)))return undefined;
 const guide=emptyWorldGuide();
 if(raw.vocabulary!==undefined){if(!['automatic','custom'].includes(raw.vocabulary))return undefined;guide.vocabulary=raw.vocabulary;}
 if(raw.discovery){if(!['strict_reviewed','lore_adaptive','creative_discovery_opt_in'].includes(raw.discovery.mode)||!Number.isInteger(raw.discovery.creativePercent)||raw.discovery.creativePercent<0||raw.discovery.creativePercent>100||typeof raw.discovery.constraints!=='string'||raw.discovery.constraints.length>800)return undefined;guide.discovery={mode:raw.discovery.mode,creativePercent:raw.discovery.creativePercent,constraints:raw.discovery.constraints.trim()};}
 guide.species=raw.species.slice(0,80).flatMap((s:any)=>{const known=SPECIES_BY_ID.get(s?.id);return known?[{id:known.id,label:known.label,family:known.family,...(s.group?{group:known.group}:{}),...(s.classification?{classification:known.classification}:{}),appearance:short(s.appearance)||known.appearance,...(s.requiredCapabilities?{requiredCapabilities:[...s.requiredCapabilities]}:{}),...(Number.isInteger(s.minAdultAge)&&s.minAdultAge>=18&&s.minAdultAge<=9999?{minAdultAge:s.minAdultAge}:{})}]:/^custom_[a-z0-9_]{1,40}$/.test(s?.id)&&short(s.label,80)&&short(s.appearance)?[{id:s.id,label:short(s.label,80),family:'custom',appearance:short(s.appearance),...(s.requiredCapabilities?{requiredCapabilities:[...s.requiredCapabilities]}:{}),...(Number.isInteger(s.minAdultAge)&&s.minAdultAge>=18&&s.minAdultAge<=9999?{minAdultAge:s.minAdultAge}:{})}]:[];}).filter((s:SpeciesDefinition,i:number,a:SpeciesDefinition[])=>a.findIndex(x=>x.id===s.id)===i);
 for(const key of WORLD_PRESENTATION_KEYS)guide[key]=short(raw[key]);
 guide.intimacyIds=(Array.isArray(raw.intimacyIds)?raw.intimacyIds:[]).filter((id:unknown)=>typeof id==='string'&&ADULT_PREFERENCE_BY_ID.has(id)).map((id:string)=>ADULT_PREFERENCE_BY_ID.get(id)!.id).filter((id:string,i:number,a:string[])=>a.indexOf(id)===i);
 return guide;
}
export function worldVisualGuide(g?:WorldGuide):string {return g?[g.attire&&'Clothing: '+g.attire,g.architecture&&'Environment: '+g.architecture,g.technology&&'Material culture: '+g.technology,g.magic&&'Magic: '+g.magic,g.medium&&'Image medium: '+g.medium].filter(Boolean).join('\n'):'';}
const genreCache=new Map<string,readonly string[]>();
export function worldGenreValues(g:WorldGuide|undefined,w:PopulationWorld){
 const automatic=g?.vocabulary==='automatic',key=JSON.stringify([[...new Set(w.capabilities)].sort(),automatic,automatic?[]:[...new Set(g?.intimacyIds||[])].sort()]);
 let values=genreCache.get(key);if(!values){const ids=new Set(g?.intimacyIds);values=eligibleGenreOptions(w).filter(o=>automatic||ids.has(o.id)).map(o=>o.label);genreCache.set(key,values);if(genreCache.size>64)genreCache.delete(genreCache.keys().next().value!);}return [...values];
}
export function speciesCompatible(s:SpeciesDefinition,w:PopulationWorld):boolean {
 const alternatives=speciesRequirements(s.id);
 return (!s.requires||w.capabilities.includes(s.requires))&&(!s.requiredCapabilities||s.requiredCapabilities.every(c=>w.capabilities.includes(c)))&&(!alternatives.length||alternatives.some(all=>all.every(cap=>w.capabilities.includes(cap))));
}
const speciesNameIndex=[...SPECIES_CATALOG].sort((a,b)=>b.label.length-a.label.length).map(species=>({species,pattern:new RegExp('^\\s*(?:(?:fully adult|adult|sentient|an?|species)[: ]+)*'+species.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[ ,;:.])','i')}));
export function knownSpeciesIn(text:string):SpeciesDefinition|undefined {return speciesNameIndex.find(({pattern})=>pattern.test(text))?.species;}


export function extraWorldOptions(d:{worldGuide?:WorldGuide;worldFields:Array<{key:string;options:string[]}>;populationWorld?:PopulationWorld}):Record<string,string[]> {
 const result=Object.fromEntries(d.worldFields.map(w=>[w.key,w.options]));
 if(d.worldGuide?.species.length)result.species=d.worldGuide.species.map(s=>s.label);
 if(d.worldGuide&&d.populationWorld){const values=worldGenreValues(d.worldGuide,d.populationWorld);if(values.length)result.kinks=values;}
 return result;
}
export function assertWorldGuide(raw:any):WorldGuide {
 const guide=normalizeWorldGuide(raw);
 if(!guide||!Array.isArray(raw.species)||raw.species.length>80||guide.species.length!==raw.species.length||raw.species.some((s:any)=>typeof s?.appearance!=='string'||!s.appearance.trim()||s.appearance.length>800||typeof s.label!=='string'||s.label.length>80||s.minAdultAge!==undefined&&(!Number.isInteger(s.minAdultAge)||s.minAdultAge<18||s.minAdultAge>9999))||WORLD_PRESENTATION_KEYS.some(k=>typeof raw[k]!=='string'||raw[k].length>800)||!Array.isArray(raw.intimacyIds)||raw.intimacyIds.some((id:unknown)=>typeof id!=='string'||!ADULT_PREFERENCE_BY_ID.has(id)))throw new Error('Review incomplete, duplicate or oversized world/species details before saving. Existing settings were kept.');
 return guide;
}
