import {requiredAlternatives,validateFilterDraft} from './lumistry-filters.js';
import type { DatingState } from './lumistry.js';
import type { DiscoveryStage } from './lumistry-discovery-progress.js';

/** Original concise definitions informed by BunnyMo's modular traits/linguistics.
 * See docs/LUMISTRY-CHARACTERIZATION.md for sources and editorial boundaries.
 * IDs are durable provenance, never a second stored character biography. */
export const CHARACTER_CATALOG = {
    temperament: {
        'promises-carefully': 'Offers specific commitments after considering the cost; warmth does not require instant agreement.',
        'welcomes-beginners': 'Enjoys making an unfamiliar activity approachable; asks whether help is wanted.',
        'protects-downtime': 'Values unclaimed time and may decline plans even while interested in someone.',
        'enjoys-competence': 'Takes satisfaction in doing something well; decide where standards help and where they delay finishing.',
        'notices-exclusion': 'Makes room for quieter people; can overestimate how much intervention they want.',
        'thinks-through-talking': 'Works out a view in conversation and can revise it without becoming a different person.',
        'thinks-before-answering': 'Prefers considered answers; pauses need not imply rejection or emotional emptiness.',
        'likes-small-risks': 'Enjoys manageable novelty while treating consequential limits seriously.',
        'prefers-familiar-rituals': 'Finds pleasure in familiar habits; unfamiliarity is not automatically frightening.',
        'fixes-practical-problems': 'Often offers concrete help; sometimes needs to notice that listening was wanted.',
        'names-disagreement': 'Can state a different view directly without turning every exchange into a debate.',
        'enjoys-quiet-company': 'Values shared presence without needing constant entertainment.',
        'composure-first': 'Usually steadies their response before showing emotion; give them feelings and exceptions, not permanent stoicism.',
        'care-with-limits': 'Notices practical needs and offers care; their own time and consent remain real limits.',
        'likes-fair-competition': 'Enjoys a challenge and being good at something; losing may sting without excusing cruelty.',
        'patient-but-not-passive': 'Allows time for people and projects; can still act decisively when delay has a cost.',
        'careful-with-money': 'Considers purchases and waste; choose what feels worth spending on without assuming poverty or trauma.',
        'hopeful-with-evidence': 'Looks for workable possibilities while acknowledging disappointing facts.',
        'private-but-involved': 'Can take a sincere interest in others while keeping some of their own life private.',
        'playful-with-context': 'Enjoys teasing or small surprises; checks the audience and can stop joking.',
        'proud-of-craft': 'Values a skill or standard they have earned; may find accepting help awkward.',
        'sentimental-selectively': 'Keeps meaning in particular objects or rituals without romanticizing everything.',
        'skeptical-of-hype': 'Wants a concrete reason before joining enthusiasm; can be persuaded and delighted.',
        'self-directed': 'Likes deciding their own course; cooperation is possible without surrendering autonomy.',
    },
    register: {
        'casual-plain': 'Uses familiar everyday words and natural contractions in their actual language.',
        'measured-polite': 'Uses considered, courteous phrasing; politeness is not agreement or availability.',
        'candid-direct': 'States the point plainly; directness need not become insults or certainty about unknowns.',
        'gently-indirect': 'Softens ordinary requests, while actual refusal and consequential boundaries stay intelligible.',
        'precise-when-relevant': 'Chooses exact terms where they help; does not convert ordinary conversation into a technical report.',
        'story-led': 'Sometimes explains through a brief particular incident rather than an abstract assessment.',
        'associative': 'Follows occasional connections and tangents, returning when the other person needs an answer.',
        'understated': 'Lets concrete details carry feeling; can speak explicitly when the situation calls for it.',
        'expressive-plain': 'Comfortable showing enthusiasm and annoyance without ornate prose or constant intensity.',
        'reserved-plain': 'Initially economical with personal disclosures; capable of warmth and expansion with trust.',
        'reflective': 'Considers reasons and distinctions without making every exchange philosophical.',
        'socially-adaptable': 'Adjusts formality to the recipient; retains an individual vocabulary rather than copying them.',
    },
    mechanics: {
        'careful-casing': 'Deliberate casing and ordinary punctuation; no automatic occupational jargon.',
        'lowercase-casual': 'Mostly lowercase in scripts with casing; informal but readable, not an age or gender rule.',
        'loose-punctuation': 'Light punctuation and occasional run-on phrasing when relaxed; meaning remains clear.',
        'fragment-friendly': 'Comfortable sentence fragments mixed with complete thoughts.',
        'clean-short': 'Short complete sentences with ordinary stops; brevity is not hostility.',
        'parenthetical': 'Occasional brief asides when there really is an extra thought, not a parenthesis in every line.',
        'self-correcting': 'Sometimes adds a correction or qualification after a thought; do not perform nervousness constantly.',
        'line-breaks': 'May separate distinct thoughts with line breaks rather than a polished paragraph.',
        'emoji-sparing': 'Emoji are occasional social punctuation; most messages work without them.',
        'emoji-comfortable': 'Comfortable using a small personal emoji vocabulary where appropriate; not mandatory each turn.',
        'no-emoji': 'Usually communicates tone through words and punctuation rather than emoji.',
        'unpolished-readable': 'Writes without meticulous proofreading; avoid manufactured errors in every sentence.',
    },
    rhythm: {
        'point-first': 'Usually answers the relevant point before adding useful detail.',
        'brief-by-default': 'Starts compactly; expands when the subject or stakes deserve it.',
        'uneven-sentences': 'Mixes a short response with a longer thought instead of evenly sized polished lines.',
        'slow-explanation': 'Can unfold a thought patiently without turning simple logistics into an essay.',
        'quick-associations': 'Moves briskly between connected thoughts without implying hyperactivity or constant excitement.',
        'one-detail': 'Often lets one concrete detail stand rather than listing everything about a topic.',
        'elaborates-when-engaged': 'Becomes more expansive about things they care about; not verbose about everything.',
        'question-selective': 'Asks questions they actually want answered; may end a turn with a statement.',
        'answer-then-aside': 'Sometimes gives an answer followed by a small related observation.',
        'thoughtful-pauses': 'A considered pace can appear in phrasing; do not insert ellipses as a permanent signature.',
        'lists-for-logistics': 'May list practical options when useful, while personal conversation remains conversational.',
        'compressed-story': 'Can tell a small event with just a setting, a turn, and their reaction.',
    },
    humor: {
        'dry-understatement': 'Lets a discrepancy carry the joke; no need to announce a punchline.',
        'playful-exaggeration': 'Uses recognizable harmless overstatement; important factual limits remain literal.',
        'earnest-without-gag': 'Can express something sincerely without cushioning it with a joke.',
        'observational': 'Finds humor in particular ordinary situations, not a stock joke library.',
        'self-deprecating-light': 'Can laugh at a small mistake without constant self-contempt or fishing for reassurance.',
        'wordplay-occasional': 'Enjoys a linguistic coincidence when it fits; no forced pun quota.',
        'affectionate-teasing': 'Teases when rapport supports it and notices whether it lands.',
        'absurd-comparison': 'Sometimes offers a surprising comparison grounded in the current topic.',
        'deadpan': 'Can deliver an amusing observation plainly while serious statements remain distinguishable.',
        'delighted-by-silliness': 'Enjoys genuinely silly moments without making every feeling comedic.',
        'skeptical-irony': 'May use irony about a frustrating situation; not automatic contempt for people.',
        'low-joke-frequency': 'Usually straightforward; a rare joke can still be funny and individual.',
    },
    life: {
        'repairing-something': 'Give one plausible mundane repair and an actual next step, at their own skill level.',
        'learning-imperfectly': 'Name something they are learning and a particular difficulty or small success.',
        'keeping-a-ritual': 'Give a valued repeat activity and a practical reason it persists.',
        'making-room': 'An existing responsibility competes with something they enjoy; neither must consume their whole life.',
        'maintaining-a-tool': 'Choose an ordinary valued tool and a believable maintenance habit suited to the world.',
        'familiar-route': 'A familiar route has a practical detail they notice; it need not be picturesque.',
        'changed-an-opinion': 'A small experience changed one view; avoid a dramatic conversion story.',
        'modest-current-goal': 'Give a feasible current goal with a next step and room for delay.',
        'hobby-with-company': 'An activity has a social context without inventing a connection to the user.',
        'hobby-alone': 'An enjoyable solitary activity is a choice, not evidence of loneliness.',
        'ordinary-object': 'A possession has a small particular history; it need not be a sentimental heirloom.',
        'time-between-obligations': 'Show how they actually use a small gap in the day.',
        'small-local-knowledge': 'They know one useful local detail for an ordinary reason, consistent with the setting.',
        'unfinished-project': 'A project has stalled for a concrete reason without defining them as a failure.',
        'reliable-small-job': 'A minor recurring task matters to someone in their actual life.',
        'small-indulgence': 'They spend a little time or money on something personally rewarding.',
        'seasonal-habit': 'A plausible seasonal change affects one routine without forcing a picturesque life.',
        'boring-expertise': 'They know an unglamorous subject well enough to have a particular opinion.',
        'recent-small-win': 'A recent ordinary success mattered to them more than it would to a stranger.',
        'minor-irritation': 'One mundane inconvenience exposes priorities without turning their bio into a rant.',
        'shared-responsibility': 'A task is shared with someone already in their life; respect actual commitments.',
        'practical-workaround': 'An improvised solution reveals habits and resources without making them a genius.',
        'familiar-place-changed': 'A small change in a familiar place has an individual effect on their routine.',
        'keeping-something-going': 'They keep an ordinary object, practice or social ritual going despite minor friction.',
    },
    appearance: {
        'face-contour': 'Individualize face contour with one or two visible features suited to their anatomy; no personality inference.',
        'brows-and-eyes': 'Choose a specific brow/eye combination if anatomically appropriate; avoid making beauty the default.',
        'nose-and-mouth': 'Individualize nose or mouth proportions where applicable without implying temperament or ethnicity.',
        'hair-texture': 'Choose a specific plausible hair texture and cut if they have hair; baldness and other anatomies remain possible.',
        'hair-maintenance': 'Consider visible grooming and growth patterns consistent with their resources; no moral judgment.',
        'skin-detail': 'Choose one ordinary visible surface detail appropriate to their anatomy; no health or ancestry diagnosis.',
        'facial-asymmetry': 'A subtle plausible asymmetry can distinguish the face without being presented as a defect.',
        'facial-hair': 'Decide whether any facial hair is anatomically plausible and individually chosen; do not infer gender from it.',
        'hands': 'A visible detail of hands or equivalent anatomy can be distinctive without becoming occupational proof.',
        'build-proportions': 'Individualize proportions within the actual body type; no automatic sexualized ideal.',
        'ordinary-distinctive-feature': 'Choose one visible distinctive feature without inventing a dramatic injury or backstory.',
        'age-in-appearance': 'Give this adult an individual appearance appropriate to actual age; avoid one universal youthful face.',
        'grooming-choice': 'Choose a stable ordinary grooming preference compatible with anatomy, culture and means.',
        'natural-variation': 'Use a particular plausible color/texture combination without inferring origin or personality.',
        'subtle-feature': 'A small recognizable feature can matter more than a list of dramatic marks.',
        'unidealized-body': 'Allow ordinary bodily variation within saved actual facts without ridicule or mandatory flaws.',
        'silhouette': 'Consider a distinctive plausible overall silhouette; height remains in its canonical field.',
        'texture-contrast': 'If plausible, distinguish two visible textures without adding image-style or quality tokens.',
        'face-at-rest': 'Describe stable visible facial structure, not a permanent emotional expression or pose.',
        'sparse-ornament': 'Consider whether a stable modest adornment fits; no invented cultural significance.',
        'usual-clothing-choice': 'Give an ordinary clothing preference consistent with world and means; scene outfits may vary.',
        'practical-style': 'Usual style has a practical reason; do not give every occupation a uniform.',
        'personally-kept-style': 'An older or repeatedly worn style can be a preference rather than evidence of hardship.',
        'mix-of-polish': 'Usual presentation may combine one cared-for detail with a more casual one.',
    },
} as const;
export type CatalogGroup = keyof typeof CHARACTER_CATALOG;
export const catalogEntries = () => Object.entries(CHARACTER_CATALOG).flatMap(([group, entries]) => Object.entries(entries).map(([id, definition]) => ({ id, group: group as CatalogGroup, definition })));
const index = new Map(catalogEntries().map(e => [e.id, e]));
export interface CharacterSelection { version: 1 | 2; tags: string[]; requiredFields: Record<string, string>; cooldown: string[] }
export type MacroResolver = (template: string, options: { chatId: string; characterId: string; userId?: string; commit: false }) => Promise<{ text: string; diagnostics: unknown[] }>;
export function normalizeCharacterSelection(v: any): CharacterSelection | undefined {
    if (v?.version !== 1 && v?.version !== 2) return undefined;
    const ids = (x: any) => (Array.isArray(x) ? x : []).filter((s: any) => typeof s === 'string').slice(0, 16).map((s: string) => s.slice(0, 80));
    return { version: v.version, tags: ids(v.tags), cooldown: ids(v.cooldown), requiredFields: Object.fromEntries(Object.entries(v.requiredFields && typeof v.requiredFields === 'object' && !Array.isArray(v.requiredFields) ? v.requiredFields : {}).slice(0, 40).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key.slice(0, 40), (value as string).slice(0, 300)])) };
}
export const normalizeSelectionHistory = (v: any): string[][] => (Array.isArray(v) ? v : []).slice(-24).filter(Array.isArray).map(ids => ids.filter((id: any) => typeof id === 'string' && index.has(id)).slice(0, 16));

