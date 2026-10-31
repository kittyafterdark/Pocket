import {speciesAnatomyGuidance} from './lumistry-species.js';
import {CUSTOM_SPECIES_GUIDANCE} from './lumistry-species-discovery.js';
import {appearanceGuidance} from './lumistry-appearance.js';
import {NAME_CRAFT} from './lumistry-craft.js';
import {WRITING_FIELDS} from './lumistry-authoring-contract.js';
import type {CandidatePlan} from './lumistry-population.js';
export const DYNAMIC_FIELD_VERSION='dynamic-fields-1';
export interface DossierField {key:string;label:string;aliases:readonly string[];topic:string;path?:string;guidance:string;examples:readonly string[];visibility:'private'|'public';target:number;accepted:number;applicable:(plan?:CandidatePlan)=>boolean;}
const source=new Map<string,string>(Object.entries({
  "Name and dating alias": "Give a plausible full or primary name and the alias strangers see; distinguish real name from anonymous public alias if privacy requires it. Example of the expected level or style (do not copy literal facts): Nadia Ilyan; on the app: N.",
  "Gender and pronouns": "State the person’s actual identity and ordinary pronouns when meaningful. Do not infer their gender from occupation, appearance or trope. Example of the expected level or style (do not copy literal facts): Woman; she/her.",
  "Species or setting-specific physiology": "Use the world’s established possibilities and physical rules. Human is fine; do not introduce fantasy or cybernetic features if the world does not support them. Example of the expected level or style (do not copy literal facts): Human; no augmentation.",
  "Occupation or role": "Describe what they actually do and its lived consequences, not just a filter category or prestigious title. Example of the expected level or style (do not copy literal facts): Repairs bicycles in a small cooperative shop; afternoon shifts.",
  "Residence and living circumstances": "Provide a plausible location within the setting and their everyday living arrangement if relevant, without inventing exact addresses or proximity contrary to known facts. Example of the expected level or style (do not copy literal facts): Rents a room above a bakery with two housemates.",
  "Height and build": "Actual height or relative size, body proportions and physical bearing. Keep separate from camera perspective or posed appearance. Example of the expected level or style (do not copy literal facts): 168 cm; compact, broad shoulders, strong hands.",
  "Hair": "Color, length, texture, cut, condition, usual arrangement, and distinctive features; no light-dependent color drift. Example of the expected level or style (do not copy literal facts): Dark brown, shoulder-length waves, often tied with a worn red band.",
  "Eyes": "Color, shape, resting expression, and genuinely unusual traits if established. Distinguish stable eye appearance from temporary emotion. Example of the expected level or style (do not copy literal facts): Brown, slightly hooded, quick to narrow when concentrating.",
  "Skin / fur / scales / surface": "Complexion or surface coloration, texture, natural marks or species-appropriate covering. Avoid inventing incompatible anatomy. Example of the expected level or style (do not copy literal facts): Pale olive skin with faint sun freckles across her nose.",
  "Facial features": "Face shape, brows, jaw, nose, cheeks, lips and recognizable resting expression. Prioritize reproducible visual anchors. Example of the expected level or style (do not copy literal facts): Soft square jaw, straight nose, heavy brows, crooked half smile.",
  "Clothing and personal style": "Typical palette, silhouette, practicality, materials and level of care; connect to world resources and actual preference. Example of the expected level or style (do not copy literal facts): Faded work jackets and tailored secondhand trousers; clean but visibly repaired.",
  "Core personality": "Explain how this person generally approaches life in 2–4 concise sentences. Show a recognizable orientation without reducing every reaction to one rule. Example of the expected level or style (do not copy literal facts): Practical in emergencies but indecisive when someone asks what she wants.",
  "Independent goal": "A current goal that makes sense whether or not the player ever matches them; include a plausible obstacle. Example of the expected level or style (do not copy literal facts): Open a repair class; has no affordable venue.",
  "Everyday rhythm": "Work, free time, household responsibilities, ordinary recurring activities; avoid a schedule written solely for dating access. Example of the expected level or style (do not copy literal facts): Late shift, meals with housemates, Sunday market trips.",
  "Likes, dislikes and minor pleasures": "Use memorable specific preferences, including ordinary nonsymbolic tastes and genuine irritants. Example of the expected level or style (do not copy literal facts): Likes little hand-painted signs; dislikes fluorescent lights.",
  "Current pressure": "A real tension with possible consequences, not a mandatory tragic backstory or plot hook. Example of the expected level or style (do not copy literal facts): Unexpected shop rent increase.",
  "Social circle and recurring subjects": "Only establish meaningful friends, family, pets or companions. Give each recurring photographed subject a stable relationship and appearance anchor. Example of the expected level or style (do not copy literal facts): Has a close older colleague; owns a white dog with one black ear.",
  "Initiative and independent decisions": "What they start, refuse, pursue or reconsider without being prompted by the player. Example of the expected level or style (do not copy literal facts): May invite a friend to help with the workshop, or decline an inconvenient date.",
  "Self-understanding and blind spots": "Distinguish what they believe about themselves from observable evidence; leave room for genuine uncertainty. Example of the expected level or style (do not copy literal facts): Calls herself easygoing, though she plans every unfamiliar outing.",
  "Actual orientation and attraction": "Give established adult romantic/sexual attraction patterns in nuanced terms; no assumptions from the user’s filters or desired outcomes. Example of the expected level or style (do not copy literal facts): Bisexual; tends to notice curious, self-directed people.",
  "Existing relationship and commitments": "Record actual partners, exclusivity, obligations, or clearly stated none. Unknown is not none; do not fabricate a partner to fill space. Example of the expected level or style (do not copy literal facts): Not partnered; still shares financial responsibilities with a former housemate.",
  "Reason for joining and intentions": "Why this person joined the dating service at this point in life, and what kind of connection they do or do not seek. Example of the expected level or style (do not copy literal facts): Wants to meet someone outside her work circle; unsure about serious commitment.",
  "Personal comfort and consent": "Describe the person’s own communication, comfort, autonomy and refusal preferences if relevant; never treat compatibility or prior affection as blanket consent. Example of the expected level or style (do not copy literal facts): Prefers direct check-ins before changes in physical closeness.",
  "Availability and app habits": "Describe genuine routine, contact habits and reasons for absence. Never guess numeric reply delays or quiet hours from vague prose. Example of the expected level or style (do not copy literal facts): Usually checks messages after closing the shop.",
  "Spoken voice and register": "Vocabulary, cadence, directness, accent or language influences only if world-supported; avoid turning a trait into mandatory slang. Example of the expected level or style (do not copy literal facts): Low, measured voice; speaks quickly when correcting a mechanical detail.",
  "Written mechanics": "Typical capitalization, punctuation, spelling, emoji, editing habits and intentional typos; do not assign behavior by age or gender. Example of the expected level or style (do not copy literal facts): Uses full stops in longer messages, abbreviates short replies.",
  "Sentence rhythm and conversational effort": "Typical sentence lengths, fragments, question habits, response depth and how these change with situation. Example of the expected level or style (do not copy literal facts): One-line answers when tired; animated paragraphs on music.",
  "Voice samples": "Write two ORIGINAL brief lines: one dating-profile line and one text to a familiar person. Illustrative only, not real saved communication. Example of the expected level or style (do not copy literal facts): Profile: “one plant still alive. ask me about it.” Friend: “fixed the chain. mostly.”",
  "Profile motivation and curation": "How the person wants strangers to see them, what they are willing to show, what they omit, and how hard they try. Example of the expected level or style (do not copy literal facts): Chooses practical photos; avoids discussing money worries.",
  "Photo-selection habits": "Kinds of pictures they keep or post, how polished/repetitive/group-heavy they are, and their motivation; do not precompose actual scenes here. Example of the expected level or style (do not copy literal facts): Mostly friend-taken weekend photos; one mirror selfie she secretly likes."
}));
const overrides:Record<string,string>={
 'Name and dating alias':NAME_CRAFT,
 'Actual orientation and attraction':'State this person’s actual attraction or lack of attraction, including nuance when relevant. Give a fact about them, not advice about consent or the user. Preserve locked filters.',
 'Existing relationship and commitments':'State actual current partners, exclusivity or other commitments, or explicitly none. Do not invent a partner to add drama; preserve locked facts.',
 'Reason for joining and intentions':'Give their individual reason for using the app and the kind of connection they presently want, consistent with the saved relationship selection.',
 'Skin / fur / scales / surface':'Describe actual visible color and texture compatible with their anatomy. Do not answer with an instruction to follow anatomy.',
 'Core personality':'Show how this person spends attention, chooses company and handles another person’s preference. A concrete habit can clarify the pattern. Warmth, vanity, impatience, awkwardness, generosity, abrasiveness and uncomplicated contentment are all possible; no compulsory balancing flaw.',
 'Spoken voice and register':'Describe vocabulary and conversational purpose: what they answer readily, evade, notice or assume others care about. Include an audience shift only when useful; avoid a fixed script.',
 'Sentence rhythm and conversational effort':'Describe sentence rhythm and where they spend effort: a practical question, praise, inconvenience or interest may receive different attention.',
 'Voice samples':'Give two brief English diagnostic samples: a profile line and a text to a familiar person or new match. Let attention and social purpose affect the words, not only punctuation. These are samples, never sent messages.',
};
const guidanceFor=(label:string)=>overrides[label]||(source.get(label)||'Describe compatible individual facts.').replace(/ Example of the expected level or style[\s\S]*$/,'');
/** Exact known instruction-shaped examples are not fictional facts. No general prose/psychology judge. */
const nonanswers=new Set([
 'Their own established orientation and individual attractions.',
 'Romantic and sexual preferences may differ; keep both intelligible.',
 'Attraction remains personal and never a promise to this user.',
 'Preserve the exact compatible commitment facts being authored.',
 'No invented partner merely to create a complication.',
 'Surface texture follows the accepted anatomy.',
 'A concrete individual motive fitting the selected relationship category.',
].map(s=>s.toLowerCase().replace(/[.!]+$/,'')));
export const isInstructionNonanswer=(text:string)=>nonanswers.has(text.trim().toLowerCase().replace(/[.!]+$/,''));
export const AUTHORING_LABEL_ALIASES = new Map(Object.entries({
 'spoken voice':'Spoken voice and register','voice and register':'Spoken voice and register',
 'sentence rhythm':'Sentence rhythm and conversational effort','conversational effort':'Sentence rhythm and conversational effort',
 'social circle':'Social circle and recurring subjects','reason for joining':'Reason for joining and intentions',
 'profile motivation':'Profile motivation and curation','availability':'Availability and app habits',
 'living circumstances':'Residence and living circumstances','residence':'Residence and living circumstances',
 'personal style':'Clothing and personal style','clothing':'Clothing and personal style',
 'self-understanding':'Self-understanding and blind spots','initiative':'Initiative and independent decisions',
 'likes and dislikes':'Likes, dislikes and minor pleasures','photo habits':'Photo-selection habits',
 'skin':'Skin / fur / scales / surface','skin and surface':'Skin / fur / scales / surface',
 'skin / fur / scales / scales':'Skin / fur / scales / surface',
 'photo reference':'Record reference',
}));

