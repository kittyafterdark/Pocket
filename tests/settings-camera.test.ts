import { expect, test } from 'bun:test'
import { JSDOM } from 'jsdom'
import { defaultPreferences } from '../src/domain/preferences.js'
import { renderSettingsView } from '../src/frontend/apps/settings.js'

test('camera defaults bind image pickers, persist together and clear without losing the visual profile', () => {
  const dom = new JSDOM('<!doctype html><body></body>')
  Object.assign(globalThis, { document: dom.window.document, Option: dom.window.Option })
  const draft = defaultPreferences()
  draft.manualVisualProfile = { ...draft.manualVisualProfile, positive: 'red hair', model: 'old', connectionId: 'old-connection', loras: [{ name: 'ink', weight: .7 }], parameters: { steps: 24 } }
  const updates: any[] = [], mounts: any[] = [], sends: any[] = []
  const page = document.createElement('div'), content = document.createElement('div'); page.append(content)
  const view = renderSettingsView({
    draft, section: 'camera', imageConnections: [{ id: 'swarm', name: 'My Swarm' }], swarmProfile: { fields: { swarm_loras: { detected: true, length: 18, preview: '<lora:ink:0.7>' } }, status: 'connected' },
    page: () => ({ page, content }), update: (value: any, options: any) => updates.push({ value: structuredClone(value), options }),
    send: (type: string) => sends.push(type), showError: (message: string) => { throw Error(message) },
    mountModelCombobox: (_target: any, options: any) => { const mount = { options, stopped: false }; mounts.push(mount); return () => { mount.stopped = true } },
  } as any)
  document.body.append(view)
  const select = view.querySelector<HTMLSelectElement>('[data-pocket-image-connection]')!
  expect(select.textContent).toContain('My Swarm')
  select.value = 'swarm'; select.dispatchEvent(new dom.window.Event('change'))
  expect(mounts[0].stopped).toBe(true)
  expect(mounts.at(-1).options.connection).toEqual({ kind: 'image', id: 'swarm' })
  expect(mounts.at(-1).options.value).toBe('')
  mounts.at(-1).options.onChange('new-checkpoint')
  const click = (text: string) => [...view.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === text)!.click()
  click('Save camera defaults')
  expect(updates.at(-1).value.manualVisualProfile).toMatchObject({ connectionId: 'swarm', model: 'new-checkpoint', positive: 'red hair', parameters: { steps: 24 } })
  click('Follow Lumiverse defaults')
  expect(updates.at(-1).value.manualVisualProfile).toMatchObject({ connectionId: '', model: '', loras: [{ name: 'ink', weight: .7 }] })
  expect(view.textContent).toContain('swarm_loras · 18 chars')
  click('Lumiverse image settings')
  expect(sends.at(-1)).toBe('lumiphone:open_native_image_settings')
  dom.window.close()
})
