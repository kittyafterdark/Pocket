import type { ChatPocketPersona, DevicePreferences, PhoneCapabilities, PhonePalette, PhoneSettings, PhoneState, PocketContextDiagnostics, PocketGenerationInfo, PocketOperationProgress, PocketResolvedWallpapers, SwarmVisualProfile } from '../../types.js'
import { normalizePreferences, themePalette } from '../../domain/preferences.js'
import { button, el } from '../shared.js'
import type { PageAction } from '../shared.js'
import { wallpaperImageControl } from '../components/image-picker.js'
import type { PocketImageTarget } from '../components/image-picker.js'

type Page = { page: HTMLDivElement; content: HTMLDivElement }
type ActivePersona = { id: string; name: string } | null

export interface SettingsViewHost {
  draft: DevicePreferences
  state: PhoneState
  section: string
  activePersona: ActivePersona
  capabilities: PhoneCapabilities | null
  swarmProfile: SwarmVisualProfile | null
  generation: PocketGenerationInfo | null
  resolvedWallpapers: PocketResolvedWallpapers
  contextPreview: PocketContextDiagnostics | null
  personaPreview: ChatPocketPersona | null
  operations: Map<string, PocketOperationProgress>
  page(title: string, subtitle?: string, action?: PageAction): Page
  update(preferences: DevicePreferences, options?: { persist?: boolean; resize?: boolean }): void
  navigate(section: string): void
  send(type: string, payload?: Record<string, unknown>): string
  requestPermissions(): void
  showError(message: string): void
  rerender(): void
  chooseImage(target: PocketImageTarget, mode: 'gallery' | 'upload' | 'url'): void
  mountModelCombobox(target: HTMLElement, options: { value: string; connection: { kind: 'llm'; id?: string }; disabled?: boolean; onChange(value: string): void }): void
}

function clone(value: DevicePreferences): DevicePreferences { return structuredClone(value) }

function row(label: string, detail = ''): HTMLDivElement {
  const node = el('div', 'lp-row-between')
  const copy = el('span'); copy.append(el('strong', '', label)); if (detail) copy.append(el('span', 'lp-copy', detail))
  node.appendChild(copy)
  return node
}

function toggle(label: string, initial: boolean, update: (value: boolean) => void, detail = ''): HTMLDivElement {
  const node = row(label, detail)
  node.dataset.setting = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const control = button('', 'lp-toggle'); control.setAttribute('aria-pressed', String(initial)); control.setAttribute('aria-label', label)
  control.addEventListener('click', () => {
    const next = control.getAttribute('aria-pressed') !== 'true'
    control.setAttribute('aria-pressed', String(next)); update(next)
  })
  node.appendChild(control)
  return node
}

function color(label: string, value: string, update: (value: string) => void): HTMLDivElement {
  const node = row(label)
  node.dataset.setting = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const control = el('input', 'lp-color-input'); control.type = 'color'; control.value = /^#[0-9a-f]{6}$/i.test(value) ? value : '#8b7dff'
  control.addEventListener('input', () => update(control.value)); node.appendChild(control)
  return node
}

function slider(label: string, value: number, min: number, max: number, step: number, format: (value: number) => string, update: (value: number) => void, detail = ''): HTMLLabelElement {
  const node = el('label', 'lp-slider-setting'); const head = el('span', 'lp-row-between'); const display = el('strong', '', format(value))
  node.dataset.setting = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  head.append(el('span', 'lp-title', label), display)
  const control = el('input'); control.type = 'range'; control.min = String(min); control.max = String(max); control.step = String(step); control.value = String(value)
  control.addEventListener('input', () => { const next = Number(control.value); display.textContent = format(next); update(next) })
  node.append(head, control); if (detail) node.append(el('span', 'lp-copy', detail)); return node
}

function categories(host: SettingsViewHost): HTMLDivElement {
  const { page, content } = host.page('Settings', 'Device-wide preferences')
  const entries = [
    ['appearance', 'Appearance', 'Themes, scale, motion, custom CSS'],
    ['persona', 'Persona & Device', 'Optional appearance for the active persona'],
    ['messages', 'Messages', 'Replies, ambient texts, roleplay context'],
    ['generation', 'Pocket Generation', 'Model source and connection diagnostics'],
    ['camera', 'Camera & Swarm Studio', 'Visual profile and macro diagnostics'],
    ['notifications', 'Notifications', 'Kinds, previews, push, and sound'],
    ['permissions', 'Permissions', 'Lumiverse capability access'],
    ['data', 'Data & Backup', 'Export, import, and reset'],
  ]
  for (const [id, label, detail] of entries) {
    const open = button('', 'lp-card lp-settings-category'); open.dataset.settingsCategory = id
    const copy = el('span'); copy.append(el('strong', '', label), el('span', 'lp-copy', detail))
    open.append(copy, el('span', 'lp-settings-chevron', '›')); open.addEventListener('click', () => host.navigate(id)); content.appendChild(open)
  }
  return page
}

