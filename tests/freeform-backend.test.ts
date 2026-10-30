import { beforeAll, expect, test } from 'bun:test'
import { freeformHost } from './fixtures/freeform-host.js'
import { FREEFORM_INDEX_PATH } from '../src/domain/freeform.js'
import { PREFERENCES_PATH } from '../src/domain/preferences.js'

const host = freeformHost()
beforeAll(async () => { await import('../src/backend.js') })
let serial = 0
async function send(type: string, payload: Record<string, unknown> = {}, userId?: string) {
  const requestId = `freeform-test-${++serial}`, offset = host.sends.length
  await host.send({ type: `lumiphone:${type}`, requestId, ...payload }, userId)
  const responses = host.sends.slice(offset)
  return { responses, error: responses.find(p => p.type === 'lumiphone:error'), state: responses.findLast(p => p.type === 'lumiphone:state')?.state,
    session: responses.find(p => p.type === 'lumiphone:freeform_opened')?.session }
}
const scope = (id: string) => ({ chatId: id, characterId: '_none' })

test('timeskip advances the Pocket clock once, persists a separator and reaches reply context',async()=>{
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Timeskip'})
  const imported=await send('import_contact',{...scope(session.id),kind:'character',sourceId:'host-character'})
  const conversationId=imported.responses.find(p=>p.type==='lumiphone:contact_created').conversationId
  await send('save_roleplay_time',{...scope(session.id),roleplayNow:'2026-10-30T12:00:00.000Z',timezoneOffsetMinutes:0})
  await send('action',{...scope(session.id),action:'message',payload:{conversationId,text:'Before the gap'}})
  const skipped=await send('timeskip',{...scope(session.id),conversationId,minutes:120,requestId:'skip-once'})
  expect(skipped.error).toBeUndefined();expect(skipped.state.roleplayNow).toBe('2026-10-30T14:00:00.000Z')
  const again=await send('timeskip',{...scope(session.id),conversationId,minutes:120,requestId:'skip-once'})
  expect(again.state.roleplayNow).toBe('2026-10-30T14:00:00.000Z')
  const reopened=await send('freeform_open',{sessionId:session.id})
  const messages=reopened.state.conversations.find((c:any)=>c.id===conversationId).messages
  expect(messages.filter((m:any)=>m.timeskip)).toHaveLength(1)
  expect(messages[0].text).toBe('Before the gap');expect(messages[0].createdAt).toBe('2026-10-30T12:00:00.000Z')
  expect(messages.at(-1).text).toBe('2 hours later');expect(messages.at(-1).sender).toBe('system')
  await send('generate_message',{...scope(session.id),conversationId})
  expect(JSON.stringify(host.generations.at(-1))).toContain('TIME HAS PASSED: 2 hours later')
  const preview=await send('preview_context',{...scope(session.id),conversationId})
  expect(preview.responses.find(p=>p.type==='lumiphone:context_preview').diagnostics.assembled).toContain('TIME HAS PASSED: 2 hours later')
  const invalid=await send('timeskip',{...scope(session.id),conversationId,minutes:-3})
  expect(invalid.error.error).toContain('Choose a timeskip')
  expect((await send('freeform_open',{sessionId:session.id})).state.roleplayNow).toBe('2026-10-30T14:00:00.000Z')
})

test('chat appearance and wallpaper stay local to their conversation and survive reopen',async()=>{
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Chat appearance'})
  const imported=await send('import_contact',{...scope(session.id),kind:'character',sourceId:'host-character'})
  const conversationId=imported.responses.find(p=>p.type==='lumiphone:contact_created').conversationId
  await send('save_chat_appearance',{...scope(session.id),conversationId,appearance:{radius:12,padding:10}})
  const wallpaper=await send('set_wallpaper',{...scope(session.id),target:'conversation-chat',conversationId,source:{kind:'url',url:'/fixture-wallpaper.svg'}})
  expect(wallpaper.error).toBeUndefined()
  const reopened=await send('freeform_open',{sessionId:session.id})
  const chat=reopened.state.conversations.find((c:any)=>c.id===conversationId)
  expect(chat.appearance.radius).toBe(12);expect(chat.appearance.padding).toBe(10)
  expect(chat.appearance.wallpaper.source.url).toBe('/fixture-wallpaper.svg')
  expect(reopened.responses.find(p=>p.type==='lumiphone:state').conversationWallpapers[conversationId]).toBe('/fixture-wallpaper.svg')
  expect(host.read(PREFERENCES_PATH).chatWallpaper.source).not.toEqual(chat.appearance.wallpaper.source)
  const reset=await send('save_chat_appearance',{...scope(session.id),conversationId,appearance:null})
  expect(reset.state.conversations.find((c:any)=>c.id===conversationId).appearance).toBeUndefined()
})

