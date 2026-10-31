import type {PopulationWorld} from './lumistry-world-core.js';
/** Fictional broad-population priors, never demographic estimates or ethnic presets. */
export const APPEARANCE_POLICY={version:'appearance-policy-1',catalog:'appearance-catalog-1',window:12,depth:{light:3,medium:4,deep:3},cooldown:{tone:.3,depth:.8,feature:.4},markRate:.2} as const;
export const COMPLEXIONS=[
 {id:'light_cool',depth:'light',text:'Fair skin with cool undertones'},
 {id:'light_neutral',depth:'light',text:'Light skin with neutral undertones'},
 {id:'light_warm',depth:'light',text:'Light skin with warm undertones'},
 {id:'medium_light',depth:'medium',text:'Light-medium brown skin with neutral undertones'},
 {id:'medium_olive',depth:'medium',text:'Medium skin with olive undertones'},
 {id:'medium_golden',depth:'medium',text:'Medium brown skin with golden undertones'},
 {id:'medium_neutral',depth:'medium',text:'Medium brown skin with neutral undertones'},
 {id:'deep_warm',depth:'deep',text:'Deep brown skin with warm undertones'},
 {id:'deep_neutral',depth:'deep',text:'Deep brown skin with neutral undertones'},
 {id:'deep_cool',depth:'deep',text:'Very deep brown skin with cool undertones'},
] as const;
export const APPEARANCE_FEATURES=[
 {id:'hair_straight',kind:'hair',text:'Naturally straight hair',opposite:/\b(?:naturally\s+)?(?:tightly coiled|coily|curly|wavy)\s+hair\b/i},
 {id:'hair_wavy',kind:'hair',text:'Naturally wavy hair',opposite:/\b(?:naturally\s+)?(?:tightly coiled|coily|straight)\s+hair\b/i},
 {id:'hair_curly',kind:'hair',text:'Naturally curly hair',opposite:/\b(?:naturally\s+)?straight\s+hair\b/i},
 {id:'hair_coily',kind:'hair',text:'Naturally tightly coiled hair',opposite:/\b(?:naturally\s+)?straight\s+hair\b/i},
 {id:'face_broad_nose',kind:'face',text:'Broad nose',opposite:/\b(?:narrow|slender)\s+nose\b/i},
 {id:'face_high_cheekbones',kind:'face',text:'High cheekbones',opposite:/\blow\s+cheekbones\b/i},
 {id:'face_full_cheeks',kind:'face',text:'Full cheeks',opposite:/\b(?:hollow|sunken)\s+cheeks\b/i},
 {id:'face_broad_jaw',kind:'face',text:'Broad jaw',opposite:/\b(?:narrow|slender)\s+jaw\b/i},
 {id:'face_rounded_chin',kind:'face',text:'Rounded chin',opposite:/\b(?:pointed|sharp)\s+chin\b/i},
 {id:'face_long',kind:'face',text:'Long face',opposite:/\bshort\s+face\b/i},
 {id:'face_thick_brows',kind:'face',text:'Thick eyebrows',opposite:/\b(?:thin|sparse)\s+(?:eyebrows|brows)\b/i},
 {id:'face_wide_forehead',kind:'face',text:'Wide forehead',opposite:/\bnarrow\s+forehead\b/i},
] as const;
export const APPEARANCE_MARKS=[
 {id:'nose_freckles',text:'A few freckles across the nose'},
 {id:'cheek_mole',text:'A small mole on one cheek'},
 {id:'brow_asymmetry',text:'Slightly asymmetric eyebrows'},
 {id:'hand_freckles',text:'A few freckles over the backs of the hands'},
] as const;
export interface AppearancePlan {version:'appearance-1';policyVersion:typeof APPEARANCE_POLICY.version;catalogVersion:typeof APPEARANCE_POLICY.catalog;species:'human';toneId:string;featureId:string;markId?:string;}
type Required=Record<string,string>;
/** Unknown anatomy stays with the existing author. Broad fantasy/space labels grant no species. */
export function eligibleHumanAppearance(world:PopulationWorld,required:Required,context=''):boolean {
 const species=Object.entries(required).filter(([k])=>/^(species|ancestry|physiology)$/i.test(k));
 if(species.some(([,v])=>!/^human$/i.test(v.trim())))return false;
 if(Object.keys(required).some(k=>!['skinTone','hairTexture'].includes(k)&&/skin|complexion|surface|hair|facial|appearance/i.test(k)))return false;
 if(species.length)return true;
 if(!['modern','historical'].includes(world.kind))return false;
 return !/\b(?:non[- ]human|anthropomorphic|animal people|elves|elf|orcs|orc|aliens|alien|androids|android|humans? (?:are )?(?:extinct|absent)|no humans)\b/i.test(context);
}
export function validAppearance(v:any,world:PopulationWorld,required:Required,context=''):v is AppearancePlan {
 return !!v&&v.version==='appearance-1'&&v.policyVersion===APPEARANCE_POLICY.version&&v.catalogVersion===APPEARANCE_POLICY.catalog&&v.species==='human'&&COMPLEXIONS.some(t=>t.id===v.toneId)&&APPEARANCE_FEATURES.some(f=>f.id===v.featureId)&&(v.markId===undefined||APPEARANCE_MARKS.some(m=>m.id===v.markId))&&(!required.skinTone||COMPLEXIONS.find(t=>t.id===v.toneId)?.text===required.skinTone)&&eligibleHumanAppearance(world,required,context);
}
type Picker=<T>(items:readonly T[],weight:(value:T)=>number,random:()=>number)=>T;
export function selectAppearance(world:PopulationWorld,required:Required,context:string,recent:readonly AppearancePlan[],random:()=>number,pick:Picker,preferences?:{prefer:string[];required:string[];avoid:string[];excluded:string[]}):AppearancePlan|undefined {
 if(!eligibleHumanAppearance(world,required,context))return undefined;
 const history=recent.slice(-APPEARANCE_POLICY.window),count=(field:'toneId'|'featureId',id:string)=>history.filter(p=>p[field]===id).length;
 const tones=COMPLEXIONS.filter(t=>!preferences?.excluded.includes(t.text)&&(!preferences?.required.length||preferences.required.includes(t.text)));if(!tones.length)throw new Error('No complexion satisfies the essential appearance choices.');
 const depth=pick((['light','medium','deep'] as const).filter(d=>tones.some(t=>t.depth===d)),d=>APPEARANCE_POLICY.depth[d]*APPEARANCE_POLICY.cooldown.depth**history.filter(p=>COMPLEXIONS.find(t=>t.id===p.toneId)?.depth===d).length,random);
 const tone=pick(tones.filter(t=>t.depth===depth),t=>APPEARANCE_POLICY.cooldown.tone**count('toneId',t.id)*(preferences?.prefer.includes(t.text)?3:preferences?.avoid.includes(t.text)?.3:1),random);
 const features=APPEARANCE_FEATURES.filter(f=>!required.hairTexture||f.kind!=='hair'||f.id==='hair_'+required.hairTexture);
 const kind=pick((['hair','face'] as const).filter(k=>features.some(f=>f.kind===k)),()=>1,random);
 const feature=pick(features.filter(f=>f.kind===kind),f=>APPEARANCE_POLICY.cooldown.feature**count('featureId',f.id),random);
 const mark=random()<APPEARANCE_POLICY.markRate?pick(APPEARANCE_MARKS,()=>1,random):undefined;
 return {version:'appearance-1',policyVersion:APPEARANCE_POLICY.version,catalogVersion:APPEARANCE_POLICY.catalog,species:'human',toneId:tone.id,featureId:feature.id,...(mark?{markId:mark.id}:{})};
}
export function appearanceBrief(p?:AppearancePlan) {
 if(!p)return undefined;
 const tone=COMPLEXIONS.find(t=>t.id===p.toneId),feature=APPEARANCE_FEATURES.find(f=>f.id===p.featureId),mark=APPEARANCE_MARKS.find(m=>m.id===p.markId);
 if(!tone||!feature)throw new Error('Saved appearance selection is invalid; retain the candidate for review.');
 return {species:'Human',skin:tone.text,[feature.kind]:feature.text,...(mark?{distinctive:mark.text}:{})};
}
/** Change inspiration only, never catalog definitions or required field choices. */
export function appearanceDirections<T extends {directions:Array<{dimension:string;definition:string}>}>(brief:T|undefined,plan?:AppearancePlan):T|undefined {
 if(!brief||!plan)return brief;
 return {...brief,directions:brief.directions.map(d=>d.dimension==='appearance'?{...d,definition:'Preserve saved physical anchors; individualize only compatible remaining details. '+d.definition.replace(/Choose a specific plausible hair texture and cut if they have hair; baldness and other anatomies remain possible\./,'Add compatible hair length, cut, color and grooming without changing the saved natural texture.')}:d)};
}
const absent=(s:string)=>!s.trim()||/^(?:not[ _]established|unknown|none|not applicable|n\/a)[.!]?$/i.test(s.trim());
const affirmative=(s:string)=>s.replace(/\b(?:not|never|without|no)\s+(?:a\s+|an\s+)?(?:naturally\s+)?(?:[a-z-]+\s+){0,2}(?:skin|hair|nose|jaw|cheekbones|cheeks|chin|face|eyebrows|brows|forehead)\b/gi,'');
const explicitSkinDepth=(s:string)=>/\b(?:very )?(?:deep|dark)(?:[- ]brown)?\s+skin\b|\bskin is (?:very )?(?:deep|dark)\b/i.test(s)?'deep':/\b(?:pale|fair|very light)(?:[- ]brown)?\s+skin\b|\bskin is (?:pale|fair|very light)\b/i.test(s)?'light':undefined;
/** Selected base owns its facet. Authored source remains verbatim in the artifact.
 * Texture additions must not reintroduce another complexion/undertone authority. */