function appearance(host: SettingsViewHost): HTMLDivElement {
  const settings = host.draft
  const commit = (mutate: (next: DevicePreferences) => void, options?: { persist?: boolean; resize?: boolean }) => { const next = clone(settings); mutate(next); host.update(normalizePreferences(next), options) }
  const { page, content } = host.page('Appearance', 'Device defaults')
  const themes = el('section', 'lp-card lp-settings-section'); themes.append(el('div', 'lp-eyebrow', 'Theme'))
  const themeRow = el('div', 'lp-row')
  for (const [name, swatch] of [['midnight', '#201a37'], ['porcelain', '#eeeae6'], ['rose', '#7a294e'], ['forest', '#1d5a41'], ['custom', settings.colors.accent]] as const) {
    const dot = button('', 'lp-theme-dot'); dot.title = name; dot.style.background = swatch; dot.setAttribute('aria-pressed', String(settings.theme === name))
    dot.addEventListener('click', () => commit((next) => { next.theme = name; if (name !== 'custom') next.colors = themePalette(name) }))
    themeRow.appendChild(dot)
  }
  themes.appendChild(themeRow)
  const palette = el('div', 'lp-color-grid')
  const colorControl = (label: string, key: keyof PhonePalette) => color(label, settings.colors[key], (value) => commit((next) => { next.theme = 'custom'; next.colors[key] = value }))
  palette.append(colorControl('Accent', 'accent'), colorControl('Bezel', 'bezel'), colorControl('UI background', 'background'), colorControl('UI surface', 'surface'), colorControl('UI text', 'text'), colorControl('Home top', 'wallpaperPrimary'), colorControl('Home bottom', 'wallpaperSecondary'), colorControl('Chat top', 'chatPrimary'), colorControl('Chat bottom', 'chatSecondary'))
  const wallpapers = el('section', 'lp-card lp-settings-section')
  wallpapers.append(
    el('div', 'lp-eyebrow', 'Wallpaper images'),
    wallpaperImageControl('Home wallpaper', 'device-home', settings.homeWallpaper, host.resolvedWallpapers.deviceHome, {
      choose: host.chooseImage, change: (wallpaper) => commit((next) => { next.homeWallpaper = wallpaper }),
    }),
    wallpaperImageControl('Chat wallpaper', 'device-chat', settings.chatWallpaper, host.resolvedWallpapers.deviceChat, {
      choose: host.chooseImage, change: (wallpaper) => commit((next) => { next.chatWallpaper = wallpaper }),
    }),
  )
  const scaleCard = el('section', 'lp-card lp-settings-section'); scaleCard.append(el('div', 'lp-eyebrow', 'Sizing'))
  const presets = el('div', 'lp-row')
  for (const [label, value] of [['Compact', .8], ['Default', 1], ['Large', 1.2]] as const) { const preset = button(label, 'lp-chip'); preset.setAttribute('aria-pressed', String(settings.uiScale === value)); preset.addEventListener('click', () => commit((next) => { next.uiScale = value })); presets.appendChild(preset) }
  scaleCard.append(
    presets,
    slider('Interface size', settings.uiScale, .7, 1.3, .05, (value) => `${Math.round(value * 100)}%`, (value) => commit((next) => { next.uiScale = value }), 'Scales Pocket primitives and density on desktop and mobile. It never shrinks the mobile viewport.'),
    slider('Desktop phone size', settings.handsetScale, .8, 1.25, .05, (value) => `${Math.round(value * 100)}%`, (value) => commit((next) => { next.handsetScale = value }, { resize: true }), 'Controls only the physical 9:16 handset on desktop.'),
  )
  const motion = el('section', 'lp-card lp-settings-section'); motion.append(el('div', 'lp-eyebrow', 'Motion'))
  const animation = el('select', 'lp-select')
  for (const value of ['spring', 'slide', 'fade', 'none']) { const option = el('option', '', value[0].toUpperCase() + value.slice(1)); option.value = value; option.selected = settings.animation === value; animation.appendChild(option) }
  animation.addEventListener('change', () => commit((next) => { next.animation = animation.value as PhoneSettings['animation'] }))
  motion.append(animation, slider('Animation duration', settings.animationDurationMs, 0, 700, 20, (value) => `${value} ms`, (value) => commit((next) => { next.animationDurationMs = value })), toggle('Reduce motion', settings.reducedMotion, (value) => commit((next) => { next.reducedMotion = value })))
  const custom = el('section', 'lp-card lp-settings-section'); custom.append(el('div', 'lp-eyebrow', 'Advanced custom CSS'), el('p', 'lp-copy', 'Scoped to .lumiphone-shell. Stable hooks include data-pocket-app, data-pocket-thread, data-message-id, data-settings-category, and data-setting.'))
  const css = el('textarea', 'lp-textarea lp-code-input'); css.value = settings.customCss; css.placeholder = '.lp-bubble { border-radius: 12px; }'; css.addEventListener('input', () => commit((next) => { next.customCss = css.value }, { persist: false }))
  const apply = button('Apply custom CSS', 'lp-button'); apply.addEventListener('click', () => commit((next) => { next.customCss = css.value }))
  custom.append(css, apply)
  content.append(themes, palette, wallpapers, scaleCard, motion, custom); return page
}

