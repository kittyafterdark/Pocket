import { AUTHORING_LIMITS as LIMITS } from './lumistry-authoring-contract.js';
import { PHOTO_TEXT_LIMITS } from './lumistry-photo-contract.js';
import { normalizeDatingVisual, type DatingVisualPlan } from './lumistry-visual.js';
/** Private dating identity. Reuses Pocket phoneProfile for the actual messaging voice. */
export interface DatingPerson {
    version: 1;
    anatomy?:{version:1;bodyPlan:string;limbs:string;surface:string;face:string;currentForm:string};
    appearance: {
        tags: string;
        face: string;
        eyes?: string;
        hair: string;
        skin: string;
        build: string;
        height: string;
        distinctive: string;
        usualStyle: string;
    };
    life: {
        background: string;
        career: string;
        routine: string;
        socialCircle: string;
        currentPressure: string;
        values: string;
        contradiction: string;
        attraction: string;
    };
    availability: {
        routine: string;
        appHabits: string;
        minReplySeconds: number;
        maxReplySeconds: number;
        quietStart: number | null;
        quietEnd: number | null;
    };
    intimacy: {
        sexualInterests: string;
        kinks: string;
        role: string;
        turnOns: string;
        turnOffs: string;
        boundaries: string;
        disclosure: string;
    };
    presentation?: {
        hook: string;
        cause: string;
        profileBehavior: string;
        conversationBehavior: string;
        photoBehavior: string;
        styleAcrossOccasions: string;
        limits: string;
    };
    writingVoice?: {
        primaryLanguage?: string;
        bioLanguage?: string;
        otherLanguages?: string;
        humor?: string;
        sample?: string;
        basis: string;
        register: string;
        mechanics: string;
        rhythm: string;
        effort: string;
        audience: string;
        selfImage: string;
        privateContrast: string;
    };
    unresolvedSubjects?: Array<{name:string;kind:string;appearance:string;relationship:string}>;
    entities: Array<{
        id: string;
        kind: string;
        name: string;
        appearance: string;
        relationship: string;
    }>;
    prompts: Array<{
        question: string;
        answer: string;
    }>;
}
const obj = (v: any): Record<string, any> => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const text = (v: any, n = 600) => typeof v === 'string' ? v.trim().slice(0, n) : '';
const fields = <T extends string>(v: any, keys: readonly T[]): Record<T, string> => Object.fromEntries(keys.map(k => [k, text(obj(v)[k])])) as Record<T, string>;
export const PERSON_TEMPLATE = {
    version: 1,
    appearance: { tags: '', face: '',eyes:'', hair: '', skin: '', build: '', height: '', distinctive: '', usualStyle: '' },
    life: { background: '', career: '', routine: '', socialCircle: '', currentPressure: '', values: '', contradiction: '', attraction: '' },
    availability: { routine: '', appHabits: '', minReplySeconds: 10, maxReplySeconds: 180, quietStart: null, quietEnd: null },
    intimacy: { sexualInterests: '', kinks: '', role: '', turnOns: '', turnOffs: '', boundaries: '', disclosure: '' },
    presentation: { hook: '', cause: '', profileBehavior: '', conversationBehavior: '', photoBehavior: '', styleAcrossOccasions:'', limits: '' },
    writingVoice: { primaryLanguage: '', bioLanguage: '', otherLanguages: '', humor: '', sample: '', basis: '', register: '', mechanics: '', rhythm: '', effort: '', audience: '', selfImage: '', privateContrast: '' },
    entities: [] as DatingPerson['entities'], prompts: [] as DatingPerson['prompts'],
};
export function normalizeDatingPerson(raw: unknown): DatingPerson | undefined {
    const v = obj(raw);
    if (v.version !== 1)
        return undefined;
    const a = obj(v.availability), min = Math.max(0, Math.min(7200, Number(a.minReplySeconds) || 0));
    const hour = (x: unknown) => x !== null && x !== '' && x !== undefined && Number.isInteger(Number(x)) && Number(x) >= 0 && Number(x) < 24 ? Number(x) : null;
    return { version: 1,
        ...(v.anatomy?.version===1&&['bodyPlan','limbs','surface','face','currentForm'].every(k=>typeof v.anatomy[k]==='string'&&v.anatomy[k].length<=(['bodyPlan','currentForm'].includes(k)?6000:600))?{anatomy:{version:1 as const,bodyPlan:v.anatomy.bodyPlan,limbs:v.anatomy.limbs,surface:v.anatomy.surface,face:v.anatomy.face,currentForm:v.anatomy.currentForm}}:{}),
        appearance: { ...fields(v.appearance, Object.keys(PERSON_TEMPLATE.appearance) as Array<keyof DatingPerson['appearance']>), tags: text(v.appearance?.tags, 6000) },
        life: fields(v.life, Object.keys(PERSON_TEMPLATE.life) as Array<keyof DatingPerson['life']>),
        availability: { routine: text(a.routine), appHabits: text(a.appHabits), minReplySeconds: min, maxReplySeconds: Math.max(min, Math.min(7200, Number(a.maxReplySeconds) || min)), quietStart: hour(a.quietStart), quietEnd: hour(a.quietEnd) },
        intimacy: fields(v.intimacy, Object.keys(PERSON_TEMPLATE.intimacy) as Array<keyof DatingPerson['intimacy']>),
        presentation: fields(v.presentation, Object.keys(PERSON_TEMPLATE.presentation) as Array<keyof NonNullable<DatingPerson['presentation']>>),
        writingVoice: v.writingVoice && typeof v.writingVoice === 'object' && !Array.isArray(v.writingVoice)
            ? fields(v.writingVoice, Object.keys(PERSON_TEMPLATE.writingVoice).filter(k => !['primaryLanguage', 'bioLanguage', 'otherLanguages', 'humor', 'sample'].includes(k) || v.writingVoice[k] !== undefined) as Array<keyof NonNullable<DatingPerson['writingVoice']>>)
            : undefined,
        entities:normalizeDatingEntities(v.entities), unresolvedSubjects:(Array.isArray(v.unresolvedSubjects)?v.unresolvedSubjects:[]).slice(0,LIMITS.companions).map((e:any)=>({name:text(e?.name,LIMITS.companionName),kind:text(e?.kind,40),appearance:text(e?.appearance),relationship:text(e?.relationship,LIMITS.relationship)})),
        prompts: (Array.isArray(v.prompts) ? v.prompts : []).slice(0, 5).flatMap((p: any) => text(p?.question, LIMITS.question) && text(p?.answer, LIMITS.answer) ? [{ question: text(p.question, LIMITS.question), answer: text(p.answer, LIMITS.answer) }] : []),
    };
}
export function normalizeDatingEntities(raw: unknown): DatingPerson['entities'] {
    return (Array.isArray(raw) ? raw : []).slice(0, 24).flatMap((e: any) => /^[a-z][a-z0-9_-]{0,39}$/.test(e?.id) && text(e.appearance) ? [{ id: e.id, kind: text(e.kind, 40), name: text(e.name, LIMITS.companionName), appearance: text(e.appearance), relationship: text(e.relationship, LIMITS.relationship) }] : []);
}
export function personVisualAnchor(person?: DatingPerson): string {
    return person ? Object.entries(person.appearance).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
}
export interface DatingPhotoAttachment {
    description: string;
    prompt: string;
    subjectIds: string[];
    anchor: string;
    visual?: DatingVisualPlan;
    aspect?: string;
    rendered?: boolean;
}
/** Snapshots include locally compiled subject identities; retain their bounded full text on reload. */
export function normalizeDatingAttachment(raw: unknown, rendered?: boolean): DatingPhotoAttachment | undefined {
    const v = obj(raw);
    const subjects=Array.isArray(v.visual?.subjects)?v.visual.subjects:v.subjectIds;
    if(typeof v.description==='string' && v.description.trim().length>PHOTO_TEXT_LIMITS.description || Array.isArray(subjects) && subjects.length>PHOTO_TEXT_LIMITS.subjects)return undefined;
    rendered=rendered??v.rendered===true;
    const description = text(v.description, PHOTO_TEXT_LIMITS.description), prompt = rendered?'':text(v.prompt || v.description, 32000);
    if (!description || (!rendered && !prompt))
        return undefined;
    return { description, prompt, ...(rendered?{rendered:true}:{}), visual: rendered?undefined:normalizeDatingVisual(v.visual), aspect: ['portrait', 'landscape', 'square'].includes(v.aspect) ? v.aspect : undefined, anchor: rendered?'':text(v.anchor, 16000), subjectIds: (Array.isArray(v.visual?.subjects) ? v.visual.subjects.map((s: any) => s?.id) : Array.isArray(v.subjectIds) ? v.subjectIds : ['self']).filter((x: unknown) => typeof x === 'string' && /^[a-z][a-z0-9_-]{0,39}$/.test(x)).slice(0, 8) };
}
/** Stable per outgoing burst, independent of reloads. Pocket's Instant setting overrides this. */
export function personReplyDelayMs(person: DatingPerson | undefined, seed: string, storyHour?: number): number {
    if (!person)
        return 0;
    let hash = 2166136261;
    for (const c of seed)
        hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
    const a = person.availability;
    let seconds = a.minReplySeconds + (hash % 10000) / 9999 * (a.maxReplySeconds - a.minReplySeconds);
    if (storyHour !== undefined && a.quietStart !== null && a.quietEnd !== null && a.quietStart !== a.quietEnd) {
        const quiet = a.quietStart < a.quietEnd ? storyHour >= a.quietStart && storyHour < a.quietEnd : storyHour >= a.quietStart || storyHour < a.quietEnd;
        if (quiet)
            seconds = Math.max(seconds, 300);
    }
    return Math.round(seconds * 1000);
}
