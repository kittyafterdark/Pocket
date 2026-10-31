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


test('community Store apps install, preserve Lumistry state, and share only explicit saved content',async()=>{
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Community integration'}),context=scope(session.id)
  const before=await send('dating',{...context,action:'self',profile:{alias:'Fern',age:25}})
  expect(before.error.error).toContain('Install Lumistry')
  const imported=await send('import_contact',{...context,kind:'character',sourceId:'host-character'})
  const conversationId=imported.responses.find(p=>p.type==='lumiphone:contact_created').conversationId
  for(const app of ['dating','spotify','sharing'])expect((await send('app_install',{...context,appId:app,installed:true})).error).toBeUndefined()
  const self=await send('dating',{...context,action:'self',profile:{alias:'Moon',age:25,fields:{interests:'books'}}})
  expect(self.error).toBeUndefined()
  const path=`phones/${session.id}___none.json`,owner=host.read(path).pocketPersonaActorId
  expect(host.read(path).lumistry[owner].self.alias).toBe('Moon')
  const accepted=await send('dating',{...context,action:'accept',profile:{id:'dating_fixture',alias:'Juniper',age:28,distanceKm:8,fields:{interests:'books'},interest:{version:2,status:'matched',seen:true,context:(await import('../src/domain/lumistry-compatibility.js')).interestContext(host.read(path).lumistry[owner])}}})
  expect(accepted.error).toBeUndefined()
  const profileId=host.read(path).lumistry[owner].profiles.at(-1).id
  const originalLike=host.api.generate.quiet;host.api.generate.quiet=async()=>({content:JSON.stringify({status:'matched'})})
  try{expect((await send('dating',{...context,action:'like',profileId})).error).toBeUndefined()}finally{host.api.generate.quiet=originalLike}
  const dateThread=host.read(path).conversations.find((c:any)=>c.channel==='dating')
  expect(dateThread).toBeDefined();expect(dateThread.id).not.toBe(conversationId)
  const originalReply=host.api.generate.quiet
  try{
    host.api.generate.quiet=async(request:any)=>{
      expect(JSON.stringify(request.messages)).not.toContain('HOST HISTORY MUST NEVER ENTER FREEFORM')
      return {content:JSON.stringify({recipient:'Moon',messages:['A first dating text','And a second text'],photo:{description:'A cup of tea on a desk',subjectIds:[],aspect:'square'}})}
    }
    const reply=await send('generate_message',{...context,conversationId:dateThread.id})
    expect(reply.error).toBeUndefined()
    const messages=host.read(path).conversations.find((c:any)=>c.id===dateThread.id).messages
    expect(messages.map((m:any)=>m.text)).toEqual(['A first dating text','And a second text'])
    expect(messages[0].datingPhoto.description).toBe('A cup of tea on a desk')
    expect(host.read(path).conversations.find((c:any)=>c.id===conversationId).messages).toHaveLength(0)
  }finally{host.api.generate.quiet=originalReply}
  const personaPhoto=await send('persona_photo_send',{...context,conversationId:dateThread.id,photo:{description:'My book on the table',includesSelf:false,aspect:'square'},comment:'Reading tonight'})
  expect(personaPhoto.error).toBeUndefined()
  expect(host.read(path).conversations.find((c:any)=>c.id===dateThread.id).messages.at(-1)).toMatchObject({sender:'persona',senderName:'Moon',datingPhoto:{description:'My book on the table'}})

  await send('app_install',{...context,appId:'dating',installed:false})
  expect((await send('dating',{...context,action:'diagnostics_preview'})).error.error).toContain('Install Lumistry')
  await send('app_install',{...context,appId:'dating',installed:true})
  expect((await send('freeform_open',{sessionId:session.id})).state.lumistry[owner].self.alias).toBe('Moon')
  await send('action',{...context,action:'note',payload:{title:'Shared note',text:'An explicitly selected note excerpt'}})
  const state=host.read(path),note=state.notes.at(-1),request={sourceId:'notes',ids:[note.id],caption:'Look at this'}
  const {createPocketCapture}=await import('../src/domain/pocket-sharing.js'),{lumistryCaptureText}=await import('../src/domain/lumistry-sharing.js')
  const expectedCapture=lumistryCaptureText(createPocketCapture(state,request))
  const count=state.conversations.find((c:any)=>c.id===conversationId).messages.length
  expect((await send('share_capture',{...context,conversationId,request,expectedCapture:'forged preview'})).error.error).toContain('source changed')
  expect(host.read(path).conversations.find((c:any)=>c.id===conversationId).messages).toHaveLength(count)
  const shared=await send('share_capture',{...context,conversationId,request,expectedCapture})
  expect(shared.error).toBeUndefined()
  const message=host.read(path).conversations.find((c:any)=>c.id===conversationId).messages.at(-1)
  expect(message.sharedCapture.title).toBe('Notes');expect(message.text).toContain(note.body)
  const macros=host.api.macros.resolve
  try{
    const values:any={spotify_now_playing:'Synthetic Sunrise by Fixture Band',spotify_track_name:'Synthetic Sunrise',spotify_artists:'Fixture Band',spotify_album_name:'Fixture Album',spotify_album_art:'',spotify_is_playing:'true',spotify_has_lyrics:'true',spotify_lyrics:'A synthetic first line\nA synthetic second line'}
    host.api.macros.resolve=async(template:string,options:any)=>{expect(options.commit).toBe(false);return{text:template.replace(/\{\{(spotify_\w+)\}\}/g,(_:string,key:string)=>values[key]||''),diagnostics:[]}}
    const preview=await send('spotify_preview',{...context,conversationId})
    expect(preview.error).toBeUndefined()
    const ready=preview.responses.find(p=>p.type==='lumiphone:spotify_preview')
    const sent=await send('spotify_send',{...context,conversationId,spotifyShare:{previewId:ready.previewId,mode:'card',note:'For you'}})
    expect(sent.error).toBeUndefined()
    expect(host.read(path).conversations.find((c:any)=>c.id===conversationId).messages.at(-1).spotifyShare).toMatchObject({title:'Synthetic Sunrise',mode:'card',note:'For you'})
    expect((await send('spotify_send',{...context,conversationId,spotifyShare:{previewId:ready.previewId,mode:'card'}})).error).toBeDefined()
  }finally{host.api.macros.resolve=macros}
})


