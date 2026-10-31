import {AESTHETIC_ROWS} from './lumistry-aesthetics-data.js';
import type {PopulationWorld} from './lumistry-world-core.js';
import type {MacroResolver} from './lumistry-catalog.js';
export const AESTHETIC_VERSION='aesthetics-1';
export const AESTHETIC_POLICY={version:'aesthetic-policy-1',engagement:{unlabelled:30,subtle:30,signature:20,mixed:10,contextual:7,experimental:3},families:{everyday_practical:40,academic_retro:15,alternative:15,contemporary_expressive:20,natural_romantic:10},rarity:{common:4,uncommon:2,niche:1},cooldown:{window:12,exact:.1,cluster:.4,family:.8}} as const;
export type Aesthetic=typeof AESTHETIC_ROWS[number];
export type Engagement=keyof typeof AESTHETIC_POLICY.engagement;
export interface AestheticSelection {catalogVersion:typeof AESTHETIC_VERSION;policyVersion:typeof AESTHETIC_POLICY.version;engagement:Engagement;primary:string;secondary?:string;guidance:string;example:string;}
export const AESTHETICS:readonly Aesthetic[]=AESTHETIC_ROWS;
const byId=new Map(AESTHETICS.map(r=>[r.id as string,r]));
// Explicit reviewed garment/material translations. These are motifs, never imported modern labels.
const adaptations:Record<string,string>={
 sty_unlabelled:'Ordinary setting-native garments, repaired favorites and weather layers; no named aesthetic.',
 sty_comfort_casual:'Soft linen or wool tunics, loose trousers or skirts, worn leather shoes; comfort takes priority.',
 sty_normcore:'Plain linen or wool garments and practical leather shoes without a deliberate fashion identity.',
 sty_modern_minimalist:'Simple setting-native cuts, undyed linen and restrained wool layers, unadorned leather accessories.',
 sty_smart_casual:'A neat linen shirt or tunic, well-kept wool outer layer and practical leather footwear.',
 sty_classic_tailoring:'Fitted wool coats or waistcoats, linen shirts and leather footwear appropriate to the setting.',
 sty_heritage_workwear:'Durable linen and wool work layers, leather boots and functional repairs; no modern denim requirement.',
 sty_outdoor_practical:'Weatherproof wool cloaks, layered linen and leather boots; no synthetic performance equipment.',
 sty_dark_academia:'Dark wool layers, linen collars, worn leather satchels and restrained scholarly motifs; no modern university assumptions.',
 sty_light_academia:'Pale linen layers, soft wool and a simple leather satchel; scholarly motifs without imported institutions.',
 sty_goth_classic:'Dark wool or linen, silver or iron ornaments, restrained lace where available; no assumed subculture membership.',
 sty_romantic_goth:'Dark velvet where available, lace or embroidered linen, long flowing layers and antique-looking metal ornaments.',
 sty_whimsigoth:'Dark flowing wool or linen, embroidered celestial motifs and small metal ornaments; no manufactured modern prints.',
 sty_cottagecore:'Linen aprons, wool skirts or loose trousers, botanical embroidery and practical leather shoes.',
 sty_bohemian:'Layered linen, wool wraps, handwoven patterns and handmade beads; no imported cultural identity.',
 sty_fairycore:'Light linen layers, botanical embroidery and leaf-shaped handmade ornaments; no invented wings or anatomy.',
 sty_earthy_artisan:'Undyed linen, earth-toned wool, leather apron or handmade accessories appropriate to the occasion.',
 sty_coastal_relaxed:'Loose linen, light wool layers and simple sandals or shoes suitable for the local climate.',
 sty_soft_romantic:'Soft linen or wool, curved draping and subtle floral embroidery; no obligatory gender expression.',
 sty_coquette:'Small ribbons, restrained lace or embroidered linen and soft layered garments; no inferred age or submissiveness.',
};
const pairs=[['goth_classic','classic_tailoring'],['dark_academia','modern_minimalist'],['y2k','streetwear'],['heritage_workwear','grunge'],['cottagecore','earthy_artisan'],['cybercore','techwear'],['nightlife_glam','soft_romantic']].map(p=>p.map(id=>'sty_'+id));
// Reviewed visual overlap, separate from the more restrictive mixing allowlist.
const clusters=[['unlabelled','comfort_casual','normcore','modern_minimalist','smart_casual','nineties_minimal'],['classic_tailoring','understated_luxury','dark_academia','light_academia','ivy_prep'],['heritage_workwear','outdoor_practical','gorpcore','western_inspired'],['athleisure','collegiate_sport','skater'],['midcentury_vintage','seventies_retro','eighties_retro'],['y2k','mcbling','scene','indie_sleaze'],['goth_classic','romantic_goth','industrial','metal_inspired','whimsigoth'],['punk','grunge','emo'],['cybergoth','techwear','cybercore'],['streetwear','maximalist','avant_garde'],['pastel_goth','coquette','balletcore','kawaii_pastel'],['cottagecore','bohemian','fairycore','earthy_artisan','coastal_relaxed','soft_romantic'],['nightlife_glam']].map(c=>c.map(id=>'sty_'+id));
export const styleCluster=(id:string)=>String(clusters.findIndex(c=>c.includes(id)));

