import { setup } from '../../src/frontend.js'
import {assignPocketWallpaper,personaWallpaperActive} from '../../src/domain/wallpaper-scope.js'
import { SocialWorld } from '../../src/backend/social-world.js'
import { SocialDms } from '../../src/backend/social-dms.js'
import { SocialAutomation } from '../../src/backend/social-automation.js'
import { socialAppSettings, normalizeSocialState } from '../../src/domain/social.js'
import { defaultPreferences, themePalette } from '../../src/domain/preferences.js'
import { normalizeTracker } from '../../src/domain/trackers.js'
import { normalizeContactCollections, ensureDirectConversation } from '../../src/domain/contacts.js'
import { normalizeLauncherLayout, setPocketAppInstalled } from '../../src/domain/launcher.js'

// A real controller + stylesheet, with controlled Spindle hosts and no user data.
const style = document.createElement('style')
style.textContent = 'body{margin:0;background:#171a22} #dock{height:100dvh;display:grid;place-items:center} #picker{display:none} #floating{position:fixed;right:16px;bottom:20px}'
document.head.append(style)
const dock = document.createElement('div'), floating = document.createElement('div'), picker = document.createElement('div')
dock.id = 'dock'; floating.id = 'floating'; picker.id = 'picker'; document.body.append(dock, floating, picker)
const state: any = {
  version: 11, chatId: 'launcher-fixture', characterId: 'fixture-character', characterName: 'Alice',
  roleplayNow: '2026-10-29T16:30:00Z', pocketPersonaActorId: 'fixture-persona', pocketPersona: {},
  setup: { initialized: true, dismissed: true }, contacts: [], conversations: [], discoveredActors: [],
  actorMemories: [], actorMemoryVersion: 1, notes: [], events: [], relays: [], references: [], groupBatches: [], trackers: [
    normalizeTracker({ id: 'health', kind: 'meter', presentation: 'vitals', label: 'Health', key: 'health', value: 75, unit: '%', target: { type: 'scene', id: '', label: 'Scene' } }, { now: '2026-10-29T16:30:00Z' })!,
    normalizeTracker({ id: 'departure', kind: 'timer', presentation: 'timer', label: 'Departure', key: 'departure', value: 120, max: 3600, unit: 's', direction: 'down', updateMode: 'automatic', ratePerHour: -3600, clock: 'real', lastUpdated: new Date().toISOString(), target: { type: 'scene', id: '', label: 'Scene' } }, { now: new Date().toISOString() })!,
    normalizeTracker({ id: 'mission', kind: 'state', presentation: 'state', label: 'Mission status', key: 'mission', states: ['Awaiting confirmation from mission control'], state: 'Awaiting confirmation from mission control', target: { type: 'scene', id: '', label: 'Scene' } }, { now: '2026-10-29T16:30:00Z' })!,
  ],
  notifications: [], activities: [], processedCommands: [], suppressedContactSourceKeys: [], sceneSnapshot: null,
  weather: { temperature: 21, unit: 'C', condition: 'Clear' },
  launcherLayouts: JSON.parse(localStorage.getItem('launcher-layouts') || '{}'),
  social: normalizeSocialState(JSON.parse(localStorage.getItem('social-world') || 'null')),
}
const fixtureNpcBank: any = { entries: [
  { id: 'fixture-npc-fern', name: 'Fern Finch', normalizedName: 'fern finch', tags: [], aliases: [], role: 'Bookshop owner', identityBrief: 'A cheerful reader', avatarUrl: '', phoneProfile: { personality: 'Warm and curious', appearance: '', textingStyle: 'Wry' } },
  { id: 'fixture-npc-mika', name: 'Mika Moon', normalizedName: 'mika moon', tags: [], aliases: [], role: 'Night owl', identityBrief: 'A late night café regular', avatarUrl: '', phoneProfile: { personality: 'Playful', appearance: '', textingStyle: 'Short and casual' } },
], groups: [] }
const fixtureBankFriend = async (id: string) => { const entry = fixtureNpcBank.entries.find((entry: any) => entry.id === id); return entry ? { id: entry.id, kind: 'npc-bank' as const, name: entry.name, role: entry.role, personality: entry.phoneProfile.personality } : null }
const preferences = defaultPreferences(); preferences.reducedMotion = true
let receive: (payload: any) => void = () => {}
const mediaMode=new URLSearchParams(location.search).has('contactsMedia'),mediaSends:any[]=[]
let mediaPersona={id:'media-persona',name:'Till Park'},mediaFailed=false
const mediaSources=Array.from({length:420},(_,n)=>({kind:'character',sourceId:'media-char-'+n,name:'Character '+String(n+1).padStart(3,'0'),role:n===419?'The astronomer':'From your library',description:'',avatarUrl:''}))
let messageContinuityEnabled = false
const deliver = (reason = 'refresh') => receive({ type: 'lumiphone:state', state: structuredClone(state), preferences, npcBank: fixtureNpcBank, ...(mediaMode?{swarmProfile:{source:'swarm_studio',available:true,status:'connected',checkpoint:'A_very_long_checkpoint_name_that_should_stay_inside_advanced_settings.safetensors'},activePersona:mediaPersona,resolvedWallpapers:{deviceHome:{url:preferences.homeWallpaper.source?'/photo.svg':'',status:'ready',sourceLabel:'Default home'},deviceChat:{status:'empty',sourceLabel:'Theme'},personaHome:{url:personaWallpaperActive(preferences.personaAppearance[mediaPersona.id],'home')?'/photo.svg':'',status:'ready',sourceLabel:'Persona home'},personaChat:{status:'empty',sourceLabel:'Theme'}}}:{}), ...(messageContinuityEnabled ? { capabilities: { panels: true, generation: true, chatMutation: true, images: true } } : {}), reason })
let fixtureSocialSerial = Number(localStorage.getItem('social-fixture-serial') || '0')
const nextSocialSerial = () => { const next = ++fixtureSocialSerial; localStorage.setItem('social-fixture-serial', String(next)); return next }
const socialWorld = new SocialWorld({
  loadState: async () => structuredClone(state),
  saveState: async next => { Object.assign(state, next); localStorage.setItem('social-world', JSON.stringify(state.social)) },
  sendState: async () => deliver('social'), send: payload => receive(payload),
  getMessages: async () => [{ role: 'assistant', content: 'A public festival is taking place by the harbor.' }],
  runStructuredGeneration: async (_task, _id, request) => {
    if (new URLSearchParams(location.search).has('socialFail')) throw new Error('Fixture social connection failed. Retry Refresh.')
    await new Promise(resolve => setTimeout(resolve, new URLSearchParams(location.search).has('socialSlow') ? 1500 : 60))
    const input = JSON.parse((request.messages as Array<{ content: string }>)[1].content), recent = input.recentPosts || []
    if (input.discordConversation) { const person=input.members[0];return { posts:[{author:person.name,handle:person.handle,text:'Right here with you. One conversational reply. '+nextSocialSerial(),replyTo:input.messageId,gifQuery:'happy wave'}],reactions:[{accountId:person.id,postId:input.messageId,emoji:'💜'}] } }
    if (input.speaker && typeof input.comment === 'string') return { replies: [{ text: 'A fixture reply, right here in your thread.' }] }
    if (input.server && !input.channel && Array.isArray(input.server.people)) return { participants: [{ name: 'Nightglass', handle: 'moon.dust', bio: 'Loves midnight coffee' }, { name: 'Page Turner', bio: 'Always reading something' }, { name: 'Lantern', bio: 'Keeps the conversation going' }] }
    const own = [...recent].reverse().find((post: any) => post.author === 'You'), version = nextSocialSerial()
    return { posts: [
      { author: 'Harbor Dispatch', handle: 'harbor_dispatch', text: `Festival lights are on. The night market opens at six. Edition ${version}`, photo: 'Paper lanterns reflected in the harbor at dusk', title: 'A little light, a little life', tags: ['harbor', 'little moments'] },
      { author: 'Moss', handle: 'moss_and_coffee', text: own ? 'Meet you there! Save me something sweet.' : `Another day of buying books faster than I can read them. ${version}`, replyTo: own?.id, tags: ['the reading life'] },
      { author: 'Juniper', handle: 'juniper', text: `Anyone else still awake? Festival edition ${version}`, photo: 'A bookstore window lit warmly against the evening rain', tags: ['night owl'] },
    ] }
  },
  listGuestCards: async (current, app, owner) => {
    const settings = socialAppSettings(normalizeSocialState(current.social), owner, app), cards = []
    for (const id of settings.friendEntryIds || []) { const friend = await fixtureBankFriend(id); if (friend) cards.push(friend) }
    if (settings.randomCards) cards.push({ id: 'fixture-library-card', kind: 'character' as const, name: 'Library Guest', role: 'A guest from your character library', personality: 'Cheerful' })
    return cards
  },
  resolveGif: async query => ({url:'https://media.tenor.com/fixture/pocket.gif',description:query}),
  resolveBankFriend: fixtureBankFriend,
  resolveBankCast: async id => { const cast=fixtureNpcBank.groups.find((group:any)=>group.id===id); return cast ? (await Promise.all(cast.memberIds.map(fixtureBankFriend))).filter(Boolean) : null },
  generatePhoto: async input => { await new Promise(resolve => setTimeout(resolve, 30)); input.signal.throwIfAborted(); if (new URLSearchParams(location.search).has('socialPhotoFail')) throw new Error('Fixture feed photo failed'); return { imageId: 'fixture-feed-photo', imageUrl: '/photo.svg' } },
  withStateLock: async (_key, callback) => callback(), stateKey: (chat, character) => `${chat}:${character}`, nowIso: () => '2026-10-29T16:30:00Z', makeId: prefix => `${prefix}-${Date.now()}-${nextSocialSerial()}`, resolveImage: async () => '/photo.svg',
})
let fixtureSocialNow = Date.now()
const socialFixtureAutomation = new SocialAutomation({ loadState: async () => structuredClone(state), refresh: (...args) => socialWorld.refresh(...args), nowMs: () => fixtureSocialNow, schedule: () => ({}), cancelSchedule: () => {} })
const socialFixtureDms = new SocialDms({
  loadState: async () => structuredClone(state), saveState: async next => { Object.assign(state, next); localStorage.setItem('social-world', JSON.stringify(state.social)) }, sendState: async () => deliver('social_dm'), send: payload => receive(payload),
  runStructuredGeneration: async () => { await new Promise(resolve => setTimeout(resolve, 60)); return { text: 'A fixture private reply, just for this inbox.' } },
  withStateLock: async (_key, callback) => callback(), stateKey: (chat, character) => `${chat}:${character}`, makeId: prefix => `${prefix}-${Date.now()}-${nextSocialSerial()}`, resolveFriend: fixtureBankFriend,
})
// Placement fixture uses the public host contract: handles and drag deltas are
// layout pixels while the element renders inside a CSS zoom layer.
const floatGeometryMode = new URLSearchParams(location.search).get('floatGeometry')
const fixtureUiScale = () => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lumiverse-ui-scale')) || 1
if (floatGeometryMode) Object.assign(preferences, JSON.parse(localStorage.getItem('float-preferences') || '{}'))
const widget = (root: HTMLElement, options: any) => {
  const basic = { root, widgetId:'fixture', moveTo(_x:number,_y:number) {}, getPosition:()=>({x:10,y:10}), onDragEnd:(_handler:any)=>()=>{}, setVisible() {}, isVisible:()=>true, isFullscreen:()=>innerWidth<600, setFullscreen() {}, setSize() {}, setTouchScrollMode() {}, destroy() {} }
  if (!floatGeometryMode || options.width !== 58) return basic
  let position = {...options.initialPosition}, dragEnd = (_pos:any)=>{}, moves = 0
  const paint = () => { root.style.transform=`translate3d(${position.x}px,${position.y}px,0)` }
  const clamp = (x:number,y:number) => ({x:Math.max(12,Math.min(x,innerWidth/fixtureUiScale()-70)),y:Math.max(12,Math.min(y,innerHeight/fixtureUiScale()-70))})
  Object.assign(root.style,{left:'0px',top:'0px',right:'auto',bottom:'auto',width:'58px',height:'58px',touchAction:'none'})
  paint()
  root.onpointerdown = event => {
    const start={...position}, x=event.clientX, y=event.clientY, scale=fixtureUiScale(); let dragging=false
    root.setPointerCapture(event.pointerId)
    root.onpointermove = next => { if(Math.hypot(next.clientX-x,next.clientY-y)>7) dragging=true; if(dragging){position=clamp(start.x+(next.clientX-x)/scale,start.y+(next.clientY-y)/scale);paint()} }
    root.onpointerup = () => {root.onpointermove=null;root.onpointerup=null;if(dragging){moves++;dragEnd({...position})}}
  }
  ;(window as any).floatPlacementSnapshot=()=>({position:{...position},moves})
  return {...basic,moveTo(x:number,y:number){position=clamp(x,y);paint()},getPosition:()=>({...position}),onDragEnd(handler:any){dragEnd=handler;return()=>{dragEnd=()=>{}}}}
}
const fixturePhotoBytes = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVO0AAAAASUVORK5CYII='), letter => letter.charCodeAt(0))
const fixtureMessageJobs = new Map<string, { cancelled: boolean; conversationId: string }>()
let fixtureMessageSerial = 0
const fixtureTagHandlers=new Map<string,(payload:any)=>void>()
const ctx: any = {
  components:{mountModelCombobox(target:HTMLElement,options:any){const input=document.createElement('input');input.placeholder=options.placeholder;input.setAttribute('aria-label','Checkpoint override');input.value=options.value||'';input.onchange=()=>options.onChange(input.value);target.replaceChildren(input);return{destroy(){target.replaceChildren()}}}},
  uploads: { pickFile: async () => {
    await new Promise(resolve => setTimeout(resolve, new URLSearchParams(location.search).has('pickerSlow') ? 350 : 5))
    return [{ bytes: fixturePhotoBytes, mimeType: 'image/png', name: 'Uploaded sunset.png' }]
  } },
  dom: { addStyle(css: string) { const sheet = document.createElement('style'); sheet.textContent = css; document.head.append(sheet); return () => sheet.remove() }, findMessageElement: () => null, uninject: (node: HTMLElement) => node.remove() },
  ui: {
    showModal(options:any){const root=document.createElement('dialog');root.setAttribute('role','dialog');root.setAttribute('aria-label',options.title);root.style.cssText='box-sizing:border-box;width:min('+options.width+'px,calc(100% - 24px));max-height:calc(100dvh - 80px);margin:auto;border:1px solid #ffffff30;border-radius:20px;padding:18px;background:#141319;color:white;overflow:auto';const close=document.createElement('button');close.textContent='Close';close.setAttribute('aria-label','Close '+options.title);close.onclick=()=>{root.close();root.remove()};root.append(close);document.body.append(root);root.showModal();return{root,dismiss(){root.close();root.remove()}}},
    ...(floatGeometryMode === 'native' ? {geometry:{layoutViewportSize:()=>({width:innerWidth/fixtureUiScale(),height:innerHeight/fixtureUiScale()}),toLayoutPx:(pixels:number)=>pixels/fixtureUiScale()}} : {}),
    registerDrawerTab: () => ({ root: picker, setBadge() {}, activate() {}, onActivate: () => () => {}, destroy() {} }),
    registerInputBarAction: () => ({ onClick: () => () => {}, destroy() {}, setLabel() {}, setSubtitle() {}, setEnabled() {} }),
    createFloatWidget: (options: any) => widget(options.width === 58 ? floating : dock, options),
    requestDockPanel: () => ({ root: dock, panelId: 'fixture-dock', expand() {}, collapse() {}, onVisibilityChange: () => () => {}, setTitle() {}, setSize() {}, setVisible() {}, destroy() {} }),
  },
  messages: {
    registerTagInterceptor: (options:any,handler:any) => {fixtureTagHandlers.set(options.tagName,handler);return()=>fixtureTagHandlers.delete(options.tagName)},getLatestMessageId:()=>null,
    renderWidget:(options:any)=>{
      const host=document.getElementById(options.messageId)!, frame=document.createElement('iframe');frame.title='Pocket event quickstart';frame.style.cssText='border:0;width:100%;height:340px;display:block';frame.srcdoc=options.html
      frame.onload=()=>{frame.style.height=Math.min(options.maxHeight,Math.max(options.minHeight,frame.contentDocument!.body.scrollHeight+8))+'px'}
      host.append(frame);return()=>frame.remove()
    }
  },
  events: { on: () => () => {} }, permissions: { getGranted: async () => ['ui_panels'] },
  getActiveChat: () => ({ chatId: state.chatId, characterId: state.characterId }),
  onBackendMessage: (handler: typeof receive) => { receive = handler; return () => {} }, ready() {},
  sendToBackend(payload: any) {
    if(mediaMode){
      mediaSends.push(structuredClone(payload))
      if(payload.type==='lumiphone:gallery_set_wallpaper'||payload.type==='lumiphone:set_wallpaper'||payload.type==='lumiphone:upload_wallpaper_asset')setTimeout(()=>{
        if(!mediaFailed&&new URLSearchParams(location.search).has('wallpaperFail')){mediaFailed=true;receive({type:'lumiphone:error',requestId:payload.requestId,error:'Fixture wallpaper save failed. Try again.'});return}
        assignPocketWallpaper(preferences,payload,payload.type==='lumiphone:gallery_set_wallpaper'?{kind:'gallery',imageId:payload.imageId}:payload.type==='lumiphone:upload_wallpaper_asset'?{kind:'asset',assetId:'media-upload'}:payload.source)
        deliver('preferences');receive({type:'lumiphone:gallery_action_done',requestId:payload.requestId,message:'Saved for '+(payload.personaName||'All phones')})
      },80)
      if(payload.type==='lumiphone:save_preferences'){Object.assign(preferences,payload.preferences);deliver('preferences')}
      if(payload.type==='lumiphone:image_options')setTimeout(()=>receive({type:'lumiphone:image_options',connections:[],swarmProfile:{source:'swarm_studio',available:true,status:'connected',checkpoint:'A_very_long_checkpoint_name_that_should_stay_inside_advanced_settings.safetensors'}}),0)
      if(payload.type==='lumiphone:camera_generate')setTimeout(()=>receive({type:'lumiphone:camera_done',requestId:payload.requestId,imageId:'media-generated',imageUrl:'/photo.svg'}),50)
    }
    if (floatGeometryMode && payload.type === 'lumiphone:save_preferences') {Object.assign(preferences,payload.preferences);localStorage.setItem('float-preferences',JSON.stringify(preferences));deliver('preferences')}

    if (payload.type === 'lumiphone:list_contact_sources') setTimeout(() => receive({ type: 'lumiphone:contact_sources', sources: mediaMode?mediaSources:[{ kind: 'character', sourceId: 'alice', name: 'Alice', role: 'A familiar face' }] }), 0)
    if (payload.type === 'lumiphone:generate_contact') {
      ;(window as any).lastNpcRequest = payload
      setTimeout(() => receive({ type: 'lumiphone:operation_progress', task: 'npc-contact', requestId: payload.requestId, phase: 'generating', message: 'Writing profile' }), 5)
      setTimeout(() => receive({ type: 'lumiphone:contact_draft', requestId: payload.requestId, chatId: state.chatId, characterId: state.characterId, draft: { name: 'Fern Vale', role: 'Florist', identityBrief: 'Keeps a quiet flower shop.', sourceDescription: payload.description, accent: '#8b7dff', phoneProfile: { personality: 'Warm', appearance: 'Green coat', textingStyle: 'Brief' }, messagingStyle: { talkativeness: 50, fragmentation: 20 }, avatarUrl: '/photo.svg' } }), 80)
      setTimeout(() => receive({ type: 'lumiphone:operation_progress', task: 'npc-contact', requestId: payload.requestId, phase: 'generating', message: 'Writing profile' }), 120)
    }

    if (payload.type === 'lumiphone:generate_message') {
      const job = { cancelled: false, conversationId: payload.conversationId }; fixtureMessageJobs.set(payload.requestId, job)
      const progress = (phase: string) => receive({ type: 'lumiphone:message_progress', requestId: payload.requestId, chatId: state.chatId, characterId: state.characterId, conversationId: payload.conversationId, speakerContactId: 'continuity-contact', phase })
      setTimeout(() => { if (!job.cancelled) progress('checking') }, 10)
      setTimeout(() => { if (!job.cancelled) progress('generating') }, 50)
      setTimeout(() => {
        if (!job.cancelled) {
          const conversation = state.conversations.find((entry: any) => entry.id === payload.conversationId)
          if (conversation) {
            conversation.messages.push({ id: `continuity-reply-${++fixtureMessageSerial}`, sender: 'contact', senderActorId: 'continuity-contact', senderContactId: 'continuity-contact', senderName: 'Dane', senderAccent: '#8b7dff', text: `Current-day reply ${fixtureMessageSerial}: That plan was from Tuesday. I came over then; how are things today?`, createdAt: state.roleplayNow, storyClock: { roleplayNow: state.roleplayNow, source: 'narrative', precision: 'exact', label: '' }, read: true, status: 'delivered' }); conversation.updatedAt = state.roleplayNow
            deliver('message')
          }
          progress('done')
        }
        fixtureMessageJobs.delete(payload.requestId)
      }, new URLSearchParams(location.search).has('messageSlow') ? 1200 : 280)
    }
    if (payload.type === 'lumiphone:cancel_message_generation') {
      for (const [requestId, job] of fixtureMessageJobs) if (job.conversationId === payload.conversationId) { job.cancelled = true; receive({ type: 'lumiphone:message_progress', requestId, chatId: state.chatId, characterId: state.characterId, conversationId: job.conversationId, phase: 'done' }) }
    }

    if (payload.type === 'lumiphone:social_dm_send' || payload.type === 'lumiphone:social_participants_generate') setTimeout(() => {
      const context = { chatId: state.chatId, characterId: state.characterId }
      const operation = payload.type === 'lumiphone:social_dm_send' ? socialFixtureDms.send(context, payload.deviceOwnerActorId, payload.accountId, payload.text, payload.threadId, payload.requestId, undefined, payload.app === 'tumblr' ? 'tumblr' : 'instagram') : socialWorld.generateParticipants(context, payload.deviceOwnerActorId, payload.serverId, payload.requestId)
      void operation.catch(error => receive({ type: 'lumiphone:error', requestId: payload.requestId, error: error.message }))
    }, 10)
    if (payload.type === 'lumiphone:social_gif_search') setTimeout(() => receive({type:'lumiphone:social_gifs',requestId:payload.requestId,gifs:[{url:'https://media.tenor.com/fixture/pocket.gif',description:payload.query}]}),30)
    if (payload.type === 'lumiphone:social_photo_generate') {
      const slow = new URLSearchParams(location.search).has('socialPhotoSlow')
      setTimeout(() => receive({ type: 'lumiphone:camera_progress', requestId: payload.requestId, phase: 'generating', message: 'Fixture photo developing…' }), 10)
      // Deliberately deliver even after Cancel to prove the controller ignores stale completion.
      setTimeout(() => {
        if (new URLSearchParams(location.search).has('socialPhotoFail')) receive({ type: 'lumiphone:error', requestId: payload.requestId, error: 'Fixture image provider failed. Try again.' })
        else receive({ type: 'lumiphone:camera_done', requestId: payload.requestId, imageId: 'fixture-generated-photo', imageUrl: '/photo.svg' })
      }, slow ? 650 : 50)
    }
    if (payload.type === 'lumiphone:social_photo_upload') setTimeout(() => {
      if (payload.app === 'discord' && typeof payload.targetServer !== 'string') { receive({type:'lumiphone:error',requestId:payload.requestId,error:'Server pictures require a destination.'});return }
      if (new URLSearchParams(location.search).has('uploadFail')) receive({ type: 'lumiphone:error', requestId: payload.requestId, error: 'Fixture image upload failed. Try again.' })
      else receive({ type: 'lumiphone:social_photo_uploaded', requestId: payload.requestId, imageId: 'fixture-uploaded-photo', imageUrl: '/photo.svg' })
    }, 25)
    if (payload.type === 'lumiphone:social_photo_cancel') setTimeout(() => receive({ type: 'lumiphone:camera_cancelled', requestId: payload.requestId }), 5)
    if (payload.type === 'lumiphone:gallery_list') setTimeout(() => receive({ type: 'lumiphone:gallery', requestId: payload.requestId, scope: payload.scope, data: [{ id: 'fixture-photo', filename: 'Harbor sunset', url: '/photo.svg', thumbnailUrl: '/photo.svg', fullUrl: '/photo.svg' }], total: 1 }), 10)
    if (payload.type === 'lumiphone:social_refresh' || payload.type === 'lumiphone:social_mutate' || payload.type === 'lumiphone:social_cancel') {
      const context = { chatId: state.chatId, characterId: state.characterId }, owner = payload.deviceOwnerActorId
      if (payload.type === 'lumiphone:social_cancel') socialWorld.cancel(context, owner, payload.operationRequestId)
      else setTimeout(() => {
        const operation = payload.type === 'lumiphone:social_refresh' ? socialWorld.refresh(context, owner, payload.app, payload.channelId, payload.requestId) : socialWorld.mutate(context, owner, payload, payload.requestId)
        void operation.then(() => payload.type === 'lumiphone:social_mutate' ? socialFixtureAutomation.observe(context) : undefined).catch(error => receive({ type: 'lumiphone:error', requestId: payload.requestId, error: error.message }))
      }, 10)
    }
    if (payload.type === 'lumiphone:get_state') setTimeout(() => { deliver(); void socialFixtureAutomation.observe({ chatId: state.chatId, characterId: state.characterId }) }, 0)
    if (payload.type === 'lumiphone:save_launcher') setTimeout(() => {
      if (new URLSearchParams(location.search).has('fail')) {
        receive({ type: 'lumiphone:error', requestId: payload.requestId, error: 'Fixture save failed. Retry your changes.' }); return
      }
      state.launcherLayouts[payload.deviceOwnerActorId] = normalizeLauncherLayout({ ...payload.layout, installedApps: state.launcherLayouts[payload.deviceOwnerActorId]?.installedApps })
      localStorage.setItem('launcher-layouts', JSON.stringify(state.launcherLayouts)); deliver('launcher')
      receive({ type: 'lumiphone:launcher_saved', requestId: payload.requestId })
    }, 20)
    if (payload.type === 'lumiphone:app_install') setTimeout(() => {
      if (new URLSearchParams(location.search).has('storeFail')) { receive({ type: 'lumiphone:error', requestId: payload.requestId, error: 'Fixture app update failed. Try again.' }); return }
      const layout = setPocketAppInstalled(normalizeLauncherLayout(state.launcherLayouts[payload.deviceOwnerActorId]), payload.appId, payload.installed)
      state.launcherLayouts[payload.deviceOwnerActorId] = layout
      localStorage.setItem('launcher-layouts', JSON.stringify(state.launcherLayouts)); deliver('app_install')
      const acknowledge = () => receive({ type: 'lumiphone:app_install_done', requestId: payload.requestId, layout })
      if (new URLSearchParams(location.search).has('storeSlow')) {
        setTimeout(() => deliver('notification'), 40)
        setTimeout(acknowledge, 120)
      } else acknowledge()
      void socialFixtureAutomation.observe({ chatId: state.chatId, characterId: state.characterId })
    }, 20)
  },
}
let disposeContactsMediaFixture=setup(ctx)
;(window as any).remountContactsMediaFixture=()=>{disposeContactsMediaFixture();disposeContactsMediaFixture=setup(ctx);deliver('preferences')}
// Simulate the host's canonical installed-PWA safe-top contract.
if (innerWidth < 600) document.documentElement.style.setProperty('--app-interactive-safe-top', '47px')
;(window as any).seedMessageContinuityFixture = (variant = 'remote') => {
  messageContinuityEnabled = true; fixtureMessageSerial = 0
  const oldAt = '2026-10-27T08:17:00Z', current = '2026-10-29T10:52:00Z', exact = (roleplayNow: string) => ({ roleplayNow, source: 'narrative', precision: 'exact', label: '' })
  const collection = normalizeContactCollections({ version: 11, contacts: [{ id: 'continuity-contact', name: 'Dane', role: 'Friend', source: { kind: 'npc', origin: 'manual' }, presence: { inScene: variant === 'present', lastSceneAt: oldAt } }] }, { characterId: '_none', characterName: '', now: current, personaActorId: state.pocketPersonaActorId, makeId: prefix => `${prefix}-continuity` })
  const conversation = ensureDirectConversation(collection, 'continuity-contact', oldAt, () => 'continuity-direct')
  conversation.messages = Array.from({ length: 32 }, (_, index) => ({ id: `continuity-old-${index}`, sender: index % 2 ? 'persona' as const : 'contact' as const, senderActorId: index % 2 ? state.pocketPersonaActorId : 'continuity-contact', senderContactId: index % 2 ? undefined : 'continuity-contact', senderName: index % 2 ? 'You' : 'Dane', senderAccent: '#8b7dff', text: index === 0 ? 'Be there in 20, keep my spot warm.' : `Earlier exchange ${index}: a remembered conversation from Tuesday, before the completed visit.`, createdAt: oldAt, storyClock: exact(oldAt), read: true, status: 'read' as const }))
  conversation.messages.push({ id: 'continuity-current', sender: 'persona', senderActorId: state.pocketPersonaActorId, senderName: 'You', senderAccent: '', text: 'I spent the night at a laptop screen. How are you today?', createdAt: current, storyClock: exact(current), read: true, status: 'sent' })
  conversation.availability = variant === 'present' || variant === 'pending-local' ? { state: 'local', reason: 'in_scene' } : { state: 'remote' }; conversation.updatedAt = current
  state.contacts = collection.contacts; state.conversations = collection.conversations; state.roleplayNow = current; state.roleplayClockSource = 'narrative'; state.roleplayClockPrecision = 'exact'; state.roleplayTimezoneOffsetMinutes = 0
  state.events = [{ id: 'continuity-visit', title: 'Dane came over', description: 'Completed visit from the earlier exchange.', completed: true, start: oldAt, end: oldAt, whenKind: 'exact', whenText: 'Tuesday morning', createdBy: 'character', color: '#8b7dff', lane: 'Personal', kind: 'phone-handoff', actorContactIds: ['continuity-contact'], participantActorIds: ['continuity-contact', state.pocketPersonaActorId], source: { app: 'messages', conversationId: conversation.id } }]
  state.relays = [{ id: 'continuity-relay', chatId: state.chatId, characterId: state.characterId, contactId: 'continuity-contact', conversationId: conversation.id, kind: 'local', reason: 'in_scene', actorState: 'continued_in_person', conversationTail: { text: 'Dane came over on Tuesday.', recentMessageIds: ['continuity-old-0'] }, latestExchange: 'Be there in 20, keep my spot warm.', sourceMessageId: 'continuity-old-0', timelineEventId: 'continuity-visit', createdAt: oldAt, status: variant === 'pending-local' ? 'pending' : 'consumed', consumedAt: variant === 'pending-local' ? undefined : oldAt, continuation: { state: variant === 'pending-local' ? 'blocked' : 'completed' } }]
  deliver('continuity_fixture')
}
;(window as any).seedMessageCallFixture = () => {
  ;(window as any).seedMessageContinuityFixture('remote')
  const conversation=state.conversations[0],base=conversation.messages.at(-1)!
  conversation.messages.push(
    {...base,id:'call-connected',sender:'system',senderActorId:undefined,senderName:'Pocket',text:'Call connected · Speakerphone',status:'read',call:{callId:'fixture-call',status:'connected',speakerphone:true}},
    {...base,id:'call-ended',sender:'system',senderActorId:undefined,senderName:'Pocket',text:'Call ended · Speakerphone · 2:05',status:'read',call:{callId:'fixture-call',status:'ended',speakerphone:true,durationSeconds:125}},
    {...base,id:'call-missed',sender:'system',senderActorId:undefined,senderName:'Pocket',text:'Missed call',status:'read',call:{callId:'fixture-missed',status:'missed',speakerphone:false}}
  )
  state.relays=[];state.events=[];deliver('call_history_fixture')
}
;(window as any).seedEventMessageContinuityFixture = () => {
  ;(window as any).seedMessageContinuityFixture('remote')
  const conversation = state.conversations[0], base = conversation.messages[0], at = state.roleplayNow
  const clock = { source:'manual',precision:'exact',roleplayNow:at,label:'Event quickstart' }
  conversation.messages = [
    { ...base, id:'pre-event-time',text:'Thursday, five thirty. Coffee under the green awning.',createdAt:at,storyClock:clock },
    { ...base, id:'pre-event-eta',text:"not a chance. i'll be there at 5:15 and look desperate about it.",createdAt:at,storyClock:clock },
    { ...base, id:'post-event-human',sender:'persona',senderActorId:state.pocketPersonaActorId,senderName:'You',text:'I had a good time. Did you make it home?',createdAt:at,storyClock:clock },
  ] as any
  state.events = [{ ...state.events[0],id:'coffee-scene',kind:'event',title:'Coffee together',completed:true,startedAt:at,phoneHistoryBoundary:{conversationId:conversation.id,messageIds:['pre-event-time','pre-event-eta']} }]
  state.relays=[]; state.roleplayClockSource='manual'; state.roleplayClockPrecision='exact'
  deliver('event_continuity_fixture')
}
;(window as any).notifyMessageContinuityFixture = (messageId = 'continuity-old-12') => receive({ type: 'lumiphone:notification', notification: { id: 'continuity-notification', app: 'messages', title: 'Earlier message from Dane', body: 'Open this recorded exchange.', createdAt: state.roleplayNow, read: false, deviceOwnerActorId: state.pocketPersonaActorId, route: { app: 'messages', conversationId: 'continuity-direct', messageId } } })
;(window as any).appendMessageContinuityFixture = () => {
  const conversation = state.conversations.find((entry: any) => entry.id === 'continuity-direct'); if (!conversation) return
  conversation.messages.push({ id: `continuity-incoming-${++fixtureMessageSerial}`, sender: 'contact', senderActorId: 'continuity-contact', senderContactId: 'continuity-contact', senderName: 'Dane', senderAccent: '#8b7dff', text: `Incoming current-day message ${fixtureMessageSerial}.`, createdAt: state.roleplayNow, storyClock: { roleplayNow: state.roleplayNow, source: 'narrative', precision: 'exact', label: '' }, read: true, status: 'delivered' }); deliver('message')
}
;(window as any).addMessageContinuityRelay = () => {
  const source = state.relays[0]; if (!source) return
  state.relays.push({ ...structuredClone(source), id: `continuity-late-relay-${++fixtureMessageSerial}`, status: 'consumed', continuation: { state: 'completed' } }); deliver('message')
}

