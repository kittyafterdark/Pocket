import {speciesBodyPlan} from './lumistry-species.js';
import {parseCustomSpecies,CUSTOM_SPECIES_LABEL} from './lumistry-species-discovery.js';
import {worldVisualGuide,knownSpeciesIn} from './lumistry-world-catalog.js';
import {excludedProfileKeys} from './lumistry-filters.js';
import {projectPlannedAppearance} from './lumistry-appearance.js';
import {DYNAMIC_DOSSIER_FIELDS,isInstructionNonanswer,AUTHORING_LABEL_ALIASES} from './lumistry-dynamic-fields.js';
import type {CandidatePlan} from './lumistry-population.js';
import {OCCUPATION_BY_ID} from './lumistry-occupations.js';
import { AUTHORING_LIMITS as LIMITS, WRITING_FIELDS, bioWithinBounds, choiceText as choice, booleanChoice, labelKey as key, isUnknown as unknown, nativeSummary, referenceKey, AuthoringContractError, type AuthoringIssue, issueLabels } from './lumistry-authoring-contract.js';
import { normalizeExperience, type LumistryExperience } from './lumistry-experience.js';
import { V2_GUIDANCE } from './lumistry-v2-template.js';
import { selectedValue } from './lumistry-persona.js';
import { DATING_OPTIONS } from './lumistry-options.js';
import { PERSON_TEMPLATE } from './lumistry-person.js';
import { hasDatingAppearance } from './lumistry-facts.js';
import { PHOTO_TEXT_LIMITS } from './lumistry-photo-contract.js';
import { compileDatingVisual, subjectSceneField, completeStructuredScene, type DatingVisualPlan } from './lumistry-visual.js';
export type AuthoringKind = 'dossier' | 'index' | 'public' | 'photos' | 'match' | 'portrayal' | 'voiceLab';
export interface AuthoredArtifact {
    syntaxVersion?:2;
    incompleteFields?:Array<{label:string;recordId?:string}>;
    version: 2;
    kind: AuthoringKind;
    revision: number;
    text: string;
    /** Accepted record body; correction history remains in text. */
    content?: string;
    fields: Record<string, string>;
    /** Engine-owned canonical records; prose/history are evidence only. */
    records?: AuthoredRecord[];
    conflicts: string[];
    complete: boolean;
}
export interface AuthoredRecord { id:string; start:string; fields:Record<string,string>; conflicts:string[]; }
export interface PersonAuthoring {
    version: 2;
    experience?: LumistryExperience;
    dossier?: AuthoredArtifact;
    index?: AuthoredArtifact;
    public?: AuthoredArtifact;
    photos: AuthoredArtifact[];
    gallery: string[];
    provenance: Record<string, {
        source: 'dossier' | 'index' | 'public' | 'plan';
        label: string;
        revision: number;
        visibility: 'private' | 'public';
    }>;
}
const guidance = [...Object.values(V2_GUIDANCE).flatMap(x => [...x]),...DYNAMIC_DOSSIER_FIELDS];
/** One source for organizer labels, category types, parser aliases and validation. */
export const INDEX_SPEC = [
    { label: 'Public alias', path: 'alias', type: 'text', max: LIMITS.alias, required: true },
    { label: 'Exact adult age', path: 'age', type: 'age', max: 8, required: true },
    { label: 'Anonymous profile', path: 'anonymous', type: 'boolean', max: 8, required: true },
    { label: 'Pronouns', path: 'pronouns', type: 'text', max: LIMITS.pronouns },
    { label: 'Actual orientation', path: 'privateFields.orientation', type: 'text', max: LIMITS.privateText, required: true },
    { label: 'Existing commitments', path: 'privateFields.commitments', type: 'text', max: LIMITS.privateText, required: true },
    { label: 'Dating intentions', path: 'privateFields.intentions', type: 'text', max: LIMITS.privateText, required: true },
    { label: 'Personal limits', path: 'privateFields.boundaries', type: 'text', max: LIMITS.privateText },
    ...Object.keys(DATING_OPTIONS).filter(k => k !== 'pronouns').map(path => ({ label: `Category ${path}`, path: `fields.${path}`, type: 'category', max: LIMITS.privateText })),
    { label: 'Public categories', path: 'disclosure', type: 'list', max: 2000, required: true },
] as const;
const extras = ['Initial app interest', 'Question', 'Answer', 'Gallery photo purpose', 'Companion name', 'Companion kind', 'Companion appearance', 'Companion relationship', 'Subject reference', 'Subject position', 'Subject clothing', 'Subject expression', 'Subject pose', 'Subject action', 'Subject gaze', 'Known languages', 'Distance km', 'Record reference'];
const repeatLabels = new Set(['Question', 'Answer', 'Gallery photo purpose', 'Companion name', 'Companion kind', 'Companion appearance', 'Companion relationship', ...V2_GUIDANCE['1D — One complete photo'].map(f => f.label)]);
const labels = new Map([...guidance.map(x => x.label), ...INDEX_SPEC.map(x => x.label), ...extras].map(s => [key(s), s]));
for(const policy of Object.values(WRITING_FIELDS))for(const alias of policy.aliases)labels.set(key(alias),policy.label);
const sectionNames = new Set(['q&a','gallery plan','companion','photo','character dossier','extracted index','profile plan',...Object.keys(V2_GUIDANCE).map(name=>name.replace(/^\d+[A-Z]?\s*[—-]\s*/, '').toLowerCase())]);
// Numeric authoring annotations are metadata, never wrapped character prose.
const countAnnotation = (line: string) => /^(?:(?:word count|words|character count|characters)\s*:\s*\d[\d,]*)(?:\s*[·|;,]\s*(?:word count|words|character count|characters)\s*:\s*\d[\d,]*)*[.!]?$/i.test(line.trim().replace(/^[-*]\s+/, '').replace(/\*\*/g,''));
const isBoundary = (line: string) => countAnnotation(line) || /^\s*(?:#{1,6}\s|```)/.test(line) || sectionNames.has(line.trim().replace(/^\*\*|\*\*$/g,'').replace(/:$/,'').trim().toLowerCase()) || /^\s*END (?:CHARACTER DOSSIER|EXTRACTED INDEX|PROFILE PLAN|PHOTO)[.!]?\s*$/i.test(line);
/** Reviewed heading aliases only; never fuzzy-match arbitrary prose or infer facts. */
const labelAliases=AUTHORING_LABEL_ALIASES;
for(const [alias,label] of labelAliases){if(!labels.has(key(label)))throw new Error('Unknown authoring alias target: '+label);labels.set(key(alias),label);}

/** Explicit visibility syntax only. Values are checked against facts, never used to invent them. */
export function disclosureChoices(text: string, options: Record<string, string[]>) {
    text = text.replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '');
    const canonical = (name: string) => Object.keys(options).find(k => key(k).replace(/ /g, '') === key(choice(name)).replace(/ /g, ''));
    const keys: string[] = [], values: Array<{field:string; value:string}> = [],deferred:string[]=[];
    let valid = !!text.trim();
    const pairs = [...text.matchAll(/([A-Za-z][A-Za-z0-9 _-]{0,60})\s*:\s*/g)];
    const prefix = pairs.length ? text.slice(0, pairs[0].index) : text;
    for (const token of prefix.split(/[,;\n]/).map(choice).filter(Boolean)) {
        const field = canonical(token);
        if (/^none$/i.test(token)) keys.push('none');
        else if (field) keys.push(field);
        else {
            // An explicitly volunteered option is also an explicit disclosure
            // choice when it names exactly one category. This never extracts
            // permission from unrelated private narrative or creates a fact.
            // Current/future children are reviewed projections of the existing children category.
            const matches=Object.keys(options).filter(k=>options[k].some(v=>key(v)===key(token))&&(!['parenthood','childrenPlans'].includes(k)||!options.children?.some(v=>key(v)===key(token))));
            if(matches.length===1)keys.push(matches[0]);
            else if(matches.length>1)deferred.push(token); // Withhold ambiguous optional categories.
            else valid = false;
        }
    }
    for (const [i, pair] of pairs.entries()) {
        const field = canonical(pair[1]);
        if (!field) { valid = false; continue; }
        keys.push(field);
        const raw = text.slice(pair.index! + pair[0].length, pairs[i+1]?.index ?? text.length).trim().replace(/[,;]\s*$/, '');
        const value = categoryValue(field, choice(raw), options);
        if (value) {
            if (values.some(previous => previous.field === field && !equivalentAuthoredField(`Category ${field}`, previous.value, value))) valid = false;
            values.push({field, value});
        }
    }
    const unique = [...new Set(keys)];
    return { keys: unique, values,deferred,valid: valid && !!unique.length && !(unique.includes('none') && unique.length > 1) };
}
export function labelLine(line: string): {
    label: string;
    value: string;
} | undefined {
    const m = line.replace(/^\s*(?:#{1,6}\s+)?(?:\d+[.)]\s+)?/, '').match(/^\s*(?:[-*]\s+)?(?:\*\*)?([^:\n]{1,100}?)(?:\*\*)?\s*:\s*(?:\*\*)?\s*(.*)$/);
    if (!m)
        return;
    const label = labels.get(key(m[1])) || labelAliases.get(key(m[1])) || (/^Category [a-z][a-z0-9_-]{0,60}$/i.test(m[1]) ? 'Category ' + m[1].slice(9).toLowerCase() : undefined);
    return label ? { label, value: m[2].trim() } : undefined;
}
/** All consumers share the same syntax adapter. Prose bytes stay unchanged;
 * only an explicit inline Question/Answer pair gains a field boundary. */
export function authoringLines(text:string):string[] {
    const lines=text.split(/\r?\n/),out:string[]=[];
    for(const [i,line] of lines.entries()){
        const item=labelLine(line);
        if(item?.label==='Question'&&labelLine(lines[i+1]||'')?.label!=='Answer'){
            const match=/\s+(?:\*\*)?Answer(?:\*\*)?\s*:\s*(?:\*\*)?\s*/i.exec(item.value);
            if(match&&(item.value.slice(0,match.index).match(/["“”]/g)||[]).length%2===0){
                out.push('Question: '+item.value.slice(0,match.index),'Answer: '+item.value.slice(match.index+match[0].length));continue;
            }
        }
        out.push(line);
    }
    return out;
}
export function parseAuthoring(raw: unknown, kind: AuthoringKind, finishReason?: string, revision = 1): AuthoredArtifact {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text || text.length > LIMITS.artifact)
        throw new Error(!text ? 'The provider returned no answer text.' : 'The authored unit exceeds the private storage limit.');
    const fields: Record<string, string> = {}, conflicts: string[] = [];
    let current = '', buffer: string[] = [];
    const flush = () => {
        if (!current)
            return;
        const value = buffer.join('\n').trim();
        if (Object.hasOwn(fields, current) && fields[current] !== value && !repeatLabels.has(current))
            conflicts.push(current);
        else
            fields[current] = value;
    };
    for (const line of authoringLines(text.replace(/^```[^\n]*\n|\n```$/g, ''))) {
        const record = labelLine(line);
        if (record) {
            flush();
            current = record.label;
            buffer = [record.value];
        }
        else if (isBoundary(line)) {
            flush();
            current = '';
            buffer = [];
        }
        else if (current)
            buffer.push(line);
    }
    flush();
    const artifact:AuthoredArtifact={ version: 2, syntaxVersion:2,kind, revision, text, content: text, fields, records: canonicalRecords(text), conflicts: [...new Set(conflicts)], complete: finishReason !== 'length' };
    if(kind==='public'&&!artifact.complete)artifact.incompleteFields=unfinishedPublicFields(artifact);
    return artifact;
}
export function normalizeAuthoring(v: any): PersonAuthoring | undefined {
    if (v?.version !== 2 || JSON.stringify(v).length > 650000)
        return undefined;
    const artifact = (a: any): AuthoredArtifact | undefined => a?.version === 2 && typeof a.text === 'string' && a.text.length <= 128000 && ['dossier', 'index', 'public', 'photos', 'match', 'portrayal', 'voiceLab'].includes(a.kind) ? { version: 2, incompleteFields:Array.isArray(a.incompleteFields)?a.incompleteFields.filter((f:any)=>typeof f?.label==='string'&&['Bio','Question','Answer','Gallery photo purpose'].includes(f.label)).slice(0,30).map((f:any)=>({label:f.label,recordId:typeof f.recordId==='string'?f.recordId.slice(0,80):undefined})):undefined,...(a.syntaxVersion===2?{syntaxVersion:2 as const}:{}),kind: a.kind, revision: Number(a.revision) || 1, text: a.text, content: typeof a.content === 'string' && a.content.length <= LIMITS.artifact ? a.content : a.text, records:Array.isArray(a.records)?a.records.filter((r:any)=>typeof r?.id==='string'&&recordStarts.includes(r.start)&&r.fields&&typeof r.fields==='object'&&!Array.isArray(r.fields)&&Object.values(r.fields).every(v=>typeof v==='string')).map((r:any)=>({id:r.id,start:r.start,fields:{...r.fields},conflicts:Array.isArray(r.conflicts)?r.conflicts.filter((s:any)=>typeof s==='string'):[]})):canonicalRecords(typeof a.content==='string'?a.content:a.text), fields: Object.fromEntries(Object.entries(a.fields || {}).filter(([k, v]) => (labels.has(key(k)) || /^Category [a-z][a-z0-9_-]{0,60}$/.test(k)) && typeof v === 'string' && v.length <= 128000)) as Record<string, string>, conflicts: (Array.isArray(a.conflicts) ? a.conflicts : []).filter((x: any) => typeof x === 'string' && labels.has(key(x))).slice(0, 100), complete: a.complete !== false } : undefined;
    return { version: 2, experience: v.experience ? normalizeExperience(v.experience) : undefined, dossier: artifact(v.dossier), index: artifact(v.index), public: artifact(v.public), photos: (Array.isArray(v.photos) ? v.photos : []).slice(0, 8).map(artifact).filter((a: any): a is AuthoredArtifact => !!a), gallery: (Array.isArray(v.gallery) ? v.gallery : []).slice(0, 8).filter((s: any) => typeof s === 'string').map((s: string) => s.slice(0, 600)), provenance: Object.fromEntries(Object.entries(v.provenance || {}).filter(([k, x]: [
            string,
            any
        ]) => /^[a-zA-Z][a-zA-Z0-9_.]{0,80}$/.test(k) && ['dossier', 'index', 'public','plan'].includes(x?.source) && typeof x?.label === 'string').slice(0, 100).map(([k, x]: [
            string,
            any
        ]) => [k, { source: x.source, label: x.label.slice(0, 100), revision: Number(x.revision) || 1, visibility: x.visibility === 'public' ? 'public' : 'private' }])) };
}
const canonicalFieldCache=new WeakMap<AuthoredArtifact,{source:string;parsed:AuthoredArtifact}>();
export function canonicalAuthoringFields(a:AuthoredArtifact):AuthoredArtifact {
 const source=a.content??a.text;if(!source.trim())return a;
 const cached=canonicalFieldCache.get(a);if(cached?.source===source)return cached.parsed;
 const parsed=parseAuthoring(source,a.kind,a.complete?'stop':'length',a.revision);
 // Persisted conflict evidence remains authoritative until an explicit authorized correction.
 parsed.conflicts=[...new Set([...parsed.conflicts,...a.conflicts])];canonicalFieldCache.set(a,{source,parsed});return parsed;
}
export const authoringField = (artifact: AuthoredArtifact | undefined, label: string) => {
    const a=artifact?canonicalAuthoringFields(artifact):undefined;
    const value = a && !a.conflicts.some(conflict => key(conflict) === key(label)) ? (a.fields[label] || Object.entries(a.fields).find(([name]) => key(name) === key(label))?.[1])?.trim() || '' : '';
    if(/^(Existing commitments|Existing relationship and commitments)$/.test(label)&&/^NONE_ESTABLISHED$/i.test(value))return 'None established.';
    // An organizer's lack of evidence cannot hide an explicit accepted source fact.
    return artifact?.kind==='index'&&unknown(value)?'':value;
};
const get = authoringField;
const set = (o: any, path: string, value: any) => {
    const parts = path.split('.');
    const leaf = parts.pop()!;
    for (const part of parts)
        o = o[part] ||= {};
    o[leaf] = value;
};
function categoryValue(field: string, value: string, options: Record<string, string[]>) {
    if (unknown(value))
        return '';
    if (field === 'height') {
        const cm = value.match(/\b(\d{2,3}(?:\.\d+)?)\s*cm\b/i);
        if (cm)
            return `${Math.round(Number(cm[1]))} cm`;
        const ft = value.match(/\b([3-8])\s*(?:ft|feet|foot|')\s*(\d{1,2})?\s*(?:in|inches|\")?/i);
        return ft ? `${Math.round(Number(ft[1]) * 30.48 + Number(ft[2] || 0) * 2.54)} cm` : '';
    }
    const allowed = options[field] || [];
    const alias: Record<string, string> = { 'skilled trades': 'tradesperson', 'skilled-trades': 'tradesperson', 'crafts': 'crafts' };
    const words = value.split(/[,;\n]/).map(v => v.trim()).filter(Boolean);
    const resolved = words.map(v => allowed.find(x => key(x) === key(alias[v.toLowerCase()] || selectedValue(field, v)))).filter((v): v is string => !!v);
    return resolved.length === words.length ? [...new Set(resolved)].join(', ') : '';
}
export function projectDossier(a: PersonAuthoring, selected: Record<string, string>, slotId: string, distanceKm: number, options: Record<string, string[]> = DATING_OPTIONS, plan?:CandidatePlan) {
    const d = a.dossier, index = a.index;
    const provisional=plan?.creativeSpecies?.status==='reserved'?parseCustomSpecies(get(d,CUSTOM_SPECIES_LABEL)||get(index,CUSTOM_SPECIES_LABEL),plan):undefined;
    const speciesLabel=plan?.species?.label||provisional?.name;
    if(speciesLabel)options={...options,species:[...new Set([...(options.species||[]),speciesLabel])]};
    const row: any = { creationPlan:plan,slotId, fields: { ...plan?.connectionFacts,...selected }, privateFields: {}, person: structuredClone(PERSON_TEMPLATE), phoneProfile: { personality: '', appearance: '', textingStyle: '' }, interest: { version: 2, status: 'pending', seen: false }, bio: '', hiddenFields: [], photoPlan: [], openingPhoto: null, distanceKm, anonymous: false };
    if(plan?.connectionFacts?.children)row.fields.children=plan.connectionFacts.children;
    const initialInterest=get(d,'Initial app interest').trim().toLowerCase();
    if(initialInterest==='liked')row.interest={version:2,status:'matched',seen:true};
    else if(initialInterest==='declined')row.interest={version:2,status:'declined',seen:true};
    else if(initialInterest==='undecided')row.interest={version:2,status:'pending',seen:true};
    const provenance: PersonAuthoring['provenance'] = {};
    const put = (path: string, label:string,max:number=LIMITS.nativeText) => {
        const text = get(index, label) || get(d, label);
        if (!unknown(text) && (!/^privateFields\.(orientation|commitments|intentions|boundaries)$/.test(path) || text.length <= max)) {
            set(row, path, nativeSummary(text, max));
            provenance[path] = { source: get(index, label) ? 'index' : 'dossier', label, revision: (get(index, label) ? index : d)!.revision, visibility: 'private' };
        }
    };
    const name = get(d, 'Name and dating alias');
    const alias = get(index, 'Public alias') || get(d, 'Public alias') || name.match(/(?:on the app|dating alias|alias|app)\s*:\s*([^;\n]+)/i)?.[1]?.trim() || (name.includes(';') ? '' : name);
    if (alias && alias.length <= 120)
        row.alias = alias.replace(/^['“"]|['”"]$/g, '');
    const actualName = name.split(';')[0].trim();
    if (name.includes(';') && actualName && actualName !== row.alias)
        row.privateFields.realName = actualName;
    const age = get(index, 'Exact adult age') || get(d, 'Exact adult age') || get(d, 'Age and life stage');
    const ageMatch = age.match(/^\s*(\d{2,4})(?:\b|;)/);
    if (ageMatch)
        row.age = Number(ageMatch[1]);
    row.pronouns = get(index, 'Pronouns') || get(d, 'Pronouns') || get(d, 'Gender and pronouns').match(/\b(?:she|he|they|xe|ze)\s*\/\s*(?:her|him|them|xem|zir|they)\b/i)?.[0] || '';
    const map: Record<string, string> = {
        'person.appearance.tags': 'Species or setting-specific physiology', 'person.appearance.height': 'Height and build', 'person.appearance.build': 'Height and build', 'person.appearance.hair': 'Hair', 'person.appearance.face': 'Facial features', 'person.appearance.skin': 'Skin / fur / scales / surface', 'person.appearance.distinctive': 'Body and distinct identifiers', 'person.appearance.usualStyle': 'Clothing and personal style',
        'person.life.background': 'Origin and formative context', 'person.life.career': 'Occupation or role', 'person.life.routine': 'Everyday rhythm', 'person.life.socialCircle': 'Social circle and recurring subjects', 'person.life.currentPressure': 'Current pressure', 'person.life.values': 'Values and loyalties', 'person.life.contradiction': 'Contradictions', 'person.life.attraction': 'Attraction patterns and incompatibilities',
        'privateFields.residence': 'Residence and living circumstances', 'privateFields.movement': 'Movement and sensory presence', 'privateFields.observable': 'Immediately observable', 'privateFields.publicTopics': 'Plausibly public or volunteered', 'privateFields.guardedTopics': 'Personal and guarded', 'privateFields.identityAnchors': 'Stable identity anchors', 'privateFields.settingNotes': 'Setting-specific implementation', 'person.presentation.hook': 'Selected dating-app presentation premise', 'person.presentation.photoBehavior': 'Photo-selection habits', 'privateFields.strengths': 'Constructive strengths', 'privateFields.flaws': 'Real flaws and blind spots', 'privateFields.independentGoal': 'Independent goal', 'privateFields.currentSituation': 'Current practical situation', 'privateFields.pleasures': 'Likes, dislikes and minor pleasures', 'privateFields.skills': 'Skills and limitations', 'privateFields.comfortable': 'When comfortable', 'privateFields.hurt': 'When embarrassed, disappointed or hurt', 'privateFields.pressureResponse': 'When angry, afraid or under pressure', 'privateFields.trust': 'Trust and closeness', 'privateFields.initiative': 'Initiative and independent decisions', 'privateFields.selfStory': 'Self-understanding and blind spots',
        'phoneProfile.personality': 'Core personality', 'person.availability.routine': 'Availability and app habits',
        'privateFields.orientation': 'Actual orientation and attraction', 'privateFields.commitments': 'Existing relationship and commitments', 'privateFields.intentions': 'Reason for joining and intentions', 'privateFields.preferences': 'Attraction patterns and incompatibilities', 'privateFields.boundaries': 'Personal comfort and consent',
        'person.intimacy.sexualInterests': 'Intimate preferences, if relevant', 'person.intimacy.disclosure': 'Disclosure pace and secrecy',
        'person.writingVoice.register': 'Spoken voice and register', 'person.writingVoice.mechanics': 'Written mechanics', 'person.writingVoice.rhythm': 'Sentence rhythm and conversational effort', 'person.writingVoice.humor': 'Humor and seriousness', 'person.writingVoice.privateContrast': 'Public voice versus private messages', 'person.writingVoice.sample': 'Voice samples', 'person.writingVoice.selfImage': 'Self-image versus outward impression', 'person.writingVoice.audience': 'Profile motivation and curation',
    };
    for(const field of DYNAMIC_DOSSIER_FIELDS)if(field.path)map[field.path]=field.label;
    for (const [path, label] of Object.entries(map))
        put(path, label, path.startsWith('privateFields.')?LIMITS.privateText:LIMITS.nativeText);
    row.person.writingVoice.bioLanguage = 'English';
    row.person.writingVoice.otherLanguages = nativeSummary(get(d, 'Known languages'));
    row.person.writingVoice.primaryLanguage = '';
    row.person.writingVoice.effort = nativeSummary(get(d, 'Profile motivation and curation'));
    if(!plan){row.person.appearance.face = nativeSummary([row.person.appearance.face, get(index, 'Eyes') || get(d, 'Eyes')].filter(Boolean).join('; '));row.person.appearance.eyes='';}
    row.phoneProfile.textingStyle = nativeSummary([row.person.writingVoice.mechanics, row.person.writingVoice.rhythm, row.person.writingVoice.sample].filter(Boolean).join('\n'));
    for (const spec of [...INDEX_SPEC, ...Object.keys(options).filter(k => !Object.hasOwn(DATING_OPTIONS, k)).map(field => ({ label: `Category ${field}`, path: `fields.${field}`, type: 'category', max: LIMITS.privateText }))]) {
        const text = get(index, spec.label) || get(d, spec.label);
        if (!text || unknown(text))
            continue;
        if (spec.type === 'category') {
            const field = spec.path.slice(7), value = categoryValue(field, text, options);
            if (value) {
                row.fields[field] = value;
                provenance[spec.path] = { source: get(index, spec.label) ? 'index' : 'dossier', label: spec.label, revision: (get(index, spec.label) ? index : d)!.revision, visibility: 'private' };
            }
        }
        else if (spec.type === 'boolean' && booleanChoice(text) !== undefined) {
            row.anonymous = booleanChoice(text);
        }
        else if (spec.type === 'text' && text.length <= spec.max) {
            set(row, spec.path, text);
            provenance[spec.path] = { source: get(index, spec.label) ? 'index' : 'dossier', label: spec.label, revision: index?.revision || d?.revision || 1, visibility: 'private' };
        }
    }
    const sourceIssues: AuthoringIssue[] = [];
    if(speciesLabel){if(row.fields.species&&row.fields.species!==speciesLabel)sourceIssues.push({code:'category-conflict',repair:'blocked',message:'The authored species category conflicts with the saved anatomy. Preserve the accepted facts for review.',labels:['Category species']});else row.fields.species=speciesLabel;}

    for(const field of DYNAMIC_DOSSIER_FIELDS){const answer=get(index,field.label)||get(d,field.label);if(isInstructionNonanswer(answer))sourceIssues.push({code:'instruction-nonanswer',repair:'author',message:'An individual fact is required: '+field.label,labels:[field.label]});}
    if(plan){
        if(row.age!==undefined&&row.age!==plan.age)sourceIssues.push({code:'locked-age',repair:'author',message:'The prose contradicts the saved exact adult age',labels:['Exact adult age']});
        row.age=plan.age;row.distanceKm=plan.distanceKm;row.location=plan.location;row.visualSetting=worldVisualGuide(plan.worldGuide)||undefined;
        if(plan.creativeSpecies?.status==='reserved'){
            const raw=get(d,CUSTOM_SPECIES_LABEL)||get(index,CUSTOM_SPECIES_LABEL),proposal=parseCustomSpecies(raw,plan);
            if(!proposal)sourceIssues.push({code:'species-proposal',repair:'author',message:'Return a complete compatible custom anatomy proposal for this saved creative reservation.',labels:[CUSTOM_SPECIES_LABEL]});
            else {row.speciesProposal=proposal;sourceIssues.push({code:'species-review',repair:'blocked',message:'Review this provisional species in Private unfinished authoring. Accept or reject it before continuing; no public writing or photos yet.',labels:[CUSTOM_SPECIES_LABEL]});}
        }
        if(plan.species){const authoredSpecies=knownSpeciesIn(row.person.appearance.tags||''),augmentedHuman=plan.species.id==='cyborg'&&authoredSpecies?.id==='human'&&/\b(augmented|augmentation|cybernetic|bionic|prosthetic)\b/i.test(row.person.appearance.tags);if(authoredSpecies&&authoredSpecies.id!==plan.species.id&&!augmentedHuman&&!row.person.appearance.tags.toLowerCase().startsWith(plan.species.label.toLowerCase()))sourceIssues.push({code:'locked-species',repair:'author',message:'The authored species conflicts with the saved species; preserve accepted siblings and repair only anatomy.',labels:['Species or setting-specific physiology']});else if(!authoredSpecies||augmentedHuman)row.person.appearance.tags=[plan.species.label,row.person.appearance.tags].filter(Boolean).join('; ');}
        const acceptedSpecies=plan.species||(plan.selectionAudit.manualSpecies?knownSpeciesIn(row.person.appearance.tags):undefined);
        if(acceptedSpecies&&acceptedSpecies.id!=='human')row.person.anatomy={version:1,bodyPlan:speciesBodyPlan(acceptedSpecies,row.person.appearance.tags),limbs:row.person.appearance.build,surface:row.person.appearance.skin,face:row.person.appearance.face,currentForm:row.person.appearance.tags,...(plan.creativeSpecies?.status==='accepted'?{bodyPlan:plan.creativeSpecies.proposal!.bodyPlan,limbs:plan.creativeSpecies.proposal!.limbs,surface:plan.creativeSpecies.proposal!.surface,face:plan.creativeSpecies.proposal!.face,currentForm:plan.creativeSpecies.proposal!.currentForm}:{})};
        if(plan.appearance){
            // Engine anchors may fill a missing facet, but never conceal conflicting authored answers.
            for(const label of ['Skin / fur / scales / surface','Hair','Facial features','Species or setting-specific physiology','Distinctive identifiers'])if(d?.conflicts.includes(label)||index?.conflicts.includes(label))sourceIssues.push({code:'appearance-source-conflict',repair:'author',message:'Conflicting authored appearance answers need one compatible answer.',labels:[label]});
            const projected=projectPlannedAppearance(plan.appearance,row.person.appearance);
            Object.assign(row.person.appearance,projected.values);
            for(const label of projected.conflicts)sourceIssues.push({code:'locked-appearance',repair:'author',message:'This field clearly contradicts the saved physical anchor; preserve the anchor and add only compatible detail.',labels:[label]});
            for(const field of Object.keys(projected.values))provenance['person.appearance.'+field]={source:'plan',label:field,revision:plan.revision,visibility:'private'};
        }
        for(const [field,label] of [['hair','Hair'],['eyes','Eyes'],['face','Facial features'],['skin','Skin / fur / scales / surface'],['build','Height and build']]){const original=get(index,label)||get(d,label);if(!row.person.appearance[field]&&!/^(?:not applicable|none|no hair|bald)[.!]?$/i.test(original))sourceIssues.push({code:'appearance-detail',message:'A stable visual detail is unresolved: '+label,labels:[label]});}
        const career=get(index,'Occupation or role')||get(d,'Occupation or role');
        const primary=career.replace(/^(?:works? as (?:an? )?|(?:an? ))/i,'').trim().toLowerCase();
        const conflicting=[...OCCUPATION_BY_ID.values()].find(r=>r.id!==plan.work.roleId&&[r.title,...r.aliases].some(t=>primary===t.toLowerCase()||primary.startsWith(t.toLowerCase()+';')));
        if(conflicting&&plan.work.roleId)sourceIssues.push({code:'work-conflict',repair:'author',message:'Primary work contradicts the saved occupation; preserve the selected work',labels:['Occupation or role']});
        if(!row.person.life.career)row.person.life.career=plan.work.title;
        if(row.fields.occupation&&!plan.work.publicCategories.includes(row.fields.occupation))sourceIssues.push({code:'work-category',repair:'author',message:'Occupation category contradicts the saved work selection',labels:['Category occupation']});
        if(!row.fields.occupation)row.fields.occupation=plan.work.publicCategories[0];
        if(!row.privateFields.boundaries)sourceIssues.push({code:'limits',message:'Personal comfort and refusal need an explicit individual answer',labels:['Personal comfort and consent']});
        row.privateFields.identityAnchors=nativeSummary(JSON.stringify({age:plan.age,work:plan.work.title,appearance:row.person.appearance,commitments:row.privateFields.commitments}),LIMITS.privateText);
    }
    for (const [field, label] of [['occupation', 'Occupation or role'], ['relationshipStatus', 'Existing relationship and commitments'], ['orientation', 'Actual orientation and attraction'], ['interests', 'Likes, dislikes and minor pleasures'], ['gender', 'Gender and pronouns'], ['height', 'Height and build']]) {
        const actual = categoryValue(field, get(d, label).split(';')[0], options);
        if (!actual)
            continue;
        const explicit = categoryValue(field, get(index, `Category ${field}`) || get(d, `Category ${field}`), options);
        if (explicit && explicit !== actual)
            sourceIssues.push({ code: 'category-conflict', repair:'blocked', message: `Category ${field}: conflicting explicit dossier facts`, labels: [`Category ${field}`] });
        row.fields[field] = actual;
    }
    // Only unambiguous literal appearance tokens; no biography-wide keyword policing.
    for(const [field,path,options] of [['hairTexture','hair',['straight','wavy','curly','coily','bald']],['eyeColor','eyes',['brown','hazel','green','blue','grey','amber']]] as Array<[string,string,string[]]>){
        const source=(row.person.appearance[path]||'').toLowerCase();const matches=options.filter(v=>new RegExp('\\b'+v+'\\b').test(source));
        if(matches.length===1&&(selected[field]||row.fields[field])){const actual=matches[0];if(selected[field]&&selected[field]!==actual)sourceIssues.push({code:'appearance-category',repair:'author',message:'The literal appearance conflicts with the saved '+field+' choice.',labels:[field==='hairTexture'?'Hair':'Eyes']});row.fields[field]=actual;}
    }
    row.person.appearance.height = row.fields.height || '';
    const visibility = get(index, 'Public categories') || get(d, 'Public categories');
    const disclosure = disclosureChoices(visibility, options), visible = disclosure.keys;
    for (const {field, value} of disclosure.values) {
        if (row.fields[field] && !equivalentAuthoredField(`Category ${field}`, row.fields[field], value))
            sourceIssues.push({code:'category-conflict',repair:'blocked', message:`Category ${field}: disclosure value contradicts the accepted category fact`, labels:[`Category ${field}`]});
    }
    // Searchable category minima are part of the engine's saved required-field plan,
    // before any authoring. Optional disclosure stays the author's choice; never
    // derive new personal facts or expose the nuanced private dossier here.
    const plannedPublic = Object.keys(selected).filter(k => row.fields[k] === selected[k]);
    if (visible.includes('none') && plannedPublic.length)
        sourceIssues.push({code: 'filter-disclosure', repair:'blocked', message: 'Public categories: candidate explicitly declines the saved searchable-category plan; no profile was published', labels: []});
    row.hiddenFields = Object.keys(row.fields).filter(k => !visible.includes(k) && !plannedPublic.includes(k));
    try {
        const companionSource=index?.fields['Companion name']?index:d;
        const companionText=companionSource?companionBody(companionSource):'';
        if(index?.fields['Companion name']&&d)assertPreservedCompanions(d,index);
        const ready:any[]=[], unresolved:any[]=[];
        for(const [i,record] of (companionSource?.records?.some(r=>r.start==='Companion name')?artifactRecords(companionSource,'Companion name'):authoringRecords(companionText,'Companion name')).entries()) {
            const body=Object.entries(record.fields).map(([label,value])=>`${label}: ${value}`).join('\n');
            try {
                if(record.conflicts.length)throw new AuthoringContractError(record.conflicts.map(label=>({code:'companion',message:'Conflicting optional companion metadata',labels:[label]})));
                const entity=companions(body)[0];
                if(entity && !ready.some(e=>referenceKey(e.name)===referenceKey(entity.name)))ready.push({...entity,id:`companion_${i+1}`});
                else unresolved.push(record.fields);
            }catch(error){if(error instanceof AuthoringContractError)unresolved.push(record.fields);else throw error;}
        }
        row.person.entities=ready;
        row.person.unresolvedSubjects=unresolved.map(fields=>({name:fields['Companion name']||'',kind:fields['Companion kind']||'',appearance:fields['Companion appearance']||'',relationship:fields['Companion relationship']||''}));

    }
    catch (error) {
        if (error instanceof AuthoringContractError) sourceIssues.push(...error.issues.map(issue => ({...issue, labels:['Companion name','Companion kind','Companion appearance','Companion relationship']})));
        else throw error;
    }
    for (const [path, label] of [['alias', 'Public alias'], ['age', 'Exact adult age'], ['pronouns', 'Pronouns'], ['anonymous', 'Anonymous profile'], ['hiddenFields', 'Public categories']])
        provenance[path] = { source: get(index, label) ? 'index' : 'dossier', label: get(index, label) ? label : ({ 'alias': 'Name and dating alias', 'age': 'Age and life stage', 'pronouns': 'Gender and pronouns' } as Record<string, string>)[path] || label, revision: (get(index, label) ? index : d)?.revision || 1, visibility: 'private' };
    if(plan){for(const field of ['age','creationPlan.work',...Object.keys(selected).map(k=>'fields.'+k)])provenance[field]={source:'plan',label:field,revision:plan.revision,visibility:'private'};}
    a.provenance = provenance;
    for(const [field,value] of Object.entries(plan?.connectionFacts||{}))if(!value.split(',').every((part:string)=>(row.fields[field]||'').split(',').map((v:string)=>key(v)).includes(key(part))))sourceIssues.push({code:'connection-fact',repair:'author',message:'Category '+field+' conflicts with the saved connection facts. Preserve the accepted plan.',labels:['Category '+field]});
    const issues = [...sourceIssues, ...identityIssueDetails(row, selected)];
    // These are identity facts, not presentation summaries: repair rather than clip them.
    for (const spec of INDEX_SPEC.filter(spec => spec.type === 'text')) {
        const original = get(index, spec.label) || get(d, spec.label);
        if (original.length > spec.max)
            issues.push({ code: 'identity-length', repair:'author', message: `${spec.label}: ${original.length} characters; maximum ${spec.max}`, labels: [spec.label] });
    }
    for (const [path, label] of Object.entries(map).filter(([path]) => /^privateFields\.(orientation|commitments|intentions|boundaries)$/.test(path))) {
        const original = get(index, label) || get(d, label);
        if (original.length > LIMITS.privateText)
            issues.push({ code: 'identity-length', repair:'author', message: `${label}: ${original.length} characters; maximum ${LIMITS.privateText}`, labels: [label] });
    }
    if(plan&&disclosure.valid)for(const key of excludedProfileKeys(row,plan.filters))issues.push({code:'excluded-category',repair:'blocked',message:'This authored public category conflicts with an explicit exclusion. Saved facts are retained; they must not be rewritten or hidden to bypass it.',labels:['Category '+key]});
    const missingCategories = !disclosure.valid;
    const missingAnonymous = booleanChoice(get(index, 'Anonymous profile') || get(d, 'Anonymous profile')) === undefined;
    const needsDisclosure = missingCategories || missingAnonymous;
    if (missingCategories) issues.push({ code: 'disclosure',repair:'author', message: 'Public categories: explicit category list or none required', labels: ['Public categories'] });
    if (missingAnonymous) issues.push({ code: 'disclosure', message: 'Anonymous profile: explicit yes or no required', labels: ['Anonymous profile'] });
    return { row, issues, repairable: !issues.some(x => ['category-conflict', 'required-category', 'filter-disclosure','excluded-category'].includes(x.code)), repairLabels: issueLabels(issues), problems: issues.filter(x => x.code !== 'disclosure').map(x => x.message), needsDisclosure };
}
export function hiddenNameIssue(identity: any, text: string) {
    const name = identity.privateFields?.realName;
    return typeof name === 'string' && name.length > 2 && name !== identity.alias && text.toLowerCase().includes(name.toLowerCase());
}
/** No compulsory kink, sexual role or turn-on inventory. Existing authored facts remain private. */
export function identityIssueDetails(row: any, selected: Record<string, string> = {}): AuthoringIssue[] {
    const issues: AuthoringIssue[] = [];
    const add = (code: string, message: string, labels: string[]) => issues.push({ code, message, labels, ...(code==='required-category'?{repair:'blocked' as const}:{}) });
    if (!Number.isInteger(row.age) || row.age < 18 || row.age > 9999) add('age', 'Exact adult age', ['Exact adult age', 'Age and life stage']);
    if (typeof row.alias !== 'string' || !row.alias.trim() || row.alias.length > LIMITS.alias) add('alias', 'Public alias', ['Public alias']);
    for (const [label, path, original] of [['Actual orientation', 'orientation', 'Actual orientation and attraction'], ['Existing commitments', 'commitments', 'Existing relationship and commitments'], ['Dating intentions', 'intentions', 'Reason for joining and intentions']])
        if (unknown(row.privateFields?.[path] || '')) add('agency', label, [label, original]);
    if (!hasDatingAppearance(row)) add('appearance', 'Stable physical identity', ['Species or setting-specific physiology', 'Height and build', 'Hair', 'Eyes', 'Skin / fur / scales / surface', 'Facial features', 'Body and distinct identifiers', 'Clothing and personal style']);
    if (!row.person?.life?.routine) add('routine', 'Everyday rhythm', ['Everyday rhythm']);
    if (!row.phoneProfile?.personality) add('personality', 'Core personality', ['Core personality']);
    if (!row.phoneProfile?.textingStyle || !row.person?.writingVoice?.register) add('voice', 'Written mechanics / sentence rhythm / voice samples', [...(!row.phoneProfile?.textingStyle ? ['Written mechanics', 'Sentence rhythm and conversational effort', 'Voice samples'] : []), ...(!row.person?.writingVoice?.register ? ['Spoken voice and register'] : [])]);
    for (const [field, value] of Object.entries(selected))
        if (!value.split(',').every(expected=>(row.fields?.[field] || '').split(',').some((x: string) => key(x) === key(expected)))) add('required-category', `Category ${field}: preserve the selected required alternative`, [`Category ${field}`]);
    return issues;
}
export const identityIssues = (row: any, selected: Record<string, string> = {}) => identityIssueDetails(row, selected).map(x => x.message);

export function authoringRecords(text: string, startLabel: string): Array<{ fields: Record<string,string>; conflicts: string[] }> {
    const allowed = startLabel === 'Question' ? new Set(['Question', 'Answer']) : startLabel === 'Gallery photo purpose' ? new Set([startLabel]) : startLabel === 'Companion name' ? new Set(['Companion name', 'Companion kind', 'Companion appearance', 'Companion relationship']) : new Set(V2_GUIDANCE['1D — One complete photo'].map(f => f.label));
    const out: Array<{fields:Record<string,string>;conflicts:string[]}> = [];
    let conflicts: string[] = [];
    let record: Record<string, string> | undefined, current = '', reference='';
    for (const line of authoringLines(text)) {
        const item = labelLine(line);
        if(item?.label==='Record reference'){reference=item.value;record=undefined;current='';continue;}
        if (item?.label === startLabel || startLabel==='Question'&&item?.label==='Answer'&&reference) {
            record = reference?{'Record reference':reference}:{};reference='';
            conflicts = [];
            out.push({fields:record,conflicts});
        }
        if (item && !allowed.has(item.label as any)) {
            record = undefined;
            current = '';
            reference = '';
            continue;
        }
        if (item && record) {
            if (Object.hasOwn(record, item.label) && record[item.label].trim() !== item.value.trim())
                conflicts.push(item.label);
            record[item.label] = item.value;
            current = item.label;
        }
        else if (isBoundary(line)) {
            current = '';reference='';
        }
        else if (record && current)
            record[current] += '\n' + line;
    }
    return out.map(r => ({fields:Object.fromEntries(Object.entries(r.fields).map(([k,v])=>[k,v.trim()])),conflicts:[...new Set(r.conflicts)]}));
}
const recordStarts = ['Companion name','Question','Gallery photo purpose','Photo purpose'];
function canonicalRecords(text:string):AuthoredRecord[] {
    return recordStarts.flatMap((start)=>authoringRecords(text,start).map((r,i)=>({id:r.fields['Record reference']||`${start==='Companion name'?'companion':start==='Question'?'question':start==='Gallery photo purpose'?'gallery':'photo'}_${i+1}`,start,fields:r.fields,conflicts:r.conflicts})));
}
export function artifactRecords(a:AuthoredArtifact,start:string):Array<{fields:Record<string,string>;conflicts:string[]}> {
    return (a.records || canonicalRecords(a.content ?? a.text)).filter(r=>r.start===start).map(r=>({fields:{...r.fields},conflicts:[...r.conflicts]}));
}
export function artifactRecordGroups(a:AuthoredArtifact,start:string):Record<string,string>[] {
    const records=artifactRecords(a,start), conflicts=[...new Set(records.flatMap(r=>r.conflicts))];
    if(conflicts.length)throw new AuthoringContractError(conflicts.map(label=>({code:'record-conflict',message:`Conflicting repeated ${label} field in authored record.`,labels:[label],layer:'parse'})));
    return records.map(r=>r.fields);
}
export function recordGroups(text: string, startLabel: string): Record<string,string>[] {
    const records=authoringRecords(text,startLabel), conflicts=[...new Set(records.flatMap(r=>r.conflicts))];
    if(conflicts.length) throw new AuthoringContractError(conflicts.map(label=>({code:'record-conflict',message:`Conflicting repeated ${label} field in authored record.`,labels:[label]})));
    return records.map(r=>r.fields);
}

const companionLabels = ['Companion name', 'Companion kind', 'Companion appearance', 'Companion relationship'];
// A descriptive suffix does not change an explicit kind. Never guess from names or prose.
function companionKind(value: string) {
    return choice(value).match(/^(person|adult|friend|human|pet|animal|dog|cat)(?=$|\s+[—–-]\s+|\s*\()/i)?.[1].toLowerCase() || '';
}
function companionBody(a: AuthoredArtifact): string {
    const records=a.records?.filter(r=>r.start==='Companion name');
    if(records?.length)return records.map(r=>Object.entries(r.fields).filter(([label])=>label!=='Record reference').map(([label,value])=>`${label}: ${value}`).join('\n')).join('\n');
    // Recover the single-record snapshot left by the former field-only merge bug.
    // History is evidence, never a second current table. Multiple records cannot be inferred.
    if (a.content === '' && a.fields['Companion name'] && authoringRecords(a.text, 'Companion name').length === 1)
        return companionLabels.filter(label => Object.hasOwn(a.fields,label)).map(label => `${label}: ${a.fields[label]}`).join('\n');
    return a.content ?? a.text;
}
export function companions(text: string) {
    const seen = new Set<string>();
    const records = recordGroups(text, 'Companion name');
    const labels = ['Companion name', 'Companion kind', 'Companion appearance', 'Companion relationship'];
    const fail = (message: string): never => { throw new AuthoringContractError([{ code: 'companion', message, labels }]); };
    if (records.length > LIMITS.companions) fail(`At most ${LIMITS.companions} recurring companions are supported.`);
    return records.map((r, i) => {
        const name = choice(r['Companion name'] || ''), kind = companionKind(r['Companion kind'] || ''), appearance = r['Companion appearance'], relationship = r['Companion relationship'];
        const missing = [
            !name || name.length > LIMITS.companionName ? 'name' : '',
            !kind ? 'kind (adult/person or pet)' : '',
            !appearance || unknown(appearance) ? 'stable camera-visible appearance' : '',
            !relationship || unknown(relationship) ? 'relationship' : '',
        ].filter(Boolean);
        if (missing.length) fail(`Companion ${name || i + 1}: needs ${missing.join(', ')}. Return the complete companion table with Companion name, Companion kind, Companion appearance and Companion relationship; preserve valid records.`);
        if (seen.has(referenceKey(name)) || /^(owner|self|none)$/i.test(name)) fail('A recurring companion needs a unique reference name.');
        seen.add(referenceKey(name));
        return { id: `companion_${i + 1}`, name, kind, appearance: nativeSummary(appearance), relationship: nativeSummary(relationship, LIMITS.relationship) };
    });
}

export function revalidatePublicArtifact(artifact: AuthoredArtifact, identity?: any, checkEchoes = true): AuthoredArtifact {
    const body = (artifact.content || artifact.text).split(/\r?\n/).filter(line => {
        if (!identity) return true;
        const echo = line.trim().replace(/^(?:#{1,6}\s+|[-*]\s+)/,'').replace(/\*\*/g,'').match(/^(Alias|Public alias|Age|Exact adult age|Pronouns|Anonymous profile)\s*:\s*(.*)$/i);
        if (!echo) return true;
        const label = key(echo[1]), value = choice(echo[2]);
        const agrees = label === 'alias' || label === 'public alias' ? value === identity.alias || choice(value) === choice(identity.alias || '')
            : label === 'age' || label === 'exact adult age' ? /^\d+$/.test(value) && Number(value) === identity.age
            : label === 'pronouns' ? key(value) === key(identity.pronouns || '')
            : booleanChoice(value) !== undefined && booleanChoice(value) === !!identity.anonymous;
        if (checkEchoes && !agrees) throw new AuthoringContractError([{code:'public-identity-echo',message:`Public output echoed a different ${echo[1]}; omit identity headers and keep the accepted identity.`,labels:[]}]);
        // The engine already owns these headers. An echo never becomes an identity edit.
        return false;
    }).join('\n');
    return {...parseAuthoring(body, 'public', artifact.complete ? 'stop' : 'length', artifact.revision),...(artifact.incompleteFields?{incompleteFields:structuredClone(artifact.incompleteFields)}:{}), text:artifact.text};
}
/** Keep raw repeated record bodies, including conflicts, separate from public scalars. */
function publicSections(artifact: AuthoredArtifact) {
    const scalar: string[] = [], questions: string[][] = [], gallery: string[][] = [];
    let current: string[] = scalar;
    let reference='';
    for (const line of authoringLines(artifact.content || artifact.text)) {
        const item = labelLine(line);
        if(item?.label==='Record reference'){reference=line;continue;}
        if (item?.label === 'Question' || (item?.label === 'Answer' && current === scalar)) {
            current = reference?[reference]:[];reference='';questions.push(current);
        } else if (item?.label === 'Gallery photo purpose') {
            current = reference?[reference]:[];reference='';gallery.push(current);
        } else if (item && !['Question','Answer'].includes(item.label)) current = scalar;
        else if (isBoundary(line)) { current = scalar; continue; }
        current.push(line);
    }
    return {scalar:scalar.join('\n'), questions:questions.map(lines=>lines.join('\n')), gallery:gallery.map(lines=>lines.join('\n'))};
}
function publicBody(scalar: string, questions: string[], gallery: string[]) {
    return [scalar, '### Q&A', ...questions, '### Gallery plan', ...gallery].join('\n');
}
/** Engine slot counts are authoritative; discard only trailing surplus records, never rewrite prose. */
export function normalizePublicCounts(artifact: AuthoredArtifact, questions: number, photos: number, identity?: any): AuthoredArtifact {
    // Older merges could replace an underfilled table with one partial patch.
    // Replay the retained engine correction history once with sibling protection.
    // Rejected corrections remain evidence; they cannot overwrite valid prose.
    if(artifact.syntaxVersion!==2&&artifact.text.includes('\n\n## Accepted public correction\n')){
        const parts=artifact.text.split('\n\n## Accepted public correction\n');
        let restored=parseAuthoring(parts[0],'public',artifact.complete?'stop':'length',artifact.revision);
        for(const patch of parts.slice(1))try{restored=publicRepair(restored,parseAuthoring(patch,'public',artifact.complete?'stop':'length',artifact.revision),false,{questions,photos},identity);}catch(error){if(!(error instanceof AuthoringContractError)&&!(error instanceof Error&&error.message==='Correction attempted to change an already authored field.'))throw error;}
        artifact={...restored,text:artifact.text};
    }
    artifact = revalidatePublicArtifact(artifact,identity);
    if(artifact.records?.some(r=>r.fields['Record reference']))return artifact;
    const parts = publicSections(artifact);
    if (parts.questions.length <= questions && parts.gallery.length <= photos) return revalidatePublicArtifact(artifact);
    const body = publicBody(parts.scalar, parts.questions.slice(0,questions), parts.gallery.slice(0,photos));
    return {...parseAuthoring(body,'public',artifact.complete?'stop':'length',artifact.revision),...(artifact.incompleteFields?{incompleteFields:structuredClone(artifact.incompleteFields)}:{}),text:artifact.text};
}
const publicReference=(start:string,index:number)=>(start==='Question'?'question':'gallery')+'_'+(index+1);
function trailingPublicField(artifact:AuthoredArtifact):{label:string;recordId?:string}|undefined {
    if(artifact.complete)return;
    let label='',recordId:string|undefined,reference='';let question=0,gallery=0;
    for(const line of authoringLines(artifact.content??artifact.text)){
        const item=labelLine(line);if(!item)continue;
        if(item.label==='Record reference'){reference=item.value;continue;}
        label=item.label;
        if(label==='Question')recordId=reference||publicReference('Question',question++);
        else if(label==='Gallery photo purpose')recordId=reference||publicReference(label,gallery++);
        else if(label==='Answer'&&reference)recordId=reference;
        else if(label==='Bio')recordId=undefined;
        reference='';
    }
    return label?{label,recordId}:undefined;
}
function unfinishedPublicFields(artifact:AuthoredArtifact):Array<{label:string;recordId?:string}> {
    if(artifact.incompleteFields)return artifact.incompleteFields;
    const last=trailingPublicField(artifact);return last?[last]:[];
}
/** References identify table slots, including absent records. Reordered explicit
 * records are deterministic; unknown/duplicate/mixed references never get guessed. */
export function publicRecordSlots(artifact:AuthoredArtifact,start:string,count:number) {
    count=Number.isInteger(count)?Math.max(0,Math.min(8,count)):0;
    const records=artifactRecords(artifact,start),slots:Array<typeof records[number]|undefined>=Array(count),issues:AuthoringIssue[]=[];
    const expected=new Set(Array.from({length:count},(_,i)=>publicReference(start,i)));
    const explicit=records.some(r=>expected.has(r.fields['Record reference'])),seen=new Set<string>();
    for(const [i,record] of records.entries()){
        const reference=record.fields['Record reference']||(!explicit?publicReference(start,i):'');
        const index=Array.from({length:count},(_,i)=>publicReference(start,i)).indexOf(reference);
        if(index<0){issues.push({code:'record-reference',message:'Public record needs a supplied reference.',labels:[start],recordId:reference||undefined});continue;}
        if(seen.has(reference)){issues.push({code:'record-reference',message:'Public record reference was repeated.',labels:[start],recordId:reference});slots[index]=undefined;continue;}
        seen.add(reference);
        slots[index]=record;
    }
    return {slots,issues};
}
export const publicBio = (artifact: AuthoredArtifact) => get(artifact, 'Bio').replace(/\s*\(\d+\s+words?\)\s*$/i, '').trim();
export function projectPublic(artifact: AuthoredArtifact, identity: any, questionCount: number, photoCount: number, allowEmptyBio = false) {
    artifact = normalizePublicCounts(artifact, questionCount, photoCount, identity);
    const qa=publicRecordSlots(artifact,'Question',questionCount),photos=publicRecordSlots(artifact,'Gallery photo purpose',photoCount);
    const bio = publicBio(artifact), questions = qa.slots.filter(r=>!!r).map(r => ({ question: r!.fields.Question, answer: r!.fields.Answer })), gallery = photos.slots.filter(r=>!!r).map(r => r!.fields['Gallery photo purpose']);
    const expectedReferences=new Set([...qa.slots.map((_,i)=>publicReference('Question',i)),...photos.slots.map((_,i)=>publicReference('Gallery photo purpose',i))]);
    const problems:string[]=[],issues:AuthoringIssue[]=[];
    const add=(code:string,message:string,labels:string[])=>{problems.push(message);issues.push({code,message,labels,layer:'validation'});};
    if (hiddenNameIssue(identity,bio))
        add('public-name','Public prose reveals the private real name',['Bio']);
    if (!artifact.complete||artifact.incompleteFields?.length){
        const pending=unfinishedPublicFields(artifact);
        if(!pending.length)add('truncated','Public profile output was cut off',['Bio']);
        for(const field of pending)if(!field.recordId||expectedReferences.has(field.recordId)){
            add('truncated','Public profile output was cut off',[field.label]);issues.at(-1)!.recordId=field.recordId;
        }
    }
    if (artifact.conflicts.includes('Bio'))
        add('record-conflict','Conflicting Bio labels',['Bio']);
    if (!bio.trim() && !allowEmptyBio)
        add('bio-missing','Bio is absent; only a saved sparse-bio premise permits an empty bio',['Bio']);
    if (!bioWithinBounds(bio))
        add('bio-length',`Bio exceeds ${LIMITS.bioWords} words / ${LIMITS.bio} characters`,['Bio']);
    const discardedReferences=[...qa.issues,...photos.issues].filter(i=>!i.recordId||!expectedReferences.has(i.recordId)).map(i=>i.recordId||'(missing reference)');
    for(const issue of [...qa.issues,...photos.issues].filter(i=>i.recordId&&expectedReferences.has(i.recordId))){issues.push(issue);problems.push(issue.message);}
    const unitIssue=(code:string,message:string,labels:string[],recordId:string)=>{add(code,message,labels);issues.at(-1)!.recordId=recordId;};
    const seen=new Set<string>();
    for(const [i,record] of qa.slots.entries()){
        const id=publicReference('Question',i),q=record?.fields.Question||'',answer=record?.fields.Answer||'';
        if(!record){unitIssue('question-missing',`${id}: Question / Answer record missing`,['Question','Answer'],id);continue;}
        if(hiddenNameIssue(identity,q))unitIssue('public-name',`${id}: Question reveals the private real name`,['Question'],id);
        if(hiddenNameIssue(identity,answer))unitIssue('public-name',`${id}: Answer reveals the private real name`,['Answer'],id);
        if(record.conflicts.length)unitIssue('record-conflict',`${id}: repeated conflicting fields`,record.conflicts,id);
        if(!q)unitIssue('question-missing',`${id}: Question missing`,['Question'],id);
        else if(q.length>LIMITS.question)unitIssue('question-length',`${id}: Question exceeds its accepted length`,['Question'],id);
        if(!answer)unitIssue('answer-missing',`${id}: Answer missing`,['Answer'],id);
        else if(answer.length>LIMITS.answer)unitIssue('answer-length',`${id}: Answer exceeds its accepted length`,['Answer'],id);
        if(q&&seen.has(key(q)))unitIssue('question-duplicate',`${id}: Question duplicates an earlier card`,['Question','Answer'],id);
        seen.add(key(q));
    }
    for(const [i,record] of photos.slots.entries()){
        const id=publicReference('Gallery photo purpose',i),purpose=record?.fields['Gallery photo purpose'];
        if(!purpose)unitIssue('gallery-missing',`${id}: Gallery photo purpose missing`,['Gallery photo purpose'],id);
        else if(purpose.length>LIMITS.galleryPurpose)unitIssue('gallery-length',`${id}: Gallery photo purpose exceeds its accepted length`,['Gallery photo purpose'],id);
        if(record?.conflicts.length)unitIssue('record-conflict',`${id}: repeated conflicting fields`,record.conflicts,id);
    }
    if(questionCount<LIMITS.questionsMin||questionCount>LIMITS.questionsMax)add('questions','Saved Q&A count must be 1–3.',['Question','Answer']);
    if(photoCount<LIMITS.photosMin||photoCount>LIMITS.photosMax)add('gallery','Saved gallery count is invalid.',['Gallery photo purpose']);
    // Disclosure is accepted during the identity/index step; public generation cannot change it.
    const row = { ...identity, bio, person: { ...identity.person, prompts: questions }, openingPhoto: null };
    return {row,gallery,problems,issues,discardedReferences};
}
export function projectPhotos(artifact: AuthoredArtifact, identity: any, count: number) {
    const groups = artifactRecordGroups(artifact,'Photo purpose');
    const issues: AuthoringIssue[] = [], photos: any[] = [];
    const add = (message: string, labels: string[]) => issues.push({ code: 'photo', message, labels });
    if (!artifact.complete) add('Photo output was cut off', V2_GUIDANCE['1D — One complete photo'].map(f => f.label));
    if (groups.length !== count) add(`Write ${count} complete Photo purpose records`, ['Photo purpose']);
    for (const [i, r] of groups.entries()) {
        const description = r['Full literal description'] || '', caption = r['Public caption'] || '', kind = r['Photo kind and aspect'] || '';
        if (hiddenNameIssue(identity, description + '\n' + caption)) add(`Photo ${i + 1}: Full literal description / Public caption reveal the private real name`, ['Full literal description', 'Public caption']);
        const aspect = /\blandscape\b/i.test(kind) ? 'landscape' : /\bsquare\b/i.test(kind) ? 'square' : /\bportrait\b/i.test(kind) ? 'portrait' : '';
        const refs = (r['Visible subjects'] || '').split(/[,;\n]/).map(choice).filter(Boolean), subjectIds: string[] = [];
        for (const name of refs) {
            if (/^(none|no people or animals|scenery only|objects only)$/i.test(name)) {
                if (refs.length !== 1) add(`Photo ${i + 1}: conflicting subjectless scene`, ['Visible subjects']);
                continue;
            }
            const entities = identity.person?.entities || [];
            const matches = entities.filter((e: any) => referenceKey(e.name) === referenceKey(name));
            const id = /^(owner|self)$/i.test(name) ? 'self' : matches.length === 1 ? matches[0].id : '';
            if (!id || subjectIds.includes(id)) add(`Photo ${i + 1}: unrecognized or duplicate visible subject`, ['Visible subjects']);
            else subjectIds.push(id);
        }
        if (subjectIds.length > PHOTO_TEXT_LIMITS.subjects) add(`Photo ${i + 1}: at most ${PHOTO_TEXT_LIMITS.subjects} visible subjects are supported`, ['Visible subjects']);
        if (!refs.length) add(`Photo ${i + 1}: explicitly identify visible subjects or none`, ['Visible subjects']);
        if (unknown(description) || description.length > PHOTO_TEXT_LIMITS.description) add(`Photo ${i + 1}: Full literal description must be 1–${PHOTO_TEXT_LIMITS.description} characters`, ['Full literal description']);
        if (caption.length > PHOTO_TEXT_LIMITS.caption) add(`Photo ${i + 1}: shorten only Public caption to ${PHOTO_TEXT_LIMITS.caption} characters`, ['Public caption']);
        if (!aspect) add(`Photo ${i + 1}: Photo kind and aspect needs portrait, landscape or square`, ['Photo kind and aspect']);
        // New fields are additive: missing fields keep legacy scene authority.
        const subjectField=(label:string,id:string)=>subjectIds.length===1?r[label]||'':subjectSceneField(r[label]||'',id==='self'?'owner':identity.person.entities.find((e:any)=>e.id===id)?.name||'');
        const separate=!!r['Pose and action'];
        const rawScene:DatingVisualPlan={description,camera:r['Camera and composition']||'',subjects:subjectIds.map(id=>({
            id,position:subjectField('Relative positions',id),clothing:subjectField('Clothing and accessories',id),
            expression:subjectField('Expression',id),pose:subjectField(separate?'Pose and action':'Pose, action and gaze',id),action:'',gaze:subjectField('Gaze',id),
        })),interaction:!separate&&subjectIds.length>1?r['Pose, action and gaze']||'':'',spatial:r['Relative positions']||'',environment:r['Location and environment']||'',lighting:r['Lighting and atmosphere']||''};
        const scene:DatingVisualPlan={...rawScene,
            ...(separate&&completeStructuredScene(rawScene)?{renderSource:'structured' as const}:{}),
            camera:nativeSummary(rawScene.camera,LIMITS.visualText),subjects:rawScene.subjects.map(s=>({...s,
                position:nativeSummary(s.position,LIMITS.position),clothing:nativeSummary(s.clothing,LIMITS.clothing),expression:nativeSummary(s.expression,160),pose:nativeSummary(s.pose,LIMITS.pose),gaze:nativeSummary(s.gaze,120),
            })),interaction:nativeSummary(rawScene.interaction,LIMITS.visualText),spatial:nativeSummary(rawScene.spatial,LIMITS.visualText),environment:nativeSummary(rawScene.environment,LIMITS.visualText),lighting:nativeSummary(rawScene.lighting,LIMITS.visualText)};
        if (subjectIds.length > 1 && !scene.spatial) add(`Photo ${i + 1}: Relative positions required for group composition`, ['Relative positions']);
        const prompt = compileDatingVisual(identity, scene, description, subjectIds, '');
        if (prompt.length > LIMITS.compiledPhoto) add(`Photo ${i + 1}: compiled scene exceeds ${LIMITS.compiledPhoto} characters`, ['Full literal description', 'Camera and composition', 'Relative positions', 'Clothing and accessories', 'Expression', 'Pose and action', 'Gaze', 'Pose, action and gaze', 'Location and environment', 'Lighting and atmosphere']);
        photos.push({ description, caption, kind: /selfie/i.test(kind) ? 'selfie' : 'photo', aspect, prompt: description, subjectIds, subjectPosition: '', visual: scene });
    }
    return { photos, issues, repairLabels: issueLabels(issues), problems: issues.map(x => x.message) };
}

export function photoArtifacts(a: AuthoredArtifact): AuthoredArtifact[] {
    const lines = (a.content || a.text).split(/\r?\n/);
    const units: string[][] = [];
    let current:string[]|undefined,reference='';
    for(const line of lines){
        if(labelLine(line)?.label==='Record reference'){reference=line;continue;}
        if(labelLine(line)?.label==='Photo purpose'){
            current=reference?[reference]:[];reference='';
            units.push(current);
        }
        if (current)
            current.push(line);
    }
    return units.map((lines, i) => parseAuthoring(lines.join('\n'), 'photos', a.complete || i < units.length - 1 || lines.some(l => /^END PHOTO[.!]?$/i.test(l.trim())) ? 'stop' : 'length', a.revision));
}
/** Independent referenced patches cannot erase a valid sibling because another patch is invalid. */
export function repairPublicUnits(previous:AuthoredArtifact,next:AuthoredArtifact,editable:string[],allowEmptyBio:boolean,counts:{questions:number;photos:number},identity:any):{artifact:AuthoredArtifact;discardedLabels:string[]} {
 const scoped=scopeRepairArtifact(next,editable);next=scoped.artifact;
 const records=[...artifactRecords(next,'Question'),...artifactRecords(next,'Gallery photo purpose')];
 if(!records.length)return {artifact:publicRepair(previous,next,allowEmptyBio,counts,identity),discardedLabels:scoped.discardedLabels};
 const history=previous.text+'\n\n## Accepted public correction\n'+next.text;
 if(history.length>LIMITS.history)throw new AuthoringContractError([{code:'storage',layer:'storage',repair:'blocked',message:'Public correction history exceeded its storage bound.',labels:[]}]);
 let merged=previous,accepted=false;const rejected:string[]=[...scoped.discardedLabels];let firstError:unknown;
 const apply=(body:string,label:string,sourceRef?:string)=>{try{
  const part=parseAuthoring(body,'public','stop',next.revision),refs=new Set(part.records?.map(r=>r.id));
  part.incompleteFields=unfinishedPublicFields(next).filter(f=>f.recordId?f.recordId===sourceRef||refs.has(f.recordId):Object.hasOwn(part.fields,f.label)).map(f=>f.recordId&&sourceRef?{...f,recordId:part.records?.[0]?.id||f.recordId}:f);
  part.complete=!part.incompleteFields.length;
  merged=publicRepair({...merged,text:previous.text},part,allowEmptyBio,counts,identity);accepted=true;
 }catch(error){firstError||=error;rejected.push(label);}};
 if(Object.hasOwn(next.fields,'Bio'))apply('Bio: '+next.fields.Bio,'Bio');
 for(const record of records){
  const start=Object.hasOwn(record.fields,'Question')||Object.hasOwn(record.fields,'Answer')?'Question':'Gallery photo purpose',count=start==='Question'?counts.questions:counts.photos;
  const table=records.filter(r=>start==='Question'?Object.hasOwn(r.fields,'Question')||Object.hasOwn(r.fields,'Answer'):Object.hasOwn(r.fields,'Gallery photo purpose'));
  const fields={...record.fields};
  if(!fields['Record reference']&&table.length===count){
   const slots=publicRecordSlots(previous,start,count).slots,match=slots.findIndex(r=>r?.fields[start]===fields[start]);
   fields['Record reference']=publicReference(start,match>=0?match:table.indexOf(record));
  }
  const body=Object.entries(fields).sort(([a],[b])=>a==='Record reference'?-1:b==='Record reference'?1:0).map(([label,value])=>label+': '+value).join('\n');
  apply(body,fields['Record reference']||(record.fields.Question?'Question':'Gallery photo purpose'),record.fields['Record reference']||publicReference(start,table.indexOf(record)));
 }
 if(!accepted)throw firstError||new AuthoringContractError([{code:'public-patch',message:'No requested public correction was valid.',labels:editable}]);
 return {artifact:{...merged,text:history},discardedLabels:[...new Set(rejected)]};
}
export function publicRepair(previous: AuthoredArtifact | undefined, next: AuthoredArtifact, allowEmptyBio = false, counts: {questions:number;photos:number} = {questions:LIMITS.questionsMax,photos:LIMITS.photosMax}, identity?: any) {
    if (!previous || previous === next) return normalizePublicCounts(next,counts.questions,counts.photos,identity);
    next = normalizePublicCounts(next,counts.questions,counts.photos,identity);
    previous = normalizePublicCounts(revalidatePublicArtifact(previous,identity,false),counts.questions,counts.photos);
    const unfinished=unfinishedPublicFields(previous),changed=new Map<string,Set<string>>(),referenceMap=new Map<string,string>();
    // Omitted components are unchanged; supplied repeated tables replace only that component.
    const allowed = new Set([...V2_GUIDANCE['1C — Public profile and gallery plan'].map(f=>f.label), 'Question','Answer','Gallery photo purpose','Record reference']);
    if (Object.keys(next.fields).some(label=>!allowed.has(label as any)))
        throw new AuthoringContractError([{code:'public-patch',message:'Public correction contains nonpublic fields.',labels:[]}]);
    const parts = publicSections(previous), patch = publicSections(next);
    let body = parts.scalar;
    for (const [label,value] of Object.entries(next.fields).filter(([label])=>!['Question','Answer','Gallery photo purpose','Record reference'].includes(label))) {
        if(next.conflicts.includes(label)) throw new AuthoringContractError([{code:'public-patch',message:'Public correction contains conflicting scalar fields.',labels:[label]}]);
        const output:string[]=[]; let skipping=false, found=false;
        for(const line of body.split(/\r?\n/)) {
            const item=labelLine(line);
            if(item?.label===label){output.push(`${label}: ${value}`);skipping=true;found=true;continue;}
            if(item || isBoundary(line))skipping=false;
            if(!skipping)output.push(line);
        }
        if(!found)output.push(`${label}: ${value}`);
        body=output.join('\n');
        changed.set('',new Set([...(changed.get('')||[]),label]));
    }
    const patchTable=(start:string,baseline:string[],incoming:string[])=>{
        const records=artifactRecords(next,start);
        const count=start==='Question'?counts.questions:counts.photos;
        const prior=publicRecordSlots(previous,start,count).slots, output=prior.map((r,i)=>r?Object.entries({'Record reference':publicReference(start,i),...r.fields}).map(([k,v])=>k+': '+v).join('\n'):''), seen=new Set<number>();
        for(const [position,patch] of records.entries()) {
            let reference=patch.fields['Record reference'];
            if(!reference){
                const matches=prior.flatMap((r,i)=>r&&r.fields[start]===patch.fields[start]?[i]:[]);
                const missing=prior.flatMap((r,i)=>!r?[i]:[]);
                if(matches.length===1)reference=publicReference(start,matches[0]);
                else if(records.length===1&&missing.length===1)reference=publicReference(start,missing[0]);
                else if(records.length===count&&!records.some(r=>r.fields['Record reference']))reference=publicReference(start,position);
            }
            const index=Array.from({length:count},(_,i)=>publicReference(start,i)).indexOf(reference);
            if(index<0||seen.has(index))throw new AuthoringContractError([{code:start==='Gallery photo purpose'?'locked-field':'record-reference',message:start==='Gallery photo purpose'?'Correction cannot change an accepted gallery purpose without an unresolved supplied reference.':'Correction references an unknown or repeated saved record.',labels:[start],recordId:reference}]);
            seen.add(index);
            referenceMap.set(patch.fields['Record reference']||publicReference(start,position),reference);
            changed.set(reference,new Set(Object.keys(patch.fields).filter(k=>k!=='Record reference')));
            const fields:Record<string,string>={'Record reference':reference,...prior[index]?.fields,...patch.fields};
            const old=prior[index],q=old?.fields.Question;
            if(start==='Question'&&q&&q.length<=LIMITS.question&&!unfinished.some(f=>f.recordId===reference&&f.label==='Question')&&!old!.conflicts.includes('Question')&&!prior.slice(0,index).some(r=>r&&key(r.fields.Question||'')===key(q))&&(!identity||!hiddenNameIssue(identity,q))&&fields.Question!==q)
                throw new AuthoringContractError([{code:'locked-field',message:'Correction attempted to change an already authored field (Question) while repairing its answer.',labels:['Question'],recordId:reference}]);
            output[index]=Object.entries(fields).map(([label,value])=>`${label}: ${value}`).join('\n');
        }
        return output.filter(Boolean);
    };
    body=publicBody(body,
        Object.hasOwn(next.fields,'Question') || Object.hasOwn(next.fields,'Answer') ?patchTable('Question',parts.questions,patch.questions):parts.questions,
        Object.hasOwn(next.fields,'Gallery photo purpose') ?patchTable('Gallery photo purpose',parts.gallery,patch.gallery):parts.gallery);
    const history=previous.text+'\n\n## Accepted public correction\n'+next.text;
    if(history.length>LIMITS.history)throw new AuthoringContractError([{code:'storage',repair:'blocked',layer:'storage',message:'Public correction history exceeded its storage bound.',labels:[]}]);
    const incoming=unfinishedPublicFields(next).map(f=>({...f,recordId:f.recordId?referenceMap.get(f.recordId)||f.recordId:undefined}));
    const pending=[...unfinished.filter(f=>!changed.get(f.recordId||'')?.has(f.label)),...incoming];
    const incompleteFields=pending.filter((f,i)=>pending.findIndex(g=>g.label===f.label&&g.recordId===f.recordId)===i);
    const complete=next.complete&&!incompleteFields.length;
    next={...parseAuthoring(body,'public',complete?'stop':'length',next.revision),incompleteFields,text:history};
    next=normalizePublicCounts(next,counts.questions,counts.photos);
    const before = publicBio(previous), after = publicBio(next);
    if (!unfinished.some(f=>f.label==='Bio')&&!previous.conflicts.includes('Bio') && (!identity || !hiddenNameIssue(identity,before)) && Object.hasOwn(previous.fields, 'Bio') && (!!before.trim() || allowEmptyBio) && bioWithinBounds(before) && before !== after)
        throw new AuthoringContractError([{code:'locked-field',message:'Correction attempted to change an already authored field.',labels:['Bio']}]);
    const valid = (r: Record<string, string>) => (!identity || !hiddenNameIssue(identity, (r.Question||'')+'\n'+(r.Answer||''))) && r.Question && r.Question.length <= LIMITS.question && r.Answer && r.Answer.length <= LIMITS.answer;
    const old=publicRecordSlots(previous,'Question',counts.questions).slots,fresh=publicRecordSlots(next,'Question',counts.questions).slots;
    const seen=new Set<string>();
    for(const [i,record] of old.entries()){
        if(!record||record.conflicts.length||unfinished.some(f=>f.recordId===publicReference('Question',i))||!valid(record.fields))continue;
        const r=record.fields,k=key(r.Question);if(seen.has(k))continue;seen.add(k);
        if (fresh[i]?.fields.Question !== r.Question || fresh[i]?.fields.Answer !== r.Answer)
            throw new AuthoringContractError([{code:'locked-field',message:'Correction attempted to change an already authored field.',labels:['Question','Answer'],recordId:publicReference('Question',i)}]);
    }
    const oldGallery = publicRecordSlots(previous,'Gallery photo purpose',counts.photos).slots, nextGallery = publicRecordSlots(next,'Gallery photo purpose',counts.photos).slots;
    for (const [i, record] of oldGallery.entries()) {
        const purpose = !record?.conflicts.length&&record?.fields['Gallery photo purpose'];
        if (!unfinished.some(f=>f.recordId===publicReference('Gallery photo purpose',i))&&purpose && purpose.length <= LIMITS.galleryPurpose && nextGallery[i]?.fields['Gallery photo purpose'] !== purpose)
            throw new AuthoringContractError([{code: 'locked-field', message: 'Correction attempted to change an already authored gallery purpose.', labels: ['Gallery photo purpose']}]);
    }
    return next;
}

export function equivalentAuthoredField(label: string, before: string, after: string) {
    if (before.trim() === after.trim()) return true;
    if (label === 'Anonymous profile') return booleanChoice(before) !== undefined && booleanChoice(before) === booleanChoice(after);
    if (label === 'Public categories') {
        const a = disclosureChoices(before, DATING_OPTIONS), b = disclosureChoices(after, DATING_OPTIONS);
        if (a.valid && b.valid) return JSON.stringify(a.keys.sort()) === JSON.stringify(b.keys.sort());
    }
    if (label === 'Public categories' || /^Category /i.test(label)) {
        const tokens = (s: string) => [...new Set(s.split(/[,;\n]/).map(v=>key(choice(v))).filter(Boolean))].sort();
        return JSON.stringify(tokens(before)) === JSON.stringify(tokens(after));
    }
    return false;
}
/** Scope before merging: unrelated output is diagnostic evidence, never authority.
 * Requested scalar/record content still passes normal validation and identity guards. */
export function scopeRepairArtifact(artifact:AuthoredArtifact,editable:string[]):{artifact:AuthoredArtifact;discardedLabels:string[]} {
 const allowed=new Set(editable.map(key));
 if(editable.some(l=>l.startsWith('Companion')))for(const l of companionLabels)allowed.add(key(l));
 if(editable.some(l=>['Question','Answer'].includes(l)))for(const l of ['Question','Answer','Record reference'])allowed.add(key(l));
 if(editable.includes('Gallery photo purpose'))allowed.add(key('Record reference'));
 const lines:string[]=[],discarded=new Set<string>();let keep=false;
 let source=artifact.content??artifact.text;
 // A bare scalar is safe only when one exact typed choice was requested.
 // Free-form appearance/identity prose cannot acquire scope through guessing.
 if(!Object.keys(artifact.fields).length&&editable.length===1){
  const label=editable[0];
  if(label==='Public categories'&&disclosureChoices(source,DATING_OPTIONS).valid||label==='Anonymous profile'&&booleanChoice(source)!==undefined)source=label+': '+source;
 }
 for(const line of authoringLines(source)){
  const item=labelLine(line);
  if(item){keep=allowed.has(key(item.label));if(!keep)discarded.add(item.label);}
  else if(isBoundary(line)){keep=false;continue;}
  if(keep)lines.push(line);
 }
 if(!lines.join('\n').trim())throw new AuthoringContractError([{code:artifact.kind==='index'?'index-scope':'repair-scope',message:'Correction returned no requested unresolved field.',labels:editable}]);
 const scoped=parseAuthoring(lines.join('\n'),artifact.kind,artifact.complete?'stop':'length',artifact.revision);
 if(!Object.keys(scoped.fields).some(label=>editable.some(l=>key(l)===key(label))))throw new AuthoringContractError([{code:artifact.kind==='index'?'index-scope':'repair-scope',message:'Correction did not return a requested unresolved field; the original target is retained.',labels:editable}]);
 return {artifact:{...scoped,text:artifact.text},discardedLabels:[...discarded]};
}
/** Ignore identical unrequested echoes; changed/out-of-scope facts never enter the index. */
export function scopedIndexArtifact(artifact: AuthoredArtifact, editable: string[], authored: PersonAuthoring): AuthoredArtifact {
    artifact=scopeRepairArtifact(artifact,editable).artifact;
    if(Object.hasOwn(artifact.fields,'Public categories')){
        const sourceText=get(authored.index,'Public categories')||get(authored.dossier,'Public categories');
        const source=disclosureChoices(sourceText,DATING_OPTIONS),proposed=disclosureChoices(artifact.fields['Public categories'],DATING_OPTIONS);
        const explicitKeys=new Set(sourceText.split(/[,;\n]/).map(s=>key(choice(s)).replace(/ /g,'')));
        if(source.keys.includes('none')&&source.keys.length>1||proposed.keys.some(k=>!source.keys.includes(k)&&!explicitKeys.has(key(k).replace(/ /g,''))))
            throw new AuthoringContractError([{code:'disclosure-authority',repair:'author',message:'Organizer cannot add public disclosure absent an explicit authored choice.',labels:['Public categories']}]);
    }
    const fields: Record<string,string> = {};
    for (const [label,value] of Object.entries(artifact.fields)) {
        if (editable.some(allowed=>key(allowed)===key(label))) fields[label]=value;
        else {
            const prior=get(authored.index,label)||get(authored.dossier,label);
            if (!prior || !equivalentAuthoredField(label,prior,value)) throw new AuthoringContractError([{code:'index-scope',message:'Organizer returned a changed label outside its requested unresolved facts.',labels:[]}]);
        }
    }
    return {...artifact,fields};
}
/** A first organizer field-only correction can use an unambiguous dossier table. */
export function mergeIndexArtifact(authored: PersonAuthoring, next: AuthoredArtifact, editable: string[]): AuthoredArtifact {
    let baseline = authored.index;
    if (!baseline && authored.dossier && companionLabels.some(label => Object.hasOwn(next.fields,label))
        && !Object.hasOwn(next.fields,'Companion name')) {
        const records = recordGroups(companionBody(authored.dossier),'Companion name');
        if (records.length) baseline = parseAuthoring(records.map(r => Object.entries(r).map(([label,value]) => `${label}: ${value}`).join('\n')).join('\n'),'index','stop');
    }
    if (!baseline && companionLabels.some(label => Object.hasOwn(next.fields,label)) && !Object.hasOwn(next.fields,'Companion name'))
        throw new AuthoringContractError([{code:'companion-target',message:'Companion correction needs a Companion name heading or a single retained companion. Return the complete companion table.',labels:companionLabels}]);
    return mergeAuthoredArtifact(baseline,next,editable);
}
/** Scalar and named companion corrections are independent; their own protection checks still apply. */
export function repairIdentityUnits(authored:PersonAuthoring,next:AuthoredArtifact,editable:string[],task:'dossier'|'index'):{artifact:AuthoredArtifact;discardedLabels:string[]} {
 if(task==='dossier'&&!authored.dossier)return {artifact:next,discardedLabels:[]};
 const scalar=Object.entries(next.fields).filter(([label])=>!companionLabels.includes(label));
 if(!scalar.length||!next.fields['Companion name'])return {artifact:task==='index'?mergeIndexArtifact(authored,next,editable):mergeAuthoredArtifact(authored.dossier,next,editable),discardedLabels:[]};
 let baseline=authored[task],accepted=false;const discarded:string[]=[];let firstError:unknown;
 for(const [body,label] of [[scalar.map(([k,v])=>k+': '+v).join('\n'),'scalar'],[companionBody(next),'Companion']]){
  const part=parseAuthoring(body,task,next.complete?'stop':'length',next.revision);
  try{baseline=task==='index'?mergeIndexArtifact({...authored,index:baseline},part,editable):mergeAuthoredArtifact(baseline,part,editable);accepted=true;}catch(error){firstError||=error;discarded.push(label);}
 }
 if(!accepted||!baseline)throw firstError;
 return {artifact:baseline,discardedLabels:discarded};
}
/** Corrections edit explicit canonical labels only. Human error text never grants permission. */
export function mergeAuthoredArtifact(saved: AuthoredArtifact | undefined, next: AuthoredArtifact, editable: string[]): AuthoredArtifact {
    if (!saved) return next;
    if (saved.text.length + next.text.length > LIMITS.history) throw new AuthoringContractError([{code: 'storage', repair:'blocked',layer:'storage',message: 'Authored correction history exceeded its storage bound.', labels: []}]);
    const fields = { ...saved.fields }, conflicts = new Set(saved.conflicts);
    for (const [label, value] of Object.entries(next.fields)) {
        if(label==='Record reference')continue;
        if (companionLabels.includes(label)) continue; // Repeatable records are checked by identity below.
        const prior = fields[label];
        if ((prior === undefined || !equivalentAuthoredField(label, prior, value)) && !editable.some(allowed => key(allowed) === key(label)) && !saved.conflicts.includes(label))
            throw new AuthoringContractError([{code: 'locked-field', message: 'Correction attempted to change an already authored field.', labels: [label]}]);
        fields[label] = value;
        if (!next.conflicts.includes(label)) conflicts.delete(label);
    }
    const oldBody = companionBody(saved);
    const hasCompanionEdit = companionLabels.some(label => Object.hasOwn(next.fields,label));
    const oldUnits = saved.content === '' ? authoringRecords(oldBody,'Companion name') : artifactRecords(saved,'Companion name');
    const oldRecords = hasCompanionEdit ? oldUnits.map(r=>r.fields) : recordGroups(oldBody,'Companion name');
    let companions = oldRecords;
    if (hasCompanionEdit) {
        const nextBody = next.content ?? next.text;
        const replacements = artifactRecordGroups(next,'Companion name');
        const partial = !replacements.length || replacements.some(r => companionLabels.some(label => !Object.hasOwn(r,label)));
        if (partial) {
            if (oldUnits.some(r=>r.conflicts.length))
                throw new AuthoringContractError([{code:'companion-target',message:'Conflicting companion records require the complete companion table, starting each record with Companion name.',labels:companionLabels}]);
            // No positional guess: a nameless patch is safe only for a single retained companion.
            const patchLines: string[] = [];
            let inCompanionField = false;
            for (const line of nextBody.split(/\r?\n/)) {
                const item = labelLine(line);
                if (item) inCompanionField = companionLabels.includes(item.label);
                else if (isBoundary(line)) inCompanionField = false;
                if (inCompanionField) patchLines.push(line);
            }
            const patches = replacements.length ? replacements : recordGroups(`Companion name: __field_patch__\n${patchLines.join('\n')}`, 'Companion name');
            if (!replacements.length && oldRecords.length !== 1)
                throw new AuthoringContractError([{code:'companion-target',message:'Companion correction is ambiguous. Return the complete companion table, starting each record with Companion name.',labels:companionLabels}]);
            companions = oldRecords.map(r => ({...r}));
            const targets = new Set<number>();
            for (const patch of patches) {
                const matches = replacements.length ? oldRecords.map((r,i) => referenceKey(r['Companion name'] || '') === referenceKey(patch['Companion name'] || '') ? i : -1).filter(i=>i>=0) : [0];
                if (matches.length !== 1 || targets.has(matches[0]))
                    throw new AuthoringContractError([{code:'companion-target',message:'Companion correction needs one unambiguous retained Companion name; return the complete table.',labels:companionLabels}]);
                targets.add(matches[0]);
                for (const label of companionLabels) if (Object.hasOwn(patch,label) && (replacements.length || label !== 'Companion name'))
                    companions[matches[0]][label] = patch[label];
            }
        } else companions = replacements;
        for (const record of companions) {
            const prior = oldUnits.find(r => referenceKey(r.fields['Companion name'] || '') === referenceKey(record['Companion name'] || ''));
            for (const [label,value] of Object.entries(record)) {
                const same = label === 'Companion kind' ? !!companionKind(value) && companionKind(value) === companionKind(prior?.fields[label] || '') : equivalentAuthoredField(label,prior?.fields[label] || '',value);
                if (!same && !editable.some(allowed=>key(allowed)===key(label)) && !prior?.conflicts.includes(label))
                    throw new AuthoringContractError([{code:'locked-field',message:'Correction attempted to change an already authored field.',labels:[label]}]);
            }
        }
        const body = companions.map(r => Object.entries(r).map(([label,value]) => `${label}: ${value}`).join('\n')).join('\n');
        assertPreservedCompanions(saved,body);
    }
    for (const label of companionLabels) delete fields[label];
    for (const record of companions) Object.assign(fields,record);
    const content = [...Object.entries(fields).filter(([label])=>!companionLabels.includes(label)&&label!=='Record reference').map(([label, value]) => `${label}: ${value}`), ...companions.map(r => Object.entries(r).map(([label,value]) => `${label}: ${value}`).join('\n'))].join('\n');
    return { ...saved, revision: next.revision, text: saved.kind === 'photos' ? content : saved.text + '\n\n## Accepted extraction correction\n' + next.text, content, fields, records:canonicalRecords(content).map(r=>{const prior=saved.records?.find(n=>n.start===r.start&&(r.start==='Photo purpose'||n.fields[r.start]===r.fields[r.start]));return {...r,id:next.records?.find(n=>n.start===r.start&&n.fields['Record reference'])?.id||prior?.id||r.id,conflicts:[...new Set([...r.conflicts,...(prior?.conflicts||[]).filter(label=>!Object.hasOwn(next.fields,label)||!editable.includes(label))])]};}), conflicts: [...new Set([...conflicts, ...next.conflicts])], complete: next.complete };
}
// A malformed sibling never unlocks an independently valid authored identity.
function assertPreservedCompanions(before:string|AuthoredArtifact,after:string|AuthoredArtifact) {
    const labels = ['Companion name', 'Companion kind', 'Companion appearance', 'Companion relationship'];
    const old=typeof before==='string'?authoringRecords(before,'Companion name'):artifactRecords(before,'Companion name');
    const replacements=typeof after==='string'?recordGroups(after,'Companion name'):artifactRecordGroups(after,'Companion name');
    for (const record of old) {
        const name = record.fields['Companion name'] || '';
        if (record.conflicts.length || old.filter(r => referenceKey(r.fields['Companion name'] || '') === referenceKey(name)).length !== 1) continue;
        try { companions(Object.entries(record.fields).map(([label, value]) => `${label}: ${value}`).join('\n')); }
        catch (error) { if (error instanceof AuthoringContractError) continue; throw error; }
        const replacement = replacements.find(r => referenceKey(r['Companion name'] || '') === referenceKey(name));
        if (!replacement || labels.some(label => (label === 'Companion kind' ? companionKind(record.fields[label] || '') !== companionKind(replacement[label] || '') : choice(record.fields[label] || '') !== choice(replacement[label] || ''))))
            throw new AuthoringContractError([{code: 'companion-identity', message: 'Correction attempted to replace an already valid companion.', labels}]);
    }
}
export function preservedIdentityIssues(before: any, after: any): string[] {
    const issues: string[] = [];
    for (const field of ['alias', 'age', 'pronouns'])
        if (before[field] && before[field] !== after[field]) issues.push(`${field}: organizer changed an established fact`);
    for (const field of ['orientation', 'commitments', 'intentions', 'boundaries'])
        if (before.privateFields?.[field] && before.privateFields[field] !== after.privateFields?.[field]) issues.push(`${field}: organizer changed an established fact`);
    return issues;
}