function persona(host: SettingsViewHost): HTMLDivElement {
  const profile = host.state.pocketPersona
  const { page, content } = host.page('Persona & Device', profile.displayName || host.activePersona?.name || 'Pocket profile')
  const identity = el('section', 'lp-card lp-settings-section')
  identity.append(el('div', 'lp-eyebrow', 'Who is using this phone?'))
  const source = el('select', 'lp-select')
  for (const [value, label] of [['lumiverse', 'Follow Lumiverse Persona'], ['manual', 'Use Pocket profile']] as const) {
    const option = el('option', '', label); option.value = value; option.selected = profile.source === value || (profile.source === 'generated' && value === 'manual'); source.appendChild(option)
  }
  const name = el('input', 'lp-input'); name.placeholder = 'Display name'; name.value = profile.displayName
  const pronouns = el('input', 'lp-input'); pronouns.placeholder = 'Pronouns'; pronouns.value = profile.pronouns
  const role = el('input', 'lp-input'); role.placeholder = 'Role'; role.value = profile.role
  const phoneProfile = profile.phoneProfile || { personality: '', appearance: '', textingStyle: '' }
  const personality = el('textarea', 'lp-textarea'); personality.placeholder = 'Personality — stable traits that shape conversation'; personality.value = phoneProfile.personality
  const appearance = el('textarea', 'lp-textarea'); appearance.placeholder = 'Minimal appearance — only recognizable details worth texting about'; appearance.value = phoneProfile.appearance
  const textingStyle = el('textarea', 'lp-textarea'); textingStyle.placeholder = 'Texting quirks — casing, punctuation, slang/register, emoji/kaomoji habits, message length…'; textingStyle.value = phoneProfile.textingStyle
  const canAppear = toggle('Can appear as phone participant', profile.canAppear, () => {}, 'Off by default. The active Persona is never imported as a Contact.')
  const fields = el('div', 'lp-fields')
  fields.append(
    name,
    pronouns,
    role,
    el('div', 'lp-label', 'Personality'), personality,
    el('div', 'lp-label', 'Minimal appearance'), appearance,
    el('div', 'lp-label', 'Texting quirks'), textingStyle,
    canAppear,
  )
  const syncDisabled = () => {
    const disabled = source.value === 'lumiverse'
    for (const control of [name, pronouns, role]) control.disabled = disabled
    // Pocket phone-profile fields are an overlay and remain editable while following Lumiverse Persona.
    canAppear.querySelector('button')!.toggleAttribute('disabled', disabled)
  }
  source.addEventListener('change', syncDisabled); syncDisabled()
  const actions = el('div', 'lp-row')
  const personaOperation = [...host.operations.values()].find((entry) => entry.task === 'persona-profile' && entry.phase !== 'complete' && entry.phase !== 'error')
  const describe = button(personaOperation ? 'Enriching…' : 'Enrich with LLM', 'lp-button lp-button-quiet')
  describe.disabled = !host.capabilities?.generation || Boolean(personaOperation)
  let personaProgress: HTMLDivElement | null = null
  const mountPersonaProgress = (requestId: string, message = 'Enriching phone profile…') => {
    personaProgress?.remove()
    personaProgress = el('div', 'lp-operation-progress')
    personaProgress.dataset.operationRequest = requestId
    personaProgress.dataset.phase = 'generating'
    personaProgress.setAttribute('role', 'status')
    const label = el('strong', '', message); label.dataset.operationMessage = 'true'
    personaProgress.append(el('span', 'lp-indeterminate'), label)
    identity.appendChild(personaProgress)
  }
  describe.addEventListener('click', () => {
    describe.disabled = true
    describe.textContent = 'Enriching…'
    const requestId = host.send('lumiphone:generate_pocket_persona')
    mountPersonaProgress(requestId)
  })
  const save = button('Save profile', 'lp-button'); save.addEventListener('click', () => host.send('lumiphone:save_pocket_persona', {
    followLumiverse: source.value === 'lumiverse',
    persona: {
      ...profile,
      source: source.value,
      displayName: name.value.trim(),
      pronouns: pronouns.value.trim(),
      role: role.value.trim(),
      phoneProfile: {
        personality: personality.value.trim(),
        appearance: appearance.value.trim(),
        textingStyle: textingStyle.value.trim(),
      },
      canAppear: canAppear.querySelector('button')?.getAttribute('aria-pressed') === 'true',
    },
  }))
  actions.append(describe, save); identity.append(source, fields, actions)
  if (personaOperation) mountPersonaProgress(personaOperation.requestId, personaOperation.message)
  if (host.personaPreview) {
    const preview = el('section', 'lp-card lp-settings-section'); preview.dataset.pocketPersonaPreview = 'true'
    const generatedPhone = host.personaPreview.phoneProfile || { personality: '', appearance: '', textingStyle: '' }
    preview.append(
      el('div', 'lp-eyebrow', 'Generated phone profile'),
      el('strong', '', host.personaPreview.displayName),
      el('p', 'lp-copy', [host.personaPreview.pronouns, host.personaPreview.role].filter(Boolean).join(' · ')),
      generatedPhone.personality ? el('p', 'lp-copy', `Personality: ${generatedPhone.personality}`) : el('span'),
      generatedPhone.appearance ? el('p', 'lp-copy', `Appearance: ${generatedPhone.appearance}`) : el('span'),
      generatedPhone.textingStyle ? el('p', 'lp-copy', `Texting: ${generatedPhone.textingStyle}`) : el('span'),
    )
    const use = button('Use profile', 'lp-button'); use.addEventListener('click', () => host.send('lumiphone:save_pocket_persona', { persona: host.personaPreview })); preview.appendChild(use); identity.appendChild(preview)
  }
  content.appendChild(identity)
  if (!host.activePersona) return page
  const active = host.activePersona
  const current = host.draft.personaAppearance[active.id] || {
    enabled: false, theme: host.draft.theme, colors: clone(host.draft).colors, customCss: '',
    homeWallpaper: { ...structuredClone(host.draft.homeWallpaper), source: null },
    chatWallpaper: { ...structuredClone(host.draft.chatWallpaper), source: null },
  }
  const commit = (mutate: (value: typeof current) => void, persist = true) => { const next = clone(host.draft); const value = structuredClone(next.personaAppearance[active.id] || current); mutate(value); next.personaAppearance[active.id] = value; host.update(next, { persist }) }
  const card = el('section', 'lp-card lp-settings-section')
  card.append(el('div', 'lp-eyebrow', 'Persona appearance'), toggle(`Enable for ${active.name}`, current.enabled, (value) => commit((item) => { item.enabled = value }), 'Appearance only; connections and notifications remain device-wide.'))
  const theme = el('select', 'lp-select')
  for (const themeName of ['midnight', 'porcelain', 'rose', 'forest', 'custom'] as const) { const option = el('option', '', themeName); option.value = themeName; option.selected = current.theme === themeName; theme.appendChild(option) }
  theme.addEventListener('change', () => commit((item) => { item.theme = theme.value as PhoneSettings['theme']; if (item.theme !== 'custom') item.colors = themePalette(item.theme) }))
  const colors = el('div', 'lp-color-grid')
  for (const [label, key] of [['Accent', 'accent'], ['Bezel', 'bezel'], ['Home top', 'wallpaperPrimary'], ['Home bottom', 'wallpaperSecondary'], ['Chat top', 'chatPrimary'], ['Chat bottom', 'chatSecondary']] as Array<[string, keyof PhonePalette]>) colors.appendChild(color(label, current.colors[key], (value) => commit((item) => { item.theme = 'custom'; item.colors[key] = value })))
  const personaWallpapers = el('section', 'lp-settings-section')
  personaWallpapers.append(
    wallpaperImageControl(`${active.name} home`, 'persona-home', current.homeWallpaper, host.resolvedWallpapers.personaHome, {
      choose: host.chooseImage, change: (wallpaper) => commit((item) => { item.homeWallpaper = wallpaper }),
    }),
    wallpaperImageControl(`${active.name} chat`, 'persona-chat', current.chatWallpaper, host.resolvedWallpapers.personaChat, {
      choose: host.chooseImage, change: (wallpaper) => commit((item) => { item.chatWallpaper = wallpaper }),
    }),
  )
  const css = el('textarea', 'lp-textarea lp-code-input'); css.placeholder = 'Persona-scoped Pocket CSS'; css.value = current.customCss; css.addEventListener('input', () => commit((item) => { item.customCss = css.value }, false))
  const apply = button('Apply persona CSS', 'lp-button'); apply.addEventListener('click', () => commit((item) => { item.customCss = css.value }))
  card.append(theme, colors, personaWallpapers, css, apply); content.appendChild(card); return page
}

