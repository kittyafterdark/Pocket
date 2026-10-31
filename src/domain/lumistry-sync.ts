import type {PhoneState} from '../types.js';
export function applyDatingSlice(state:PhoneState,payload:any,chatId:string,characterId:string):{kind:'ignore'}|{kind:'recover'}|{kind:'apply';state:PhoneState}{
 if(payload.chatId!==chatId||payload.characterId!==characterId||payload.ownerActorId!==state.pocketPersonaActorId||state.chatId!==chatId||state.characterId!==characterId)return {kind:'ignore'};
 if(payload.version!==1||!payload.dating||typeof payload.dating!=='object'||Array.isArray(payload.dating)||!Number.isSafeInteger(payload.storageRevision)||!Number.isSafeInteger(payload.baseRevision)||payload.baseRevision<0||typeof payload.updatedAt!=='string')return {kind:'recover'};
 if(payload.storageRevision<=(state.storageRevision||0))return {kind:'ignore'};
 if(payload.baseRevision!==(state.storageRevision||0))return {kind:'recover'};
 return {kind:'apply',state:{...state,storageRevision:payload.storageRevision,updatedAt:payload.updatedAt,lumistry:{...state.lumistry,[payload.ownerActorId]:payload.dating}}};
}
