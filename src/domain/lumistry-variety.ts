import type { DatingProfile } from './lumistry.js'

// Resolved before generation, rather than asking the model to roll its own choices.
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
export const BIO_SHAPES = [
  'one concrete everyday observation, then a brief invitation',
  'a tiny recent anecdote, with no list of hobbies',
  'a straightforward self-description in two uneven sentences',
  'a specific opinion followed by the ordinary reason behind it',
  'a short question that reveals something about their own life',
  'a modest admission and something they actually enjoy',
  'a few clipped fragments in their own vocabulary',
  'a small plan they would enjoy sharing, without promising a date',
  'a practical detail about their week, with restrained warmth',
  'an understated joke grounded in their own experience',
] as const
const FOCUSES = [
  'an everyday skill they learned for an unglamorous reason',
  'a recurring responsibility and how they make room for themselves',
  'a small pleasure they have an unusually specific opinion about',
  'a social ritual with people they know well',
  'something they recently changed their mind about',
  'a place they return to for a personal, practical reason',
  'a project they pursue imperfectly, without making it their entire identity',
  'a possession with a mundane but individual story',
  'a difference between their public confidence and everyday habits',
  'a quiet ambition that has a plausible next step',
] as const
const PHOTO_APPROACHES = [
  'choose images kept from particular ordinary occasions',
  'consider an imperfect favorite picture and why they kept it',
  'let one personally meaningful place influence a scene',
  'choose moments with different energy rather than a checklist of activities',
  'consider what they photograph when nobody is posing',
  'vary framing and who took the pictures according to their actual life',
] as const

// Editorial lenses, not assigned commitments, finances, consent or promised events.
export const RELATIONSHIP_FOCUSES = [
  'the particular pleasure they want more of in their life',
  'the practical arrangement that would suit their actual week',
  'something they enjoy giving, and what they hope to receive',
  'what makes this connection appealing at this point in life',
  'a wish they admit plainly rather than dressing it up',
  'a reservation alongside a reason they are still interested',
  'the kind of company they miss in an otherwise full life',
  'how affection, material generosity or independence matter to them individually',
  'a small shared experience they would actually enjoy repeating',
  'what they are curious to try without pretending certainty',
] as const
export const QUESTION_FOCUSES = [
  'an ordinary preference with a personal reason',
  'a practical detail of spending time together',
  'an imperfect habit or small admission',
  'a specific pleasure or treat',
  'an opinion they would defend lightly',
  'something currently occupying their attention',
  'what their friends would recognize about them',
  'a recent change of mind',
  'a small invitation into their everyday life',
  'what they want from this connection, in concrete personal terms',
  'something they are good at or comically bad at',
  'an unexpected preference that fits their established life',
] as const

export function recentDatingProse(profiles: readonly DatingProfile[]) {
  return profiles.slice(-16).map(p => ({
    alias: p.alias, bio: p.bio.slice(0, 300),
    questions: (p.person?.prompts || []).slice(0, 3).map(card => ({ question: card.question.slice(0, 90), answer: card.answer.slice(0, 180) })),
    photos: p.photoPlan.slice(0, 1).map(photo => ({ caption: photo.caption.slice(0, 90), description: photo.description.slice(0, 180) })),
  }))
}

export function selectDatingVariety(_profiles: readonly DatingProfile[], count: number, random = Math.random) {
  const shapes: string[] = [...BIO_SHAPES], focuses: string[] = [...FOCUSES], photos: string[] = [...PHOTO_APPROACHES]
  const relationships: string[] = [...RELATIONSHIP_FOCUSES], questions: string[] = [...QUESTION_FOCUSES]
  const take = (pool: string[], refill: readonly string[]) => {
    if (!pool.length) pool.push(...refill)
    return pool.splice(Math.floor(random() * pool.length), 1)[0]
  }
  return Array.from({ length: count }, () => {
    return {
      bioShape: take(shapes, BIO_SHAPES),
      characterFocus: take(focuses, FOCUSES),
      photoApproach: take(photos, PHOTO_APPROACHES),
      relationshipFocus: take(relationships, RELATIONSHIP_FOCUSES),
      questionFocuses: Array.from({ length: 3 }, () => take(questions, QUESTION_FOCUSES)),
    }
  })
}

/** Repetition hints only, from public writing across distinct people, never new facts. */
export function recentOverusedMotifs(profiles:readonly DatingProfile[]):string[] {
 const stop=new Set('the and for with that this from have been what when where your you my its was are but not they their good bad also just really very some most more than into over'.split(' ')),counts=new Map<string,number>();
 for(const p of [...new Map(profiles.slice(-12).map(p=>[p.id||p.alias,p])).values()]){
  const tokens=[p.bio,...(p.person?.prompts||[]).map(q=>q.answer)].join(' ').toLowerCase().match(/[a-z]+/g)||[],seen=new Set<string>();
  for(let n=2;n<=4;n++)for(let i=0;i+n<=tokens.length;i++){const words=tokens.slice(i,i+n);if(stop.has(words[0])||stop.has(words.at(-1)!)||words.filter(w=>w.length>2&&!stop.has(w)).length<2)continue;seen.add(words.join(' '));}
  for(const phrase of seen)counts.set(phrase,(counts.get(phrase)||0)+1);
 }
 return [...counts].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]||a[0].length-b[0].length).map(([p])=>p).filter((p,i,all)=>!all.slice(0,i).some(short=>p.includes(short))).slice(0,12);
}
