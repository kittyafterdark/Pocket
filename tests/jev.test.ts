import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { normalizeJevSettings } from '../src/domain/jev.js'
import { jevLlmRequest, readJevAnswers, runTypeSafeJev } from '../src/backend/jev.js'
import { defaultPreferences } from '../src/domain/preferences.js'
import { renderSettingsView } from '../src/frontend/apps/settings.js'

const questions = [{ type: 'choice' as const, question: 'Current mood?', options: ['Calm', 'Angry'] }]

test('legacy Space settings require fresh opt-in; recognized providers retain settings', () => {
  expect(normalizeJevSettings({ enabled: true, autoAfterTurn: true, endpoint: 'https://old.example' })).toEqual({ enabled: false, autoAfterTurn: false, provider: 'llm', model: 'jev-latest' })
  expect(normalizeJevSettings({ enabled: true, provider: 'typesafe', model: 'jev-1', autoAfterTurn: true }).enabled).toBe(true)
  expect(normalizeJevSettings({ provider: 'typesafe', model: 'https://other.example' }).model).toBe('jev-latest')
})

test('keyed choice answers preserve provider confidence and reject changed criteria', () => {
  const response = { answers: { q1: { type: 'choice', choice: 'Calm', confidence: .4, probabilities: { Calm: .9, Angry: .1 } } } }
  expect(readJevAnswers(response, questions)[0]).toMatchObject({ chosen: 'Calm', chosen_index: 0, confidence: .4, probs: [.9, .1] })
  response.answers.q1.probabilities = { Calm: .9, Other: .1 } as any
  expect(readJevAnswers(response, questions)[0]).toMatchObject({ type: 'invalid' })
  expect(() => readJevAnswers({ answers: {} }, questions)).toThrow('incomplete')
})

test('native request errors never echo response bodies or credentials', async () => {
  await expect(runTypeSafeJev(async () => ({ status: 401, body: 'private-key-example' }), 'private-key-example', 'jev-latest', 'Synthetic state', questions)).rejects.toThrow('HTTP 401')
  await expect(runTypeSafeJev(async () => ({ status: 200, body: 'private-key-example' }), 'private-key-example', 'jev-latest', 'Synthetic state', questions)).rejects.toThrow('invalid JSON')
  let called = false
  await expect(runTypeSafeJev(async () => { called = true }, '', 'jev-latest', 'Synthetic state', questions)).rejects.toThrow('API key')
  expect(called).toBe(false)
  const request = jevLlmRequest('Synthetic state', questions) as any
  expect(JSON.parse(request.messages[1].content).questions.q1.criteria).toEqual({ Calm: null, Angry: null })
})

test('judge settings switch providers, label controls, and keep credentials out of preferences', () => {
  const dom = new JSDOM(), previous = globalThis.document
  globalThis.document = dom.window.document
  try {
    let saved = defaultPreferences()
    const messages: unknown[] = []
    const page = document.createElement('div'), content = document.createElement('div'); page.append(content)
    renderSettingsView({ draft: saved, section: 'jev', jevKeyConfigured: true, page: () => ({ page, content }), update: (next: typeof saved) => { saved = next }, send: (type: string, payload: unknown) => messages.push({ type, payload }), showError: () => { throw new Error('Unexpected validation failure') } } as any)
    const labelled = (name: string) => [...page.querySelectorAll('label')].find(label => label.querySelector('.lp-field-label, .lp-control-label')?.textContent === name)!.querySelector('input, select') as HTMLInputElement | HTMLSelectElement
    const provider = labelled('Provider') as HTMLSelectElement
    const key = labelled('TypeSafe API key') as HTMLInputElement
    expect(key.type).toBe('password')
    expect(key.closest('div')!.hidden).toBe(true)
    provider.value = 'typesafe'; provider.dispatchEvent(new dom.window.Event('change'))
    expect(key.closest('div')!.hidden).toBe(false)
    expect(key.value).toBe('')
    key.value = 'synthetic-test-key'
    const click = (name: string) => [...page.querySelectorAll('button')].find(button => button.textContent === name)!.click()
    click('Save API key'); expect(key.value).toBe('')
    ;(labelled('Enable tracker judge') as HTMLInputElement).checked = true
    click('Save judge settings')
    expect(saved.jev.provider).toBe('typesafe'); expect(saved.jev.enabled).toBe(true)
    expect(JSON.stringify(saved)).not.toContain('synthetic-test-key')
    click('Remove API key')
    expect(messages).toEqual([{ type: 'lumiphone:jev_save_key', payload: { apiKey: 'synthetic-test-key' } }, { type: 'lumiphone:jev_save_key', payload: { apiKey: '' } }])
  } finally { globalThis.document = previous; dom.window.close() }
})
