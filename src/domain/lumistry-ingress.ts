import {assertAdultPreferences} from './lumistry-adult-preferences-core.js';
import {AUTHORING_LIMITS as L,WRITING_FIELDS as F,AuthoringContractError,bioWithinBounds,type AuthoringIssue} from './lumistry-authoring-contract.js';
import {PHOTO_TEXT_LIMITS as P} from './lumistry-photo-contract.js';
/** Validate new input before any bounded native summary or normalizer can hide a defect.
 * Existing storage is normalized separately; user edits may retain older saved gallery counts. */
export function assertDatingIngress(raw:any,origin:'generated'|'persona'|'edit'='generated'):void {
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
    assertAdultPreferences(raw.adultPreferences);
    const issues:AuthoringIssue[]=[];
    const text=(value:any,max:number,label:string)=>{if(typeof value==='string'&&value.trim().length>max)issues.push({code:'field-length',message:`${label} exceeds its accepted storage bound; the input was retained for correction.`,labels:[label],layer:'validation'});};
    text(raw.alias,L.alias,'Public alias');text(raw.pronouns,L.pronouns,'Pronouns');text(raw.bio,L.bio,'Bio');
    if(typeof raw.bio==='string'&&!bioWithinBounds(raw.bio))issues.push({code:'bio-length',message:'Bio exceeds its accepted word/character bound.',labels:['Bio']});
    for(const key of ['orientation','commitments','intentions','boundaries'])text(raw.privateFields?.[key],L.privateText,key==='commitments'?'Existing commitments':key==='intentions'?'Dating intentions':key==='boundaries'?'Personal limits':'Actual orientation');
    for(const card of Array.isArray(raw.person?.prompts)?raw.person.prompts:[]){text(card?.question,L.question,'Question');text(card?.answer,L.answer,'Answer');}
    const plans=Array.isArray(raw.photoPlan)?raw.photoPlan:[];
    if(origin==='generated'&&plans.length>L.photosMax)issues.push({code:'gallery-count',message:'Generated gallery exceeds the selected gallery range.',labels:['Gallery photo purpose']});
    for(const photo of [...plans,...(raw.openingPhoto?[raw.openingPhoto]:[])]){
        text(photo?.description,P.description,'Full literal description');text(photo?.caption,P.caption,'Public caption');text(photo?.prompt,P.prompt,'Flat image prompt');
        const subjects=Array.isArray(photo?.visual?.subjects)?photo.visual.subjects:photo?.subjectIds;
        if(Array.isArray(subjects)&&subjects.length>P.subjects)issues.push({code:'subject-count',message:'Photo exceeds the accepted visible-subject count.',labels:['Visible subjects']});
    }
    for(const photo of Array.isArray(raw.photos)?raw.photos:[])text(photo?.prompt,F.renderedPrompt.accepted,'Compiled render scene');
    if(issues.length)throw new AuthoringContractError(issues);
}
