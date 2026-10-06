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
  { label: 'Trust', presentation: 'relationship', value: 64, color: '#f36aa8', target: { type: 'relationship', id: 'sam', label: 'Alex & Sam' }, bands: [{ min: 0, max: 100, label: 'Building trust', color: '#f36aa8' }] },
  { label: 'Health', presentation: 'vitals', value: 83, color: '#55d88a', bands: [{ min: 0, max: 100, label: 'Healthy', color: '#55d88a' }] },
  { label: 'Condition', kind: 'state', presentation: 'state', states: ['Stable', 'Wounded', 'Critical', 'Recovering'], state: 'Recovering', color: '#5ac8fa' },
  { label: 'Ammo', kind: 'counter', presentation: 'counter', value: 12, unit: ' rounds', max: 999, color: '#ffb14a' },
  { label: 'Next departure', kind: 'timer', presentation: 'timer', value: 23, max: 60, unit: ' min', direction: 'down', updateMode: 'automatic', ratePerHour: -60, clock: 'roleplay', color: '#69a8ff' },
  { label: 'Hunger', presentation: 'meter', clock: 'roleplay', value: 20, color: '#ff9f43', updateMode: 'automatic', ratePerHour: 3, bands: [{ min: 0, max: 30, label: 'Sated', color: '#62c994' }, { min: 30, max: 70, label: 'Hungry', color: '#e2b85c' }, { min: 70, max: 100, label: 'Starving', color: '#ef6b73' }] },
  { label: 'Relationship Status', kind: 'state', presentation: 'state', states: ['Strangers', 'Acquaintances', 'Friends', 'Close', 'Partners'], state: 'Close', color: '#f36aa8', target: { type: 'relationship', id: 'sam', label: 'Alex & Sam' } },
  { label: 'Energy', presentation: 'segmented', value: 70, color: '#ffd45c', bands: [{ min: 0, max: 100, label: 'Rested', color: '#ffd45c' }] },
  { label: 'Scene Tension', presentation: 'meter', value: 42, updateMode: 'model', color: '#ff8d5c', target: { type: 'scene', id: '', label: 'Current scene' }, bands: [{ min: 0, max: 100, label: 'Uneasy', color: '#ff8d5c' }] },
  { label: 'World Alert', kind: 'state', presentation: 'state', states: ['Calm', 'Watchful', 'Alarmed', 'Crisis'], state: 'Alarmed', color: '#ff6b6b', target: { type: 'world', id: '', label: 'Current world' } },
  { label: 'Credits', kind: 'counter', presentation: 'compact', value: 280, max: 999, unit: ' cr', color: '#64d2ff' },
  { label: 'Ritual coherence with a needlessly long custom name', presentation: 'meter', value: 37, max: 80, unit: ' sigils', color: '#89a7d8', target: { type: 'custom', id: 'ritual', label: 'My extremely specific custom tracker' }, bands: [{ min: 0, max: 80, label: 'Holding together', color: '#89a7d8' }] },
].map((sample, index) => normalizeTracker({
  id: `sample-${index}`, kind: 'meter', unit: '%', min: 0, max: 100, color: '#a39fd1',
  target: { type: 'character', id: 'sam', label: 'Sam' }, ...sample,
}, { now, roleplayNow: now })!)