test('sidebar management renames and deletes only the selected session and rejects later writes', async () => {
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Manage me'})
  const {session:other}=await send('freeform_create',{personaId:'persona-fern',name:'Keep me'})
  const renamed=await send('freeform_rename',{chatId:'host-chat',characterId:'host-character',sessionId:session.id,name:'Renamed world'})
  expect(renamed.error).toBeUndefined()
  expect((await send('freeform_open',{sessionId:session.id})).session.name).toBe('Renamed world')
  const removed=await send('freeform_delete',{chatId:'host-chat',characterId:'host-character',sessionId:session.id})
  expect(removed.error).toBeUndefined()
  expect(removed.responses.some(p=>p.type==='lumiphone:freeform_deleted')).toBe(true)
  expect(host.read(`phones/${session.id}___none.json`)).toBeUndefined()
  expect((await send('action',{...scope(session.id),action:'note',payload:{title:'Late write'}})).error.error).toContain('no longer exists')
  expect((await send('freeform_open',{sessionId:other.id})).session.name).toBe('Keep me')
  expect((await send('freeform_delete',{chatId:'host-chat',characterId:'host-character',sessionId:other.id},'separate-user')).error.error).toContain('no longer exists')
})

test('Freeform appearance stays session scoped after profile edits remove the Persona link', async () => {
  const saved = host.read(PREFERENCES_PATH)
  try {
    const first = await send('freeform_create', {personaId:'persona-fern', name:'Themed session'})
    const id = first.session.id
    expect(first.responses.find(p => p.type === 'lumiphone:state').activePersona.id).toBe('persona-fern')
    await send('freeform_appearance', {...scope(id), basePersonaId:'persona-fern', independent:true})
    const prefs = first.responses.find(p => p.type === 'lumiphone:state').preferences
    prefs.personaAppearance[id] = { enabled:true, theme:'pink', colors:prefs.colors, customCss:'.lp-title {color: pink}', homeWallpaper:prefs.homeWallpaper, chatWallpaper:prefs.chatWallpaper }
    await send('save_preferences', {...scope(id), preferences:prefs})
    await send('save_pocket_persona', {...scope(id), persona:{...first.state.pocketPersona, linkedPersonaId:'', displayName:'Fern locally'}, followLumiverse:false})
    const reopened = await send('freeform_open', {sessionId:id})
    const payload = reopened.responses.find(p => p.type === 'lumiphone:state')
    expect(payload.activePersona).toEqual({id, name:'Fern locally'})
    expect(payload.preferences.personaAppearance[id].theme).toBe('pink')
    const second = await send('freeform_create', {personaId:'persona-fern', name:'Different session'})
    const other = second.responses.find(p => p.type === 'lumiphone:state')
    expect(other.activePersona.id).toBe('persona-fern')
    expect(other.preferences.personaAppearance[second.session.id]).toBeUndefined()
    expect(other.preferences.personaAppearance['persona-fern']).toBeUndefined()
  } finally { await host.api.userStorage.setJson(PREFERENCES_PATH, saved) }
})

