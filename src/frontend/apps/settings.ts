import type { DevicePreferences, PhoneCapabilities, PhoneSettings, SwarmVisualProfile } from '../../types.js'
import { normalizePreferences, themePalette } from '../../domain/preferences.js'
import { button, el, inputValue } from '../shared.js'

type Field = { label: HTMLLabelElement; input: HTMLInputElement }
type Page = { page: HTMLDivElement; content: HTMLDivElement }

export interface SettingsViewHost {
  preferences: DevicePreferences
  capabilities: PhoneCapabilities | null
  swarmProfile: SwarmVisualProfile | null
  page(title: string, subtitle: string, rightLabel: string): Page
  field(label: string, value?: string, type?: string): Field
  preview(preferences: DevicePreferences, options?: { appearance?: boolean; resize?: boolean; rerender?: boolean }): void
  send(type: string, payload?: Record<string, unknown>): void
  requestPermissions(): void
  showError(message: string): void
  openHome(): void
}

function colorSetting(label: string, value: string, update: (value: string) => void): HTMLDivElement {
  const row = el('div', 'lp-row-between')
  row.appendChild(el('span', 'lp-title', label))
  const input = el('input', 'lp-color-input')
  input.type = 'color'
  input.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#8b7dff'
  input.addEventListener('input', () => update(input.value))
  row.appendChild(input)
  return row
}

function toggleSetting(label: string, initial: boolean, update: (value: boolean) => void): HTMLDivElement {
  const row = el('div', 'lp-row-between')
  row.appendChild(el('span', 'lp-title', label))
  const toggle = el('button', 'lp-toggle')
  toggle.type = 'button'
  toggle.setAttribute('aria-pressed', String(initial))
  toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-pressed') !== 'true'
    toggle.setAttribute('aria-pressed', String(next))
    update(next)
  })
  row.appendChild(toggle)
  return row
}

