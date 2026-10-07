type TouchScrollWidget = { setTouchScrollMode(mode: 'guarded' | 'native'): void }

export function supportsPocketTouchScroll(widget: unknown): widget is TouchScrollWidget {
  return typeof (widget as Partial<TouchScrollWidget> | null)?.setTouchScrollMode === 'function'
}

/** Older hosts keep their existing guard; never change document touch handlers. */
export function applyPocketTouchScroll(
  widget: unknown,
  enabled: boolean,
): void {
  if (supportsPocketTouchScroll(widget)) widget.setTouchScrollMode(enabled ? 'native' : 'guarded')
}