test('native apps use the actual backend in normal and Freeform Pockets without sharing balances',async()=>{
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Native scope check'})
  const normal={chatId:'native-normal-fixture',characterId:'host-character'},freeform=scope(session.id)
  for(const context of [normal,freeform]){
    const installed=await send('app_install',{...context,appId:'bank',installed:true});expect(installed.error).toBeUndefined()
    const saved=await send('native',{...context,app:'bank',action:'balance',data:{amount:context.chatId===normal.chatId?125:40}});expect(saved.error).toBeUndefined()
    const data=Object.values(saved.state.nativeApps)[0] as any;expect(data.wallet.balance).toBe(context.chatId===normal.chatId?125:40)
  }
  const restored=await send('get_state',normal);expect(restored.error).toBeUndefined();expect((Object.values(restored.state.nativeApps)[0] as any).wallet.balance).toBe(125)
})


test('connected money trackers and Pocket Bank persist changes from either native app boundary',async()=>{
  const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Connected wallet'}),context=scope(session.id)
  await send('app_install',{...context,appId:'bank',installed:true})
  const tracker=await send('action',{...context,action:'tracker',payload:{id:'money-sync',key:'money',label:'Money',kind:'counter',value:125.5,initialValue:0,min:0,max:1000,unit:'USD',updateMode:'manual',presentation:'counter',step:.01}})
  expect(tracker.error).toBeUndefined()
  const connected=await send('native',{...context,app:'bank',action:'tracker_link',data:{trackerId:'money-sync',source:'tracker'}})
  expect(connected.error).toBeUndefined();expect((Object.values(connected.state.nativeApps)[0] as any).wallet.balance).toBe(125.5)
  const paid=await send('native',{...context,app:'bank',action:'transaction',data:{amount:-25,label:'Lunch'}})
  expect(paid.error).toBeUndefined();expect(paid.state.trackers.find((t:any)=>t.id==='money-sync').value).toBe(100.5)
  const earned=await send('action',{...context,action:'tracker',payload:{trackerId:'money-sync',operation:'add',amount:20,reason:'Earned a tip'}})
  expect(earned.error).toBeUndefined();expect((Object.values(earned.state.nativeApps)[0] as any).wallet.balance).toBe(120.5)
  expect((Object.values(earned.state.nativeApps)[0] as any).wallet.transactions).toHaveLength(1)
})

