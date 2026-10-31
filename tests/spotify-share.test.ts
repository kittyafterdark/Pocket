import { expect, test } from 'bun:test'
import { SpotifyShareBridge } from '../src/backend/spotify-share.js'
import { latestSpotifyReplyGuidance, normalizeSpotifyShare, selectedSpotifyLyrics, spotifySharePromptContext, spotifyShareText } from '../src/domain/spotify-share.js'
import { normalizeContactCollections } from '../src/domain/contacts.js'
import type { PhoneMessage, PhoneState } from '../src/types.js'

const marker = '__POCKET_SPOTIFY_SHARE_V1_8F4D6B__'
function resolver(options: { changed?: boolean } = {}) {
  const calls: Array<{ template: string; scope: any }> = []
  const resolve = async (template: string, scope: any) => {
    calls.push({ template, scope })
    if (template.includes('{{spotify_now_playing}}')) return {
      text: [marker, 'A Song by Artist', 'A Song', 'Artist', 'An Album', 'http://unsafe.example/art.jpg', 'true', 'true', 'line one\nline two\nline three'].join(`\n${marker}\n`), diagnostics: [],
    }
    return { text: options.changed ? `Another Song\n${marker}\nArtist` : `A Song\n${marker}\nArtist`, diagnostics: [] }
  }
  return { calls, resolve }
}

test('explicit preview resolves Spotify macros without committing and detects a track switch', async () => {
  const stable = resolver()
  const bridge = new SpotifyShareBridge(stable.resolve, () => 1_000, () => 'one')
  const preview = await bridge.preview({ chatId: 'chat', characterId: 'character', conversationId: 'dm', userId: 'user' })
  expect(preview.previewId).toBe('spotify_one')
  expect(preview.snapshot).toMatchObject({ title: 'A Song', artists: 'Artist', album: 'An Album', hasLyrics: true })
  expect(preview.snapshot.albumArtUrl).toBeUndefined()
  expect(preview.lines).toEqual(['line one', 'line two', 'line three'])
  expect(stable.calls).toHaveLength(2)
  expect(stable.calls.every((call) => call.scope.commit === false)).toBe(true)
  expect(stable.calls.every((call) => call.scope.userId === 'user')).toBe(true)
  const changed = resolver({ changed: true })
  await expect(new SpotifyShareBridge(changed.resolve).preview({ chatId: 'chat', characterId: 'character', conversationId: 'dm' })).rejects.toThrow(/track changed/i)
})

test('preview consumption is conversation-scoped, single-use and stores only selected content', async () => {
  const mock = resolver()
  const bridge = new SpotifyShareBridge(mock.resolve, () => 1_000, () => 'two')
  const preview = await bridge.preview({ chatId: 'chat', characterId: 'character', conversationId: 'dm', userId: 'user' })
  expect(() => bridge.consume({ previewId: preview.previewId, mode: 'excerpt', selectedLineIndexes: [0] }, { chatId: 'chat', characterId: 'character', conversationId: 'other', userId: 'user' })).toThrow(/another conversation/i)
  const again = await bridge.preview({ chatId: 'chat', characterId: 'character', conversationId: 'dm', userId: 'user' })
  const prepared = bridge.consume({ previewId: again.previewId, mode: 'excerpt', selectedLineIndexes: [2, 0], note: 'This made me think of you.' }, { chatId: 'chat', characterId: 'character', conversationId: 'dm', userId: 'user' })
  expect(prepared.attachment.lyrics).toBe('line one\nline three')
  expect(prepared.text).toContain('This made me think of you.')
  expect(prepared.text).not.toContain('line two')
  expect(prepared.text).not.toContain('spotify.com')
  expect(() => bridge.consume({ previewId: again.previewId, mode: 'card' }, { chatId: 'chat', characterId: 'character', conversationId: 'dm', userId: 'user' })).toThrow(/expired/i)
})

