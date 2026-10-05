import type { PhoneState } from '../../src/types.js'
import { normalizePocketContact } from '../../src/domain/contacts.js'
import { normalizeTracker } from '../../src/domain/trackers.js'

const now = '2026-10-05T12:00:00Z'
export const trackerSampleState = {
  roleplayNow: now,
  pocketPersona: { displayName: 'Alex', avatarUrl: '' },
  discoveredActors: [],
  contacts: [normalizePocketContact({ id: 'sam', name: 'Sam', source: { kind: 'npc', origin: 'manual' } }, { now, makeId: () => 'sam', characterId: 'sam', characterName: 'Sam' })!],
} as unknown as PhoneState

export const trackerSamples = [
  { label: 'Trust', presentation: 'relationship', value: 64, target: { type: 'relationship', id: 'sam', label: 'Alex & Sam' }, bands: [{ min: 0, max: 100, label: 'Building trust', color: '#be97dc' }] },
  { label: 'Health', presentation: 'vitals', value: 83, bands: [{ min: 0, max: 100, label: 'Healthy', color: '#76bd9e' }] },
  { label: 'Condition', kind: 'state', presentation: 'state', states: ['Stable', 'Wounded', 'Recovering'], state: 'Recovering' },
  { label: 'Ammo', kind: 'counter', presentation: 'counter', value: 12, unit: ' rounds', max: 999 },
  { label: 'Next departure', kind: 'timer', presentation: 'timer', value: 23, max: 60, unit: ' min', direction: 'down', updateMode: 'automatic', ratePerHour: -60, clock: 'roleplay' },
  { label: 'Energy', presentation: 'segmented', value: 70, bands: [{ min: 0, max: 100, label: 'Rested', color: '#e3b97a' }] },
  { label: 'Scene tension', presentation: 'meter', value: 42, updateMode: 'model', bands: [{ min: 0, max: 100, label: 'Uneasy', color: '#d5a876' }] },
  { label: 'Credits', kind: 'counter', presentation: 'compact', value: 280, max: 999, unit: ' cr' },
].map((sample, index) => normalizeTracker({
  id: `sample-${index}`, kind: 'meter', unit: '%', min: 0, max: 100, color: '#a39fd1',
  target: { type: 'character', id: 'sam', label: 'Sam' }, ...sample,
}, { now, roleplayNow: now })!)