test('Freeform portraits refresh from the bound Persona, independent of active Persona, styling base and local profile edits',async()=>{
  const savedImages=host.api.images,hadImages=host.permissions.has('images'),fernImage=host.personas[0].image_id,mikaImage=host.personas[1].image_id
  const lookups:Array<{id:string;user?:string}>=[]
  try{
    host.permissions.add('images');(host.personas[0] as any).image_id='fern-portrait';(host.personas[1] as any).image_id='mika-portrait'
    host.api.images={get:async(id:string,options:any)=>{lookups.push({id,user:options?.userId});return {id,url:'/images/'+id}}}
    host.switchPersona('persona-mika')
    const {session,state}=await send('freeform_create',{personaId:'persona-fern',name:'Bound portrait'},'portrait-user')
    expect(state.pocketPersona.avatarUrl).toBe('/images/fern-portrait')
    await send('freeform_appearance',{...scope(session.id),basePersonaId:'persona-mika',independent:false},'portrait-user')
    await send('save_pocket_persona',{...scope(session.id),followLumiverse:false,persona:{...state.pocketPersona,displayName:'Fern local overlay',linkedPersonaId:'',avatarUrl:'/images/mika-portrait'}},'portrait-user')
    const first=await send('freeform_open',{sessionId:session.id},'portrait-user')
    expect(first.state.pocketPersona).toMatchObject({displayName:'Fern local overlay',avatarUrl:'/images/fern-portrait',linkedPersonaId:''})
    expect(first.responses.find(p=>p.type==='lumiphone:state').activePersona.id).toBe('persona-mika')
    ;(host.personas[0] as any).image_id='fern-updated'
    const next=await send('freeform_open',{sessionId:session.id},'portrait-user')
    expect(next.state.pocketPersona.avatarUrl).toBe('/images/fern-updated')
    expect(host.read(`phones/${session.id}___none.json`,'portrait-user').pocketPersona.avatarUrl).toBe('/images/fern-updated')
    ;(host.personas[0] as any).image_id=null
    expect((await send('freeform_open',{sessionId:session.id},'portrait-user')).state.pocketPersona.avatarUrl).toBe('')
    expect(lookups.every(call=>call.user==='portrait-user')).toBe(true)
    expect(lookups.some(call=>call.id==='mika-portrait')).toBe(false)
  }finally{host.api.images=savedImages;(host.personas[0] as any).image_id=fernImage;(host.personas[1] as any).image_id=mikaImage;if(!hadImages)host.permissions.delete('images')}
})

test('normal roleplay uses the current Persona avatar crop rather than its older original image',async()=>{
  const savedImages=host.api.images,hadImages=host.permissions.has('images'),original=structuredClone(host.personas[1]),calls:any[]=[]
  try{
    Object.assign(host.personas[1],{name:'Katsuki Bakugo',image_id:'older-original',metadata:{avatar_crop_image_id:'katsuki-portrait'}})
    host.switchPersona('persona-mika');host.permissions.add('images')
    host.api.images={get:async(id:string,options:any)=>{calls.push({id,userId:options?.userId});return {id,url:'/images/'+id}}}
    const context={chatId:'portrait-roleplay',characterId:'host-character'}
    const first=await send('get_state',context,'crop-user')
    expect(first.error).toBeUndefined();expect(first.state.pocketPersona).toMatchObject({displayName:'Katsuki Bakugo',avatarUrl:'/images/katsuki-portrait'})
    expect(calls.some(c=>c.id==='older-original')).toBe(false)
    ;(host.personas[1].metadata as any).avatar_crop_image_id='katsuki-updated'
    expect((await send('get_state',context,'crop-user')).state.pocketPersona.avatarUrl).toBe('/images/katsuki-updated')
    await send('save_pocket_persona',{...context,followLumiverse:false,persona:{...first.state.pocketPersona,source:'manual',displayName:'Local nickname'}},'crop-user')
    expect((await send('get_state',context,'crop-user')).state.pocketPersona).toMatchObject({displayName:'Local nickname',avatarUrl:'/images/katsuki-updated'})
    ;(host.personas[1].metadata as any).avatar_crop_image_id=' '
    expect((await send('get_state',context,'crop-user')).state.pocketPersona.avatarUrl).toBe('/images/older-original')
    expect(calls.every(c=>c.userId==='crop-user')).toBe(true)
  }finally{Object.assign(host.personas[1],original);host.api.images=savedImages;if(!hadImages)host.permissions.delete('images')}
})

