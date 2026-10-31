import {wishlistChoices,wishlistKeys,setWishlistChoice} from './lumistry-wishlist.js';
import type {DatingState} from './lumistry.js';
import {EXPERIENCE_PRESETS,normalizeExperience} from './lumistry-experience.js';
import {INTENTION_PRESETS,validateFilterDraft,validateSettingFilter} from './lumistry-filters.js';
import {WORLD_PRESETS,presetWorld,emptyWorldGuide,assertWorldGuide,speciesCompatible,speciesDiscovery} from './lumistry-world-catalog.js';
import {THEME_GROUPS,defaultExperiencePreferences,assertExperiencePreferences,themeConflicts,type ExperiencePreferences} from './lumistry-experience-preferences.js';
export const SETUP_POLICY='guided-setup-1';
export const SETUP_PRESETS_PATH='pocket/lumistry-experience-presets.json';
export const SETUP_SECTIONS=['Connections','World','People','Adult themes','Conversations','Convenience'] as const;
export const APPLY_GROUPS=[['discovery','Discovery'],['world','World & people'],['experience','Experience'],['app','App & performance']] as const;
export type ApplyGroup=typeof APPLY_GROUPS[number][0];
type Option=readonly [string,string];
export const QUICK_SETUP_IDS=['gender','age','connections','tone','textLevel','frequency','ready','theme'] as const;
export const quickSetupAnswers=(answers:Record<string,SetupAnswer>)=>Object.fromEntries(Object.entries(answers).filter(([key])=>(QUICK_SETUP_IDS as readonly string[]).includes(key)));
export interface SetupQuestion {id:string;section:number;title:string;kind:'single'|'multi'|'age';options:readonly Option[];help?:string;}
const yesNo=[['yes','Yes'],['no','No']] as const;
export const SETUP_QUESTIONS:readonly SetupQuestion[]=[
 {id:'gender',section:0,title:'Who would you like to meet?',kind:'single',options:[['woman','Women'],['man','Men'],['nonbinary','Nonbinary'],['everyone','Everyone']]},
 {id:'age',section:0,title:'What age range would you like?',kind:'age',options:[]},
 {id:'connections',section:0,title:'What connections interest you?',kind:'multi',options:[['dating','Dating'],['longTerm','Long-term'],['casual','Casual'],['friendship','Friendship']]},
 {id:'requirements',section:0,title:'Are any preferences must-haves?',kind:'multi',options:[],help:'Choose among your configured preferences. Gender and age keep their existing strict eligibility rules. Detailed filters remain available separately.'},
 {id:'world',section:1,title:'Which setting should we use?',kind:'single',options:[['keep','Current reviewed setting'],['read','Read the story explicitly'],['manual','Set it up manually']]},
 {id:'preset',section:1,title:'What era or technology fits?',kind:'single',options:[['keep','Keep current'],...WORLD_PRESETS.map(p=>[p.id,p.label] as const)]},
 {id:'speciesPack',section:1,title:'Which populations fit your world?',kind:'single',options:[['keep','Keep reviewed species'],['review','Review story suggestions'],...WORLD_PRESETS.map(p=>[p.id,p.label+' species pack'] as const)]},
 {id:'creative',section:1,title:'Allow original species proposals?',kind:'single',options:yesNo,help:'Yes permits proposals for your review, not automatic acceptance or changes to existing people.'},
 {id:'tone',section:2,title:'What overall tone would you enjoy?',kind:'single',options:[['grounded','Grounded'],['balanced','Balanced'],['chaotic','Chaotic']]},
 {id:'appearance',section:2,title:'Vary physical appearance?',kind:'single',options:yesNo,help:'Plan varied complexions, faces and hair for compatible new characters. Existing identities stay intact.'},
 {id:'ideas',section:2,title:'How broad should profile ideas be?',kind:'single',options:[['focused','Focused mix'],['broad','Broader compatible catalog']],help:'Clothing and personal styles already vary automatically; you do not need to choose wardrobe or skin-tone catalogs.'},
 {id:'adultJobs',section:2,title:'Include adult-industry occupations?',kind:'single',options:yesNo,help:'Jobs do not establish sexual interests, attraction or consent.'},
 {id:'textLevel',section:3,title:'How explicit should writing be?',kind:'single',options:[['nonsexual','Nonsexual'],['suggestive','Flirting / suggestive'],['explicit','Explicit when appropriate']]},
 {id:'themes',section:3,title:'Which broad themes may appear?',kind:'multi',options:[['compatible','Compatible variety'],...THEME_GROUPS.map(g=>[g.id,g.label] as const)],help:'These are possibilities you want to encounter, not your Persona’s interests or an inventory every character must have.'},
 {id:'avoid',section:3,title:'Which themes should be avoided everywhere?',kind:'multi',options:THEME_GROUPS.map(g=>[g.id,g.label] as const)},
 {id:'frequency',section:3,title:'How often should adult themes arise?',kind:'single',options:[['0','Only when I ask'],['20','Occasionally'],['50','Often when appropriate']]},
 {id:'scope',section:4,title:'Where should extra personality apply?',kind:'single',options:[['A','Profiles'],['B','Conversations'],['C','Both']]},
 {id:'surprise',section:4,title:'How much conversational surprise?',kind:'single',options:[['quiet','Quiet'],['balanced','Balanced'],['lively','Lively']]},
 {id:'enrichment',section:4,title:'Develop characters after matching?',kind:'single',options:yesNo},
 {id:'continuity',section:4,title:'How should agreed plans carry forward?',kind:'single',options:[['dating','Keep in dating conversations'],['events','Remember agreed events'],['scenes','Also use relevant scene continuity']]},
 {id:'ready',section:5,title:'How many profiles should stay ready?',kind:'single',options:[['5','5'],['10','10'],['25','25']]},
 {id:'workers',section:5,title:'How should generation run?',kind:'single',options:[['1','One person at a time'],['2','Two concurrent candidates']],help:'Two can make results available sooner; already running requests can spend together. Images are still generated on demand.'},
 {id:'bank',section:5,title:'Allow existing Bank NPCs to consider joining?',kind:'single',options:[['keep','Keep current'],['yes','Explicitly enable'],['no','Explicitly disable']]},
 {id:'theme',section:5,title:'Which app theme do you prefer?',kind:'single',options:[['sticker','Sticker Lab'],['distillery','Distillery'],['modern','Modern']]},
];
export type SetupAnswer=string|string[]|{min:number;max:number};
export interface SetupDraft {version:1;view?:'quick';policy:typeof SETUP_POLICY;revision:number;step:number;answers:Record<string,SetupAnswer>;baseline:Record<ApplyGroup,string>;}
const extraOptions:Record<string,readonly string[]>={photoLevel:['ordinary','suggestive','explicit'],photoMode:['text','separate'],photoGroups:THEME_GROUPS.map(g=>g.id),vocabulary:['automatic','custom']};
export function validateSetupAnswers(raw:any):Record<string,SetupAnswer> {
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||JSON.stringify(raw).length>16000)throw new Error('Review invalid setup answers.');
 for(const [id,v] of Object.entries(raw)){
  const q=SETUP_QUESTIONS.find(q=>q.id===id);
  if(id==='boundaries'||id==='photoBoundaries'){if(typeof v!=='string'||v.length>2000)throw new Error('Keep written boundaries within 2,000 characters.');continue;}
  if(id==='requirements'){if(!Array.isArray(v)||v.length>40||v.some(k=>typeof k!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(k)))throw new Error('Review must-have preferences.');continue;}
  if(q?.kind==='age'){const a=v as any;if(!a||!Number.isInteger(a.min)||!Number.isInteger(a.max)||a.min<18||a.max<a.min||a.max>9999||Object.keys(a).some(k=>!['min','max'].includes(k)))throw new Error('Choose an adult age range between 18 and 9,999.');continue;}
  const options=q?.options.map(o=>o[0])||extraOptions[id];if(!options)throw new Error('Unknown setup question.');
  const multi=q?.kind==='multi'||id==='photoGroups';if(multi){if(!Array.isArray(v)||v.length>options.length||v.some(x=>!options.includes(x))||new Set(v).size!==v.length)throw new Error('Review invalid choices for '+id);}
  else if(typeof v!=='string'||!options.includes(v))throw new Error('Review invalid answer for '+id);
 }
 return structuredClone(raw);
}
export function setupGroupState(d:DatingState,g:ApplyGroup):any {
 if(g==='discovery')return {filters:d.filters};
 if(g==='world')return {populationWorld:d.populationWorld,worldGuide:d.worldGuide,worldContext:d.worldContext,worldReviewedAt:d.worldReviewedAt,settingKey:d.settingKey,worldFields:d.worldFields,appearanceDiversity:d.generationSettings.appearanceDiversity,adultJobs:d.generationSettings.adultJobs,allTropes:d.generationSettings.allTropes};
 if(g==='experience')return {experience:d.generationSettings.experience,pipeline:d.pipeline,content:d.experiencePreferences,love:d.relationships.preferences};
 return {creation:d.generationSettings.creation,theme:d.theme,bank:{enabled:d.bankDating.enabled,chance:d.bankDating.chance}};
}
export function settingsSectionState(d:DatingState,g:ApplyGroup):any {
 if(g==='discovery')return {creation:d.generationSettings.creation};
 if(g==='app')return {theme:d.theme,bank:{enabled:d.bankDating.enabled,chance:d.bankDating.chance}};
 return setupGroupState(d,g);
}
export function makeSetupDraft(d:DatingState,prefill=true):SetupDraft {
 const answers:Record<string,SetupAnswer>={};
 if(prefill){const e=normalizeExperience(d.generationSettings.experience);Object.assign(answers,{age:{min:d.filters.minAge,max:d.filters.maxAge},tone:e.tone,scope:e.scope,appearance:d.generationSettings.appearanceDiversity===false?'no':'yes',adultJobs:d.generationSettings.adultJobs===false?'no':'yes',ideas:d.generationSettings.allTropes?'broad':'focused',enrichment:d.pipeline.enrichment?'yes':'no',ready:String(d.generationSettings.creation?.readyTarget||5),workers:String(d.generationSettings.creation?.workers||1),bank:'keep',theme:d.theme,requirements:Object.entries(d.filters.fields).filter(([k,v])=>k!=='gender'&&v.mode==='required').map(([k])=>k)});
  if(!d.pipeline.rpBridge||d.pipeline.events)answers.continuity=d.pipeline.rpBridge?'scenes':d.pipeline.events?'events':'dating';
  const gender=d.filters.fields.gender;if(!gender||gender.mode==='any')answers.gender='everyone';else if(['woman','man','nonbinary'].includes(gender.value))answers.gender=gender.value;
  const c=d.experiencePreferences;if(c){Object.assign(answers,{themes:c.themes==='compatible'?['compatible']:c.groups,avoid:c.avoid,boundaries:c.boundaries,photoMode:c.photos.useTextGroups?'text':'separate',photoGroups:c.photos.groups,photoBoundaries:c.photos.boundaries});if(c.text!=='inherit')answers.textLevel=c.text;if(c.frequency!==undefined)answers.frequency=String(c.frequency);if(c.photos.level!=='inherit')answers.photoLevel=c.photos.level;}
 }
 return {version:1,policy:SETUP_POLICY,revision:0,step:0,answers,baseline:Object.fromEntries(APPLY_GROUPS.map(([id])=>[id,JSON.stringify(setupGroupState(d,id))])) as Record<ApplyGroup,string>};
}
export function normalizeSetupDraft(v:any):SetupDraft|undefined {
 if(v===undefined)return undefined;
 try{if(v?.view!==undefined&&v.view!=='quick')return;if(v?.version!==1||v.policy!==SETUP_POLICY||!Number.isInteger(v.revision)||v.revision<0||!Number.isInteger(v.step)||v.step<0||v.step>6||JSON.stringify(v).length>512000||APPLY_GROUPS.some(([g])=>typeof v.baseline?.[g]!=='string'))return;for(const [g] of APPLY_GROUPS){const parsed=JSON.parse(v.baseline[g]);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return;}return {version:1,...(v.view==='quick'?{view:'quick' as const}:{}),policy:SETUP_POLICY,revision:v.revision,step:v.step,baseline:structuredClone(v.baseline),answers:validateSetupAnswers(v.answers)};}catch{return;}
}
export function assertSetupDraft(v:any):SetupDraft {const d=normalizeSetupDraft(v);if(!d)throw new Error('The setup draft is invalid or newer than this build. Saved settings were kept.');return d;}
export interface SetupRecommendation {group:ApplyGroup;before:any;after:any;reasons:string[];changed:boolean;}
export function recommendSetup(d:DatingState,raw:SetupDraft):{next:DatingState;recommendations:SetupRecommendation[];conflicts:string[]} {
 const draft=assertSetupDraft(raw),a=draft.answers,n=structuredClone(d),reasons:Record<ApplyGroup,string[]>={discovery:[],world:[],experience:[],app:[]};
 const reason=(g:ApplyGroup,s:string)=>reasons[g].push(s);
 if(a.gender&&!(a.gender==='everyone'&&!d.filters.fields.gender)){if(n.filters.traits)delete n.filters.traits.choices.gender;n.filters.fields.gender={mode:a.gender==='everyone'?'any':'required',value:a.gender==='everyone'?'':String(a.gender)};reason('discovery','You chose who to meet; this changes eligibility, not anyone’s attraction.');}
 if(a.age){n.filters.minAge=(a.age as any).min;n.filters.maxAge=(a.age as any).max;reason('discovery','Your selected adult age range is inclusive.');}
 if(a.connections){if(n.filters.traits)delete n.filters.traits.choices.intentions;const keys=a.connections as string[];n.filters.fields.intentions={mode:keys.length?'preferred':'any',value:[...new Set(keys.flatMap(k=>INTENTION_PRESETS[({dating:'Broad dating',longTerm:'Long-term',casual:'Casual',friendship:'Friendship'} as Record<string,string>)[k]]||[]))].join(', ')};reason('discovery','Connection choices are preferences, not guaranteed matches.');}
 if(a.requirements&&JSON.stringify([...(a.requirements as string[])].sort())!==JSON.stringify(Object.entries(d.filters.fields).filter(([k,v])=>k!=='gender'&&v.mode==='required').map(([k])=>k).sort())){const selected=a.requirements as string[];for(const key of Object.keys(n.filters.traits?.choices||{}))for(const c of wishlistChoices(n.filters,key))if(c.feeling==='prefer'&&key!=='gender')setWishlistChoice(n.filters,key,c.value,c.feeling,selected.includes(key));for(const [key,value] of Object.entries(n.filters.fields))if(key!=='gender'&&value.value&&value.mode!=='any')value.mode=selected.includes(key)?'required':'preferred';reason('discovery','Only your explicitly chosen configured preferences become must-haves.');}
 if(a.world==='read'||a.speciesPack==='review')reason('world','World reading is an explicit separate action. Read the story and review its suggestions; selecting this answer alone makes no model call.');
 const p=typeof a.preset==='string'?presetWorld(a.preset):undefined;
 if(p){n.populationWorld=p.world;n.worldGuide={...p.guide,intimacyIds:[...(d.worldGuide?.intimacyIds||[])],vocabulary:d.worldGuide?.vocabulary};n.worldContext=d.worldContext||'Reviewed setting preset: '+WORLD_PRESETS.find(w=>w.id===a.preset)!.label;n.worldReviewedAt=d.worldReviewedAt;reason('world','You explicitly chose a setting preset; review the visible world changes before applying.');}
 if(typeof a.speciesPack==='string'){const pack=presetWorld(a.speciesPack);if(pack){n.worldGuide||=emptyWorldGuide();n.worldGuide.species=structuredClone(pack.guide.species);reason('world','This selected species pack is a proposed population, not an inference from your Persona.');}}
 if(a.creative){n.worldGuide||=emptyWorldGuide();n.worldGuide.discovery={...speciesDiscovery(n.worldGuide),mode:a.creative==='yes'?'creative_discovery_opt_in':'lore_adaptive'};reason('world','Original species still require character-specific approval.');}
 if(a.vocabulary){n.worldGuide||=emptyWorldGuide();n.worldGuide.vocabulary=a.vocabulary as 'automatic'|'custom';reason('world','Vocabulary availability is separate from individual interests.');}
 for(const [key,id] of [['appearanceDiversity','appearance'],['adultJobs','adultJobs'],['allTropes','ideas']] as const)if(a[id]){n.generationSettings[key]=id==='ideas'?a[id]==='broad':a[id]==='yes';reason('world',SETUP_QUESTIONS.find(q=>q.id===id)!.title);}
 const e=n.generationSettings.experience=normalizeExperience(n.generationSettings.experience);
 if(a.tone&&a.tone!==d.generationSettings.experience?.tone){Object.assign(e,EXPERIENCE_PRESETS[a.tone as keyof typeof EXPERIENCE_PRESETS],{tone:a.tone});reason('experience','The tone preset adjusts presentation, not identity or consent.');}
 if(a.scope){e.scope=a.scope as typeof e.scope;reason('experience','Extra personality applies only to the selected channels.');}
 if(a.surprise){const preset=EXPERIENCE_PRESETS[a.surprise==='quiet'?'grounded':a.surprise==='lively'?'chaotic':'balanced'];e.socialLift=preset.socialLift;e.socialIntensity=preset.socialIntensity;reason('experience','Surprises remain optional writing opportunities.');}
 if(a.enrichment)n.pipeline.enrichment=a.enrichment==='yes';
 if(a.continuity){n.pipeline.events=a.continuity!=='dating';n.pipeline.rpBridge=a.continuity==='scenes';reason('experience','Only established agreements and verified events carry into relevant scenes.');}
 if(['textLevel','themes','avoid','boundaries','frequency','photoLevel','photoMode','photoGroups','photoBoundaries'].some(k=>a[k]!==undefined)){
  const c=n.experiencePreferences||defaultExperiencePreferences();
  if(a.textLevel)c.text=a.textLevel as ExperiencePreferences['text'];if(a.themes){c.themes=(a.themes as string[]).includes('compatible')?'compatible':'selected';c.groups=(a.themes as string[]).filter(s=>s!=='compatible') as any;}
  if(a.avoid)c.avoid=a.avoid as any;if(a.boundaries!==undefined)c.boundaries=String(a.boundaries);if(a.frequency)c.frequency=Number(a.frequency) as 0|20|50;
  if(a.photoLevel)c.photos.level=a.photoLevel as any;if(a.photoMode)c.photos.useTextGroups=a.photoMode==='text';if(a.photoGroups)c.photos.groups=a.photoGroups as any;if(a.photoBoundaries!==undefined)c.photos.boundaries=String(a.photoBoundaries);
  n.experiencePreferences=assertExperiencePreferences(c);reason('experience','These are your content preferences, not the Persona’s personal interests. Photo explicitness is chosen separately.');
 }
 n.generationSettings.creation||={readyTarget:5,photoBatchCap:5,workers:1};if(a.ready){n.generationSettings.creation.readyTarget=Number(a.ready) as 5|10|25;reason('app','Ready target changes workload; Find more remains manual.');}if(a.workers){n.generationSettings.creation.workers=Number(a.workers) as 1|2;reason('app','Concurrency affects dispatch, not model choice or image generation.');}
 if(a.theme)n.theme=a.theme as DatingState['theme'];if(a.bank==='yes'||a.bank==='no'){n.bankDating.enabled=a.bank==='yes';reason('app','NPC Bank participation changes only because you explicitly chose it.');}
 const conflicts=themeConflicts(n.filters.fields,n.experiencePreferences,n.populationWorld!);
 if(n.filters.minAge>n.populationWorld!.maxAdultAge)conflicts.push('The age range is outside this world’s reviewed adult ages. Review the range or the world age settings.');
 try{const issue=validateFilterDraft(n.filters)||validateSettingFilter(n.filters,n);if(issue)conflicts.push(issue);}catch(error){conflicts.push(error instanceof Error?error.message:String(error));}
 if(n.worldGuide){try{assertWorldGuide(n.worldGuide);}catch(error){conflicts.push(String(error));}for(const s of n.worldGuide.species)if(!speciesCompatible(s,n.populationWorld!))conflicts.push(s.label+' needs capabilities not established by this world.');}
 return {next:n,conflicts,recommendations:APPLY_GROUPS.map(([group])=>{const before=setupGroupState(d,group),after=setupGroupState(n,group);return {group,before,after,reasons:reasons[group],changed:JSON.stringify(before)!==JSON.stringify(after)};})};
}
export function applySetup(d:DatingState,draft:SetupDraft,selected:ApplyGroup[]):DatingState {
 if(!Array.isArray(selected)||selected.length>4||selected.some(g=>!APPLY_GROUPS.some(([id])=>id===g))||new Set(selected).size!==selected.length)throw new Error('Review which groups to apply.');
 const changed=selected.filter(g=>draft.baseline[g]!==JSON.stringify(setupGroupState(d,g)));if(changed.length)throw new Error('Settings changed while setup was open: '+changed.map(g=>APPLY_GROUPS.find(([id])=>id===g)![1]).join(', ')+'. Refresh recommendations to review the differences; nothing was applied.');
 // Unselected recommendations cannot create conflicts or change other groups.
 const {next}=recommendSetup(d,draft),n=structuredClone(d);
 if(selected.includes('discovery'))n.filters=next.filters;
 if(selected.includes('world')){for(const k of ['populationWorld','worldGuide','worldContext','worldFields','worldReviewedAt','settingKey'] as const)(n as any)[k]=next[k];for(const k of ['appearanceDiversity','adultJobs','allTropes'] as const)(n.generationSettings as any)[k]=next.generationSettings[k];}
 if(selected.includes('experience')){n.generationSettings.experience=next.generationSettings.experience;n.pipeline=next.pipeline;n.experiencePreferences=next.experiencePreferences;}
 if(selected.includes('app')){n.generationSettings.creation=next.generationSettings.creation;n.theme=next.theme;n.bankDating.enabled=next.bankDating.enabled;}
 const existing=recommendSetup(d,makeSetupDraft(d,false)).conflicts;const checked=recommendSetup(n,{...makeSetupDraft(n,false),answers:{}});const introduced=checked.conflicts.filter(c=>!existing.includes(c));if(introduced.length)throw new Error(introduced.join(' '));
 return n;
}
export interface SetupPreset {id:string;name:string;revision:number;updatedAt:string;requestId:string;answers:Record<string,SetupAnswer>;}
export interface SetupPresets {version:1;entries:SetupPreset[];}
export function normalizeSetupPresets(v:any):SetupPresets {
 if(v==null)return {version:1,entries:[]};if(v.version!==1||!Array.isArray(v.entries)||v.entries.length>100||JSON.stringify(v).length>2000000)throw new Error('The saved setup library is unsupported or damaged; it was kept.');
 const ids=new Set<string>();for(const e of v.entries){if(typeof e?.id!=='string'||!e.id||e.id.length>180||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||e.name.length>120||!Number.isInteger(e.revision)||e.revision<1||typeof e.updatedAt!=='string'||typeof e.requestId!=='string')throw new Error('A saved setup is damaged; the library was kept.');ids.add(e.id);validateSetupAnswers(e.answers);}
 return {version:1,entries:v.entries.map((e:any)=>({id:e.id,name:e.name,revision:e.revision,updatedAt:e.updatedAt,requestId:e.requestId,answers:validateSetupAnswers(e.answers)}))};
}
/** World/profile facts are never copied; portable intentions require fresh world review. */
export function portableSetupAnswers(v:any):Record<string,SetupAnswer> {const a=validateSetupAnswers(v);for(const key of ['world','preset','speciesPack','creative','vocabulary'])delete a[key];return a;}
