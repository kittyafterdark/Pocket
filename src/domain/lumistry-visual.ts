import { PHOTO_TEXT_LIMITS } from './lumistry-photo-contract.js';
import { AUTHORING_LIMITS } from './lumistry-authoring-contract.js';
import { datingAppearance } from './lumistry-facts.js';
/** Structured photo data; compilation deliberately never emits regional conditioning. */
export interface DatingVisualPlan {
    /** Complete literal V2 scene, independent of short camera directions. */
    description?: string;
    /** Only complete new scene records may omit the readable description at render time. */
    renderSource?: 'structured';
    camera: string;
    subjects: Array<{
        id: string;
        position: string;
        clothing: string;
        expression: string;
        pose: string;
        action: string;
        gaze: string;
    }>;
    interaction: string;
    spatial: string;
    environment: string;
    lighting: string;
}
export const VISUAL_TEMPLATE: DatingVisualPlan = { camera: '', subjects: [{ id: 'self', position: '', clothing: '', expression: '', pose: '', action: '', gaze: '' }], interaction: '', spatial: '', environment: '', lighting: '' };
export function withoutRegions(value: string): string {
    return value.replace(/<\/?region\b[^>]*(?:>|$)/gi, '').replace(/<\/?swarm-image\b[^>]*(?:>|$)/gi, '').trim();
}
const clean = (v: unknown, max = 500) => typeof v === 'string' ? withoutRegions(v).slice(0, max).trim() : '';
export function normalizeDatingVisual(raw: any): DatingVisualPlan | undefined {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.subjects))
        return undefined;
    const seen = new Set<string>();
    const subjects = raw.subjects.slice(0, 8).flatMap((s: any) => {
        const id = clean(s?.id, 40);
        if (!/^[a-z][a-z0-9_-]{0,39}$/.test(id) || seen.has(id))
            return [];
        seen.add(id);
        return [{ id, position: clean(s.position, 120), clothing: clean(s.clothing, 240), expression: clean(s.expression, 160), pose: clean(s.pose, 160), action: clean(s.action, 240), gaze: clean(s.gaze, 120) }];
    });
    // An explicitly empty subject list is valid for objects/scenery, never a default selfie.
    return subjects.length || raw.subjects.length === 0 ? { ...(typeof raw.description==='string'?{description:clean(raw.description,PHOTO_TEXT_LIMITS.description)}:{}), ...(raw.renderSource==='structured'&&completeStructuredScene(raw)?{renderSource:'structured' as const}:{}), camera: clean(raw.camera), subjects, interaction: clean(raw.interaction), spatial: clean(raw.spatial), environment: clean(raw.environment), lighting: clean(raw.lighting) } : undefined;
}
interface VisualIdentity {
    visualSetting?:string;
    age?: number;
    anonymous?: boolean;
    fields?: Record<string, string>;
    phoneProfile: {
        appearance: string;
    };
    person?: {
        anatomy?:{version:1;bodyPlan:string;limbs:string;surface:string;face:string;currentForm:string};
        appearance: Record<string, string>;
        entities: Array<{
            id: string;
            kind: string;
            appearance: string;
        }>;
    };
}
/** Explicit scene ownership only. Never infer a subject from clause order or prose mentions. */
export function subjectSceneField(value:string,reference:string):string {
 const matches=value.split(/[;\n]/).flatMap(clause=>{const m=clause.trim().match(/^(.+?)\s*(?:—|–|:)\s*(.+)$/);return m&&m[1].trim().normalize('NFKC').toLowerCase()===reference.normalize('NFKC').toLowerCase()?[m[2].trim()]:[];});
 return matches.length===1?matches[0]:'';
}
export function compileDatingVisual(profile: VisualIdentity, visual: DatingVisualPlan | undefined, fallback: string, ids: string[] = ['self'], position = ''): string {
    const requested=visual?visual.subjects.map(s=>s.id):ids;
    if(new Set(requested).size!==requested.length || requested.some(id=>id!=='self'&&!profile.person?.entities.some(e=>e.id===id)))throw new Error('The photo contains an unknown or repeated subject. Review its saved scene before rendering.');
    const generalFacts = (id:string) => id==='self' ? [Number.isInteger(profile.age)&&profile.age!>=18&&profile.age!<=99?`${profile.age}-year-old adult`:'',profile.fields?.gender,profile.fields?.species].filter(Boolean).join(', ') : '';
    const identity = (id: string, clothing = false) => {
        if (id !== 'self')
            return withoutRegions(profile.person?.entities.find(e => e.id === id)?.appearance || '');
        const a = profile.person?.appearance;
        if (profile.anonymous) {
            // Concealing a face must not erase the person's general visible body.
            // Only non-identifying canonical descriptors; no scars, tattoos, face,
            // eyes, distinctive hair, names or free-form biography in this projection.
            const surface=(a?.skin||profile.phoneProfile?.appearance||'').match(/\b(?:(?:warm-toned|cool-toned|very|deep|light|medium|dark|warm|cool|olive|golden|rich|pale|fair|tan|brown|black|white|bronze|copper|grey|gray|green|blue|red)[ -])*(?:skin|fur|scales)\b/gi)?.filter(v=>v.split(/[ -]/).length>1)||[];
            const build=(a?.build||'').match(/\b(?:petite|compact|small-framed|broad-shouldered|narrow-shouldered|slender|slim|stocky|lean|muscular|athletic|curvy|heavyset)\b/gi)||[];
            const silhouette=[...(profile.person?.anatomy?.bodyPlan||'').match(/equine lower body with four equine legs|serpentine lower body|humanlike body|botanical body|fluid body|mechanical body/gi)||[],...(profile.person?.anatomy?.limbs||'').match(/\b(?:no|two|four|six|eight|ten|\d{1,2})\s+(?:(?:equine|humanlike|human|root-like|insectoid|mechanical)\s+)?(?:arms|legs|tentacles|wings)\b/gi)||[]];
            return [profile.fields?.height,profile.fields?.bodyType,...new Set(build),...surface,...silhouette,'face and identifying features out of frame'].filter(Boolean).join(', ');
        }
        // Canonical appearance is already bounded by its normalizer. Cutting the
        // flattened string can remove later face/hair traits or canonical height.
        return renderDatingIdentityAnchor(profile, clothing);
    };
    const setting=profile.visualSetting?'Setting — '+profile.visualSetting:'';
    if (!visual)
        return withoutRegions([setting,...ids.map((id,i)=>`${id==='self'||/^(person|friend|adult|human|npc)$/i.test(profile.person?.entities.find(e=>e.id===id)?.kind||'')?'Person':'Subject'} ${String.fromCharCode(65+i)} — ${[identity(id),generalFacts(id),position].filter(Boolean).join(', ')}`),fallback].filter(Boolean).join('\n'));
    const structured=visual.renderSource==='structured'&&completeStructuredScene(visual);
    const subjects = visual.subjects.filter(s => s.id === 'self' || profile.person?.entities.some(e => e.id === s.id));
    if (!visual.subjects.length)
        return withoutRegions([setting,structured?'':visual.description || fallback, visual.camera, visual.interaction, visual.spatial, visual.environment, visual.lighting].filter(Boolean).join('\n'));
    if (!subjects.length)
        return compileDatingVisual(profile, undefined, fallback, ids, position);
    const people = subjects.filter(s => s.id === 'self' || /^(person|friend|adult|human|npc)$/i.test(profile.person?.entities.find(e => e.id === s.id)?.kind || '')).length;
    const lines = [setting,people ? `${people} ${people === 1 ? 'person' : 'people'}` : '',
        ...subjects.map((s, i) => `${s.id === 'self' || /^(person|friend|adult|human|npc)$/i.test(profile.person?.entities.find(e => e.id === s.id)?.kind || '') ? 'Person' : 'Subject'} ${String.fromCharCode(65 + i)} — ${[s.position, identity(s.id, !!s.clothing || !!(visual.description || fallback)), s.clothing, s.expression, s.pose, s.action, s.gaze, generalFacts(s.id)].filter(Boolean).join(', ')}`),
        visual.camera, structured?'':visual.description || fallback, visual.interaction, structured?'':visual.spatial, visual.environment, visual.lighting];
    return withoutRegions([...new Set(lines.filter(Boolean))].join('\n'));
}