test('manual portrait repair updates an older Pocket without replacing its local identity or history',async()=>{
  const images=host.api.images,hadImages=host.permissions.has('images'),persona=structuredClone(host.personas[1])
  try{
    host.permissions.add('images');Object.assign(host.personas[1],{image_id:'old-original',metadata:{avatar_crop_image_id:'repaired-portrait'}});host.switchPersona('persona-mika')
    host.api.images={get:async(id:string)=>({id,url:'/images/'+id})}
    const context={chatId:'portrait-repair',characterId:'host-character'},initial=await send('get_state',context,'repair-user'),state=initial.state
    state.pocketPersona={...state.pocketPersona,source:'manual',linkedPersonaId:'',displayName:'Keep my local name',avatarUrl:'/images/old-original',phoneProfile:{personality:'Local overlay',appearance:'Local appearance',textingStyle:'Lowercase'}}
    await host.api.userStorage.setJson('phones/portrait-repair__host-character.json',state,{userId:'repair-user'})
    const before=structuredClone(state.pocketPersona),result=await send('refresh_persona_portrait',{...context,deviceOwnerActorId:state.pocketPersonaActorId},'repair-user')
    expect(result.error).toBeUndefined();expect(result.responses.some(p=>p.type==='lumiphone:persona_portrait_refreshed')).toBe(true)
    expect(result.state.pocketPersona).toEqual({...before,linkedPersonaId:'persona-mika',avatarUrl:'/images/repaired-portrait'})
    expect(JSON.parse(JSON.stringify(result.state.conversations))).toEqual(JSON.parse(JSON.stringify(state.conversations.map((c:any)=>({...c,archived:c.archived??false})))));expect(result.state.notes).toEqual(state.notes)
    expect(host.read('phones/portrait-repair__host-character.json','repair-user').pocketPersona.avatarUrl).toBe('/images/repaired-portrait')
    expect((await send('refresh_persona_portrait',{...context,deviceOwnerActorId:'someone-else'},'repair-user')).error.error).toContain('own phone')
    host.permissions.delete('images');expect((await send('refresh_persona_portrait',context,'repair-user')).error.error).toContain('Images')
  }finally{host.api.images=images;Object.assign(host.personas[1],persona);if(hadImages)host.permissions.add('images');else host.permissions.delete('images')}
})


test('Freeform reads only opted-in recent host context and text fields survive updates and reload',async()=>{
  const user='context-field-user',messages=host.api.chat.getMessages
  try{
    host.api.chat.getMessages=async(chatId:string)=>{host.reads.push(chatId);return Array.from({length:5},(_,i)=>({id:'rp-'+i,role:'assistant',content:'CONTEXT-TURN-'+i}))}
    const {session}=await send('freeform_create',{personaId:'persona-fern',name:'Context field'},user)
    const imported=await send('import_contact',{...scope(session.id),kind:'character',sourceId:'host-character'},user),conversationId=imported.state.conversations[0].id
    const prefs=await host.api.userStorage.getJson(PREFERENCES_PATH,{userId:user}) || (await import('../src/domain/preferences.js')).defaultPreferences()
    await host.api.userStorage.setJson(PREFERENCES_PATH,{...prefs,freeformRoleplayMessages:2}, {userId:user})
    const generated=await send('generate_message',{...scope(session.id),conversationId},user)
    expect(generated.error).toBeUndefined()
    const prompt=JSON.stringify(host.generations.at(-1));expect(prompt).toContain('CONTEXT-TURN-4');expect(prompt).toContain('CONTEXT-TURN-3');expect(prompt).not.toContain('CONTEXT-TURN-2')
    const create=await send('action',{...scope(session.id),action:'tracker',payload:{command:'create',label:'Current outfit',target:{type:'persona',id:'persona-fern',label:'Fern'},key:'current_outfit',kind:'state',freeText:true,state:'A coat',initialState:'A coat',states:[],presentation:'state',updateMode:'model',allowModelWrite:true,visibleToModel:true,modelPrompt:'Describe current clothing in a few sentences.'}},user)
    expect(create.error).toBeUndefined()
    const tracker=create.state.trackers.find((t:any)=>t.key==='current_outfit'),text='A long description of the outfit. '.repeat(12)
    const update=await send('action',{...scope(session.id),action:'tracker',payload:{trackerId:tracker.id,operation:'set_state',state:text}},user)
    expect(update.error).toBeUndefined();expect(update.state.trackers.find((t:any)=>t.id===tracker.id).state).toBe(text.trim())
    const reopened=await send('freeform_open',{sessionId:session.id},user);expect(reopened.state.trackers.find((t:any)=>t.id===tracker.id).state).toBe(text.trim())
    const reset=await send('action',{...scope(session.id),action:'tracker',payload:{trackerId:tracker.id,operation:'reset'}},user);expect(reset.state.trackers.find((t:any)=>t.id===tracker.id).state).toBe('A coat')
  }finally{host.api.chat.getMessages=messages}
})

