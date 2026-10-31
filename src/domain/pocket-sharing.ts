import type { PhoneState } from '../types.js'
import { committedConversationMessages } from './lumistry-evidence.js'
import { normalizeLumistryCapture, type LumistryCapture } from './lumistry-sharing.js'

export interface PocketShareSource { id:string; title:string; items:Array<{id:string;speaker:string;text:string;photoDescription:string}> }
export interface PocketCaptureRequest { sourceId:string; ids:string[]; caption?:string }

/** Only saved content visible to this phone owner is offered; private profile definitions are excluded. */
export function pocketShareSources(state:PhoneState):PocketShareSource[] {
  const owner=state.pocketPersonaActorId,sources:PocketShareSource[]=[]
  for(const c of state.conversations){
    if(!c.includesPocketPersona || c.archived || c.channel==='dating' && c.datingOwnerId!==owner)continue
    const items=committedConversationMessages(c,state).filter(m=>m.sender!=='system' && m.status!=='pending' && m.status!=='failed').map(m=>({id:m.id,speaker:m.sender==='persona'?state.pocketPersona.displayName||'You':m.senderName,text:m.text,photoDescription:m.datingPhoto?.description||m.photo?.prompt||(m.imageId?'Photo attachment; visual contents are not available.':'')}))
    if(items.length)sources.push({id:`conversation:${c.id}`,title:`${c.channel==='dating'?'Lumistry':'Messages'} · ${c.title}`,items})
  }
  if(state.notes.length)sources.push({id:'notes',title:'Notes',items:state.notes.map(n=>({id:n.id,speaker:n.title,text:n.body,photoDescription:''}))})
  if(state.events.length)sources.push({id:'calendar',title:'Timeline',items:state.events.map(e=>({id:e.id,speaker:e.title,text:[e.whenText||e.start,e.description,(e.participantNames||[]).join(', ')].filter(Boolean).join('\n'),photoDescription:''}))})
  if(state.trackers.length)sources.push({id:'trackers',title:'Trackers',items:state.trackers.map(t=>({id:t.id,speaker:t.label,text:t.kind==='state'?t.state:`${t.value}${t.unit||''}`,photoDescription:''}))})
  if(state.weather.location)sources.push({id:'weather',title:'Weather',items:[{id:'current',speaker:state.weather.location,text:`${state.weather.condition} · ${state.weather.temperature}°${state.weather.unit}\n${state.weather.details||''}`,photoDescription:''}]})
  for(const app of ['twitter','instagram','tumblr','discord'] as const){
    const posts=(state.social?.posts||[]).filter(p=>p.app===app && (app!=='discord'||state.social?.servers.some(server=>server.memberActorIds.includes(owner)&&server.channels.some(channel=>channel.id===p.channelId))))
    if(posts.length)sources.push({id:app,title:app==='twitter'?'Twitter':app==='instagram'?'Instagram':app==='tumblr'?'Tumblr':'Discord',items:posts.map(p=>({id:p.id,speaker:p.account.name,text:[p.title,p.text].filter(Boolean).join('\n'),photoDescription:p.photo||(p.imageId?'Photo attachment; visual contents are not available.':'')}))})
  }
  return sources
}

export function createPocketCapture(state:PhoneState,request:PocketCaptureRequest):LumistryCapture {
  if(!Array.isArray(request.ids)||!request.ids.length||request.ids.length>6||new Set(request.ids).size!==request.ids.length)throw new Error('Choose one to six different items.')
  const source=pocketShareSources(state).find(s=>s.id===request.sourceId)
  if(!source)throw new Error('That source is no longer available on your phone.')
  const entries=source.items.filter(item=>request.ids.includes(item.id))
  if(entries.length!==request.ids.length)throw new Error('A selected item changed or is no longer available. Preview it again.')
  const capture=normalizeLumistryCapture({kind:'screenshot',title:source.title,caption:request.caption||'',entries})
  if(!capture)throw new Error('This selection is too large to share whole. Choose fewer items.')
  return capture
}
