import './freeform-browser.js'
import { normalizeTracker, TRACKER_TEMPLATES } from '../../src/domain/trackers.js'
import { CUSTOM_TRACKER_PRESENTATIONS } from '../../src/domain/tracker-presentations.js'
import { trackerDisplay } from '../../src/frontend/components/tracker-display.js'
import { trackerSampleState } from './tracker-samples.js'

const fixture = (window as any).freeformFixture
const now = new Date().toISOString()
const templates = TRACKER_TEMPLATES.filter(t => t.group !== 'Blank').map((t, i) => normalizeTracker({ ...t.values, id: `template-${i}`, key: `template_${i}`, target: t.values.target || { type: 'character', id: 'host-character', label: 'Alex' }, ...(t.values.presentation === 'condition' ? { clinical: { bloodPressure: '118 / 76 mmHg', oxygenSaturation: '98%', motor: 'Left arm bandaged', allergies: 'Unknown' } } : {}) }, { now, roleplayNow: now })!)
const customs = Object.entries(CUSTOM_TRACKER_PRESENTATIONS).flatMap(([kind, presentations]) => presentations.map(([presentation, label]) => normalizeTracker({
  id: `custom-${presentation}`, key: `custom_${presentation}`, label, kind: kind === 'field' ? 'state' : kind,
  presentation, freeText: kind === 'field', states: ['Inquiry', 'Infiltration', 'Confrontation', 'Extraction'], state: kind === 'field' ? 'Investigating suspicious shipments arriving at Warehouse 9 after dusk.\nThe catwalk is guarded.' : 'Infiltration',
  min: 0, max: 100, value: 74, unit: kind === 'timer' ? ' min' : kind === 'counter' ? ' items' : '%', step: 1, direction: 'down',
  updateMode: 'manual', target: { type: 'custom', label: 'Warehouse investigation' },
}, { now, roleplayNow: now })!))
;(window as any).trackerDesignFixture = {
  async seed() {
    for (const tracker of [...templates, ...customs]) await fixture.send({ type: 'lumiphone:action', requestId: tracker.id, chatId: 'host-chat', characterId: 'host-character', action: 'tracker', payload: tracker })
  },
  gallery() {
    const gallery = document.createElement('main'); gallery.className = 'lumiphone-shell tracker-design-gallery'
    for (const tracker of [...templates, ...customs]) gallery.append(trackerDisplay(tracker, trackerSampleState))
    const style = document.createElement('style'); style.textContent = `body{overflow:auto!important}body> :not(.tracker-design-gallery):not(style):not(script){display:none!important}.tracker-design-gallery.lumiphone-shell{position:static;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:none;gap:18px;padding:24px;width:100%;max-width:none;height:auto;min-height:100vh;aspect-ratio:auto;border:0;border-radius:0;overflow:visible;background:#08090d;align-items:start;--lp-surface:#12141d;--lp-text:#f1f5f9;--lp-muted:#94a3b8;--lp-border:#ffffff18;--pocket-ui-scale:1}@media(max-width:600px){.tracker-design-gallery.lumiphone-shell{grid-template-columns:minmax(0,1fr);padding:16px}}`
    document.head.append(style); document.body.append(gallery)
  },
  boundaryGallery() {
    const gallery = document.querySelector<HTMLElement>('.tracker-design-gallery')!
    gallery.style.setProperty('--pocket-ui-scale', '1.3')
    const longStates = Array.from({ length: 12 }, (_, i) => `Milestone ${i + 1} with an unusually long state name that must stay readable`)
    gallery.replaceChildren(...[...templates, ...customs].map((tracker, index) => {
      const current = normalizeTracker({ ...tracker,
        label: 'A deliberately long tracker name that should wrap cleanly instead of hiding the title',
        ...(tracker.kind === 'state' ? tracker.freeText ? { state: index % 2 ? '' : '<script>Text stays literal.</script>\n' + 'A lengthy story note. '.repeat(60) } : { states: longStates, state: longStates[6] } : tracker.kind === 'timer' ? { max: 1e9, value: 9e8, clockPaused: true } : tracker.kind === 'counter' ? { min: -999999, max: 999999, value: -12345.67, unit: ' long resource units' } : { value: index % 2 ? tracker.max : tracker.min }),
        ...(tracker.presentation === 'alignment' ? { alignment: { lowLabel: 'A faction with a deliberately long lower-pole name', highLabel: 'A faction with a deliberately long upper-pole name' } } : {}),
      })!
      return trackerDisplay(current, trackerSampleState)
    }))
  },
}
