import type {PhoneState,PhoneMessage,PocketConversation} from '../types.js';
/** This selector supplies evidence, never permission to cross a channel or establish a meeting. */
export function committedMessage(message:PhoneMessage,state?:Pick<PhoneState,'chatId'|'hostSwipeSelections'>):boolean {
  if(message.sender==='system'||message.status==='pending'||message.status==='failed'||message.candidateCommitState==='provisional')return false;
  const origin=message.origin;
  if(!origin)return true;
  if(origin.sourceInvalidated)return false;
  if(!state)return false; // Host-origin rows require a trusted branch snapshot.
  if(origin.chatId!==state.chatId)return false;
  const selected=[...(state.hostSwipeSelections||[])].reverse().find(x=>x.hostMessageId===origin.hostMessageId);
  return !selected||selected.swipeId===origin.swipeId;
}
export function committedConversationMessages(conversation:PocketConversation,state?:Pick<PhoneState,'chatId'|'hostSwipeSelections'>):PhoneMessage[] {
  return conversation.messages.filter(m=>committedMessage(m,state));
}
export function evidenceSpeaker(m:PhoneMessage,owner:string):string|undefined {
  return m.senderActorId||(m.sender==='persona'?owner:m.senderContactId);
}
/** Allocate complete newest turns. The newest turn survives a soft target overflow. */
export function wholeRecentMessages<T>(messages:readonly T[],size:(value:T)=>number,target:number,limit=20):T[] {
  const out:T[]=[];let used=0;
  for(const value of messages.slice(-limit).reverse()) {
    const length=size(value);
    if(out.length&&used+length>target)break;
    out.push(value);used+=length;
  }
  return out.reverse();
}
