import type {PhoneState} from '../types.js';
import {datingThread} from './lumistry.js';
import {normalizeDatingAttachment} from './lumistry-person.js';
import {PHOTO_TEXT_LIMITS} from './lumistry-photo-contract.js';
/** Explicit Persona-authored media; no vision inference, identity edits or renderer instructions. */
export async function preparePersonaDatingPhoto(state:PhoneState,conversationId:string,value:unknown,source:string,validateImage:(id:string)=>Promise<void>) {
 const c=state.conversations.find(c=>c.id===conversationId);
 if(source!=='user'||!c||c.channel!=='dating'||c.kind!=='direct'||c.archived||!c.includesPocketPersona||c.datingOwnerId!==state.pocketPersonaActorId)throw new Error('Choose an active match on your own Lumistry profile.');
 datingThread(state,c);
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Describe the photo you want to send.');
 const raw=value as Record<string,unknown>;
 const description=typeof raw.description==='string'?raw.description.trim():'';
 if(!description||description.length>PHOTO_TEXT_LIMITS.description)throw new Error('Add a visible photo description, up to 1,500 characters.');
 if(raw.includesSelf!==undefined&&typeof raw.includesSelf!=='boolean')throw new Error('Choose whether the photo shows you.');
 if(raw.aspect!==undefined&&(typeof raw.aspect!=='string'||!['portrait','landscape','square'].includes(raw.aspect)))throw new Error('Choose portrait, landscape or square.');
 if(raw.imageId!==undefined&&(typeof raw.imageId!=='string'||!raw.imageId.trim()||raw.imageId.length>160))throw new Error('Choose a saved Gallery image.');
 const imageId=typeof raw.imageId==='string'?raw.imageId.trim():undefined;
 if(imageId)await validateImage(imageId);
 const datingPhoto=normalizeDatingAttachment({description,subjectIds:raw.includesSelf===true?['self']:[],aspect:raw.aspect||'portrait'},!!imageId)!;
 return {imageId,datingPhoto};
}
