import { clockLabel } from './clock-label.js'
import type { PhoneState, PocketActivity, PocketActivityPresentation, PocketRoleplayClockSnapshot } from '../types.js'

export function snapshotActivityClock(state: PhoneState): Pick<PocketActivityPresentation, 'storyAt' | 'storyTimeLabel' | 'storyTimezoneOffsetMinutes'> {
  const exact = state.roleplayClockSource === 'manual' || state.roleplayClockPrecision === 'exact'
  return {
    storyAt: exact && validStamp(state.roleplayNow) ? state.roleplayNow : undefined,
    storyTimeLabel: exact ? undefined : clockLabel(state.roleplayClockLabel) || undefined,
    storyTimezoneOffsetMinutes: state.roleplayTimezoneOffsetMinutes,
  }
}

export function activityClock(activity: PocketActivity, state?: PhoneState): { time: string; date: string; precision: 'exact' | 'approximate' | 'unknown' } {
  let { storyAt, storyTimeLabel, storyTimezoneOffsetMinutes } = activity.presentation || {}
  if (!validStamp(storyAt) && !storyTimeLabel?.trim() && state && activity.source?.messageId) {
    const sourceId = activity.source.messageId
    const selected = [...(state.hostSwipeSelections || [])].reverse().find(entry => entry.hostMessageId === sourceId)
    // Use the activity's own committed turn, never today's clock or a different swipe.
    const snapshot: PocketRoleplayClockSnapshot | undefined = [...(state.candidateClocks || [])].reverse().find(entry => entry.hostMessageId === sourceId && selected && entry.swipeId === selected.swipeId)
    if (snapshot) {
      storyAt = snapshot.source === 'manual' || snapshot.precision === 'exact' ? snapshot.roleplayNow : undefined
      storyTimeLabel = snapshot.source === 'manual' || snapshot.precision === 'exact' ? undefined : snapshot.label
      storyTimezoneOffsetMinutes = state.roleplayTimezoneOffsetMinutes
    }
  }
  if (validStamp(storyAt)) {
    const offset = typeof storyTimezoneOffsetMinutes === 'number' && Number.isFinite(storyTimezoneOffsetMinutes) && Math.abs(storyTimezoneOffsetMinutes) <= 840 ? storyTimezoneOffsetMinutes : 0
    const date = new Date(Date.parse(storyAt!) - offset * 60_000)
    return { time: date.toISOString().slice(11, 16), date: new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date), precision: 'exact' }
  }
  const label = clockLabel(storyTimeLabel)
  return { time: label, date: '', precision: label ? 'approximate' : 'unknown' }
}

function validStamp(value?: string): boolean {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)))
}