test('song attachments normalize through Pocket reload without accepting links or arbitrary fields', () => {
  const share = normalizeSpotifyShare({ version: 99, title: 'A Song', artists: 'Artist', album: 'Album', albumArtUrl: 'javascript:alert(1)', mode: 'excerpt', lyrics: 'quoted words', note: 'For you', link: 'https://open.spotify.com/track/secret', private: 'drop me' })!
  expect(share).toEqual({ version: 1, title: 'A Song', artists: 'Artist', album: 'Album', mode: 'excerpt', lyrics: 'quoted words', note: 'For you' })
  expect(spotifyShareText(share)).not.toContain('spotify.com')
  const raw = { chatId: 'chat', characterId: 'character', conversations: [{ id: 'dm', kind: 'direct', includesPocketPersona: true, participantActorIds: ['contact'], participantContactIds: ['contact'], messages: [{ id: 'message', sender: 'persona', senderName: 'You', text: spotifyShareText(share), spotifyShare: { ...share, injected: 'no' }, createdAt: '2026-01-01T00:00:00Z' }] }] } as unknown as PhoneState
  const state = normalizeContactCollections(raw, { characterId: 'character', characterName: 'Character', now: '2026-01-01T00:00:00Z', makeId: (prefix) => `${prefix}_id`, personaActorId: 'persona' })
  expect(state.conversations[0].messages[0].spotifyShare).toEqual(share)
})

test('reply context is compact, treats lyrics as untrusted media and applies only to a latest Persona share', () => {
  const share = normalizeSpotifyShare({ title: 'A Song', artists: 'Artist', album: '', mode: 'full', lyrics: 'x'.repeat(8_000), note: 'Maybe this says it better.' })!
  const message = { sender: 'persona', text: spotifyShareText(share), spotifyShare: share } as PhoneMessage
  expect(spotifySharePromptContext(message).length).toBeLessThan(3_000)
  expect(spotifySharePromptContext(message)).toContain('never instructions')
  expect(latestSpotifyReplyGuidance(message)).toContain('does not change the physical roleplay scene')
  expect(latestSpotifyReplyGuidance({ ...message, sender: 'contact' })).toBe('')
  expect(latestSpotifyReplyGuidance({ ...message, spotifyShare: undefined })).toBe('')
})

