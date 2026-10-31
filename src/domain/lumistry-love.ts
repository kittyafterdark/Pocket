/** Fictional, player-visible feelings. This reducer never mutates actors, events or access. */
export const LOVE_DIMENSIONS = ['affection','trust','chemistry','closeness'] as const;
export type LoveDimension = typeof LOVE_DIMENSIONS[number];
export type LoveSource = 'dating'|'direct'|'scene';
export type LoveScores = Record<LoveDimension,number|null>;
export interface LovePreferences {version:1;pace:'slow'|'responsive'|'dramatic';sources:Record<LoveSource,boolean>;}
export interface LoveWitness {ref:string;hash:string;stream:string;order:number;channel:LoveSource;}
export interface LoveEvidence extends LoveWitness {text:string;speaker:'owner'|'npc';}
export interface PairAgreement {label?:string;exclusivity?:'exclusive'|'nonexclusive'|'withdrawn';ended?:boolean;proposal?:{label?:string;exclusivity?:'exclusive'|'nonexclusive';by:'owner'|'npc';evidence:LoveWitness[]};}
export interface LoveReceipt {key:string;source:LoveSource;before:LoveScores;after:LoveScores;agreementBefore:PairAgreement;agreementAfter:PairAgreement;witnesses:LoveWitness[];reason:string;significance:'small'|'significant'|'exceptional';baseline:boolean;at:string;revision:number;}
export interface LoveInsight {
 version:1;revision:number;scores:LoveScores;stale?:boolean;reason?:string;
 ledger:LoveReceipt[];checkpoint:{scores:LoveScores;agreement:PairAgreement;witnesses:LoveWitness[];watermarks:Record<string,number>};
 watermarks:Record<string,number>;journal:LoveReceipt[];last?:LoveReceipt;assessmentReceipt?:string;
 coverage?:{assessed:number;unchanged:number;missing:number;invalid:number;stale:number;duplicate:number;};
}
export interface LoveState {preferences?:LovePreferences;insights?:Record<string,LoveInsight>;agreements?:Record<string,PairAgreement>;}
export interface LoveFrame {profileId:string;revision:number;source:LoveSource;key:string;at:string;evidence:LoveEvidence[];anchors:string[];emotions:boolean;assessment?:boolean;outputRefs?:string[];}
export interface LoveFeedback {version:1;profileId:string;revision:number;initial?:Partial<LoveScores>;changes?:Partial<Record<LoveDimension,number>>;significance?:'small'|'significant'|'exceptional';reason?:string;evidence?:string[];agreement?:unknown;}
const object=(v:any):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const text=(v:any,n=200)=>typeof v==='string'&&v.trim().length<=n?v.trim():'';
const own=(o:any,k:string)=>Object.hasOwn(o||{},k)?o[k]:undefined;
const set=(o:any,k:string,v:any)=>Object.defineProperty(o,k,{value:v,enumerable:true,writable:true,configurable:true});
export const unknownLoveScores=():LoveScores=>({affection:null,trust:null,chemistry:null,closeness:null});
export function lovePreferences(v?:any):LovePreferences {return {version:1,pace:['slow','responsive','dramatic'].includes(v?.pace)?v.pace:'responsive',sources:{dating:v?.sources?.dating!==false,direct:v?.sources?.direct!==false,scene:v?.sources?.scene!==false}};}
export function loveFingerprint(v:unknown):string {const s=typeof v==='string'?v:JSON.stringify(v);let a=2166136261,b=0x9e3779b9;for(let i=0;i<s.length;i++){a=Math.imul(a^s.charCodeAt(i),16777619);b=Math.imul(b^s.charCodeAt(i),2246822519);}return `${s.length}:${(a>>>0).toString(16)}:${(b>>>0).toString(16)}`;}
const scores=(v:any):LoveScores=>Object.fromEntries(LOVE_DIMENSIONS.map(k=>[k,typeof v?.[k]==='number'&&Number.isInteger(v[k])&&v[k]>=0&&v[k]<=100?v[k]:null])) as LoveScores;
const witness=(v:any):LoveWitness|undefined=>v&&text(v.ref,350)&&text(v.hash,100)&&text(v.stream,250)&&Number.isInteger(v.order)&&v.order>=0&&['dating','direct','scene'].includes(v.channel)?{ref:v.ref,hash:v.hash,stream:v.stream,order:v.order,channel:v.channel}:undefined;
const witnesses=(v:any,n=16):LoveWitness[]=>(Array.isArray(v)?v:[]).slice(-n).flatMap(x=>{const w=witness(x);return w?[w]:[];});
const marks=(v:any)=>Object.fromEntries(Object.entries(object(v)).slice(-64).filter(([k,n])=>k.length<=250&&Number.isInteger(n)&&Number(n)>=0)) as Record<string,number>;
export function normalizePairAgreement(v:any):PairAgreement {const a=object(v),proposal=object(a.proposal);return {...(text(a.label,100)?{label:a.label}:{}),...(['exclusive','nonexclusive','withdrawn'].includes(a.exclusivity)?{exclusivity:a.exclusivity}:{}),...(a.ended===true?{ended:true}:{}),...(['owner','npc'].includes(proposal.by)&&(text(proposal.label,100)||['exclusive','nonexclusive'].includes(proposal.exclusivity))?{proposal:{...(text(proposal.label,100)?{label:proposal.label}:{}),...(['exclusive','nonexclusive'].includes(proposal.exclusivity)?{exclusivity:proposal.exclusivity}:{}),by:proposal.by,evidence:witnesses(proposal.evidence)}}:{})};}
function receipt(v:any):LoveReceipt|undefined {if(!text(v?.key,350)||!['dating','direct','scene'].includes(v.source)||!Number.isInteger(v.revision)||v.revision<1||!['small','significant','exceptional'].includes(v.significance))return;return {key:v.key,source:v.source,before:scores(v.before),after:scores(v.after),agreementBefore:normalizePairAgreement(v.agreementBefore),agreementAfter:normalizePairAgreement(v.agreementAfter),witnesses:witnesses(v.witnesses,40),reason:text(v.reason,240),significance:v.significance,baseline:v.baseline===true,at:text(v.at,50),revision:v.revision};}
export function emptyLoveInsight():LoveInsight{return {version:1,revision:0,scores:unknownLoveScores(),ledger:[],checkpoint:{scores:unknownLoveScores(),agreement:{},witnesses:[],watermarks:{}},watermarks:{},journal:[]};}
export function normalizeLoveInsight(v:any):LoveInsight|undefined {if(v?.version!==1)return;const ledger=(Array.isArray(v.ledger)?v.ledger:[]).slice(-256).flatMap((x:any)=>{const r=receipt(x);return r?[r]:[];});return {version:1,revision:Math.max(0,Math.floor(Number(v.revision)||0)),scores:scores(v.scores),...(v.stale===true?{stale:true}:{}),...(text(v.reason,240)?{reason:v.reason}:{}),ledger,checkpoint:{scores:scores(v.checkpoint?.scores),agreement:normalizePairAgreement(v.checkpoint?.agreement),witnesses:witnesses(v.checkpoint?.witnesses,256),watermarks:marks(v.checkpoint?.watermarks)},watermarks:marks(v.watermarks),journal:(Array.isArray(v.journal)?v.journal:[]).slice(-50).flatMap((x:any)=>{const r=receipt(x);return r?[r]:[];}),...(receipt(v.last)?{last:receipt(v.last)}:{}),...(text(v.assessmentReceipt,100)?{assessmentReceipt:v.assessmentReceipt}:{}),coverage:Object.fromEntries(['assessed','unchanged','missing','invalid','stale','duplicate'].map(k=>[k,Math.max(0,Math.floor(Number(v.coverage?.[k])||0))])) as LoveInsight['coverage']};}
export function normalizeLoveState(v:any):LoveState {const result:LoveState={};if(v?.preferences?.version===1)result.preferences=lovePreferences(v.preferences);if(v?.insights){result.insights=Object.fromEntries(Object.entries(object(v.insights)).flatMap(([k,x])=>{const n=normalizeLoveInsight(x);return k.length<=180&&n?[[k,n]]:[];}));}if(v?.agreements)result.agreements=Object.fromEntries(Object.entries(object(v.agreements)).filter(([k])=>k.length<=180).map(([k,x])=>[k,normalizePairAgreement(x)]));return result;}
export function insightFor(state:LoveState,id:string):LoveInsight|undefined{return own(state.insights,id);}
export function agreementFor(state:LoveState,id:string):PairAgreement{return own(state.agreements,id)||{};}
function increment(insight:LoveInsight,key:keyof NonNullable<LoveInsight['coverage']>){insight.coverage||={assessed:0,unchanged:0,missing:0,invalid:0,stale:0,duplicate:0};insight.coverage[key]++;}
const withoutText=(e:LoveEvidence):LoveWitness=>({ref:e.ref,hash:e.hash,stream:e.stream,order:e.order,channel:e.channel});
function validateAgreement(raw:any,current:PairAgreement,evidence:LoveEvidence[]):PairAgreement|undefined {
 if(!raw||!['propose','accept','end','withdraw'].includes(raw.operation)||!Array.isArray(raw.evidence)||!raw.evidence.length||raw.evidence.length>6)return;
 const rows=raw.evidence.map((r:any)=>{const e=evidence.find(e=>e.ref===r?.ref);return e&&text(r.quote,800)&&e.text.includes(r.quote)&&['propose','accept','refuse','withdraw','end'].includes(r.intent)?{...e,intent:r.intent}:undefined;});if(rows.some((r:any)=>!r))return;
 const label=raw.label===undefined?undefined:text(raw.label,100),exclusive=raw.exclusivity;if(raw.label!==undefined&&!label||exclusive!==undefined&&!['exclusive','nonexclusive'].includes(exclusive))return;
 const laterVeto=rows.some((r:any)=>['refuse','withdraw','end'].includes(r.intent));
 if(raw.operation==='end'||raw.operation==='withdraw'){
  if(!rows.some((r:any)=>r.intent===raw.operation))return;
  return raw.operation==='end'?{...current,ended:true,exclusivity:current.exclusivity?'withdrawn':undefined,proposal:undefined}:{...current,exclusivity:'withdrawn',proposal:undefined};
 }
 if(!label&&!exclusive)return;
 if(laterVeto)return;
 const proposed=rows.find((r:any)=>r.intent==='propose');
 if(raw.operation==='propose'){if(!proposed)return;return {...current,proposal:{...(label?{label}:{}),...(exclusive?{exclusivity:exclusive}:{}),by:proposed.speaker,evidence:rows.map(withoutText)}};}
 const prior=current.proposal;
 const support=proposed||prior&&(!label||prior.label===label)&&(!exclusive||prior.exclusivity===exclusive)&&prior;
 const accepted=rows.find((r:any)=>r.intent==='accept'&&support&&r.speaker!==(proposed?.speaker||prior?.by));
 if(!support||!accepted||proposed&&proposed.stream===accepted.stream&&accepted.order<proposed.order)return;
 // A reply cannot confirm old evidence while ignoring a newer refusal/unrepresented turn.
 for(const speaker of ['owner','npc']){const last=evidence.filter(e=>e.speaker===speaker).at(-1);if(last&&!rows.some((r:any)=>r.ref===last.ref)&&!prior?.evidence.some(w=>w.ref===last.ref))return;}
 return {...current,...(label?{label,ended:false}:{}),...(exclusive?{exclusivity:exclusive}:{}),proposal:undefined};
}
export interface LoveApplyResult {status:'accepted'|'unchanged'|'missing'|'invalid'|'stale'|'duplicate';emotions:boolean;agreement:boolean;}
/** Invalid optional fields are isolated. The caller still commits valid dialogue. */
export function applyLoveFeedback(state:LoveState,frame:LoveFrame,raw:unknown):LoveApplyResult {
 state.insights||={};const previous=insightFor(state,frame.profileId)||emptyLoveInsight(),result=(status:LoveApplyResult['status'],emotions=false,agreement=false):LoveApplyResult=>{increment(previous,status==='accepted'?'assessed':status);set(state.insights!,frame.profileId,previous);return {status,emotions,agreement};};
 const v=object(raw);if(raw===undefined||raw===null)return result('missing');
 if(v.version!==1||v.profileId!==frame.profileId||v.revision!==frame.revision)return result('invalid');
 if(previous.revision!==frame.revision)return result('stale');
 if(previous.ledger.some(r=>r.key===frame.key))return result('duplicate');
 const anchors=frame.anchors.flatMap(ref=>frame.evidence.find(e=>e.ref===ref)||[]);
 if(!anchors.length)return result('invalid');
 if(anchors.every(a=>a.order<=(own(previous.watermarks,a.stream)??-1)))return result('duplicate');
 const before=structuredClone(previous.scores),agreementBefore=structuredClone(agreementFor(state,frame.profileId));
 const refs=Array.isArray(v.evidence)&&v.evidence.length<=12?v.evidence:[],basis=refs.flatMap((ref:any)=>frame.evidence.find(e=>e.ref===ref)||[]);
 const significance=['small','significant','exceptional'].includes(v.significance)?v.significance:'small';
 const pace=lovePreferences(state.preferences).pace,cap=({slow:{small:2,significant:5,exceptional:10},responsive:{small:3,significant:8,exceptional:15},dramatic:{small:5,significant:12,exceptional:20}} as const)[pace][significance as 'small'|'significant'|'exceptional'];
 let emotional=frame.emotions&&basis.length===refs.length&&basis.length>0&&basis.some(e=>frame.anchors.includes(e.ref));
 const initial=object(v.initial),changes=object(v.changes),next=structuredClone(before),reason=text(v.reason,240);
 if(!reason||[...Object.keys(initial),...Object.keys(changes)].some(k=>!LOVE_DIMENSIONS.includes(k as LoveDimension)))emotional=false;
 for(const k of LOVE_DIMENSIONS){if(own(initial,k)!==undefined){const n=initial[k];if(before[k]!==null||own(changes,k)!==undefined||!Number.isInteger(n)||n<0||n>100)emotional=false;else next[k]=n;}if(own(changes,k)!==undefined){const delta=changes[k];if(before[k]===null||!Number.isInteger(delta)||Math.abs(delta)>cap||before[k]!+delta<0||before[k]!+delta>100)emotional=false;else next[k]=before[k]!+delta;}}
 // No-change may be explicitly assessed without invented numeric fields.
 let agreement=validateAgreement(v.agreement,agreementBefore,frame.evidence);
 if(agreement?.exclusivity==='exclusive'&&agreementBefore.exclusivity!=='exclusive'&&Object.entries(state.agreements||{}).some(([id,a])=>id!==frame.profileId&&!a.ended&&a.exclusivity==='exclusive'))agreement=undefined;
 if((frame.emotions&&!emotional||v.agreement!==undefined&&!agreement)&&(emotional||agreement))increment(previous,'invalid');
 if(!emotional&&!agreement)return result('invalid');
 if(emotional)previous.scores=next;
 state.agreements||={};if(agreement)set(state.agreements,frame.profileId,agreement);
 previous.revision++;delete previous.stale;previous.reason=reason;
 const used=[...anchors,...(emotional?basis:[]),...(agreementBefore.proposal?.evidence||[])].map(e=>('text' in e?withoutText(e as LoveEvidence):e as LoveWitness));
 const agreementRefs=Array.isArray(v.agreement?.evidence)?v.agreement.evidence.map((x:any)=>x.ref):[];
 for(const e of frame.evidence)if(agreementRefs.includes(e.ref)||frame.outputRefs?.includes(e.ref))used.push(withoutText(e));
 const witnesses=[...new Map(used.map(w=>[w.ref,w])).values()];
 const row:LoveReceipt={key:frame.key,source:frame.source,before,after:structuredClone(previous.scores),agreementBefore,agreementAfter:structuredClone(agreement||agreementBefore),witnesses,reason:reason||'Relationship agreement updated from this exchange.',significance,baseline:LOVE_DIMENSIONS.some(k=>before[k]===null&&previous.scores[k]!==null),at:frame.at,revision:previous.revision};
 previous.ledger.push(row);previous.last=row;
 for(const e of [...anchors,...frame.evidence.filter(e=>frame.outputRefs?.includes(e.ref))])set(previous.watermarks,e.stream,Math.max(own(previous.watermarks,e.stream)??-1,e.order));
 const agreementChanged=!!agreement&&JSON.stringify(agreement)!==JSON.stringify(agreementBefore),scoreChanged=JSON.stringify(before)!==JSON.stringify(previous.scores);
 if(row.baseline||agreementChanged||significance!=='small'&&scoreChanged)previous.journal=[...previous.journal,row].slice(-50);
 if(previous.ledger.length>256){const removed=previous.ledger.shift()!;previous.checkpoint={scores:removed.after,agreement:removed.agreementAfter,witnesses:[...new Map([...previous.checkpoint.witnesses,...removed.witnesses].map(w=>[w.ref,w])).values()].slice(-256),watermarks:{...previous.checkpoint.watermarks}};for(const w of removed.witnesses)set(previous.checkpoint.watermarks,w.stream,Math.max(own(previous.checkpoint.watermarks,w.stream)??-1,w.order));}
 return result(scoreChanged||agreementChanged?'accepted':'unchanged',emotional,agreementChanged);
}
/** Missing retained evidence invalidates dependent updates, not the conversation. */
export function reconcileLoveEvidence(state:LoveState,id:string,evidence:LoveEvidence[],completeStreams:Set<string>):boolean {
 const current=insightFor(state,id);if(!current)return false;
 const valid=(w:LoveWitness)=>!completeStreams.has(w.stream)||evidence.some(e=>e.ref===w.ref&&e.hash===w.hash);
 const behind=current.checkpoint.witnesses.some(w=>!valid(w));
 const index=current.ledger.findIndex(r=>r.witnesses.some(w=>!valid(w)));
 if(!behind&&index<0)return false;
 const retained=behind?[]:current.ledger.slice(0,index),last=retained.at(-1);
 current.scores=behind?unknownLoveScores():structuredClone(last?.after||current.checkpoint.scores);
 state.agreements||={};set(state.agreements,id,behind?{}:structuredClone(last?.agreementAfter||current.checkpoint.agreement));
 current.ledger=retained;current.journal=current.journal.filter(r=>retained.some(x=>x.key===r.key));current.last=last;current.stale=true;current.revision++;current.assessmentReceipt=undefined;
 current.watermarks=behind?{}:{...current.checkpoint.watermarks};for(const r of retained)for(const w of r.witnesses)set(current.watermarks,w.stream,Math.max(own(current.watermarks,w.stream)??-1,w.order));
 if(behind)current.checkpoint={scores:unknownLoveScores(),agreement:{},witnesses:[],watermarks:{}};
 increment(current,'stale');return true;
}
export function stripLoveMetadata(value:string):string{return value.replace(/<lumistry-relationship\b[^>]*>[\s\S]*?<\/lumistry-relationship\s*>/gi,'').replace(/<lumistry-relationship\b[^>]*(?:\/\s*>|>[\s\S]*$)/gi,'');}
/** Native retention is not a branch edit. Fold affected reversible history into a checkpoint before trimming. */
export function checkpointLoveRetention(state:LoveState,id:string,retiredRefs:Set<string>):void {
 const i=insightFor(state,id);if(!i||!retiredRefs.size)return;
 let through=-1;for(let n=0;n<i.ledger.length;n++)if(i.ledger[n].witnesses.some(w=>retiredRefs.has(w.ref)))through=n;
 if(through>=0){const removed=i.ledger.splice(0,through+1),last=removed.at(-1)!;
 const all=[...i.checkpoint.witnesses,...removed.flatMap(r=>r.witnesses)];i.checkpoint={scores:structuredClone(last.after),agreement:structuredClone(last.agreementAfter),watermarks:{...i.checkpoint.watermarks},witnesses:[...new Map(all.filter(w=>!retiredRefs.has(w.ref)).map(w=>[w.ref,w])).values()].slice(-256)};
 for(const w of all)set(i.checkpoint.watermarks,w.stream,Math.max(own(i.checkpoint.watermarks,w.stream)??-1,w.order));}
 i.checkpoint.witnesses=i.checkpoint.witnesses.filter(w=>!retiredRefs.has(w.ref));
}
