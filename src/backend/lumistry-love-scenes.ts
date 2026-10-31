import {sanitizeNarrativeContent} from './narrative-content.js';
import type {PhoneState,PocketTurnCandidateOrigin} from '../types.js';
import {datingFor} from '../domain/lumistry.js';
import {loveConnection,loveGuidance} from '../domain/lumistry-love-context.js';
import {applyLoveFeedback,insightFor,loveFingerprint,lovePreferences,reconcileLoveEvidence,stripLoveMetadata,type LoveEvidence,type LoveFrame} from '../domain/lumistry-love.js';
/** Native roster must establish BOTH people. A date, timestamp, mention or model ID is insufficient. */
export function sceneLovePairs(state:PhoneState){
 const d=datingFor(state,state.pocketPersonaActorId),s=state.sceneSnapshot;
 if(!d.pipeline.rpBridge||!s||s.stale||!s.sourceMessageId)return {pairs:[],omitted:0,reason:'Scene continuity or a current verified scene is unavailable.'};
 if(!s.actors.some(a=>a.contactId===state.pocketPersonaActorId))return {pairs:[],omitted:0,reason:'The native scene roster does not verify the Persona’s physical participation. Automatic in-person assessment is disabled.'};
 const pairs=s.actors.flatMap(a=>{const p=d.profiles.find(p=>p.contactId===a.contactId),pair=p&&loveConnection(state,p.id);return pair&&pair.contact.presence.inScene?[pair]:[];});
 const linked=pairs.filter(p=>p.contact.source.kind==='character'&&p.contact.source.characterId===state.characterId),ordered=[...linked,...pairs.filter(p=>!linked.includes(p))];
 return {pairs:ordered.slice(0,3),omitted:Math.max(0,ordered.length-3),reason:ordered.length?'':'No eligible established connection has verified participation.'};
}
export function sceneLoveEvidence(state:PhoneState,messages:any[],candidateContent:(m:any,swipe:number)=>string,profileId:string):{evidence:LoveEvidence[];streams:Set<string>}{
 const eligible=sceneLovePairs(state).pairs.find(p=>p.p.id===profileId);if(!eligible)return {evidence:[],streams:new Set()};
 const stream='scene:'+state.chatId+':'+profileId,evidence:LoveEvidence[]=[];
 for(let index=0;index<messages.length;index++){const m=messages[index];if(!m?.id||!['user','assistant'].includes(m.role))continue;
 const swipe=Number.isInteger(m.swipe_id)?m.swipe_id:0,content=sanitizeNarrativeContent(m.role==='assistant'?candidateContent(m,swipe):typeof m.content==='string'?m.content:'',Number.MAX_SAFE_INTEGER).trim();if(!content)continue;
 // Only the roster's verified source onward is eligible. Old unrelated scenes never enter this pair.
 if(index<state.sceneSnapshot!.sourceMessageIndex)continue;
 if(m.role==='user'&&m.is_system===true)continue;
 evidence.push({ref:'host:'+m.id+':'+swipe,hash:loveFingerprint(content),stream,order:index,channel:'scene',speaker:m.role==='user'?'owner':'npc',text:content});}
 return {evidence,streams:new Set([stream])};
}
export function prepareLoveScene(state:PhoneState,messages:any[],origin:PocketTurnCandidateOrigin,candidateContent:(m:any,swipe:number)=>string,at:string){
 const status=sceneLovePairs(state),frames:LoveFrame[]=[];
 for(const pair of status.pairs){const basis=sceneLoveEvidence(state,messages,candidateContent,pair.p.id);reconcileLoveEvidence(pair.d.relationships,pair.p.id,basis.evidence,basis.streams);
 const prior=basis.evidence.filter(e=>!e.ref.startsWith('host:'+origin.hostMessageId+':')),last=prior.at(-1);if(!last)continue;
 frames.push({profileId:pair.p.id,revision:insightFor(pair.d.relationships,pair.p.id)?.revision||0,source:'scene',key:'scene:'+origin.hostMessageId+':'+origin.swipeId,at,evidence:prior,anchors:[last.ref],emotions:lovePreferences(pair.d.relationships.preferences).sources.scene});}
 return {frames,omitted:status.omitted,reason:status.reason,guidance:frames.length?'Write optional feedback only for these verified pairs. Return one hidden <lumistry-relationship>{"updates":[feedback,...]}</lumistry-relationship> block, never visible dialogue. At most one update per pair.\n'+frames.map(f=>loveGuidance(state,f,true)).join('\n\n'):''};
}
export function commitLoveScene(state:PhoneState,messages:any[],origin:PocketTurnCandidateOrigin,frames:LoveFrame[],candidateContent:(m:any,swipe:number)=>string){
 const target=messages.find(m=>m.id===origin.hostMessageId);if(!target||target.role!=='assistant'||target.swipe_id!==origin.swipeId)return false;
 const body=candidateContent(target,origin.swipeId),blocks=[...body.matchAll(/<lumistry-relationship\b[^>]*>([\s\S]*?)<\/lumistry-relationship\s*>/gi)];
 let raw:any;try{if(blocks.length!==1)return false;raw=JSON.parse(blocks[0][1]);}catch{return false;}
 if(!Array.isArray(raw.updates)||raw.updates.length>3)return false;
 let changed=false;for(const f of frames){if(!sceneLovePairs(state).pairs.some(p=>p.p.id===f.profileId))continue;
 const updates=raw.updates.filter((u:any)=>u?.profileId===f.profileId);if(updates.length!==1)continue;
 const basis=sceneLoveEvidence(state,messages,candidateContent,f.profileId),r=datingFor(state,state.pocketPersonaActorId).relationships;
 // The pre-request source must still exist unchanged, and the committed reply must be present.
 if(f.evidence.some(old=>!basis.evidence.some(e=>e.ref===old.ref&&e.hash===old.hash)))continue;
 const ref='host:'+origin.hostMessageId+':'+origin.swipeId,feedback=structuredClone(updates[0]);
 if(Array.isArray(feedback.evidence))feedback.evidence=feedback.evidence.map((v:any)=>v==='reply:0'?ref:v);
 // Native RP prose has no authoritative per-utterance speaker binding. Do not infer agreements from narrated quotations.
 delete feedback.agreement;
 const result=applyLoveFeedback(r,{...f,evidence:basis.evidence,outputRefs:[ref]},feedback);changed ||= result.status==='accepted'||result.status==='unchanged';}
 return changed;
}
/** Historical receipts can be audited without treating the current scene as a new encounter. */
export function auditLoveSceneBranches(state:PhoneState,messages:any[],candidateContent:(m:any,swipe:number)=>string):boolean {
 const r=state.lumistry?.[state.pocketPersonaActorId]?.relationships;if(!r?.insights)return false;
 let changed=false;for(const [id,i] of Object.entries(r.insights)){
 const retained=[...i.checkpoint.witnesses,...i.ledger.flatMap(row=>row.witnesses)].filter(w=>w.channel==='scene');if(!retained.length)continue;
 const evidence:LoveEvidence[]=retained.flatMap(w=>{const m=messages.find(m=>w.ref.startsWith('host:'+m.id+':'));if(!m||!['user','assistant'].includes(m.role))return [];
 const swipe=Number.isInteger(m.swipe_id)?m.swipe_id:0;if(w.ref!=='host:'+m.id+':'+swipe)return [];
 const content=sanitizeNarrativeContent(m.role==='assistant'?candidateContent(m,swipe):typeof m.content==='string'?m.content:'',Number.MAX_SAFE_INTEGER).trim();return [{...w,hash:loveFingerprint(content),text:content,speaker:m.role==='user'?'owner':'npc'} as LoveEvidence];});
 changed=reconcileLoveEvidence(r,id,evidence,new Set(retained.map(w=>w.stream)))||changed;}
 return changed;
}
