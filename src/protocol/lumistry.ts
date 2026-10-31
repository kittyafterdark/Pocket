/** Wire shapes are data, never authority. The backend still resolves user/owner/actor
 * and checks field-specific saved baselines under its native lock. */
export type LumistryActionFamily='discovery'|'world'|'wishlist'|'profile'|'tools'|'relationship'|'setup'|'diagnostics'|'preferences';
export interface LumistryOperation {requestId?:string;deviceOwnerActorId?:string;expectedStorageRevision?:number;baseline?:string;}
export type LumistryRequest= LumistryOperation & (
 | {family:'wishlist';action:'filters';filters:Record<string,unknown>}
 | {family:Exclude<LumistryActionFamily,'wishlist'>;action:string;[key:string]:unknown}
);
export type LumistryResult = {type:'lumiphone:dating_result';requestId:string;chatId:string;characterId:string;ownerActorId:string;stateRevision:number} & (
 | {phase:'working'|'done'|'stopped';message?:string}
 | {phase:'relationship_sources';sources:Array<{channel:'dating'|'direct';text:string}>;unavailable:number}
 | {phase:'world_sources';sources:unknown[];warnings:string[]}
 | {phase:'diagnostics_preview';bundle:unknown}
 | {phase:string;[key:string]:unknown}
);
const core=new Set('accept archive_delete archive_measurements archive_read bank_reassess bank_settings cancel clear_error discard_discovery discard_manual discover edit enable_background enable_replies encounter enrich exchange export_diagnostics filters force_match generate generation_settings height_units image_check like love_preferences message_photo pass photo photo_add photo_remove pipeline_settings recover refresh relationship_assess relationship_sources remove reset_passes retry_slot rewrite_item self self_generate self_preferences setting_new species_accept species_reject theme unmatch voice_lab world world_accept world_sources'.split(' '));
export function parseLumistryRequest(value:unknown):LumistryRequest {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid Lumistry request.');
 const v=value as Record<string,unknown>,action=v.action;
 if(typeof action!=='string'||!/^[a-z_]{1,40}$/.test(action)||!core.has(action)&&! /^(tools_|setup_|saved_profile_)/.test(action))throw new Error('Unknown Lumistry action.');
 for(const key of ['requestId','deviceOwnerActorId','profileId','conversationId','slotId'])if(v[key]!==undefined&&(typeof v[key]!=='string'||(v[key] as string).length>180))throw new Error('Invalid Lumistry operation identity.');
 if(v.expectedStorageRevision!==undefined&&(!Number.isSafeInteger(v.expectedStorageRevision)||Number(v.expectedStorageRevision)<0))throw new Error('Invalid saved revision.');
 if(v.baseline!==undefined&&typeof v.baseline!=='string')throw new Error('Invalid saved baseline.');
 if(action==='filters'&&(!v.filters||typeof v.filters!=='object'||Array.isArray(v.filters)))throw new Error('Invalid wishlist draft.');
 let family:LumistryActionFamily=action==='filters'?'wishlist':action.startsWith('world')||action.startsWith('species_')||action==='setting_new'?'world':action.startsWith('relationship_')||action==='love_preferences'?'relationship':action.startsWith('setup_')?'setup':action.startsWith('tools_')?'tools':action.includes('diagnostics')||action.startsWith('archive_')?'diagnostics':action.startsWith('saved_profile_')||['self','self_generate','self_preferences','edit','accept','remove','photo','photo_add','photo_remove','message_photo','enrich','generate'].includes(action)?'profile':['discover','retry_slot','recover','cancel','pass','like','force_match','unmatch','reset_passes','discard_discovery','discard_manual','clear_error'].includes(action)?'discovery':'preferences';
 return {...v,action,family} as LumistryRequest;
}