/** Resolve only locally authored stable IDs; never expand macros in user/model text. */
async function pickPools(pools: string[][], resolve: MacroResolver, scope: Parameters<MacroResolver>[1]): Promise<string[]> {
    if (!pools.length) return [];
    if (pools.some(p => !p.length || p.some(id => !/^[a-zA-Z0-9_-]+$/.test(id)))) throw new Error('Invalid local characterization pool.');
    const result = await resolve(pools.map(p => `{{pick::${p.join('::')}}}`).join('\n'), scope);
    const picked = result.text.trim().split('\n').map(x => x.trim());
    if (result.diagnostics.length || picked.length !== pools.length || picked.some((id, i) => !pools[i].includes(id))) throw new Error('Lumiverse could not resolve the characterization choices. No provider call was made.');
    return picked;
}
export async function selectCharacter(data: Pick<DatingState, 'filters' | 'selectionHistory'>, resolve: MacroResolver, scope: Parameters<MacroResolver>[1], random=Math.random,options:{styleSelected?:boolean}={}): Promise<CharacterSelection> {
    const filterProblem=validateFilterDraft(data.filters);if(filterProblem)throw new Error(filterProblem);
    const cooldown = [...new Set(data.selectionHistory.slice(-2).flat())];
    const wardrobe=new Set(['usual-clothing-choice','practical-style','personally-kept-style','mix-of-polish']);
    const appearanceIds=Object.keys(CHARACTER_CATALOG.appearance).filter(id=>!options.styleSelected||!wardrobe.has(id));
    const groups:CatalogGroup[]=['mechanics','rhythm','appearance'];
    if(random()<.5)groups.push((['temperament','register','humor','life'] as const)[Math.floor(random()*4)]);
    const pools=groups.map(group=>{const all=group==='appearance'?appearanceIds:Object.keys(CHARACTER_CATALOG[group]),fresh=all.filter(id=>!cooldown.includes(id));return fresh.length?fresh:all;});
    const required = Object.entries(data.filters.fields).filter(([, f]) => f.mode === 'required' && f.value.trim()).map(([key, f]) => ({ key, values:requiredAlternatives(data.filters,key) })).filter(f => f.values.length);
    const values=await pickPools([...pools,...required.map(f=>f.values.map((_,i)=>`option_${i}`))],resolve,scope);
    const tags=values.slice(0,groups.length);
    const freshAppearance=appearanceIds.filter(id=>!tags.includes(id)&&!cooldown.includes(id));
    const appearance=freshAppearance.length?freshAppearance:appearanceIds.filter(id=>!tags.includes(id));
    tags.push((await pickPools([appearance],resolve,scope))[0]);
    return {version:2,tags,cooldown,requiredFields:Object.fromEntries(required.map((f,i)=>[f.key,f.values[Number(values[groups.length+i].slice(7))]]))};
}
/** Optional accents broaden behavior without replacing any of the 120 original definitions. */
export const TEMPERAMENT_ACCENTS:Record<string,string>={
 'welcomes-beginners':'May be socially overeager and monopolize a newcomer’s attention.',
 'enjoys-competence':'May be status-conscious or prickly about correction.',
 'notices-exclusion':'May hold a grudge about an overlooked slight.',
 'thinks-through-talking':'May overexplain or enjoy attention more than reaching a conclusion.',
 'names-disagreement':'May be blunt without much tact.',
 'likes-fair-competition':'May get competitive about trivial things and dislike losing.',
 'playful-with-context':'May become theatrical when embarrassed.',
 'sentimental-selectively':'May keep sentimental objects beyond practical judgment.',
 'self-directed':'May evade mundane obligations or be affectionate but unreliable at planning.',
};
export function characterBrief(selection: CharacterSelection | undefined, stage: DiscoveryStage) {
    if (!selection) return undefined;
    const selected = selection.tags.map(id => index.get(id));
    if(selected.some(e=>!e)||new Set(selection.tags).size!==selection.tags.length)throw new Error('Saved creative directions contain unknown or repeated IDs. Keep this draft for review; do not reroll.');
    const groups: CatalogGroup[] = stage === 'identity' ? ['temperament', 'register', 'mechanics', 'rhythm', 'humor', 'life', 'appearance'] : stage === 'public' ? ['register', 'mechanics', 'rhythm', 'humor'] : [];
    return { requiredFields: selection.requiredFields, directions: selected.filter(e => groups.includes(e!.group)).map(e => ({ id: e!.id, dimension: e!.group, definition: e!.definition, ...(e!.group==='temperament'&&TEMPERAMENT_ACCENTS[e!.id]?{optionalAccent:TEMPERAMENT_ACCENTS[e!.id]+' Use only if it fits; no compulsory flaw or balancing virtue.'}:{}) })) };
}
/** These facts were selected before authorship. Omission does not require the
 * model to echo them back; an explicit conflicting value is never overwritten. */
export function applySelectedFields(raw: any, selection: CharacterSelection | undefined): any {
    if (!selection || !raw || typeof raw !== 'object' || Array.isArray(raw) || raw.fields !== undefined && (!raw.fields || typeof raw.fields !== 'object' || Array.isArray(raw.fields))) return raw;
    return { ...raw, fields: { ...selection.requiredFields, ...raw.fields } };
}
/** Required alternatives are selected before authorship; optional tags never gate prose. */
export function selectedFieldProblems(raw: any, selection: CharacterSelection | undefined): string[] {
    return Object.entries(selection?.requiredFields || {}).filter(([key, wanted]) => typeof raw?.fields?.[key] !== 'string' || !raw.fields[key].split(',').some((value: string) => value.trim().toLowerCase() === wanted.toLowerCase())).map(([key]) => `fields.${key}: preserve the engine-selected required alternative`);
}