function surfaceDetail(raw:string):string {
 if(absent(raw))return '';
 const match=raw.match(/\b(?:skin|complexion)\b\s*(?:with|and|[,;])\s*(.+)$/i);
 const detail=match?.[1]||raw;
 return detail.split(/[,;]|\band\b/i).map(s=>s.trim()).filter(s=>s&&!/\b(?:skin|complexion|undertones?|pigment|brown|pale|fair|olive|golden|tan|black|white|bronze|copper|light|medium|dark|deep)\b/i.test(s)).join('; ');
}
export function projectPlannedAppearance(p:AppearancePlan,authored:Record<string,string>) {
 const base=appearanceBrief(p)!,tone=COMPLEXIONS.find(t=>t.id===p.toneId)!,feature=APPEARANCE_FEATURES.find(f=>f.id===p.featureId)!;
 const conflicts:string[]=[];
 const depth=explicitSkinDepth(affirmative(authored.skin||''));if(depth&&((depth==='light'&&tone.depth==='deep')||(depth==='deep'&&tone.depth==='light')))conflicts.push('Skin / fur / scales / surface');
 const rawFeature=authored[feature.kind]||'';
 // Straightening, wigs and temporary styling do not establish contradictory natural anatomy.
 const featureConflict=!/\b(?:straightened|curled|styled|wig|braided|natural(?:ly)? .+ but)\b/i.test(rawFeature)&&feature.opposite.test(affirmative(rawFeature));
 if(featureConflict)conflicts.push(feature.kind==='hair'?'Hair':'Facial features');
 const featureDetail=rawFeature.toLowerCase().startsWith(feature.text.toLowerCase())?rawFeature.slice(feature.text.length).replace(/^[\s;,.:]+/,''):rawFeature;
 const tags=authored.tags||'';if(/^\s*(?:an?\s+)?(?:elf|orc|alien|android|anthropomorphic|non[- ]human)\b/i.test(tags))conflicts.push('Species or setting-specific physiology');
 const values:Record<string,string>={skin:[base.skin,surfaceDetail(authored.skin||'')].filter(Boolean).join('; '),[feature.kind]:[feature.text,!featureConflict&&!absent(featureDetail)?featureDetail:''].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join('; '),tags:/^human\b/i.test(tags)?tags:'Human'};
 if(base.distinctive)values.distinctive=[base.distinctive,!absent(authored.distinctive||'')?authored.distinctive:''].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join('; ');
 return {values,conflicts};
}
export function appearanceGuidance(label:string,p?:AppearancePlan):string|undefined {
 if(!p)return undefined;
 const feature=APPEARANCE_FEATURES.find(f=>f.id===p.featureId);
 if(label==='Skin / fur / scales / surface')return 'The saved complexion is canonical. Add optional individual texture or surface detail; do not restate or replace its color/undertone. No culture, personality or occupation inference.';
 if(label===(feature?.kind==='hair'?'Hair':'Facial features'))return feature?.kind==='hair'?'The saved natural hair texture is canonical. Add compatible color, length, cut and grooming; do not replace it.':'The saved facial feature is canonical. Describe other compatible facial details; do not replace it.';
 return undefined;
}
