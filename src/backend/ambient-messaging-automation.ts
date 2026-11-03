import type { DevicePreferences } from '../types.js'

export interface AmbientMessageTarget {
  chatId: string
  characterId: string
  /** Regular roleplay targets one explicitly enrolled contact. Freeform is session-wide. */
  contactId?: string
  kind?: 'profile' | 'freeform'
}

interface AmbientMessageAutomationHost {
  loadPreferences(userId?: string): Promise<DevicePreferences>
  run(target: AmbientMessageTarget, userId?: string): Promise<void>
  report?(error: unknown, target: AmbientMessageTarget): void
  nowMs?(): number
  schedule?(callback: () => void, delayMs: number): unknown
  cancelSchedule?(handle: unknown): void
}

interface AmbientTimerScope {
  target: AmbientMessageTarget
  userId?: string
  timer?: unknown
  timerRevision: number
  intervalMs: number
  due: number
  enabled: boolean
  busy: boolean
}

/**
 * Real-time ambient-message scheduling. Each enrolled profile/session owns an
 * independent clock, so closed Pocket threads keep working without inheriting
 * eligibility from whichever host chat happens to be visible.
 */
export class AmbientMessageAutomation {
  private schedules = new Map<string, AmbientTimerScope>()
  private disposed = false
  constructor(private host: AmbientMessageAutomationHost) {}
  private userKey(userId?: string) { return userId || '_default' }
  private targetKey(target: AmbientMessageTarget) { return `${target.kind || 'profile'}:${target.chatId}:${target.characterId}:${target.contactId || '*'}` }
  private key(target: AmbientMessageTarget, userId?: string) { return `${this.userKey(userId)}:${this.targetKey(target)}` }
  private now() { return this.host.nowMs?.() ?? Date.now() }
  private current(scope: AmbientTimerScope) { return !this.disposed && this.schedules.get(this.key(scope.target, scope.userId)) === scope }
  private stop(scope: AmbientTimerScope) {
    scope.timerRevision++
    if (scope.timer === undefined) return
    if (this.host.cancelSchedule) this.host.cancelSchedule(scope.timer)
    else clearTimeout(scope.timer as ReturnType<typeof setTimeout>)
    scope.timer = undefined
  }
  private arm(scope: AmbientTimerScope) {
    this.stop(scope)
    if (!this.current(scope) || !scope.enabled || scope.busy) return
    const delay = Math.max(0, scope.due - this.now())
    const revision = scope.timerRevision
    const callback = () => {
      if (!this.current(scope) || scope.timerRevision !== revision) return
      scope.timer = undefined
      void this.runTimer(scope)
    }
    if (this.host.schedule) scope.timer = this.host.schedule(callback, delay)
    else {
      const timer = setTimeout(callback, delay)
      ;(timer as unknown as { unref?(): void }).unref?.()
      scope.timer = timer
    }
  }
  private async reconcile(scope: AmbientTimerScope, resetOnIntervalChange = true): Promise<void> {
    const preferences = await this.host.loadPreferences(scope.userId)
    if (!this.current(scope)) return
    const enabled = preferences.ambientMessaging !== 'off' && preferences.ambientScheduleEnabled === true
    const intervalMs = Math.max(1, Math.round(preferences.ambientScheduleMinutes || 30)) * 60_000
    const changed = scope.intervalMs !== intervalMs, wasEnabled = scope.enabled
    scope.enabled = enabled
    scope.intervalMs = intervalMs
    if (!enabled) { scope.due = 0; return }
    if (!wasEnabled || !scope.due || changed && resetOnIntervalChange) scope.due = this.now() + intervalMs
  }
  async sync(targets: AmbientMessageTarget[], userId?: string): Promise<void> {
    if (this.disposed) return
    const normalized = new Map<string, AmbientMessageTarget>()
    for (const target of targets) {
      if (!target.chatId || !target.characterId) continue
      const clean = { ...target, contactId: target.contactId || undefined }
      normalized.set(this.key(clean, userId), clean)
    }
    for (const [key, scope] of [...this.schedules]) {
      if (this.userKey(scope.userId) !== this.userKey(userId) || normalized.has(key)) continue
      this.stop(scope); this.schedules.delete(key)
    }
    for (const [key, target] of normalized) {
      let scope = this.schedules.get(key)
      if (!scope) {
        scope = { target, userId, timerRevision: 0, intervalMs: 30 * 60_000, due: 0, enabled: false, busy: false }
        this.schedules.set(key, scope)
      } else scope.target = target
      try { await this.reconcile(scope); this.arm(scope) }
      catch (error) { if (this.current(scope)) { this.stop(scope); this.host.report?.(error, target) } }
    }
  }
  /** Compatibility helper for callers/tests that intentionally schedule one scope. */
  async observe(target: AmbientMessageTarget, userId?: string): Promise<void> { await this.sync([target], userId) }
  forget(userId?: string) {
    const userKey = this.userKey(userId)
    for (const [key, scope] of [...this.schedules]) {
      if (this.userKey(scope.userId) !== userKey) continue
      this.stop(scope); this.schedules.delete(key)
    }
  }
  async tick(): Promise<void> { await Promise.all([...this.schedules.values()].map(scope => this.runTimer(scope))) }
  private async runTimer(scope: AmbientTimerScope): Promise<void> {
    if (!this.current(scope) || scope.busy) return
    scope.busy = true
    this.stop(scope)
    try {
      await this.reconcile(scope, false)
      if (!this.current(scope) || !scope.enabled || scope.due > this.now()) return
      await this.host.run(scope.target, scope.userId)
      if (this.current(scope)) scope.due = this.now() + scope.intervalMs
    } catch (error) {
      if (this.current(scope)) {
        scope.due = this.now() + Math.max(5_000, Math.min(scope.intervalMs, 60_000))
        this.host.report?.(error, scope.target)
      }
    } finally {
      scope.busy = false
      if (this.current(scope)) {
        try { await this.reconcile(scope, false) } catch (error) { this.host.report?.(error, scope.target) }
        this.arm(scope)
      }
    }
  }
  dispose() {
    this.disposed = true
    for (const scope of this.schedules.values()) this.stop(scope)
    this.schedules.clear()
  }
}