function messages(host: SettingsViewHost): HTMLDivElement {
  const settings = host.draft; const commit = (mutate: (next: DevicePreferences) => void) => { const next = clone(settings); mutate(next); host.update(next) }
  const { page, content } = host.page('Messages', 'Generation and context bridge')
  const replies = el('section', 'lp-card lp-settings-section'); replies.append(el('div', 'lp-eyebrow', 'Reply behavior'), toggle('Decide on a reply after user DMs', settings.autoReplyAfterSend, (value) => commit((next) => { next.autoReplyAfterSend = value })))
  const cadence = el('select', 'lp-select'); for (const [value, label] of [['instant', 'Instant'], ['quick', 'Quick'], ['natural', 'Natural'], ['relaxed', 'Relaxed']] as const) { const option = el('option', '', label); option.value = value; option.selected = settings.replyCadence === value; cadence.appendChild(option) }; cadence.addEventListener('change', () => commit((next) => { next.replyCadence = cadence.value as DevicePreferences['replyCadence'] })); replies.append(el('div', 'lp-label', 'Outgoing message grace'), cadence, el('p', 'lp-copy', 'Messages sent during this window form one burst and receive one reply decision. Typing or focusing the composer holds the decision.'))
  const ambient = el('select', 'lp-select'); for (const [value, label] of [['off', 'Off'], ['sparse', 'Sparse'], ['normal', 'Normal']] as const) { const option = el('option', '', label); option.value = value; option.selected = settings.ambientMessaging === value; ambient.appendChild(option) }; ambient.addEventListener('change', () => commit((next) => { next.ambientMessaging = ambient.value as DevicePreferences['ambientMessaging'] })); replies.append(el('div', 'lp-label', 'Ambient messages'), ambient)
  const context = el('section', 'lp-card lp-settings-section'); context.append(el('div', 'lp-eyebrow', 'Roleplay context'))
  const mode = el('select', 'lp-select'); for (const [value, label] of [['off', 'Off'], ['recent', 'Recent RP'], ['story', 'Story context'], ['smart', 'Smart']] as const) { const option = el('option', '', label); option.value = value; option.selected = settings.roleplayContextMode === value; mode.appendChild(option) }; mode.addEventListener('change', () => commit((next) => { next.roleplayContextMode = mode.value as DevicePreferences['roleplayContextMode'] }))
  const explanations: Record<string, string> = {
    off: 'Off — phone replies use only compact actor identity and the Pocket thread.',
    recent: 'Recent RP — includes a bounded tail of the committed Lumiverse transcript.',
    story: 'Story — includes Pocket timeline, trackers, weather, and pinned notes without transcript lines.',
    smart: 'Smart — combines Story with Recent RP when the conversation or current scene makes it relevant.',
  }
  const explanation = el('p', 'lp-copy', explanations[settings.roleplayContextMode]); mode.addEventListener('change', () => { explanation.textContent = explanations[mode.value] })
  const previewSelect = el('select', 'lp-select')
  for (const conversation of host.state.conversations) { const option = el('option', '', conversation.title); option.value = conversation.id; previewSelect.appendChild(option) }
  const preview = button('Preview effective context', 'lp-button lp-button-quiet'); preview.disabled = !host.state.conversations.length; preview.addEventListener('click', () => host.send('lumiphone:preview_context', { conversationId: previewSelect.value }))
  context.append(mode, explanation, slider('Recent roleplay messages', settings.recentRoleplayMessages, 0, 20, 1, String, (value) => commit((next) => { next.recentRoleplayMessages = value }), 'Bounded committed host-chat context used by Recent RP and deterministic Smart mode.'), previewSelect, preview)
  if (host.contextPreview) {
    const diagnostic = host.contextPreview
    const details = el('details', 'lp-context-preview'); details.open = true; details.appendChild(el('summary', '', `Effective context · ~${diagnostic.estimatedTokens} tokens`))
    const stats = el('div', 'lp-context-stats')
    for (const [label, value] of [
      ['Actor identity', `${diagnostic.actorIdentityChars} chars`],
      ['Scene snapshot', `${diagnostic.sceneSnapshot.chars} chars · ${diagnostic.sceneSnapshot.stale ? 'stale' : 'current'} · turn ${diagnostic.sceneSnapshot.sourceMessageIndex}`],
      ['Phone thread', `${diagnostic.phoneThread.count} messages · ${diagnostic.phoneThread.chars}/${diagnostic.phoneThread.budget} chars`],
      ['Recent RP', `${diagnostic.recentRoleplay.count} messages · ${diagnostic.recentRoleplay.chars}/${diagnostic.recentRoleplay.budget} chars`],
      ['Story', `${diagnostic.story.count} facts · ${diagnostic.story.chars}/${diagnostic.story.budget} chars`],
      ['Total', `${diagnostic.totalChars} chars`],
    ]) stats.appendChild(row(label, value))
    const anchors = el('p', 'lp-copy', `Authoritative latest: ${diagnostic.authoritativeLatest.id || 'none'} (#${diagnostic.authoritativeLatest.index}) · Included latest: ${diagnostic.includedLatest.id || 'none'} (#${diagnostic.includedLatest.index})`)
    details.append(stats, anchors)
    if (diagnostic.freshnessWarning) details.appendChild(el('p', 'lp-warning', diagnostic.freshnessWarning))
    const advanced = el('details'); advanced.append(el('summary', '', 'Exact sanitized assembled block'))
    const exact = el('pre', 'lp-context-exact', diagnostic.assembled)
    const copy = button('Copy', 'lp-button lp-button-quiet'); copy.addEventListener('click', () => void navigator.clipboard.writeText(diagnostic.assembled))
    advanced.append(exact, copy); details.appendChild(advanced); context.appendChild(details)
  }
  content.append(replies, context); return page
}

