import {runCommunityNativeGeneration} from './community-generation.js'
import { Lumistry } from './lumistry.js'
import { collectWorldEvidence } from './lumistry-world-evidence.js'
import { loadDatingPersonaEvidence } from './lumistry-persona-evidence.js'
import { normalizeAuthoringPolicy } from '../domain/authoring-policy.js'
import { runPocketGeneration, type PocketGenerationHost } from './generation.js'
import { runStructuredJsonGeneration } from './structured-generation.js'
import { attachDiscoveryRun, discoveryRun } from './lumistry-run-receipts.js'
import { pendingKey, readPending, keepPending, forwardPendingReceipt } from './pending-generation.js'
import type { DevicePreferences, PocketGenerationRun } from '../types.js'

type AppHost = ConstructorParameters<typeof Lumistry>[0]
type Core = Pick<AppHost,'loadState'|'saveState'|'sendState'|'send'|'withStateLock'|'stateKey'|'nowIso'|'id'|'camera'|'cancelCamera'|'activeScope'|'getMessages'|'validateImage'|'cancelReply'> & {
  spindle:any
  loadPreferences(user?:string):Promise<DevicePreferences>
  savePreferences(value:DevicePreferences,user?:string):Promise<unknown>
}

/** App authoring uses the existing Pocket generation connection and authenticated scope. */
export async function communityGeneration(host:PocketGenerationHost,task:PocketGenerationRun['task'],requestId:string,input:Record<string,any>,userId?:string):Promise<Record<string,any>> {
  const raw = task==='lumistry-author' || task==='lumistry-image-check'
  const request={...input};delete request.privateDating
  if(!raw)return runStructuredJsonGeneration(host,task,requestId,request,userId)
  const response=await runCommunityNativeGeneration(host,task,requestId,input,userId)
  const usage=response.usage||{},receipt=discoveryRun(response)||{requestId,usageStatus:usage.total_tokens!==undefined?'reported' as const:'unavailable' as const,promptTokens:usage.prompt_tokens,completionTokens:usage.completion_tokens,totalTokens:usage.total_tokens}
  const authored={authoredText:response.content,finishReason:response.finish_reason};forwardPendingReceipt(response,authored);attachDiscoveryRun(authored,receipt)
  return authored
}

export function createCommunityRuntime(core:Core):Lumistry {
  const {spindle}=core
  const read=(path:string,userId?:string)=>spindle.userStorage.getJson(path,{fallback:null,userId})
  const write=(path:string,value:unknown,userId?:string)=>spindle.userStorage.setJson(path,value,{indent:2,userId})
  const archivePath=(id:string)=>`pocket/lumistry-archives/${encodeURIComponent(id)}.json`
  return new Lumistry({ ...core, loadStateForTransaction:core.loadState,
    permitted:p=>spindle.permissions.has(p),
    generationRetryEnabled:async user=>(await core.loadPreferences(user)).automaticGenerationRetry,
    authoringPolicy:async user=>normalizeAuthoringPolicy((await core.loadPreferences(user)).authoring),
    diagnosticPreferences:core.loadPreferences,
    readSetupPresets:user=>read('pocket/lumistry-setup-presets.json',user),writeSetupPresets:(value,user)=>write('pocket/lumistry-setup-presets.json',value,user),
    readSavedDatingProfiles:user=>read('pocket/lumistry-saved-profiles.json',user),writeSavedDatingProfiles:(value,user)=>write('pocket/lumistry-saved-profiles.json',value,user),
    writeAuthoringArchive:(id,value,user)=>write(archivePath(id),value,user),readAuthoringArchive:(id,user)=>read(archivePath(id),user),deleteAuthoringArchive:(id,user)=>spindle.userStorage.delete(archivePath(id),user),
    generate:(task,id,input,user)=>communityGeneration(core as PocketGenerationHost,task as PocketGenerationRun['task'],id,input,user),
    resolveMacros:(template,scope)=>spindle.macros.resolve(template,scope),
    worldEvidence:(state,user,selected)=>collectWorldEvidence(state,state.chatId.startsWith('_freeform_')?{...spindle,world_books:{...spindle.world_books,getActivated:async()=>[]}}:spindle,p=>spindle.permissions.has(p),user,selected),
    personaEvidence:(state,user)=>loadDatingPersonaEvidence(state.pocketPersona,spindle.personas,()=>spindle.permissions.has('personas'),user),
    configureActivity:async(kind,user)=>{const preferences=await core.loadPreferences(user);if(kind==='background')preferences.ambientMessaging='sparse';else preferences.autoReplyAfterSend=true;await core.savePreferences(preferences,user)},
    readInspectionImage:async(imageId,userId)=>{
      if(!spindle.permissions.has('images')||typeof spindle.images.readBinary!=='function')throw new Error('This host does not support reading image pixels for inspection.')
      const image=await spindle.images.get(imageId,{specificity:'full',userId})
      if(!image||!['image/png','image/jpeg','image/webp'].includes(image.mime_type))throw new Error('Choose an accessible PNG, JPEG or WebP image.')
      const bytes:Uint8Array=await spindle.images.readBinary(imageId,userId)
      if(bytes.length>8_000_000)throw new Error('Choose an image under 8 MB.')
      let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768))
      return {data:btoa(binary),mime_type:image.mime_type}
    },
  })
}
