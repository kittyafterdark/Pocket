import type { PhoneState, PhoneTracker } from '../../types.js'
import { materializeTracker, trackerBand } from '../../domain/trackers.js'
import { resolvePocketActor } from '../../domain/actors.js'
import { el } from '../shared.js'

export function trackerPercent(tracker: PhoneTracker): number {
  return Math.max(0, Math.min(100, (tracker.value - tracker.min) / Math.max(.00001, tracker.max - tracker.min) * 100))
}

export function trackerDisplayValue(tracker: PhoneTracker): string {
  if (tracker.kind === 'state') return tracker.state
  if (tracker.kind === 'timer') {
    const unit = tracker.unit.trim().toLowerCase()
    const factor = /^(min|minutes?|m)$/.test(unit) ? 60 : /^(h|hours?|hr)$/.test(unit) ? 3600 : /^(s|seconds?|sec)$/.test(unit) ? 1 : 0
    if (factor) {
      const seconds = Math.max(0, Math.round(tracker.value * factor))
      return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':')
    }
  }
  return `${Number(tracker.value.toFixed(2))}${tracker.unit}`
}

export function trackerUpdateDescription(mode: PhoneTracker['updateMode']): string {
  return {
    manual: 'Only changes when you adjust it by hand.',
    model: 'The story model can update it through Pocket tools or tags when something happens. No elapsed-time drift.',
    automatic: 'Changes at a fixed rate as the selected clock advances. No model judgment is involved.',
    jev: 'Tracker judge estimates it from recent story messages; uncertain answers keep the current value.',
  }[mode]
}

type TrackerFlavor = 'relationship' | 'health' | 'hunger' | 'tension' | 'energy' | 'ammo' | 'timer' | 'state' | 'credits' | 'counter' | 'custom' | 'meter' | 'compact'

function trackerFlavor(tracker: PhoneTracker): TrackerFlavor {
  const identity = `${tracker.key} ${tracker.label} ${tracker.unit}`.toLowerCase()
  if (tracker.presentation === 'relationship') return 'relationship'
  if (tracker.presentation === 'vitals' || /\b(health|hp|vital|injur|condition)\b/.test(identity)) return 'health'
  if (tracker.presentation === 'timer' || tracker.kind === 'timer') return 'timer'
  if (tracker.presentation === 'state' || tracker.kind === 'state') return 'state'
  if (tracker.presentation === 'segmented' || /\b(energy|stamina|charge|mana|focus)\b/.test(identity)) return 'energy'
  if (/\b(ammo|rounds?|bullets?|shells?|magazine)\b/.test(identity)) return 'ammo'
  if (/\b(hunger|hungry|appetite|satiety|fullness|food)\b/.test(identity)) return 'hunger'
  if (/\b(tension|stress|danger|alert|suspense|threat)\b/.test(identity)) return 'tension'
  if (/\b(credits?|cash|money|coins?|funds?|balance)\b/.test(identity)) return 'credits'
  if (tracker.target.type === 'custom') return 'custom'
  if (tracker.presentation === 'compact') return 'compact'
  if (tracker.kind === 'counter') return 'counter'
  return 'meter'
}