let tumblrExploreSnapshot: PhoneState['social'] | undefined
;(window as any).setTumblrExploreOverflow = (enabled: boolean) => {
  if (enabled) {
    tumblrExploreSnapshot = structuredClone(state.social)
    const original = state.social?.posts.find(post => post.app === 'tumblr' && !post.replyTo && !post.reblogOf)
    if (!original || !state.social) throw new Error('Seed a Tumblr root before the Explore stress test.')
    const tags = ['harbor', 'a very long trending tag '.repeat(12)]
    for (let index = 0; index < 12; index++) state.social.posts.push({ ...structuredClone(original), id: 'explore-stress-' + index,
      text: 'A long local preview for a horizontal Tumblr post rail. '.repeat(10), tags })
  } else state.social = tumblrExploreSnapshot
  deliver('social')
}

;(window as any).pulseSocialFixture = () => { deliver('social'); deliver('social') }
;(window as any).seedDiscordCastFixture = () => { fixtureNpcBank.groups.push({ id:'fixture-cast-night', name:'Night cast', memberIds:fixtureNpcBank.entries.map((entry:any)=>entry.id) }); deliver('npc_bank') }
;(window as any).refreshLauncherFixture = () => deliver()
;(window as any).completeSocialFixtureTurn = (turnId: string) => socialFixtureAutomation.run({ chatId: state.chatId, characterId: state.characterId }, turnId)
;(window as any).advanceSocialFixtureTime = async (minutes: number) => { fixtureSocialNow += minutes * 60_000; await socialFixtureAutomation.tick() }
;(window as any).deliverSocialOperationFixture = (payload: Record<string, unknown>) => receive(payload)
;(window as any).updateLauncherTracker = (value: number) => { state.trackers[0].value = value; deliver('tracker') }
;(window as any).removeLauncherTracker = () => { state.trackers = state.trackers.filter((tracker: any) => tracker.id !== 'health'); deliver('tracker') }
;(window as any).updateLauncherWeatherClock = () => {
  state.weather = { ...state.weather, location: 'Harbor', temperature: -4, condition: 'Snow' }
  state.roleplayClockSource = 'narrative'; state.roleplayClockPrecision = 'relative'; state.roleplayClockLabel = 'Afternoon'
  deliver('weather')
}
;(window as any).setLauncherTheme = (theme: 'midnight' | 'porcelain') => { preferences.theme = theme; preferences.colors = themePalette(theme); deliver('preferences') }

