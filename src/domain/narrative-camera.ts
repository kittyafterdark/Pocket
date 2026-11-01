import type {DevicePreferences} from '../types.js'

type CameraSettings=Pick<DevicePreferences,'captureNarrativePhotos'|'inlineNarrativePhotos'>

export function narrativeCameraGuidance(settings:CameraSettings):string {
  if(!settings.captureNarrativePhotos)return 'NARRATIVE CAMERA: Automatic rendering of photos taken in the story is disabled. Ordinary photo-taking may remain narrative canon. Use camera only for an explicit image-generation request; do not generate merely because someone takes a photo.'
  return 'NARRATIVE CAMERA — ENABLED BY THE USER: When a character actually takes a new photo in the narrative, call Pocket Action with action="camera", payload.scene describing that exact new photo, and payload.narrative=true. This is REQUIRED even for private photos, off-screen photos, camera-roll items or a hidden folder, with no message being sent. Earlier turns lacking camera calls do not disable this setting. Do not invent extra photos or render the same capture twice. Taking a photo is separate from sending it: preserve its photographer, privacy and scene knowledge; never create a message just to save it. '+(settings.inlineNarrativePhotos?'If the result returns imageMarkdown, place that exact Markdown on its own line at the capture moment in the prose. It is an illustration for the reader, not evidence that another character saw the photo. Do not invent an image URL or reuse an earlier image.':'Keep generated photos in Gallery; do not insert image Markdown into the prose.')
}

export function narrativePhotoMarkdown(result:{imageId?:unknown;imageUrl?:unknown},settings:CameraSettings):string|undefined {
  if(!settings.captureNarrativePhotos||!settings.inlineNarrativePhotos||typeof result.imageId!=='string'||!result.imageId||typeof result.imageUrl!=='string')return
  const url=result.imageUrl
  if(!/^(?:https:\/\/|\/api\/)/i.test(url)||/[<>\r\n]/.test(url))return
  return `![Narrative photo](<${url}>)`
}
