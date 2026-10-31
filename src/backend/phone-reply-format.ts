import {stripLoveMetadata} from '../domain/lumistry-love.js';
import {parseGeneratedObject} from './structured.js';

/** Plain completed dialogue carries no structured side effects or inferred decision. */
export function parsePhoneReply(content:unknown,finishReason?:string):Record<string,unknown> {
 try{return parseGeneratedObject(content)}catch(error){
  if(typeof content!=='string'||finishReason!=='stop')throw error;
  const raw=stripLoveMetadata(content).trim();let message=raw;
  if(raw.startsWith('{')){
   // Escape literal control characters only. Do not invent quotes, keys or closures.
   let quoted=false,escaped=false,normalized='';
   for(const char of raw){
    if(quoted&&char.charCodeAt(0)<32){if(escaped)throw error;normalized+=JSON.stringify(char).slice(1,-1);continue;}
    normalized+=char;
    if(escaped){escaped=false;continue;}if(quoted&&char==='\\'){escaped=true;continue;}if(char==='"')quoted=!quoted;
   }
   if(normalized!==raw)return parseGeneratedObject(normalized);
  }
  if(raw.startsWith('"')){const value=JSON.parse(raw);if(typeof value!=='string')throw error;message=value;}
  else if(/[{}\[\]`]/.test(raw)||/^\s*(?:<(?:think|analysis|reasoning|html|script|assistant)|analysis\b|reasoning\b|assistant\s*:|here(?:'s| is) (?:the )?(?:json|response|reply|object)\b|as an ai\b|i (?:cannot|can't) (?:assist|comply)\b)/i.test(raw))throw error;
  if(/^(?:null|true|false|-?\d+(?:\.\d+)?)$/.test(raw))throw error;
  if(!message.trim()||message.length>8000||/<\/?(?:think|analysis|reasoning)\b/i.test(message))throw error;
  return {message,after:{state:'remote'},photo:null,suggestion:null};
 }
}
