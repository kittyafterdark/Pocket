import {filterSignature} from './lumistry-filters.js';
import {compatibilityFingerprint} from './lumistry-compatibility.js';
import {settingKeyFor} from './lumistry-location.js';
import {normalizePopulationWorld} from './lumistry-world-core.js';
import {normalizeAuthoringIssues,type AuthoringIssue} from './lumistry-authoring-contract.js';
import {normalizeByteSections} from './lumistry-creation-telemetry.js';
import {creationSettings,type CreationSettings} from './lumistry-creation-settings.js';
import {normalizeCandidatePlan,type CandidatePlan} from './lumistry-population.js';
import { normalizeUsageTotals, type UsageTotals, type FailureLayer } from './reliability.js';
import { DATING_TROPES } from './lumistry-tropes.js';
import { AUTHORING_LIMITS, bioWithinBounds } from './lumistry-authoring-contract.js';
import { normalizeExperience, LUMISTRY_V2_REVISION, type LumistryExperience } from './lumistry-experience.js';
import { selectionText } from './lumistry-field-values.js';
import { PHOTO_TEXT_LIMITS } from './lumistry-photo-contract.js';
import { normalizeDiscoveryDiagnostic, type DiscoveryDiagnostic } from './lumistry-diagnostics.js';
import { normalizeCharacterSelection, type CharacterSelection } from './lumistry-catalog.js';
import { normalizeDiscoveryProgress, type DiscoveryProgress, type DiscoveryStage } from './lumistry-discovery-progress.js';
import { datingFact, datingAppearance, hasDatingAppearance } from './lumistry-facts.js';
import type { DatingProfile, DatingState } from './lumistry.js';
import { compileDatingVisual, normalizeDatingVisual } from './lumistry-visual.js';
export interface DatingPipelineFlags {
    enrichment: boolean;
    events: boolean;
    rpBridge: boolean;
}
export const pipelineFlags = (v: any): DatingPipelineFlags => ({ enrichment: v?.enrichment !== false, events: v?.events !== false, rpBridge: v?.rpBridge !== false });
export interface DatingDevelopment {
    version: 1;
    origin: 'profile_first';
    revision: number;
    match?: {
        facts: string;
        createdAt: string;
    };
    portrayal?: {
        behavior: string;
        createdAt: string;
    };
    attempts: {
        match: number;
        portrayal: number;
    };
    units?:Record<string,{authority?:'witnessed'|'private-background'|'performance'|'diagnostic';trigger:string;evidence:string[];text:string;createdAt:string;revision:number}>;
    unitAttempts?:Record<string,number>;
    voiceLab?: { text: string; createdAt: string };
    error?: string;
}
export function normalizeDevelopment(v: any): DatingDevelopment | undefined {
    if (v?.version !== 1 || v.origin !== 'profile_first')
        return undefined;
    const record = (r: any, key: string) => typeof r?.[key] === 'string' && r[key].trim() ? { [key]: r[key].trim().slice(0, 6000), createdAt: String(r.createdAt || '').slice(0, 40) } : undefined;
    return { units:v.units&&typeof v.units==='object'?Object.fromEntries(Object.entries(v.units).filter(([key,x]:[string,any])=>/^(MUTUAL_MATCH|CONTACT_ONLY|ENCOUNTER_CONFIRMED):[a-z]+$/.test(key)&&typeof x?.text==='string'&&x.text.length<=6000&&Array.isArray(x.evidence)).map(([key,x]:[string,any])=>[key,{...(['witnessed','private-background','performance','diagnostic'].includes(x.authority)?{authority:x.authority}:{}),trigger:x.trigger,evidence:x.evidence.filter((e:any)=>typeof e==='string'),text:x.text,createdAt:String(x.createdAt||''),revision:Number(x.revision)||1}])):undefined,unitAttempts:v.unitAttempts&&typeof v.unitAttempts==='object'?Object.fromEntries(Object.entries(v.unitAttempts).filter(([key,x])=>/^(MUTUAL_MATCH|CONTACT_ONLY|ENCOUNTER_CONFIRMED):[a-z]+$/.test(key)&&typeof x==='number').map(([key,x])=>[key,Math.max(0,Math.min(2,Number(x)))])):undefined,version: 1, origin: 'profile_first', revision: Math.max(0, Math.floor(Number(v.revision) || 0)),
        voiceLab: typeof v.voiceLab?.text==='string' && v.voiceLab.text.length<=6000 ? {text:v.voiceLab.text,createdAt:String(v.voiceLab.createdAt||'').slice(0,40)}:undefined, match: record(v.match, 'facts') as DatingDevelopment['match'], portrayal: record(v.portrayal, 'behavior') as DatingDevelopment['portrayal'],
        attempts: { match: Math.min(2, Math.max(0, Number(v.attempts?.match) || 0)), portrayal: Math.min(2, Math.max(0, Number(v.attempts?.portrayal) || 0)) }, error: typeof v.error === 'string' ? v.error.slice(0, 240) : undefined };
}
export interface DiscoverySlot {
    plan?:CandidatePlan;
    id: string;
    photoCount: number;
    questionCount: number;
    variety: any;
    presentation: any;
    status: 'pending' | 'saved' | 'failed';
    attemptRevision?:string;
    unitAttempts?:Record<string,number>;
    failureSignature?:string;
    quarantinedProgress?:Record<string,unknown>;
    quarantineReason?:string;
    attempts: number;
    progress?: DiscoveryProgress;
    selection?: CharacterSelection;
}
export interface DiscoveryJob {
    creationContract?:string; scheduling?:CreationSettings;
    invocation?:{id:string;startedAt:string;startingReady:number;firstPublishedAt?:string;completedAt?:string};
    activeClaims?:Record<string,string>;requestReservations?:Record<string,{slotId:string;workerId:string;startedAt:string}>;
    planSchema?:string;
    brief?: string;
    spent?:UsageTotals;
    /** Complete review-only result; it is not a published profile or contact. */
    reviewDraft?: Record<string, any>;
    authoringRevision: string;
    tagSelectionVersion?: 1;
    version: 2;
    experience: LumistryExperience;
    allTropes: boolean;
    adultJobs?:boolean;
    appearanceDiversity?:boolean;
    id: string;
    fingerprint: string;
    status: 'filling' | 'paused' | 'complete' | 'partial';
    slots: DiscoverySlot[];
    warnings?: Array<{
        profileId: string;
        similarTo: string[];
        dimension: 'bio';
    }>;
    lastError?: string;
    firstReadyAt?: string;
    completedAt?: string;
    acceptedIds: string[];
    createdAt: string;
    updatedAt: string;
    photoBatchSize?: 3 | 4 | 5;
    metrics: Array<{
        validationIssues?:AuthoringIssue[];
        authoringRevision?: string;
        policyVersion?:string;
        catalogVersion?:string;speciesPolicyVersion?:string;speciesCatalogVersion?:string;creativeSpeciesStatus?:string;
        organizerReason?:string;
        repairPolicyVersion?:string;
        repairOperation?:import('./lumistry-repair.js').RepairOperation;
        promptSections?:Record<string,number>;
        discardedLabels?:string[];
        task?: 'dossier' | 'index' | 'public' | 'photos';
        failureLayer?: FailureLayer | 'authoring';
        code?:string;
        savedUnits?:number;
        unresolvedLabels?: string[];
        optimizationVersion?: 1;
        batchSize?: number;
        requested: number;
        accepted: number;
        promptBytes: number;
        outputBytes: number;
        latencyMs: number;
        commitMs?: number;
        invalid: number;
        repair: boolean;
        stage?: DiscoveryStage;
        checkpoint?: boolean;
        diagnostic?: DiscoveryDiagnostic;
        requestId?: string;
        slotId?: string;
        usageStatus?: 'reported' | 'partial' | 'unavailable';
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
        reasoningTokens?: number;
        cachedTokens?: number;
        attempt?: number;
        photoOffset?: number;
    }>;
}
function normalizeDiscoverySlot(s: any): DiscoverySlot {
    const photoCount=Math.max(AUTHORING_LIMITS.photosMin,Math.min(AUTHORING_LIMITS.photosMax,Math.round(Number(s.photoCount)||1)));
    const questionCount=Math.max(AUTHORING_LIMITS.questionsMin,Math.min(AUTHORING_LIMITS.questionsMax,Math.round(Number(s.questionCount)||1)));
    const progress=normalizeDiscoveryProgress(s.progress);
    const plan=normalizeCandidatePlan(s.plan);
    const quarantinedProgress=s.quarantinedProgress || (s.plan&&(!plan||plan.photoCount!==s.photoCount||plan.questionCount!==s.questionCount)?{plan:structuredClone(s.plan),progress:structuredClone(s.progress)}:undefined) || (s.progress && !progress ? structuredClone(s.progress) : undefined);
    const presentation=structuredClone(s.presentation || {});
    if(presentation.tropes?.some((t:any)=>t.id==='identical-selfies')) {
        presentation.tropes=presentation.tropes.map((t:any)=>t.id==='identical-selfies'?DATING_TROPES.find(row=>row.id===t.id)!:t);
        presentation.flavor=presentation.tropes.map((t:any)=>t.label).join(' + ');
    }
    if(progress) {
        // Engine-owned counts change only the unfinished slot selection; authored source remains retained.
        if(Array.isArray(progress.draft.person?.prompts))progress.draft.person.prompts=progress.draft.person.prompts.slice(0,questionCount);
        if(Array.isArray(progress.draft.photoPlan))progress.draft.photoPlan=progress.draft.photoPlan.slice(0,photoCount);
        progress.authored.gallery=progress.authored.gallery.slice(0,photoCount);
        progress.photoTargets=progress.photoTargets?.filter(i=>i<photoCount);
        progress.photoDrafts=Object.fromEntries(Object.entries(progress.photoDrafts || {}).filter(([key])=>Number(key)<photoCount));
        progress.photoRepairLabels=Object.fromEntries(Object.entries(progress.photoRepairLabels || {}).filter(([key])=>Number(key)<photoCount));
    }
    return {plan,unitAttempts:Object.fromEntries(Object.entries(s.unitAttempts||{}).filter(([key,value])=>/^(dossier|index|public|photo_[1-8])$/.test(key)&&typeof value==='number').map(([key,value])=>[key,Math.max(0,Math.min(2,Number(value)))])),quarantinedProgress,quarantineReason:quarantinedProgress?'Saved authoring needs storage review; it was preserved and will not be regenerated.':undefined,attemptRevision:typeof s.attemptRevision==='string'?s.attemptRevision:undefined,failureSignature:typeof s.failureSignature==='string'?s.failureSignature.slice(0,2000):undefined,id:s.id.slice(0,80),photoCount,questionCount,variety:s.variety||{},presentation,status:quarantinedProgress?'failed':['saved','failed'].includes(s.status)?s.status:'pending',attempts:Math.min(3,Math.max(0,Number(s.attempts)||0)),progress,selection:normalizeCharacterSelection(s.selection)};
}
export function normalizeDiscoveryJob(v: any): DiscoveryJob | undefined {
    if (v?.version !== 2 || typeof v.id !== 'string' || typeof v.fingerprint !== 'string' || !Array.isArray(v.slots))
        return undefined;
    return { invocation:typeof v.invocation?.startedAt==='string'?{id:typeof v.invocation.id==='string'?v.invocation.id:'older',startedAt:v.invocation.startedAt,startingReady:Math.max(0,Number(v.invocation.startingReady)||0),firstPublishedAt:typeof v.invocation.firstPublishedAt==='string'?v.invocation.firstPublishedAt:undefined,completedAt:typeof v.invocation.completedAt==='string'?v.invocation.completedAt:undefined}:undefined,activeClaims:Object.fromEntries(Object.entries(v.activeClaims||{}).filter(([k,val])=>/^slot_\d{1,3}$/.test(k)&&typeof val==='string')) as Record<string,string>,requestReservations:Object.fromEntries(Object.entries(v.requestReservations||{}).filter(([k,val]:[string,any])=>k.length<=300&&typeof val?.slotId==='string'&&typeof val.workerId==='string'&&typeof val.startedAt==='string')) as DiscoveryJob['requestReservations'],creationContract:typeof v.creationContract==='string'?v.creationContract:undefined,scheduling:creationSettings(v.scheduling),planSchema:typeof v.planSchema==='string'?v.planSchema:undefined,spent:normalizeUsageTotals(v.spent), brief: typeof v.brief === 'string' ? v.brief.slice(0,2000) : undefined, reviewDraft: v.reviewDraft && typeof v.reviewDraft === 'object' && !Array.isArray(v.reviewDraft) && JSON.stringify(v.reviewDraft).length <= 900000 ? structuredClone(v.reviewDraft) : undefined, authoringRevision: typeof v.authoringRevision==='string'?v.authoringRevision.slice(0,80):'unrecorded-v2', photoBatchSize: [3, 4, 5].includes(v.photoBatchSize) ? v.photoBatchSize : undefined, tagSelectionVersion: v.tagSelectionVersion === 1 ? 1 : undefined, lastError: typeof v.lastError === 'string' ? v.lastError.slice(0, 1000) : undefined, warnings: (Array.isArray(v.warnings) ? v.warnings : []).slice(-25).filter((w: any) => typeof w.profileId === 'string' && Array.isArray(w.similarTo)).map((w: any) => ({ profileId: w.profileId.slice(0, 180), similarTo: w.similarTo.filter((id: any) => typeof id === 'string').slice(0, 10), dimension: 'bio' })), firstReadyAt: typeof v.firstReadyAt === 'string' ? v.firstReadyAt.slice(0, 40) : undefined, experience: normalizeExperience(v.experience), allTropes: v.allTropes===true,adultJobs:v.adultJobs!==false,appearanceDiversity:v.appearanceDiversity!==false, completedAt: typeof v.completedAt === 'string' ? v.completedAt.slice(0, 40) : undefined, version: 2, id: v.id.slice(0, 180), fingerprint: v.fingerprint.slice(0, 100000), status: ['filling', 'paused', 'complete', 'partial'].includes(v.status) ? v.status : 'paused',
        slots: v.slots.slice(0, 100).flatMap((s: any) => typeof s?.id === 'string' ? [normalizeDiscoverySlot(s)] : []),
        acceptedIds: (Array.isArray(v.acceptedIds) ? v.acceptedIds : []).filter((x: any) => typeof x === 'string').slice(0, 100), createdAt: String(v.createdAt || '').slice(0, 40), updatedAt: String(v.updatedAt || '').slice(0, 40),
        metrics: (Array.isArray(v.metrics) ? v.metrics : []).slice(-250).map((m: any) => Object.fromEntries(['requested', 'accepted', 'promptBytes', 'outputBytes', 'latencyMs', 'commitMs', 'invalid'].map(k => [k, Math.max(0, Number(m[k]) || 0)]).concat([['validationIssues',normalizeAuthoringIssues(m.validationIssues)] as any,['repairOperation',['local','extract','author','rewrite','photo','blocked','resume'].includes(m.repairOperation)?m.repairOperation:undefined] as any,['promptSections',m.promptSections?normalizeByteSections(m.promptSections):undefined] as any,['discardedLabels',Array.isArray(m.discardedLabels)?m.discardedLabels.filter((l:any)=>typeof l==='string').slice(0,100):undefined] as any,...['repairPolicyVersion','policyVersion','catalogVersion','speciesPolicyVersion','speciesCatalogVersion','creativeSpeciesStatus','organizerReason'].map(k=>[k,typeof m[k]==='string'?m[k].slice(0,160):undefined] as any),['authoringRevision', typeof m.authoringRevision === 'string' ? m.authoringRevision.slice(0,80) : undefined] as any, ['code', typeof m.code==='string'?m.code.slice(0,80):undefined] as any, ['savedUnits',Number.isInteger(m.savedUnits)?Math.max(0,m.savedUnits):undefined] as any, ['task', ['dossier','index','public','photos'].includes(m.task) ? m.task : undefined] as any, ['failureLayer', ['provider','authoring','parse','validation','protected-field','stale-context','storage','ui-sync'].includes(m.failureLayer) ? m.failureLayer : undefined] as any, ['unresolvedLabels', Array.isArray(m.unresolvedLabels) ? m.unresolvedLabels.filter((s:any) => typeof s === 'string').slice(0,60).map((s:string)=>s.slice(0,100)) : undefined] as any, ['optimizationVersion', m.optimizationVersion === 1 ? 1 : undefined] as any, ['batchSize', Number.isInteger(m.batchSize) && m.batchSize >= 1 && m.batchSize <= 8 ? m.batchSize : undefined] as any, ['repair', m.repair === true] as any, ['stage', ['identity', 'public', 'photos'].includes(m.stage) ? m.stage : undefined] as any, ['checkpoint', m.checkpoint === true] as any, ['diagnostic', normalizeDiscoveryDiagnostic(m.diagnostic)] as any, ['attempt', Number.isInteger(m.attempt) && m.attempt >= 1 && m.attempt <= 3 ? m.attempt : undefined] as any, ['photoOffset', Number.isInteger(m.photoOffset) && m.photoOffset >= 0 && m.photoOffset <= 8 ? m.photoOffset : undefined] as any, ...['promptTokens', 'completionTokens', 'totalTokens', 'reasoningTokens', 'cachedTokens'].map(k => [k, typeof m[k] === 'number' && Number.isFinite(m[k]) && m[k] >= 0 ? m[k] : undefined] as any), ['usageStatus', ['reported', 'partial'].includes(m.usageStatus) ? m.usageStatus : 'unavailable'] as any, ['requestId', typeof m.requestId === 'string' ? m.requestId.slice(0, 180) : undefined] as any, ['slotId', typeof m.slotId === 'string' && /^slot_\d{1,3}$/.test(m.slotId) ? m.slotId : undefined] as any]))) as DiscoveryJob['metrics'] };
}
/** A bounded retained window, not a fabricated lifetime/billing total. */
export function discoveryUsageSummary(job: DiscoveryJob) {
    const reported = job.metrics.filter(m => typeof m.promptTokens === 'number' && typeof m.completionTokens === 'number');
    return { attempts: job.metrics.length, reportedAttempts: reported.length,
        promptTokens: reported.reduce((n, m) => n + m.promptTokens!, 0), completionTokens: reported.reduce((n, m) => n + m.completionTokens!, 0),
        rejected: job.metrics.filter(m => m.invalid).length, published: job.acceptedIds.length };
}
/** Current-version retained attempts only; excludes unknown charges and historic failures. */
export function discoveryQualitySummary(job: DiscoveryJob) {
    const attempts = job.metrics.filter(m => m.optimizationVersion === 1 && m.authoringRevision === LUMISTRY_V2_REVISION);
    const first = attempts.filter(m => !m.repair), repairs = attempts.filter(m => m.repair);
    const measured = attempts.filter(m => typeof m.promptTokens === 'number' && typeof m.completionTokens === 'number');
    const published = attempts.filter(m => m.accepted).length;
    const tokens = measured.reduce((n, m) => n + m.promptTokens! + m.completionTokens!, 0);
    return { attempts: attempts.length, first: first.length, firstAccepted: first.filter(m => !m.invalid).length,
        repairs: repairs.length, repairsAccepted: repairs.filter(m => !m.invalid).length,
        measured: measured.length, tokens, reasoning: attempts.reduce((n, m) => n + (m.reasoningTokens || 0), 0), published,
        tokensPerProfile: published && measured.length === attempts.length && attempts.length === job.metrics.length && attempts.length < 250 && job.status === 'complete' ? Math.round(tokens / published) : undefined };
}
// Fingerprints deliberately contain no private Persona or chat text. Not telemetry.
export const discoveryFingerprint = (d: DatingState): string => JSON.stringify([compatibilityFingerprint(d),filterSignature(d.filters,true),...(d.experiencePreferences?[d.experiencePreferences]:[]), d.worldContext, normalizePopulationWorld(d.populationWorld,d.worldContext),d.worldFields,...(d.worldGuide?[d.worldGuide]:[]), d.self && { alias: d.self.alias, age: d.self.age, bio: d.self.bio, pronouns: d.self.pronouns, fields: Object.fromEntries(Object.entries(d.self.fields).filter(([k]) => !d.self!.hiddenFields.includes(k))) },...(d.settingKey&&d.settingKey!==settingKeyFor(d.worldContext,normalizePopulationWorld(d.populationWorld,d.worldContext).kind)?[d.settingKey]:[])]);
export function compactDiscoveryLedger(profiles: DatingProfile[]) {
    return profiles.slice(-100).map(p => ({ alias: p.alias, age: p.age, occupation: p.fields.occupation, anchors: p.person?.life.routine, voice: p.person?.writingVoice, bio: p.bio.slice(0, 240), questions: p.person?.prompts.map(x => x.question), photos: p.photoPlan.map(x => x.kind), appearance: datingAppearance(p).slice(0, 180) }));
}
/** Adapt omitted flat prompts before the native normalizer, without another model call. */
export function adaptDiscoveryPhotos(raw: any): any {
    if (!raw || typeof raw !== 'object')
        return raw;
    const adapt = (p: any) => p && typeof p === 'object' ? { ...p, prompt: typeof p.prompt === 'string' && p.prompt.trim() ? p.prompt : typeof p.description === 'string' ? p.description : '', subjectIds: Array.isArray(p.subjectIds) ? p.subjectIds : Array.isArray(p.visual?.subjects) ? p.visual.subjects.map((s: any) => s?.id) : ['self'] } : p;
    return { ...raw, photoPlan: Array.isArray(raw.photoPlan) ? raw.photoPlan.map(adapt) : raw.photoPlan, openingPhoto: raw.openingPhoto ? adapt(raw.openingPhoto) : null };
}
/** Pure format adaptation: no invented facts, completed text or new image/model calls. */
export function adaptDiscoveryProfile(raw: any): any {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const p = structuredClone(raw);
    for (const key of ['age', 'distanceKm'])
        if (typeof p[key] === 'string' && /^\d+(?:\.\d+)?$/.test(p[key].trim())) p[key] = Number(p[key]);
    const leafStrings = (v: any) => {
        if (!v || typeof v !== 'object' || Array.isArray(v)) return;
        for (const [key, value] of Object.entries(v))
            if (Array.isArray(value) && value.every(x => typeof x === 'string')) v[key] = value.join(', ');
    };
    if (p.fields && typeof p.fields === 'object' && !Array.isArray(p.fields)) for (const key of Object.keys(p.fields)) p.fields[key] = selectionText(p.fields[key]);
    leafStrings(p.privateFields); leafStrings(p.phoneProfile);
    if (typeof p.fields?.height === 'number' && Number.isFinite(p.fields.height)) p.fields.height = String(p.fields.height) + ' cm';
    if (p.person && typeof p.person === 'object' && !Array.isArray(p.person)) {
        p.person.version ??= 1;
        if (typeof p.person.availability === 'string' && !/^[\[{]/.test(p.person.availability.trim())) p.person.availability = { routine: p.person.availability };
        const availability = p.person.availability;
        if (availability && typeof availability === 'object' && !Array.isArray(availability)) {
            const known = new Set(['routine', 'appHabits', 'minReplySeconds', 'maxReplySeconds', 'quietStart', 'quietEnd']);
            const notes = Object.entries(availability).filter(([key, value]) => !known.has(key) && typeof value === 'string');
            if (notes.length) {
                const detail = notes.map(([key, value]) => key + ': ' + value).join('\n');
                availability.routine = [availability.routine, detail].filter(v => typeof v === 'string' && v.trim()).join('\n');
                for (const [key] of notes) delete availability[key];
            }
        }
        // Explicit timing label in a labeled life record belongs in availability.
        // Preserve every authored timing detail, without duplicating identical text.
        if (typeof p.person.life?.availability === 'string' && p.person.life.availability.trim() && (p.person.availability == null || typeof p.person.availability === 'object' && !Array.isArray(p.person.availability))) {
            p.person.availability ??= {};
            const timing = p.person.life.availability.trim(), existing = p.person.availability.routine;
            p.person.availability.routine = typeof existing === 'string' && existing.trim() && existing.trim() !== timing ? existing.trim() + '\n' + timing : timing;
            delete p.person.life.availability;
        }
        if (p.person.version === '1') p.person.version = 1;
        // Constants are transport bookkeeping, never a model-authored character fact.
        if (p.interest && typeof p.interest === 'object' && !Array.isArray(p.interest)) p.interest.version ??= 2;
        if (!p.person.intimacy?.role && typeof p.person.intimacy?.sexualRole === 'string') p.person.intimacy.role = p.person.intimacy.sexualRole;
        if (p.person.intimacy && p.person.intimacy.sexualRole === p.person.intimacy.role) delete p.person.intimacy.sexualRole;
        for (const key of ['appearance', 'life', 'intimacy', 'writingVoice', 'presentation']) leafStrings(p.person[key]);
    }
    p.privateFields = p.privateFields && typeof p.privateFields === 'object' && !Array.isArray(p.privateFields) ? p.privateFields : {};
    if (!p.privateFields.commitments) {
        const commitment = p.commitments || p.person?.life?.commitments || p.privateFields.relationshipCommitments;
        if (typeof commitment === 'string' && commitment.trim()) p.privateFields.commitments = commitment;
    }
    delete p.commitments;
    if (p.person?.life && p.person.life.commitments === p.privateFields.commitments) delete p.person.life.commitments;
    if (p.privateFields.relationshipCommitments === p.privateFields.commitments) delete p.privateFields.relationshipCommitments;
    // Resolve exact saved names/case only; never guess a person's position or add a body.
    // Some responses put the explicitly described entity table at profile root.
    if (p.person && (!Array.isArray(p.person.entities) || !p.person.entities.length) && Array.isArray(p.entities)) {
        p.person.entities = p.entities;
        delete p.entities;
    }
    const entities = Array.isArray(p.person?.entities) ? p.person.entities : [];
    const originalIds = new Map<any, string>();
    const taken = new Set(['self', ...entities.map((e: any) => e?.id).filter((id: any) => typeof id === 'string')]);
    for (const [index, entity] of entities.entries()) {
        if (!entity || typeof entity !== 'object' || (typeof entity.id === 'string' && /^[a-z][a-z0-9_-]{0,39}$/.test(entity.id)) || typeof entity.name !== 'string' || !entity.name.trim() || typeof entity.appearance !== 'string' || !entity.appearance.trim()) continue;
        const name = entity.name.trim().toLowerCase();
        // Allocate/repair transport IDs only for explicitly described, unambiguous identities.
        if (name === 'self' || name === String(p.alias || '').trim().toLowerCase() || entities.filter((e: any) => typeof e?.name === 'string' && e.name.trim().toLowerCase() === name).length !== 1) continue;
        let id = 'entity_' + (index + 1);
        while (taken.has(id)) id += '_';
        if (id.length > 40) continue;
        if (typeof entity.id === 'string' && entity.id.trim()) originalIds.set(entity, entity.id.trim());
        entity.id = id; taken.add(id);
    }
    const references = [{ id: 'self', name: p.alias }, ...entities.filter((e: any) => e && typeof e === 'object')];
    const resolve = (id: any) => {
        if (typeof id !== 'string') return id;
        const byId = references.filter(e => (typeof e.id === 'string' && e.id.toLowerCase() === id.trim().toLowerCase()) || originalIds.get(e)?.toLowerCase() === id.trim().toLowerCase());
        const matches = byId.length ? byId : references.filter(e => typeof e.name === 'string' && e.name.trim().toLowerCase() === id.trim().toLowerCase());
        return matches.length === 1 ? matches[0].id : matches.length > 1 ? null : id;
    };
    for (const photo of [...(Array.isArray(p.photoPlan) ? p.photoPlan : []), ...(p.openingPhoto ? [p.openingPhoto] : [])]) {
        if (!photo || typeof photo !== 'object') continue;
        if (Array.isArray(photo.visual?.subjects)) {
            photo.visual.subjects = photo.visual.subjects.map((subject: any) => subject && typeof subject === 'object' ? { ...subject, id: resolve(subject.id ?? subject.entityId ?? subject.subjectId ?? subject.name) } : subject);
            const visibleIds = photo.visual.subjects.map((subject: any) => subject?.id);
            // The explicit layout is authoritative even when invalid: retain bad
            // references for validation rather than falling back to an unseen self.
            photo.subjectIds = visibleIds;
            if (new Set(visibleIds).size === visibleIds.length && visibleIds.every((id: any) => references.some(e => e.id === id))) {
                if (photo.subjectPosition === undefined || photo.subjectPosition === '') photo.subjectPosition = photo.visual.subjects.find((subject: any) => subject.id === 'self')?.position || '';
            }
        }
        if (Array.isArray(photo.subjectIds)) photo.subjectIds = photo.subjectIds.map(resolve);
    }
    const adapted = adaptDiscoveryPhotos(p);
    for (const photo of [...(Array.isArray(adapted.photoPlan) ? adapted.photoPlan : []), ...(adapted.openingPhoto ? [adapted.openingPhoto] : [])])
        if (photo && (photo.aspect === undefined || photo.aspect === '')) photo.aspect = 'portrait';
    return adapted;
}
/** Repairs may return a small nested correction instead of repeating every valid fact/photo. */
export function mergeDiscoveryRepair(draft: any, correction: any): any {
    if (!draft || typeof draft !== 'object' || !correction || typeof correction !== 'object' || Array.isArray(correction)) return correction;
    const merge = (a: any, b: any): any => {
        if (!b || typeof b !== 'object' || Array.isArray(b)) return b;
        return Object.fromEntries([...new Set([...Object.keys(a && typeof a === 'object' && !Array.isArray(a) ? a : {}), ...Object.keys(b)])].filter(k => !['__proto__', 'constructor', 'prototype'].includes(k)).map(k => [k, Object.hasOwn(b, k) ? merge(a?.[k], b[k]) : a[k]]));
    };
    const { photoPatches, ...fields } = correction;
    const result = merge(structuredClone(draft), fields);
    if (Array.isArray(photoPatches) && Array.isArray(result.photoPlan))
        for (const patch of photoPatches)
            if (Number.isInteger(patch?.index) && patch.index >= 0 && patch.index < result.photoPlan.length && patch.photo && typeof patch.photo === 'object' && !Array.isArray(patch.photo))
                result.photoPlan[patch.index] = merge(result.photoPlan[patch.index], patch.photo);
    return result;
}
export function discoveryProblems(raw: any, slot: DiscoverySlot): string[] {
    const issues: string[] = [];
    const filled = (v: any) => typeof v === 'string' && !!v.trim();
    if (!raw || typeof raw !== 'object' || raw.slotId !== slot.id)
        return ['slotId'];
    if (!Number.isInteger(raw.age) || raw.age < 18 || !Number.isFinite(raw.distanceKm) || raw.distanceKm < 0)
        issues.push('age/distance');
    if (typeof raw.alias !== 'string' || !raw.alias.trim() || raw.alias.length > 120 || typeof raw.bio !== 'string' || !bioWithinBounds(raw.bio))
        issues.push('public identity');
    const q = raw.person?.prompts;
    if (!Array.isArray(q) || q.length !== slot.questionCount || q.length < AUTHORING_LIMITS.questionsMin || q.length > AUTHORING_LIMITS.questionsMax || q.some((x: any) => !filled(x?.question) || !filled(x?.answer) || x.question.length > 120 || x.answer.length > 360) || new Set(q.map((x: any) => typeof x?.question === 'string' ? x.question.toLowerCase().trim() : '')).size !== q.length)
        issues.push('questions');
    if (raw.person?.version !== 1) issues.push('person.version');
    for (const key of ['orientation', 'commitments', 'intentions'])
        if (!datingFact(raw,key) || /^(unknown|not[ _]established|not disclosed|prefer not to say|not specified|private|discuss privately|undisclosed|withheld|n\/a)[.!]?$/i.test(datingFact(raw,key).trim())) issues.push('privateFields.'+key);
    if ((raw.phoneProfile?.appearance !== undefined && typeof raw.phoneProfile.appearance !== 'string') || !hasDatingAppearance(raw) || ![raw.person?.life?.routine, raw.phoneProfile?.textingStyle, raw.phoneProfile?.personality, raw.person?.writingVoice?.register].every(filled))
        issues.push('identity/voice/routine');
    if (!Array.isArray(raw.photoPlan) || raw.photoPlan.length !== slot.photoCount) issues.push('planned photo count');
    issues.push(...datingPhotoProblems(raw));
    return issues;
}
/** Shared photo contract for every generated dating profile, not just fast discovery. */
export function datingPhotoProblems(raw: any): string[] {
    if (!raw || typeof raw !== 'object') return ['photo count'];
    const issues: string[] = [];
    const filled = (value: any) => typeof value === 'string' && !!value.trim();
    for (const entity of Array.isArray(raw.person?.entities) ? raw.person.entities : [])
        if (typeof entity?.id !== 'string' || !/^[a-z][a-z0-9_-]{0,39}$/.test(entity.id) || !filled(entity?.appearance)) issues.push('person.entities identity/appearance');
    const ids = new Set(['self', ...(Array.isArray(raw.person?.entities) ? raw.person.entities : []).map((e: any) => e?.id).filter((id: any) => typeof id === 'string')]);
    if (!Array.isArray(raw.photoPlan) || raw.photoPlan.length < 1 || raw.photoPlan.length > AUTHORING_LIMITS.photosMax)
        issues.push('photo count');
    else
        for (const [i, p] of raw.photoPlan.entries()) {
            if (!p || typeof p !== 'object' || Array.isArray(p)) { issues.push(`photo ${i} content`); continue; }
            for (const key of ['description', 'prompt'] as const) {
                if (!filled(p[key])) issues.push(`photo ${i} ${key}: absent or blank`);
                else if (p[key].length > PHOTO_TEXT_LIMITS[key]) issues.push(`photo ${i} ${key}: ${p[key].length} characters; maximum ${PHOTO_TEXT_LIMITS[key]}`);
            }
            if (p.caption !== undefined && typeof p.caption !== 'string') issues.push(`photo ${i} caption: must be text`);
            else if (p.caption?.length > PHOTO_TEXT_LIMITS.caption) issues.push(`photo ${i} caption: ${p.caption.length} characters; maximum ${PHOTO_TEXT_LIMITS.caption}; shorten only the caption, preserve the scene`);
            const sceneOnly = Array.isArray(p.visual?.subjects) && p.visual.subjects.length === 0;
            const validReferences = Array.isArray(p.subjectIds) && (p.subjectIds.length > 0 || sceneOnly) && p.subjectIds.length <= PHOTO_TEXT_LIMITS.subjects && p.subjectIds.every((id: any) => ids.has(id)) && new Set(p.subjectIds).size === p.subjectIds.length;
            if (!validReferences)
                issues.push(`photo ${i} subjects: unknown or duplicate identity reference`);
            if (p.visual && validReferences) {
                const visual = normalizeDatingVisual(p.visual);
                if (!visual || visual.subjects.length !== p.visual.subjects?.length || visual.subjects.some(s => !ids.has(s.id)) || JSON.stringify([...visual.subjects.map(s => s.id)].sort()) !== JSON.stringify([...(Array.isArray(p.subjectIds) ? p.subjectIds : [])].sort()))
                    issues.push(`photo ${i} layout: inconsistent subject references`);
            }
            if (!['portrait', 'landscape', 'square'].includes(p.aspect))
                issues.push(`photo ${i} aspect`);
        }
    if (raw.openingPhoto) {
        const p = raw.openingPhoto;
        const sceneOnly = Array.isArray(p.visual?.subjects) && p.visual.subjects.length === 0;
        if (!filled(p?.description) || p.description.length > PHOTO_TEXT_LIMITS.description || !filled(p?.prompt) || p.prompt.length > 8000 || !Array.isArray(p.subjectIds) || !p.subjectIds.length && !sceneOnly || p.subjectIds.some((id: any) => !ids.has(id)))
            issues.push('opening photo');
        const visual = p.visual && normalizeDatingVisual(p.visual);
        if (p.visual && (!visual || visual.subjects.some((s: any) => !ids.has(s.id)) || JSON.stringify(visual.subjects.map((s: any) => s.id).sort()) !== JSON.stringify([...(Array.isArray(p.subjectIds) ? p.subjectIds : [])].sort())))
            issues.push('opening photo layout');
    }
    const entities = Array.isArray(raw.person?.entities) ? raw.person.entities : [];
    if (entities.some((e: any) => e?.id === 'self') || new Set(entities.map((e: any) => e?.id)).size !== entities.length) issues.push('person.entities ids must be unique and cannot be self');
    return issues;
}
export function verifiedPhotoCompilation(p: DatingProfile): boolean {
    return p.photoPlan.length > 0 && p.photoPlan.every(plan => {
        const prompt = compileDatingVisual(p, plan.visual, plan.prompt, plan.subjectIds, plan.subjectPosition);
        return (p.anonymous || !(plan.visual ? plan.visual.subjects.some(s => s.id === 'self') : plan.subjectIds.includes('self')) || hasDatingAppearance(p)) && !!prompt.trim() && prompt.length <= 12000 && !/<\/?region\b/i.test(prompt) && plan.subjectIds.every(id => id === 'self' || p.person?.entities.some(e => e.id === id));
    });
}
export function similarProfileWarnings(p: DatingProfile, existing: DatingProfile[]): string[] {
    const words = (s: string) => new Set(s.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x => x.length > 2));
    const a = words(p.bio);
    if (a.size < 8)
        return [];
    return existing.filter(x => { const b = words(x.bio); return b.size >= 8 && [...a].filter(w => b.has(w)).length / new Set([...a, ...b]).size > .65; }).map(x => x.id);
}
