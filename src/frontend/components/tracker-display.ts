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

export function trackerDisplay(tracker: PhoneTracker, state: PhoneState): HTMLDivElement {
  const current = materializeTracker(tracker, state.roleplayNow).tracker
  const card = el('div', `lp-card lp-tracker-card lp-tracker-${current.presentation}`)
  card.dataset.trackerId = current.id; card.dataset.kind = current.kind; card.dataset.target = current.target.type
  const band = current.kind === 'state' ? null : trackerBand(current)
  card.style.setProperty('--tracker-color', band?.color || current.color)
  card.dataset.meaning = band?.meaning || 'neutral'
  card.style.setProperty('--tracker-percent', `${trackerPercent(current)}%`)
  const heading = el('div', 'lp-tracker-heading')
  heading.append(el('span', 'lp-eyebrow', current.target.label || current.target.type), el('h3', 'lp-title', current.label))
  const value = el('strong', 'lp-tracker-readout', trackerDisplayValue(current))
  const status = current.clockPaused ? 'Paused' : current.pausedReason || (current.kind === 'timer' ? current.direction === 'down' && current.value <= current.min ? 'Finished' : current.updateMode === 'automatic' ? current.direction === 'down' ? 'Counting down' : 'Counting up' : 'Ready' : band?.label || current.kind)
  if (current.presentation === 'relationship') {
    const pair = el('div', 'lp-tracker-pair')
    const other = resolvePocketActor(state, current.target.id)
    for (const subject of [{ name: state.pocketPersona.displayName || 'You', avatarUrl: state.pocketPersona.avatarUrl }, { name: other?.name || current.target.label, avatarUrl: other?.avatarUrl }]) {
      const avatar = el('span', 'lp-tracker-avatar', subject.name.slice(0, 1).toUpperCase())
      if (subject.avatarUrl) { const image = el('img'); image.src = subject.avatarUrl; image.alt = subject.name; avatar.replaceChildren(image) }
      pair.append(avatar)
    }
    card.append(pair, heading, el('div', 'lp-tracker-stage', status), value)
  } else if (current.presentation === 'vitals') {
    const gauge = el('div', 'lp-vital-gauge'); gauge.append(value)
    card.append(heading, gauge, el('span', 'lp-tracker-stage', status))
  } else if (current.presentation === 'state' && current.kind === 'state') {
    card.append(heading, value)
    const path = el('div', 'lp-state-path')
    for (const label of current.states) { const tag = el('span', '', label); tag.dataset.active = String(label === current.state); path.append(tag) }
    card.append(path)
  } else if (current.presentation === 'segmented') {
    card.append(heading, value)
    const segments = el('div', 'lp-tracker-segments')
    for (let index = 0; index < 10; index++) { const segment = el('span'); segment.dataset.filled = String(trackerPercent(current) >= (index + 1) * 10); segments.append(segment) }
    card.append(segments, el('span', 'lp-tracker-stage', status))
  } else if (current.presentation === 'timer') {
    card.append(heading)
    const dial = el('div', 'lp-timer-dial'); dial.append(value)
    card.append(dial, el('span', 'lp-tracker-stage', status))
    if (current.updateMode === 'automatic') card.append(el('span', 'lp-copy', `${Math.abs(current.ratePerHour)}${current.unit} per hour · ${current.clock === 'real' ? 'real time' : 'story time'}`))
  } else if (current.presentation === 'counter') {
    card.append(heading, el('span', 'lp-counter-caption', 'AVAILABLE'), value)
    if (current.kind === 'counter') card.append(el('span', 'lp-copy', `Changes in ${current.step}${current.unit} steps`))
  } else {
    card.append(heading, value)
    if (current.presentation === 'meter') {
      const rail = el('div', 'lp-progress'); const fill = el('span'); fill.style.setProperty('--progress', `${trackerPercent(current)}%`); fill.style.setProperty('--tracker-color', band?.color || current.color); rail.append(fill)
      const limits = el('div', 'lp-row-between lp-copy'); limits.append(el('span', '', `${current.min}${current.unit}`), el('span', '', `${current.max}${current.unit}`))
      card.append(rail, limits)
    }
  }
  const latest = current.history.at(-1)
  if (latest && current.presentation !== 'relationship' && current.presentation !== 'compact') {
    const delta = typeof latest.next === 'number' && typeof latest.previous === 'number' ? latest.next - latest.previous : null
    card.append(el('span', 'lp-tracker-last-change', delta === null ? `${latest.previous} → ${latest.next}` : `${delta > 0 ? '+' : ''}${Number(delta.toFixed(2))}${current.unit} · ${latest.source === 'jev' ? 'Open JEV' : latest.source === 'model' ? 'Story' : latest.source === 'automatic' ? 'Time' : 'You'}`))
  }
  const footer = el('div', 'lp-tracker-meta')
  footer.append(el('span', '', current.presentation === 'timer' ? `${current.clock === 'real' ? 'Real' : 'Story'} time` : status), el('span', '', current.updateMode === 'jev' ? 'Open JEV' : current.updateMode === 'model' ? 'Story updates' : current.updateMode === 'automatic' ? 'Automatic' : 'Manual'))
  card.append(footer)
  if (latest && current.presentation === 'relationship') card.append(el('p', 'lp-copy lp-tracker-change', `${latest.previous} → ${latest.next}${latest.reason ? ` · ${latest.reason}` : ''}`))
  return card
}

export function refreshTrackerDisplay(card: HTMLElement, tracker: PhoneTracker, state: PhoneState): void {
  const fresh = trackerDisplay(tracker, state)
  card.replaceChildren(...fresh.childNodes)
  card.style.cssText = fresh.style.cssText
  card.dataset.meaning = fresh.dataset.meaning
}
