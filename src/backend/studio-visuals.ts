import type {ImagePurpose} from './image-jobs.js'

export interface StudioImage {
  version:1
  chatId:string
  characterId:string
  prompt:string
  negativePrompt:string
  model:string
  connectionId:string
  parameters:Record<string,unknown>
}

/** Studio owns binding/look/style resolution; Pocket supplies only this request's scene. */
export async function resolveStudioImage(api:Pick<import('lumiverse-spindle-types').SpindleAPI,'macros'>,context:{chatId:string;characterId:string},scene:string,purpose:ImagePurpose,userId?:string):Promise<StudioImage|undefined> {
  const token=`{{swarm_visual_request::${encodeURIComponent(JSON.stringify({...context,scene,purpose}))}}}`
  const result=await api.macros.resolve(token,{...context,userId,commit:false})
  if(!result.text||result.text===token||result.text.includes('{{swarm_visual_request'))return
  let image:StudioImage
  try{image=JSON.parse(decodeURIComponent(result.text))}catch{throw new Error('Studio returned an invalid visual profile. Update Swarm Studio before retrying.')}
  if(image.version!==1||image.chatId!==context.chatId||image.characterId!==context.characterId||typeof image.prompt!=='string'||!image.prompt.trim()||image.prompt.length>64000||typeof image.negativePrompt!=='string'||typeof image.model!=='string'||typeof image.connectionId!=='string'||!image.connectionId||!image.parameters||typeof image.parameters!=='object'||Array.isArray(image.parameters))throw new Error('Studio did not resolve the requested character’s current visuals. Reopen the correct roleplay and retry.')
  return image
}
