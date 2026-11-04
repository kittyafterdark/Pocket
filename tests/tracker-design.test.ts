import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { CUSTOM_TRACKER_PRESENTATIONS, normalizeTrackerClinical } from '../src/domain/tracker-presentations.js'
import { applyTrackerOperation, normalizeTracker, TRACKER_TEMPLATES, validateTrackerConfig } from '../src/domain/trackers.js'
import { trackerDisplay, refreshTrackerDisplay } from '../src/frontend/components/tracker-display.js'
import { trackerSampleState } from './fixtures/tracker-samples.js'
import { trackerContext } from '../src/domain/tracker-context.js'
import { trackerIcon } from '../src/frontend/components/tracker-art.js'

const now = '2026-11-03T12:00:00Z'
test('plain fields stay plain and built-in template icons have distinct geometry', () => {
  const previous = globalThis.document, dom = new JSDOM(); globalThis.document = dom.window.document
  try {
    const plain = trackerDisplay(make('field', 'state'), trackerSampleState)
    const terminal = trackerDisplay(make('field', 'terminal'), trackerSampleState)
    expect(plain.dataset.design).toBe('plain'); expect(plain.querySelector('.lp-field-screen')).toBeNull()
    expect(terminal.querySelector('.lp-field-screen-terminal')).not.toBeNull()
    expect(plain.querySelector('.lp-design-field')?.textContent).toBe(terminal.querySelector('.lp-design-field')?.textContent)
    const icons = TRACKER_TEMPLATES.filter(t => t.group !== 'Blank').map(t => trackerIcon(t.values))
    expect(new Set(icons.map(icon => icon.innerHTML)).size).toBe(icons.length)
    for (const icon of icons) { expect(icon.getAttribute('aria-hidden')).toBe('true'); expect(icon.getAttribute('viewBox')).toBe('0 0 48 48') }
  } finally { globalThis.document = previous; dom.window.close() }
})
function make(kind: string, presentation: string) {
  return normalizeTracker({ id: 'design-fixture', key: 'design_fixture', label: 'Actual tracker name', kind: kind === 'field' ? 'state' : kind, freeText: kind === 'field', presentation, min: -100, max: 100, value: -12.5, initialValue: 0, step: .5, unit: ' marks', updateMode: 'manual', state: kind === 'field' ? '<img src=x onerror=alert(1)>\nAn actual field note.' : 'Active', initialState: 'Active', states: ['Planned', 'Active', 'Complete'], target: { type: 'custom', label: 'Story target' } }, { now })!
}

