import type {DatingProfile,DatingState} from './lumistry.js';
export interface DatingLocation {mode:'radius'|'setting';settingKey?:string;}
export const UNKNOWN_DISTANCE_KM=100001;
/** Scope identity is local metadata, never a geographical radius or knowledge grant. */
export function settingKeyFor(context:string,kind:string):string|undefined {
 const source=context.trim().replace(/\s+/g,' ').toLowerCase();if(!source)return undefined;
 const value=kind+'\n'+source;const hash=(seed:number)=>{let n=seed;for(let i=0;i<value.length;i++)n=Math.imul(n^value.charCodeAt(i),16777619);return (n>>>0).toString(16).padStart(8,'0')};
 return 'setting_'+hash(2166136261)+hash(333555777);
}
export function reviewedSettingKey(d:Pick<DatingState,'worldContext'|'worldReviewedAt'|'populationWorld'|'settingKey'>):string|undefined {
 return d.worldContext.trim()&&(d.worldReviewedAt||d.populationWorld?.reviewed)?d.settingKey||settingKeyFor(d.worldContext,d.populationWorld?.kind||'modern'):undefined;
}
export function normalizeDatingLocation(v:any):DatingLocation|undefined {
 if(!v||!['radius','setting'].includes(v.mode)||v.settingKey!==undefined&&!/^setting_[a-f0-9]{16}$/.test(v.settingKey)||v.mode==='setting'&&!v.settingKey)return undefined;
 return {mode:v.mode,...(v.settingKey?{settingKey:v.settingKey}:{})};
}
export function profileSettingKey(p:DatingProfile):string|undefined {
 return p.location?.settingKey||(p.creationPlan?settingKeyFor(p.creationPlan.worldContext,p.creationPlan.world.kind):undefined);
}
export function hasKnownDistance(p:DatingProfile):boolean {return p.location?.mode!=='setting'&&Number.isFinite(p.distanceKm)&&p.distanceKm>=0&&p.distanceKm<UNKNOWN_DISTANCE_KM;}
export function datingLocationLabel(p:DatingProfile):string {return p.location?.mode==='setting'?'In this setting · distance unknown':hasKnownDistance(p)?`${p.distanceKm} km away`:'Distance not established';}
export function plannedLocation(d:DatingState,random:()=>number):{location:DatingLocation;distanceKm:number} {
 const settingKey=reviewedSettingKey(d);
 if(d.filters.distanceMode==='setting'){
  if(!settingKey||settingKey!==d.filters.settingKey)throw new Error('Review the current world in Settings before choosing Anywhere in this setting. No model request was made.');
  return {location:{mode:'setting',settingKey},distanceKm:UNKNOWN_DISTANCE_KM};
 }
 return {location:{mode:'radius',...(settingKey?{settingKey}:{})},distanceKm:Math.round(random()*d.filters.maxKm*10)/10};
}
/** A discovery scope is not evidence of physical proximity or an encounter. */
export function nearbyEncounterPossible(p:DatingProfile,d:DatingState):boolean {
 const current=reviewedSettingKey(d),member=profileSettingKey(p);
 return hasKnownDistance(p)&&p.distanceKm<=d.filters.maxKm&&(!current||!member||current===member);
}
