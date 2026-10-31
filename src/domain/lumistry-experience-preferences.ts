import {ADULT_PREFERENCES,ADULT_PREFERENCE_BY_ID,preferenceEligible,type AdultPreferenceTerm} from './lumistry-adult-preferences.js';
import type {PopulationWorld} from './lumistry-world-core.js';
export const THEME_POLICY='experience-themes-1';
export const THEME_GROUPS=[
 {id:'everyday',label:'Everyday attraction & flirting',categories:['core_flirtation']},
 {id:'dynamics',label:'Power, restraint & negotiated dynamics',categories:['negotiated_dynamics','explicit_power_and_protocol','advanced_consent_dynamics']},
 {id:'nonhuman',label:'Nonhuman features, affection & senses',categories:['nonhuman_aesthetics','nonhuman_affection','modern_multispecies','monster_and_body_fantasy','strange_senses_anatomy']},
 {id:'fantasy',label:'Fantasy, magic & supernatural themes',categories:['fantasy_folklore','fantasy_magic','dark_fantasy_gothic','arcane_contracts_gothic']},
 {id:'costume',label:'Costume, period & setting roleplay',categories:['historical_romance','setting_specific_roleplay']},
 {id:'scifi',label:'Science fiction, digital & synthetic themes',categories:['cyber_synthetic','space_alien','cybernetic_alien_extreme','cyber_permissions_and_synthetic']},
 {id:'transformation',label:'Transformation & mutable bodies',categories:['metamorphosis_mutable_bodies']},
 {id:'biology',label:'Alien biology & unusual courtship',categories:['alien_biology_cycles']},
 {id:'uncanny',label:'Uncanny, cosmic & other worlds',categories:['other_universes','eldritch_uncanny','cosmic_multiversal']},
] as const;
export type ThemeGroup=typeof THEME_GROUPS[number]['id'];
const originalCostume=new Set(['fantasy_costume','fantasy_armor','fantasy_power']);
export function termGroup(t:AdultPreferenceTerm):ThemeGroup {
 if(t.category==='original_genre_terms')return originalCostume.has(t.id)?'costume':t.id.startsWith('fantasy_')?'fantasy':t.id.startsWith('scifi_')?'scifi':'nonhuman';
 const group=THEME_GROUPS.find(g=>(g.categories as readonly string[]).includes(t.category));
 if(!group)throw new Error('Unreviewed adult theme category: '+t.category);
 return group.id;
}
export const TERM_GROUP_BY_ID=new Map(ADULT_PREFERENCES.map(t=>[t.id,termGroup(t)]));
export type ContentLevel='nonsexual'|'suggestive'|'explicit';
export interface ExperiencePreferences {version:1;paused?:boolean;text:ContentLevel|'inherit';themes:'compatible'|'selected';groups:ThemeGroup[];avoid:ThemeGroup[];boundaries:string;frequency?:0|20|50;photos:{level:'inherit'|'ordinary'|'suggestive'|'explicit';useTextGroups:boolean;groups:ThemeGroup[];boundaries:string};}
export const defaultExperiencePreferences=():ExperiencePreferences=>({version:1,text:'inherit',themes:'compatible',groups:[],avoid:[],boundaries:'',photos:{level:'inherit',useTextGroups:true,groups:[],boundaries:''}});
const groupIds=new Set<string>(THEME_GROUPS.map(g=>g.id));
export function normalizeExperiencePreferences(v:any):ExperiencePreferences|undefined {
 if(v===undefined)return undefined;
 if(v.paused!==undefined&&typeof v.paused!=='boolean')return undefined;
 if(v?.version!==1||!['inherit','nonsexual','suggestive','explicit'].includes(v.text)||!['compatible','selected'].includes(v.themes)||v.frequency!==undefined&&![0,20,50].includes(v.frequency)||typeof v.boundaries!=='string'||v.boundaries.length>2000||!['inherit','ordinary','suggestive','explicit'].includes(v.photos?.level)||typeof v.photos.useTextGroups!=='boolean'||typeof v.photos.boundaries!=='string'||v.photos.boundaries.length>2000)return undefined;
 for(const values of [v.groups,v.avoid,v.photos.groups])if(!Array.isArray(values)||values.length>9||values.some(id=>!groupIds.has(id))||new Set(values).size!==values.length)return undefined;
 return structuredClone(v);
}
export function assertExperiencePreferences(v:any):ExperiencePreferences {const p=normalizeExperiencePreferences(v);if(!p)throw new Error('Review invalid experience preferences; saved settings were kept.');return p;}
export function allowedTheme(t:AdultPreferenceTerm,p:ExperiencePreferences,world:PopulationWorld,photo=false):boolean {
 const g=termGroup(t),groups=photo&&!p.photos.useTextGroups?p.photos.groups:p.themes==='selected'?p.groups:null;
 return !p.paused&&preferenceEligible(t,world)&&!p.avoid.includes(g)&&(!groups||groups.includes(g))&&(photo?p.photos.level!=='ordinary':p.text!=='nonsexual');
}
const hash=(value:string)=>{let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export interface ThemeInspiration {version:1;policy:typeof THEME_POLICY;id:string;group:ThemeGroup;guidance:string;}
/** Optional inspiration, never an assignment of consent or a compulsory private inventory. */
export function selectThemeInspiration(p:ExperiencePreferences|undefined,world:PopulationWorld,identity:string):ThemeInspiration|undefined {
 if(!p||p.paused||p.text==='nonsexual'||!p.frequency||hash(identity+'chance')%100>=p.frequency)return;
 // Anatomical illustrations are not evidence. Trait-dependent seeds wait for established individual facts.
 const pool=ADULT_PREFERENCES.filter(t=>allowedTheme(t,p,world)&&!t.traitConfirmation);
 if(!pool.length)return;
 const t=pool[hash(identity+'theme')%pool.length];return {version:1,policy:THEME_POLICY,id:t.id,group:termGroup(t),guidance:t.label+': '+t.description};
}
export function normalizeThemeInspiration(v:any):ThemeInspiration|undefined {
 const t=ADULT_PREFERENCE_BY_ID.get(v?.id);return v?.version===1&&v.policy===THEME_POLICY&&t&&v.group===termGroup(t)&&v.guidance===t.label+': '+t.description?structuredClone(v):undefined;
}
export function experienceContentGuidance(p:ExperiencePreferences|undefined,photo=false):string|undefined {
 if(!p)return;
 const level=p.paused?(photo?'ordinary':'nonsexual'):photo?p.photos.level:p.text;
 const groups=photo&&!p.photos.useTextGroups?p.photos.groups:p.themes==='selected'?p.groups:null;
 const names=(ids:ThemeGroup[])=>THEME_GROUPS.filter(g=>ids.includes(g.id)).map(g=>g.label).join('; ');
 return [
  'Operator content preferences, not knowledge or personal interests of any character. Preserve accepted identities and privacy; do not announce these settings.',
  `For ${photo?'new image descriptions and rendering':'new writing'}: ${level==='inherit'?'retain the existing content level; choices in another channel do not enable more explicit content':level==='nonsexual'||level==='ordinary'?'ordinary nonsexual portrayal':level==='suggestive'?'flirting/suggestive portrayal; no graphic sexual detail':'explicit adult themes may appear only when relevant and consistent with participants’ actual boundaries'}.`,
  groups?'Permitted adult-theme groups: '+(names(groups)||'none')+'.':undefined,
  p.avoid.length?'Avoid sexualised portrayal of these groups: '+names(p.avoid)+'. Neutral anatomy and existing facts remain intact; do not invent contradictory facts.':undefined,
  !photo&&p.frequency===0?'Do not proactively introduce adult themes; respond only when the actual conversation raises them, within the permitted content level and boundaries.':undefined,
  p.boundaries?'Additional operator boundaries: '+p.boundaries:undefined,
  photo&&p.photos.boundaries?'Additional photo boundaries: '+p.photos.boundaries:undefined,
  'Available vocabulary grants no permission, interest, public disclosure or event. Never infer interests from species or occupation.',
 ].filter(Boolean).join('\n');
}
export function conversationThemeOpportunity(p:ExperiencePreferences|undefined,world:PopulationWorld,messages:Array<{id:string;sender:string}>,key:string):ThemeInspiration|undefined {
 const settled=messages.filter(m=>m.sender!=='system');if(settled.length<2||settled.length%8!==2)return;
 return selectThemeInspiration(p,world,key+':'+settled.at(-1)!.id);
}
export function themeConflicts(fields:Record<string,{mode:string;value:string}>,p:ExperiencePreferences|undefined,world:PopulationWorld):string[] {
 if(!p||fields.kinks?.mode!=='required')return [];
 if(p.paused||p.text==='nonsexual')return ['Required kink filters conflict with nonsexual content preferences. Edit the requirement or writing level; no filter was weakened.'];
 const alternatives=fields.kinks.value.split(',').map(s=>s.trim()).filter(Boolean);
 if(alternatives.some(value=>{const term=ADULT_PREFERENCES.find(t=>t.label.toLowerCase()===value.toLowerCase());return !term||allowedTheme(term,p,world);}))return [];
 return alternatives.length?['Required kink filters conflict with your content preferences or world. Edit the requirement or your allowed themes; no filter was weakened.']:[];
}
/** Rendering direction is concise and never substitutes for literal body/identity descriptions. */
export function imageContentGuidance(p:ExperiencePreferences|undefined):string|undefined {
 if(!p)return;
 if(p.paused)return 'Adult themes are paused for new images. Use ordinary nonsexual imagery. Preserve canonical anatomy and existing identities; do not rewrite past photos.';
 const groups=p.photos.useTextGroups?(p.themes==='selected'?p.groups:null):p.photos.groups;
 return ['Content direction: '+(p.photos.level==='inherit'?'retain existing photo content; writing choices do not enable more explicit imagery':p.photos.level==='ordinary'?'ordinary nonsexual image':p.photos.level==='suggestive'?'suggestive, without graphic sexual detail':'explicit adult portrayal only when established and appropriate')+'.',groups?'Permitted adult themes: '+(THEME_GROUPS.filter(g=>groups.includes(g.id)).map(g=>g.label).join('; ')||'none')+'.':undefined,p.avoid.length?'Avoid sexualised themes: '+THEME_GROUPS.filter(g=>p.avoid.includes(g.id)).map(g=>g.label).join('; ')+'. Neutral physical features remain unchanged.':undefined,p.boundaries||undefined,p.photos.boundaries||undefined].filter(Boolean).join('\n');
}
export function replyContentGuidance(p:ExperiencePreferences|undefined):string|undefined {
 if(!p)return;
 if(p.paused)return experienceContentGuidance(p)+'\nAdult themes are paused for both message prose and any new photo descriptions: ordinary nonsexual imagery only. Existing anatomy, personal facts and history stay intact.';
 const base=experienceContentGuidance(p)!.replace('For new writing:','For message prose:');
 const groups=p.photos.useTextGroups?null:p.photos.groups;
 return base+'\nPhoto descriptions use their separate '+(p.photos.level==='inherit'?'existing photo behaviour (no new explicitness permission)':p.photos.level+' level')+'; global avoided themes and boundaries also apply. '+(groups?'Photo adult-theme groups: '+(THEME_GROUPS.filter(g=>groups.includes(g.id)).map(g=>g.label).join('; ')||'none')+'. ':'')+(p.photos.boundaries?'Additional photo boundaries: '+p.photos.boundaries:'');
}