function generation(host: SettingsViewHost): HTMLDivElement {
  const settings = host.draft; const commit = (mutate: (next: DevicePreferences) => void) => { const next = clone(settings); mutate(next); host.update(next) }
  const { page, content } = host.page('Pocket Generation', 'Text model source')
  const card = el('section', 'lp-card lp-settings-section')
  const mode = el('select', 'lp-select'); for (const [value, label] of [['roleplay', 'Follow roleplay model'], ['sidecar', 'Pocket sidecar']] as const) { const option = el('option', '', label); option.value = value; option.selected = settings.generationMode === value; mode.appendChild(option) }
  const connections = el('select', 'lp-select'); const none = el('option', '', 'Choose a connection'); none.value = ''; connections.appendChild(none); for (const entry of host.generation?.connections || []) { const option = el('option', '', `${entry.name} · ${entry.model || entry.provider}`); option.value = entry.id; option.selected = settings.sidecarConnectionId === entry.id; connections.appendChild(option) }; connections.disabled = settings.generationMode !== 'sidecar'
  mode.addEventListener('change', () => { commit((next) => { next.generationMode = mode.value === 'sidecar' ? 'sidecar' : 'roleplay' }); host.rerender() }); connections.addEventListener('change', () => { commit((next) => { next.sidecarConnectionId = connections.value; next.sidecarModelOverride = '' }); host.rerender() })
  const modelMount = el('div', 'lp-model-combobox')
  host.mountModelCombobox(modelMount, {
    value: settings.sidecarModelOverride,
    connection: { kind: 'llm', id: settings.sidecarConnectionId || undefined },
    disabled: settings.generationMode !== 'sidecar' || !settings.sidecarConnectionId,
    onChange: (value) => commit((next) => { next.sidecarModelOverride = value }),
  })
  const effective = host.generation?.effective; const effectiveModel = settings.generationMode === 'sidecar' && settings.sidecarModelOverride ? `${settings.sidecarModelOverride} (override)` : effective?.model || 'model not set'; const effectiveCard = el('div', 'lp-generation-effective'); effectiveCard.dataset.pocketGenerationEffective = 'true'; effectiveCard.append(el('strong', '', effective?.name || 'No effective connection'), el('span', 'lp-copy', effective ? `${effective.provider} · ${effectiveModel}` : 'Configure a Lumiverse LLM connection.'))
  const test = button('Test Pocket generation', 'lp-button'); test.dataset.pocketGenerationTest = 'true'; test.disabled = !host.capabilities?.generation; test.addEventListener('click', () => host.send('lumiphone:test_generation', { generationMode: mode.value, sidecarConnectionId: connections.value, sidecarModelOverride: settings.sidecarModelOverride }))
  const diagnostic = el('p', 'lp-copy', 'Not tested yet.'); diagnostic.dataset.pocketGenerationDiagnostic = 'true'
  const run = [...(host.generation?.history || [])].reverse().find((entry) => entry.task === 'connection-test'); if (run) diagnostic.textContent = run.status === 'started' ? '● Testing…' : run.status === 'completed' ? `✓ Success · ${run.latencyMs ?? 0} ms · ${run.connectionName} / ${run.model}` : `Failed · ${run.error || 'Unknown provider error'}`
  card.append(el('div', 'lp-label', 'Generation mode'), mode, el('div', 'lp-label', 'Connection profile'), connections, el('div', 'lp-label', 'Model override'), modelMount, el('p', 'lp-copy', 'Leave blank to use the model configured on the selected connection profile.'), effectiveCard, test, diagnostic); content.appendChild(card); return page
}

