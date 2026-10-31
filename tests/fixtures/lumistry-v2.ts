export const dossier = (alias = 'Aster', extra = '') => `Name and dating alias: ${alias}
Public alias: ${alias}
Age and life stage: 29; established adult.
Gender and pronouns: woman; she/her
Anonymous profile: no
Public categories: gender, occupation, height, interests, intentions
Category gender: woman
Category occupation: tradesperson
Category interests: books, coffee
Category intentions: casual dating
Height and build: 168 cm; compact shoulders
Hair: dark brown short waves
Eyes: brown almond eyes
Skin / fur / scales / surface: olive skin with a few freckles
Facial features: angular jaw and prominent brows
Core personality: Patient when repairing, impatient with vague promises.
Everyday rhythm: Late repair shifts and weekend library visits.
Actual orientation and attraction: Bisexual; drawn to independent curious adults.
Existing relationship and commitments: Single; no exclusivity agreements.
Reason for joining and intentions: Casual dating outside work; not rushing commitment.
Personal comfort and consent: Can decline pressure and prefers direct plans.
Spoken voice and register: Plain direct language, occasionally technical.
Written mechanics: lowercase, short punctuation, rare emoji
Sentence rhythm and conversational effort: short answers; elaborates about repairs
Voice samples: profile: one lamp fixed. friend: it lives again
Availability and app habits: Usually checks after closing the shop.
Independent goal: Find a workshop space with decent daylight.
${extra}
END CHARACTER DOSSIER.`;
export const publicText = (questions = 2, photos = 3, bio = 'one lamp fixed. two to go.') => `Bio: ${bio}
${Array.from({ length: questions }, (_, i) => `### Q&A\nQuestion: what small thing ${i + 1}?\nAnswer: the lamp ${i + 1} finally works`).join('\n')}
${Array.from({ length: photos }, (_, i) => `### Gallery plan\nGallery photo purpose: owner fixing lamp number ${i + 1} in the workshop`).join('\n')}
END PROFILE PLAN.`;
export const photo = (scene = 'A side-on phone photo of the owner repairing a lamp.', subjects = 'owner', caption = 'it lives', extra = '') => `Photo purpose: Shows a workshop hobby.
Photo kind and aspect: casual portrait snapshot
Visible subjects: ${subjects}
Clothing and accessories: green work shirt
Pose, action and gaze: looking at the lamp
Relative positions: owner at frame left
Location and environment: repair workshop
Camera and composition: eye-level side view
Lighting and atmosphere: soft window light
Full literal description: ${scene}
Public caption: ${caption}
${extra}
END PHOTO.`;

/** Mock writer obeys selected facets while supplying the remaining ordinary detail. */
export function withPlannedAppearance(text:string,physical?:Record<string,string>):string {
 if(!physical)return text;
 for(const [field,label,detail] of [['skin','Skin / fur / scales / surface','a few freckles'],['hair','Hair','dark brown, cropped short'],['face','Facial features','slightly uneven smile']] as const){
  if(physical[field])text=text.split('\n').map(line=>line.startsWith(label+':')?label+': '+physical[field]+'; '+detail:line).join('\n');
 }
 return text;
}
