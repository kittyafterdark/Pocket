import {lovePreferences} from '../domain/lumistry-love.js';
import {quickSetupAnswers,settingsSectionState,recommendSetup} from '../domain/lumistry-setup.js';
import {assertExperiencePreferences} from '../domain/lumistry-experience-preferences.js';
import {normalizeExperience} from '../domain/lumistry-experience.js';
import {creationSettings} from '../domain/lumistry-creation-settings.js';
import {normalizePopulationWorld} from '../domain/lumistry-world-core.js';
import {assertWorldGuide} from '../domain/lumistry-world-catalog.js';
import {validateWorldCategories} from '../domain/lumistry-world-reading.js';
import {makeSetupDraft,assertSetupDraft,applySetup,normalizeSetupPresets,portableSetupAnswers,SETUP_POLICY,type SetupPresets,type ApplyGroup} from '../domain/lumistry-setup.js';
import {datingFor,normalizeDating,DATING_FIELDS,type DatingState} from '../domain/lumistry.js';
import {reviewedSettingKey} from '../domain/lumistry-location.js';
import {worldVisualGuide} from '../domain/lumistry-world-catalog.js';
import type {PhoneState} from '../types.js';
interface SetupServices {mutate:(fn:(s:PhoneState)=>void)=>Promise<void>;emit:(v:any)=>void;load:()=>Promise<PhoneState>;active:()=>boolean;read?:()=>Promise<unknown>;write?:(v:SetupPresets)=>Promise<void>;lock:<T>(key:string,fn:()=>Promise<T>)=>Promise<T>;id:(prefix:string)=>string;now:()=>string;scope:string;}
export async function handleSetup(action:string,input:any,owner:string,requestId:string,h:SetupServices):Promise<boolean> {
 if(!action.startsWith('setup_'))return false;
 const current=async()=>{const s=await h.load();if(s.pocketPersonaActorId!==owner||!h.active())throw new Error('The phone changed. Reopen setup; saved work is kept.');return s;};
 if(action==='setup_direct'){
  await h.mutate(s=>{
   if(!h.active())throw new Error('The active phone changed.');const d=datingFor(s,owner),g=input.group as ApplyGroup,v=input.value;
   if(!['discovery','world','experience','app'].includes(g)||typeof input.baseline!=='string'||input.baseline!==JSON.stringify(settingsSectionState(d,g)))throw new Error('These settings changed elsewhere. Reopen this section before saving; nothing was applied.');
   const n=structuredClone(d);if(!v||typeof v!=='object')throw new Error('Review missing settings.');
   if(g==='experience'){
    if(v.love!==undefined){if(!['slow','responsive','dramatic'].includes(v.love?.pace)||['dating','direct','scene'].some(k=>typeof v.love?.sources?.[k]!=='boolean'))throw new Error('Review emotional tracking.');n.relationships.preferences=lovePreferences(v.love);}
    if(v.experience)n.generationSettings.experience=normalizeExperience(v.experience);
    if(v.content!==undefined)n.experiencePreferences=assertExperiencePreferences(v.content);
    if(v.pipeline){for(const k of ['enrichment','events','rpBridge'] as const){if(typeof v.pipeline[k]!=='boolean')throw new Error('Review development choices.');n.pipeline[k]=v.pipeline[k];}}
   }
   if(g==='world'){
    if(v.worldGuide!==undefined)n.worldGuide=assertWorldGuide(v.worldGuide);
    if(typeof v.worldContext!=='string'||v.worldContext.length>12000)throw new Error('Review the world summary.');n.worldContext=v.worldContext.trim();
    if(v.populationWorld)n.populationWorld=normalizePopulationWorld({...v.populationWorld,reviewed:true},n.worldContext);
    if(v.worldFields!==undefined){n.worldFields=validateWorldCategories(v.worldFields);if(n.worldFields.some(f=>(DATING_FIELDS as readonly string[]).includes(f.key)))throw new Error('Setting categories cannot replace built-in categories.');}
    for(const k of ['appearanceDiversity','adultJobs','allTropes'] as const){if(typeof v[k]!=='boolean')throw new Error('Review people settings.');n.generationSettings[k]=v[k];}
    if(n.worldContext)n.worldReviewedAt=h.now();n.settingKey||=reviewedSettingKey(n);if(n.self)n.self.visualSetting=worldVisualGuide(n.worldGuide)||undefined;
   }
   if(g==='discovery'){if(v.creation){if(![5,10,25].includes(v.creation.readyTarget)||![1,2].includes(v.creation.workers)||![3,4,5].includes(v.creation.photoBatchCap))throw new Error('Choose supported generation workload settings.');n.generationSettings.creation=creationSettings(v.creation);}}
   if(g==='app'){
    if(!['sticker','distillery','modern'].includes(v.theme)||typeof v.bank?.enabled!=='boolean'||!Number.isInteger(v.bank.chance)||v.bank.chance<0||v.bank.chance>100)throw new Error('Review app and Bank settings.');n.theme=v.theme;n.bankDating.enabled=v.bank.enabled;n.bankDating.chance=v.bank.chance;
   }
   const beforeIssues=recommendSetup(d,makeSetupDraft(d,false)).conflicts,issues=recommendSetup(n,makeSetupDraft(n,false)).conflicts.filter(x=>!beforeIssues.includes(x));if(issues.length)throw new Error(issues.join(' '));
   s.lumistry![owner]=n;
  });h.emit({phase:'setup_section_saved',group:input.group,message:'This section was saved. Find more remains manual.'});return true;
 }
 if(['setup_start','setup_save','setup_refresh','setup_apply'].includes(action)){
  let result:any,applied=false;
  await h.mutate(s=>{
   if(!h.active())throw new Error('The active phone changed. Reopen setup.');
   const d=datingFor(s,owner),stored=d.setupDraft;
   if(action==='setup_apply'&&requestId&&d.setupApplied?.requestId===requestId){result=stored;applied=true;return;}
   if(action==='setup_start'){d.setupDraft||={...makeSetupDraft(d),revision:1};result=d.setupDraft;return;}
   if((stored?.revision||0)!==input.expectedRevision)throw new Error('This setup changed elsewhere. Resume the saved setup before editing; active settings were kept.');
   const incoming=assertSetupDraft(input.draft);
   if(stored&&JSON.stringify(incoming.baseline)!==JSON.stringify(stored.baseline))throw new Error('Setup baselines changed. Refresh recommendations before applying.');
   let next={...incoming,revision:(stored?.revision||0)+1};
   if(action==='setup_refresh')next={...makeSetupDraft(d,false),answers:incoming.answers,step:incoming.step,revision:next.revision,...(incoming.view?{view:incoming.view}:{})};
   if(action==='setup_apply'){
    if(input.quick!==undefined&&typeof input.quick!=='boolean')throw new Error('Review invalid setup view.');const changed=applySetup(d,input.quick||next.view==='quick'?{...next,answers:quickSetupAnswers(next.answers)}:next,input.groups as ApplyGroup[]);
    if((input.groups as string[]).includes('world')){if(changed.worldContext)changed.worldReviewedAt=h.now();changed.settingKey||=reviewedSettingKey(changed);if(changed.filters.distanceMode==='setting')changed.filters.settingKey=reviewedSettingKey(changed);if(changed.self)changed.self.visualSetting=worldVisualGuide(changed.worldGuide)||undefined;}
    next.step=6;changed.setupDraft=next;changed.setupApplied={policy:SETUP_POLICY,at:h.now(),requestId};s.lumistry![owner]=changed;applied=true;
   }else d.setupDraft=next;
   result=next;
  });
  h.emit({phase:applied?'setup_applied':'setup_draft',draft:result,groups:applied?input.groups:undefined,refreshed:action==='setup_refresh',message:applied?'Selected recommendations saved. Use Find more when ready.':'Setup progress saved. Active settings are unchanged.'});return true;
 }
 if(!['setup_presets_list','setup_preset_save','setup_preset_load','setup_preset_delete'].includes(action))throw new Error('Unknown setup action.');
 if(!h.read||!h.write)throw new Error('Native saved-setup storage is unavailable. Current settings were kept.');
 await h.lock('lumistry-setup-presets:'+h.scope,async()=>{
  await current();const library=normalizeSetupPresets(await h.read!());
  if(action==='setup_preset_save'&&requestId&&library.entries.some(e=>e.requestId===requestId)){h.emit({phase:'setup_presets',entries:library.entries,message:'This setup was already saved.'});return;}
  const entry=input.presetId?library.entries.find(e=>e.id===input.presetId):undefined;
  if(action==='setup_preset_load'||action==='setup_preset_delete'||action==='setup_preset_save'&&input.presetId){if(!entry||entry.revision!==input.revision)throw new Error('That saved setup changed or is unavailable. Refresh saved setups.');}
  if(action==='setup_preset_load'){
   let draft:any;await h.mutate(state=>{const d=datingFor(state,owner);if(!h.active())throw new Error('The phone changed.');draft={...makeSetupDraft(d,false),answers:portableSetupAnswers(entry!.answers),revision:(d.setupDraft?.revision||0)+1,step:6};d.setupDraft=draft;});
   // Loading stages a portable draft; saving/applying remains explicit.
   h.emit({phase:'setup_preset_draft',draft,message:'Preset loaded for review. World choices need review in this setting; nothing was applied.'});return;
  }
  if(action==='setup_preset_save'){
   if(!requestId||!library.entries.some(e=>e.requestId===requestId)){
    const name=typeof input.name==='string'?input.name.trim():'';if(!name||name.length>120)throw new Error('Name the setup using at most 120 characters.');
    if(!entry&&library.entries.length>=100)throw new Error('The saved setup library is full. Delete an unused copy first.');
    const value={id:entry?.id||h.id('setup'),name,revision:(entry?.revision||0)+1,updatedAt:h.now(),requestId,answers:portableSetupAnswers(input.answers)};
    library.entries=library.entries.filter(e=>e.id!==value.id);library.entries.push(value);
   }
  }else if(action==='setup_preset_delete')library.entries=library.entries.filter(e=>e.id!==entry!.id);
  if(action!=='setup_presets_list'){
   await current();normalizeSetupPresets(library);await h.write!(library);const verified=normalizeSetupPresets(await h.read!());if(JSON.stringify(verified)!==JSON.stringify(library))throw new Error('Saved setup verification failed. Refresh the library before retrying.');
  }
  await current();h.emit({phase:'setup_presets',entries:library.entries,message:action==='setup_presets_list'?'Saved setups loaded.':'Saved setups updated; current settings are unchanged.'});
 });
 return true;
}