test('base styling is shared by Persona ID and independent overrides can be disabled and restored', async () => {
  const saved=host.read(PREFERENCES_PATH)
  try {
    const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Follow base'})
    const initial=await send('freeform_open',{sessionId:session.id})
    const prefs=initial.responses.find(p=>p.type==='lumiphone:state').preferences
    prefs.personaAppearance['persona-mika']={enabled:true,theme:'forest',colors:prefs.colors,customCss:'',homeWallpaper:prefs.homeWallpaper,chatWallpaper:prefs.chatWallpaper}
    await send('save_preferences',{...scope(session.id),preferences:prefs})
    const base=await send('freeform_appearance',{...scope(session.id),basePersonaId:'persona-mika',independent:false})
    expect(base.responses.find(p=>p.type==='lumiphone:state').activePersona.id).toBe('persona-mika')
    const independent=await send('freeform_appearance',{...scope(session.id),basePersonaId:'persona-mika',independent:true})
    expect(independent.responses.find(p=>p.type==='lumiphone:state').preferences.personaAppearance[session.id].theme).toBe('forest')
    const followed=await send('freeform_appearance',{...scope(session.id),basePersonaId:'persona-mika',independent:false})
    expect(followed.responses.find(p=>p.type==='lumiphone:state').activePersona.id).toBe('persona-mika')
    const restored=await send('freeform_appearance',{...scope(session.id),basePersonaId:'persona-mika',independent:true})
    expect(restored.responses.find(p=>p.type==='lumiphone:state').activePersona.id).toBe(session.id)
    expect((await send('freeform_appearance',{...scope(session.id),basePersonaId:'missing',independent:false})).error.error).toContain('available')
  } finally {await host.api.userStorage.setJson(PREFERENCES_PATH,saved)}
})

test('lorebooks reach replies through independent Freeform scans and real-chat activation', async () => {
  const saved = host.read(PREFERENCES_PATH)
  host.permissions.add('world_books')
  const activated: string[] = []
  host.api.world_books = {
    getGlobal: async () => ['fixture-book'],
    entries: {
      list: async () => ({data:[{id:'lore', constant:true, content:'FREEFORM LORE MARKER'}], total:1}),
      get: async (id: string) => ({id,world_book_id:'fixture-book',content:'ROLEPLAY LORE MARKER'}),
    },
    getActivated: async (chatId: string) => { activated.push(chatId); return [{id:'lore',source:'keyword',bookId:'fixture-book'}] },
  }
  await host.api.userStorage.setJson(PREFERENCES_PATH, {...saved, enableLorebooks:true})
  try {
    let roleplayConversationId = ''
    for (const freeform of [true, false]) {
      const chatId = freeform ? (await send('freeform_create', {personaId:'persona-fern', name:'Lore world'})).session.id : 'context-roleplay'
      const context = {chatId, characterId: freeform ? '_none' : 'host-character'}
      const imported = await send('import_contact', {...context, kind:'character', sourceId:'host-character'})
      const conversationId = imported.responses.find(p => p.type === 'lumiphone:contact_created').conversationId
      if (!freeform) roleplayConversationId = conversationId
      const generated = await send('generate_message', {...context, conversationId})
      expect(generated.error).toBeUndefined()
      expect(JSON.stringify(host.generations.at(-1))).toContain(freeform ? 'FREEFORM LORE MARKER' : 'ROLEPLAY LORE MARKER')
      const logs=await send('get_lore_log',context)
      const log=logs.responses.find(p=>p.type==='lumiphone:lore_log').entries[0]
      expect(log.mode).toBe(freeform?'freeform':'roleplay')
      expect(log.includedChars).toBeGreaterThan(0)
      expect(log.entries[0].reason).toBe(freeform?'Constant':'Host activated: keyword')
    }
    expect(activated).toEqual(['context-roleplay'])
    const otherUser=await send('get_lore_log',{chatId:'context-roleplay',characterId:'host-character'},'separate-user')
    expect(otherUser.responses.find(p=>p.type==='lumiphone:lore_log').entries).toEqual([])
    host.permissions.delete('world_books')
    const denied=await send('preview_context',{chatId:'context-roleplay',characterId:'host-character',conversationId:roleplayConversationId})
    expect(denied.error.error).toContain('World Books access')
    const failureLog=await send('get_lore_log',{chatId:'context-roleplay',characterId:'host-character'})
    const recent=failureLog.responses.find(p=>p.type==='lumiphone:lore_log').entries
    expect(recent[0].status).toBe('error'); expect(recent[1].status).toBe('ready')
  } finally { await host.api.userStorage.setJson(PREFERENCES_PATH, saved); host.permissions.delete('world_books') }
})