;(window as any).seedSocialDesignPeople = () => {
  fixtureNpcBank.entries = Array.from({ length: 24 }, (_, n) => ({ ...fixtureNpcBank.entries[0], id: `design-npc-${n}`, name: `Neighbor ${n + 1}`, normalizedName: `neighbor ${n + 1}` }))
  fixtureNpcBank.groups = [{ id: 'design-cast', name: 'The night crew', memberIds: fixtureNpcBank.entries.slice(0, 3).map((entry: any) => entry.id) }]
  state.contacts = normalizeContactCollections({ contacts: [{ id: 'alice', name: 'Alice', role: 'A close friend', source: { kind: 'character', characterId: 'alice' } }] } as any, { characterId:'_none', characterName:'', now:state.roleplayNow, personaActorId:state.pocketPersonaActorId, makeId:prefix=>prefix+'-design' }).contacts
  deliver('design_fixture')
}

;(window as any).seedMessagePlanFixture = (phase: string) => {
  ;(window as any).seedMessageContinuityFixture('remote')
  const conversation = state.conversations.find((entry:any)=>entry.id==='continuity-direct')
  state.relays=[]
  const base = conversation.messages[0]
  const suggestion:any={id:'coffee-plan',kind:'event',status:'pending',title:'Coffee',description:'At the cafe',whenKind:'relative',whenText:'Tomorrow afternoon',participantNames:['Dane','You']}
  const event:any={id:'coffee-event',title:'Coffee',description:'At the cafe',whenKind:'relative',whenText:'Tomorrow afternoon',start:state.roleplayNow,end:state.roleplayNow,participantNames:['Dane','You'],completed:false,source:{conversationId:conversation.id}}
  state.events=phase==='pending'||phase==='deleted'?[]:[event]
  if(phase==='started')event.startedAt=state.roleplayNow
  const scheduled=phase!=='pending'
  conversation.messages=[
    {...base,id:'plan-first',text:'Coffee sounds good.',eventSuggestion:{...suggestion,whenKind:scheduled?'relative':'unscheduled',whenText:scheduled?'Tomorrow afternoon':'sometime soon',status:scheduled?'scheduled':'pending',scheduledEventId:scheduled?event.id:undefined}},
    ...['bold','ok','when','A longer outgoing line to compare right edges.'].map((text,n)=>({...base,id:`short-${n}`,sender:'persona',senderActorId:state.pocketPersonaActorId,text,eventSuggestion:undefined})),
    {...base,id:'plan-latest',text:'Tomorrow afternoon at the cafe.',eventSuggestion:{...suggestion,status:scheduled?'scheduled':'pending',scheduledEventId:scheduled?event.id:undefined}}
  ]
  if(phase==='revision')conversation.messages.at(-1).eventSuggestion={...suggestion,title:'Coffee at six',whenText:'Tomorrow at six',updateEventId:event.id}
  deliver('plan_fixture')
}


