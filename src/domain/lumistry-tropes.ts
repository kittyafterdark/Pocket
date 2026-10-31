import { TROPE_FAMILIES } from './lumistry-trope-families.js';
import { normalizeExperience, type LumistryExperience } from './lumistry-experience.js';
/** Presentation seeds for invented adults, never instructions to rewrite established people. */
export interface DatingTrope {
  version: 2
  family: string
  id: string
  label: string
  main: boolean
  condition: 'any' | 'cyberpunk' | 'small-town'
  profile: string
  photos: string
  behavior: string
  limits: string
  excludes: string[]
}
const trope = (id: string, label: string, profile: string, photos: string, behavior: string, limits = '', excludes: string[] = [], condition: DatingTrope['condition'] = 'any', main = false): DatingTrope => ({ version:2, family:TROPE_FAMILIES[id] || 'self-presentation', id, label, profile, photos, behavior, limits, excludes, condition, main })
export const DATING_TROPES: readonly DatingTrope[] = [
  trope('fish-photo', 'Fish Picture Guy', 'Proud fishing hobbyist or someone with few good pictures.', 'A concrete catch with consistent fish species and gear.', 'Actual fishing anecdotes and routines, not fish talk in every reply.', 'Gender is unconstrained.', ['tiny-fish', 'same-fish'], 'any', true),
  trope('group-photos', 'Only Group Photos', 'Their public photos leave viewers guessing which adult is them.', 'Every human photo is a stable adult group; save recurring companions and private subject position.', 'Social habits and occasional clarification, without compulsory deception.', 'Never leak private identity labels in public descriptions.', ['identical-selfies', 'professional-photos', 'empty-bio-beauty', 'animal-bait'], 'any', true),
  trope('pet-spotlight', "The Pet’s Dating Profile", 'Their pet gets more profile space than they do.', 'Mostly the same saved pet; pet-only shots exclude the owner.', 'Pet anecdotes and relevant described pet photos; owner still has a life.', 'No sexual framing of animals.', ['identical-selfies', 'professional-photos'], 'any', true),
  trope('cropped-ex', 'The Poorly Cropped Ex', 'An old shared life remains visible around photo edges.', 'Half an arm or hair from a saved adult ex in plausible old photos.', 'Individual feelings about old photos, not automatic resentment.', 'Do not invent infidelity or expose the ex’s private facts.', [], 'any', true),
  trope('gym-mirror', 'Gym Mirror Philosopher', 'Discipline/grind captions alongside a genuinely individual hobby.', 'Gym mirrors consistent with routine, body and resources.', 'Training habits plus an unrelated interest; confidence is not aggression.', 'No assumed sexuality or compulsory shirtlessness.', [], 'any', true),
  trope('passport', 'Passport Collage', 'Travel photos may mostly come from one old holiday.', 'Consistent trips, dates and means; not seven invented current residences.', 'Travel stories with individual priorities and realistic resources.', 'Stay within the setting’s transport and discovery distance.', [], 'any', true),
  trope('earnest-bio', 'Overly Earnest Bio', 'Sincere, perhaps awkwardly detailed self-presentation.', 'Personal meaningful scenes rather than a joke checklist.', 'Earnest interest with an individual voice and room for humor.', 'Do not guarantee attraction or make sincerity a flaw.', [], 'any', true),
  trope('bad-puns', 'Bad Pun Specialist', 'A sincerely terrible pun such as significant otter.', 'A small visual wordplay detail if plausible, not every photo.', 'Occasional groan-worthy puns; can become sincere with familiarity.', 'No repeated canned opener or puns in every message.', [], 'any', true),
  trope('image-first', 'Image-First Flirt', 'Comfortable communicating through contextual photos.', 'Their own varied expressive pictures.', 'May initiate or answer with a described photo when relevant.', 'Not every photo is sexual; respect boundaries and no automatic pixel generation.', [], 'any', true),
  trope('tiny-fish', 'Tiny Fish, Huge Ego', 'Delighted beginner triumphantly celebrates a tiny catch.', 'A genuinely tiny fish, consistent gear and believable location.', 'Self-aware pride or contagious beginner enthusiasm.', 'Not automatically arrogant or unintelligent.', ['fish-photo', 'same-fish']),
  trope('recurring-friend', 'The Recurring Friend', 'The same striking adult friend appears repeatedly.', 'Save one consistent companion and their actual relationship.', 'Their shared hobbies/social ties matter; clarify naturally if asked.', 'Do not force an ex, jealousy or a romance triangle.', ['identical-selfies', 'animal-bait']),
  trope('hidden-face', 'Where Is Their Face?', 'Shy, private or poor at presenting themselves.', 'Sunglasses, masks, back views or face-obscured images.', 'Disclosure is gradual and personally motivated.', 'Anonymous photos must really obscure identity; privacy is not proof of dishonesty.'),
  trope('professional-photos', 'Accidentally Professional', 'Looks like an applicant for a management role.', 'Formal event/wedding/company photos within means and setting.', 'A contrast between formal presentation and their own conversational self.', 'No invented employer or wealth.', ['group-photos', 'pet-spotlight', 'identical-selfies', 'animal-bait']),
  trope('ceo', 'CEO of Something', 'Founder/entrepreneur/visionary, with a concrete actual venture.', 'Plausible workplace or intentionally overambitious branding.', 'Can explain what they actually do; ambition has costs and limits.', 'No automatic wealth, success or functional scams.'),
  trope('no-drama', 'NO DRAMA PLEASE', 'Insists on a drama-free life for a specific personal reason.', 'Presentation may be tightly controlled or ordinary.', 'May be conflict-avoidant or hypocritical in a specific way, not automatically abusive.', 'Do not force hostility, instability or harmful relationship dynamics.'),
  trope('just-ask', 'Just Ask', 'A very sparse bio, possibly just Just ask.', 'Their actual life provides clues the bio omits.', 'May be shy, tired or bad at writing bios but interesting in conversation.', 'Private characterization stays full even with a minimal public bio.', ['dating-resume', 'dating-pitch', 'essay', 'requirements']),
  trope('not-here', 'Not on Here Much', 'App fatigue or infrequent checking, maybe a fictional social handle.', 'An uncurated but individual collection.', 'App habits and availability reflect their actual routine.', 'No real external links, automatic contact exchange or guaranteed delay.'),
  trope('sarcasm', 'Fluent in Sarcasm', 'Uses sarcasm as a familiar presentation shield.', 'Occasional ironic caption without a compulsory gag.', 'Jokes can deflect vulnerability; sincerity remains possible.', 'Sarcasm is not permission to insult or disregard boundaries.'),
  trope('pizza-debate', 'Pineapple Pizza Debate', 'A trivial food opinion becomes a playful compatibility hook.', 'Food scene only if it belongs in this person’s life.', 'Can playfully debate and then discuss other things.', 'Adapt food to setting; never treat a joke as consent or universal dealbreaker.'),
  trope('identical-selfies', 'Five Identical Selfies', 'Nearly identical crops of one selfie session.', 'Five near-identical photos with consistent angle/outfit.', 'Explain their lack of photo variety through routine or self-consciousness.', 'Current identity is stable; repetition is intentional here.', ['group-photos', 'pet-spotlight', 'recurring-friend', 'professional-photos', 'animal-bait']),
  trope('borrowed-car', 'The Rented Sports Car', 'Status posing with a car they do not own.', 'Save actual owner/rental context privately; use setting-appropriate transport.', 'Can be insecure, joking or simply enjoying a borrowed vehicle.', 'Do not infer wealth or automatically make them fraudulent.'),
  trope('hiking', 'Hiking Evangelist', 'Earnestly looking for an adventure buddy.', 'Trails and mountains consistent with locality and ability.', 'Outdoor routine and preference for activity over staying inside.', 'No automatic physical date, extreme fitness or forced risk.'),
  trope('cottagecore', 'Cottagecore Fantasy', 'Bread, plants and cozy self-presentation.', 'Gardening/baking scenes; private domestic chaos may contrast.', 'Actual skills, ambitions and imperfect routines.', 'Do not make every plant dead or all cozy people deceptive.'),
  trope('coffee-snob', 'Coffee Snob', 'Espresso as an exact science.', 'Individual tools/cafe scenes compatible with means and era.', 'Specific opinions, rituals and ability to be charming or irritating.', 'Still capable of other topics and respecting different tastes.'),
  trope('dating-resume', 'Dating Résumé', 'Compact qualifications/references/strengths/weaknesses.', 'One resume-style card can accompany normal personal photos.', 'Organized or playfully self-analytical, with actual vulnerability.', 'Keep the bio within app limits; no external documents required.', ['just-ask', 'empty-bio-beauty', 'essay']),
  trope('dating-pitch', 'PowerPoint Dating Pitch', 'A concise dating presentation with a silly graph or embarrassing point.', 'Describe a slide-like profile image; no actual slide-file generation.', 'Prepared charm may contrast with spontaneity or awkwardness.', 'Stay within 1–8 photo plans and normal bio limits.', ['just-ask', 'empty-bio-beauty']),
  trope('meme-profile', 'The Meme Profile', 'Their humor is signaled by a meme-like reference rather than a conventional intro.', 'Describe an original joke-image idea only; no sourced meme assets or meme rendering.', 'Shared humor can matter without requiring the user to know the reference.', 'Meme sourcing/rendering stays deferred; normal photos remain usable.'),
  trope('animal-bait', 'The Bait-and-Switch Animal', 'An impressive animal is the first thing viewers see, perhaps not theirs.', 'First photo is a saved animal with its true ownership/relationship.', 'A plausible story about the animal rather than compulsory deceit.', 'No sexual animal framing; animal is not a dating participant.', ['group-photos', 'identical-selfies', 'professional-photos']),
  trope('pet-committee', 'Pet Approval Committee', 'My cat has to like you, with a real recurring pet.', 'Stable animal temperament/appearance and familiar environment.', 'Affectionate stories about the pet’s habits and preferences.', 'Pet approval is a joke or personal boundary, never literal sexual consent.'),
  trope('height-politics', 'Height Politics', 'Very specific height wording or defensive rounding.', 'Plausible scale/framing without changing actual body identity.', 'Individual insecurity, humor or preferences around height.', 'No demographic stereotypes or falsifying required height values.'),
  trope('boardgame', 'Board-Game War Criminal', 'Playfully understates how competitive they are.', 'Specific tabletop/video games appropriate to the setting.', 'Strategic enthusiasm and a concrete competitive anecdote.', 'Name is hyperbole, not actual violence or mandatory cruelty.'),
  trope('wrong-app', 'The Wrong App', 'Really seeking a roommate, activity partner or help moving.', 'Life clues explain their practical request.', 'Awkwardly practical conversation; romantic interest may be absent.', 'Honor intentions filters; do not force romance, labor, payments or meetings.'),
  trope('linkedin', 'Accidental LinkedIn Profile', 'Corporate jargon and networking energy.', 'Professional headshot with plausible work context.', 'Work language spills into flirting or practical conversation.', 'No invented credentials/employer; a full private person remains.'),
  trope('tarot', 'Tarot Negotiator', 'A tarot reading is their playful compatibility framework.', 'Realistic cards or setting-appropriate divination hobby.', 'References a reading as their belief or performance.', 'Do not invent objectively real magic or user facts; filters and actual consent still apply.'),
  trope('local-celebrity', 'Local Celebrity', 'You probably recognize me from one tiny appearance.', 'A plausible bus ad, local event or minor public credit.', 'Individual pride/embarrassment about modest recognition.', 'The user need not recognize them; no invented established cast fame.'),
  trope('same-fish', 'The Same Fish in Every Photo', 'A recurring-fish joke with a concrete reason.', 'One stable fish prop/object shown in multiple absurd but possible scenes.', 'Can explain the bit and eventually talk about other interests.', 'Use a prop or humane context; no forced impossible live-fish handling.', ['fish-photo', 'tiny-fish']),
  trope('friend-made', 'My Friend Made This Profile', 'A consenting adult friend wrote flattering/embarrassing copy.', 'Save the friend if visible; owner chooses what remains public.', 'Owner reacts to the friend’s wording in their own voice.', 'Account owner still authors current messages; no forced signup or impersonation.'),
  trope('dog-filter', 'Dog Filter Addict', 'Cartoon ears/sparkles or exaggerated beauty filters.', 'Describe intentional decorative filters, preserving underlying identity.', 'Humor, confidence or insecurity has a personal cause.', 'Filters do not change canonical face/body or require a new image engine.'),
  trope('time-capsule', 'The Time Capsule', 'Old photos contrast with their current circumstances.', 'Clearly dated adult photos; keep current appearance separately authoritative.', 'Can discuss what changed since those photos.', 'No underage photo plans or swapping current identity for a younger version.'),
  trope('specific-dealbreaker', 'Hyper-Specific Dealbreaker', 'One odd rule with an actual backstory.', 'An object or routine may quietly explain the rule.', 'Personal boundary with a cause, flexible or firm according to the person.', 'Do not invent user incompatibility or trivialize serious consent boundaries.'),
  trope('married-bit', 'Married to the Bit', 'Writes as a knight, detective, pirate or theatrical villain.', 'Clearly chosen costumes/performance within the world.', 'Sustains a bit yet can negotiate sincerity and boundaries.', 'Persona is a performance, not a new magical setting or compulsory relationship.'),
  trope('empty-bio-beauty', 'Beautiful Pictures, Empty Bio', 'Public bio is empty or nearly empty despite excellent photos.', 'Polished individual images with a plausible photographer/resources.', 'Guarded, inarticulate or simply uninterested in bio writing.', 'Private person remains detailed; beauty does not imply dishonesty.', ['just-ask', 'dating-resume', 'dating-pitch', 'essay', 'requirements', 'group-photos']),
  trope('impossible-location', 'Geographically Impossible', 'Bio refers to a faraway home while current app distance is local.', 'Travel/move/old-photo evidence explains the apparent mismatch.', 'An actual current travel or relocation situation.', 'distanceKm is genuine current distance and obeys filters; do not invent teleportation.'),
  trope('old-romantic', 'Old-School Romantic', 'Handwritten letters, flowers or deliberate courtship.', 'Meaningful objects and personal romantic gestures.', 'May follow through or have individual limits/resources.', 'No forced gender roles, exclusivity, attraction or physical arrival.'),
  trope('essay', 'The 700-Word Essay', 'Comically overexplains soup, holidays or emotional availability.', 'Specific personal scenes give their anecdotes context.', 'Verbose texting voice and intricate but meaningful answers.', 'Represent this as a concise excerpt within existing bio/text limits; never require a literal 700-word bio.', ['just-ask', 'empty-bio-beauty', 'dating-resume']),
  trope('requirements', 'The Requirements Checklist', 'Preferences resemble a procurement checklist.', 'Orderly or carefully chosen photos reflect self-presentation.', 'Specific standards with real causes and some human contradictions.', 'Do not invent user compliance or turn standards into guaranteed compatibility.', ['just-ask', 'empty-bio-beauty']),
  trope('hate-apps', 'I Hate Dating Apps', 'Complains about the app they are currently using.', 'Reluctant presentation with an individual reason to stay.', 'Cynicism, hope or ambivalence varies with context.', 'Not automatically rude, unavailable or secretly seeking sex.'),
  trope('niche-hobby', 'The Microscopic Niche Hobby', 'Deeply serious about an obscure concrete pursuit.', 'Specific tools/objects/events from that hobby.', 'Detailed enthusiasm, social ties and an actual routine.', 'Hobby is setting-plausible, not their entire personality.'),
  trope('reverse-catfish', 'Reverse Catfish', 'Deliberately unflattering presentation to foreground personality.', 'Awkward framing/lighting of their actual stable appearance.', 'Values being known beyond looks; confidence varies.', 'No changing canonical body, shaming appearance or guaranteeing beauty later.'),
  trope('terrible-texter', 'The Terrible Texter', 'Interested but inconsistent at checking messages.', 'Photos reflect work/life that competes with app attention.', 'Busy/anxious/forgetful routine and availability rather than obligatory disinterest.', 'Native cadence limits still apply; never schedule a guaranteed three-day reply.'),
  trope('shopping-list', 'The Shopping List Opener', 'One plausible mistaken shopping-list message.', 'Ordinary daily-life details make the mishap believable.', 'May send a brief list once and recover in their own voice.', 'Do not repeat the accident, pre-send messages or manufacture a match.'),
  trope('nervous-opener', 'The Nervous First Messenger', 'Enthusiasm mixed with overthinking an opener.', 'A human contrast between presentation and confidence.', 'Hesitant phrasing, rewrites described privately, gradual ease.', 'No guaranteed match, fixed evening-long timer or obligatory anxiety diagnosis.'),
  trope('app-veteran', 'The Dating App Veteran', 'Has heard every opener but may still be hopeful.', 'An evolved presentation with personally meaningful details.', 'Recognizes clichés and responds with wit or patience.', 'Experience does not imply cynicism, promiscuity or knowledge of the user.'),
  trope('app-burnout', 'The Dating-App Burnout', 'Repeated breaks or uncertainty about the app.', 'An uneven collection or deliberately refreshed presentation.', 'Ambivalent app habits and genuine limits on emotional energy.', 'No automatic deletions, forced unmatches or contradictory intentions fields.'),
  trope('corporate-name', 'The Corporate Name-Dropper', 'Corporate affiliation signals status in a megacorporate world.', 'Setting-supported corporate context, not invented real credentials.', 'Status-conscious phrasing with individual motives and costs.', 'Use only supported cyberpunk/corporate world evidence.', [], 'cyberpunk'),
  trope('augmentation', 'Augmentation Flexer', 'Treats compatible cyberware as a dating advantage.', 'Stable canon-supported augmentations separated from ordinary clothing.', 'Pride, debt, maintenance or insecurity can inform conversation.', 'No cyberware in settings that do not support it; no automatic wealth.', [], 'cyberpunk'),
  trope('privacy-paranoid', 'The Privacy Paranoid', 'Identity/metadata privacy due to surveillance or safety.', 'Consistently obscure face, workplace and identifying background.', 'Careful disclosure rooted in established setting pressures.', 'No forced paranoia diagnosis or inventing a surveillance plot as canon.', [], 'cyberpunk'),
  trope('synthetic-perfect', 'Synthetic Perfection', 'Suspiciously identical polished presentation.', 'Consistent artificial-looking finish within supported technology.', 'Control over presentation has a concrete cause and limits.', 'No automatic synthetic identity, catfishing or changed canonical appearance.', [], 'cyberpunk'),
  trope('local-landmark', 'The Local Landmark Photographer', 'Every outing seems to end at the same local landmark.', 'One saved location repeatedly appears in different plausible adult scenes.', 'Small-town routines, memories and a reason to revisit.', 'Do not establish the user has visited or invent a shared encounter.', [], 'small-town'),
  trope('everyone-ex', 'The Ex in Everyone’s Pictures', 'Overlapping adult social circles contain one recurring ex.', 'Save one adult ex within this invented person’s own photo collection.', 'Awkward small-town overlap without automatic bitterness.', 'Never rewrite other saved profiles/cast to insert an ex or invent cheating.', [], 'small-town'),
  trope('reunion-photo', 'The School Reunion Photo', 'A flattering old reunion photo is still their favorite.', 'Adult reunion photos with dates plausible for the current adult age.', 'Memories of the reunion and why newer photos are scarce.', 'Reunion participants must be adults; no teenage school photo plans; younger adults can use a recent adult reunion.'),
]
export const MAIN_DATING_TROPES = DATING_TROPES.filter(t => t.main)
export function eligibleDatingTropes(allTropes: boolean, worldContext: string): DatingTrope[] {
  const cyberpunk = /cyberpunk|cyberware|megacorp|cybernetic|augmentations?/i.test(worldContext)
  const smallTown = /small[- ]town|village|rural community/i.test(worldContext)
  return DATING_TROPES.filter(t => (t.main || allTropes) && (t.condition === 'any' || (t.condition === 'cyberpunk' ? cyberpunk : smallTown)))
}
export function compatibleDatingTropes(a: DatingTrope, b: DatingTrope): boolean {
  return a.id !== b.id && !a.excludes.includes(b.id) && !b.excludes.includes(a.id)
}
export type DatingPresentationPlan = { flavor: string; tropes: DatingTrope[] }
/** Saved engine selection with opt-in parody, frequency, exclusions and recent-family rotation. */
export function selectDatingPresentation(allTropes: boolean, worldContext: string, random = Math.random, settings?: LumistryExperience, requiredIntentions = '', recentIds: string[] = []): DatingPresentationPlan {
  const experience = normalizeExperience(settings);
  if (experience.parody && random() < .02) return { flavor: 'fictional bot or romance-scam parody', tropes: [] }
  if (random() >= (experience.scope === 'B' ? .2744 : experience.tropeRate / 100)) return { flavor: 'ordinary', tropes: [] }
  const compatibleFilter = (t:DatingTrope) => t.id !== 'wrong-app' || !requiredIntentions || requiredIntentions.split(',').some(v=>/^(friendship|friends first|not sure yet|exploring)$/i.test(v.trim()));
  const expanded = eligibleDatingTropes(allTropes, worldContext).filter(t => !t.main && compatibleFilter(t))
  const pool = allTropes && expanded.length && random() >= .5 ? expanded : MAIN_DATING_TROPES
  const pick = (entries:DatingTrope[]) => {
    const recent=recentIds.slice(-24).map(id=>DATING_TROPES.find(t=>t.id===id)).filter((t):t is DatingTrope=>!!t);
    const weights=entries.map(t=>1/(1+recent.filter(r=>r.id===t.id).length*2+recent.filter(r=>r.family===t.family).length*.25));
    let cursor=random()*weights.reduce((a,b)=>a+b,0);
    return entries.find((_t,i)=>(cursor-=weights[i])<0)||entries.at(-1)!;
  };
  const first = pick(pool)
  const tropes = [first]
  if (allTropes && random() < .25) {
    const compatible = eligibleDatingTropes(true, worldContext).filter(t => compatibleFilter(t) && compatibleDatingTropes(first, t))
    if (compatible.length) tropes.push(pick(compatible))
  }
  return { flavor: tropes.map(t => t.label).join(' + '), tropes }
}
export function normalizeDatingTropeIds(value: unknown): string[] {
  const known = new Set(DATING_TROPES.map(t => t.id))
  return [...new Set((Array.isArray(value) ? value : []).filter((id): id is string => typeof id === 'string' && known.has(id)))].slice(0, 2)
}

export function allowsEmptyDatingBio(plan:DatingPresentationPlan):boolean { return plan.tropes.some(t=>['empty-bio-beauty','image-first'].includes(t.id)); }