test('scenario and contact context overrides persist and reach the actual phone request', async () => {
  const {session} = await send('freeform_create', {personaId:'persona-fern', name:'Context world'})
  await send('save_context_scenario', {...scope(session.id), scenario:'A midnight library on the moon.'})
  const imported = await send('import_contact', {...scope(session.id), kind:'character', sourceId:'host-character'})
  const contactId = imported.state.contacts[0].id, conversationId = imported.state.conversations[0].id
  const mode = await send('set_contact_profile_mode', {...scope(session.id), contactId, mode:'full'})
  expect(mode.state.contacts[0].contextPolicy.profileMode).toBe('full')
  const original = host.api.characters.get
  host.api.characters.get = async (...args: any[]) => ({...await original(...args), description:'Long profile '.repeat(200) + 'FULL PROFILE END MARKER'})
  try {
    const generated = await send('generate_message', {...scope(session.id), conversationId})
    expect(generated.error).toBeUndefined()
    const prompt = JSON.stringify(host.generations.at(-1))
    expect(prompt).toContain('A midnight library on the moon.')
    expect(prompt).toContain('FULL PROFILE END MARKER')
    const other = await send('freeform_create', {personaId:'persona-fern', name:'Other context'})
    expect(other.state.contextScenario || '').toBe('')
    await send('save_context_scenario', {...scope(session.id), scenario:''})
    expect((await send('freeform_open', {sessionId:session.id})).state.contextScenario).toBe('')
  } finally { host.api.characters.get = original }
})

test('multiple named sessions for one Persona stay independent of host identity and history', async () => {
  const first = await send('freeform_create', { personaId: 'persona-fern', name: '  After hours  ' })
  expect(first.error).toBeUndefined(); expect(first.session.name).toBe('After hours')
  expect(first.state.pocketPersona.displayName).toBe('Fern'); expect(first.state.pocketPersona.source).toBe('manual')
  expect(first.state.characterId).toBe('_none'); expect(first.state.contacts).toHaveLength(0)
  const id = first.session.id
  const note = await send('action', { ...scope(id), action: 'note', payload: { title: 'Session journal', body: 'Only here.' } })
  expect(note.error).toBeUndefined(); expect(note.state.notes[0].title).toBe('Session journal')
  host.switchPersona('persona-mika'); await host.emit('PERSONA_CHANGED')
  host.switchChat('another-host-chat'); await host.emit('CHAT_SWITCHED', { chatId: 'another-host-chat' })
  const reopened = await send('freeform_open', { sessionId: id })
  expect(reopened.state.pocketPersona.displayName).toBe('Fern'); expect(reopened.state.notes[0].body).toBe('Only here.')
  const second = await send('freeform_create', { personaId: 'persona-fern', name: 'Another world' })
  expect(second.session.id).not.toBe(id); expect(second.state.notes).toHaveLength(0)
  const otherUser = await send('freeform_open', { sessionId: id }, 'another-user')
  expect(otherUser.error.error).toContain('no longer exists')
  const renamed = await send('freeform_rename', { ...scope(id), name: 'Night library' })
  expect(renamed.error).toBeUndefined()
  expect(host.read(FREEFORM_INDEX_PATH).sessions.find((s: any) => s.id === id).name).toBe('Night library')
  expect(host.reads.every(id => !id.startsWith('_freeform_'))).toBe(true)
})