;(window as any).seedContactsMediaFixture=()=>{
  fixtureNpcBank.entries=Array.from({length:72},(_,n)=>({id:'media-npc-'+n,name:['Aster','Briar','Clover','Dahlia','Fern','Mika','Sage'][n%7]+' '+String(n+1).padStart(2,'0'),normalizedName:'person '+n,role:['Florist','Neighbour','Friend from the night shift'][n%3],identityBrief:'Keeps the flower shop open late. Loves the little stories people tell while choosing flowers.',aliases:[],tags:['night crew',n%2?'cafe':'flowers'],avatarUrl:n%4===0?'/photo.svg':'',accent:'#b89ce3',phoneProfile:{personality:'Warm, curious, and a little sarcastic.',appearance:'A soft green coat.',textingStyle:'Brief, casual replies.'}}))
  fixtureNpcBank.groups=[{id:'media-cast',name:'The night crew',memberIds:fixtureNpcBank.entries.slice(0,4).map((entry:any)=>entry.id)}]
  const collection=normalizeContactCollections({contacts:fixtureNpcBank.entries.slice(0,48).map((entry:any,n:number)=>({...entry,source:{kind:'npc',origin:'manual',bankId:entry.id},presence:{inScene:n%9===0,lastSceneAt:'2026-10-29T12:00:00Z'}}))} as any,{characterId:'_none',characterName:'',now:state.roleplayNow,personaActorId:state.pocketPersonaActorId,makeId:prefix=>prefix+'-media'})
  state.contacts=collection.contacts;state.conversations=[];state.contactGroups=[{id:'media-group',name:'The cafe regulars',memberIds:state.contacts.slice(0,4).map((item:any)=>item.id)}]
  const thread=ensureDirectConversation(state,state.contacts[3].id,state.roleplayNow,()=> 'media-direct')
  thread.messages=[{id:'media-message',sender:'contact',text:'Coffee tonight?',createdAt:state.roleplayNow}]
  deliver('contacts')
}
;(window as any).switchMediaPersona=(id:string)=>{mediaPersona={id,name:id==='media-persona'?'Till Park':'Other Persona'};deliver('preferences')}
;(window as any).mediaSnapshot=()=>({preferences:structuredClone(preferences),sends:structuredClone(mediaSends)})
;(window as any).previewEventQuickstartFixture = (longTitle = false) => {
  const message=document.getElementById('fixture-quickstart')||document.createElement('article');message.id='fixture-quickstart';message.style.cssText='width:min(620px,100%);margin:auto';if(!message.isConnected)document.body.prepend(message)
  fixtureTagHandlers.get('pocket-event-start')?.({chatId:state.chatId,messageId:message.id,isUser:true,attrs:{card:encodeURIComponent(JSON.stringify({eventId:'coffee',title:longTitle?'A'.repeat(180):'Coffee, just us',description:'The quiet cafe with the green awning. No school crowd, just a little time together.',when:'2026-10-29T17:30:00Z',people:'Till · Ivan',messageCount:32}))}})
}
