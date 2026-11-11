import { uuid } from '../../domain/uuid.js'
import type { PhoneState, PhoneTracker } from '../../types.js'
import { resolvePocketActor } from '../../domain/actors.js'
import { CLINICAL_FIELDS } from '../../domain/tracker-presentations.js'
import { el } from '../shared.js'
import { designBars, trackerArt, trackerVector, trackerLed } from './tracker-art.js'

interface DesignParts { percent: number; value: HTMLElement; status: string; reading(): HTMLElement; rail(): HTMLElement; stage(): HTMLElement }

export function trackerDesignId(t: PhoneTracker): string {
  if (t.presentation === 'compact' || t.presentation === 'segmented') return ''
  if (t.kind === 'state' && t.freeText) return ['terminal', 'vellum', 'hud', 'report'].includes(t.presentation) ? t.presentation : 'plain'
  if (t.presentation === 'vitals') return 'health'
  if (t.presentation === 'relationship') return 'relationship'
  const identity = `${t.key} ${t.label}`.toLowerCase()
  if (t.presentation === 'meter') return /hunger|satiety|fullness/.test(identity) ? 'hunger' : /tension/.test(identity) ? 'tension' : 'arc'
  if (t.presentation === 'counter') return /ammo|rounds|bullets/.test(identity) ? 'ammo' : 'odometer'
  if (t.presentation === 'state') return /condition/.test(identity) ? 'condition' : t.target.type === 'relationship' ? 'orbit' : t.target.type === 'world' ? 'world' : 'waypoint'
  return t.presentation
}