test('shared contacts and generation work without reading or handing off to host RP', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Messages' })
  const imported = await send('import_contact', { ...scope(session.id), kind: 'character', sourceId: 'host-character' })
  expect(imported.error).toBeUndefined()
  const conversationId = imported.state.conversations[0].id
  host.reads.length = 0
  const generated = await send('generate_message', { ...scope(session.id), conversationId })
  expect(generated.error).toBeUndefined()
  const conversation = generated.state.conversations.find((c: any) => c.id === conversationId)
  expect(conversation.messages.at(-1).text).toBe('A reply from this session alone.')
  expect(conversation.availability.state).toBe('remote'); expect(generated.state.relays).toHaveLength(0)
  expect(host.reads).toEqual([])
  expect(JSON.stringify(host.generations.at(-1))).not.toContain('HOST HISTORY MUST NEVER ENTER FREEFORM')
  expect(JSON.stringify(host.generations.at(-1))).toContain('FREEFORM SESSION')
  for (const type of ['quickstart_event', 'continue_relay', 'arm_reference', 'timeline_review', 'gallery_add_to_chat']) {
    expect((await send(type, scope(session.id))).error.error).toContain('needs a roleplay chat')
  }
})

test('copy needs explicit override, backs up base Pocket, and keeps source separate', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Copy me' })
  const source = await send('action', { ...scope(session.id), action: 'note', payload: { title: 'Freeform note', body: 'Source stays intact' } })
  host.switchChat('copy-target')
  const base = await send('action', { chatId: 'copy-target', characterId: 'host-character', action: 'note', payload: { title: 'Base note', body: 'Keep this in the backup' } })
  expect(base.error).toBeUndefined()
  const rejected = await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'copy-target', override: false })
  expect(rejected.error.error).toContain('base Pocket was kept')
  expect(host.read('phones/copy-target__host-character.json').notes[0].title).toBe('Base note')
  const copied = await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'copy-target', override: true })
  expect(copied.error).toBeUndefined()
  const receipt = copied.responses.find(p => p.type === 'lumiphone:freeform_copied')
  expect(host.read(receipt.backupPath).state.notes[0].title).toBe('Base note')
  expect(host.read('phones/copy-target__host-character.json').notes).toEqual(source.state.notes)
  await send('action', { chatId: 'copy-target', characterId: 'host-character', action: 'note', payload: { title: 'Roleplay only' } })
  const original = await send('freeform_open', { sessionId: session.id })
  expect(original.state.notes).toHaveLength(1); expect(original.state.notes[0].title).toBe('Freeform note')
  const target = host.read('phones/copy-target__host-character.json')
  expect(target.activities.every((a: any) => a.scope.chatId === 'copy-target')).toBe(true)
  expect((await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'stale-target', override: true })).error.error).toContain('active chat changed')
})

test('invalid session names and unsupported directories fail before writes', async () => {
  const before = host.writes.length
  expect((await send('freeform_create', { personaId: 'persona-fern', name: ' ' })).error.error).toContain('Name your session')
  expect((await send('freeform_create', { personaId: 'missing', name: 'New' })).error.error).toContain('unavailable')
  expect(host.writes.length).toBe(before)
  await host.api.userStorage.setJson(FREEFORM_INDEX_PATH, { version: 99, sessions: [] }, { userId: 'future-user' })
  expect((await send('freeform_create', { personaId: 'persona-fern', name: 'New' }, 'future-user')).error.error).toContain('unsupported')
  expect(host.read(FREEFORM_INDEX_PATH, 'future-user').version).toBe(99)
})

test('a failed base backup prevents replacement and leaves both histories intact', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Backup safety' })
  host.switchChat('backup-target')
  const base = await send('action', { chatId: 'backup-target', characterId: 'host-character', action: 'note', payload: { title: 'Keep me' } })
  const write = host.api.userStorage.setJson
  host.api.userStorage.setJson = async (path: string, ...args: any[]) => {
    if (path.startsWith('freeform/backups/')) throw new Error('Fixture backup failed')
    return write(path, ...args)
  }
  try {
    const result = await send('freeform_copy_to_chat', { ...scope(session.id), targetChatId: 'backup-target', override: true })
    expect(result.error.error).toContain('backup failed')
    expect(host.read('phones/backup-target__host-character.json').notes).toEqual(base.state.notes)
    expect((await send('freeform_open', { sessionId: session.id })).state.notes).toHaveLength(0)
  } finally { host.api.userStorage.setJson = write }
})

