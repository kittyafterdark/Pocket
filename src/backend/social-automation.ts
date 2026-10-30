import type { PhoneState } from '../types.js'
import { conversationDeviceActorIds, pocketPersonaActorId } from '../domain/device.js'
import { normalizeLauncherLayout, pocketAppInstalled } from '../domain/launcher.js'
import { normalizeSocialState, SOCIAL_APPS, socialAppSettings } from '../domain/social.js'
import type { SocialApp } from '../domain/social.js'
import type { SocialContext, SocialRefreshOptions } from './social-world.js'

interface SocialAutomationHost {
  loadState(chatId: string, characterId: string, userId?: string): Promise<PhoneState>
  refresh(context: SocialContext, owner: string, app: SocialApp, channelId: string | undefined, requestId: string, userId?: string, options?: SocialRefreshOptions): Promise<void>
  report?(error: unknown, context: SocialContext, app: SocialApp): void
  nowMs?(): number
  schedule?(callback: () => void, delayMs: number): unknown
  cancelSchedule?(handle: unknown): void
}
interface TimerTarget { owner: string; app: SocialApp; channelId?: string; intervalMs: number; due: number }
interface TimerScope {
  context: SocialContext; userId?: string; revision: number; timerRevision: number; targets: Map<string, TimerTarget>; timer?: unknown; busy: boolean
  flight?: { key: string; controller: AbortController }
}
/** Stable, short receipt IDs survive storage normalization without exposing phone identities. */
export function socialAutomaticRequestId(context: SocialContext, turnId: string, owner: string, app: SocialApp, userId?: string): string {
  const raw = JSON.stringify([context.chatId, context.characterId, turnId, owner, app, userId])
  let left = 2166136261, right = 5381
  for (let index = 0; index < raw.length; index++) { left = Math.imul(left ^ raw.charCodeAt(index), 16777619); right = Math.imul(right, 33) ^ raw.charCodeAt(index) }
  return `social-auto_${(left >>> 0).toString(16)}_${(right >>> 0).toString(16)}`
}

