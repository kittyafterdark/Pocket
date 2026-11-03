import { expect, test } from 'bun:test'
import { AmbientMessageAutomation, type AmbientMessageTarget } from '../src/backend/ambient-messaging-automation.js'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { messagePushTitle } from '../src/domain/device.js'
import { contactCooldownReady } from '../src/domain/messaging.js'
import type { DevicePreferences, PhoneState } from '../src/types.js'

const takano: AmbientMessageTarget = { chatId: 'ambient-chat', characterId: 'sekaiichi', contactId: 'takano', kind: 'profile' }
const yokozawa: AmbientMessageTarget = { chatId: 'ambient-chat', characterId: 'sekaiichi', contactId: 'yokozawa', kind: 'profile' }
const freeform: AmbientMessageTarget = { chatId: '_freeform_test', characterId: '_none', kind: 'freeform' }

function timerFixture() {
  let preferences: DevicePreferences = { ...defaultPreferences(), ambientMessaging: 'normal', ambientScheduleEnabled: false, ambientScheduleMinutes: 30 }
  let now = 1_000, serial = 0
  const calls: Array<AmbientMessageTarget & { userId?: string }> = []
  const timers = new Map<number, { due: number; callback: () => void }>()
  let run: (target: AmbientMessageTarget, userId?: string) => Promise<void> = async (target, userId) => { calls.push({ ...target, userId }) }
  const automation = new AmbientMessageAutomation({
    loadPreferences: async () => structuredClone(preferences),
    run: (target, userId) => run(target, userId),
    nowMs: () => now,
    schedule: (callback, delayMs) => { const id = ++serial; timers.set(id, { due: now + delayMs, callback }); return id },
    cancelSchedule: handle => { timers.delete(handle as number) },
  })
  const flush = async () => { for (let index = 0; index < 100; index++) await Promise.resolve() }
  const advance = async (milliseconds: number) => {
    now += milliseconds
    for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback() }
    await flush()
  }
  return {
    automation, calls, timers, advance, flush, now: () => now,
    preferences(next: Partial<DevicePreferences>) { preferences = { ...preferences, ...next } },
    run(next: typeof run) { run = next },
  }
}

test('scheduler master switch stays explicit while enrolled profiles keep independent clocks', async () => {
  const f = timerFixture()
  await f.automation.sync([takano, yokozawa])
  expect(f.timers.size).toBe(0)

  f.preferences({ ambientScheduleEnabled: true, ambientScheduleMinutes: 2 })
  await f.automation.sync([takano, yokozawa])
  expect(f.timers.size).toBe(2)
  expect([...f.timers.values()].every(timer => timer.due === f.now() + 120_000)).toBe(true)
  await f.advance(120_000)
  expect(f.calls).toHaveLength(2)
  expect(f.calls.map(call => call.contactId).sort()).toEqual(['takano', 'yokozawa'])
  expect(f.timers.size).toBe(2)
  f.automation.dispose()
})

test('sync removes only unenrolled profiles instead of replacing the currently visible chat', async () => {
  const f = timerFixture()
  f.preferences({ ambientScheduleEnabled: true, ambientScheduleMinutes: 1 })
  await f.automation.sync([takano, yokozawa, freeform])
  expect(f.timers.size).toBe(3)

  await f.automation.sync([takano, freeform])
  expect(f.timers.size).toBe(2)
  await f.advance(60_000)
  expect(f.calls.map(call => call.kind === 'freeform' ? call.chatId : call.contactId).sort()).toEqual(['_freeform_test', 'takano'])
  f.automation.dispose()
})

test('changing interval restarts every enrolled countdown; disabling the master clock cancels all without forgetting enrollment', async () => {
  const f = timerFixture()
  f.preferences({ ambientScheduleEnabled: true, ambientScheduleMinutes: 1 })
  await f.automation.sync([takano, freeform])
  await f.advance(30_000)

  f.preferences({ ambientScheduleMinutes: 3 })
  await f.automation.sync([takano, freeform])
  expect([...f.timers.values()].every(timer => timer.due === f.now() + 180_000)).toBe(true)

  f.preferences({ ambientMessaging: 'off' })
  await f.automation.sync([takano, freeform])
  expect(f.timers.size).toBe(0)
  f.preferences({ ambientMessaging: 'normal' })
  await f.automation.sync([takano, freeform])
  expect(f.timers.size).toBe(2)

  f.preferences({ ambientScheduleEnabled: false })
  await f.automation.sync([takano, freeform])
  expect(f.timers.size).toBe(0)
  f.automation.dispose()
})

test('slow work on one profile does not overlap itself or block another enrolled scope', async () => {
  const f = timerFixture()
  f.preferences({ ambientScheduleEnabled: true, ambientScheduleMinutes: 1 })
  let release!: () => void
  f.run(async (target, userId) => {
    f.calls.push({ ...target, userId })
    if (target.contactId === 'takano') await new Promise<void>(resolve => { release = resolve })
  })
  await f.automation.sync([takano, yokozawa])
  await f.advance(60_000)
  expect(f.calls.map(call => call.contactId).sort()).toEqual(['takano', 'yokozawa'])
  await f.automation.tick()
  expect(f.calls.filter(call => call.contactId === 'takano')).toHaveLength(1)
  release(); await f.flush()
  f.automation.dispose()
})

test('real-time scheduler can reuse a contact after wall cooldown even when story time is parked', () => {
  const contact = {
    messagingPolicy: {
      ambientEnabled: true,
      lastInitiatedMessageAt: '2026-11-01T20:00:00.000Z',
      lastInitiatedRoleplayAt: '2026-11-01T12:00:00.000Z',
    },
  } as any
  const wallNow = Date.parse('2026-11-01T20:30:00.000Z')
  expect(contactCooldownReady(contact, 'normal', '2026-11-01T12:00:00.000Z', wallNow)).toBe(false)
  expect(contactCooldownReady(contact, 'normal', '2026-11-01T12:00:00.000Z', wallNow, { ignoreRoleplayCooldown: true })).toBe(true)
})

test('ambient scheduler preferences normalize safely', () => {
  expect(normalizePreferences({ version: 5, ambientMessaging: 'normal', ambientScheduleEnabled: true, ambientScheduleMinutes: 45 })).toMatchObject({
    ambientMessaging: 'normal', ambientScheduleEnabled: true, ambientScheduleMinutes: 45,
  })
  expect(normalizePreferences({ version: 5, ambientScheduleEnabled: 'yes', ambientScheduleMinutes: 999 })).toMatchObject({
    ambientScheduleEnabled: false, ambientScheduleMinutes: 240,
  })
})

test('message push title names both sender and the receiving Pocket persona', () => {
  const state = {
    chatId: 'chat', characterId: 'takano', pocketPersonaActorId: 'persona:ritsu',
    pocketPersona: { displayName: 'Ritsu' }, contacts: [{ id: 'takano', name: 'Takano' }], discoveredActors: [],
  } as unknown as PhoneState
  expect(messagePushTitle(state, 'Takano', 'persona:ritsu')).toBe('[Pocket] Takano → Ritsu')
})