/** Camera clips scene input at its native bound. Reject before a paid render, not after losing identity. */
export function checkedDatingPhotoPrompt(prompt: string): string {
    if (!prompt.trim() || prompt.length > AUTHORING_LIMITS.compiledPhoto)
        throw new Error(`The complete photo scene exceeds the native ${AUTHORING_LIMITS.compiledPhoto}-character Camera limit. Shorten the scene description before rendering; saved identity was not changed.`);
    return prompt;
}

/** All facts used by the renderer, including companions, participate in stale-result checks. */
export function datingVisualIdentitySnapshot(profile:VisualIdentity):string {
 return JSON.stringify([profile.visualSetting,profile.age,profile.anonymous,profile.fields?.gender,profile.fields?.species,profile.fields?.bodyType,profile.fields?.height,profile.person?.appearance,profile.person?.anatomy,profile.phoneProfile.appearance,profile.person?.entities]);
}

/** A render projection changes ordering, never invents or clips canonical traits. */
export function renderDatingIdentityAnchor(profile:VisualIdentity, omitUsualStyle=false):string {
 const a=profile.person?.appearance;
 if(!a)return withoutRegions(datingAppearance(profile,omitUsualStyle));
 const order=['skin','face','eyes','hair','distinctive','build','height','tags','usualStyle'];
 const keys=[...order,...Object.keys(a).filter(k=>!order.includes(k)).sort()];
 const parts=[...(profile.person?.anatomy?Object.entries(profile.person.anatomy).filter(([k,v])=>k!=='version'&&v).map(([,v])=>String(v)):[]),...keys.filter(k=>!(omitUsualStyle&&k==='usualStyle')).map(k=>a[k]).filter(Boolean)];
 if(profile.fields?.height)parts.push(profile.fields.height);
 return withoutRegions([...new Set(parts.flatMap(v=>v.split(',').map(s=>s.trim())).filter(Boolean))].join(', '));
}
/** Complete and bounded structured coverage is required before description removal.
 * Oversized legacy summaries keep the public scene fallback rather than losing facts. */
