import type { PhoneState } from '../src/types.js'
import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { normalizeContactCollections } from '../src/domain/contacts.js'
import { VoiceMessagePlayer } from '../src/frontend/components/voice-message.js'
import { renderSettingsView } from '../src/frontend/apps/settings.js'
import { ttsSettings } from '../src/frontend/components/tts-settings.js'

test('old preferences migrate and malformed voice options normalize safely', () => {
  expect(normalizePreferences({ version: 5 })).toMatchObject({ voiceMessages: true, ttsVoiceURI: '', ttsConnectionId: '' })
  expect(normalizePreferences({ voiceMessages: 'false', ttsVoiceURI: 42 })).toMatchObject({ voiceMessages: true, ttsVoiceURI: '' })
  expect(normalizePreferences({ voiceMessages: false, ttsVoiceURI: 'saved' })).toMatchObject({ voiceMessages: false, ttsVoiceURI: 'saved' })
  expect(normalizePreferences({ ttsConnectionId: 42 }).ttsConnectionId).toBe('')
  expect(normalizePreferences({ ttsConnectionId: 'gpt-tts' }).ttsConnectionId).toBe('gpt-tts')
  expect(normalizePreferences({ ttsConnectionOptions: { gpt: { voice: ' nova ', model: 'tts-1', apiKey: 'discarded' }, malformed: 42 } }).ttsConnectionOptions).toEqual({ gpt: { voice: 'nova', model: 'tts-1' }, malformed: { voice: '', model: '' } })
})

