import {committedConversationMessages} from './lumistry-evidence.js';
import {relevantAdultPreferences} from './lumistry-adult-preferences.js';
import type { DatingProfile } from './lumistry.js';
import type { PocketConversation,PhoneState } from '../types.js';
import { nativeSummary } from './lumistry-authoring-contract.js';
import { deduplicateDatingProfile } from './lumistry-facts.js';

const present = (row: Record<string, any>) => Object.fromEntries(Object.entries(row).filter(([,v]) => v !== '' && v !== undefined && v !== null));
const agency = new Set(['gender','orientation','commitments','relationshipStatus','monogamy','intentions','preferences','sexualInterests','sexualRole','libido','kinks','boundaries','dealbreakers']);
const stop = new Set('the and you are for how can did has was she him her but not yes now why who own our tell please want know reply naturally latest dating message write next generate about after again also been could does doing from have here just like more much really some that them then there these they thing this what when where which with would your yourself'.split(' '));
const words = (s: string) => new Set((s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter(w => !stop.has(w)).flatMap(w=>w.length>3 && w.endsWith('s') && !w.endsWith('ss') ? [w,w.slice(0,-1)] : [w]));
const topics: Record<string,string> = {
    realName:'real name identity called', residence:'home live living apartment town moved',
    background:'grew childhood family parents upbringing', socialCircle:'family parents father dad mother mom mum friends pets dog cat siblings sister brother',
    career:'work job career occupation living', routine:'day week weekday weekend routine usually',
    currentPressure:'stress worry worrying bothering pressure', independentGoal:'goal dream ambition project future working toward',
    pleasures:'enjoy hobbies interests favorite favourite likes dislikes', skills:'skill good bad talent cooking',
    comfortable:'comfortable relaxed trust', hurt:'hurt upset angry', pressureResponse:'stress pressure angry',
    trust:'trust close relationship', selfStory:'yourself personality', appearance:'look appearance hair eyes face height build wearing photo selfie picture',
};
/** Public summary only. Detailed cards/gallery are retrieved separately, never repeated by default. */
export function textingPublicProfile(p: DatingProfile) {
    return present({alias:p.alias,age:p.age,pronouns:p.pronouns,bio:p.bio,anonymous:p.anonymous,
        fields:Object.fromEntries(Object.entries(p.fields).filter(([k])=>!p.hiddenFields.includes(k)))});
}
export function textingQuery(c: PocketConversation, instruction = '',state?:PhoneState) {
    return [...committedConversationMessages(c,state).slice(-4).map(m=>m.text || ''),instruction].join('\n');
}
/** No model summary or stored second identity. Always rebuilt from current accepted character facts. */
export function textingOwnBrief(p: DatingProfile) {
    const own=deduplicateDatingProfile(structuredClone(p)), person=own.person;
    return present({
        ...(!person&&['currentWork','currentResidence','currentRoutine','currentPressure'].some(k=>own.privateFields[k])?{currentLife:present({work:own.privateFields.currentWork,residence:own.privateFields.currentResidence,routine:own.privateFields.currentRoutine,pressure:own.privateFields.currentPressure})}:{}),
        actualFields:Object.fromEntries(Object.entries(own.fields).filter(([k])=>agency.has(k))),
        privateFacts:Object.fromEntries(Object.entries(own.privateFields).filter(([k])=>agency.has(k)||k==='guardedTopics')),
        intimacy:person?present({...person.intimacy}):undefined,
        socialPattern:present({initiative:nativeSummary(own.privateFields.initiative||'',180),selfUnderstanding:nativeSummary(own.privateFields.selfStory||'',180)}),
        diagnosticVoice:own.development?.units?.['MUTUAL_MATCH:voice']?.authority==='diagnostic'?nativeSummary(own.development.units['MUTUAL_MATCH:voice'].text,240):undefined,
        personality:nativeSummary(own.phoneProfile.personality,420),textingStyle:nativeSummary(own.phoneProfile.textingStyle,420),
        voice:person?.writingVoice?present({register:person.writingVoice.register,mechanics:person.writingVoice.mechanics,rhythm:person.writingVoice.rhythm,privateContrast:person.writingVoice.privateContrast,otherLanguages:person.writingVoice.otherLanguages}):undefined,
        life:person?present({work:p.privateFields.currentWork||p.creationPlan?.work.title,...(p.privateFields.currentResidence?{currentResidence:p.privateFields.currentResidence}:{}),career:nativeSummary(person.life.career,240),routine:nativeSummary(p.privateFields.currentRoutine||person.life.routine,300),currentSituation:nativeSummary(own.privateFields.currentSituation || own.privateFields.currentPressure || person.life.currentPressure,300)}):undefined,
        body:person?.anatomy?{bodyPlan:person.anatomy.bodyPlan,currentForm:person.anatomy.currentForm}:undefined,
        availability:person?.availability,
        presentation:person?.presentation?present({hook:nativeSummary(person.presentation.hook,240),conversationBehavior:person.presentation.conversationBehavior,limits:person.presentation.limits}):undefined,
        subjects:person?.entities.map(e=>({id:e.id,name:e.name,kind:e.kind})),
    });
}
/** Conservative lexical retrieval over the same NPC's own record and the match's PUBLIC material. */
export function textingRelevantFacts(p: DatingProfile, match: DatingProfile, query: string) {
    const needle=words(query), candidates:Array<{key:string;value:any;search:string}>=[];
    const add=(key:string,value:any,alias='')=>{if(value && (typeof value!=='string'||value.trim()))candidates.push({key,value,search:key+' '+alias+' '+(typeof value==='string'?value:JSON.stringify(value))});};
    for(const [key,value] of Object.entries(p.fields))if(!agency.has(key))add('category.'+key,value,topics[key]);
    for(const [key,value] of Object.entries(p.privateFields))if(!agency.has(key)&&key!=='guardedTopics')add('private.'+key,value,topics[key]);
    for(const [key,value] of Object.entries(p.person?.life || {}))if(!['career','routine','currentPressure'].includes(key))add('life.'+key,value,topics[key]);
    const appearanceTopics:Record<string,string>={tags:'species physiology',face:'face eyes eye nose lips',hair:'hair hairstyle',skin:'skin freckles fur scales',build:'body height build',height:'height tall',distinctive:'scars tattoos marks',usualStyle:'wear wearing clothes clothing outfit style'};
    for(const [key,value] of Object.entries(p.person?.appearance || {}))add('appearance.'+key,value,'look appearance photo selfie picture '+(appearanceTopics[key] || ''));
    if(p.person?.anatomy)add('appearance.anatomy',p.person.anatomy,'look appearance body limbs current form photo selfie picture');
    const adult=relevantAdultPreferences(p.adultPreferences,query,p.creationPlan?.world);if(adult)add('private.adultPreferences',adult,'private interests boundaries attraction');
    for(const entity of p.person?.entities || [])add('companion.'+entity.name,entity,topics.socialCircle);
    for(const [key,value] of Object.entries({match:p.development?.match?.facts,portrayal:p.development?.portrayal?.behavior}))add('development.'+key,value);
    for(const [who,profile] of [['own',p],['match',match]] as const) {
        for(const [i,card] of (profile.person?.prompts || []).entries())add(`${who}.publicAnswer.${i+1}`,card,'profile answer question');
        if(/\b(photo|photos|picture|pictures|pic|pics|selfie|gallery)\b/i.test(query)) {
            const index=query.match(/\b(?:photo|picture|pic)\s*(?:number\s*|#)?(\d+)\b/i)?.[1];
            const ordinal=query.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth)\s+(?:photo|picture|pic)\b/i)?.[1];
            const position=index?Number(index)-1:ordinal?['first','second','third','fourth','fifth','sixth','seventh','eighth'].indexOf(ordinal.toLowerCase()):undefined;
            const photos=[...profile.photoPlan,...profile.photos.filter(x=>x.planIndex===undefined || !profile.photoPlan[x.planIndex]).map(x=>({caption:x.caption,description:'Image contents not described.'}))];
            for(const [i,photo] of photos.entries())if(position===undefined||position===i)add(`${who}.publicPhoto.${i+1}`,{caption:photo.caption,description:photo.description},'photo picture gallery');
        }
    }
    const scored=candidates.map((row,index)=>({...row,index,score:[...words(row.search)].filter(w=>needle.has(w)).length+(row.key.includes('.publicPhoto.')?2:0)})).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
    const selected:Record<string,any>={};let used=0;
    for(const row of scored) {
        const size=JSON.stringify(row.value).length;
        if(Object.keys(selected).length>=5)break;
        // Include complete facts, never cut a qualification/negation to meet a context budget.
        if(used+size>3200 && !(used===0 && row.key.startsWith('development.')))continue;
        selected[row.key]=row.value;used+=size;
    }
    return selected;
}