test('resetting a session keeps its chosen identity and resetting roleplay preserves Freeform stores', async () => {
  const { session } = await send('freeform_create', { personaId: 'persona-fern', name: 'Keep identity' })
  const reset = await send('reset_current', scope(session.id))
  expect(reset.error).toBeUndefined(); expect(reset.state.pocketPersona.displayName).toBe('Fern'); expect(reset.state.setup.initialized).toBe(true)
  await send('reset_all_roleplay', { chatId: 'copy-target', characterId: 'host-character' })
  expect((await send('freeform_open', { sessionId: session.id })).state.pocketPersona.displayName).toBe('Fern')
})

test('manual conversation scheduling persists a single plan through edits and feeds reply context', async()=>{
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Manual plans'})
  const context=scope(session.id), imported=await send('import_contact',{...context,kind:'character',sourceId:'host-character'})
  const conversationId=imported.responses.find(p=>p.type==='lumiphone:contact_created').conversationId
  const scheduled=await send('action',{...context,action:'event',payload:{title:'Ramen night',start:'2026-11-01T20:00:00.000Z',end:'2026-11-01T21:00:00.000Z',sourceConversationId:conversationId,participants:['Alex','Fern']}})
  expect(scheduled.error).toBeUndefined()
  const event=scheduled.state.events.at(-1),message=scheduled.state.conversations.find((c:any)=>c.id===conversationId).messages.at(-1)
  expect(event.source.messageId).toBe(message.id)
  expect(message.eventSuggestion).toMatchObject({status:'scheduled',scheduledEventId:event.id,title:'Ramen night'})
  const edited=await send('action',{...context,action:'event',payload:{...event,title:'Ramen tomorrow',sourceConversationId:conversationId,sourceMessageId:message.id}})
  expect(edited.state.conversations.find((c:any)=>c.id===conversationId).messages).toHaveLength(1)
  expect(edited.state.conversations.find((c:any)=>c.id===conversationId).messages[0].eventSuggestion.title).toBe('Ramen tomorrow')
  await send('generate_message',{...context,conversationId})
  expect(JSON.stringify(host.generations.at(-1))).toContain('Ramen tomorrow')
  expect((await send('freeform_open',{sessionId:session.id})).state.events.at(-1).title).toBe('Ramen tomorrow')
})

