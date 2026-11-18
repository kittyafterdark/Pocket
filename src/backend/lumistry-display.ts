import type { DatingState, DatingProfile } from '../domain/lumistry.js'
import type { DiscoveryJob, DiscoverySlot } from '../domain/lumistry-pipeline.js'
import type { PhoneState } from '../types.js'

function displayProfile(profile: DatingProfile): DatingProfile {
  return profile.authoring ? { ...profile, authoring: undefined, hasPrivateAuthoring: true } : profile
}

function displaySlot(slot: DiscoverySlot): DiscoverySlot {
  const progress = slot.progress
  return {
    ...slot,
    quarantinedProgress: slot.quarantinedProgress ? {} : undefined,
    progress: progress ? {
      version: progress.version,
      stage: progress.stage,
      task: progress.task,
      draft: { speciesProposal: progress.draft.speciesProposal },
      authored: { version: 2, photos: [], gallery: [], provenance: {} },
      issues: progress.issues,
      problems: progress.problems,
      lastAttempt: progress.lastAttempt && { ...progress.lastAttempt, messages: undefined, responseText: undefined },
    } : undefined,
  }
}

function displayJob(job?: DiscoveryJob): DiscoveryJob | undefined {
  return job && { ...job, slots: job.slots.map(displaySlot), reviewDraft: job.reviewDraft ? {} : undefined }
}

export function projectLumistryDisplay(lumistry: PhoneState['lumistry']): PhoneState['lumistry'] {
  return lumistry && Object.fromEntries(Object.entries(lumistry).map(([owner, data]) => [owner, {
    ...data,
    // The Persona editor uses its full profile for conflict detection and saved copies.
    profiles: data.profiles.map(displayProfile),
    discoveryJob: displayJob(data.discoveryJob),
    draftJob: displayJob(data.draftJob),
  }]))
}

export function discoveryRepairEvidence(data: DatingState, job: DiscoveryJob, slot: DiscoverySlot, exportedAt: string) {
  return {
    schema: 'lumistry-replay-1',
    categoryOptions: Object.fromEntries(data.worldFields.map(field => [field.key, field.options])),
    exportedAt,
    contract: job.creationContract,
    jobId: job.id,
    slotId: slot.id,
    plan: slot.plan,
    counts: { questions: slot.questionCount, photos: slot.photoCount },
    attempts: slot.unitAttempts,
    spent: job.spent,
    progress: slot.progress,
    quarantine: slot.quarantinedProgress,
  }
}
