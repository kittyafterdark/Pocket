import { runPocketGeneration, type PocketGenerationHost } from './generation.js'
import { normalizeAuthoringPolicy } from '../domain/authoring-policy.js'
import { pendingKey, readPending, keepPending } from './pending-generation.js'
import { attachDiscoveryRun } from './lumistry-run-receipts.js'
import { generationDeadline } from './generation-deadline.js'
import type { PocketGenerationRun } from '../types.js'

/** Lumistry authoring policy and volatile receipts wrap the current Pocket generation API. */
export async function runCommunityNativeGeneration(host:PocketGenerationHost,task:PocketGenerationRun['task'],requestId:string,input:Record<string,any>,userId?:string):Promise<any> {
  if(!['lumistry-author','lumistry-image-check','lumistry-self_generate'].includes(task))return runPocketGeneration(host,task,requestId,input,userId)
  const preferences=await host.loadPreferences(userId),policy=normalizeAuthoringPolicy(preferences.authoring)
  const key=typeof input.receiptKey==='string'?await pendingKey(JSON.stringify([userId||'',input.receiptKey]),{messages:input.messages,parameters:input.parameters,policy,mode:preferences.generationMode,connection:preferences.sidecarConnectionId,model:preferences.sidecarModelOverride}):''
  const cached=key?readPending(key):undefined;if(cached)return cached
  const request:Record<string,any>={...input,parameters:{...input.parameters},reasoning:policy.reasoning==='inherit'?{source:'inherit'}:policy.reasoning==='off'?{source:'off'}:{source:'custom',apiReasoning:true,effort:'low'}}
  delete request.receiptKey;delete request.contextMetrics;delete request.diagnosticScope;delete request.progressRequestId
  if(policy.outputTokens)request.parameters.max_tokens=policy.outputTokens
  const safeHost={...host,savePreferences:async(value:any,user?:string)=>{try{return await host.savePreferences(value,user)}catch{host.send({type:'lumiphone:diagnostic',appScope:'lumistry',diagnostic:{layer:'storage',code:'history-write-failed',saved:true,retryable:true}},user);return value}}}
  const result=await generationDeadline(policy.timeoutSeconds,input.signal,signal=>runPocketGeneration(safeHost,task,requestId,{...request,signal},userId,{automaticRetry:false,connectionId:policy.connectionId||undefined,transport:policy.transport,preservePartial:true,progressRequestId:input.progressRequestId}))
  const usage=result.usage||{},receipt={requestId,usageStatus:usage.total_tokens!==undefined?'reported' as const:'unavailable' as const,promptTokens:usage.prompt_tokens,completionTokens:usage.completion_tokens,totalTokens:usage.total_tokens}
  // Cache only bounded answer text and numeric usage; provider reasoning never enters receipts.
  const answer={content:result.content,finish_reason:result.finish_reason,usage:result.usage?{prompt_tokens:usage.prompt_tokens,completion_tokens:usage.completion_tokens,total_tokens:usage.total_tokens}:undefined}
  attachDiscoveryRun(answer,receipt);if(key)keepPending(key,answer)
  return answer
}
