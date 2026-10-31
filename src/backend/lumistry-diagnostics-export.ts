import {POCKET_BUILD} from '../build-identity.js';
import {creationSettings} from '../domain/lumistry-creation-settings.js';
import {sceneLovePairs} from './lumistry-love-scenes.js';
import {generationDiagnostic} from './pocket-diagnostics.js';
import {datingFor} from '../domain/lumistry.js';
import {measurementTelemetry} from '../domain/lumistry-measurements.js';
import {emptyCreationTelemetry,creationSummary} from '../domain/lumistry-creation-telemetry.js';
import {LUMISTRY_V2_REVISION} from '../domain/lumistry-experience.js';
import {REPAIR_POLICY_VERSION} from '../domain/lumistry-repair.js';
import {normalizeAuthoringPolicy} from '../domain/authoring-policy.js';
import {normalizeSamplerOverrides} from '../domain/samplers.js';
import type {PhoneState} from '../types.js';

const select=(v:any,keys:string[])=>Object.fromEntries(keys.filter(k=>v?.[k]!==undefined).map(k=>[k,structuredClone(v[k])]));
export function diagnosticConfiguration(preferences:any) {
 return {authoring:normalizeAuthoringPolicy(preferences?.authoring),generationMode:preferences?.generationMode,
  sidecarConnectionId:preferences?.sidecarConnectionId,sidecarModelOverride:preferences?.sidecarModelOverride,
  imagePromptFormat:preferences?.lumistryImageDialect||'auto',
  messagingPolicy:{reasoning:'off',historyCharacters:10000,automaticRetry:preferences?.automaticGenerationRetry},
  samplers:normalizeSamplerOverrides(preferences?.samplerOverrides),
  recentRuns:(preferences?.generationHistory||[]).filter((r:any)=>r.appScope==='lumistry'||r.task?.startsWith('lumistry-')).map(generationDiagnostic)};
}
export async function exportLumistryDiagnostics(state:PhoneState,preferences:unknown,readArchive:((id:string)=>Promise<unknown>)|undefined,exportedAt:string,journal?:unknown) {
 const owner=state.pocketPersonaActorId,d=datingFor(state,owner),archives:any[]=[];
 const refs=[...(d.authoringArchives||[]),...(d.measurementArchives||[])];
 for(const id of [...new Set(refs.map(r=>r.id))]){
  try{
   const archive:any=await readArchive?.(id);
   if(!archive||archive.owner!==owner||archive.chatId!==state.chatId||archive.characterId!==state.characterId)archives.push({id,status:'unavailable'});
   else archives.push({id,status:'included',archive});
  }catch{archives.push({id,status:'unavailable'});}
 }
 const jobs=[d.discoveryJob,d.draftJob].filter(Boolean);
 return {build:POCKET_BUILD,schema:'lumistry-diagnostics-1',exportedAt,revision:LUMISTRY_V2_REVISION,repairPolicyVersion:REPAIR_POLICY_VERSION,
  private:true,diagnosticJournal:journal||{available:false,reason:'not-retained'},scope:{chatId:state.chatId,characterId:state.characterId,owner},configuration:diagnosticConfiguration(preferences),
  relationships:structuredClone(d.relationships),relationshipDiagnostics:{scene:sceneLovePairs(state).reason,omittedScenePairs:sceneLovePairs(state).omitted},
  experienceTools:d.tools,experienceSetup:{answers:d.setupDraft,applied:d.setupApplied,content:d.experiencePreferences},settings:d.generationSettings,filters:d.filters,world:{settingKey:d.settingKey,context:d.worldContext,fields:d.worldFields,population:d.populationWorld,guide:d.worldGuide,reading:d.worldReviewCache},
  measurements:{lifetime:d.discoveryAccounting,baseline:d.measurementBaseline,cumulative:d.creationTelemetry||emptyCreationTelemetry(),currentPeriod:measurementTelemetry(d.creationTelemetry||emptyCreationTelemetry(),d.measurementBaseline)},
  jobs:structuredClone(jobs),
  repairEvidence:jobs.flatMap(job=>job!.slots.filter(s=>s.progress||s.quarantinedProgress).map(s=>({schema:'lumistry-replay-1',categoryOptions:Object.fromEntries(d.worldFields.map(w=>[w.key,w.options])),exportedAt,contract:job!.creationContract,jobId:job!.id,slotId:s.id,plan:s.plan,counts:{questions:s.questionCount,photos:s.photoCount},attempts:s.unitAttempts,spent:job!.spent,progress:s.progress,quarantine:s.quarantinedProgress}))),
  messaging:state.conversations.filter(c=>c.channel==='dating'&&c.datingOwnerId===owner).map(c=>({id:c.id,archived:c.archived,updatedAt:c.updatedAt,messageCount:c.messages.length,unread:c.unread,
   availability:select(c.availability,['state','reason','resumePauseReason']),pause:c.pause?select(c.pause,['reason','createdAt','source']):undefined,
   lastDecision:c.lastDecision?select(c.lastDecision,['rawAction','normalizedAction','normalizationReason','contactInScene','remoteEligible','explicitRemoteOverride','createdAt','burstId','relayId']):undefined,
   outgoingBurst:c.outgoingBurst?select(c.outgoingBurst,['id','messageIds','open','held','finalized','explicitRemoteOverride','updatedAt']):undefined,
   messages:c.messages.slice(-30).map(m=>({...select(m,['id','sender','createdAt','status']),context:m.generation?.info?select(m.generation.info,['contextSource','promptChars','identityChars','recentCount','recentChars','storyCount','storyChars','threadCount','threadChars']):undefined,hasImage:!!m.imageId,hasDescribedPhoto:!!m.datingPhoto}))})),
  matching:d.decisions.map(x=>select(x,['profileId','action','status','forcedMatch','conversationId','likedAt','checkedAt'])),
  publishedProfiles:d.profiles.map(p=>select(p,['id','visualSetting','location','alias','age','interest','bio','pronouns','anonymous','fields','hiddenFields','privateFields','person','phoneProfile','creationPlan','authoring','photoPlan','photos'])),archives,
  limits:['Private file includes Lumistry character details and retained extension prompts/responses; share only when intended.','No unrelated chat histories, original Persona source, credentials, images or hidden reasoning are collected.','Current state is a snapshot; in-flight work may finish later. Missing archives are listed, never silently omitted.','Only retained evidence is available; unknown usage/cost remains unknown. The Lumistry-only journal is bounded and reports dropped records; earlier unlogged failures cannot be reconstructed.']};
}
/** Construct from a numeric whitelist; do not redact a copy of the private export. */
export function exportLumistrySupportDiagnostics(state:PhoneState,exportedAt:string,journal?:unknown) {
 const d=datingFor(state,state.pocketPersonaActorId),t=creationSummary(d.creationTelemetry||emptyCreationTelemetry());
 const numbers=(value:unknown)=>Object.fromEntries(Object.entries(value&&typeof value==='object'?value:{}).filter(([,v])=>typeof v==='number'&&Number.isFinite(v)&&v>=0));
 const jobs=[d.discoveryJob,d.draftJob].filter(Boolean),failures:Record<string,number>={};
 for(const event of (journal as {events?:any[]})?.events||[]){const layer=event?.diagnostic?.layer;const key=['provider','parse','validation','storage','stale-context','ui-sync','permission'].includes(layer)?layer:'other';if(event.kind==='error'||event.diagnostic)failures[key]=(failures[key]||0)+1;}
 return {build:POCKET_BUILD,schema:'lumistry-support-1',redacted:true,exportedAt,revision:LUMISTRY_V2_REVISION,repairPolicyVersion:REPAIR_POLICY_VERSION,
  settings:creationSettings(d.generationSettings.creation),
  totals:{...numbers(t),usage:numbers(t.usage),repairUsage:numbers(t.repairUsage)},failures,
  requests:jobs.flatMap(j=>j!.metrics.map(m=>numbers(m))),
  counts:{savedProfiles:d.profiles.length,unfinishedCandidates:jobs.reduce((n,j)=>n+j!.slots.filter(s=>s.status!=='saved').length,0),retainedArchives:d.authoringArchives?.length||0},
  limits:['No profile prose, prompts, source quotes, account/thread/actor IDs, credentials, images or hidden reasoning.','Reported usage is not a billing total. Missing usage and monetary cost remain unknown.','Redaction reduces private content; it does not guarantee anonymity.']};
}