test('chat photos use stable Gallery assets and character generation obeys gate, stop, retry, and late disable',async()=>{
  const saved=host.read(PREFERENCES_PATH), originalGenerate=host.api.generate.quiet
  const images: any[]=[];let nextImage: (()=>Promise<any>)|undefined
  const photo={id:'fixture-chat-photo',url:'/fixture-photo.svg',mime_type:'image/png'}
  host.api.images={get:async(id:string)=>id===photo.id?photo:null,uploadFromDataUrl:async()=>photo}
  host.api.imageGen={listConnections:async()=>[],generateNative:async(input:any)=>{images.push(input);await host.emit('IMAGE_GEN_PROGRESS',{assetId:'another-job',chatId:input.chat_id,preview:'data:image/png;base64,AAAA'});await host.emit('IMAGE_GEN_PROGRESS',{assetId:input.clientJobId,chatId:input.chat_id,preview:'data:image/png;base64,AAAA',step:2,totalSteps:8});return nextImage?nextImage():{generated:true,imageId:photo.id,imageUrl:photo.url}},cancelNative:async()=>true}
  host.permissions.add('images');host.permissions.add('image_gen')
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Chat pictures'})
  const context=scope(session.id),imported=await send('import_contact',{...context,kind:'character',sourceId:'host-character'})
  const conversationId=imported.responses.find(p=>p.type==='lumiphone:contact_created').conversationId
  const path=`phones/${session.id}___none.json`, messages=()=>host.read(path).conversations.find((c:any)=>c.id===conversationId).messages
  const wait=async(condition:()=>boolean)=>{for(let i=0;i<100;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,10))}throw new Error('Photo job did not settle')}
  try{
    await host.api.userStorage.setJson(PREFERENCES_PATH,{...saved,characterPictures:false})
    const prepared=await send('prepare_chat_photo',{...context,conversationId,scene:'A preview of dinner'})
    expect(prepared.error).toBeUndefined();expect(messages()).toHaveLength(0)
    expect(prepared.responses.find(p=>p.type==='lumiphone:chat_photo_ready')).toMatchObject({imageId:photo.id})
    const previews=prepared.responses.filter(p=>p.type==='lumiphone:camera_progress' && p.phase==='preview')
    expect(previews).toHaveLength(1);expect(previews[0]).toMatchObject({step:2,totalSteps:8,imageDataUrl:'data:image/png;base64,AAAA'})
    const completedOffset=host.sends.length
    await host.emit('IMAGE_GEN_PROGRESS',{assetId:images[0].clientJobId,chatId:session.id,preview:'data:image/png;base64,AAAA'})
    expect(host.sends.length).toBe(completedOffset)
    const retriedPreview=await send('prepare_chat_photo',{...context,conversationId,scene:'Try a closer framing'})
    expect(retriedPreview.error).toBeUndefined();expect(messages()).toHaveLength(0)
    const sent=await send('send_chat_photo',{...context,conversationId,imageId:photo.id,caption:'My dinner'})
    expect(sent.error).toBeUndefined();expect(messages().at(-1)).toMatchObject({sender:'persona',text:'My dinner',imageId:photo.id})
    expect((await send('send_chat_photo',{...context,conversationId,imageId:'missing'})).error).toBeDefined()
    expect((await send('send_chat_photo',{...context,conversationId,dataUrl:'data:text/html;base64,AAAA'})).error).toBeDefined()
    await send('send_chat_photo',{...context,conversationId,dataUrl:'data:image/png;base64,AAAA',caption:'Uploaded dinner'})
    expect(messages().at(-1).imageId).toBe(photo.id)
    await send('send_chat_photo',{...context,conversationId,scene:'A ramen bowl on a table',caption:'Generated dinner'})
    expect(messages().at(-1)).toMatchObject({text:'Generated dinner',imageId:photo.id})
    expect(images.at(-1).prompt).not.toContain('portrait')
    host.api.generate.quiet=async()=>({content:JSON.stringify({message:'look what I made',imagePrompt:'A bowl of ramen on a table',after:{state:'remote'}})})
    const count=images.length
    await send('generate_message',{...context,conversationId});await new Promise(resolve=>setTimeout(resolve,25))
    expect(images).toHaveLength(count);expect(messages().at(-1).photo).toBeUndefined()
    await host.api.userStorage.setJson(PREFERENCES_PATH,{...saved,characterPictures:true})
    await send('generate_message',{...context,conversationId})
    await wait(()=>messages().at(-1).photo?.status==='ready')
    expect(messages().at(-1)).toMatchObject({text:'look what I made',imageId:photo.id})
    let release: (value:any)=>void=()=>{}
    nextImage=()=>new Promise(resolve=>{release=resolve})
    await send('generate_message',{...context,conversationId});await wait(()=>images.length===count+2)
    const pending=messages().at(-1)
    await send('message_photo_control',{...context,conversationId,messageId:pending.id,action:'stop'})
    release({generated:true,imageId:photo.id,imageUrl:photo.url});await new Promise(resolve=>setTimeout(resolve,25))
    expect(messages().at(-1).photo.status).toBe('cancelled');expect(messages().at(-1).imageId).toBeUndefined()
    nextImage=undefined
    await send('message_photo_control',{...context,conversationId,messageId:pending.id,action:'retry'})
    await wait(()=>messages().at(-1).photo.status==='ready')
    expect(messages().at(-1).photo.jobId).not.toBe(pending.photo.jobId)
    nextImage=()=>new Promise(resolve=>{release=resolve})
    const before=images.length
    await send('generate_message',{...context,conversationId});await wait(()=>images.length===before+1)
    await host.api.userStorage.setJson(PREFERENCES_PATH,{...saved,characterPictures:false})
    release({generated:true,imageId:photo.id,imageUrl:photo.url});await wait(()=>messages().at(-1).photo.status==='failed')
    expect(messages().at(-1).imageId).toBeUndefined();expect(messages().at(-1).text).toBe('look what I made')
    nextImage=undefined
    await host.api.userStorage.setJson(PREFERENCES_PATH,{...saved,characterPictures:true,replyCadence:'instant'})
    const originalCharacterGet=host.api.characters.get,originalCharacterList=host.api.characters.list
    try{
      host.api.characters.get=async(id:string)=>id==='photo-friend'?{...await originalCharacterGet('host-character'),id,name:'Sam'}:originalCharacterGet(id)
      host.api.characters.list=async()=>({data:[await originalCharacterGet('host-character'),await host.api.characters.get('photo-friend')],total:2})
      const importedFriend=await send('import_contact',{...context,kind:'character',sourceId:'photo-friend'});expect(importedFriend.error).toBeUndefined()
      const contactIds=host.read(path).contacts.map((c:any)=>c.id)
      const created=await send('create_conversation',{...context,title:'Photo group',participantActorIds:contactIds})
      const groupId=created.responses.find(p=>p.type==='lumiphone:conversation_opened').conversationId
      host.api.generate.quiet=async()=>({content:JSON.stringify({messages:[{speakerId:contactIds[0],text:'group dinner',imagePrompt:'A ramen bowl shared at dinner'}]})})
      await send('generate_message',{...context,conversationId:groupId})
      const groupMessages=()=>host.read(path).conversations.find((c:any)=>c.id===groupId).messages
      await wait(()=>groupMessages().at(-1)?.photo?.status==='ready')
      expect(groupMessages().at(-1)).toMatchObject({text:'group dinner',imageId:photo.id})
    }finally{host.api.characters.get=originalCharacterGet;host.api.characters.list=originalCharacterList}
    photo.url='/refreshed-photo.svg'
    const reopened=await send('freeform_open',{sessionId:session.id})
    expect(reopened.state.conversations.find((c:any)=>c.id===conversationId).messages[0].imageUrl).toBe('/refreshed-photo.svg')
  }finally{
    host.api.generate.quiet=originalGenerate;host.permissions.delete('images');host.permissions.delete('image_gen')
    await host.api.userStorage.setJson(PREFERENCES_PATH,saved)
  }
})