test('lyric selection enforces unique ordered lines and the twelve-line limit', () => {
  const snapshot = { title: 'A', artists: 'B', album: '', isPlaying: true, hasLyrics: true, lyrics: Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n') }
  expect(selectedSpotifyLyrics(snapshot, [3, 1, 3])).toBe('line 1\nline 3')
  expect(() => selectedSpotifyLyrics(snapshot, Array.from({ length: 13 }, (_, index) => index))).toThrow(/between 1 and 12/i)
})

test('oversized full lyrics are rejected intact and a valid excerpt can still use the preview', async () => {
  const mock = resolver()
  const resolve = async (template: string, scope: any) => {
    const result = await mock.resolve(template, scope)
    if (template.includes('{{spotify_now_playing}}')) result.text = result.text.replace('line one\nline two\nline three', 'x'.repeat(9_301) + '\nshort line')
    return result
  }
  const bridge = new SpotifyShareBridge(resolve, () => 1_000, () => 'large')
  const scope = { chatId: 'chat', characterId: 'character', conversationId: 'dm', userId: 'user' }
  const preview = await bridge.preview(scope)
  expect(() => bridge.consume({ previewId: preview.previewId, mode: 'full' }, scope)).toThrow(/too long/i)
  const prepared = bridge.consume({ previewId: preview.previewId, mode: 'excerpt', selectedLineIndexes: [1] }, scope)
  expect(prepared.attachment.lyrics).toBe('short line')
  expect(normalizeSpotifyShare({ title: 'Song', artists: 'Artist', mode: 'full', lyrics: 'x'.repeat(9_301) })).toBeUndefined()
})

test('expired previews cannot send, while an invalid scope cannot destroy another user preview', async () => {
  const mock = resolver(); let now = 1_000
  const bridge = new SpotifyShareBridge(mock.resolve, () => now, () => 'expires')
  const scope = { chatId: 'chat', characterId: 'character', conversationId: 'dm', userId: 'user' }
  const preview = await bridge.preview(scope)
  expect(() => bridge.consume({ previewId: preview.previewId, mode: 'card' }, { ...scope, userId: 'other' })).toThrow()
  expect(bridge.consume({ previewId: preview.previewId, mode: 'card' }, scope).attachment.title).toBe('A Song')
  const expired = await bridge.preview(scope); now += 300_001
  expect(() => bridge.consume({ previewId: expired.previewId, mode: 'card' }, scope)).toThrow(/expired/i)
})

test('share sheet exposes no link and emits only the preview id, mode, selected lines and note', async () => {
  const { JSDOM } = await import('jsdom')
  const { spotifyShareSheet } = await import('../src/frontend/components/spotify-share.js')
  const dom = new JSDOM('<!doctype html><body></body>')
  const previous = globalThis.document
  globalThis.document = dom.window.document
  try {
    let payload: any
    const sheet = spotifyShareSheet({ preview: { previewId: 'preview', snapshot: { title: 'A Song', artists: 'Artist', album: 'Album', isPlaying: true, hasLyrics: true, lyrics: 'one\ntwo', albumArtUrl: 'https://image.example/art.jpg' }, lines: ['one', 'two'] }, send: (value) => { payload = value }, dismiss: () => {} })
    expect(sheet.textContent).not.toContain('link')
    const mode = sheet.querySelector('select')!; mode.value = 'excerpt'; mode.dispatchEvent(new dom.window.Event('change'))
    const check = sheet.querySelector<HTMLInputElement>('input[type=checkbox]')!; check.checked = true; check.dispatchEvent(new dom.window.Event('change'))
    sheet.querySelector<HTMLTextAreaElement>('textarea')!.value = 'Listen to this.'
    sheet.querySelector<HTMLTextAreaElement>('textarea')!.dispatchEvent(new dom.window.Event('input'))
    sheet.querySelector<HTMLButtonElement>('.lp-button-primary')!.click()
    expect(payload).toEqual({ previewId: 'preview', mode: 'excerpt', selectedLineIndexes: [0], note: 'Listen to this.' })
  } finally { globalThis.document = previous; dom.window.close() }
})

test('Spotify feature modules do not depend on Fishing or Lumistry modules', async () => {
  const files = [
    Bun.file(new URL('../src/backend/spotify-share.ts', import.meta.url)).text(),
    Bun.file(new URL('../src/domain/spotify-share.ts', import.meta.url)).text(),
    Bun.file(new URL('../src/frontend/components/spotify-share.ts', import.meta.url)).text(),
  ]
  for (const source of await Promise.all(files)) {
    expect(source).not.toMatch(/from ['"][^'"]*(?:fishing|lumistry)[^'"]*['"]/)
  }
})

import {latestSpotifyBurst,spotifyBurstReplyGuidance} from '../src/domain/spotify-share.js';
import {runStructuredJsonGeneration} from '../src/backend/structured-generation.js';
import {defaultPreferences} from '../src/domain/preferences.js';

test('song-only preview and share preserve metadata through reload and into reply classification without lyrics',async()=>{
 const mock=resolver(),bridge=new SpotifyShareBridge(mock.resolve,()=>1000,()=> 'card');
 const scope={chatId:'chat',characterId:'character',conversationId:'dm',userId:'user'};
 const preview=await bridge.preview(scope),prepared=bridge.consume({previewId:preview.previewId,mode:'card',selectedLineIndexes:[]},scope);
 expect(prepared.attachment.lyrics).toBeUndefined();expect(prepared.text).toContain('A Song — Artist');expect(prepared.text).toContain('An Album');expect(prepared.text).not.toContain('line one');
 const raw={chatId:'chat',characterId:'character',conversations:[{id:'dm',kind:'direct',includesPocketPersona:true,participantActorIds:['contact'],participantContactIds:['contact'],messages:[{id:'song',sender:'persona',text:prepared.text,spotifyShare:prepared.attachment,createdAt:'now'}]}]} as unknown as PhoneState;
 const restored=normalizeContactCollections(JSON.parse(JSON.stringify(raw)),{characterId:'character',characterName:'Character',now:'now',makeId:prefix=>prefix,personaActorId:'persona'});
 const messages=restored.conversations[0].messages,context=spotifySharePromptContext(messages[0]),guidance=spotifyBurstReplyGuidance(latestSpotifyBurst(messages),true);
 expect(context).toContain('Song: A Song');expect(context).toContain('Artist: Artist');expect(context).toContain('No lyrics were included.');expect(guidance).toContain('song-only card is substantive communication');expect(guidance).toContain('"lyricsIncluded":false');expect(guidance).toContain('classifier JSON only');
});

test('song guidance stays in the current outgoing burst and cannot replay an already answered song',()=>{
 const share=normalizeSpotifyShare({title:'Song',artists:'Artist',mode:'card'})!;
 const song={id:'song',sender:'persona',status:'sent',text:spotifyShareText(share),spotifyShare:share} as PhoneMessage;
 const follow={id:'follow',sender:'persona',status:'sent',text:'What do you think?'} as PhoneMessage;
 const reply={id:'reply',sender:'contact',status:'delivered',text:'I remember this one.'} as PhoneMessage;
 expect(spotifyBurstReplyGuidance(latestSpotifyBurst([song,follow]))).toContain('Song');
 expect(spotifyBurstReplyGuidance(latestSpotifyBurst([song,reply]))).toBe('');expect(spotifyBurstReplyGuidance(latestSpotifyBurst([song,reply,follow]))).toBe('');
 expect(spotifyBurstReplyGuidance(latestSpotifyBurst([{...song,status:'failed'}]))).toBe('');
});

function replyFixture(responses:any[]){let preferences=defaultPreferences();const requests:any[]=[];
 const host:any={loadPreferences:async()=>structuredClone(preferences),savePreferences:async(p:any)=>preferences=p,send:()=>{},spindle:{permissions:{has:()=>true},connections:{list:async()=>[{id:'configured',is_default:true,model:'configured-model'}]},generate:{quiet:async(r:any)=>{requests.push(r);return responses.shift()||{content:'{"message":"hello"}',finish_reason:'stop'}}}}};
 return {host,requests,get preferences(){return preferences;}};
}
test('Spotify decisions and replies inherit native output room while ordinary Pocket budgets remain unchanged',async()=>{
 const f=replyFixture([{content:'{"action":"reply"}',finish_reason:'stop'},{content:'{"message":"That album reminds me of summer."}',finish_reason:'stop'},{content:'{"message":"hello"}',finish_reason:'stop'}]);
 expect((await runStructuredJsonGeneration(f.host,'reply-decision','song-decision',{spotifyReply:true,parameters:{temperature:.1}})).action).toBe('reply');
 expect((await runStructuredJsonGeneration(f.host,'message-reply','song-reply',{spotifyReply:true,parameters:{temperature:.85}})).message).toContain('summer');
 for(const r of f.requests){expect(r.parameters.max_tokens).toBeUndefined();expect(r.reasoning).toEqual({source:'off'});expect(r).not.toHaveProperty('spotifyReply');}
 await runStructuredJsonGeneration(f.host,'message-reply','ordinary',{parameters:{max_tokens:720}});expect(f.requests.at(-1).parameters.max_tokens).toBe(720);
 expect(f.preferences.generationHistory.at(-1)?.appScope).toBeUndefined();
});
test('completed Spotify plain dialogue is accepted without inferred events; classifier and ordinary replies remain strict',async()=>{
 const raw='Nice choice. I love that album.';
 const f=replyFixture([{content:raw,finish_reason:'stop'},{content:raw,finish_reason:'stop'},{content:raw,finish_reason:'stop'}]);
 const parsed=await runStructuredJsonGeneration(f.host,'message-reply','song-plain',{spotifyReply:true});expect(parsed.message).toBe(raw);expect(parsed.suggestion).toBeNull();expect(parsed.photo).toBeNull();expect(f.requests).toHaveLength(1);
 await expect(runStructuredJsonGeneration(f.host,'reply-decision','decision-plain',{spotifyReply:true})).rejects.toThrow('complete JSON');
 await expect(runStructuredJsonGeneration(f.host,'message-reply','ordinary-plain',{parameters:{max_tokens:720}})).rejects.toThrow('complete JSON');
});
test('Spotify truncation retries at most once without injecting a small fallback or repeating reasoning-only exhaustion',async()=>{
 const f=replyFixture([{content:'{"message":',finish_reason:'length'},{content:'{"message":"Recovered"}',finish_reason:'stop'}]);
 expect((await runStructuredJsonGeneration(f.host,'message-retry','song-recover',{spotifyReply:true})).message).toBe('Recovered');expect(f.requests).toHaveLength(2);expect(f.requests.every(r=>r.parameters.max_tokens===undefined)).toBe(true);
 const empty=replyFixture([{content:'',finish_reason:'length',usage:{prompt_tokens:100,completion_tokens:2000,reasoning_tokens:2000}}]);
 await expect(runStructuredJsonGeneration(empty.host,'message-reply','song-reasoning',{spotifyReply:true})).rejects.toThrow('all 2,000 output tokens');expect(empty.requests).toHaveLength(1);
});
test('Song only can be sent from the share sheet without selecting or including lyric lines',async()=>{
 const {JSDOM}=await import('jsdom'),{spotifyShareSheet}=await import('../src/frontend/components/spotify-share.js');
 const dom=new JSDOM('<body></body>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try{let payload:any;const sheet=spotifyShareSheet({preview:{previewId:'only',snapshot:{title:'Song',artists:'Artist',album:'Album',isPlaying:true,hasLyrics:false,lyrics:''},lines:[]},send:p=>payload=p,dismiss:()=>{}});
 expect(sheet.querySelector('select')!.value).toBe('card');const send=sheet.querySelector<HTMLButtonElement>('.lp-button-primary')!;expect(send.disabled).toBe(false);send.click();expect(payload).toEqual({previewId:'only',mode:'card',selectedLineIndexes:[],note:''});
 }finally{globalThis.document=previous;dom.window.close();}
});

test('lyric picker caps selection at twelve and frees a slot when a line is unchecked', async () => {
 const {JSDOM}=await import('jsdom'),{spotifyShareSheet}=await import('../src/frontend/components/spotify-share.js');
 const dom=new JSDOM('<body></body>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try {
  const sheet=spotifyShareSheet({preview:{previewId:'lines',snapshot:{title:'Song',artists:'Artist',album:'Album',isPlaying:true,hasLyrics:true,lyrics:'Lyrics'},lines:Array.from({length:14},(_,i)=>`行 ${i+1}`)},send:()=>{},dismiss:()=>{}});
  const mode=sheet.querySelector('select')!;mode.value='excerpt';mode.dispatchEvent(new dom.window.Event('change'));
  document.body.append(sheet);const rows=[...sheet.querySelectorAll<HTMLInputElement>('input[type=checkbox]')];
  expect(sheet.querySelector('fieldset legend')!.textContent).toBe('Pick your favourite lines');
  for(const check of rows.slice(0,12)){check.click();expect(check.checked).toBe(true);}
  expect(rows[12].disabled).toBe(true);expect(rows[0].disabled).toBe(false);
  rows[0].click();expect(rows[12].disabled).toBe(false);rows[12].click();
  expect(rows.filter(r=>r.checked)).toHaveLength(12);
 }finally{globalThis.document=previous;dom.window.close();}
});

test('mock player exposes working refresh/share actions and does not invent playback controls', async () => {
 const {JSDOM}=await import('jsdom'),{spotifyPlayer}=await import('../src/frontend/components/spotify-share.js');
 const dom=new JSDOM('<body></body>'),previous=globalThis.document;globalThis.document=dom.window.document;
 try {
  let refreshed=0,shared=0;
  const player=spotifyPlayer({snapshot:{title:'Song',artists:'Artist',album:'Album',isPlaying:true,hasLyrics:false,lyrics:''},loading:false,refresh:()=>refreshed++,share:()=>shared++});
  player.querySelector<HTMLButtonElement>('[aria-label="Refresh current song"]')!.click();
  player.querySelector<HTMLButtonElement>('[aria-label="Share this song"]')!.click();
  expect(refreshed).toBe(1);expect(shared).toBe(1);expect(player.querySelectorAll('button')).toHaveLength(2);
  const loading=spotifyPlayer({loading:true,refresh:()=>{},share:()=>{}});
  expect([...loading.querySelectorAll('button')].every(b=>b.disabled)).toBe(true);
 }finally{globalThis.document=previous;dom.window.close();}
});