const field=(label:string,topic:string,path:string|undefined,examples:readonly string[],applicable:(p?:CandidatePlan)=>boolean=()=>true):DossierField=>({key:label.toLowerCase().replace(/[^a-z]+/g,'_'),label,aliases:[...AUTHORING_LABEL_ALIASES].filter(([,canonical])=>canonical===label).map(([alias])=>alias),topic,path,guidance:guidanceFor(label),examples,visibility:'private',target:path?.startsWith('privateFields.')?WRITING_FIELDS.privateText.target:WRITING_FIELDS.nativeText.target,accepted:path?.startsWith('privateFields.')?WRITING_FIELDS.privateText.accepted:WRITING_FIELDS.nativeText.accepted,applicable});
/** Stable labels are shared with parser, canonical projections, missing-field checks and repairs.
 * Topic grouping reduces compulsory psychology while retaining explicit render/voice facts. */
export const DYNAMIC_DOSSIER_FIELDS:DossierField[]=[
 field('Name and dating alias','identity',undefined,['Nora Bennett; profile name: Nora.','Daniel Ortiz; profile name: Daniel.','Amina Hassan; profile name: Amina.']),
 field('Gender and pronouns','identity',undefined,['Woman; she/her.','Man; he/him.','Nonbinary; they/them.']),
 field('Species or setting-specific physiology','anatomy','person.appearance.tags',['Human; no augmentation.','Human; ordinary anatomy.','Human; a healed scar across the left palm.'],p=>!p||!!p.selectionAudit.manualSpecies||!!p.creativeSpecies||!!p.species||['fantasy','cyberpunk','spacefaring','custom'].includes(p.world.kind)),
 field('Custom species proposal','anatomy',undefined,[],p=>p?.creativeSpecies?.status==='reserved'),
 field('Occupation or role','work','person.life.career',['Prepares clinic rooms; likes the orderly setup more than the small talk.','Checks warehouse stock and tolerates the early shift.','No current paid role; their ordinary routine remains substantial.']),
 field('Residence and living circumstances','household','privateFields.residence',['Shares a flat with one cousin.','Lives alone; no dramatic housing story.','Stays with family and contributes to everyday chores.']),
 field('Everyday rhythm','household','person.life.routine',['Works early, rests after lunch and does errands later.','An irregular week, with one quiet evening kept free.','Study, ordinary chores and time spent doing very little.']),
 field('Height and build','appearance','person.appearance.build',['170 cm; compact build and broad shoulders.','183 cm; narrow frame, slightly rounded posture.','162 cm; sturdy legs and an ordinary soft middle.']),
 field('Hair','appearance','person.appearance.hair',['Short dark curls, uneven around the ears.','Straight silver hair clipped above the shoulders.','A closely shaved scalp; ordinary visible growth.']),
 field('Eyes','appearance','person.appearance.eyes',['Hooded hazel eyes.','Wide-set dark brown eyes with pale lashes.','Small gray eyes, usually narrowed in concentration.']),
 field('Skin / fur / scales / surface','appearance','person.appearance.skin',['Brown skin with light freckling on the shoulders.','Pale skin, ruddy around the cheeks.','Olive skin, with pale freckles across the nose.']),
 field('Facial features','appearance','person.appearance.face',['Square chin, straight nose and heavy brows.','Long face, broad nose and a slightly uneven smile.','Round cheeks, a short jaw and deep-set eyes.']),
 field('Clothing and personal style','appearance','person.appearance.usualStyle',['Plain shirts with one well-kept jacket.','Loose patterned tops and worn practical shoes.','Careful grooming with otherwise casual clothes.']),
 field('Style across occasions','appearance','person.presentation.styleAcrossOccasions',['A neat outer layer for evenings; practical work clothes stay practical.'],()=>false),
 field('Core personality','temperament','phoneProfile.personality',['Friendly until asked to settle other people’s arguments.','Often impatient; perfectly content with an ordinary day.','Sociable, distractible and uninterested in constant self-improvement.']),
 field('Initiative and independent decisions','agency','privateFields.initiative',['Keeps one evening free and declines plans without a long explanation.','Asks for what they want but changes their mind sometimes.','Chooses their own company when nothing appealing is happening.']),
 field('Likes, dislikes and minor pleasures','leisure','privateFields.pleasures',['Watches football casually; dislikes sticky tables.','No dedicated hobby; enjoys music and a quiet meal.','Repairs small things when interested, without calling it a passion.']),
 field('Social circle and recurring subjects','social','person.life.socialCircle',['Calls an old friend monthly; no pet.','A wide social circle, with few confidants.','Mostly family and one nearby friend; neither needs a photo identity yet.']),
 field('Actual orientation and attraction','attraction','privateFields.orientation',['Bisexual; notices physical attraction quickly but takes longer to want a relationship.','Asexual and romantically attracted to women; enjoys affectionate companionship.','Attracted to men; a dry sense of humor tends to catch their attention.']),
 field('Existing relationship and commitments','commitments','privateFields.commitments',['Single; no current exclusive commitment.','Single after a long relationship; no current exclusivity agreement.','Not currently dating anyone; has made no romantic commitments.']),
 field('Reason for joining and intentions','intentions','privateFields.intentions',['Wants pleasant company without immediately planning a shared life.','Curious about dating but protective of existing routines.','Wants someone to share occasional evenings with, while keeping separate homes.']),
 field('Personal comfort and consent','limits','privateFields.boundaries',['Dislikes surprise visits and asks for direct plans.','Prefers discussing expectations before making promises.','Enjoys direct flirting; stops replying when someone repeatedly ignores a refusal.']),
 field('Spoken voice and register','voice','person.writingVoice.register',['Plain everyday words; occasional bluntness.','Warm and expansive with familiar people.','Reserved at first, with dry observations.']),
 field('Written mechanics','voice','person.writingVoice.mechanics',['Mostly lowercase, ordinary punctuation.','Careful capitalization; few emoji.','Fragments mixed with complete thoughts.']),
 field('Sentence rhythm and conversational effort','voice','person.writingVoice.rhythm',['Short answers unless interested in the topic.','One long thought followed by a brief aside.','Answers directly and asks only questions they mean.']),
 field('Voice samples','voice','person.writingVoice.sample',['Profile: “I keep forgetting the reusable bags.” Text: “Found them. In the car. Obviously.”','Profile: “Usually up early.” Text: “Tomorrow works. Please make it after breakfast.”','Profile: “I like a plan, sometimes.” Text: “No grand idea today. A walk?”']),
 field('Self-understanding and blind spots','self_image','privateFields.selfStory',['Thinks of herself as practical; others notice her impatience.','Fairly comfortable with who he is, without much analysis.','Has no elaborate account of their own contradictions.']),
 field('Profile motivation and curation','presentation','person.writingVoice.audience',['Wants an approachable profile without revealing a workplace.','Picks what feels flattering; does not analyze every choice.','Keeps the profile sparse but answers interested messages.']),
 field('Photo-selection habits','photos','person.presentation.photoBehavior',['Keeps an imperfect favorite from an ordinary outing.','Uses photos already on the phone.','Uses carefully posed pictures because choosing the angle feels reassuring.']),
 field('Availability and app habits','app','person.availability.routine',['Usually checks after work; often leaves casual messages until dinner.','Inconsistent app attention, independent of romantic interest.','Reads when free and sometimes forgets to respond.']),
 field('Current pressure','pressure','person.life.currentPressure',['A lease renewal makes next month’s schedule uncertain.','A small scheduling problem is annoying, not life-defining.','An overdue repair appointment keeps disrupting the week.'],p=>!!p&&p.life.pressure!=='none'),
 field('Independent goal','goal','privateFields.independentGoal',['Slowly learning a useful skill.','Considering a change without a fixed plan.','Wants to finish a short evening course, though enthusiasm comes and goes.'],p=>p?.life.configuration==='ambitious'),
 field('Known languages','language',undefined,['Knows German; all prose remains English.','Speaks English and conversational Spanish.','Speaks English; understands some French but rarely uses it.'],p=>!!p?.languageNote),
];
export const dynamicDossierFields=(p?:CandidatePlan)=>DYNAMIC_DOSSIER_FIELDS.filter(f=>f.applicable(p));
export const DOSSIER_EXAMPLE_LABELS=new Set(['Core personality','Actual orientation and attraction','Existing relationship and commitments','Reason for joining and intentions','Personal comfort and consent','Voice samples','Clothing and personal style']);
export function compileDossierFields(p?:CandidatePlan) {
 const variant=p?.exampleVariant||0;
 return dynamicDossierFields(p).map(f=>`${f.label}: [${f.label==='Custom species proposal'?CUSTOM_SPECIES_GUIDANCE:f.label==='Species or setting-specific physiology'&&p?.creativeSpecies?.status==='reserved'?'Name and describe the proposed adult sentient species, body plan, limbs and current form consistently with Custom species proposal. This is provisional, not established world canon.':f.label==='Species or setting-specific physiology'&&p?.species?'Describe this saved adult sentient species: '+p.species.label+'. '+speciesAnatomyGuidance(p.species):f.label==='Height and build'&&(p?.species?.id!=='human'&&p?.species||p?.creativeSpecies)?'Give concrete adult size and frame, limb configuration and locomotion for the established body plan. Do not substitute a two-legged human silhouette.':f.label==='Clothing and personal style'&&p?.worldGuide?['Use actual setting-compatible materials and garments.',p.worldGuide.attire,p.aesthetic?.guidance].filter(Boolean).join(' '):p?.species&&p.species.id!=='human'&&['Hair','Eyes','Skin / fur / scales / surface','Facial features'].includes(f.label)?'Describe the actual '+f.label+' for '+p.species.label+'. '+speciesAnatomyGuidance(p.species)+' If absent or nonhuman, state the concrete equivalent; never substitute ordinary human anatomy.':f.label==='Clothing and personal style'&&p?.aesthetic?p.aesthetic.guidance:appearanceGuidance(f.label,p?.appearance)||f.guidance}${DOSSIER_EXAMPLE_LABELS.has(f.label)&&!appearanceGuidance(f.label,p?.appearance)?' Example of specificity only, never copy: '+(f.label==='Clothing and personal style'&&p?.aesthetic?p.aesthetic.example:f.examples[(variant+DYNAMIC_DOSSIER_FIELDS.indexOf(f))%f.examples.length]):''}]`).join('\n')+(p?.aesthetic?'\nStyle across occasions: [Optional: one compatible occasion variation; work safety and weather take priority. Omit if unnecessary.]':'');
}


export function dossierRepairInstructions(labels:readonly string[]):string[] {
 return labels.flatMap(label=>{const field=DYNAMIC_DOSSIER_FIELDS.find(f=>f.label===label||f.aliases.includes(label.toLowerCase()));return field?[`${field.label}: at most ${field.target} characters; preserve accepted facts and use the supplied labeled format.`]:[];});
}
