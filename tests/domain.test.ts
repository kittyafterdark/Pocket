import { describe, expect, test } from 'bun:test'
import { defaultPreferences, normalizePreferences } from '../src/domain/preferences.js'
import { MODEL_CONTEXT_BUDGET, projectPhoneContext } from '../src/domain/projection.js'
import { calculatePhoneSurface } from '../src/frontend/surface.js'
import type { PhoneState } from '../src/types.js'

describe('device preference schema', () => {
  test('migrates legacy settings without retaining arbitrary CSS', () => {
    const migrated = normalizePreferences({
      theme: 'rose', accent: '#ABCDEF', bezelColor: '#010203',
      wallpaper: 'url(javascript:alert(1))', chatWallpaper: 'var(--host-secret)',
      animation: 'slide', autoOpenOnModelAction: true,
    })
    expect(migrated.version).toBe(1)
    expect(migrated.colors.accent).toBe('#abcdef')
    expect(migrated.colors.bezel).toBe('#010203')
    expect(JSON.stringify(migrated)).not.toContain('javascript')
    expect(JSON.stringify(migrated)).not.toContain('--host-secret')
  })

  test('fails closed for unknown future schemas', () => {
    expect(normalizePreferences({ version: 999, handsetScale: 99 })).toEqual(defaultPreferences())
  })
})

describe('phone surface', () => {
  test('derives a fresh 9:16 desktop rectangle from semantic scale', () => {
    const normal = calculatePhoneSurface(1, { width: 1440, height: 900 })
    const large = calculatePhoneSurface(1.2, { width: 1440, height: 900 })
    expect(normal.fullscreen).toBe(false)
    expect(normal.width / normal.height).toBeCloseTo(9 / 16, 2)
    expect(large.width).toBeGreaterThan(normal.width)
    expect(large.width / large.height).toBeCloseTo(9 / 16, 2)
  })

  test('recalculates against viewport constraints and uses fullscreen on mobile', () => {
    const short = calculatePhoneSurface(1.25, { width: 1000, height: 600 })
    const mobile = calculatePhoneSurface(1, { width: 390, height: 844 })
    expect(short.height).toBeLessThanOrEqual(576)
    expect(short.width / short.height).toBeCloseTo(9 / 16, 2)
    expect(mobile.fullscreen).toBe(true)
  })
})

describe('model context projection', () => {
  test('enforces a hard serialized budget for huge phone databases', () => {
    const now = new Date().toISOString()
    const state: PhoneState = {
      version: 1, chatId: 'chat', characterId: 'character', characterName: 'Character', roleplayNow: now,
      contacts: Array.from({ length: 30 }, (_, contactIndex) => ({
        id: `c${contactIndex}`, name: `Contact ${contactIndex}`, subtitle: '', avatarUrl: '', unread: 0,
        messages: Array.from({ length: 240 }, (_, messageIndex) => ({
          id: `m${contactIndex}-${messageIndex}`, sender: 'character', text: 'x'.repeat(12_000), createdAt: now,
          read: true, status: 'read',
        })),
      })),
      notes: Array.from({ length: 120 }, (_, index) => ({ id: `n${index}`, title: `Note ${index}`, body: 'y'.repeat(40_000), mood: '', pinned: true, author: 'character', createdAt: now, updatedAt: now })),
      events: [], weather: { location: 'Scene', condition: 'Clear', temperature: 20, unit: 'C', high: 22, low: 10, details: 'z'.repeat(2_000), updatedAt: now },
      trackers: [], notifications: [], processedCommands: [], updatedAt: now,
    }
    const projection = projectPhoneContext(state)
    expect(projection.length).toBeLessThanOrEqual(MODEL_CONTEXT_BUDGET)
    expect(() => JSON.parse(projection)).not.toThrow()
  })
})
