import type { DevicePreferences } from '../types.js'

type TouchScrollWidget = { setTouchScrollMode(mode: 'guarded' | 'native'): void }

export function resolvePocketTouchScrollMode(
  preference: DevicePreferences['nativeTouchScrollMode'],
  userAgent = globalThis.navigator?.userAgent || '',
): 'guarded' | 'native' {
  if (preference !== 'auto') return preference
  return /iPhone|iPod/i.test(userAgent) ? 'native' : 'guarded'
}

export function supportsPocketTouchScroll(widget: unknown): widget is TouchScrollWidget {
  return typeof (widget as Partial<TouchScrollWidget> | null)?.setTouchScrollMode === 'function'
}

/** Older hosts keep their existing guard; never change document touch handlers. */
export function applyPocketTouchScroll(
  widget: unknown,
  preference: DevicePreferences['nativeTouchScrollMode'],
): void {
  if (supportsPocketTouchScroll(widget)) widget.setTouchScrollMode(resolvePocketTouchScrollMode(preference))
}
