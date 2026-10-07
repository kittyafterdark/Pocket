import { describe, expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { runPocketGeneration } from '../src/backend/generation.js'
import { renderSettingsView } from '../src/frontend/apps/settings.js'
import { renderContactsView } from '../src/frontend/apps/contacts.js'
import { renderContactGroups } from '../src/frontend/apps/contact-groups.js'

test('sampler preferences retain zeros and reject invalid or unrelated provider parameters', () => {
  expect(normalizePreferences({ ...defaultPreferences(), samplerOverrides: { temperature: 0, top_p: 1, top_k: 4.5, min_p: -1, frequency_penalty: -2, presence_penalty: Infinity, repetition_penalty: 1.1, model: 'bad' } }).samplerOverrides).toEqual({ temperature: 0, top_p: 1, frequency_penalty: -2, repetition_penalty: 1.1 })
  expect(normalizePreferences({ ...defaultPreferences(), samplerOverrides: { temperature: '', top_p: null } }).samplerOverrides).toEqual({})
})

for (const mode of ['roleplay', 'sidecar'] as const) test(`${mode} requests use saved samplers while preserving task limits and model selection`, async () => {
  let preferences = { ...defaultPreferences(), generationMode: mode, sidecarConnectionId: 'main', sidecarModelOverride: 'override', samplerOverrides: { temperature: 0, top_p: .8 } }
  let request: any
  const host = { loadPreferences: async () => structuredClone(preferences), savePreferences: async (next: any) => (preferences = next), send: () => {}, spindle: { permissions: { has: () => true }, connections: { list: async () => [{ id: 'main', is_default: true, model: 'profile' }] }, generate: { quiet: async (input: any) => { request = input; return { content: 'OK' } } } } }
  await runPocketGeneration(host, 'message-reply', `sampler-${mode}`, { parameters: { temperature: .7, max_tokens: 512 } })
  expect(request.parameters).toEqual({ temperature: 0, top_p: .8, max_tokens: 512, ...(mode === 'sidecar' ? { model: 'override' } : {}) })
  preferences.samplerOverrides = {} as any
  await runPocketGeneration(host, 'message-reply', `default-${mode}`, { parameters: { temperature: .7 } })
  expect(request.parameters.temperature).toBe(.7)
})

test('sampler controls save, clear, reset and reopen with persisted values', () => {
  const dom = new JSDOM(); const previous = globalThis.document; globalThis.document = dom.window.document
  try {
    let saved = defaultPreferences()
    const render = () => {
      const page = document.createElement('div'), content = document.createElement('div'); page.append(content)
      return renderSettingsView({ draft: saved, section: 'generation', state: { setup: { initialized: true } }, page: () => ({ page, content }), mountModelCombobox: () => {}, update: (next: any) => { saved = normalizePreferences(next) } } as any)
    }
    let view = render()
    expect(view.querySelector('details')!.open).toBe(false)
    expect(view.querySelector('summary')!.textContent).toBe('Sampler overrides')
    for (const input of view.querySelectorAll<HTMLInputElement>('[data-pocket-sampler]')) {
      expect(input.type).toBe('range'); expect(input.labels?.length).toBe(1); expect(input.labels?.[0].textContent?.trim()).toBeTruthy()
    }
    const change = (key: string, value: string) => { const input = view.querySelector<HTMLInputElement>(`[data-pocket-sampler="${key}"]`)!; input.value = value; input.dispatchEvent(new dom.window.Event('input')) }
    change('temperature', '0'); change('top_p', '.8'); change('top_k', '25')
    expect(saved.samplerOverrides).toEqual({ temperature: 0, top_p: .8, top_k: 25 })
    view = render(); expect(view.querySelector<HTMLInputElement>('[data-pocket-sampler="temperature"]')!.value).toBe('0')
    ;[...view.querySelectorAll('button')].find(button => button.getAttribute('aria-label') === 'Use default for Top P')!.click(); expect(saved.samplerOverrides).toEqual({ temperature: 0, top_k: 25 })
    ;[...view.querySelectorAll('button')].find(button => button.textContent === 'Use sampler defaults')!.click()
    expect(saved.samplerOverrides).toEqual({}); expect(view.querySelector<HTMLInputElement>('[data-pocket-sampler="temperature"]')!.value).toBe('1')
  } finally { globalThis.document = previous; dom.window.close() }
})

test('Add Contact and NPC Bank search aliases, tags, empty results and clear without losing actions', () => {
  const dom = new JSDOM(); const previous = globalThis.document; globalThis.document = dom.window.document
  try {
    const host: any = { selectedView: 'import', state: { contacts: [], contactGroups: [] }, sources: [], npcBank: [{ id: 'npc', name: 'Alex', role: 'Pilot', identityBrief: 'Flight crew', aliases: ['Ace'], tags: ['aviation'] }], bankGroups: [], generationBrief: '', operations: new Map(), requestSources: () => {}, page: () => { const page = document.createElement('div'), content = document.createElement('div'); page.append(content); return { page, content } } }
    for (const view of [renderContactsView(host), renderContactGroups({ ...host, selectedView: 'bank' })]) {
      const search = view.querySelector<HTMLInputElement>('input[type="search"]')!
      const row = [...view.querySelectorAll<HTMLElement>('.lp-card')].find(row => row.textContent?.includes('Alex'))!
      for (const query of ['ACE', 'aviation', 'Pilot']) { search.value = query; search.dispatchEvent(new dom.window.Event('input')); expect(row.hidden).toBe(false) }
      search.value = 'missing'; search.dispatchEvent(new dom.window.Event('input')); expect(row.hidden).toBe(true); expect(view.textContent).toMatch(/No matching/)
      search.value = ''; search.dispatchEvent(new dom.window.Event('input')); expect(row.hidden).toBe(false); expect(row.querySelector('button')).not.toBeNull()
    }
  } finally { globalThis.document = previous; dom.window.close() }
})


test('search ranks exact names before prefixes, substrings and metadata, and clearing restores order', async () => {
  const { applyRankedSearch } = await import('../src/frontend/components/ranked-search.js')
  const dom = new JSDOM('<body><div id="list"></div></body>')
  const list = dom.window.document.querySelector('#list')!
  const names = ['Other', 'The Lycaon', 'Lycaon Wolf', 'Lycaon', 'Unrelated']
  const rows = names.map(name => { const node = dom.window.document.createElement('div'); node.textContent = name; list.append(node); return { node, name, terms: name === 'Other' ? 'Other lycaon tag' : name } })
  expect(applyRankedSearch(rows, 'LYCAON')).toBe(4)
  expect([...list.children].filter(node => !(node as HTMLElement).hidden).map(node => node.textContent)).toEqual(['Lycaon', 'Lycaon Wolf', 'The Lycaon', 'Other'])
  expect(rows[4].node.hidden).toBe(true)
  expect(applyRankedSearch(rows, '')).toBe(5)
  expect([...list.children].map(node => node.textContent)).toEqual(names)
  expect(applyRankedSearch(rows, ' lycaon wolf ')).toBe(1)
  dom.window.close()
})
