import type { TrackerKind, TrackerPresentation } from '../types.js'

export const CUSTOM_TRACKER_PRESENTATIONS = {
  meter: [['arc', 'Arc Horizon'], ['barcode', 'Cyber Barcode'], ['capsule', 'Swiss Capsule'], ['caliper', 'Vernier Caliper']],
  counter: [['odometer', 'Odometer Tumbler'], ['led', 'LED Tally'], ['crates', 'Supply Crates'], ['tally', 'Stepped Tally Rack']],
  state: [['waypoint', 'Waypoint Blueprint'], ['gates', 'Phase Gates'], ['rotary', 'Rotary Switch'], ['ribbons', 'Milestone Ribbons']],
  field: [['terminal', 'Terminal Dossier'], ['vellum', 'Vellum Field Note'], ['hud', 'HUD Teleprompter'], ['report', 'Split-View Report']],
  timer: [['timer', 'Aerospace Chronometer'], ['watch', 'Smart Watch'], ['radar', 'Radar Dial'], ['hourglass', 'Particle Hourglass']],
} as const

const SPECIAL = {
  meter: [['vitals', 'Health biomonitor'], ['hunger', 'Caloric hearth'], ['relationship', 'Trust dossier'], ['tension', 'Tension seismograph'], ['sanity', 'Mental state rift'], ['alignment', 'Faction scales'], ['segmented', 'Energy segments'], ['meter', 'Classic meter']],
  counter: [['counter', 'Ammo / classic counter']],
  state: [['condition', 'Physical condition clipboard'], ['orbit', 'Relationship milestone path'], ['world', 'World alert radar'], ['state', 'Classic state']],
  field: [['state', 'Plain text']],
  timer: [],
} as const

export function trackerPresentations(kind: TrackerKind, freeText = false): Array<[TrackerPresentation, string]> {
  const key = kind === 'state' && freeText ? 'field' : kind
  return [...CUSTOM_TRACKER_PRESENTATIONS[key], ...SPECIAL[key], ['compact', 'Compact']] as Array<[TrackerPresentation, string]>
}

export const CLINICAL_FIELDS = [
  ['age', 'Age'], ['bloodType', 'Blood type'], ['allergies', 'Allergies'],
  ['bloodPressure', 'Blood pressure'], ['oxygenSaturation', 'Oxygen saturation'], ['temperature', 'Core temperature'],
  ['neurological', 'Neurological'], ['airway', 'Airway'], ['circulation', 'Circulation'], ['motor', 'Musculoskeletal / motor'],
] as const
export type ClinicalField = typeof CLINICAL_FIELDS[number][0]
export type TrackerClinical = Partial<Record<ClinicalField, string>>

export function normalizeTrackerClinical(value: unknown): TrackerClinical {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return Object.fromEntries(CLINICAL_FIELDS.flatMap(([key]) => {
    const value = raw[key]
    const text = typeof value === 'string' ? value.trim().slice(0, 160) : typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
    return text ? [[key, text]] : []
  }))
}