/** Turn and timed refreshes are distinct opt-ins. Timer intervals start after completion, including failures; observing never generates. */
export class SocialAutomation {
  private seen = new Set<string>()
  private jobs = new Map<string, AbortController>()
  private schedules = new Map<string, TimerScope>()
  private disposed = false
  constructor(private host: SocialAutomationHost) {}
  private userKey(userId?: string) { return userId || '_default' }
  private now() { return this.host.nowMs?.() ?? Date.now() }
  private current(scope: TimerScope) { return !this.disposed && this.schedules.get(this.userKey(scope.userId)) === scope }
  private stopTimer(scope: TimerScope) {
    scope.timerRevision++
    if (scope.timer === undefined) return
    if (this.host.cancelSchedule) this.host.cancelSchedule(scope.timer)
    else clearTimeout(scope.timer as ReturnType<typeof setTimeout>)
    scope.timer = undefined
  }
  private arm(scope: TimerScope) {
    this.stopTimer(scope)
    if (!this.current(scope) || scope.busy || !scope.targets.size) return
    const due = Math.min(...[...scope.targets.values()].map(target => target.due)), delay = Math.max(0, due - this.now())
    const timerRevision = scope.timerRevision
    const callback = () => { if (!this.current(scope) || scope.timerRevision !== timerRevision) return; scope.timer = undefined; void this.runTimer(scope) }
    if (this.host.schedule) scope.timer = this.host.schedule(callback, delay)
    else {
      const timer = setTimeout(callback, delay)
      ;(timer as unknown as { unref?(): void }).unref?.()
      scope.timer = timer
    }
  }
  private async reconcile(scope: TimerScope): Promise<boolean> {
    const revision = ++scope.revision
    const state = await this.host.loadState(scope.context.chatId, scope.context.characterId, scope.userId)
    if (!this.current(scope) || revision !== scope.revision) return false
    const world = normalizeSocialState(state.social), targets = new Map<string, TimerTarget>(), now = this.now()
    const owners = [...new Set([pocketPersonaActorId(state), ...state.conversations.flatMap(conversation => conversationDeviceActorIds(state, conversation))])]
    for (const owner of owners) for (const app of SOCIAL_APPS) {
      const settings = socialAppSettings(world, owner, app)
      if (settings.refreshMode !== 'timer' || !pocketAppInstalled(normalizeLauncherLayout(state.launcherLayouts?.[owner]), app)) continue
      const channelId = app === 'discord' ? world.servers.find(server => server.memberActorIds.includes(owner))?.channels[0]?.id : undefined
      if (app === 'discord' && !channelId) continue
      const key = JSON.stringify([owner, app, channelId]), intervalMs = settings.refreshIntervalMinutes * 60_000, prior = scope.targets.get(key)
      targets.set(key, { owner, app, channelId, intervalMs, due: prior?.intervalMs === intervalMs ? prior.due : now + intervalMs })
    }
    if (scope.flight) {
      const target = targets.get(scope.flight.key), previous = scope.targets.get(scope.flight.key)
      if (!target || target.intervalMs !== previous?.intervalMs) scope.flight.controller.abort()
    }
    scope.targets = targets
    return true
  }
  /** Register the currently viewed chat for this user; switching chats stops old timer work. */
  async observe(context: SocialContext, userId?: string): Promise<void> {
    if (this.disposed || !context.chatId || !context.characterId) return
    const key = this.userKey(userId)
    let scope = this.schedules.get(key)
    if (!scope || scope.context.chatId !== context.chatId || scope.context.characterId !== context.characterId) {
      this.forget(userId)
      scope = { context: { ...context }, userId, revision: 0, timerRevision: 0, targets: new Map(), busy: false }
      this.schedules.set(key, scope)
    }
    try { if (await this.reconcile(scope)) this.arm(scope) }
    catch (error) { if (this.current(scope)) { this.stopTimer(scope); this.host.report?.(error, context, 'twitter') } }
  }
  forget(userId?: string) {
    const key = this.userKey(userId), scope = this.schedules.get(key)
    if (scope) { this.stopTimer(scope); scope.flight?.controller.abort(); this.schedules.delete(key) }
  }
  /** Exposed for deterministic diagnostics; regular use is driven by the next due timer. */
  async tick(): Promise<void> { await Promise.all([...this.schedules.values()].map(scope => this.runTimer(scope))) }
  private async runTimer(scope: TimerScope): Promise<void> {
    if (!this.current(scope) || scope.busy) return
    scope.busy = true; this.stopTimer(scope)
    try {
      if (!await this.reconcile(scope)) return
      let count = 0
      for (const [key, target] of scope.targets) {
        if (!this.current(scope)) return
        if (scope.targets.get(key) !== target) continue
        const now = this.now()
        if (target.due > now) continue
        if (count >= 4) { target.due = now + 1000; continue }
        const due = target.due
        target.due = now + target.intervalMs
        count++
        const controller = new AbortController(); scope.flight = { key, controller }
        try {
          const turnId = `timer:${due}`
          await this.host.refresh(scope.context, target.owner, target.app, target.channelId, socialAutomaticRequestId(scope.context, turnId, target.owner, target.app, scope.userId), scope.userId, { automatic: true, turnId, trigger: 'timer', signal: controller.signal })
        } catch (error) { if (this.current(scope) && !controller.signal.aborted) this.host.report?.(error, scope.context, target.app) }
        finally {
          // A slow provider must not turn the timer into continuous back-to-back generation.
          // Re-observation may replace the target; preserve a newer mode/interval countdown.
          const currentTarget = scope.targets.get(key)
          if (this.current(scope) && !controller.signal.aborted && currentTarget?.intervalMs === target.intervalMs) currentTarget.due = this.now() + target.intervalMs
          if (scope.flight?.controller === controller) scope.flight = undefined
        }
      }
    } catch (error) {
      if (this.current(scope)) {
        const now = this.now()
        for (const target of scope.targets.values()) if (target.due <= now) target.due = now + Math.max(5000, Math.min(target.intervalMs, 60_000))
        this.host.report?.(error, scope.context, 'twitter')
      }
    }
    finally { scope.busy = false; if (this.current(scope)) this.arm(scope) }
  }
  dispose() {
    this.disposed = true
    for (const scope of this.schedules.values()) { this.stopTimer(scope); scope.flight?.controller.abort() }
    this.schedules.clear()
    for (const job of this.jobs.values()) job.abort()
    this.jobs.clear()
  }
  async run(context: SocialContext, turnId: string, userId?: string, kind = 'normal'): Promise<void> {
    if (this.disposed || kind !== 'normal' || !turnId) return
    const turnKey = JSON.stringify([userId, context.chatId, context.characterId, turnId]), scope = JSON.stringify([userId, context.chatId, context.characterId])
    if (this.seen.has(turnKey)) return
    this.seen.add(turnKey); if (this.seen.size > 128) this.seen.delete(this.seen.values().next().value!)
    // A newer committed turn supersedes old turn work rather than queuing a backlog.
    this.jobs.get(scope)?.abort()
    const controller = new AbortController(); this.jobs.set(scope, controller)
    try {
      const state = await this.host.loadState(context.chatId, context.characterId, userId)
      const owners = [...new Set([pocketPersonaActorId(state), ...state.conversations.flatMap(conversation => conversationDeviceActorIds(state, conversation))])]
      let count = 0
      for (const owner of owners) for (const app of SOCIAL_APPS) {
        if (controller.signal.aborted || count >= 4) return
        const latest = await this.host.loadState(context.chatId, context.characterId, userId), world = normalizeSocialState(latest.social)
        if (!pocketAppInstalled(normalizeLauncherLayout(latest.launcherLayouts?.[owner]), app) || socialAppSettings(world, owner, app).refreshMode !== 'turn') continue
        const channelId = app === 'discord' ? world.servers.find(server => server.memberActorIds.includes(owner))?.channels[0]?.id : undefined
        if (app === 'discord' && !channelId) continue
        count++
        try { await this.host.refresh(context, owner, app, channelId, socialAutomaticRequestId(context, turnId, owner, app, userId), userId, { automatic: true, turnId, trigger: 'turn', signal: controller.signal }) }
        catch (error) { if (!controller.signal.aborted) this.host.report?.(error, context, app) }
      }
    } finally { if (this.jobs.get(scope) === controller) this.jobs.delete(scope) }
  }
}
