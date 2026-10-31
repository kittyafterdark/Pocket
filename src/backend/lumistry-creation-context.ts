import {textingPublicProfile} from '../domain/lumistry-messaging.js';
import {sourceLabelsFor} from '../domain/lumistry-repair.js';
import {nativeSummary,AUTHORING_LIMITS} from '../domain/lumistry-authoring-contract.js';
import type {AuthoringIssue} from '../domain/lumistry-authoring-contract.js';
import {revalidatePublicArtifact} from '../domain/lumistry-v2.js';
/** Explicit task projections keep hidden truth available without exporting archives or selection audits. */
export function publicPersonContext(p:any) {
 const privateTruth={...p.privateFields};
 if(p.creationPlan?.work&&privateTruth.identityAnchors===nativeSummary(JSON.stringify({age:p.creationPlan.age,work:p.creationPlan.work.title,appearance:p.person?.appearance,commitments:privateTruth.commitments}),AUTHORING_LIMITS.privateText))delete privateTruth.identityAnchors;
 for(const [key,value] of Object.entries(privateTruth))if(value===p.fields?.[key])delete privateTruth[key];
 return {alias:p.alias,age:p.age,pronouns:p.pronouns,anonymous:p.anonymous,fields:p.fields,hiddenFields:p.hiddenFields,
 privateTruth,
 disclosureRule:'Private truths prevent contradictions; presence here grants no permission to publish them. Use only accepted disclosure. Visible category facts are displayed as badges separately; they are optional topics, never a bio checklist. Do not announce withheld topics.',
 person:{appearance:p.person?.appearance,anatomy:p.person?.anatomy,life:p.person?.life,writingVoice:p.person?.writingVoice,presentation:p.person?.presentation,entities:p.person?.entities,unresolvedSubjects:p.person?.unresolvedSubjects},personality:p.phoneProfile?.personality,pleasures:p.privateFields?.pleasures};
}
export function organizerPassages(fields:Record<string,string>,labels:string[]) {
 // Related explicit source labels are evidence; no entire duplicate dossier/index payload.
 const requested=new Set(labels.flatMap(l=>[...sourceLabelsFor(l),...(l.startsWith('Companion')?Object.keys(fields).filter(k=>k.startsWith('Companion')):[])]));
 return Object.fromEntries(Object.entries(fields).filter(([label])=>requested.has(label)));
}
export function narrowRepair(artifact:any,labels:string[],problems:string[],issues:AuthoringIssue[]=[],counts?:{questions:number;photos:number}) {
 if(!artifact)return {problems};
 if(artifact.kind==='public')artifact=revalidatePublicArtifact(artifact,undefined,false);
 const ids=[...new Set(issues.map(i=>i.recordId).filter((id):id is string=>!!id))];
 const wanted=new Set(labels),records=(artifact.records||[]).filter((r:any)=>ids.length?ids.includes(r.id):Object.keys(r.fields).some(k=>wanted.has(k)));
 if(counts)for(const id of ids)if(!records.some((r:any)=>r.id===id)&&/^(question|gallery)_[1-5]$/.test(id))records.push({id,start:id.startsWith('question_')?'Question':'Gallery photo purpose',fields:{}});
 const recordLabels=new Set([...records.flatMap((r:any)=>Object.keys(r.fields)),...(artifact.kind==='public'?['Question','Answer','Gallery photo purpose']:[])]);
 return {problems,retainedFields:Object.fromEntries(Object.entries(artifact.fields||{}).filter(([k])=>wanted.has(k)&&!recordLabels.has(k))),recordReferences:records.map((r:any)=>({id:r.id,start:r.start,fields:r.fields}))};
}

