// Lightweight world contracts. No occupation/species/adult catalog imports.
export const WORLD_CAPABILITIES=['historic','electricity','digital_networks','broadcast','motor_transport','aviation','railways','industrial','clinical_care','higher_education','large_retail','marine','snow','fantasy_magic','fantasy_beasts','fantasy_portals','augmentation','synthetic_bodies','memory_tech','drones','orbital_habitats','starships','spaceport'] as const;
export type WorldCapability=typeof WORLD_CAPABILITIES[number];
export interface PopulationWorld {kind:'modern'|'historical'|'fantasy'|'cyberpunk'|'spacefaring'|'custom';capabilities:WorldCapability[];maxAdultAge:number;reviewed?:true;}
const contemporary:WorldCapability[]=['electricity','digital_networks','broadcast','motor_transport','aviation','railways','industrial','clinical_care','higher_education','large_retail','marine'];
export function worldDefaults(kind:PopulationWorld['kind']):PopulationWorld {
 return {kind,capabilities:kind==='modern'||kind==='cyberpunk'? [...contemporary]:kind==='historical'||kind==='fantasy'?['historic','marine']:kind==='spacefaring'?['electricity','digital_networks','broadcast','industrial','clinical_care','higher_education']:[],maxAdultAge:99};
}
/** Known capability profiles are explicit settings; free prose never grants magic or starships. */
export function normalizePopulationWorld(raw:any,context=''):PopulationWorld {
 const kinds=['modern','historical','fantasy','cyberpunk','spacefaring','custom'];
 // Negated technology is not evidence of its presence. Prefer specific setting
 // cues over a generic "modern" occurring inside e.g. "no modern technology".
 const inferred:PopulationWorld['kind']=!context.trim()?'modern':/\bcyberpunk\b/i.test(context)?'cyberpunk':/\b(spacefaring|science fiction)\b/i.test(context)?'spacefaring':/\b(fantasy|medieval)\b/i.test(context)?'fantasy':/\b(historical|premodern|pre-industrial)\b/i.test(context)?'historical':/\b(modern|contemporary)\b/i.test(context)&&! /\b(no|without|not)\s+(?:any\s+)?(?:modern|contemporary)\b/i.test(context)?'modern':'custom';
 // Recover only the old, untouched modern default in explicitly premodern
 // contexts. Never strip customized capabilities or a reviewed world profile.
 const legacyModern=raw?.kind==='modern'&&raw?.reviewed!==true&&['fantasy','historical'].includes(inferred)&&/\b(no modern technology|pre-industrial|premodern)\b/i.test(context)&&Array.isArray(raw?.capabilities)&&raw.capabilities.length===contemporary.length&&contemporary.every(c=>raw.capabilities.includes(c));
 const kind:PopulationWorld['kind']=legacyModern?inferred:kinds.includes(raw?.kind)?raw.kind:inferred;
 const defaults=worldDefaults(kind);
 return {kind,capabilities:!legacyModern&&Array.isArray(raw?.capabilities)?[...new Set(raw.capabilities.filter((v:any)=>WORLD_CAPABILITIES.includes(v))) ] as WorldCapability[]:defaults.capabilities,maxAdultAge:Number.isInteger(raw?.maxAdultAge)?Math.max(18,Math.min(9999,raw.maxAdultAge)):99,...(raw?.reviewed===true?{reviewed:true as const}:{})};
}
