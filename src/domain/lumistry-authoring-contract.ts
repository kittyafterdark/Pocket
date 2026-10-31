/** Presentation syntax and native storage bounds, shared by every prose authoring stage.
 * Creative source is retained verbatim. Only explicit choices and derived native
 * summaries are normalized here; public prose and identity facts are never invented. */
/** Canonical field policies. Requested targets are the only limits used in model instructions. */
export const WRITING_FIELDS = {
    alias: { label:'Public alias', target:80, accepted:120, visibility:'public', phase:'identity', required:true, aliases:['Alias'], projection:'verbatim' },
    pronouns: { label:'Pronouns', target:50, accepted:80, visibility:'public', phase:'identity', required:false, aliases:[], projection:'verbatim' },
    bio: { label:'Bio', target:1100, accepted:1600, visibility:'public', phase:'public', required:true, aliases:[], projection:'verbatim' },
    question: { label:'Question', target:90, accepted:120, visibility:'public', phase:'public', required:true, aliases:[], projection:'verbatim' },
    answer: { label:'Answer', target:250, accepted:360, visibility:'public', phase:'public', required:true, aliases:[], projection:'verbatim' },
    galleryPurpose: { label:'Gallery photo purpose', target:420, accepted:600, visibility:'private', phase:'public', required:true, aliases:[], projection:'verbatim' },
    companionName: { label:'Companion name', target:50, accepted:80, visibility:'private', phase:'identity', required:false, aliases:[], projection:'verbatim' },
    relationship: { label:'Companion relationship', target:120, accepted:180, visibility:'private', phase:'identity', required:false, aliases:[], projection:'verbatim' },
    nativeText: { label:'Native description', target:420, accepted:600, visibility:'private', summary:true, phase:'identity', required:false, aliases:[], projection:'summary' },
    privateText: { label:'Private fact', target:700, accepted:1000, visibility:'private', phase:'identity', required:false, aliases:[], projection:'verbatim' },
    visualText: { label:'Visual direction', target:350, accepted:500, visibility:'private', summary:true, phase:'photos', required:false, aliases:[], projection:'summary' },
    clothing: { label:'Clothing and accessories', target:160, accepted:240, visibility:'private', summary:true, phase:'photos', required:false, aliases:[], projection:'summary' },
    pose: { label:'Pose, action and gaze', target:110, accepted:160, visibility:'private', summary:true, phase:'photos', required:false, aliases:[], projection:'summary' },
    expression: { label:'Expression', target:90, accepted:160, visibility:'private', summary:true, phase:'photos', required:false, aliases:[], projection:'summary' },
    poseAction: { label:'Pose and action', target:110, accepted:160, visibility:'private', summary:true, phase:'photos', required:false, aliases:[], projection:'summary' },
    gaze: { label:'Gaze', target:80, accepted:120, visibility:'private', summary:true, phase:'photos', required:false, aliases:[], projection:'summary' },
    position: { label:'Subject position', target:80, accepted:120, visibility:'private', summary:true, phase:'photos', required:false, aliases:[], projection:'summary' },
    development: { label:'Additive development', target:4200, accepted:6000, visibility:'private', phase:'optional', required:false, aliases:[], projection:'verbatim' },
    caption: { label:'Public caption', target:180, accepted:600, visibility:'public', phase:'photos', required:false, aliases:[], projection:'verbatim' },
    description: { label:'Full literal description', target:600, accepted:1500, visibility:'public', phase:'photos', required:true, aliases:[], projection:'verbatim' },
    prompt: { label:'Flat image prompt', target:1100, accepted:1600, visibility:'private', phase:'photos', required:false, aliases:[], projection:'verbatim' },
    renderedPrompt: { label:'Compiled render scene', target:1100, accepted:12000, visibility:'private', phase:'optional', required:false, aliases:[], projection:'verbatim' },
} as const;
export const AUTHORING_LIMITS = {
    artifact:128000, history:125000, authoring:650000, progress:900000,
    questionsMin:1, questionsMax:3, photosMin:1, photosMax:5, companions:24, subjectsTarget:6, subjects:8,
    nativeText:WRITING_FIELDS.nativeText.accepted, privateText:WRITING_FIELDS.privateText.accepted,
    alias:WRITING_FIELDS.alias.accepted, pronouns:WRITING_FIELDS.pronouns.accepted,
    question:WRITING_FIELDS.question.accepted, answer:WRITING_FIELDS.answer.accepted,
    bio:WRITING_FIELDS.bio.accepted, bioTargetWords:65, bioWords:100,
    galleryPurpose:WRITING_FIELDS.galleryPurpose.accepted, companionName:WRITING_FIELDS.companionName.accepted,
    relationship:WRITING_FIELDS.relationship.accepted, visualText:WRITING_FIELDS.visualText.accepted,
    clothing:WRITING_FIELDS.clothing.accepted, pose:WRITING_FIELDS.pose.accepted, position:WRITING_FIELDS.position.accepted,
    compiledPhoto:WRITING_FIELDS.renderedPrompt.accepted,
} as const;
export const AUTHORING_TARGETS = {
    bioWords:65, bio:WRITING_FIELDS.bio.target, question:WRITING_FIELDS.question.target, answer:WRITING_FIELDS.answer.target,
    galleryPurpose:WRITING_FIELDS.galleryPurpose.target, alias:WRITING_FIELDS.alias.target, pronouns:WRITING_FIELDS.pronouns.target,
    nativeText:WRITING_FIELDS.nativeText.target, privateText:WRITING_FIELDS.privateText.target,
    companionName:WRITING_FIELDS.companionName.target, relationship:WRITING_FIELDS.relationship.target,
    visualText:WRITING_FIELDS.visualText.target, clothing:WRITING_FIELDS.clothing.target,
    pose:WRITING_FIELDS.pose.target, position:WRITING_FIELDS.position.target, development:WRITING_FIELDS.development.target,
} as const;
export function fieldWritingInstruction(label:string) {
    const policy=Object.values(WRITING_FIELDS).find(spec=>spec.label===label);
    if(label==='Bio')return `Bio: at most ${AUTHORING_TARGETS.bioWords} words and ${AUTHORING_TARGETS.bio} characters.`;
    if(label==='Visible subjects')return `Visible subjects: at most ${AUTHORING_LIMITS.subjectsTarget} explicitly visible accepted subject references, or none.`;
    return `${label}: ${policy ? `at most ${policy.target} characters; ` : ''}preserve accepted facts and use the supplied record format.`;
}
/** Diagnostics describe application failures. Model instructions come from typed field policy, never error text. */
export function repairInstructions(issues:AuthoringIssue[], labels:string[]=[]) {
    const requested=[...new Set([...labels,...issues.flatMap(issue=>issue.labels)])];
    return requested.length ? requested.map(fieldWritingInstruction) : ['Complete only the requested unresolved records; preserve accepted material.'];
}
export const bioWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
export const bioWithinBounds = (text: string) => text.length <= AUTHORING_LIMITS.bio && bioWordCount(text) <= AUTHORING_LIMITS.bioWords;
export function choiceText(value: string) {
    return value.trim().replace(/^(?:["“`])([\s\S]*)(?:["”`])$/, '$1').replace(/[.!]$/, '').trim();
}
export function booleanChoice(value: string): boolean | undefined {
    const text = choiceText(value);
    return /^(yes|true)$/i.test(text) ? true : /^(no|false)$/i.test(text) ? false : undefined;
}
export const referenceKey = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const labelKey = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const isUnknown = (text: string) => !text.trim() || /^(not[ _]established|not[ _]applicable|unknown|not disclosed|prefer not to say|undisclosed|withheld|not specified|private|discuss privately|n\/a)[.!]?$/i.test(text.trim());
/** Native views are bounded summaries. The full accepted authoring stays separate. */
export function nativeSummary(value: string, limit: number = AUTHORING_LIMITS.nativeText) {
    const text = value.trim();
    if (text.length <= limit) return text;
    const prefix = text.slice(0, limit);
    const boundary = prefix.lastIndexOf(' ');
    return prefix.slice(0, boundary > limit * .8 ? boundary : limit).trimEnd();
}
export interface AuthoringIssue { repair?:import('./lumistry-repair.js').RepairOperation; code: string; message: string; labels: string[]; recordId?:string; layer?:'parse'|'validation'|'protected-field'|'storage'; }
/** Persistence and diagnostics preserve the same typed repair authority. */
export function normalizeAuthoringIssues(value:unknown):AuthoringIssue[] {
    return (Array.isArray(value)?value:[]).filter(x=>typeof x?.code==='string'&&typeof x.message==='string'&&Array.isArray(x.labels)).slice(0,60).map(x=>({code:x.code.slice(0,80),message:x.message.slice(0,300),labels:x.labels.filter((s:unknown)=>typeof s==='string').slice(0,30).map((s:string)=>s.slice(0,100)),recordId:typeof x.recordId==='string'?x.recordId.slice(0,80):undefined,layer:['parse','validation','protected-field','storage'].includes(x.layer)?x.layer:undefined,repair:['local','extract','author','rewrite','photo','blocked','resume'].includes(x.repair)?x.repair:undefined}));
}
/** Shareable diagnostics carry machine targets, not private source excerpts. */
export function authoringIssueDiagnostics(value:unknown):AuthoringIssue[] {
    return normalizeAuthoringIssues(value).map(i=>({...i,message:i.code,recordId:i.recordId&&/^(question|gallery|photo|companion)_\d{1,3}$/.test(i.recordId)?i.recordId:undefined}));
}
export class AuthoringContractError extends Error {
    constructor(public readonly issues: AuthoringIssue[]) { super(issues.map(x => x.message).join('; ')); }
}
export const issueLabels = (issues: AuthoringIssue[]) => [...new Set(issues.flatMap(x => x.labels))];