export function renderSettingsView(host: SettingsViewHost): HTMLDivElement {
  const settings = structuredClone(host.preferences)
  const { page, content } = host.page('Settings', 'Device-wide preferences', 'Save')
  const appearance = el('section', 'lp-card lp-settings-section')
  appearance.dataset.settingsSection = 'appearance'
  appearance.appendChild(el('div', 'lp-eyebrow', 'Appearance'))
  const themes = el('div', 'lp-row')
  const themeColors: Array<[PhoneSettings['theme'], string]> = [['midnight', '#201a37'], ['porcelain', '#eeeae6'], ['rose', '#7a294e'], ['forest', '#1d5a41'], ['custom', settings.colors.accent]]
  for (const [name, color] of themeColors) {
    const dot = el('button', 'lp-theme-dot')
    dot.type = 'button'
    dot.title = name
    dot.style.background = color
    dot.setAttribute('aria-pressed', String(settings.theme === name))
    dot.addEventListener('click', () => {
      settings.theme = name
      if (name !== 'custom') settings.colors = themePalette(name)
      host.preview(normalizePreferences(settings), { appearance: true, rerender: true })
    })
    themes.appendChild(dot)
  }
  const palette = el('div', 'lp-color-grid')
  const colorControl = (label: string, key: keyof DevicePreferences['colors']) => colorSetting(label, settings.colors[key], (value) => {
    settings.colors[key] = value
    settings.theme = 'custom'
    host.preview(normalizePreferences(settings), { appearance: true })
  })
  palette.append(
    colorControl('Accent', 'accent'), colorControl('Bezel', 'bezel'), colorControl('UI background', 'background'), colorControl('UI surface', 'surface'), colorControl('UI text', 'text'),
    colorControl('Home top', 'wallpaperPrimary'), colorControl('Home bottom', 'wallpaperSecondary'),
    colorControl('Chat top', 'chatPrimary'), colorControl('Chat bottom', 'chatSecondary'),
  )
  const scaleRow = el('label', 'lp-slider-setting')
  const scaleHead = el('span', 'lp-row-between')
  const scaleValue = el('strong', '', `${settings.handsetScale.toFixed(2)}×`)
  scaleHead.append(el('span', 'lp-title', 'Phone size'), scaleValue)
  const scale = el('input')
  scale.type = 'range'; scale.min = '0.8'; scale.max = '1.25'; scale.step = '0.05'; scale.value = String(settings.handsetScale)
  scale.addEventListener('input', () => {
    settings.handsetScale = Number(scale.value)
    scaleValue.textContent = `${settings.handsetScale.toFixed(2)}×`
    host.preview(normalizePreferences(settings), { resize: true })
  })
  scaleRow.append(scaleHead, scale, el('span', 'lp-copy', 'A semantic scale; dimensions are recalculated from this viewport.'))
  const animationLabel = el('label', 'lp-label', 'App opening animation')
  const animation = el('select', 'lp-select')
  for (const value of ['spring', 'slide', 'fade', 'none']) {
    const option = el('option', '', value[0].toUpperCase() + value.slice(1))
    option.value = value
    option.selected = settings.animation === value
    animation.appendChild(option)
  }
  animationLabel.appendChild(animation)
  const durationRow = el('label', 'lp-slider-setting')
  const durationHead = el('span', 'lp-row-between')
  const durationValue = el('strong', '', `${settings.animationDurationMs} ms`)
  durationHead.append(el('span', 'lp-title', 'Animation duration'), durationValue)
  const duration = el('input')
  duration.type = 'range'; duration.min = '0'; duration.max = '700'; duration.step = '20'; duration.value = String(settings.animationDurationMs)
  duration.addEventListener('input', () => {
    settings.animationDurationMs = Number(duration.value)
    durationValue.textContent = `${settings.animationDurationMs} ms`
  })
  durationRow.append(durationHead, duration)
  const reducedMotion = toggleSetting('Reduce motion', settings.reducedMotion, (value) => { settings.reducedMotion = value })
  appearance.append(themes, palette, scaleRow, animationLabel, durationRow, reducedMotion)

  const behavior = el('section', 'lp-card lp-settings-section')
  behavior.dataset.settingsSection = 'behavior'
  behavior.appendChild(el('div', 'lp-eyebrow', 'Character actions'))
  behavior.append(
    toggleSetting('Open phone on model action', settings.autoOpenOnModelAction, (value) => { settings.autoOpenOnModelAction = value }),
    toggleSetting('Push notifications', settings.pushNotifications, (value) => { settings.pushNotifications = value }),
    toggleSetting('Camera scene planner', settings.sceneEnhancer, (value) => { settings.sceneEnhancer = value }),
  )

  const visual = el('section', 'lp-card lp-settings-section')
  visual.dataset.settingsSection = 'camera'
  visual.appendChild(el('div', 'lp-eyebrow', 'Camera visual profile'))
  const swarm = toggleSetting('Sync active Swarm Studio profile', settings.useSwarmProfile, (value) => { settings.useSwarmProfile = value })
  const status = el('div', 'lp-copy', host.swarmProfile?.available
    ? `Linked: ${host.swarmProfile.checkpoint || 'active checkpoint'}${host.swarmProfile.presets ? ` · ${host.swarmProfile.presets}` : ''}`
    : 'Swarm Studio profile macros were not detected. Manual fields below remain active.')
  const positive = el('textarea', 'lp-textarea'); positive.placeholder = 'Manual positive / character style'; positive.value = settings.manualVisualProfile.positive
  const negative = el('textarea', 'lp-textarea'); negative.placeholder = 'Manual negative prompt'; negative.value = settings.manualVisualProfile.negative
  const model = host.field('Checkpoint / model override', settings.manualVisualProfile.model)
  const connection = host.field('Image connection ID override', settings.manualVisualProfile.connectionId)
  const loras = el('textarea', 'lp-textarea'); loras.placeholder = 'LoRA stack, one per line: name | weight'; loras.value = settings.manualVisualProfile.loras.map((item) => `${item.name} | ${item.weight}`).join('\n')
  const parameters = el('textarea', 'lp-textarea'); parameters.placeholder = 'Provider parameters as JSON'; parameters.value = Object.keys(settings.manualVisualProfile.parameters).length ? JSON.stringify(settings.manualVisualProfile.parameters, null, 2) : ''
  visual.append(swarm, status, positive, negative, model.label, connection.label, loras, parameters)

  const access = el('section', 'lp-card lp-settings-section')
  access.dataset.settingsSection = 'access'
  access.appendChild(el('div', 'lp-eyebrow', 'Lumiverse access'))
  const grid = el('div', 'lp-permission-grid')
  const caps = host.capabilities
  for (const [label, granted] of [
    ['Generation', Boolean(caps?.generation)], ['Model tools', Boolean(caps?.tools)], ['Prompt memory', Boolean(caps?.interceptor)],
    ['Gallery', Boolean(caps?.images)], ['Camera', Boolean(caps?.imageGen)], ['Floating phone', Boolean(caps?.panels)],
    ['Characters', Boolean(caps?.characters)], ['Personas', Boolean(caps?.personas)], ['Push', Boolean(caps?.push)],
  ] as Array<[string, boolean]>) {
    const cell = el('div', 'lp-permission', label)
    cell.dataset.granted = String(granted)
    grid.appendChild(cell)
  }
  const manage = button('Request or update permissions')
  manage.addEventListener('click', () => host.requestPermissions())
  access.append(grid, manage)

  const data = el('section', 'lp-card lp-settings-section')
  data.dataset.settingsSection = 'data'
  data.append(el('div', 'lp-eyebrow', 'Backup and reset'), el('p', 'lp-copy', 'Exports include this roleplay phone and device preferences. Imports are validated and forced into the current chat/character scope.'))
  const exportButton = button('Export current phone'); exportButton.addEventListener('click', () => host.send('lumiphone:export_data'))
  const importButton = button('Import into current phone')
  const file = el('input'); file.type = 'file'; file.accept = 'application/json,.json'; file.hidden = true
  importButton.addEventListener('click', () => file.click())
  file.addEventListener('change', async () => {
    const selected = file.files?.[0]
    if (!selected) return
    try { host.send('lumiphone:import_data', { data: JSON.parse(await selected.text()) }) }
    catch { host.showError('That file is not valid Pocket JSON.') }
    finally { file.value = '' }
  })
  const resetCurrent = button('Reset this roleplay phone', 'lp-button lp-button-danger')
  resetCurrent.addEventListener('click', () => { if (window.confirm('Reset the phone for only this chat and character?')) host.send('lumiphone:reset_current') })
  const resetAll = button('Reset all roleplay phones', 'lp-button lp-button-danger')
  resetAll.addEventListener('click', () => { if (window.confirm('Delete every Pocket chat/character state? Device preferences will remain.')) host.send('lumiphone:reset_all_roleplay') })
  const resetPrefs = button('Reset device preferences', 'lp-button lp-button-danger')
  resetPrefs.addEventListener('click', () => { if (window.confirm('Reset theme, size, animations, notification behavior, and camera profile? Roleplay data will remain.')) host.send('lumiphone:reset_preferences') })
  data.append(exportButton, importButton, file, resetCurrent, resetAll, resetPrefs)
  content.append(appearance, behavior, visual, access, data)

  page.querySelector<HTMLButtonElement>('.lp-nav-action:last-child')!.addEventListener('click', () => {
    settings.animation = animation.value as PhoneSettings['animation']
    settings.animationDurationMs = Number(duration.value)
    settings.manualVisualProfile.positive = positive.value.trim()
    settings.manualVisualProfile.negative = negative.value.trim()
    settings.manualVisualProfile.model = inputValue(model.input)
    settings.manualVisualProfile.connectionId = inputValue(connection.input)
    settings.manualVisualProfile.loras = loras.value.split('\n').flatMap((line) => {
      const [name, rawWeight] = line.split('|').map((part) => part.trim())
      if (!name) return []
      const weight = Number(rawWeight)
      return [{ name, weight: Number.isFinite(weight) ? weight : 1 }]
    })
    try { settings.manualVisualProfile.parameters = parameters.value.trim() ? JSON.parse(parameters.value) : {} }
    catch { host.showError('Provider parameters must be valid JSON.'); return }
    host.send('lumiphone:save_preferences', { preferences: settings })
    host.preview(normalizePreferences(settings), { appearance: true })
    host.openHome()
  })
  return page
}