test('switching TTS connections rejects stale voice lists and preserves failed-list defaults', async () => {
  const previous = { document: globalThis.document, window: globalThis.window, fetch: globalThis.fetch }
  const dom = new JSDOM('<html><body></body></html>')
  const pending: Array<{ url: string; signal: AbortSignal; resolve(response: Response): void }> = []
  const cleanups: Array<() => void> = []
  let saved = defaultPreferences()
  try {
    globalThis.document = dom.window.document; globalThis.window = dom.window as any
    globalThis.fetch = ((url: string, options: RequestInit) => {
      if (url.includes('?limit=')) return Promise.resolve(Response.json({ data: [{ id: 'a', name: 'A', voice: 'alloy', model: 'tts-1' }, { id: 'b', name: 'B' }] }))
      return new Promise(resolve => pending.push({ url, signal: options.signal as AbortSignal, resolve }))
    }) as any
    const view = ttsSettings(() => saved, mutate => { const next = structuredClone(saved); mutate(next); saved = normalizePreferences(next) }, cleanup => cleanups.push(cleanup))
    await new Promise(resolve => setTimeout(resolve, 0))
    const connection = view.querySelector<HTMLSelectElement>('[aria-label="Voice message TTS connection"]')!, voice = view.querySelector<HTMLSelectElement>('[aria-label="Voice message provider voice"]')!
    connection.value = 'a'; connection.dispatchEvent(new dom.window.Event('change'))
    expect(voice.options[0].textContent).toContain('alloy')
    connection.value = 'b'; connection.dispatchEvent(new dom.window.Event('change'))
    expect(pending.slice(0, 2).every(item => item.signal.aborted)).toBe(true)
    for (const item of pending.slice(0, 2)) item.resolve(Response.json({ voices: [{ id: 'stale', name: 'Stale A' }], models: [] }))
    for (const item of pending.slice(2)) item.resolve(Response.json(item.url.endsWith('/voices') ? { voices: [{ id: 'b-voice', name: 'B voice' }] } : { models: [] }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect([...voice.options].map(item => item.value)).toEqual(['', 'b-voice'])
    voice.value = 'b-voice'; voice.dispatchEvent(new dom.window.Event('change'))
    connection.value = ''; connection.dispatchEvent(new dom.window.Event('change'))
    connection.value = 'b'; connection.dispatchEvent(new dom.window.Event('change'))
    for (const item of pending.slice(4)) item.resolve(Response.json({ error: 'private provider error; must not display' }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(voice.value).toBe('b-voice'); expect(voice.disabled).toBe(false)
    expect(view.textContent).toContain('Some choices could not be loaded'); expect(view.textContent).not.toContain('private provider error')
  } finally {
    cleanups.forEach(cleanup => cleanup())
    globalThis.document = previous.document; globalThis.window = previous.window; globalThis.fetch = previous.fetch; dom.window.close()
  }
})

test('voice format and transcript survive conversation normalization without audio URLs', () => {
  const context = { characterId: 'alice', characterName: 'Alice', now: '2026-01-01T12:00:00Z', makeId: (prefix: string) => prefix + '_test' }
  const { conversations } = normalizeContactCollections({ conversations: [{ id: 'dm', kind: 'direct', participantActorIds: ['alice'], messages: [
    { id: 'voice', sender: 'contact', senderActorId: 'alice', text: '<script>spoken words</script>', format: 'voice', audioUrl: 'https://untrusted.test/audio.mp3' },
    { id: 'plain', sender: 'contact', text: 'ordinary', format: 'invalid' },
  ] }] }, context)
  expect(conversations[0].messages[0]).toMatchObject({ format: 'voice', text: '<script>spoken words</script>' })
  expect(conversations[0].messages[0]).not.toHaveProperty('audioUrl')
  expect(conversations[0].messages[1].format).toBeUndefined()
})

function withDom(run: (dom: JSDOM) => void): void {
  const previous = { document: globalThis.document, window: globalThis.window }
  const dom = new JSDOM('<html lang="en"><body></body></html>')
  try { globalThis.document = dom.window.document; globalThis.window = dom.window as any; run(dom) }
  finally { globalThis.document = previous.document; globalThis.window = previous.window; dom.window.close() }
}

test('voice playback is gesture-only, exclusive, cancellable and uses a saved voice', () => withDom(dom => {
  const spoken: any[] = []; let cancellations = 0
  const voice = { voiceURI: 'chosen', name: 'Chosen', lang: 'en-US' }
  Object.assign(dom.window, { speechSynthesis: { getVoices: () => [voice], speak: (utterance: any) => spoken.push(utterance), cancel: () => { cancellations++ } }, SpeechSynthesisUtterance: class { constructor(public text: string) {} } })
  const player = new VoiceMessagePlayer()
  const first = player.render({ text: '<b>hello</b>', senderName: 'Alice', senderActorId: 'alice' }, 'chosen')
  const second = player.render({ text: 'Goodbye', senderName: 'Bob' })
  const play = first.querySelector('button')!, next = second.querySelector('button')!
  expect(spoken.length).toBe(0)
  expect(first.querySelector('b')).toBeNull()
  play.click(); expect(spoken[0].text).toBe('<b>hello</b>'); expect(spoken[0].voice).toBe(voice)
  expect(play.getAttribute('aria-pressed')).toBe('true')
  next.click(); expect(cancellations).toBe(1); expect(play.getAttribute('aria-pressed')).toBe('false')
  const finish = spoken[1].onend; finish(); expect(next.getAttribute('aria-pressed')).toBe('false')
  next.click(); next.click(); expect(cancellations).toBe(2)
  player.stop(); expect(cancellations).toBe(2)
}))

test('host TTS sends only the transcript and connection id, plays audio, and releases it on Stop', async () => {
  const previous = { document: globalThis.document, window: globalThis.window, fetch: globalThis.fetch }
  const dom = new JSDOM('<html lang="fr"><body></body></html>')
  const requests: Array<{ url: string; options: RequestInit }> = []
  const audio: any[] = []
  try {
    globalThis.document = dom.window.document; globalThis.window = dom.window as any
    globalThis.fetch = (async (url: any, options: any) => {
      requests.push({ url, options })
      return new Response(new Blob(['generated audio'], { type: 'audio/mpeg' }))
    }) as any
    Object.assign(dom.window, { Audio: class {
      onended: any; onerror: any; paused = false; released = false
      constructor(public src: string) { audio.push(this) }
      async play() {}
      pause() { this.paused = true }
      removeAttribute() { this.src = '' }
      load() { this.released = true }
    } })
    const player = new VoiceMessagePlayer()
    const view = player.render({ text: 'Hey, I found our tickets.', senderName: 'Mira' }, '', true, 'gpt-tts', { voice: 'nova', model: 'gpt-4o-mini-tts' })
    const play = view.querySelector('button')!
    expect(play.disabled).toBe(false); expect(requests.length).toBe(0)
    play.click(); await new Promise(resolve => setTimeout(resolve, 0))
    expect(requests[0].url).toBe('/api/v1/tts/synthesize')
    expect(JSON.parse(requests[0].options.body as string)).toEqual({ connectionId: 'gpt-tts', text: 'Hey, I found our tickets.', voice: 'nova', model: 'gpt-4o-mini-tts' })
    expect(requests[0].options.credentials).toBe('same-origin')
    expect(audio.length).toBe(1); expect(audio[0].src).toStartWith('blob:')
    expect(play.getAttribute('aria-pressed')).toBe('true')
    play.click(); expect(audio[0].paused).toBe(true); expect(audio[0].released).toBe(true)
    expect(play.getAttribute('aria-pressed')).toBe('false')
  } finally {
    globalThis.document = previous.document; globalThis.window = previous.window; globalThis.fetch = previous.fetch; dom.window.close()
  }
})

test('cancelling host TTS prevents late audio playback and provider errors preserve the transcript', async () => {
  const previous = { document: globalThis.document, window: globalThis.window, fetch: globalThis.fetch }
  const dom = new JSDOM('<html><body></body></html>')
  let resolveRequest!: (response: Response) => void; let played = 0
  try {
    globalThis.document = dom.window.document; globalThis.window = dom.window as any
    globalThis.fetch = (() => new Promise(resolve => { resolveRequest = resolve })) as any
    Object.assign(dom.window, { Audio: class { constructor() { played++ } } })
    const player = new VoiceMessagePlayer(), view = player.render({ text: 'English transcript', senderName: 'Mira' }, '', true, 'gpt-tts')
    const play = view.querySelector('button')!
    play.click(); player.stop(); expect(view.querySelector('[role="status"]')!.textContent).toBe('')
    resolveRequest(new Response(new Blob(['audio'], { type: 'audio/mpeg' })))
    await new Promise(resolve => setTimeout(resolve, 0)); expect(played).toBe(0)
    globalThis.fetch = (async () => new Response('failure', { status: 502 })) as any
    play.click(); await new Promise(resolve => setTimeout(resolve, 0))
    expect(view.querySelector('[role="status"]')!.textContent).toContain('could not generate audio')
    expect(view.querySelector('details')!.textContent).toContain('English transcript')
    expect(play.getAttribute('aria-pressed')).toBe('false')
  } finally {
    globalThis.document = previous.document; globalThis.window = previous.window; globalThis.fetch = previous.fetch; dom.window.close()
  }
})

test('unsupported, disabled and failed speech retain readable transcripts', () => withDom(dom => {
  const player = new VoiceMessagePlayer(), message = { text: 'A readable transcript', senderName: 'Alice' }
  const unavailable = player.render(message)
  expect(unavailable.querySelector('button')!.disabled).toBe(true)
  expect(unavailable.querySelector('details')!.textContent).toContain(message.text)
  Object.assign(dom.window, { speechSynthesis: { getVoices: () => [], speak: () => { throw new Error('unavailable') }, cancel: () => {} }, SpeechSynthesisUtterance: class {} })
  expect(player.render(message, '', false).querySelector('button')!.disabled).toBe(true)
  const failed = player.render(message); failed.querySelector('button')!.click()
  expect(failed.querySelector('[role="status"]')!.textContent).toContain('failed')
  expect(failed.querySelector('button')!.getAttribute('aria-pressed')).toBe('false')
}))

test('Messages settings receive late browser voices and keep cumulative edits', () => withDom(dom => {
  let available: any[] = [], saved = defaultPreferences()
  const synthesis = new dom.window.EventTarget() as any; synthesis.getVoices = () => available
  Object.assign(dom.window, { speechSynthesis: synthesis })
  const cleanups: Array<() => void> = []
  const page = document.createElement('div'), content = document.createElement('div'); page.append(content)
  const view = renderSettingsView({ draft: saved, section: 'messages', state: { references: [], conversations: [] } as unknown as PhoneState, page: () => ({ page, content }), onCleanup: cleanup => cleanups.push(cleanup), update: next => { saved = next } } as any)
  const select = view.querySelector<HTMLSelectElement>('[aria-label="Voice message TTS voice"]')!
  expect(select.options.length).toBe(1)
  available = [{ voiceURI: 'late', name: 'Late voice', lang: 'en-US' }]; synthesis.dispatchEvent(new dom.window.Event('voiceschanged'))
  expect(select.options.length).toBe(2)
  view.querySelector<HTMLButtonElement>('[aria-label="Allow character voice messages"]')!.click()
  select.value = 'late'; select.dispatchEvent(new dom.window.Event('change'))
  expect(saved.voiceMessages).toBe(false); expect(saved.ttsVoiceURI).toBe('late')
  cleanups.forEach(cleanup => cleanup()); available = []; synthesis.dispatchEvent(new dom.window.Event('voiceschanged'))
  expect(select.options.length).toBe(2)
}))

test('Messages settings list host TTS connections, preserve edits and ignore disposed responses', async () => {
  const previous = { document: globalThis.document, window: globalThis.window, fetch: globalThis.fetch }
  const dom = new JSDOM('<html><body></body></html>')
  let resolveRequest!: (response: Response) => void
  let saved = { ...defaultPreferences(), ttsConnectionId: 'missing' }
  const cleanups: Array<() => void> = []
  try {
    globalThis.document = dom.window.document; globalThis.window = dom.window as any
    globalThis.fetch = ((url: any, options: any) => {
      expect(options.credentials).toBe('same-origin')
      if (url.endsWith('/models')) return Promise.resolve(Response.json({ models: [{ id: 'gpt-4o-mini-tts', label: 'GPT TTS' }] }))
      if (url.endsWith('/voices')) return Promise.resolve(Response.json({ voices: [{ id: 'alloy', name: 'Alloy' }, { id: 'nova', name: 'Nova' }] }))
      expect(url).toBe('/api/v1/tts-connections?limit=100')
      return new Promise(resolve => { resolveRequest = resolve })
    }) as any
    const mount = () => {
      const page = document.createElement('div'), content = document.createElement('div'); page.append(content)
      return renderSettingsView({ draft: saved, section: 'messages', state: { references: [], conversations: [] }, page: () => ({ page, content }), onCleanup: (cleanup: () => void) => cleanups.push(cleanup), update: (next: typeof saved) => { saved = next } } as any)
    }
    const view = mount(), select = view.querySelector<HTMLSelectElement>('[aria-label="Voice message TTS connection"]')!
    view.querySelector<HTMLButtonElement>('[aria-label="Allow character voice messages"]')!.click()
    resolveRequest(Response.json({ data: [{ id: 'gpt-tts', name: 'GPT' }] }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(select.options.length).toBe(3); expect(select.value).toBe('missing')
    select.value = 'gpt-tts'; select.dispatchEvent(new dom.window.Event('change'))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(saved.ttsConnectionId).toBe('gpt-tts'); expect(saved.voiceMessages).toBe(false)
    expect(view.querySelector('[aria-label="Voice message TTS voice"]')!.parentElement!.parentElement!.hidden).toBe(true)
    const voice = view.querySelector<HTMLSelectElement>('[aria-label="Voice message provider voice"]')!, model = view.querySelector<HTMLSelectElement>('[aria-label="Voice message TTS model"]')!
    expect(voice.options.length).toBe(3); expect(model.options.length).toBe(2)
    voice.value = 'nova'; voice.dispatchEvent(new dom.window.Event('change'))
    model.value = 'gpt-4o-mini-tts'; model.dispatchEvent(new dom.window.Event('change'))
    expect(saved.ttsConnectionOptions?.['gpt-tts']).toEqual({ voice: 'nova', model: 'gpt-4o-mini-tts' })
    select.value = ''; select.dispatchEvent(new dom.window.Event('change'))
    expect(saved.ttsConnectionId).toBe(''); expect(saved.voiceMessages).toBe(false)
    select.value = 'gpt-tts'; select.dispatchEvent(new dom.window.Event('change'))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(voice.value).toBe('nova'); expect(model.value).toBe('gpt-4o-mini-tts')
    select.value = ''; select.dispatchEvent(new dom.window.Event('change'))
    cleanups.splice(0).forEach(cleanup => cleanup())
    const disposed = mount(), disposedSelect = disposed.querySelector<HTMLSelectElement>('[aria-label="Voice message TTS connection"]')!
    cleanups.splice(0).forEach(cleanup => cleanup())
    resolveRequest(Response.json({ data: [{ id: 'late', name: 'Late response' }] }))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(disposedSelect.options.length).toBe(1)
  } finally {
    cleanups.forEach(cleanup => cleanup())
    globalThis.document = previous.document; globalThis.window = previous.window; globalThis.fetch = previous.fetch; dom.window.close()
  }
})