export function styleGuidance(r:Aesthetic,w:PopulationWorld):string|undefined {
 if(w.kind==='historical'||w.kind==='fantasy'||w.kind==='custom'&&!w.capabilities.includes('industrial'))return adaptations[r.id];
 const tag={modern:'M',cyberpunk:'C',spacefaring:'S',custom:'M'}[w.kind as 'modern'|'cyberpunk'|'spacefaring'|'custom'] as 'M'|'C'|'S';
 if(r.worldFit[tag]==='A')return adaptations[r.id];
 // Technical/retro labels require modern production; adaptation flags never grant technology.
 if(r.id!=='sty_unlabelled'&&!w.capabilities.includes('industrial'))return adaptations[r.id];
 return `${r.details['Color and texture vocabulary']} ${r.details['Garments and silhouette']} ${r.details['Grooming / accessories']} ${r.details['Ordinary-life application']}`;
}
function pick<T>(values:readonly T[],weight:(v:T)=>number,random:()=>number):T {
 const weights=values.map(weight),total=weights.reduce((a,b)=>a+b,0);if(!values.length||!Number.isFinite(total)||total<=0)throw new Error('No eligible aesthetic choices; no provider request was made.');
 let n=Math.min(.999999999999,Math.max(0,random()))*total;return values[weights.findIndex(v=>(n-=v)<0)]||values.at(-1)!;
}
export async function selectAesthetic(world:PopulationWorld,recent:readonly AestheticSelection[],resolve:MacroResolver,scope:Parameters<MacroResolver>[1],random=Math.random):Promise<AestheticSelection> {
 const engagement=pick(Object.keys(AESTHETIC_POLICY.engagement) as Engagement[],k=>AESTHETIC_POLICY.engagement[k],random);
 let primary=byId.get('sty_unlabelled')!;
 if(engagement!=='unlabelled'){
  const pool=AESTHETICS.filter(r=>r.id!=='sty_unlabelled'&&styleGuidance(r,world)!==undefined);
  if(!pool.length)throw new Error('No reviewed aesthetic adaptations fit the world; no provider request was made.');
  const history=recent.slice(-12).map(s=>[s.primary,...(s.secondary?[s.secondary]:[])]);
  const occurrences=(test:(id:string)=>boolean)=>history.filter(ids=>ids.some(test)).length;
  const family=pick([...new Set(pool.map(r=>r.family))],f=>(AESTHETIC_POLICY.families[f as keyof typeof AESTHETIC_POLICY.families]||1)*(.8**occurrences(id=>byId.get(id)?.family===f)),random);
  const familyPool=pool.filter(r=>r.family===family);
  const tier=pick([...new Set(familyPool.map(r=>r.tier))],t=>AESTHETIC_POLICY.rarity[t as keyof typeof AESTHETIC_POLICY.rarity]||1,random);
  const tierPool=familyPool.filter(r=>r.tier===tier);
  const weight=(r:Aesthetic)=>(.1**occurrences(id=>id===r.id))*(.4**occurrences(id=>styleCluster(id)===styleCluster(r.id)));
  if(tierPool.every(r=>weight(r)===weight(tierPool[0]))){
   const ids=tierPool.map(r=>r.id as string),result=await resolve(`{{pick::${ids.join('::')}}}`,scope);
   if(result.diagnostics.length||!ids.includes(result.text.trim()))throw new Error('Aesthetic macro returned an unresolved or ineligible ID; no provider request was made.');
   primary=byId.get(result.text.trim())!;
  }else primary=pick(tierPool,weight,random);
 }
 const secondaryPool=AESTHETICS.filter(r=>r.id!==primary.id&&pairs.some(p=>p.includes(r.id)&&p.includes(primary.id))&&styleGuidance(r,world)!==undefined);
 let secondary:Aesthetic|undefined;
 if(secondaryPool.length&&(engagement==='mixed'||engagement==='contextual'&&random()<.25||engagement==='experimental'&&random()<.5)){
  const ids=secondaryPool.map(r=>r.id as string),result=await resolve(`{{pick::${ids.join('::')}}}`,scope);
  if(result.diagnostics.length||!ids.includes(result.text.trim()))throw new Error('Secondary aesthetic macro returned an ineligible ID; no provider request was made.');secondary=byId.get(result.text.trim());
 }
 const adapted=world.kind==='historical'||world.kind==='fantasy'||world.kind==='custom'&&!world.capabilities.includes('industrial')||primary.worldFit[world.kind==='spacefaring'?'S':'M']==='A';
 const guidance=`${engagement} influence. ${styleGuidance(primary,world)}${secondary?' A restrained secondary accent or separate occasion preference: '+styleGuidance(secondary,world):''} Use only the supplied motifs. Work safety, uniforms, weather, anatomy and accepted identity take priority. Presentation establishes no personality, wealth, consent, occupation or subculture membership. ${adapted?'Use these setting-native motifs without imported fashion labels or institutions.':primary.details['Distinguish from neighbors']} ${primary.details['Never infer']}`;
 const example=(world.kind==='historical'||world.kind==='fantasy'||world.kind==='custom')?styleGuidance(primary,world)!:primary.details['Possible dating-gallery expression'];
 return {catalogVersion:AESTHETIC_VERSION,policyVersion:AESTHETIC_POLICY.version,engagement,primary:primary.id,secondary:secondary?.id,guidance,example};
}
export function validAesthetic(v:any,w:PopulationWorld):v is AestheticSelection {
 return v?.catalogVersion===AESTHETIC_VERSION&&v.policyVersion===AESTHETIC_POLICY.version&&v.engagement in AESTHETIC_POLICY.engagement&&byId.has(v.primary)&&styleGuidance(byId.get(v.primary)!,w)!==undefined&&typeof v.guidance==='string'&&v.guidance.length<8000&&typeof v.example==='string'&&(!v.secondary||byId.has(v.secondary)&&pairs.some(p=>p.includes(v.primary)&&p.includes(v.secondary))&&styleGuidance(byId.get(v.secondary)!,w)!==undefined)&&(v.engagement==='unlabelled'?v.primary==='sty_unlabelled'&&!v.secondary:v.primary!=='sty_unlabelled')&&(!v.secondary||['mixed','contextual','experimental'].includes(v.engagement));
}