test('portrait repair corrects an old binding when the saved Persona name uniquely identifies another profile',async()=>{
  const images=host.api.images,had=host.permissions.has('images'),persona=structuredClone(host.personas[0])
  try{
    host.permissions.add('images');host.personas[0].image_id='fern-right' as any;host.api.images={get:async(id:string)=>({id,url:'/images/'+id})}
    const context={chatId:'stale-binding',characterId:'host-character'},initial=await send('get_state',context,'stale-user'),state=initial.state
    state.pocketPersona={...state.pocketPersona,source:'manual',displayName:'Fern',linkedPersonaId:'persona-mika',avatarUrl:'/wrong'}
    await host.api.userStorage.setJson('phones/stale-binding__host-character.json',state,{userId:'stale-user'})
    const result=await send('refresh_persona_portrait',context,'stale-user');expect(result.error).toBeUndefined();expect(result.state.pocketPersona.avatarUrl).toBe('/images/fern-right');expect(result.state.pocketPersona.linkedPersonaId).toBe('persona-fern')
    expect((await send('get_state',context,'stale-user')).state.pocketPersona.avatarUrl).toBe('/images/fern-right')
  }finally{host.api.images=images;Object.assign(host.personas[0],persona);if(!had)host.permissions.delete('images')}
})


test('duplicate Persona names offer actual portraits without writing until an explicit ID is chosen',async()=>{
  const images=host.api.images,list=host.api.personas.list,had=host.permissions.has('images'),count=host.personas.length
  try{
    host.permissions.add('images');host.api.images={get:async(id:string)=>({id,url:'/images/'+id})}
    host.personas.push({id:'portrait-one',name:'Same name',description:'First profile',title:'',image_id:'portrait-a' as any,metadata:{}},{id:'portrait-two',name:'Same name',description:'Second profile',title:'',image_id:'portrait-b' as any,metadata:{}})
    const context={chatId:'duplicate-portrait',characterId:'host-character'},initial=await send('get_state',context,'duplicate-user'),state=initial.state,path='phones/duplicate-portrait__host-character.json'
    state.pocketPersona={...state.pocketPersona,source:'manual',displayName:'Same name',linkedPersonaId:'persona-mika',avatarUrl:'/old'};await host.api.userStorage.setJson(path,state,{userId:'duplicate-user'})
    const result=await send('refresh_persona_portrait',context,'duplicate-user');expect(result.error).toBeUndefined();expect(result.responses.some(p=>p.type==='lumiphone:persona_portrait_refreshed')).toBe(false)
    const choices=result.responses.find(p=>p.type==='lumiphone:persona_portrait_choices').personas
    expect(choices.map((p:any)=>p.avatarUrl)).toEqual(['/images/portrait-a','/images/portrait-b']);expect(host.read(path,'duplicate-user').pocketPersona.linkedPersonaId).toBe('persona-mika')
    const selected=await send('refresh_persona_portrait',{...context,personaId:'portrait-two'},'duplicate-user');expect(selected.error).toBeUndefined();expect(selected.state.pocketPersona.avatarUrl).toBe('/images/portrait-b');expect(selected.state.pocketPersona.linkedPersonaId).toBe('portrait-two')
    expect((await send('get_state',context,'duplicate-user')).state.pocketPersona.avatarUrl).toBe('/images/portrait-b')
    host.api.personas.list=async()=>({data:[host.personas[count],host.personas[count]],total:2})
    state.pocketPersona.linkedPersonaId='persona-mika';await host.api.userStorage.setJson(path,state,{userId:'duplicate-user'})
    const deduped=await send('refresh_persona_portrait',context,'duplicate-user');expect(deduped.error).toBeUndefined();expect(deduped.state.pocketPersona.linkedPersonaId).toBe('portrait-one')
  }finally{host.api.images=images;host.api.personas.list=list;host.personas.splice(count);if(!had)host.permissions.delete('images')}
})