function camera(host: SettingsViewHost): HTMLDivElement {
  const settings = host.draft; const commit = (mutate: (next: DevicePreferences) => void, persist = true) => { const next = clone(settings); mutate(next); host.update(next, { persist }) }
  const { page, content } = host.page('Camera & Swarm Studio', 'Visual profile')
  const swarm = el('section', 'lp-card lp-settings-section'); swarm.append(el('div', 'lp-eyebrow', 'Swarm Studio'), toggle('Sync active profile', settings.useSwarmProfile, (value) => {
    const next = clone(settings); next.useSwarmProfile = value; host.update(next, { persist: false }); host.send('lumiphone:save_preferences', { preferences: next })
  }))
  const status = el('p', 'lp-copy', host.swarmProfile?.status === 'connected' ? `Connected · ${host.swarmProfile.checkpoint || 'profile macros resolved'}` : host.swarmProfile?.status === 'error' ? `Error · ${host.swarmProfile.error}` : host.swarmProfile?.status === 'disabled' ? 'Swarm profile sync is disabled.' : 'Swarm Studio macros were not detected for this character/persona.'); status.dataset.pocketSwarmStatus = 'true'; status.dataset.status = host.swarmProfile?.status || 'not-detected'
  const refresh = button('Refresh profile', 'lp-button'); refresh.addEventListener('click', () => host.send('lumiphone:get_swarm_profile'))
  const diagnostics = el('details', 'lp-swarm-diagnostics'); diagnostics.appendChild(el('summary', '', 'Macro diagnostics'))
  for (const name of ['char_base', 'persona_base', 'swarm_negative', 'swarm_preset', 'swarm_checkpoint', 'swarm_aspect'] as const) { const field = host.swarmProfile?.fields?.[name]; const row = el('div', 'lp-generation-run', `${name} · ${field?.detected ? `${field.length} chars · ${field.preview}` : 'empty'}`); row.dataset.pocketSwarmMacro = name; diagnostics.appendChild(row) }
  swarm.append(status, refresh, diagnostics)
  const manual = el('section', 'lp-card lp-settings-section'); manual.append(el('div', 'lp-eyebrow', 'Primitive / manual mode'))
  const positive = el('textarea', 'lp-textarea'); positive.placeholder = 'Positive / character style'; positive.value = settings.manualVisualProfile.positive
  const negative = el('textarea', 'lp-textarea'); negative.placeholder = 'Negative prompt'; negative.value = settings.manualVisualProfile.negative
  const model = el('input', 'lp-input'); model.placeholder = 'Checkpoint override'; model.value = settings.manualVisualProfile.model
  const connection = el('input', 'lp-input'); connection.placeholder = 'Image connection ID'; connection.value = settings.manualVisualProfile.connectionId
  const loras = el('textarea', 'lp-textarea'); loras.placeholder = 'LoRA stack: name | weight'; loras.value = settings.manualVisualProfile.loras.map((item) => `${item.name} | ${item.weight}`).join('\n')
  const parameters = el('textarea', 'lp-textarea lp-code-input'); parameters.placeholder = 'Provider parameters JSON'; parameters.value = Object.keys(settings.manualVisualProfile.parameters).length ? JSON.stringify(settings.manualVisualProfile.parameters, null, 2) : ''
  for (const control of [positive, negative, model, connection, loras, parameters]) control.addEventListener('input', () => commit((next) => { next.manualVisualProfile.positive = positive.value; next.manualVisualProfile.negative = negative.value; next.manualVisualProfile.model = model.value; next.manualVisualProfile.connectionId = connection.value }, false))
  const apply = button('Apply manual profile', 'lp-button'); apply.addEventListener('click', () => { let parsed: Record<string, unknown> = {}; try { parsed = parameters.value.trim() ? JSON.parse(parameters.value) : {} } catch { host.showError('Provider parameters must be valid JSON.'); return }; commit((next) => { next.manualVisualProfile.positive = positive.value.trim(); next.manualVisualProfile.negative = negative.value.trim(); next.manualVisualProfile.model = model.value.trim(); next.manualVisualProfile.connectionId = connection.value.trim(); next.manualVisualProfile.loras = loras.value.split('\n').flatMap((line) => { const [name, raw] = line.split('|').map((part) => part.trim()); if (!name) return []; const weight = Number(raw); return [{ name, weight: Number.isFinite(weight) ? weight : 1 }] }); next.manualVisualProfile.parameters = parsed }) })
  manual.append(positive, negative, model, connection, loras, parameters, apply); content.append(swarm, manual); return page
}

