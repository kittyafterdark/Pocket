export interface ReplyContextMessage {role:'system'|'user'|'assistant';content:string;}
export interface ReplyContextMetrics {
  version:'reply-context-2';targetCharacters:number;promptChars:number;overflowCharacters:number;
  omittedMessages:number;sections:Record<'system'|'dialogue'|'control',number>;
}
/** One final soft budget, after every native/relationship addition. Never clips a turn or identity. */
export function finalizeDatingReplyContext(input:readonly ReplyContextMessage[],target=10000):{messages:ReplyContextMessage[];metrics:ReplyContextMetrics} {
  const hasFeedback=input.some(m=>m.content.startsWith('LUMISTRY RELATIONSHIP FEEDBACK'));
  const seen=new Set<string>();
  const messages=input.filter(m=>{
    if(hasFeedback&&m.content.startsWith('CURRENT PAIR CONTINUITY —'))return false;
    if(m.role!=='system')return true;
    if(seen.has(m.content))return false;seen.add(m.content);return true;
  }).map(m=>({...m}));
  const control=(m:ReplyContextMessage)=>m.role==='user'&&m.content.startsWith('[OUT OF WORLD CONTROL]');
  const history=messages.filter(m=>m.role!=='system'&&!control(m));
  const protectedTurns=new Set<ReplyContextMessage>();
  const latest=history.at(-1);
  for(const m of [...history].reverse()){if(m.role!==latest?.role)break;protectedTurns.add(m);}
  let total=messages.reduce((n,m)=>n+m.content.length,0),omittedMessages=0;
  for(const m of history){if(total<=target)break;if(protectedTurns.has(m))continue;messages.splice(messages.indexOf(m),1);total-=m.content.length;omittedMessages++;}
  const sections={system:0,dialogue:0,control:0};
  for(const m of messages)sections[control(m)?'control':m.role==='system'?'system':'dialogue']+=m.content.length;
  return {messages,metrics:{version:'reply-context-2',targetCharacters:target,promptChars:total,overflowCharacters:Math.max(0,total-target),omittedMessages,sections}};
}