test('manual JEV evaluation carries the operator user through the actual backend pipeline',async()=>{
  const userId='jev-operator-user',context={chatId:'jev-operator-chat',characterId:'host-character'},original=host.api.generate.quiet
  const defaults=host.read(PREFERENCES_PATH)
  await host.api.userStorage.setJson(PREFERENCES_PATH,{...defaults,jev:{enabled:true,provider:'llm',model:'jev-latest',autoAfterTurn:false}},{userId})
  const created=await send('action',{...context,action:'tracker',payload:{command:'create',label:'Mood',target:{type:'custom',id:'scene',label:'Scene mood'},kind:'state',presentation:'state',states:['Calm','Angry'],state:'Angry',initialState:'Angry',updateMode:'jev',jev:{question:'What is the mood?',minConfidence:.5}}},userId)
  expect(created.error).toBeUndefined()
  const trackerId=created.responses.find(p=>p.type==='lumiphone:action_done').result.trackerId
  const requests:any[]=[]
  host.api.generate.quiet=async(request:any)=>{
    if(!request.userId)throw new Error('userId is required for operator-scoped extensions')
    requests.push(request)
    return {content:JSON.stringify({answers:{q1:{type:'choice',choice:'Calm',probabilities:{Calm:.95,Angry:.05},confidence:.95}}})}
  }
  try{
    const evaluated=await send('jev_evaluate',{...context,trackerId},userId)
    expect(evaluated.error).toBeUndefined()
    expect(requests).toHaveLength(1);expect(requests[0].userId).toBe(userId)
    expect(evaluated.responses.findLast(p=>p.type==='lumiphone:jev_status').status).toBe('complete')
    const state=host.read('phones/jev-operator-chat__host-character.json',userId)
    expect(state.trackers.find((t:any)=>t.id===trackerId)).toMatchObject({state:'Calm',jevResult:{status:'applied'}})
    expect(host.read('phones/jev-operator-chat__host-character.json')).toBeUndefined()
  }finally{host.api.generate.quiet=original}
})
