import {lovePhonePair,lovePhoneEvidence} from '../domain/lumistry-love-context.js';
import type {PhoneState,PocketConversation} from '../types.js';
/** Only relevant state invalidates an in-flight reply; reading it or changing another app does not. */
export function replySnapshot(state:PhoneState,c:PocketConversation):string {
    const ids=c.participantActorIds?.length?c.participantActorIds:c.participantContactIds;
    const dating=c.channel==='dating'?state.lumistry?.[c.datingOwnerId||state.pocketPersonaActorId]:undefined;
    const decision=dating?.decisions.find(d=>d.conversationId===c.id),profile=dating?.profiles.find(p=>p.id===decision?.profileId);
    const {updatedAt:_updatedAt,...persona}=state.pocketPersona;
    const identity=(p:any)=>p?{alias:p.alias,age:p.age,anonymous:p.anonymous,fields:p.fields,privateFields:p.privateFields,hiddenFields:p.hiddenFields,person:p.person,phoneProfile:p.phoneProfile,bio:p.bio,development:{revision:p.development?.revision,match:p.development?.match?.facts,portrayal:p.development?.portrayal?.behavior}}:null;
    const pair=lovePhonePair(state,c);
    return JSON.stringify({love:pair?{revision:pair.d.relationships.insights?.[pair.p.id]?.revision,preferences:pair.d.relationships.preferences,blocked:pair.d.tools?.blocked,decision:pair.x,evidence:lovePhoneEvidence(state,pair.p.id).evidence.map(e=>[e.ref,e.hash])}:undefined,owner:state.pocketPersonaActorId,persona,storyTime:state.roleplayNow,scene:state.sceneSnapshot,swipes:state.hostSwipeSelections,
        conversation:{id:c.id,channel:c.channel,owner:c.datingOwnerId,archived:c.archived,ids,availability:c.availability,pause:c.pause,burst:c.outgoingBurst?.id,messages:c.messages.map(m=>({id:m.id,text:m.text,speaker:m.senderActorId||m.senderContactId||m.sender,photo:m.datingPhoto,capture:m.sharedCapture,commit:m.candidateCommitState,status:m.status==='pending'||m.status==='failed'?m.status:'committed'}))},
        contacts:state.contacts.filter(p=>ids.includes(p.id)).map(p=>({id:p.id,name:p.name,identity:p.identityBrief,description:p.description,profile:p.phoneProfile,presence:p.presence,source:p.source,messaging:p.messagingPolicy.remoteEligible})),actors:(state.discoveredActors||[]).filter(a=>ids.includes(a.id)).map(a=>({id:a.id,name:a.displayName,normalizedName:a.normalizedName,relationship:a.relationship,promotedContactId:a.promotedContactId})),
        contentPreferences:dating?.experiencePreferences,self:identity(dating?.self),profile:identity(profile),match:decision?.status});
}