function notifications(host: SettingsViewHost): HTMLDivElement {
  const settings = host.draft; const commit = (mutate: (next: DevicePreferences) => void) => { const next = clone(settings); mutate(next); host.update(next) }
  const { page, content } = host.page('Notifications', 'Device-wide behavior'); const card = el('section', 'lp-card lp-settings-section')
  card.append(toggle('Message notifications', settings.notifyMessages, (value) => commit((next) => { next.notifyMessages = value })), toggle('Contact notifications', settings.notifyContacts, (value) => commit((next) => { next.notifyContacts = value })), toggle('Tracker notifications', settings.notifyTrackers, (value) => commit((next) => { next.notifyTrackers = value })), toggle('Show notification previews', settings.notificationPreviews, (value) => commit((next) => { next.notificationPreviews = value })), toggle('Notification sounds', settings.notificationSounds, (value) => commit((next) => { next.notificationSounds = value }), 'Reserved for supported host audio surfaces.'), toggle('System push notifications', settings.pushNotifications, (value) => commit((next) => { next.pushNotifications = value })))
  content.appendChild(card); return page
}

function permissions(host: SettingsViewHost): HTMLDivElement {
  const { page, content } = host.page('Permissions', 'Lumiverse access'); const grid = el('div', 'lp-permission-grid'); const caps = host.capabilities
  for (const [label, granted] of [['Generation', caps?.generation], ['Model tools', caps?.tools], ['Prompt memory', caps?.interceptor], ['Gallery', caps?.images], ['Remote images', caps?.corsProxy], ['Camera', caps?.imageGen], ['Floating phone', caps?.panels], ['Characters', caps?.characters], ['Personas', caps?.personas], ['Scene sync', caps?.sceneSync], ['Push', caps?.push]] as Array<[string, unknown]>) { const cell = el('div', 'lp-permission', label); cell.dataset.granted = String(Boolean(granted)); grid.appendChild(cell) }
  const manage = button('Request or update permissions', 'lp-button'); manage.addEventListener('click', () => host.requestPermissions()); content.append(grid, manage); return page
}

