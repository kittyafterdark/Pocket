import {interestContext,connectionBlockers} from '../domain/lumistry-compatibility.js';
import {emptyExperienceTools} from '../domain/lumistry-experience-tools.js';
import {backendPerformance,performanceNow} from '../domain/performance.js';
import {experienceContentGuidance} from '../domain/lumistry-experience-preferences.js';
import {requestedPreferenceContext} from '../domain/lumistry-adult-preferences.js';
import {worldGenreValues,worldVisualGuide,extraWorldOptions} from '../domain/lumistry-world-catalog.js';
import {plannedLocation} from '../domain/lumistry-location.js';
import {excludedProfileKeys} from '../domain/lumistry-filters.js';
import {providerExecutionSignature,recoverProviderSlot} from '../domain/lumistry-provider-recovery.js';
import {authoringIssueDiagnostics} from '../domain/lumistry-authoring-contract.js';
import {retainCreationTrace} from '../domain/lumistry-generation-trace.js';
import {planRepair,aliasCollision,reservedAliases,REPAIR_POLICY_VERSION} from '../domain/lumistry-repair.js';
import {referencedPhotos} from '../domain/lumistry-photo-references.js';
import {CREATION_CONTRACT,creationSettings} from '../domain/lumistry-creation-settings.js';
import {recordCreation,emptyCreationTelemetry,creationDisposition} from '../domain/lumistry-creation-telemetry.js';
import {publicPersonContext,organizerPassages,narrowRepair,canReferencePublicRepair,compactCreationContext,creationRepairContext,requestSectionBytes,creationTaskContext} from './lumistry-creation-context.js';
import {archivePreviousAuthoring,reserveDiscoveryCapacity,type ArchiveHost} from './lumistry-archives.js';
import {selectPopulationPlan,populationBrief,POPULATION_SCHEMA,PopulationPlanningError,compatiblePopulationPresentation} from '../domain/lumistry-population.js';
import { acknowledgeGenerationReceipt } from './pending-generation.js';
import { auxiliary, classifyFailure, emptyUsageTotals, recordUsage, PocketFailure } from '../domain/reliability.js';
import { AUTHORING_LIMITS, AuthoringContractError, repairInstructions, type AuthoringIssue } from '../domain/lumistry-authoring-contract.js';
import { discoveryRun } from './lumistry-run-receipts.js';
import { StructuredOutputError } from './structured.js';
import type { PhoneState } from '../types.js';
import {textingPublicProfile} from '../domain/lumistry-messaging.js';
import { datingFor, datingFit, normalizeDatingProfile, prepareDatingProfile } from '../domain/lumistry.js';
import { discoveryProblems, datingPhotoProblems, discoveryFingerprint, verifiedPhotoCompilation, similarProfileWarnings, type DiscoverySlot, type DiscoveryJob } from '../domain/lumistry-pipeline.js';
import type { DiscoveryProgress } from '../domain/lumistry-discovery-progress.js';
import { DATING_OPTIONS } from '../domain/lumistry-options.js';
import {appearanceDirections} from '../domain/lumistry-appearance.js';
import { selectCharacter, characterBrief, type MacroResolver } from '../domain/lumistry-catalog.js';
import { selectDatingPresentation, allowsEmptyDatingBio } from '../domain/lumistry-tropes.js';
import { selectDatingVariety, recentDatingProse, recentOverusedMotifs } from '../domain/lumistry-variety.js';
import { normalizeExperience, LUMISTRY_V2_REVISION } from '../domain/lumistry-experience.js';
import { parseAuthoring, canonicalAuthoringFields, projectDossier, projectPublic, projectPhotos, photoArtifacts, publicRepair, repairPublicUnits, repairIdentityUnits, normalizePublicCounts, mergeIndexArtifact, mergeAuthoredArtifact as mergeArtifact, preservedIdentityIssues, scopedIndexArtifact, scopeRepairArtifact, type AuthoredArtifact } from '../domain/lumistry-v2.js';
import { v2AuthorPrompt, v2RepairPrompt, modelRepairInstruction } from './lumistry-v2-prompts.js';
/** Unrequested intimacy catalogs are not a characterization questionnaire. Height is numeric. */
export function dossierCategoryOptions(options: Record<string, readonly string[]>, required: Record<string, string>) {
    const privateOptional = new Set(['sexualInterests', 'sexualRole', 'libido', 'kinks', 'boundaries']);
    return Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'height' && (!privateOptional.has(key) || key in required)).map(([key,values])=>[key,key==='kinks'?[...new Set((required[key]||'').split(',').map(v=>v.trim()).filter(Boolean))]:values]));
}
export interface DiscoveryHost extends Pick<ArchiveHost,'writeAuthoringArchive'|'readAuthoringArchive'|'deleteAuthoringArchive'> {
    loadStateForTransaction?(chat:string,character:string,user?:string):Promise<PhoneState>;
    loadState(chat: string, character: string, user?: string): Promise<PhoneState>;
    saveState(state: PhoneState, user?: string): Promise<void>;
    sendDiscoveryState?(state:PhoneState,user?:string):Promise<void>;
    sendState(state: PhoneState, user?: string, reason?: string): Promise<void>;
    withStateLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
    stateKey(chat: string, character: string): string;
    nowIso(): string;
    id(prefix: string): string;
    permitted(permission: string): boolean;
    activeScope?(chat: string, character: string, user?: string,session?:string): boolean;
    generationRetryEnabled?(user?: string): Promise<boolean>;
    authoringPolicy?(user?:string):Promise<{maxCalls:number;maxTokens:number;sessionCalls:number;timeoutSeconds:number}>;
    reportDiagnostic?(d:import('../domain/reliability.js').ReliabilityDiagnostic,user?:string):void;
    resolveMacros?: MacroResolver;
}
const available = (d: ReturnType<typeof datingFor>) => d.profiles.filter(p => datingFit(p, d).eligible && !d.decisions.some(x => x.profileId === p.id)).length;
const canonicalCheckpoint = (v: any): string => JSON.stringify(v&&typeof v==='object'&&!Array.isArray(v)?{...v,lastAttempt:undefined}:v, (_k, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, value[k]])) : value);
const repairEvidence=(artifact:AuthoredArtifact|undefined)=>{if(!artifact)return {};const a=canonicalAuthoringFields(artifact);return Object.fromEntries(Object.entries(a.fields).filter(([label])=>!a.conflicts.includes(label)));};
const fresh = (): DiscoveryProgress => ({ version: 2, stage: 'identity', task: 'dossier', draft: {}, authored: { version: 2, photos: [], gallery: [], provenance: {} }, problems:[],issues:[],photoTargets: [], photoDrafts: {}, photoRepairLabels: {} });
export async function runDiscovery(h: DiscoveryHost, context: {
    chatId: string;
    characterId: string;frontendSessionId?:string;
}, owner: string, user: string | undefined, parentSignal: AbortSignal, generate:(system:string,prompt:string,receiptKey?:string,signal?:AbortSignal)=> Promise<Record<string, any>>, emit: (payload: Record<string, any>) => void, options: { reviewOnly?: boolean; brief?: string } = {}) {
    h={...h,loadState:h.loadStateForTransaction||h.loadState};
    const checkpoint=(v:any)=>{const start=performanceNow(),result=canonicalCheckpoint(v);backendPerformance.record(user||'_default','discovery.checkpointCompare',performanceNow()-start,result.length);return result;};
    const performanceScope=user||'_default',syncVisible=(state:PhoneState)=>h.sendDiscoveryState?h.sendDiscoveryState(state,user):h.sendState(state,user,'dating');
    const cancellation=new AbortController(),signal=AbortSignal.any([parentSignal,cancellation.signal]);
    const { chatId, characterId } = context, key = h.stateKey(chatId, characterId);
    const jobKey = options.reviewOnly ? 'draftJob' : 'discoveryJob';
    const completed = (d: ReturnType<typeof datingFor>, j: DiscoveryJob) => options.reviewOnly ? !!j.reviewDraft : available(d) >= (j.scheduling?.readyTarget||5);
    const check = () => {
        signal.throwIfAborted();
        if (!h.permitted('generation') || h.activeScope?.(chatId, characterId, user,context.frontendSessionId) === false){cancellation.abort();throw new Error('Generation permission or active scope changed. Saved work is kept.');}
    };
    await archivePreviousAuthoring(h,chatId,characterId,owner,user,check,j=>j.creationContract!==CREATION_CONTRACT);
    if(!options.reviewOnly){const data=datingFor(await h.loadState(chatId,characterId,user),owner);await reserveDiscoveryCapacity(h,chatId,characterId,owner,Math.max(0,creationSettings(data.generationSettings.creation).readyTarget-available(data)),user,check);}
    const fingerprint = discoveryFingerprint(datingFor(await h.loadState(chatId, characterId, user), owner));
    await archivePreviousAuthoring(h,chatId,characterId,owner,user,check,(j,kind)=>kind===jobKey&&(j.fingerprint!==fingerprint||j.brief!==options.brief));
    const retryEnabled = await h.generationRetryEnabled?.(user) ?? true;
    const policy=await h.authoringPolicy?.(user) || {maxCalls:150,maxTokens:800000,sessionCalls:24,timeoutSeconds:180};
    let sessionCalls=0;const sessionStarted=Date.now(),locallyReviewed=new Set<string>();
    let jobId = '', invocationId='', failure = '', failures = 0,stopped=false;
    let planningTail=Promise.resolve();
    const planningGate=async()=>{const before=planningTail;let release!:()=>void;planningTail=new Promise<void>(r=>release=r);await before;return release;};
    const mutate = async (fn:(s:PhoneState,j:DiscoveryJob)=>void,sync:boolean|(()=>boolean)=false) => {
        const state=await h.withStateLock(key,async()=>{
            check();const s=await h.loadState(chatId,characterId,user),d=datingFor(s,owner),j=d[jobKey];
            if(s.pocketPersonaActorId!==owner||discoveryFingerprint(d)!==fingerprint||j?.id!==jobId||j.invocation?.id!==invocationId){cancellation.abort();throw new Error('Discovery context changed. Saved work is kept.');}
            fn(s,j);j.updatedAt=h.nowIso();
            try{await h.saveState(s,user);}catch{throw new PocketFailure({layer:'storage',code:'checkpoint-write-failed',saved:false,retryable:true},'The checkpoint could not be saved. Retained work is kept; retry when storage is available.');}
            backendPerformance.record(performanceScope,'discovery.checkpoints',0,1);return s;
        });
        if(typeof sync==='function'?sync():sync)await auxiliary(()=>syncVisible(state),d=>h.reportDiagnostic?.(d,user));
    };
    const accountRejected=async(slot:DiscoverySlot,job:DiscoveryJob,metric:any,reservationId:string)=>h.withStateLock(key,async()=>{
        const state=await h.loadState(chatId,characterId,user),data=state.lumistry?.[owner];if(!data)return;
        data.creationTelemetry||=emptyCreationTelemetry();const j=data[jobKey];
        if(recordCreation(data.creationTelemetry,{jobId,slotId:slot.id,planId:slot.plan?.id,startedAt:slot.plan?.createdAt||job.createdAt},metric)){
            recordUsage(data.discoveryAccounting,metric);if(j?.id===jobId){j.spent||=emptyUsageTotals();recordUsage(j.spent,metric);j.metrics.push({...metric,authoringRevision:LUMISTRY_V2_REVISION,slotId:slot.id,failureLayer:'stale-context'});j.metrics=j.metrics.slice(-250);}
        }
        if(j?.id===jobId&&j.invocation?.id===invocationId){delete j.requestReservations?.[reservationId];delete j.activeClaims?.[slot.id];}
        if(j?.id!==jobId)creationDisposition(data.creationTelemetry,jobId,'abandoned');await h.saveState(state,user);
    });
    const publish = (state: PhoneState, j: DiscoveryJob, target: DiscoverySlot, current: DiscoveryProgress, issues: string[]) => {
        if(target.plan?.creativeSpecies&&target.plan.creativeSpecies.status!=='accepted'){issues.push('Provisional species needs explicit acceptance before publication.');target.status='failed';return false;}
        const collision=aliasCollision(current.draft.alias,reservedAliases(datingFor(state,owner),j.id,target.id));
        if(collision){
            current.repairReturn='photos';current.task='dossier';current.stage='identity';current.repairLabels=collision.labels;current.issues=[collision];current.problems=[collision.message];
            current.repairPlan=planRepair('dossier',[collision],collision.labels);current.pendingArtifact=current.authored.dossier;
            target.status=(target.unitAttempts?.dossier||0)<2?'pending':'failed';target.attempts=target.unitAttempts?.dossier||0;issues.push(collision.message);return false;
        }
        const raw = { ...current.draft, authoring: current.authored };
        issues.push(...discoveryProblems(raw, target), ...datingPhotoProblems(raw));
        const profile = normalizeDatingProfile({ ...raw, id: h.id('dating_npc'), contactId: '', photos: [], encounterAvailable: false, tropeIds: target.presentation.tropes.map((t: any) => t.id), development: { version: 1, origin: 'profile_first', revision: 0, attempts: { match: 0, portrayal: 0 } } });
        if (profile) issues.push(...discoveryProblems({ ...profile, slotId: target.id }, target));
        if (profile && aliasCollision(profile.alias,reservedAliases(datingFor(state,owner),j.id,target.id))) issues.push('Public alias already exists; no duplicate was saved');
        if(profile?.interest?.status==='matched'&&!profile.interest.context)profile.interest.context=interestContext(datingFor(state,owner));
        if (!profile || !verifiedPhotoCompilation(profile) || !datingFit(profile, datingFor(state, owner)).eligible)
            issues.push('Complete profile or photo compilation failed');
        if(profile&&excludedProfileKeys(profile,datingFor(state,owner).filters).length)issues.push('An explicit public-category exclusion is not satisfied.');
        if(profile&&!options.reviewOnly&&!datingFit(profile,datingFor(state,owner)).eligible)issues.push('The profile is outside the current discovery scope.');
        if (!issues.length && profile) {
            const data = datingFor(state, owner);
            if(!options.reviewOnly){data.tools||=emptyExperienceTools();data.tools.published[profile.id]=h.nowIso();}
            if (options.reviewOnly) {
                j.reviewDraft = prepareDatingProfile(profile, data.self);if(data.creationTelemetry)creationDisposition(data.creationTelemetry,j.id,'review',h.nowIso(),target.id);
                target.status = 'saved';
                delete target.progress;
                return true;
            }
            if(data.profiles.length>=100)throw new Error('Publication capacity changed. The complete candidate was kept for review.');
            const similarTo = similarProfileWarnings(profile, data.profiles);
            if (similarTo.length) {
                j.warnings ||= [];
                j.warnings.push({ profileId: profile.id, similarTo, dimension: 'bio' });
            }
            data.profiles.push(prepareDatingProfile(profile, data.self));
            j.acceptedIds.push(profile.id);
            j.firstReadyAt ||= h.nowIso();if(j.invocation)j.invocation.firstPublishedAt||=h.nowIso();if(data.creationTelemetry)creationDisposition(data.creationTelemetry,j.id,'published',h.nowIso(),target.id);
            target.status = 'saved';
            delete target.progress;
            return true;
        }
        return false;
    };
    const startedState=await h.withStateLock(key, async () => {
        check();
        const s = await h.loadState(chatId, characterId, user), d = datingFor(s, owner);
        if (s.pocketPersonaActorId !== owner || !d.self || discoveryFingerprint(d) !== fingerprint)
            throw new Error('Save your profile first.');
        let j = d[jobKey];
        const scheduling=creationSettings(d.generationSettings.creation);
        const appearanceDiversity=d.generationSettings.appearanceDiversity!==false;
        const deficit = options.reviewOnly ? 1 : Math.max(0, scheduling.readyTarget - available(d));
        if (!j || j.version !== 2 || j.fingerprint !== fingerprint || j.brief !== options.brief) {
            const experience = normalizeExperience(d.generationSettings.experience);
            const ledger = d.profiles.slice(-12).flatMap(p => p.tropeIds || []);
            j = { appearanceDiversity,creationContract:CREATION_CONTRACT,scheduling,planSchema:POPULATION_SCHEMA,version: 2, brief: options.brief, authoringRevision: LUMISTRY_V2_REVISION, tagSelectionVersion: 1, experience, adultJobs:d.generationSettings.adultJobs!==false,allTropes: d.generationSettings.allTropes, id: h.id('discovery'), fingerprint, status: 'filling', slots: selectDatingVariety(d.profiles, deficit).map((variety, i) => { const presentation = selectDatingPresentation(d.generationSettings.allTropes, d.worldContext, Math.random, experience, d.filters.fields.intentions?.mode === 'required' ? d.filters.fields.intentions.value : '', ledger); ledger.push(...presentation.tropes.map(t => t.id)); return { id: `slot_${i}`, photoCount: presentation.tropes.some(t => t.id === 'identical-selfies') ? AUTHORING_LIMITS.photosMax : AUTHORING_LIMITS.photosMin + Math.floor(Math.random() * AUTHORING_LIMITS.photosMax), questionCount: AUTHORING_LIMITS.questionsMin + Math.floor(Math.random() * AUTHORING_LIMITS.questionsMax), variety, presentation, status: 'pending', attempts: 0 }; }), acceptedIds: [], spent:emptyUsageTotals(), metrics: [], createdAt: h.nowIso(), updatedAt: h.nowIso() };
        }
        else {
            j.appearanceDiversity=appearanceDiversity;
            j.adultJobs=d.generationSettings.adultJobs!==false;j.allTropes=d.generationSettings.allTropes;j.experience=normalizeExperience(d.generationSettings.experience);
            const remaining=j.slots.filter(x=>x.status!=='saved'&&x.plan?.creativeSpecies?.status!=='rejected').length;
            const ledger=j.slots.flatMap(x=>x.presentation.tropes.map((t:any)=>t.id));
            const extra=selectDatingVariety(d.profiles,Math.min(Math.max(0,100-j.slots.length),Math.max(0,deficit-remaining)));
            const nextId=Math.max(-1,...j.slots.map(x=>Number(x.id.slice(5))))+1;
            for(const [i,variety] of extra.entries()){const presentation=selectDatingPresentation(j.allTropes,d.worldContext,Math.random,j.experience,d.filters.fields.intentions?.mode==='required'?d.filters.fields.intentions.value:'',ledger);ledger.push(...presentation.tropes.map(t=>t.id));j.slots.push({id:`slot_${nextId+i}`,photoCount:presentation.tropes.some(t=>t.id==='identical-selfies')?5:1+Math.floor(Math.random()*5),questionCount:1+Math.floor(Math.random()*3),variety,presentation,status:'pending',attempts:0});}
            for (const slot of j.slots) {
                if(slot.plan?.creativeSpecies?.status==='rejected')continue;
                recoverProviderSlot(slot,policy);
                if (slot.status !== 'saved' && !slot.quarantinedProgress&&(slot.attemptRevision!==LUMISTRY_V2_REVISION||slot.failureSignature?.startsWith('provider-config:')&&slot.failureSignature!=='provider-config:'+JSON.stringify(policy))) {
                    slot.status='pending';slot.attempts=0;slot.unitAttempts={};slot.failureSignature=undefined;slot.attemptRevision=LUMISTRY_V2_REVISION;
                }
            }
        }
        j.scheduling=scheduling;j.photoBatchSize=scheduling.photoBatchCap;j.activeClaims={};j.requestReservations={};j.invocation={id:h.id('creation_invocation'),startedAt:h.nowIso(),startingReady:available(d)};invocationId=j.invocation.id;
        // Add editorial lenses to remaining work; never rewrite an already authored motive.
        const editorialPlans = selectDatingVariety(d.profiles, j.slots.length);
        for (const [i, slot] of j.slots.entries()) {
            if (slot.status === 'saved') continue;
            slot.variety ||= {};
            slot.variety.questionFocuses ||= editorialPlans[i].questionFocuses;
            if (!slot.progress?.authored.dossier) slot.variety.relationshipFocus ||= editorialPlans[i].relationshipFocus;
        }
        j.authoringRevision = LUMISTRY_V2_REVISION;
        j.status = deficit ? 'filling' : 'complete';
        if(j.slots.some(slot=>slot.status==='pending'))j.lastError=undefined;
        d[jobKey] = j;
        jobId = j.id;
        try{await h.saveState(s,user);}catch{throw new PocketFailure({layer:'storage',code:'checkpoint-write-failed',saved:false,retryable:true},'The checkpoint could not be saved. Retained work is kept; retry when storage is available.');}
        return s;
    });
    await auxiliary(()=>syncVisible(startedState),d=>h.reportDiagnostic?.(d,user));
    const worker=async(workerId:string)=>{
        try {for (;;) {
            check();if(stopped)break;
            const s = await h.loadState(chatId, characterId, user), d = datingFor(s, owner), job = d[jobKey];
            if (!job || job.id !== jobId || discoveryFingerprint(d) !== fingerprint){cancellation.abort();throw new Error('Discovery context changed.');}
            let claimed:DiscoverySlot|undefined;
            await mutate((state,j)=>{
                if(stopped||completed(datingFor(state,owner),j))return;
                const slot=j.slots.find(x=>x.status==='pending'&&!j.activeClaims?.[x.id])||j.slots.find(x=>x.status==='failed'&&x.progress&&!x.quarantinedProgress&&!locallyReviewed.has(x.id)&&!j.activeClaims?.[x.id]);
                if(slot){if(!options.reviewOnly&&datingFor(state,owner).profiles.length+Object.keys(j.activeClaims||{}).length>=100)throw new Error('The publication store changed and is full. Saved candidates were kept; no request was started.');j.activeClaims||={};j.activeClaims[slot.id]=workerId;claimed=structuredClone(slot);}
            });
            const slot=claimed;if(!slot)break;
            try {
            if (!slot.plan) {
                if (!h.resolveMacros)throw new Error('Lumiverse characterization resolver is unavailable. No model request was made.');
                emit({phase:'working',message:`${available(d)} profiles ready · choosing and saving this person’s plan…`});
                const releasePlanning=await planningGate();
                try {
                    check();if(stopped)break;
                    const latest=datingFor(await h.loadState(chatId,characterId,user),owner);
                    const plan=await selectPopulationPlan({...latest,generationSettings:{appearanceDiversity:job.appearanceDiversity,allTropes:job.allTropes,adultJobs:job.adultJobs!==false,experience:job.experience}},h.resolveMacros,{chatId,characterId,userId:user,commit:false},{id:`${job.id}:${slot.id}`,createdAt:h.nowIso(),owner,questions:slot.questionCount,photos:slot.photoCount,distanceKm:plannedLocation(latest,Math.random).distanceKm,brief:options.brief});
                    await mutate((state,j)=>{
                        const target=j.slots.find(x=>x.id===slot.id)!;
                        if(!target.plan){target.presentation=compatiblePopulationPresentation(target.presentation,plan);plan.tropeIds=target.presentation.tropes.map((t:any)=>t.id);if(['content/settled','quietly independent','drifting','uneventful month'].includes(plan.life.configuration)){delete target.variety.characterFocus;plan.selectionAudit.rejectedSoftChoices.push('Dropped extra life-focus demand for an ordinary life configuration');}target.plan=plan;target.selection=plan.selection;datingFor(state,owner).selectionHistory=[...datingFor(state,owner).selectionHistory,plan.selection.tags].slice(-24);}
                        slot.plan=target.plan;slot.selection=target.selection;target.progress||=fresh();target.progress.draft.distanceKm=target.plan.distanceKm;target.progress.draft.location=target.plan.location;slot.progress=structuredClone(target.progress);
                    });
                }catch(error){
                    if(!(error instanceof PopulationPlanningError))throw error;
                    failure=error.message;
                    await mutate((_s,j)=>{const target=j.slots.find(x=>x.id===slot.id)!;target.status='failed';target.failureSignature='planning:'+error.message;j.lastError=error.message;});
                    h.reportDiagnostic?.({layer:'validation',code:error.code,saved:true,retryable:false,task:'population-plan'},user);continue;
                }finally{releasePlanning();}
            }
            const p=slot.progress||fresh();let task=p.task,stage=p.stage;
            if(slot.plan?.creativeSpecies?.status==='rejected'||slot.plan?.creativeSpecies?.status==='reserved'&&p.draft.speciesProposal){await mutate((_s,j)=>{j.slots.find(s=>s.id===slot.id)!.status='failed';});locallyReviewed.add(slot.id);continue;}
            if(slot.plan&&!Number.isFinite(p.draft.distanceKm))p.draft.distanceKm=slot.plan.distanceKm;
            if(slot.status==='failed'&&!slot.progress){locallyReviewed.add(slot.id);continue;}
            // Reinterpret a retained organizer response locally under its exact
            // old scope. Nothing outside that scope can acquire authority.
            if(stage==='identity'&&task==='index'&&p.rejectedArtifact&&p.repairLabels?.length){
                try {
                    const repaired=repairIdentityUnits(p.authored,p.rejectedArtifact,p.repairLabels,'index');
                    const candidate={...p.authored,index:repaired.artifact};
                    const projected=projectDossier(candidate,slot.selection?.requiredFields||{},slot.id,p.draft.distanceKm,{...DATING_OPTIONS,...Object.fromEntries(d.worldFields.map(w=>[w.key,w.options]))},slot.plan);
                    if(!projected.issues.length&&!preservedIdentityIssues(p.draft,projected.row).length){
                        const expected=checkpoint(p);
                        await mutate((_state,j)=>{const target=j.slots.find(x=>x.id===slot.id)!,current=target.progress!;if(checkpoint(current)!==expected)throw new Error('Saved organizer evidence changed during recovery.');current.authored=candidate;current.pendingArtifact=repaired.artifact;current.rejectedArtifact=undefined;});
                        continue;
                    }
                }catch(error){if(!(error instanceof AuthoringContractError))throw error;}
            }
            if(p.authored.dossier?.complete){
                const projected=projectDossier(structuredClone(p.authored),slot.selection?.requiredFields||{},slot.id,p.draft.distanceKm,{...DATING_OPTIONS,...Object.fromEntries(d.worldFields.map(w=>[w.key,w.options]))},slot.plan);
                const collision=aliasCollision(projected.row.alias,reservedAliases(d,job.id,slot.id));
                const identityIssues=[...projected.issues,...(collision?[collision]:[])];
                const unchanged=['alias','age','pronouns'].every(field=>!p.draft[field]||p.draft[field]===projected.row[field])&&['orientation','commitments','intentions'].every(field=>!p.draft.privateFields?.[field]||p.draft.privateFields[field]===projected.row.privateFields?.[field]);
                if(stage==='identity'&&!identityIssues.length&&unchanged){
                    const expected=checkpoint(p);
                    await mutate((state,j)=>{const target=j.slots.find(x=>x.id===slot.id)!,current=target.progress!;if(checkpoint(current)!==expected)throw new Error('Saved identity changed during local recovery.');
                        if(aliasCollision(projected.row.alias,reservedAliases(datingFor(state,owner),j.id,target.id)))return;
                        current.draft={...current.draft,...projected.row,...(current.repairReturn?{bio:current.draft.bio,photoPlan:current.draft.photoPlan,openingPhoto:current.draft.openingPhoto,person:{...projected.row.person,prompts:current.draft.person?.prompts}}:{})};
                        current.task=current.repairReturn||'public';current.stage=current.repairReturn||'public';current.repairReturn=undefined;current.pendingArtifact=current.repairResumeArtifact;current.repairResumeArtifact=undefined;
                        current.problems=[];current.issues=[];current.repairLabels=[];current.repairPlan=undefined;target.status='pending';
                    });continue;
                }
                if(stage==='identity'||collision){
                    const repair=planRepair(task,identityIssues,identityIssues.flatMap(i=>i.labels),repairEvidence(p.authored.dossier));
                    if(repair.operation==='blocked'){
                        await mutate((_state,j)=>{const target=j.slots.find(x=>x.id===slot.id)!;target.status='failed';target.progress!.repairPlan=repair;target.progress!.issues=identityIssues;target.progress!.repairLabels=repair.labels;});
                        locallyReviewed.add(slot.id);continue;
                    }
                    if(repair.labels.length&&(repair.task!==task||JSON.stringify(p.repairLabels)!==JSON.stringify(repair.labels))){
                        await mutate((_state,j)=>{
                            const target=j.slots.find(x=>x.id===slot.id)!,current=target.progress!;
                            if(stage!=='identity'){current.repairReturn=stage;current.repairResumeArtifact=current.pendingArtifact;}
                            current.task=repair.task;current.stage='identity';current.repairPlan=repair;current.issues=identityIssues;current.problems=identityIssues.map(i=>i.message);current.repairLabels=repair.labels;
                            current.pendingArtifact=repair.task==='dossier'?current.authored.dossier:current.authored.index;
                            // Re-routing uses remaining allowance of the correct unit; no spent attempts are erased.
                            if((target.unitAttempts?.[repair.task]||0)<2){target.status='pending';target.attempts=target.unitAttempts?.[repair.task]||0;}
                        });continue;
                    }
                }
            }
            if(p.issues?.some(i=>i.layer==='storage'&&i.repair==='blocked')){
                await mutate((_state,j)=>{const target=j.slots.find(x=>x.id===slot.id)!;target.status='failed';target.progress!.repairPlan=planRepair(task,p.issues!,p.repairLabels||[]);});
                locallyReviewed.add(slot.id);continue;
            }
            const retainedPhotoDrafts={...p.photoDrafts};
            if(stage==='photos'&&p.pendingArtifact?.kind==='photos'){
                const positions=Array.from({length:slot.photoCount},(_,i)=>i).filter(i=>!p.draft.photoPlan?.[i]);
                const mapped=referencedPhotos(p.pendingArtifact,p.authored.gallery,positions);
                for(const [n,position] of positions.entries())if(mapped.units[n]&&!retainedPhotoDrafts[String(position)])retainedPhotoDrafts[String(position)]=mapped.units[n]!;
            }
            if(stage==='photos' && Object.keys(retainedPhotoDrafts).length) {
                const recovered:Array<{position:number;artifact:AuthoredArtifact;photo:any}>=[];
                for(const [position,artifact] of Object.entries(retainedPhotoDrafts)) {
                    const index=Number(position);
                    if(!Number.isInteger(index)||index<0||index>=slot.photoCount||p.draft.photoPlan?.[index])continue;
                    try {
                        const projected=projectPhotos(artifact,p.draft,1);
                        if(artifact.complete && !projected.problems.length)recovered.push({position:index,artifact,photo:projected.photos[0]});
                    } catch(error) {if(!(error instanceof AuthoringContractError))throw error;}
                }
                if(recovered.length) {
                    const expected=checkpoint(p);
                    await mutate((_s,j)=>{
                        const target=j.slots.find(x=>x.id===slot.id)!,current=target.progress!;
                        if(checkpoint(current)!==expected)throw new Error('Saved photos changed during local validation.');
                        for(const r of recovered){current.draft.photoPlan[r.position]=r.photo;current.authored.photos.push(r.artifact);delete current.photoDrafts![String(r.position)];delete current.photoRepairLabels?.[String(r.position)];}
                        current.photoTargets=undefined;current.problems=[];current.issues=[];target.status='pending';
                    });
                    emit({phase:'working',message:`Recovered ${recovered.length} saved photo descriptions locally…`});
                    continue;
                }
            }
            const unfinished=Array.from({length:slot.photoCount},(_,i)=>i).filter(i=>!p.draft.photoPlan?.[i]);
            const targets=stage==='photos'?(p.photoTargets?.length?p.photoTargets:unfinished).filter(i=>!p.draft.photoPlan?.[i]&&(slot.unitAttempts?.[`photo_${i+1}`]||0)<2).slice(0,p.photoTargets?.length||unfinished.some(i=>(slot.unitAttempts?.[`photo_${i+1}`]||0)>0)?3:job.scheduling?.photoBatchCap||5):[];
            if (stage === 'photos' && p.draft.photoPlan?.filter(Boolean).length === slot.photoCount) {
                const localIssues: string[] = [];
                let saved = false;
                await mutate((state, j) => {
                    const target = j.slots.find(x => x.id === slot.id)!;
                    saved = publish(state, j, target, target.progress!, localIssues);
                    if (!saved && target.progress!.task!=='dossier') {
                        target.status = 'failed';
                        target.progress!.problems = localIssues;
                        j.lastError = localIssues.join('; ');
                    }
                },()=>saved);
                if (saved)
                    continue;
                failure=localIssues.join('; ');if(slot.progress?.task!=='dossier')locallyReviewed.add(slot.id);continue;
            }
            const extras=extraWorldOptions(d);if(slot.plan?.species)extras.species=[slot.plan.species.label];else if(slot.plan?.creativeSpecies?.status==='reserved')delete extras.species;const categoryOptions = { ...DATING_OPTIONS, ...extras,kinks:[...new Set([...DATING_OPTIONS.kinks,...(extras.kinks||[]),...(slot.selection?.requiredFields.kinks?[slot.selection.requiredFields.kinks]:[])])] };
            if ((task === 'dossier' || task === 'index') && p.authored.dossier?.complete) {
                const validation = projectDossier(structuredClone(p.authored), slot.selection?.requiredFields || {}, slot.id, p.draft.distanceKm, categoryOptions, slot.plan);
                if (!validation.repairable || validation.row.age < d.filters.minAge || validation.row.age > d.filters.maxAge) {
                    failure = 'This authored person conflicts with the saved filter plan. Extraction cannot change those facts. Discard unfinished drafts to choose a new plan.';
                    await mutate((_state,j)=>{j.slots.find(x=>x.id===slot.id)!.status='failed';j.lastError=failure;});
                    locallyReviewed.add(slot.id);continue;
                }
            }
            // Parser fixes can recover retained public work without another paid rewrite.
            if (task === 'public' && p.pendingArtifact?.kind === 'public') {
                let recovered: ReturnType<typeof projectPublic> | undefined;
                let retained = p.pendingArtifact;
                try { retained = normalizePublicCounts(retained,slot.questionCount,slot.photoCount,p.draft); recovered = projectPublic(retained,p.draft,slot.questionCount,slot.photoCount,allowsEmptyDatingBio(slot.presentation)); }
                catch(error) { if (!(error instanceof AuthoringContractError)) throw error; }
                if(recovered&&recovered.problems.length&&(checkpoint(retained)!==checkpoint(p.pendingArtifact)||checkpoint(recovered.issues)!==checkpoint(p.issues||[])||checkpoint(recovered.problems)!==checkpoint(p.problems))){
                    const expected=checkpoint(p),issues=recovered.issues;
                    await mutate((_state,j)=>{const target=j.slots.find(x=>x.id===slot.id)!,current=target.progress!;if(checkpoint(current)!==expected)throw new Error('Saved public authoring changed during recovery.');current.pendingArtifact=retained;current.issues=issues;current.problems=recovered!.problems;current.repairLabels=[...new Set(issues.flatMap(i=>i.labels))];current.repairPlan=planRepair('public',issues,current.repairLabels);});
                    continue;
                }
                if (recovered && !recovered.problems.length && datingFit(normalizeDatingProfile({...recovered.row,id:'draft'})!,d).eligible) {
                    const expected=checkpoint(p), ready=recovered;
                    await mutate((_s,j)=>{
                        const target=j.slots.find(x=>x.id===slot.id)!, current=target.progress!;
                        if(checkpoint(current)!==expected)throw new Error('Saved public authoring changed during local validation.');
                        current.authored.public=retained;current.authored.gallery=ready.gallery;current.draft=ready.row;
                        current.task='photos';current.stage='photos';current.pendingArtifact=undefined;current.problems=[];current.repairLabels=[];
                        target.status='pending';target.attempts=0;j.lastError=undefined;
                    });
                    emit({phase:'working',message:'Recovered saved public profile locally · continuing gallery descriptions…'});
                    continue;
                }
            }
            if(slot.status==='failed'){locallyReviewed.add(slot.id);continue;}
            if(stage==='photos'&&!targets.length&&unfinished.length){
                await mutate((_s,j)=>{const target=j.slots.find(x=>x.id===slot.id)!;target.status='failed';j.lastError='Saved photo work needs attention; other candidates can continue.';});
                locallyReviewed.add(slot.id);continue;
            }
            const spent=job.spent||emptyUsageTotals();
            if(sessionCalls>=policy.sessionCalls || Date.now()-sessionStarted>600000 || spent.calls>=policy.maxCalls || spent.input+spent.output>=policy.maxTokens){
                failure=spent.calls>=policy.maxCalls||spent.input+spent.output>=policy.maxTokens?'Discovery spending limit reached. Raise the authoring budget explicitly to continue.':'Saved progress is ready. Find more continues the remaining candidates.';break;
            }
            // Distance is engine-owned fictional placement, sampled once before authoring.
            if (!Number.isFinite(p.draft.distanceKm))
                await mutate((_s, j) => { const target = j.slots.find(x => x.id === slot.id)!; target.progress ||= p; const placement=plannedLocation(d,Math.random);target.progress.draft.distanceKm=placement.distanceKm;target.progress.draft.location=placement.location; p.draft.distanceKm = target.progress.draft.distanceKm; });
            const editable = p.repairLabels || ((task === 'dossier' || task === 'index') ? [...projectDossier(structuredClone(p.authored), slot.selection?.requiredFields || {}, slot.id, p.draft.distanceKm, categoryOptions, slot.plan).repairLabels, ...(!p.authored.dossier?.complete ? [Object.keys(p.authored.dossier?.fields || {}).at(-1)!].filter(Boolean) : [])] : []);
            const retry = p.problems.length > 0 || !!p.pendingArtifact, expected = checkpoint(p);
            const requestContext = { authoringRevision: LUMISTRY_V2_REVISION, stage, task, description: options.brief, worldContext: slot.plan?.worldContext ?? d.worldContext,worldPresentation:worldVisualGuide(slot.plan?.worldGuide)||undefined, lockedCandidate:task==='dossier'&&slot.plan?populationBrief(slot.plan):undefined, characterization: appearanceDirections(characterBrief(slot.plan?.aesthetic&&slot.selection?{...slot.selection,tags:slot.selection.tags.filter(id=>!['usual-clothing-choice','practical-style','personally-kept-style','mix-of-polish'].includes(id))}:slot.selection, stage),stage==='identity'?slot.plan?.appearance:undefined), experience: slot.plan?.experience||job.experience, presentation: slot.presentation, variety: slot.variety,recentOverusedMotifs:recentOverusedMotifs(d.profiles),
                requiredValues: slot.selection?.requiredFields, requiredPublicCategories: Object.keys(slot.selection?.requiredFields || {}), counts: { questions: slot.questionCount, photos: slot.photoCount },
                ...(task === 'dossier' ? { visiblePersona:d.self?textingPublicProfile(d.self):undefined,requestedPrivatePreferences:requestedPreferenceContext(slot.selection?.requiredFields.kinks),allowedPublicCategoryKeys:Object.keys(categoryOptions),exactAdultAge:slot.plan?.age, fictionalPlacementKm:slot.plan?.location?.mode==='setting'?undefined:p.draft.distanceKm, categoryOptions: dossierCategoryOptions(categoryOptions, slot.selection?.requiredFields || {}), heightGuidance: "Choose a plausible numeric height in centimetres; the engine maps it to the height control.", existingAliases: reservedAliases(d,job.id,slot.id), recentPatterns: d.profiles.slice(-8).map(x => ({ alias: x.alias, occupation: x.fields.occupation, bio: x.bio.slice(0, 160) })) } : {}),
                ...(task === 'index' ? { requestedUnresolved: editable,sourcePassages:organizerPassages(p.authored.dossier?repairEvidence(p.authored.dossier):{},editable),sourceRecords:editable.some(l=>l.startsWith('Companion'))?p.authored.dossier?.records?.filter(r=>r.start==='Companion name').map(r=>({fields:r.fields})):undefined, allowedPublicCategoryKeys: Object.keys(categoryOptions), categoryOptions: Object.fromEntries(Object.entries(categoryOptions).filter(([field]) => editable.includes(`Category ${field}`)).map(([field,values])=>[field,field==='kinks'?(slot.selection?.requiredFields.kinks?[slot.selection.requiredFields.kinks]:values.filter(v=>Object.values(p.authored.dossier?repairEvidence(p.authored.dossier):{}).some(s=>s.toLowerCase().includes(v.toLowerCase()))).slice(0,8)):values])), acceptedFacts: { entities:p.draft.person?.entities,unresolvedSubjects:p.draft.person?.unresolvedSubjects,alias: p.draft.alias, age: p.draft.age, pronouns: p.draft.pronouns, fields: p.draft.fields, orientation: p.draft.privateFields?.orientation, commitments: p.draft.privateFields?.commitments, intentions: p.draft.privateFields?.intentions } } : {}),
                ...(task === 'public' ? { questionReferences:Array.from({length:slot.questionCount},(_,i)=>`question_${i+1}`),galleryReferences:Array.from({length:slot.photoCount},(_,i)=>`gallery_${i+1}`),acceptedPerson: publicPersonContext(p.draft), recentPublicWriting: recentDatingProse(d.profiles.slice(-6)) } : {}),
                ...(task === 'photos' ? { visibleSubjectOptions: ['owner', ...(p.draft.person?.entities || []).map((e: any) => e.name), 'none'], acceptedAppearance: p.draft.person?.appearance,acceptedAnatomy:p.draft.person?.anatomy,occasionStyle:p.draft.person?.presentation?.styleAcrossOccasions, subjects: [{ reference: 'owner' }, ...(p.draft.person?.entities || []).map((e: any) => ({ reference: e.name, kind: e.kind, appearance: e.appearance }))], voice: p.draft.person?.writingVoice, anonymous: p.draft.anonymous, publicBio: p.draft.bio, purposes: targets.map(i => p.authored.gallery[i]), priorScenes: p.draft.photoPlan?.filter(Boolean).map((x: any) => ({ kind: x.kind, caption: x.caption })), batchCount:targets.length,photoReferences:targets.map(i=>`photo_${i+1}`), retainedPhotoRecords: targets.map(i => p.photoDrafts?.[String(i)]?.content || p.photoDrafts?.[String(i)]?.text), requestedPhotoChanges: targets.map(i => p.photoRepairLabels?.[String(i)] || []) } : {}),
                ...(retry || p.problems.length ? {repair:task==='photos'?{problems:repairInstructions(p.issues||[],[...new Set(Object.values(p.photoRepairLabels||{}).flat())])}:narrowRepair(p.pendingArtifact,task==='public'?(p.issues||[]).flatMap(i=>i.labels):editable,repairInstructions(p.issues||[],editable),p.issues||[],{questions:slot.questionCount,photos:slot.photoCount})} : {}) };
            const repairLabels=task==='photos'?[...new Set(Object.values(p.photoRepairLabels||{}).flat())]:task==='public'?(p.issues||[]).flatMap(i=>i.labels):editable;
            const system = (retry ? v2RepairPrompt(task,repairLabels,slot.plan,targets.length,canReferencePublicRepair(p.pendingArtifact,repairLabels,slot.questionCount,slot.photoCount)) : v2AuthorPrompt(task, task === 'index' ? editable : undefined, slot.plan))+(task==='index'?'':'\n'+(experienceContentGuidance(d.experiencePreferences,task==='photos')||''));
            const repairOperation=retry?(p.repairPlan?.operation||planRepair(task,p.issues||[],repairLabels,p.authored.dossier?repairEvidence(p.authored.dossier):{}).operation):undefined;
            const input=compactCreationContext(retry?creationRepairContext(requestContext,p,repairLabels,repairOperation!):creationTaskContext(requestContext));
            const request=JSON.stringify(input),sections=requestSectionBytes(system,input);
            emit({ phase: 'working', message: `${available(d)} profiles ready · ${task === 'dossier' ? 'writing the person' : task === 'index' ? 'extracting unresolved profile facts' : task === 'public' ? 'writing public bio, answers and gallery plan' : `describing ${targets.length} gallery photos`}…` });
            const prefixSha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(system)))].map(v=>v.toString(16).padStart(2,'0')).join('');
            const start = Date.now(),reservationId=h.id('creation_request');let reserved=false;
            retainCreationTrace(p,{schema:'lumistry-replay-1',reservationId,planId:slot.plan?.id||slot.id,stage:task,revision:LUMISTRY_V2_REVISION,prefixSha256,messages:[{role:'system',content:system},{role:'user',content:request}],outcome:'reserved',issues:[]});
            await mutate((_s, j) => { const spending=j.spent||emptyUsageTotals();const inFlight=Object.keys(j.requestReservations||{}).length;if(stopped||sessionCalls>=policy.sessionCalls||spending.calls+inFlight>=policy.maxCalls||spending.input+spending.output>=policy.maxTokens){stopped=true;failure='Discovery spending limit reached. In-flight requests may still finish and be accounted for.';return;}j.requestReservations||={};j.requestReservations[reservationId]={slotId:slot.id,workerId,startedAt:h.nowIso()};sessionCalls++;reserved=true;const target = j.slots.find(x => x.id === slot.id)!; target.progress=p;target.attempts++;target.unitAttempts||={};for(const unit of task==='photos'?targets.map(i=>`photo_${i+1}`):[task])target.unitAttempts[unit]=(target.unitAttempts[unit]||0)+1;target.attemptRevision=LUMISTRY_V2_REVISION; });
            if(!reserved)break;
            let providerReceived=false;let result: any, artifact: AuthoredArtifact | undefined, problems: string[] = [], advanced = false, published = false, acceptedPhotos = 0,retainedIdentity=false,discardedLabels:string[]=[];
            try {
                // The selected native connection/preset and explicit Pocket sampler settings own generation limits.
                result=await generate(system,request,jobId+':'+slot.id,signal);providerReceived=true;
                check();const latest=await h.loadState(chatId,characterId,user);if(latest.pocketPersonaActorId!==owner||discoveryFingerprint(datingFor(latest,owner))!==fingerprint){cancellation.abort();throw new Error('Discovery context changed. Saved work is kept.');}
                artifact = parseAuthoring(result.authoredText, task, result.finishReason, (p.pendingArtifact?.revision || 0) + 1);
            }
            catch (error) {
                if (signal.aborted || !h.permitted('generation') || h.activeScope?.(chatId, characterId, user,context.frontendSessionId) === false || discoveryFingerprint(datingFor(await h.loadState(chatId,characterId,user),owner))!==fingerprint){
                    const receipt=discoveryRun(result)||discoveryRun(error),metric={task,stage,repair:retry,interrupted:true,invalid:1,checkpoint:false,latencyMs:Date.now()-start,...receipt,requestId:receipt?.requestId||reservationId};
                    await accountRejected(slot,job,metric,reservationId);
                    throw error;
                }
                const receipt = discoveryRun(result)||discoveryRun(error), failureInfo=providerReceived?{layer:'parse' as const,code:'artifact-format',retryable:false}:classifyFailure(error),empty = error instanceof StructuredOutputError && error.details?.answerBytes === 0;
                failure = failureInfo.code==='timeout'&&error instanceof PocketFailure?error.message:providerReceived?'The returned authoring could not be parsed. Saved work is kept.':empty ? error.message : error instanceof StructuredOutputError ? 'The provider could not complete this authored unit.' : 'The provider request failed. Saved authoring is kept.';
                await mutate((_s, j) => { delete j.requestReservations?.[reservationId];const target=j.slots.find(x=>x.id===slot.id)!;if(target.progress?.lastAttempt)retainCreationTrace(target.progress,{...target.progress.lastAttempt,requestId:receipt?.requestId,outcome:providerReceived?'parse-failed':'provider-failed',responseText:result?.authoredText??result?.content,issues:[{code:failureInfo.code,message:'Native generation did not produce an accepted artifact.',labels:[]}]});const configFailure=failureInfo.retryable===false||!!receipt?.completionTokens&&receipt.reasoningTokens!==undefined&&receipt.reasoningTokens>=receipt.completionTokens;target.status=configFailure||target.attempts>=2?'failed':'pending';if(failureInfo.layer==='provider')target.failureSignature=providerExecutionSignature(policy);else if(configFailure)target.failureSignature=(providerReceived?'parse-format:':'provider-config:')+JSON.stringify(policy);j.lastError=failure; j.metrics.push({policyVersion:slot.plan?.policyVersion,catalogVersion:slot.plan?.catalogVersion,speciesPolicyVersion:slot.plan?.speciesPolicyVersion,speciesCatalogVersion:slot.plan?.speciesCatalogVersion,creativeSpeciesStatus:target.plan?.creativeSpecies?.status,organizerReason:task==='index'?p.issues?.map(i=>i.code).join(','):undefined, authoringRevision: LUMISTRY_V2_REVISION,repairPolicyVersion:REPAIR_POLICY_VERSION,task,repairOperation:'resume',code:failureInfo.code,failureLayer:failureInfo.layer, optimizationVersion: 1, batchSize:task==='photos'?targets.length:undefined,requested: task==='photos'?targets.length:1, accepted: 0, invalid: 1, promptSections:sections,promptBytes: new TextEncoder().encode(system + request).length, outputBytes: 0, latencyMs: Date.now() - start, repair: retry, stage, checkpoint: false, slotId: slot.id, ...receipt,requestId:receipt?.requestId||reservationId }); j.spent||=emptyUsageTotals();const data=datingFor(_s,owner);data.creationTelemetry||=emptyCreationTelemetry();if(recordCreation(data.creationTelemetry,{jobId:j.id,slotId:slot.id,planId:slot.plan?.id,startedAt:slot.plan?.createdAt||j.createdAt},j.metrics.at(-1)!)){recordUsage(j.spent,j.metrics.at(-1)!);recordUsage(data.discoveryAccounting,j.metrics.at(-1)!);}j.metrics=j.metrics.slice(-250); });
                stopped=true;break;
            }
            await mutate((state, j) => {
                delete j.requestReservations?.[reservationId];
                const target = j.slots.find(x => x.id === slot.id)!, current = target.progress!;
                if(j.activeClaims?.[slot.id]!==workerId)throw new Error('Candidate claim changed; stale result was rejected.');
                if (checkpoint(current) !== expected)
                    throw new Error('The saved authoring changed during generation. Newer work is preserved.');
                const a=current.authored;const typedIssues:AuthoringIssue[]=[];
                a.experience ||= j.experience;
                try {
                    if (task === 'dossier' || task === 'index') {
                        if (!artifact!.complete)
                            problems.push(`Authored output was cut off after ${Object.keys(artifact!.fields).at(-1) || 'the opening'}. Complete that label and still-unwritten fields only; preserve all complete saved labels.`);
                        if(retry&&(task==='dossier'||task==='index')){
                            const scoped=scopeRepairArtifact(artifact!,editable);discardedLabels=scoped.discardedLabels;artifact=scoped.artifact;
                        }
                        if (task === 'index') artifact = scopedIndexArtifact(artifact!, editable, a);
                        const oldIndex = a.index, oldProvenance = structuredClone(a.provenance);
                        if (task === 'dossier'){
                            const merged=repairIdentityUnits(a,artifact!,editable,'dossier');a.dossier=merged.artifact;discardedLabels.push(...merged.discardedLabels);
                            if(editable.includes('Public alias')&&a.index?.fields['Public alias']){
                                const fields=Object.fromEntries(Object.entries(a.index.fields).filter(([label])=>label!=='Public alias'));
                                a.index=Object.keys(fields).length?scopeRepairArtifact(a.index,Object.keys(fields)).artifact:undefined;
                            }
                        }
                        else
                            {const merged=repairIdentityUnits(a,artifact!,editable,'index');a.index=merged.artifact;discardedLabels.push(...merged.discardedLabels);}
                        current.pendingArtifact = task === 'dossier' ? a.dossier : a.index;
                        retainedIdentity=!!a.dossier;
                        const projected = projectDossier(a, slot.selection?.requiredFields || {}, slot.id, current.draft.distanceKm, categoryOptions, slot.plan);
                        problems.push(...projected.problems);typedIssues.push(...('issues' in projected?projected.issues:[]));
                        if (!projected.repairable || projected.row.age < d.filters.minAge || projected.row.age > d.filters.maxAge) {
                            target.status='failed';locallyReviewed.add(target.id);
                            failures = 2;
                            problems.push('This draft cannot be made compatible by extraction. Discard unfinished drafts to choose a new plan.');
                        }
                        current.repairLabels = [...projected.repairLabels, ...(!artifact!.complete ? [Object.keys(artifact!.fields).at(-1)!].filter(Boolean) : [])];
                        if (projected.needsDisclosure)
                            problems.push(...projected.issues.filter(issue => issue.code === 'disclosure').map(issue => issue.message));
                        if (projected.row.age < d.filters.minAge || projected.row.age > d.filters.maxAge)
                            { problems.push('Exact adult age: outside selected range'); current.repairLabels.push('Exact adult age'); }
                        const compatibility=connectionBlockers(normalizeDatingProfile({...projected.row,id:'draft'})!,datingFor(state,owner));
                        if(compatibility.length&&!projected.problems.length){target.status='failed';locallyReviewed.add(target.id);failures=2;problems.push('Saved identity is incompatible with the connection requirements. Retained for review; public and photo writing were not requested.');}
                        const collision=aliasCollision(projected.row.alias,reservedAliases(datingFor(state,owner),j.id,target.id));
                        if(collision){problems.push(collision.message);typedIssues.push(collision);current.repairLabels.push(...collision.labels);}
                        // Retain every projected fact even when one field still needs extraction.
                        if (task === 'index') problems.push(...preservedIdentityIssues(current.draft, projected.row));
                        if (!projected.issues.some(issue => issue.code === 'companion-identity') && !problems.some(issue => issue.includes('organizer changed')))
                            current.draft = current.repairReturn?{...current.draft,...projected.row,bio:current.draft.bio,photoPlan:current.draft.photoPlan,openingPhoto:current.draft.openingPhoto,person:{...projected.row.person,prompts:current.draft.person?.prompts}}:projected.row;
                        else {
                            a.index = oldIndex;
                            a.provenance = oldProvenance;
                        }
                        if (!problems.length) {
                            current.task = current.repairReturn||'public';
                            current.stage = current.repairReturn||'public';current.repairReturn=undefined;current.repairPlan=undefined;
                            advanced = true;
                        }
                        else if (artifact!.complete && projected.repairable && !(projected.row.age < d.filters.minAge || projected.row.age > d.filters.maxAge)) {
                            const repair=planRepair(task,typedIssues,current.repairLabels,repairEvidence(a.dossier));
                            current.repairPlan=repair;current.repairLabels=repair.labels;current.task=repair.task;
                            advanced=current.task!==task;
                        }
                    }
                    else if (task === 'public') {
                        if (!current.pendingArtifact) current.pendingArtifact = artifact;
                        const correction=retry?repairPublicUnits(current.pendingArtifact!,artifact!,repairLabels,allowsEmptyDatingBio(slot.presentation),{questions:slot.questionCount,photos:slot.photoCount},current.draft):{artifact:publicRepair(current.pendingArtifact,artifact!,allowsEmptyDatingBio(slot.presentation),{questions:slot.questionCount,photos:slot.photoCount},current.draft),discardedLabels:[]};
                        const merged=correction.artifact;discardedLabels.push(...correction.discardedLabels);
                        const projected = projectPublic(merged, current.draft, slot.questionCount, slot.photoCount, allowsEmptyDatingBio(slot.presentation));
                        problems.push(...projected.problems);typedIssues.push(...('issues' in projected?projected.issues:[]));discardedLabels.push(...projected.discardedReferences);
                        current.pendingArtifact = merged;
                        if (!datingFit(normalizeDatingProfile({ ...projected.row, id: 'draft' })!, datingFor(state, owner)).eligible)
                            problems.push('Required public categories must be disclosed');
                        if (!problems.length) {
                            a.public = merged;
                            a.gallery = projected.gallery;
                            current.draft = current.repairReturn?{...current.draft,...projected.row,bio:current.draft.bio,photoPlan:current.draft.photoPlan,openingPhoto:current.draft.openingPhoto,person:{...projected.row.person,prompts:current.draft.person?.prompts}}:projected.row;
                            current.task = 'photos';
                            current.stage = 'photos';
                            advanced = true;
                        }
                    }
                    else {
                        const mapped=referencedPhotos(artifact!,a.gallery,targets);
                        let units=mapped.units as AuthoredArtifact[];
                        problems.push(...mapped.issues.map(i=>i.message));typedIssues.push(...mapped.issues);
                        // One retained failed scene gives an unambiguous destination for a field-only repair.
                        if (!units.filter(Boolean).length && targets.length === 1 && current.photoDrafts?.[String(targets[0])] && !photoArtifacts(artifact!).length && Object.keys(artifact!.fields).length){units=[artifact!];}
                        current.photoDrafts ||= {};
                        if(units.filter(Boolean).length>targets.length)
                            problems.push(`Expected ${targets.length} photo records; received ${units.length}`);
                        else
                            for (const [i, position] of targets.entries()) {
                                const old = current.photoDrafts[String(position)];
                                if (!units[i]) {
                                    problems.push(`Photo ${position + 1}: Photo purpose record missing`);typedIssues.push({code:'photo-missing',message:'Photo record missing',labels:['Record reference','Photo purpose'],recordId:`photo_${position+1}`});
                                    continue;
                                }
                                current.photoRepairLabels ||= {};
                                try {
                                    const candidate=old?mergeArtifact(old,units[i],current.photoRepairLabels[String(position)]||[]):units[i];
                                    if(candidate.records)for(const record of candidate.records)if(record.start==='Photo purpose')record.id=`photo_${position+1}`;
                                    current.photoDrafts[String(position)] = candidate;
                                    const projected=projectPhotos(candidate,current.draft,1);typedIssues.push(...projected.issues.map(issue=>({...issue,recordId:`photo_${position+1}`})));
                                    const issues = projected.problems.map(issue => issue.replace(/^Photo 1:/, `Photo ${position + 1}:`));
                                    current.photoDrafts[String(position)] = candidate;
                                    current.photoRepairLabels[String(position)] = projected.repairLabels;
                                    if (issues.length) problems.push(...issues);
                                    else {
                                        current.draft.photoPlan[position] = projected.photos[0];
                                        a.photos.push(candidate);
                                        acceptedPhotos++;
                                        delete current.photoDrafts[String(position)];
                                        delete current.photoRepairLabels[String(position)];
                                    }
                                } catch (error) {
                                    // One bad record cannot discard valid later records in the same paid response.
                                    if (error instanceof AuthoringContractError) {
                                        problems.push(...error.issues.map(issue => `Photo ${position + 1}: ${issue.message}`));
                                        if (!error.issues.some(issue => issue.code === 'locked-field')) current.photoRepairLabels[String(position)] = error.issues.flatMap(issue => issue.labels);
                                    } else problems.push(`Photo ${position + 1}: local photo validation failed; retained source is unchanged`);
                                }
                            }
                        if (!problems.length) {
                            advanced = true;
                            current.photoTargets = [];
                            if (current.draft.photoPlan.filter(Boolean).length === slot.photoCount) {
                                published = publish(state, j, target, current, problems);
                            }
                        }
                        else
                            current.photoTargets = targets.filter(i => !current.draft.photoPlan[i]);
                        current.pendingArtifact = artifact;
                    }
                }
                catch (error) {
                    current.rejectedArtifact=artifact;
                    if (task === 'index') {
                        problems.push(...current.problems);
                        current.rejectedArtifact = artifact;
                        current.pendingArtifact = current.authored.index;
                    }
                    if (error instanceof AuthoringContractError) {
                        problems.push(...error.issues.map(x=>x.message));typedIssues.push(...error.issues);
                        current.repairLabels = [...new Set([...(current.repairLabels || editable), ...error.issues.filter(x => x.code !== 'locked-field').flatMap(x => x.labels)])];
                    } else problems.push(error instanceof Error ? error.message.slice(0, 300) : 'Local authoring validation failed. Saved source is retained.');
                }
                const attemptIssues=typedIssues.filter(i=>i.code!=='species-review');
                const reviewOnly=typedIssues.some(i=>i.code==='species-review')&&!attemptIssues.length&&problems.every(p=>typedIssues.some(i=>i.code==='species-review'&&i.message===p));
                let remainingIssues=typedIssues.length?typedIssues:(problems.length?current.issues||[]:[]);
                if(task==='public'&&current.pendingArtifact?.kind==='public'&&!attemptIssues.some(i=>i.layer==='storage'&&i.repair==='blocked'))try{
                    remainingIssues=projectPublic(current.pendingArtifact,current.draft,slot.questionCount,slot.photoCount,allowsEmptyDatingBio(slot.presentation)).issues;
                    current.repairLabels=[...new Set(remainingIssues.flatMap(i=>i.labels))];
                }catch(error){if(!(error instanceof AuthoringContractError))throw error;}
                current.problems=[...new Set(problems)];
                // Scope/storage failures never replace the unresolved operation with an empty target.
                current.issues=remainingIssues;
                if(problems.length)current.repairPlan=planRepair(current.task,current.issues||[],current.repairLabels||editable,a.dossier?canonicalAuthoringFields(a.dossier).fields:{});
                if(acceptedPhotos>0){target.attempts=0;target.failureSignature=undefined;}
                if (advanced && !problems.length) {
                    current.pendingArtifact = current.repairResumeArtifact;current.repairResumeArtifact=undefined;
                    current.repairLabels = [];current.repairPlan=undefined;
                    target.attempts = 0;
                    j.lastError = undefined;
                }
                else if (advanced && task === 'dossier') {
                    target.attempts = 0;
                    current.pendingArtifact = undefined;
                }
                else {
                    advanced = false;
                    failure = problems.slice(0, 4).join('; ');
                    j.lastError = failure;
                    target.failureSignature=JSON.stringify([task,current.photoTargets,problems]).slice(0,2000);
                    const unresolved=current.task==='photos'?Array.from({length:target.photoCount},(_,i)=>i).filter(i=>!current.draft.photoPlan?.[i]):[];
                    const exhausted=current.task==='photos'?unresolved.length>0&&unresolved.every(i=>(target.unitAttempts?.[`photo_${i+1}`]||0)>=2):(target.unitAttempts?.[current.task]||0)>=2;
                    if(!retryEnabled||exhausted||current.draft.speciesProposal&&target.plan?.creativeSpecies?.status==='reserved')target.status='failed';
                }
                retainCreationTrace(current,{...current.lastAttempt!,requestId:discoveryRun(result)?.requestId,outcome:'validated',responseText:artifact!.text,issues:attemptIssues});
                j.metrics.push({validationIssues:authoringIssueDiagnostics(attemptIssues),policyVersion:slot.plan?.policyVersion,catalogVersion:slot.plan?.catalogVersion,speciesPolicyVersion:slot.plan?.speciesPolicyVersion,speciesCatalogVersion:slot.plan?.speciesCatalogVersion,creativeSpeciesStatus:target.plan?.creativeSpecies?.status,organizerReason:task==='index'?p.issues?.map(i=>i.code).join(','):undefined, authoringRevision: LUMISTRY_V2_REVISION,repairPolicyVersion:REPAIR_POLICY_VERSION,task, repairOperation,discardedLabels,code:typedIssues[0]?.code,savedUnits:acceptedPhotos,failureLayer:problems.length&&!reviewOnly?(typedIssues.some(x=>x.code==='locked-field'||x.code==='companion-identity')?'protected-field':'validation'):undefined, unresolvedLabels: current.repairPlan?.labels.length?current.repairPlan.labels:stage === 'photos' ? [...new Set(Object.values(current.photoRepairLabels || {}).flat())] : current.repairLabels, optimizationVersion: 1, batchSize:task==='photos'?targets.length:undefined,requested: task==='photos'?targets.length:1, accepted: published && !options.reviewOnly ? 1 : 0, invalid: problems.length&&!reviewOnly ? 1 : 0, promptSections:sections,promptBytes: new TextEncoder().encode(system + request).length, outputBytes: new TextEncoder().encode(artifact!.text).length, latencyMs: Date.now() - start, repair: retry, stage, checkpoint: advanced || acceptedPhotos > 0 || retainedIdentity, slotId: slot.id, ...discoveryRun(result),requestId:discoveryRun(result)?.requestId||reservationId });
                const metric=j.metrics.at(-1)!;j.spent||=emptyUsageTotals();const data=datingFor(state,owner);data.creationTelemetry||=emptyCreationTelemetry();if(recordCreation(data.creationTelemetry,{jobId:j.id,slotId:slot.id,planId:slot.plan?.id,startedAt:slot.plan?.createdAt||j.createdAt},metric)){recordUsage(j.spent,metric);recordUsage(data.discoveryAccounting,metric);}if(published||options.reviewOnly&&target.status==='saved')creationDisposition(data.creationTelemetry,j.id,options.reviewOnly?'review':'published',h.nowIso(),slot.id);j.metrics=j.metrics.slice(-250);
            },()=>published).catch(async error=>{
                if(classifyFailure(error).layer!=='storage'){
                    const receipt=discoveryRun(result);await accountRejected(slot,job,{task,stage,repair:retry,interrupted:true,invalid:1,checkpoint:false,latencyMs:Date.now()-start,...receipt,requestId:receipt?.requestId||reservationId},reservationId);
                }
                throw error;
            });
            acknowledgeGenerationReceipt(result);
            if (advanced) {
                failures = 0;
                failure = '';
            }
            else
                failures++;
            emit({ phase: 'working', message: published ? options.reviewOnly ? 'Complete profile draft ready for review.' : 'Saved one complete profile · ready to browse.' : advanced ? `Saved ${task} authoring · continuing the same person…` : `${acceptedPhotos ? `Saved ${acceptedPhotos} complete photo record${acceptedPhotos === 1 ? '' : 's'} · ` : 'Saved authored material · '}${failure}` });
            // A parked unit cannot stop independent pending candidates. Provider-wide failures stop above.
            }finally{await mutate((_s,j)=>{if(j.activeClaims?.[slot.id]===workerId)delete j.activeClaims[slot.id];}).catch(()=>{});}
        }}catch(error){stopped=true;throw error;}
    };
    try {
        const state=await h.loadState(chatId,characterId,user),workers=options.reviewOnly?1:datingFor(state,owner)[jobKey]?.scheduling?.workers||1;
        const outcomes=await Promise.allSettled(Array.from({length:workers},(_,i)=>worker(`worker_${i+1}`)));
        const rejected=outcomes.find((o):o is PromiseRejectedResult=>o.status==='rejected');if(rejected)throw rejected.reason;
        await mutate((s, j) => {
            j.status=completed(datingFor(s,owner),j)?'complete':'partial';
            if(failure)j.lastError=failure;
            if (j.status === 'complete'){j.completedAt = h.nowIso();if(j.invocation)j.invocation.completedAt=h.nowIso();}
        },true);
        const d = datingFor(await h.loadState(chatId, characterId, user), owner);
        const parked=d[jobKey]?.slots.filter(slot=>slot.status==='failed').length||0;
        emit({ phase: 'done', message: `${options.reviewOnly ? d.draftJob?.reviewDraft ? 'Profile draft ready for review' : 'Manual draft paused' : available(d)+' profiles ready'+(parked?`; ${parked} saved draft${parked===1?'':'s'} need attention`:'')}${failure ? ' · ' + failure + (failure.includes('Discard unfinished') ? '. Saved authoring is kept.' : options.reviewOnly ? '. Saved plan and any accepted authoring are kept; retry the same description to resume.' : '. Saved plan and any accepted authoring are kept; Find more resumes this work.') : ''}` });
    }
    catch (error) {
        const failedState=await h.withStateLock(key, async () => {
            const s = await h.loadState(chatId, characterId, user), j = datingFor(s, owner)[jobKey];
            if (j?.id === jobId && j.invocation?.id===invocationId) {
                j.status = signal.aborted ? 'paused' : 'partial';j.activeClaims={};j.requestReservations={};
                await h.saveState(s, user);return s;
            }
        }).catch(() => undefined);
        if(failedState)await auxiliary(()=>syncVisible(failedState),d=>h.reportDiagnostic?.(d,user));
        throw error;
    }
}
/** Review-only manual authoring uses the same persistent pipeline and validators as Discover. */
export async function authorProfileDraft(h: DiscoveryHost, context: { chatId: string; characterId: string }, owner: string, user: string | undefined, signal: AbortSignal, brief: string, generate:(system:string,prompt:string,receiptKey?:string,signal?:AbortSignal)=> Promise<Record<string, any>>, emit: (payload: Record<string, any>) => void) {
    await runDiscovery(h, context, owner, user, signal, generate, emit, { reviewOnly: true, brief });
    const state = await h.loadState(context.chatId, context.characterId, user), data = datingFor(state, owner), job = data.draftJob;
    signal.throwIfAborted();
    if (!h.permitted('generation') || h.activeScope?.(context.chatId, context.characterId, user) === false || state.pocketPersonaActorId !== owner)
        throw new Error('Manual authoring scope changed. Saved work is kept.');
    if (job?.fingerprint !== discoveryFingerprint(data)) throw new Error('Profile or filters changed during authoring. Saved work is kept.');
    if (!job?.reviewDraft || job.status !== 'complete')
        throw new Error(job?.lastError || 'The profile draft is unfinished. Retry with the same description to resume saved authoring.');
    const profile = normalizeDatingProfile(job.reviewDraft);
    if (!profile || !verifiedPhotoCompilation(profile)) throw new Error('The saved review draft did not pass native validation.');
    return profile;
}
