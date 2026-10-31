import {normalizeAuthoringIssues} from './lumistry-authoring-contract.js';
import {normalizeCreationTrace,type CreationAttemptTrace} from './lumistry-generation-trace.js';
import {normalizeRepairPlan,type RepairPlan} from './lumistry-repair.js';
import type { AuthoringIssue } from './lumistry-authoring-contract.js';
import { normalizeAuthoring, type PersonAuthoring, type AuthoredArtifact, type AuthoringKind } from './lumistry-v2.js';
export type DiscoveryStage = 'identity' | 'public' | 'photos';
export interface DiscoveryProgress {
    lastAttempt?:CreationAttemptTrace;
    version: 2;
    stage: DiscoveryStage;
    task: 'dossier' | 'index' | 'public' | 'photos';
    draft: Record<string, any>;
    authored: PersonAuthoring;
    pendingArtifact?: AuthoredArtifact;
    photoDrafts?: Record<string, AuthoredArtifact>;
    problems: string[];
    issues?:AuthoringIssue[];
    repairPlan?:RepairPlan;
    repairReturn?:'public'|'photos';
    rejectedArtifact?:AuthoredArtifact;
    repairResumeArtifact?:AuthoredArtifact;
    repairLabels?: string[];
    photoRepairLabels?: Record<string, string[]>;
    /** Absolute gallery slots still needing work; generated IDs remain engine-owned. */
    photoTargets?: number[];
}
export function normalizeDiscoveryProgress(v: any): DiscoveryProgress | undefined {
    const authored = normalizeAuthoring(v?.authored);
    if (v?.version !== 2 || !['identity', 'public', 'photos'].includes(v.stage) || !({ identity: ['dossier', 'index'], public: ['public'], photos: ['photos'] } as Record<string, string[]>)[v.stage]?.includes(v.task) || !authored || !v.draft || typeof v.draft !== 'object' || Array.isArray(v.draft) || JSON.stringify(v).length > 900000)
        return undefined;
    return { lastAttempt:normalizeCreationTrace(v.lastAttempt),repairResumeArtifact:v.repairResumeArtifact?.version===2&&typeof v.repairResumeArtifact.text==='string'&&v.repairResumeArtifact.text.length<=128000?structuredClone(v.repairResumeArtifact):undefined,repairPlan:normalizeRepairPlan(v.repairPlan),repairReturn:['public','photos'].includes(v.repairReturn)?v.repairReturn:undefined,rejectedArtifact:v.rejectedArtifact?.version===2&&typeof v.rejectedArtifact.text==='string'&&v.rejectedArtifact.text.length<=128000?structuredClone(v.rejectedArtifact):undefined,issues:normalizeAuthoringIssues(v.issues), version: 2, stage: v.stage, task: v.task, draft: structuredClone(v.draft), authored, photoDrafts: Object.fromEntries(Object.entries(v.photoDrafts || {}).filter(([k, a]: [
            string,
            any
        ]) => /^[0-7]$/.test(k) && a?.version === 2 && typeof a.text === 'string' && a.text.length <= 128000)) as Record<string, AuthoredArtifact>, pendingArtifact: v.pendingArtifact?.version === 2 && typeof v.pendingArtifact.text === 'string' && v.pendingArtifact.text.length <= 128000 ? structuredClone(v.pendingArtifact) : undefined, repairLabels: Array.isArray(v.repairLabels) ? v.repairLabels.filter((s: any) => typeof s === 'string').slice(0,100) : undefined, photoRepairLabels: Object.fromEntries(Object.entries(v.photoRepairLabels || {}).filter(([k,v]) => /^[0-7]$/.test(k) && Array.isArray(v)).map(([k,v]) => [k,(v as unknown[]).filter((s: any) => typeof s === 'string').slice(0,30)])), problems: (Array.isArray(v.problems) ? v.problems : []).filter((s: any) => typeof s === 'string').slice(0, 40).map((s: string) => s.slice(0, 200)), photoTargets: (Array.isArray(v.photoTargets) ? v.photoTargets : []).filter((i: any) => Number.isInteger(i) && i >= 0 && i < 8).slice(0, 8) };
}
