import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { trackerDisplay, refreshTrackerDisplay, trackerUpdateDescription } from '../src/frontend/components/tracker-display.js'
import { trackerSamples, trackerSampleState } from './fixtures/tracker-samples.js'

test('tracker compositions expose one status, honest meters, and a current state rail', () => {
  const previous = globalThis.document
  const dom = new JSDOM()
  try {
    globalThis.document = dom.window.document
    const [relationship, vitals, state, counter, timer] = trackerSamples.map(tracker => trackerDisplay(tracker, trackerSampleState))
    expect(relationship.querySelectorAll('.lp-tracker-person-name').length).toBe(2)
    expect(relationship.textContent!.split('Building trust').length - 1).toBe(1)
    expect(vitals.textContent!.split('Healthy').length - 1).toBe(1)
    expect(vitals.querySelector('[role="meter"]')!.getAttribute('aria-valuenow')).toBe('83')
    expect(vitals.querySelector('.lp-vital-gauge')).toBeNull()
    expect(state.querySelectorAll('[aria-current="step"]').length).toBe(1)
    expect(state.querySelector('[aria-current="step"]')!.textContent).toBe('Recovering')
    expect(state.querySelector('button')).toBeNull()
    expect(counter.textContent).not.toContain('AVAILABLE')
    expect(timer.textContent).toContain('00:23:00')
    for (const card of [relationship, vitals, counter, timer]) expect(card.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  } finally { globalThis.document = previous; dom.window.close() }
})

test('automatic refresh preserves the actionable outer card and updates the value', () => {
  const previous = globalThis.document
  const dom = new JSDOM()
  try {
    globalThis.document = dom.window.document
    const tracker = trackerSamples[1]
    const card = trackerDisplay(tracker, trackerSampleState)
    card.tabIndex = 0; card.setAttribute('role', 'button')
    let clicks = 0; card.addEventListener('click', () => clicks++)
    refreshTrackerDisplay(card, { ...tracker, value: 55 }, trackerSampleState)
    card.click()
    expect(clicks).toBe(1)
    expect(card.tabIndex).toBe(0)
    expect(card.getAttribute('role')).toBe('button')
    expect(card.textContent).toContain('55%')
  } finally { globalThis.document = previous; dom.window.close() }
})

test('update help distinguishes story judgment from elapsed clock drift', () => {
  expect(trackerUpdateDescription('model')).toContain('tools or tags')
  expect(trackerUpdateDescription('automatic')).toContain('No model judgment')
})