export function renderTrackerDesign(card: HTMLElement, t: PhoneTracker, state: PhoneState, p: DesignParts): boolean {
  const design = trackerDesignId(t)
  if (!design) return false
  card.dataset.design = design
  const body = el('div', `lp-design-body lp-design-${design}`)
  const caption = (text: string) => el('span', 'lp-instrument-caption', text)
  const panel = (className = '') => el('div', `lp-instrument-panel ${className}`)
  const meta = (left: string, right = '') => { const row = el('div', 'lp-instrument-meta'); row.append(el('span', '', left), el('span', '', right)); return row }
  const limits = () => meta(`${t.min}${t.unit}`, `${t.max}${t.unit}`)
  const semanticMeter = () => { const meter = p.rail(); meter.classList.add('lp-design-sr-value'); return meter }
  const phaseIndex = t.kind === 'state' ? t.states.indexOf(t.state) : -1
  const phaseCount = t.kind === 'state' ? t.states.length : 0
  const phaseNumber = phaseIndex >= 0 ? String(phaseIndex + 1).padStart(2, '0') : '—'
  const phaseSummary = (label: string) => {
    const summary = el('div', 'lp-phase-summary'), copy = el('div')
    copy.append(caption(label), el('strong', 'lp-phase-summary-value', t.kind === 'state' ? t.state : ''))
    summary.append(copy, el('span', 'lp-phase-count', phaseIndex >= 0 ? `${phaseIndex + 1} of ${phaseCount}` : ''))
    return summary
  }
  const phases = (variant: string) => {
    const list = el('ol', `lp-phase-list lp-phase-${variant}`); list.setAttribute('aria-label', `${t.label} states`)
    list.style.setProperty('--phase-count', String(Math.max(1, phaseCount)))
    if (t.kind !== 'state') return list
    list.dataset.wide = String(t.states.length > 5 || t.states.some(label => label.length > 32))
    t.states.forEach((label, index) => {
      const item = el('li'), marker = el('span', 'lp-phase-marker'), text = el('span', 'lp-phase-label', label)
      item.dataset.phase = index < phaseIndex ? 'past' : index === phaseIndex ? 'current' : 'future'
      if (index === phaseIndex) item.setAttribute('aria-current', 'step')
      marker.setAttribute('aria-hidden', 'true'); marker.dataset.index = String(index + 1).padStart(2, '0')
      if (index < phaseIndex) marker.append(trackerVector('0 0 24 24', '<path d="m5 12 4 4L19 6" stroke-width="2.5"/>'))
      else if (variant === 'orbit' && index > phaseIndex) marker.append(trackerVector('0 0 24 24', '<rect x="6" y="10" width="12" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>'))
      if (variant === 'gates') { const gate = el('div', 'lp-gate-heading'); gate.append(el('span', '', `Gate ${String(index + 1).padStart(2, '0')}`), el('i', 'lp-gate-led')); gate.setAttribute('aria-hidden', 'true'); item.append(gate) }
      if (['waypoint', 'orbit'].includes(variant)) item.append(marker)
      item.append(text); list.append(item)
    })
    return list
  }
  const nextPhase = () => t.kind === 'state' && phaseIndex >= 0 && phaseIndex + 1 < phaseCount ? `Next: ${t.states[phaseIndex + 1]}` : 'Final milestone'
  const clockSource = t.updateMode === 'automatic' ? t.clock === 'real' ? 'Real time' : 'Story time' : 'Manual'
  const rate = `${t.ratePerHour > 0 ? '+' : ''}${Number(t.ratePerHour.toFixed(2))}${t.unit} / hour`
  const bandLabels = (className: string) => {
    const labels = el('div', className)
    t.bands.forEach((band, index) => { const label = el('span', '', band.label); label.dataset.active = String(t.value >= band.min && (t.value < band.max || index === t.bands.length - 1)); label.style.setProperty('--band-color', band.color); labels.append(label) })
    return labels
  }
  if (design === 'relationship') {
    const dossier = panel('lp-bond-dossier'), pair = el('div', 'lp-dossier-pair'), other = resolvePocketActor(state, t.target.id)
    const subjects = [{ name: state.pocketPersona.displayName || 'You', image: state.pocketPersona.avatarUrl }, { name: other?.name || t.target.label || 'Unassigned', image: other?.avatarUrl }]
    subjects.forEach((subject, index) => {
      if (index) {
        const bridge = el('div', 'lp-bond-bridge'), badge = el('span', 'lp-bond-link')
        badge.append(trackerVector('0 0 24 24', '<path d="m10 14 4-4m-7 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m1-1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/>'), el('span', '', 'Bond'))
        bridge.append(badge, el('span', 'lp-bond-filament'), el('small', '', 'Affinity resonance')); pair.append(bridge)
      }
      const person = el('div', 'lp-dossier-person'), avatar = el('span', 'lp-dossier-avatar', subject.name.slice(0, 2).toUpperCase())
      if (subject.image) { const img = el('img'); img.src = subject.image; img.alt = ''; avatar.replaceChildren(img) }
      person.append(avatar, el('span', 'lp-tracker-person-name', subject.name)); pair.append(person)
    })
    dossier.append(pair); body.append(dossier, p.reading(), p.rail())
    const ranges = el('div', 'lp-bond-ranges'); ranges.append(...t.bands.map(band => el('span', '', `${band.label} ${band.min}–${band.max}`))); body.append(ranges)
  } else if (design === 'health') {
    const display = panel('lp-biomonitor')
    display.append(meta('Lead II · ECG', 'Health trace'), trackerVector('0 0 300 80', '<path d="M0 45h50l5-25 7 50 8-60 8 50 7-15h55l5-23 7 46 8-56 8 46 7-13h55l5-21 7 43 8-52 8 42 7-12h35"/>', 'lp-ekg-wave'), limits())
    const segments = p.rail(); segments.classList.add('lp-biomonitor-segments'); segments.replaceChildren(...designBars(12, Math.round(p.percent / 100 * 12), 'lp-biomonitor-bars').childNodes)
    body.append(display, p.reading(), segments)
  } else if (design === 'hunger') {
    const hearth = panel('lp-hearth-panel'), dial = el('div', 'lp-hearth-dial'), mask = `hearth-${uuid()}`
    dial.append(trackerVector('0 0 100 100', `<defs><mask id="${mask}"><circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="9" pathLength="100" stroke-dasharray="22 3" transform="rotate(-90 50 50)"/></mask></defs><circle cx="50" cy="50" r="40" stroke="#431407" stroke-width="8" mask="url(#${mask})"/><circle cx="50" cy="50" r="40" stroke="#ea580c" stroke-width="8" pathLength="100" stroke-dasharray="${p.percent} 100" transform="rotate(-90 50 50)" mask="url(#${mask})"/><path d="M11.3 1.046A1 1 0 0 1 12 2v5h4a1 1 0 0 1 .82 1.573l-7 10A1 1 0 0 1 8 18v-5H4a1 1 0 0 1-.82-1.573l7-10a1 1 0 0 1 1.12-.38Z" transform="translate(34 30) scale(1.7)" fill="#fb923c" stroke="none"/>`))
    const copy = el('div', 'lp-hearth-copy'); copy.append(caption('Current level'), p.reading())
    if (t.updateMode === 'automatic') copy.append(el('p', 'lp-instrument-copy', `Changes at ${rate.toLowerCase()} on ${clockSource.toLowerCase()}.`))
    hearth.append(dial, copy); body.append(hearth, meta(t.updateMode === 'automatic' ? `Rate: ${rate}` : 'Manual updates', clockSource), semanticMeter())
  } else if (design === 'tension') {
    const graph = panel('lp-seismograph'); graph.append(meta('Seismic threat detector', p.status))
    const trace = trackerVector('0 0 200 50', '<path d="M0 25h20l15-3 10 8 10-20 10 35 10-40 10 43 10-28 15 5h15l10-10 10 23 10-30 10 34 10-17h25"/>', 'lp-threat-trace')
    trace.style.setProperty('--threat-amplitude', String(.15 + p.percent / 100 * .85)); graph.append(trace)
    body.append(graph, p.reading(), designBars(4, Math.ceil(p.percent / 25), 'lp-threat-tiers'), semanticMeter())
  } else if (design === 'sanity') {
    const glass = panel('lp-lucidity-glass'), readout = p.reading(), metric = el('div', 'lp-lucidity-metric'); metric.append(p.value, caption('Lucidity')); readout.prepend(metric)
    const d = 'M0 30h45l25-18 25 36 30-28 30 22 30-27 30 23 35-13 50 5'
    const fracture = trackerVector('0 0 300 60', `<path d="${d}" stroke="#ec4899" stroke-width="2.5" opacity=".65"/><path d="${d}" stroke="#22d3ee" stroke-width="2.5" opacity=".65" transform="translate(2 -2)"/><path d="${d}" stroke="#fff" stroke-width="1.8"/>`, 'lp-lucidity-fracture')
    fracture.setAttribute('preserveAspectRatio', 'none')
    glass.append(readout, fracture, bandLabels('lp-lucidity-stages')); body.append(glass, semanticMeter())
  } else if (design === 'alignment') {
    const arena = panel('lp-faction-arena'), poles = el('div', 'lp-faction-poles')
    const heraldry = (side: 'low' | 'high', name: string, bound: number) => {
      const pole = el('div', `lp-faction-pole lp-faction-${side}`), crest = el('span', 'lp-faction-crest'), text = el('div')
      crest.append(trackerVector('0 0 24 24', side === 'low' ? '<path d="M5 13V9a7 7 0 0 1 14 0v4l-3 2v5H8v-5Zm4 4h6m-5 0v3m4-3v3"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>' : '<path d="m3 6 5 4 4-6 4 6 5-4-3 12H6ZM6 21h12"/>'))
      text.append(el('strong', '', name), el('small', '', `${bound > 0 ? '+' : ''}${bound}`)); pole.append(crest, text); return pole
    }
    poles.dataset.longNames = String(Math.max(t.alignment?.lowLabel.length || 0, t.alignment?.highLabel.length || 0) > 24)
    const lean = el('div', 'lp-faction-lean'); if (t.value > 0) p.value.prepend('+'); lean.append(p.value, p.stage(), caption('Current lean'))
    poles.append(heraldry('low', t.alignment?.lowLabel || 'Outlaw', t.min), lean, heraldry('high', t.alignment?.highLabel || 'Paragon', t.max))
    const neutral = Math.max(0, Math.min(100, (0 - t.min) / Math.max(.00001, t.max - t.min) * 100)), rail = p.rail()
    rail.classList.add('lp-alignment-rail'); rail.style.setProperty('--alignment-origin', `${neutral}%`); rail.style.setProperty('--alignment-start', `${Math.min(neutral, p.percent)}%`); rail.style.setProperty('--alignment-span', `${Math.abs(neutral - p.percent)}%`); rail.dataset.lean = t.value < 0 ? 'low' : 'high'
    const scaleLabels = el('div', 'lp-faction-scale-labels'); scaleLabels.append(el('span', '', String(t.min)), el('span', '', 'Equilibrium · 0'), el('span', '', String(t.max)))
    arena.append(poles, rail, scaleLabels); body.append(arena)
  } else if (t.kind === 'state' && !t.freeText) {
    if (design === 'condition') {
      const clamp = el('div', 'lp-clipboard-clamp'); clamp.setAttribute('aria-hidden', 'true'); clamp.append(trackerArt('clipboard')); card.prepend(clamp)
      body.append(el('strong', 'lp-condition-value', t.state))
      const details = el('dl', 'lp-clinical-grid')
      for (const [key, label] of CLINICAL_FIELDS) { if (!t.clinical?.[key]) continue; const field = el('div'); field.append(el('dt', '', label), el('dd', '', t.clinical[key]!)); details.append(field) }
      if (details.childElementCount) body.append(details)
      body.append(phases('condition'))
    } else if (design === 'orbit' || design === 'waypoint') {
      const map = panel(`lp-${design}-map`); map.append(phases(design)); body.append(map, phaseSummary(design === 'orbit' ? 'Current milestone' : 'Active stage'), meta(nextPhase(), `${phaseNumber} / ${phaseCount}`))
    } else if (design === 'world') {
      const recon = panel('lp-world-recon'), radar = el('div', 'lp-recon-radar'); radar.setAttribute('aria-hidden', 'true'); radar.append(el('span', 'lp-radar-quadrant'), el('i', 'lp-recon-blip'))
      const posture = el('div', 'lp-world-posture'); posture.append(caption('Planetary posture'), el('strong', '', t.state))
      const latest = t.history.at(-1); if (latest?.reason) posture.append(el('p', 'lp-instrument-copy', latest.reason))
      recon.append(radar, posture); body.append(recon, phases('world'), meta(t.target.label || 'World', `State ${phaseIndex + 1} of ${phaseCount}`))
    } else if (design === 'rotary') {
      const selector = panel('lp-rotary-selector'), dial = el('div', 'lp-rotary-index', phaseNumber); dial.setAttribute('aria-hidden', 'true')
      const selected = el('div', 'lp-rotary-selected'), list = el('ol', 'lp-rotary-current'), item = el('li', '', t.state)
      item.setAttribute('aria-current', 'step'); list.append(item); selected.append(caption('Active switch selection'), list)
      selector.append(dial, selected); body.append(selector, meta(`Index positions: ${phaseCount}`, nextPhase()))
    } else if (design === 'gates') body.append(phases('gates'), phaseSummary('Current phase'))
    else body.append(phases('ribbons'), meta('Narrative cadence', `Phase ${phaseNumber}`))
    if (p.status && (t.clockPaused || t.pausedReason)) body.append(p.stage())
  } else if (t.kind === 'state' && t.freeText && design === 'plain') {
    body.append(el('p', 'lp-design-field', t.state || 'No text yet'))
  } else if (t.kind === 'state' && t.freeText) {
    const screen = panel(`lp-field-screen lp-field-screen-${design}`), text = el('p', 'lp-design-field', t.state || 'No text yet')
    if (design === 'report') { const metadata = el('dl', 'lp-field-metadata'); metadata.append(el('dt', '', 'Key'), el('dd', '', t.key), el('dt', '', 'Target'), el('dd', '', t.target.label || t.target.type)); screen.append(metadata) }
    screen.append(text)
    if (design === 'terminal') { const latest = t.history.at(-1), source = latest ? ({ model:'Story model', tag:'Story tag', user:'You', automatic:'Clock', jev:'Tracker judge', migration:'Import' }[latest.source]) : ''; screen.append(meta(source ? `Source: ${source}` : `Key: ${t.key}`, `${t.state.length} characters`)) }
    else body.append(meta(`${t.state.length} characters`, t.target.label || t.target.type))
    body.prepend(screen)
  } else if (['timer', 'watch', 'radar', 'hourglass'].includes(design)) {
    const timer = panel(`lp-clock-panel lp-clock-panel-${design}`)
    if (design === 'watch') {
      if ((p.value.textContent?.length || 0) > 10 && p.value.textContent?.includes(':')) { const pieces = p.value.textContent.split(':'); p.value.replaceChildren(el('span', '', pieces.slice(0, -2).join(':') + ':'), el('span', '', pieces.slice(-2).join(':'))) }
      const watch = el('div', 'lp-watch-display'), face = el('div', 'lp-watch-oled'); face.append(p.value, caption(t.kind === 'timer' && t.direction === 'down' ? 'Countdown' : 'Stopwatch')); watch.append(face)
      const facts = el('dl', 'lp-watch-complications')
      for (const [label, value] of [['Clock', clockSource], ['Status', p.status], ['Rate', t.updateMode === 'automatic' ? rate : 'Manual']]) { const row = el('div'); row.append(el('dt', '', label), el('dd', '', value)); facts.append(row) }
      timer.append(watch, facts)
    } else if (design === 'radar') {
      const radar = el('div', 'lp-timer-radar'); radar.append(el('span', 'lp-radar-quadrant'), el('strong', 'lp-radar-center', `${Number(t.value.toFixed(1))}${t.unit}`)); radar.setAttribute('aria-hidden', 'true')
      const copy = el('div', 'lp-clock-reading'); copy.append(p.value, caption(t.kind === 'timer' && t.direction === 'down' ? 'Time remaining' : 'Elapsed time')); timer.append(radar, copy)
    } else if (design === 'hourglass') {
      const chamber = el('div', 'lp-hourglass-chamber'), id = `sand-${uuid()}`, top = p.percent / 100 * 35, bottom = 35 - top
      chamber.append(trackerVector('0 0 60 90', `<defs><clipPath id="${id}-top"><rect x="0" y="${45 - top}" width="60" height="${top}"/></clipPath><clipPath id="${id}-bottom"><rect x="0" y="${80 - bottom}" width="60" height="${bottom}"/></clipPath></defs><path d="M10 10h40c0 20-15 35-20 35S10 30 10 10ZM30 45c5 0 20 15 20 35H10c0-20 15-35 20-35Z"/><path d="M10 10h40c0 20-15 35-20 35S10 30 10 10Z" fill="currentColor" opacity=".2" clip-path="url(#${id}-top)"/><path d="M30 45c5 0 20 15 20 35H10c0-20 15-35 20-35Z" fill="currentColor" opacity=".4" clip-path="url(#${id}-bottom)"/><path d="M6 10h48M6 80h48" stroke-width="4"/>`, 'lp-hourglass-vector'), el('i', 'lp-hourglass-particle'))
      const copy = el('div', 'lp-clock-reading'); copy.append(caption(t.kind === 'timer' && t.direction === 'down' ? 'Time remaining' : 'Elapsed time'), p.value, p.stage()); timer.append(chamber, copy)
    } else timer.append(caption(t.kind === 'timer' && t.direction === 'down' ? 'Time remaining' : 'Elapsed time'), p.reading(), caption('Hours : minutes : seconds'))
    body.dataset.animating = String(!t.clockPaused && !t.pausedReason && !(t.kind === 'timer' && t.direction === 'down' && t.value <= t.min))
    body.append(timer)
    if (design === 'timer') body.append(p.rail())
    else body.append(semanticMeter())
    body.append(meta(clockSource, design === 'watch' ? t.kind === 'timer' && t.direction === 'down' ? 'Countdown' : 'Stopwatch' : p.status))
  } else if (['ammo', 'odometer', 'led', 'crates', 'tally'].includes(design)) {
    body.classList.add('lp-counter-instrument')
    if (design === 'ammo') {
      const housing = panel('lp-magazine-housing'), ammo = el('div', 'lp-ammo-visual'); ammo.setAttribute('aria-hidden', 'true')
      housing.append(meta('Magazine rack', '8 display slots'))
      for (let i = 0; i < 8; i++) { const round = el('span'); round.dataset.loaded = String(i < Math.max(0, Math.min(8, Math.floor(t.value)))); ammo.append(round) }
      housing.append(ammo); body.append(housing, p.reading(), semanticMeter())
    } else if (design === 'odometer') {
      const housing = panel('lp-register-housing'), drums = el('div', 'lp-odometer-drums'); drums.setAttribute('aria-hidden', 'true')
      for (const character of String(Number(t.value.toFixed(2))).padStart(3, '0')) drums.append(el('span', 'odometer-wheel', character))
      housing.dataset.longValue = String(String(Number(t.value.toFixed(2))).length > 5)
      housing.append(drums, p.reading()); body.append(housing, meta(`Step: ${t.kind === 'counter' ? t.step : 1}`, t.unit.trim()), semanticMeter())
    } else if (design === 'led') {
      const display = panel('lp-led-screen'); display.append(trackerLed(t.value), el('small', 'lp-design-led-unit', t.unit)); p.value.classList.add('lp-design-sr-value'); body.append(display, p.reading(), semanticMeter())
    } else if (design === 'crates') {
      const crates = el('div', 'lp-supply-crates'); crates.setAttribute('aria-hidden', 'true')
      for (let i = 0; i < 8; i++) { const crate = el('span'); crate.dataset.filled = String(i < Math.round(p.percent / 100 * 8)); crate.append(el('small', '', `Crate ${i + 1}`)); crates.append(crate) }
      body.append(crates, p.reading(), meta('8 display slots', `${Math.round(p.percent)}% of range`), semanticMeter())
    } else { const rack = panel('lp-tally-panel'), rail = p.rail(); rail.classList.add('lp-notched-tally'); rack.append(p.reading(), rail); body.append(rack, meta(`Increment: ${t.kind === 'counter' ? t.step : 1}`, t.unit.trim())) }
  } else {
    const instrument = panel(`lp-value-panel lp-value-panel-${design}`)
    if (design === 'arc') {
      const gauge = el('div', 'lp-arc-gauge'), id = `arc-${uuid()}`
      gauge.append(trackerVector('0 0 200 110', `<defs><linearGradient id="${id}"><stop stop-color="#06b6d4"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><path d="M20 90a80 80 0 0 1 160 0" stroke="#1e293b" stroke-width="12" stroke-linecap="round"/><path d="M20 90a80 80 0 0 1 160 0" stroke="url(#${id})" stroke-width="12" pathLength="100" stroke-dasharray="${p.percent} 100" stroke-linecap="round"/>`), p.value)
      instrument.append(gauge, limits()); body.append(instrument, p.stage(), semanticMeter())
    } else if (design === 'barcode') { instrument.append(p.reading(), designBars(24, Math.round(p.percent / 100 * 24), 'lp-cyber-barcode'), limits()); body.append(instrument, semanticMeter()) }
    else if (design === 'capsule') {
      const readout = el('div', 'lp-capsule-reading'), icon = el('span', 'lp-capsule-delta'); icon.append(trackerVector('0 0 24 24', '<path d="m12 4 9 16H3Z"/>')); readout.append(icon, p.reading()); instrument.append(readout, p.rail()); body.append(instrument, limits())
    } else { const rule = designBars(31, 31, 'lp-caliper-rule'); rule.append(el('i', 'lp-caliper-jaw')); instrument.append(p.reading(), rule, limits()); body.append(instrument, semanticMeter()) }
  }
  card.append(body)
  return true
}
