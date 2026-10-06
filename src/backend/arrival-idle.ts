/** Debounce narrative handoffs without treating idle time as physical arrival. */
export class ArrivalIdle {
  private timers = new Map<string, { timer: ReturnType<typeof setTimeout>; token: object }>()
  constructor(private clock = { set: setTimeout, clear: clearTimeout }) {}
  schedule(key: string, work: (current: () => boolean) => Promise<void>, delay = 20_000): void {
    this.cancel(key)
    const token = {}
    const timer = this.clock.set(() => {
      if (this.timers.get(key)?.token !== token) return
      void work(() => this.timers.get(key)?.token === token).finally(() => {
        if (this.timers.get(key)?.token === token) this.timers.delete(key)
      })
    }, delay)
    this.timers.set(key, { timer, token })
  }
  cancel(key: string): void {
    const entry = this.timers.get(key)
    if (entry) this.clock.clear(entry.timer)
    this.timers.delete(key)
  }
  cancelPrefix(prefix: string): void { for (const key of this.timers.keys()) if (key.startsWith(prefix)) this.cancel(key) }
}
