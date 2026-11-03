/** Keep one running refresh and one replacement, rather than a queue of snapshots. */
export class CoalescedWork<T> {
  private flights = new Map<string, { next?: () => Promise<T>; promise: Promise<T> }>()

  run(key: string, work: () => Promise<T>): Promise<T> {
    const existing = this.flights.get(key)
    if (existing) {
      existing.next = work
      return existing.promise
    }
    const flight: { next?: () => Promise<T>; promise: Promise<T> } = { next: work, promise: Promise.resolve(undefined as T) }
    flight.promise = Promise.resolve().then(async () => {
      try {
        let result!: T
        while (flight.next) {
          const next = flight.next
          flight.next = undefined
          result = await next()
        }
        return result
      } finally {
        if (this.flights.get(key) === flight) this.flights.delete(key)
      }
    })
    this.flights.set(key, flight)
    return flight.promise
  }
}

/** Share the image budget across simultaneous projections, avatars and wallpapers. */
export class WorkPool {
  private active = 0
  private waiting: Array<() => void> = []

  constructor(private limit: number) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error('The work limit must be a positive integer.')
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>(resolve => this.waiting.push(resolve))
    else this.active++
    try { return await work() }
    finally {
      const next = this.waiting.shift()
      if (next) next()
      else this.active--
    }
  }
}