test('all twenty custom presentations validate, round trip and render real data with semantic names', () => {
  const previous = globalThis.document, dom = new JSDOM()
  globalThis.document = dom.window.document
  try {
    const ids = []
    for (const [kind, choices] of Object.entries(CUSTOM_TRACKER_PRESENTATIONS)) {
      expect(choices.length).toBe(4)
      for (const [presentation] of choices) {
        ids.push(presentation)
        const tracker = make(kind, presentation)
        expect(() => validateTrackerConfig(tracker as any)).not.toThrow()
        const restored = normalizeTracker(JSON.parse(JSON.stringify(tracker)))!
        expect(restored.presentation).toBe(presentation)
        const card = trackerDisplay(restored, trackerSampleState)
        expect(card.querySelector('h3')?.textContent).toBe('Actual tracker name')
        expect(card.querySelectorAll('button,input,select,textarea').length).toBe(0)
        expect(card.querySelector('img')).toBeNull()
        for (const svg of card.querySelectorAll('svg')) expect(svg.getAttribute('aria-hidden')).toBe('true')
        if (kind === 'state') { const active = card.querySelector('[aria-current="step"]'); expect(active?.querySelector('.lp-phase-label')?.textContent || active?.textContent).toBe('Active') }
        else if (kind === 'field') expect(card.textContent).toContain('An actual field note.')
        else { expect(card.querySelector('[role="meter"]')?.getAttribute('aria-valuenow')).toBe('-12.5'); expect(card.textContent).toContain('-12.5') }
        expect(card.textContent).not.toMatch(/STANDALONE|SERIAL #|CALIBRATED|256-BIT|Mechanical Odometer Tumbler/)
      }
    }
    expect(new Set(ids).size).toBe(20)
    const card = trackerDisplay(make('meter', 'arc'), trackerSampleState); card.setAttribute('role', 'button'); card.tabIndex = 0
    refreshTrackerDisplay(card, { ...make('meter', 'caliper'), value: 100 }, trackerSampleState)
    expect(card.dataset.design).toBe('caliper'); expect(card.getAttribute('role')).toBe('button')
  } finally { globalThis.document = previous; dom.window.close() }
})

test('clinical values are optional, bounded, persistent and updated without losing other fields', () => {
  expect(normalizeTrackerClinical({ oxygenSaturation: ' 98% ', neurological: 'x'.repeat(200), invented: 'discard' })).toEqual({ oxygenSaturation: '98%', neurological: 'x'.repeat(160) })
  expect(normalizeTrackerClinical({ age: 28, temperature: 37.1, oxygenSaturation: Infinity })).toEqual({ age: '28', temperature: '37.1' })
  const template = TRACKER_TEMPLATES.find(t => t.name === 'Physical Condition')!
  const tracker = normalizeTracker({ ...template.values, updateMode: 'model', allowModelWrite: true, clinical: { bloodPressure: '118 / 76 mmHg', airway: 'Clear' } }, { now })!
  const next = applyTrackerOperation(tracker, { operation: 'set_state', clinical: { airway: 'Supported', motor: 'Left arm bandaged' }, source: 'model', now })
  expect(next.clinical).toEqual({ bloodPressure: '118 / 76 mmHg', airway: 'Supported', motor: 'Left arm bandaged' })
  expect(next.history).toHaveLength(1)
  expect(normalizeTracker(JSON.parse(JSON.stringify(next)))?.clinical).toEqual(next.clinical)
  const context = trackerContext({ ...trackerSampleState, trackers: [next] })
  expect(context).toContain('Left arm bandaged')
  expect(trackerContext({ ...trackerSampleState, trackers: [{ ...next, visibleToModel: false }] })).not.toContain('Left arm bandaged')
})

test('Mental State and Faction Alignment are real templates and the vetoed candidates are absent', () => {
  for (const name of ['Mental State', 'Faction Alignment']) {
    const template = TRACKER_TEMPLATES.find(t => t.name === name)!
    expect(template).toBeDefined()
    expect(normalizeTracker(template.values)).not.toBeNull()
  }
  expect(TRACKER_TEMPLATES.map(t => t.name).join(' ')).not.toMatch(/Overclock|Cassette|Astrolabe/)
  const dom = new JSDOM(), previous = globalThis.document; globalThis.document = dom.window.document
  try {
    const alignment = trackerDisplay({ ...make('meter', 'alignment'), value: -50, alignment: { lowLabel: 'Harbour guild', highLabel: 'Council' } }, trackerSampleState)
    expect(alignment.textContent).toContain('Harbour guild')
    expect(alignment.querySelector('.lp-alignment-rail')?.getAttribute('style')).toContain('--alignment-span: 25%')
    const condition = trackerDisplay(normalizeTracker(TRACKER_TEMPLATES[8].values)!, trackerSampleState)
    expect(condition.textContent).not.toMatch(/TRIAGE VERIFIED|118|NKDA|AMBULANCE/)
  } finally { globalThis.document = previous; dom.window.close() }
})

test('progression renders saved milestones in order and refresh moves the active node without replacing its action', () => {
  const previous = globalThis.document, dom = new JSDOM(); globalThis.document = dom.window.document
  try {
    for (const presentation of ['waypoint', 'orbit', 'gates', 'ribbons']) {
      const tracker = make('state', presentation), card = trackerDisplay(tracker, trackerSampleState)
      card.setAttribute('role', 'button'); card.tabIndex = 0
      let opened = false; card.addEventListener('click', () => { opened = true })
      expect([...card.querySelectorAll('.lp-phase-label')].map(n => n.textContent)).toEqual(['Planned', 'Active', 'Complete'])
      expect(card.querySelectorAll('[aria-current="step"]').length).toBe(1)
      refreshTrackerDisplay(card, { ...tracker, state: 'Complete' } as any, trackerSampleState)
      expect(card.querySelector('[aria-current="step"] .lp-phase-label')?.textContent).toBe('Complete')
      expect(card.querySelectorAll('[data-phase="past"]').length).toBe(2)
      card.click(); expect(opened).toBe(true); expect(card.tabIndex).toBe(0)
    }
  } finally { globalThis.document = previous; dom.window.close() }
})

test('live instruments retain their reference compositions and use unique SVG masks across repeated cards', () => {
  const previous = globalThis.document, dom = new JSDOM(); globalThis.document = dom.window.document
  try {
    const mental = trackerDisplay(make('meter', 'sanity'), trackerSampleState)
    const fracture = mental.querySelector('.lp-lucidity-fracture')!
    expect(fracture.getAttribute('viewBox')).toBe('0 0 300 60')
    expect(fracture.querySelectorAll('path').length).toBe(3)
    const watch = trackerDisplay(make('timer', 'watch'), trackerSampleState)
    expect(watch.querySelector('dl')?.querySelectorAll('dt').length).toBe(3)
    expect(watch.textContent).not.toMatch(/74 BPM|GPS FIX|88%/)
    const ids: string[] = []
    for (const presentation of ['hunger', 'arc', 'hourglass']) {
      for (let i = 0; i < 2; i++) {
        const tracker = { ...make(presentation === 'hourglass' ? 'timer' : 'meter', presentation), updateMode: 'automatic', ratePerHour: 1, clockPaused: i === 1, lastUpdated: new Date().toISOString() } as const
        const card = trackerDisplay(tracker as any, trackerSampleState)
        for (const element of card.querySelectorAll('[id]')) ids.push(element.id)
        if (presentation === 'hourglass') expect(card.querySelector('[data-animating]')?.getAttribute('data-animating')).toBe(String(i === 0))
      }
    }
    expect(new Set(ids).size).toBe(ids.length)
  } finally { globalThis.document = previous; dom.window.close() }
})
