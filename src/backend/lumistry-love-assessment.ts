import type {PhoneState} from '../types.js';
import {datingFor} from '../domain/lumistry.js';
import {loveConnection,lovePhoneEvidence,loveGuidance} from '../domain/lumistry-love-context.js';
import {lovePreferences,loveFingerprint,insightFor,reconcileLoveEvidence,applyLoveFeedback,type LoveFrame} from '../domain/lumistry-love.js';
export function nativeLoveMessageActive(state:PhoneState,m:import('../types.js').PhoneMessage){if(m.candidateCommitState==='provisional')return false;const o=m.origin;if(!o||o.chatId!==state.chatId)return true;const selected=[...(state.hostSwipeSelections||[])].reverse().find(s=>s.hostMessageId===o.hostMessageId);return !selected||selected.swipeId===o.swipeId;}
export function assessmentBasis(state:PhoneState,id:string){
 const pair=loveConnection(state,id);if(!pair)throw new Error('Choose an active, unblocked match.');
 const prefs=lovePreferences(pair.d.relationships.preferences),all=lovePhoneEvidence(state,id,m=>nativeLoveMessageActive(state,m));
 reconcileLoveEvidence(pair.d.relationships,id,all.evidence,all.streams);
 const evidence=all.evidence.filter(e=>prefs.sources[e.channel]);
 const receipt=loveFingerprint([state.pocketPersonaActorId,id,prefs,evidence.map(({ref,hash})=>({ref,hash}))]);
 const insight=insightFor(pair.d.relationships,id),watermarks=insight?.watermarks||{};
 const anchors=evidence.filter(e=>e.order>(watermarks[e.stream]??-1)).map(e=>e.ref);
 return {pair,evidence,receipt,anchors,revision:insight?.revision||0};
}
export async function assessLove(state:PhoneState,id:string,requestId:string,at:string,generate:(input:any)=>Promise<any>,commit:(fn:(live:PhoneState)=>void)=>Promise<void>,current:()=>void):Promise<string>{
 const initial=assessmentBasis(state,id);
 if(!initial.evidence.length)return 'No authorized evidence from enabled sources. No request was made. In-person assessment also requires verified participation.';
 if(initial.pair.d.relationships.insights?.[id]?.assessmentReceipt===initial.receipt||!initial.anchors.length)return 'This evidence has already been assessed. No request was made.';
 const frame:LoveFrame={profileId:id,revision:initial.revision,source:initial.evidence.at(-1)!.channel,key:'assessment:'+requestId,at,evidence:initial.evidence,anchors:initial.anchors,emotions:true,assessment:true};
 const result=await generate({type:'quiet',messages:[{role:'system',content:loveGuidance(state,frame)+'\nExplicit assessment only: return {relationshipFeedback: feedback}. No dialogue, images or events.'},{role:'user',content:JSON.stringify({task:'relationship-assess',profileId:id})}],parameters:{temperature:.2}});current();
 let status='invalid';
 await commit(live=>{current();const actual=assessmentBasis(live,id);if(actual.receipt!==initial.receipt||actual.revision!==initial.revision)throw new Error('The connection changed during assessment. No stale update was applied.');
 const r=applyLoveFeedback(actual.pair.d.relationships,frame,result.relationshipFeedback);status=r.status;
 if(r.status==='accepted'||r.status==='unchanged')insightFor(actual.pair.d.relationships,id)!.assessmentReceipt=actual.receipt;
 });
 return status==='accepted'||status==='unchanged'?'Connection assessed. No dialogue or events were created.':'The optional assessment was invalid; feelings and agreements were kept.';
}