export function completeStructuredScene(v:any):boolean {
 const bounded=(s:unknown,n:number)=>typeof s==='string'&&!!s.trim()&&s.length<=n;
 return Array.isArray(v?.subjects)&&v.subjects.length>0&&v.subjects.length<=8&&bounded(v.camera,500)&&bounded(v.environment,500)&&bounded(v.lighting,500)&&(!v.interaction||bounded(v.interaction,500))&&(!v.spatial||bounded(v.spatial,500))
  &&(v.subjects.length<2||bounded(v.spatial,500))
  &&new Set(v.subjects.map((s:any)=>s?.id)).size===v.subjects.length
  &&v.subjects.every((s:any)=>typeof s?.id==='string'&&/^[a-z][a-z0-9_-]{0,39}$/.test(s.id)&&(!s.action||bounded(s.action,240))&&bounded(s.position,120)&&bounded(s.clothing,240)&&bounded(s.expression,160)&&bounded(s.pose,160)&&bounded(s.gaze,120));
}
export const DATING_VISUAL_COMPILER='visual-2';
export type DatingImageDialect='auto'|'generic'|'anima';
/** Anima understands prose: preserve subject binding instead of guessing booru tags. */
export function datingImageDialect(choice:unknown,model:string):'generic'|'anima' {
 return choice==='anima'||choice!=='generic'&&/(?:^|[\s/_.-])anima(?:$|[\s/_.-])/i.test(model)?'anima':'generic';
}
export function formatDatingImageScene(scene:string,dialect:'generic'|'anima'):string {
 if(dialect!=='anima')return withoutRegions(scene);
 return withoutRegions(scene).split('\n').filter(Boolean).map(line=>/[.!?]$/.test(line.trim())?line.trim():line.trim()+'.').join('\n');
}
export interface DatingRenderInfo { compiler:string; dialect:'generic'|'anima'; sceneCharacters:number; promptCharacters:number; negativePrompt:string; }
export function normalizeDatingRenderInfo(v:any):DatingRenderInfo|undefined {
 return v&&v.compiler===DATING_VISUAL_COMPILER&&['generic','anima'].includes(v.dialect)&&Number.isInteger(v.sceneCharacters)&&v.sceneCharacters>=0&&v.sceneCharacters<=12000&&Number.isInteger(v.promptCharacters)&&v.promptCharacters>=0&&v.promptCharacters<=128000&&typeof v.negativePrompt==='string'&&v.negativePrompt.length<=12000
 ?{compiler:v.compiler,dialect:v.dialect,sceneCharacters:v.sceneCharacters,promptCharacters:v.promptCharacters,negativePrompt:v.negativePrompt}:undefined;
}
/** Compact report staleness hint only; exact snapshots still authorize commits. */
export function datingVisualIdentityKey(profile:VisualIdentity):string {let a=2166136261,b=2246822507;for(const c of datingVisualIdentitySnapshot(profile)){a=Math.imul(a^c.charCodeAt(0),16777619)>>>0;b=Math.imul(b^c.charCodeAt(0),3266489909)>>>0;}return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');}
