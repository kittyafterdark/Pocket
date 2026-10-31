import {normalizeAuthoringPolicy} from './authoring-policy.js';
import type {DiscoverySlot} from './lumistry-pipeline.js';

/** Only execution settings can reopen a provider pause; spending limits are separate. */
export function providerExecutionSignature(policy:unknown):string {
 const p=normalizeAuthoringPolicy(policy);
 return 'provider-stalled:'+JSON.stringify({connectionId:p.connectionId,transport:p.transport,reasoning:p.reasoning,outputTokens:p.outputTokens,timeoutSeconds:p.timeoutSeconds});
}
/** Called only on the next user-authorized discovery invocation, never dispatches itself. */
export function recoverProviderSlot(slot:DiscoverySlot,policy:unknown):boolean {
 if(slot.status!=='failed'||slot.quarantinedProgress||!slot.failureSignature?.startsWith('provider-stalled:')||slot.failureSignature===providerExecutionSignature(policy))return false;
 const p=slot.progress;
 if(p?.task==='photos'){
  for(let i=0;i<slot.photoCount;i++)if(!p.draft.photoPlan?.[i])delete slot.unitAttempts?.['photo_'+(i+1)];
 }else if(p)delete slot.unitAttempts?.[p.task];
 slot.status='pending';slot.attempts=0;slot.failureSignature=undefined;
 return true;
}