/** The engine owns references even when the model omitted a record. */
export function canReferencePublicRepair(artifact:any,labels:string[],questions:number,photos:number):boolean {
 return !!artifact&&questions>=1&&questions<=3&&photos>=1&&photos<=5&&labels.some(l=>['Question','Answer','Gallery photo purpose'].includes(l));
}
/** Lossless with respect to actual facts: keep false, zero, null and explicit empty lists. */
export function compactCreationContext(value:any):any {
 if(Array.isArray(value))return value.map(compactCreationContext);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).flatMap(([k,v])=>{
  if(v===undefined||v==='')return [];
  const child=compactCreationContext(v);
  return child&&typeof child==='object'&&!Array.isArray(child)&&!Object.keys(child).length?[]:[[k,child]];
 }));
 return value;
}
/** Bytes are attributable source size, not tokenizer/provider usage. */
export function requestSectionBytes(system:string,context:Record<string,unknown>):Record<string,number> {
 const bytes=(s:string)=>new TextEncoder().encode(s).length;
 const entries=Object.entries(context).filter(([,v])=>v!==undefined);
 return {instructions:bytes(system),jsonFraming:entries.length?entries.length+1:2,...Object.fromEntries(entries.map(([k,v])=>['input.'+k,bytes(JSON.stringify({[k]:v}))-2]))};
}
export function creationRepairContext(input:any,progress:any,labels:string[],operation:string):any {
 if(input.task==='photos')return input;
 if(input.task==='index')return {task:'index',stage:input.stage,worldContext:input.worldContext,requestedUnresolved:labels,sourcePassages:input.sourcePassages,sourceRecords:input.sourceRecords,categoryOptions:input.categoryOptions,allowedPublicCategoryKeys:input.allowedPublicCategoryKeys,acceptedFacts:input.acceptedFacts,repair:input.repair,repairOperation:operation};
 if(input.task==='public')return {...creationTaskContext(input),requestedUnresolved:labels,repairOperation:operation};
 if(labels.length&&labels.every(l=>l==='Public alias'))return {
  task:'dossier',stage:input.stage,repairOperation:operation,requestedUnresolved:labels,
  existingAliases:input.existingAliases,acceptedAlias:progress.draft.alias,
  nameEvidence:progress.authored.dossier?.fields?.['Name and dating alias'],anonymous:progress.draft.anonymous,
  repair:input.repair,
 };
 return {task:'dossier',stage:input.stage,repairOperation:operation,requestedUnresolved:labels,worldContext:input.worldContext,
  requestedPrivatePreferences:labels.some(l=>/kink|sexual|boundar/i.test(l))?input.requestedPrivatePreferences:undefined,lockedCandidate:input.lockedCandidate,requiredValues:input.requiredValues,requiredPublicCategories:input.requiredPublicCategories,
  exactAdultAge:input.exactAdultAge,existingAliases:labels.includes('Public alias')?input.existingAliases:undefined,
  acceptedPerson:publicPersonContext(progress.draft),repair:input.repair};
}

export function creationTaskContext(input:any):any {
 if(input.task==='public') {
  // Filter provenance belongs to planning/indexing, never the public writer.
  // Accepted facts/disclosure remain available for consistency and free topic choice.
  const {authoringRevision,task,stage,worldContext,worldPresentation,counts,acceptedPerson,presentation,experience,questionReferences,galleryReferences,recentPublicWriting,recentOverusedMotifs,repair}=input;
  const variety=input.variety?Object.fromEntries(Object.entries(input.variety).filter(([key])=>!['relationshipFocus','nameInitial','detailInitial'].includes(key))):undefined;
  return {authoringRevision,task,stage,worldContext,worldPresentation,counts,acceptedPerson,presentation,experience,variety,questionReferences,galleryReferences,recentPublicWriting,recentOverusedMotifs,repair};
 }
 if(input.task==='dossier'&&input.variety)return {...input,variety:Object.fromEntries(Object.entries(input.variety).filter(([key])=>!['nameInitial','detailInitial'].includes(key)))};
 if(input.task!=='photos')return input;
 const {authoringRevision,task,stage,worldContext,worldPresentation,experience,presentation,visibleSubjectOptions,acceptedAppearance,acceptedAnatomy,occasionStyle,subjects,voice,anonymous,publicBio,purposes,priorScenes,batchCount,photoReferences,retainedPhotoRecords,requestedPhotoChanges,repair}=input;
 return {authoringRevision,task,stage,worldContext,worldPresentation,experience,presentation,visibleSubjectOptions,acceptedAppearance,acceptedAnatomy,occasionStyle,subjects,voice,anonymous,publicBio,purposes,priorScenes,batchCount,photoReferences,retainedPhotoRecords,requestedPhotoChanges,repair};
}

/** Single-item rewrites reuse the compact native public projection, never all gallery/card payloads. */
export function publicItemContext(profile:any,target:'bio'|'answer'|'caption',index:number):any {
 const acceptedPublic=textingPublicProfile(profile);if(target==='bio')delete acceptedPublic.bio;
 return compactCreationContext({task:'rewrite',target,
  question:target==='answer'?profile.person?.prompts[index]?.question:undefined,
  scene:target==='caption'?profile.photoPlan[index]?.description:undefined,
  acceptedPublic,acceptedPerson:publicPersonContext(profile),ownVoice:profile.person?.writingVoice,
  existing:target==='bio'?profile.bio:target==='answer'?profile.person?.prompts[index]?.answer:profile.photoPlan[index]?.caption});
}