function data(host: SettingsViewHost): HTMLDivElement {
  const { page, content } = host.page('Data & Backup', 'This roleplay and this device'); const card = el('section', 'lp-card lp-settings-section'); card.append(el('p', 'lp-copy', 'Exports include this roleplay phone and device preferences. Imports are validated into the current chat/character scope.'))
  const exportButton = button('Export current phone'); exportButton.addEventListener('click', () => host.send('lumiphone:export_data'))
  const importButton = button('Import into current phone'); const file = el('input'); file.type = 'file'; file.accept = 'application/json,.json'; file.hidden = true; importButton.addEventListener('click', () => file.click()); file.addEventListener('change', async () => { const selected = file.files?.[0]; if (!selected) return; try { host.send('lumiphone:import_data', { data: JSON.parse(await selected.text()) }) } catch { host.showError('That file is not valid Pocket JSON.') } finally { file.value = '' } })
  const resetCurrent = button('Reset this roleplay phone', 'lp-button lp-button-danger'); resetCurrent.addEventListener('click', () => { if (window.confirm('Reset the phone for only this chat and character?')) host.send('lumiphone:reset_current') })
  const resetAll = button('Reset all roleplay phones', 'lp-button lp-button-danger'); resetAll.addEventListener('click', () => { if (window.confirm('Delete every Pocket chat/character state? Device preferences will remain.')) host.send('lumiphone:reset_all_roleplay') })
  const resetPrefs = button('Reset device preferences', 'lp-button lp-button-danger'); resetPrefs.addEventListener('click', () => { if (window.confirm('Reset Pocket device preferences? Roleplay data will remain.')) host.send('lumiphone:reset_preferences') })
  card.append(exportButton, importButton, file, resetCurrent, resetAll, resetPrefs); content.appendChild(card); return page
}

export function renderSettingsView(host: SettingsViewHost): HTMLDivElement {
  if (!host.section) return categories(host)
  if (host.section === 'appearance') return appearance(host)
  if (host.section === 'persona') return persona(host)
  if (host.section === 'messages') return messages(host)
  if (host.section === 'generation') return generation(host)
  if (host.section === 'camera') return camera(host)
  if (host.section === 'notifications') return notifications(host)
  if (host.section === 'permissions') return permissions(host)
  if (host.section === 'data') return data(host)
  return categories(host)
}