function trackerGlyph(kind: 'link' | 'vitals' | 'counter' | 'timer' | 'meal' | 'wave' | 'bolt' | 'wallet' | 'spark' | 'ammo'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 48 48'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false')
  svg.classList.add('lp-tracker-glyph')
  const shapes = {
    link: ['M19 29l10-10', 'M17 25l-3 3a7 7 0 0010 10l6-6a7 7 0 000-10', 'M31 23l3-3a7 7 0 00-10-10l-6 6a7 7 0 000 10'],
    vitals: ['M24 38L9 23C-1 12 14 3 24 15c10-12 25-3 15 8Z', 'M9 25h9l4-9 5 15 4-6h8'],
    counter: ['M10 11h10v10H10Z', 'M28 11h10v10H28Z', 'M10 29h10v10H10Z', 'M28 29h10v10H28Z'],
    timer: ['M24 8a16 16 0 110 32 16 16 0 010-32Z', 'M24 14v10l7 4', 'M19 3h10'],
    meal: ['M9 24a15 15 0 0030 0H9Z', 'M14 17h20', 'M18 10v7M24 8v9M30 11v6'],
    wave: ['M6 26h6l4-10 6 20 7-27 6 17h7'],
    bolt: ['M28 5L12 27h12l-4 16 16-23H24l4-15Z'],
    wallet: ['M8 14h31v25H8Z', 'M8 19h31', 'M31 27h8', 'M15 9h17'],
    spark: ['M24 7v8M24 33v8M7 24h8M33 24h8', 'M13 13l6 6M29 29l6 6M35 13l-6 6M19 29l-6 6'],
    ammo: ['M17 6h14v8l-2 4v19a5 5 0 01-10 0V18l-2-4V6Z', 'M17 14h14'],
  }[kind]
  for (const d of shapes) {
    const path = document.createElementNS(svg.namespaceURI, 'path')
    path.setAttribute('d', d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor')
    path.setAttribute('stroke-width', '2'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round')
    svg.append(path)
  }
  return svg
}

function makeBars(className: string, count: number, filled = count): HTMLDivElement {
  const visual = el('div', className)
  visual.setAttribute('aria-hidden', 'true')
  for (let index = 0; index < count; index++) {
    const bar = el('span')
    bar.dataset.filled = String(index < filled)
    visual.append(bar)
  }
  return visual
}

function makeRing(percent: number, glyph: ReturnType<typeof trackerGlyph>, className = ''): HTMLDivElement {
  const ring = el('div', `lp-tracker-ring ${className}`.trim())
  ring.setAttribute('aria-hidden', 'true')
  ring.style.setProperty('--ring-percent', `${percent * 3.6}deg`)
  ring.append(el('span', 'lp-tracker-ring-core'))
  ring.querySelector('.lp-tracker-ring-core')!.append(glyph)
  return ring
}

export function trackerDisplay(tracker: PhoneTracker, state: PhoneState): HTMLDivElement {
  const current = materializeTracker(tracker, state.roleplayNow).tracker
  const flavor = trackerFlavor(current)
  const card = el('div', `lp-card lp-tracker-card lp-tracker-${current.presentation}`)
  card.dataset.trackerId = current.id; card.dataset.kind = current.kind; card.dataset.target = current.target.type; card.dataset.presentation = current.presentation; card.dataset.flavor = flavor
  const band = current.kind === 'state' ? null : trackerBand(current)
  const percent = trackerPercent(current)
  card.style.setProperty('--tracker-color', band?.color || current.color)
  card.dataset.meaning = band?.meaning || 'neutral'
  card.style.setProperty('--tracker-percent', `${percent}%`)
  const heading = el('div', 'lp-tracker-heading')
  heading.append(el('span', 'lp-eyebrow', current.target.label || current.target.type), el('h3', 'lp-title', current.label))
  const top = el('div', 'lp-tracker-top')
  const mode = el('span', 'lp-tracker-update', { manual: 'Manual', model: 'Story', automatic: 'Clock', jev: 'Tracker judge' }[current.updateMode])
  mode.title = trackerUpdateDescription(current.updateMode)
  top.append(heading, mode); card.append(top)

  const value = el('strong', 'lp-tracker-readout', trackerDisplayValue(current))
  const status = current.clockPaused ? 'Paused' : current.pausedReason || (current.kind === 'timer' ? current.direction === 'down' && current.value <= current.min ? 'Finished' : current.updateMode === 'automatic' ? current.direction === 'down' ? 'Counting down' : 'Counting up' : 'Ready' : band?.label || '')
  const stage = () => el('span', 'lp-tracker-stage', status)
  const rail = () => {
    const meter = el('div', 'lp-tracker-rail')
    meter.setAttribute('role', 'meter'); meter.setAttribute('aria-label', current.label)
    meter.setAttribute('aria-valuemin', String(current.min)); meter.setAttribute('aria-valuemax', String(current.max))
    meter.setAttribute('aria-valuenow', String(current.value)); meter.setAttribute('aria-valuetext', `${trackerDisplayValue(current)}${status ? ` · ${status}` : ''}`)
    meter.append(el('span', 'lp-tracker-rail-fill'))
    return meter
  }
  const reading = () => { const row = el('div', 'lp-tracker-reading'); row.append(value); if (status) row.append(stage()); return row }

  if (current.presentation === 'relationship') {
    const shell = el('div', 'lp-bond-widget')
    const pair = el('div', 'lp-tracker-pair')
    const other = resolvePocketActor(state, current.target.id)
    const subjects = [{ name: state.pocketPersona.displayName || 'You', avatarUrl: state.pocketPersona.avatarUrl }, { name: other?.name || current.target.label || 'Unassigned', avatarUrl: other?.avatarUrl }]
    subjects.forEach((subject, index) => {
      if (index) pair.append(trackerGlyph('link'))
      const person = el('div', 'lp-tracker-person')
      const avatar = el('span', 'lp-tracker-avatar', subject.name.slice(0, 1).toUpperCase())
      if (subject.avatarUrl) { const image = el('img'); image.src = subject.avatarUrl; image.alt = ''; avatar.replaceChildren(image) }
      person.append(avatar, el('span', 'lp-tracker-person-name', subject.name)); pair.append(person)
    })
    const bondScore = el('div', 'lp-bond-score'); bondScore.append(reading(), rail())
    shell.append(pair, bondScore); card.append(shell)
  } else if (current.presentation === 'vitals') {
    const body = el('div', 'lp-vital-body')
    body.append(makeRing(percent, trackerGlyph('vitals'), 'lp-health-ring'), reading())
    card.append(body, makeBars('lp-vital-pulse', 11, Math.max(1, Math.round(percent / 10))))
    card.append(rail())
  } else if (current.presentation === 'state' && current.kind === 'state') {
    const currentState = el('div', 'lp-state-current')
    currentState.append(el('span', 'lp-state-current-dot'), el('strong', '', current.state))
    card.append(currentState)
    const path = el('ol', 'lp-state-path'); path.setAttribute('aria-label', current.label)
    for (const label of current.states) {
      const step = el('li', '', label)
      step.dataset.active = String(label === current.state)
      if (label === current.state) step.setAttribute('aria-current', 'step')
      path.append(step)
    }
    card.append(path)
    if (current.clockPaused || current.pausedReason) card.append(stage())
  } else if (current.presentation === 'segmented') {
    const body = el('div', 'lp-energy-body')
    body.append(makeRing(percent, trackerGlyph('bolt'), 'lp-energy-ring'), reading())
    card.append(body)
    const segments = rail(); segments.className = 'lp-tracker-segments'; segments.replaceChildren()
    for (let index = 0; index < 10; index++) { const segment = el('span'); segment.dataset.filled = String(percent >= (index + 1) * 10); segments.append(segment) }
    card.append(segments)
  } else if (current.presentation === 'timer') {
    const body = el('div', 'lp-timer-instrument')
    const island = el('div', 'lp-timer-island'); island.append(trackerGlyph('timer'), reading())
    body.append(island); card.append(body)
    if (current.updateMode === 'automatic') card.append(el('span', 'lp-tracker-clock-note', `${Math.abs(current.ratePerHour)} ${current.unit.trim()} / hour · ${current.clock === 'real' ? 'Real clock' : 'Story clock'}`))
    if (current.kind === 'timer' && current.direction === 'down') card.append(rail())
  } else if (current.presentation === 'counter') {
    value.textContent = String(Number(current.value.toFixed(2)))
    if (current.unit) value.append(el('small', 'lp-counter-unit', current.unit))
    const body = el('div', 'lp-counter-instrument')
    if (flavor === 'ammo') {
      const ammo = el('div', 'lp-ammo-visual'); ammo.setAttribute('aria-hidden', 'true'); ammo.append(trackerGlyph('ammo'))
      const slots = Math.min(8, Math.max(0, Math.round(current.value)))
      for (let index = 0; index < 8; index++) { const round = el('span'); round.dataset.loaded = String(index < slots); ammo.append(round) }
      body.append(ammo, reading())
    } else {
      body.append(trackerGlyph(flavor === 'credits' ? 'wallet' : 'counter'), reading())
    }
    card.append(body)
  } else if (current.presentation === 'meter') {
    if (flavor === 'hunger') {
      const body = el('div', 'lp-hunger-body')
      body.append(makeRing(percent, trackerGlyph('meal'), 'lp-hunger-ring'), reading())
      card.append(body, rail())
    } else if (flavor === 'tension') {
      const body = el('div', 'lp-tension-body'); body.append(reading(), trackerGlyph('wave'))
      card.append(body, makeBars('lp-tension-wave', 14, Math.max(1, Math.round(percent / 100 * 14))), rail())
    } else {
      const body = el('div', 'lp-meter-body')
      const badge = el('span', 'lp-meter-badge'); badge.append(trackerGlyph(flavor === 'custom' ? 'spark' : 'counter'))
      body.append(badge, reading()); card.append(body, rail())
      const limits = el('div', 'lp-tracker-limits'); limits.append(el('span', '', `${current.min}${current.unit}`), el('span', '', `${current.max}${current.unit}`)); card.append(limits)
    }
  } else {
    card.append(reading())
  }

  const latest = current.history.at(-1)
  if (latest && current.presentation !== 'compact') {
    const delta = typeof latest.next === 'number' && typeof latest.previous === 'number' ? latest.next - latest.previous : null
    const source = { jev: 'Tracker judge', model: 'Story', tag: 'Story', automatic: 'Time', migration: 'Imported', user: 'You' }[latest.source]
    const change = delta === null ? `${latest.previous} → ${latest.next}` : `${delta > 0 ? '+' : ''}${Number(delta.toFixed(2))}${current.unit}`
    const history = el('div', 'lp-tracker-last-change', `${change} · ${source}`)
    if (latest.reason) history.title = latest.reason
    card.append(history)
  }
  return card
}

export function refreshTrackerDisplay(card: HTMLElement, tracker: PhoneTracker, state: PhoneState): void {
  const fresh = trackerDisplay(tracker, state)
  card.replaceChildren(...fresh.childNodes)
  card.style.cssText = fresh.style.cssText
  card.dataset.meaning = fresh.dataset.meaning
  card.dataset.flavor = fresh.dataset.flavor
}
