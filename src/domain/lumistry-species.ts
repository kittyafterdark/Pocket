import {SPECIES_ROWS} from './lumistry-species-data.js';
import type {SpeciesDefinition} from './lumistry-world-catalog.js';
import type {WorldCapability} from './lumistry-world-core.js';
import type {MacroResolver} from './lumistry-catalog.js';
export const SPECIES_CATALOG:readonly SpeciesDefinition[]=SPECIES_ROWS.map(s=>({id:s.id,label:s.name,family:s.family,appearance:s.description,group:s.group,classification:s.classification}));
/** Explicit alternative capability sets. A reviewed population establishes ordinary
 * biological/folkloric forms; technology-dependent bodies also require infrastructure.
 * No broad family/era rule turns a modern elf into a medieval person. */
const requirements:Record<string,WorldCapability[][]>={
 android:[['synthetic_bodies']],robot_person:[['synthetic_bodies']],cyborg:[['augmentation']],holographic_person:[['digital_networks']],
 modular_robot_person:[['synthetic_bodies']],soft_robot_person:[['synthetic_bodies']],nanite_person:[['synthetic_bodies']],
 distributed_ai_person:[['digital_networks']],virtual_avatar_person:[['digital_networks']],
 biomechanical_person:[['augmentation']],vatgrown_person:[['synthetic_bodies','clinical_care']],clone_person:[['synthetic_bodies','clinical_care']],
 energy_person:[['fantasy_magic'],['synthetic_bodies']],plasma_person:[['fantasy_magic'],['synthetic_bodies']],gas_person:[['fantasy_magic'],['synthetic_bodies']],
 clockwork_person:[['industrial'],['fantasy_magic']],
};
export const speciesRequirements=(id:string):WorldCapability[][]=>requirements[id]||[];
export const SPECIES_POLICY={version:'species-policy-1',families:{ordinary:30,fantasy:25,demihuman:15,anthropomorphic:15,science_fiction:10,heritage:5,custom:5},cooldown:{window:12,exact:.1,family:.8},creativePercent:10} as const;
function weighted<T>(rows:readonly T[],weight:(x:T)=>number,random:()=>number):T {
 const total=rows.reduce((sum,x)=>sum+weight(x),0);if(!rows.length||!Number.isFinite(total)||total<=0)throw new Error('No eligible species remains.');let n=Math.min(.999999999,Math.max(0,random()))*total;return rows.find(x=>(n-=weight(x))<0)||rows.at(-1)!;
}
export async function selectSpecies(pool:SpeciesDefinition[],recent:SpeciesDefinition[],resolve:MacroResolver,scope:Parameters<MacroResolver>[1],random:()=>number,preference:(s:SpeciesDefinition)=>number=()=>1):Promise<SpeciesDefinition> {
 const history=recent.slice(-SPECIES_POLICY.cooldown.window),families=[...new Set(pool.map(s=>s.family))];
 const family=weighted(families,f=>(SPECIES_POLICY.families[f as keyof typeof SPECIES_POLICY.families]||5)*SPECIES_POLICY.cooldown.family**history.filter(s=>s.family===f).length*Math.max(...pool.filter(s=>s.family===f).map(preference)),random);
 const eligible=pool.filter(s=>s.family===family),weight=(s:SpeciesDefinition)=>SPECIES_POLICY.cooldown.exact**history.filter(p=>p.id===s.id).length*preference(s);
 if(eligible.every(s=>weight(s)===weight(eligible[0]))){const ids=eligible.map(s=>s.id);const result=await resolve(`{{pick::${ids.join('::')}}}`,scope);if(result.diagnostics.length||!ids.includes(result.text.trim()))throw new Error('Species selection returned an ineligible ID. No model call was made.');return structuredClone(eligible.find(s=>s.id===result.text.trim())!);}
 return structuredClone(weighted(eligible,weight,random));
}
/** Only templates selected for this task; the whole library never enters generation. */
export function speciesShortlist(text:string,enabled:SpeciesDefinition[]=[],limit=24) {
 const tokens=new Set(text.toLowerCase().match(/[a-z]{3,}/g)||[]);
 const scored=SPECIES_CATALOG.map(s=>({s,score:s.label.toLowerCase().split(/[^a-z]+/).filter(t=>tokens.has(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 return [...new Map([...scored.map(x=>x.s),...enabled].map(s=>[s.id,s])).values()].slice(0,limit).map(s=>({id:s.id,label:s.label}));
}
export function speciesAnatomyGuidance(s:SpeciesDefinition):string {
 return s.appearance+' Establish the individual body plan, limb configuration and current form within the existing physiology and height/build fields. Keep humanlike demi-human faces distinct from full animal heads. State concrete absent features where appropriate; no automatic human face, skin, hair or two-legged silhouette. Outfits fit the actual body; current form stays stable until an established change.';
}

/** Concrete template anatomy, separate from variable individual face/outfit detail.
 * Edited world definitions take precedence over bundled morphology. */
export function speciesBodyPlan(s:SpeciesDefinition,authored:string):string {
 if(s.appearance!==SPECIES_CATALOG.find(v=>v.id===s.id)?.appearance)return authored;
 if(s.id==='centaur')return 'Adult humanoid torso joined to an equine lower body with four equine legs';
 if(['naga','lamia'].includes(s.id))return 'Adult humanoid upper body joined to a serpentine lower body';
 if(s.family==='demihuman')return 'Mature humanlike face and humanlike body with the accepted additional features';
 return authored;
}
