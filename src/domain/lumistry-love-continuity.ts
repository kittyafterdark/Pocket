import type {PhoneState} from '../types.js';
import {insightFor,agreementFor} from './lumistry-love.js';
export function loveOwnContinuity(state:PhoneState,profileId:string):string {
 const d=state.lumistry?.[state.pocketPersonaActorId];if(!d)return '';const i=insightFor(d.relationships,profileId),a=agreementFor(d.relationships,profileId);if(!i&&!Object.keys(a).length)return '';
 return 'CURRENT PAIR CONTINUITY — NPC OWN-PRIVATE FEELINGS (not mindreading, consent or a threshold directive): '+JSON.stringify({feelings:i?.stale?'needs reassessment':i?.scores,agreements:a})+'. Accepted current pair agreements supersede historical profile wording for this pair only. Preserve orientation, boundaries, other partners and unrelated commitments. Never publish changes automatically.';
}
