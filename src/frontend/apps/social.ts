import type { GalleryResult, PhoneState, PocketActivity, PocketNpcBankEntry, PocketContactGroup } from '../../types.js'
import { normalizeSocialState, SOCIAL_NAMES, socialOwner, socialHandle, socialBio, socialFollowing, socialTumblrTheme, TUMBLR_THEMES, socialAppSettings, socialCanMessage, generatedSocialHandle, SOCIAL_USERNAME_LIMITS, validSocialUsername } from '../../domain/social.js'
import type { SocialApp, SocialMutation, SocialPost, SocialAccount } from '../../domain/social.js'
import { button, el, requestId } from '../shared.js'
import { socialDirectApp } from '../../domain/social-dms.js'
import { tumblrHub, tumblrActivity, tumblrSearch, type TumblrSession } from './tumblr.js'
import { nativeFor } from '../../domain/native-apps.js'
import { messageEmotes, stickerToken } from '../../domain/sticker-packs.js'
import { discordEmoteText } from '../components/discord-emotes.js'
import type { SocialGif } from '../../domain/social-extras.js'
import { discordMessage, discordPins, discordOwnProfile, discordGradientEditor, discordExpressionPicker, gifPicker, gifMedia } from './discord-chat.js'
import { discordPeople as renderDiscordPeople, discordServerPicture } from './discord-people.js'
import { socialIcon, type SocialIconName } from '../components/social-icons.js'
import { contactAvatar } from '../../domain/contacts.js'
import { activityClock } from '../../domain/activity-clock.js'
import { socialPortrait, socialPreviewPosts, SOCIAL_PREVIEW_STORIES } from '../components/social-previews.js'
import { sectionBlock } from '../components/ui.js'
import { showPocketSheet } from '../components/ui.js'

export interface SocialSession extends TumblrSession {
  emotePack?:string; emoteQuery?:string; discordBottom?: boolean; gif?: SocialGif
  serverMenus?: Record<string, boolean>; peopleViews?: Record<string, 'members' | 'add'>; serverImage?: { id: string; url: string }
  friendGroups?: Record<string, boolean>; friendsScreen?: boolean; peopleOpen?: boolean; personDrafts?: Record<string, { name: string; bio: string }>; settingsFocus?: string
  dmDrafts?: Record<string, string>; dmScrollTop?: Record<string, number>; dmStickToBottom?: Record<string, boolean>; friendsOpen?: boolean; peopleFriendsOpen?: Record<string, boolean>
  dmOpen?: boolean; dmThreadId?: string; dmAccountId?: string; dmDraft?: string; dmBusy?: boolean; dmError?: string
  notesView?: 'comments' | 'reblogs'
  settingsOpen?: boolean
  channelsOpen?: boolean; focusChannels?: boolean; focusServerCreate?: boolean
  discussionFocus?: string; focusDiscussion?: boolean
  twitterFeed?: 'for-you' | 'following'; profileEdit?: boolean; bioDraft?: string; usernameEdit?: boolean; usernameDraft?: string; usernameFocus?: 'field' | 'button'; hidePreviews?: boolean; paletteOpen?: boolean
  photoPrompt?: string; imageRequestId?: string; imageBusy?: boolean; imageProgress?: string; imagePreview?: string
  draft?: string; title?: string; photo?: string; tags?: string; imageId?: string
  replyTo?: string; reblogOf?: string; threadId?: string; ownOnly?: boolean
  serverId?: string; channelId?: string; serverName?: string; serverTopic?: string; serverChannels?: string
  pending?: string; refreshing?: boolean; error?: string; status?: string; scrollTop?: number; focusComposer?: boolean; photosOpen?: boolean; mediaOpen?: boolean; serverOpen?: boolean; composing?: boolean; focusStart?: boolean
}
interface SocialViewHost {
  bankGroups?: PocketContactGroup[]
  npcBank?: PocketNpcBankEntry[]
  state: PhoneState; owner: string; app: SocialApp; ui: SocialSession; gallery: GalleryResult
  page(title: string, subtitle: string): { page: HTMLDivElement; content: HTMLDivElement }
  render(): void
  home?(): void
  request(input: SocialMutation | { action: 'refresh'; app: SocialApp; channelId?: string }): void
  cancel(): void
  photos(): void
  dmSend?(accountId: string, text: string, threadId?: string): void
  generateParticipants?(serverId: string): void
  generatePhoto?(prompt: string): void
  uploadPhoto?(): void
  uploadServerPicture?(serverId?: string): void
  manageStickers?():void
  searchGifs?(query:string): Promise<SocialGif[]>
  cancelPhoto?(): void
}

export function renderSocial(host: SocialViewHost): HTMLDivElement {
  const { state, app, ui, owner } = host, world = normalizeSocialState(state.social), account = socialOwner(state, owner, app)
  const { page, content } = host.page(SOCIAL_NAMES[app], app === 'discord' ? 'Your little communities' : `@${account.handle}`)
  page.classList.add('lp-social-page', `lp-social-page-${app}`); page.dataset.socialPlatform = app
  content.classList.add('lp-social', `lp-social-${app}`)
  if (app === 'discord') {
    ui.threadId = undefined; ui.reblogOf = undefined
    const preference = world.preferences?.[owner]; page.dataset.discordTheme = preference?.discordTheme || 'gray'
    const colors = preference?.discordGradient || ['#302659','#171d37']; page.style.setProperty('--discord-start', colors[0]); page.style.setProperty('--discord-end', colors[1])
  }
  if (app === 'tumblr') page.dataset.tumblrTheme = socialTumblrTheme(world, owner)
  const accountAvatar = (name: string, actorId?: string, trustedAvatarUrl?: string) => {
    const avatar = el('span', 'lp-social-avatar'); avatar.setAttribute('aria-hidden', 'true'); avatar.innerHTML = socialPortrait(name)
    const contactId = state.discoveredActors?.find(actor => actor.id === actorId)?.promotedContactId || actorId
    const contact = state.contacts.find(contact => contact.id === contactId)
    const imageUrl = trustedAvatarUrl || (actorId === state.pocketPersonaActorId ? state.pocketPersona.avatarUrl : contact ? contactAvatar(contact) : '')
    const hue = [...name].reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) % 360, 0)
    avatar.style.background = `hsl(${hue} 27% 38%)`
    if (imageUrl) { const image = el('img'); image.src = imageUrl; image.alt = ''; image.loading = 'lazy'; image.onerror = () => image.remove(); avatar.append(image) }
    return avatar
  }
  const postTimestamp = (post: SocialPost) => {
    const clock = activityClock({ presentation: { storyAt: post.createdAt, storyTimezoneOffsetMinutes: state.roleplayTimezoneOffsetMinutes } } as PocketActivity)
    if (app === 'discord') return clock.time || 'Story time'
    const elapsed = Date.parse(state.roleplayNow) - Date.parse(post.createdAt)
    if ((state.roleplayClockSource === 'manual' || state.roleplayClockPrecision === 'exact') && Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 86_400_000) {
      const minutes = Math.floor(elapsed / 60_000)
      return minutes < 1 ? 'now' : minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h`
    }
    return clock.date.split(', ').at(-1) || 'Story time'
  }
  const actionButton = (text: string, name: string, fn: () => void, className = 'lp-social-button') => {
    const node = button(text, className); if (name !== text) node.setAttribute('aria-label', name); node.dataset.socialFocus = name; node.disabled = Boolean(ui.pending); node.onclick = fn; return node
  }
  const iconAction = (kind: SocialIconName, name: string, fn: () => void, className = '') => {
    const node = actionButton('', name, fn, `lp-social-button lp-social-icon-button ${className}`); node.append(socialIcon(kind)); return node
  }
  const saveDmDraft = () => { if (ui.dmOpen && ui.dmAccountId) { ui.dmDrafts ||= {}; ui.dmDrafts[ui.dmAccountId] = ui.dmDraft || '' } }
  const leaveDm = () => { saveDmDraft(); ui.dmOpen = false; ui.dmAccountId = undefined; ui.dmThreadId = undefined; ui.dmDraft = '' }
  const openDm = (accountId: string, threadId?: string) => { saveDmDraft(); if (app === 'tumblr') { ui.tumblrView = 'activity'; ui.tumblrHubTab = 'messages' }; ui.dmOpen = true; ui.settingsOpen = false; ui.dmAccountId = accountId; ui.dmThreadId = threadId; ui.dmDraft = ui.dmDrafts?.[accountId] || ''; ui.dmError = undefined; ui.scrollTop = 0; host.render() }
  const resetNavigation = () => { leaveDm(); ui.tumblrView = undefined; ui.friendsScreen = false; ui.settingsOpen = false; ui.replyTo = undefined; ui.reblogOf = undefined; ui.threadId = undefined; ui.composing = false }
  const navigateBack = () => {
    const returnToChannels = app === 'discord' && Boolean(ui.serverOpen || ui.peopleOpen || ui.channelsOpen)
    const returnToUsername = !ui.settingsOpen && Boolean(ui.usernameEdit)
    const returnToDiscussion = !ui.settingsOpen && !ui.dmOpen && Boolean(ui.threadId || ui.replyTo) && !ui.reblogOf
    if (ui.friendsScreen) ui.friendsScreen = false
    else if (ui.settingsOpen) ui.settingsOpen = false
    else if (ui.profileEdit) ui.profileEdit = false
    else if (ui.usernameEdit) { ui.usernameEdit = false; ui.usernameFocus = 'button' }
    else if (ui.dmOpen) { if (ui.dmAccountId || ui.dmThreadId) { saveDmDraft(); ui.dmAccountId = undefined; ui.dmThreadId = undefined; ui.dmDraft = '' } else { leaveDm(); ui.tumblrView = undefined } }
    else if (ui.serverOpen || ui.peopleOpen || ui.channelsOpen) { ui.serverOpen = false; ui.peopleOpen = false; ui.channelsOpen = false; ui.focusChannels = true }
    else if (ui.threadId || ui.replyTo || ui.reblogOf) { ui.threadId = undefined; ui.replyTo = undefined; ui.reblogOf = undefined; ui.composing = false; ui.focusDiscussion = true }
    else if (ui.composing) ui.composing = false
    else if (ui.tumblrView) ui.tumblrView = undefined
    else if (ui.ownOnly) { ui.ownOnly = false; if (app === 'discord') ui.focusChannels = true }
    else return false
    ui.scrollTop = 0
    const mount = page.parentElement
    host.render()
    const discussionTarget = returnToDiscussion ? [...(mount?.querySelectorAll<HTMLElement>('[data-social-focus]') || [])].find(node => node.dataset.socialFocus === ui.discussionFocus) : undefined
    if (discussionTarget) { ui.focusDiscussion = false; discussionTarget.focus({ preventScroll: true }) }
    else mount?.querySelector<HTMLElement>(returnToUsername ? '[data-social-focus="Change username"]' : returnToChannels ? '[data-social-focus="Channels"]' : '[data-social-focus="App navigation"]')?.focus({ preventScroll: true })
    return true
  }
  const internalView = Boolean(ui.settingsOpen || ui.profileEdit || ui.usernameEdit || ui.dmOpen || ui.serverOpen || ui.peopleOpen || ui.channelsOpen || ui.threadId || ui.replyTo || ui.reblogOf || ui.composing || ui.ownOnly || ui.tumblrView)
  const backName = ui.friendsScreen ? `Back to ${SOCIAL_NAMES[app]} settings` : ui.settingsOpen ? `Close ${SOCIAL_NAMES[app]} settings` : ui.usernameEdit ? `Back to ${SOCIAL_NAMES[app]} profile` : ui.threadId && ui.tumblrView ? `Back to Tumblr ${ui.tumblrView === 'search' ? 'search' : 'activity'}` : ui.dmOpen ? (ui.dmAccountId || ui.dmThreadId ? `Back to ${SOCIAL_NAMES[app]} ${app === 'tumblr' ? 'messages' : 'inbox'}` : `Back to ${SOCIAL_NAMES[app]} feed`) : app === 'discord' ? 'Back to Discord channels' : `Back to ${SOCIAL_NAMES[app]} feed`
  page.addEventListener('keydown', event => { if (event.key === 'Escape' && navigateBack()) { event.preventDefault(); event.stopPropagation() } })
  const toolbar = el('div', 'lp-social-toolbar'), identity = el('div', 'lp-social-wordmark', app === 'twitter' ? '' : app === 'instagram' ? 'Instagram' : app === 'tumblr' ? 'tumblr' : 'Discord')
  if (app === 'twitter') { identity.append(socialIcon('bird')); identity.setAttribute('aria-label', 'Twitter') }
  const refresh = actionButton('Refresh feed now', `Refresh ${SOCIAL_NAMES[app]}`, () => { ui.settingsOpen = false; host.request({ action: 'refresh', app, channelId: ui.channelId }) }, 'lp-social-button lp-social-settings-refresh')
  const settings = el('section', 'lp-social-settings lp-settings-section'); settings.id = requestId('social_settings'); settings.setAttribute('aria-label', `${SOCIAL_NAMES[app]} settings`); settings.hidden = !ui.settingsOpen
  const gear = iconAction('settings', `${SOCIAL_NAMES[app]} settings`, () => { ui.settingsOpen = !ui.settingsOpen; ui.scrollTop = 0; host.render() }); gear.setAttribute('aria-expanded', String(Boolean(ui.settingsOpen))); gear.setAttribute('aria-controls', settings.id)
  const quickRefresh = iconAction('refresh', `Refresh ${SOCIAL_NAMES[app]}`, () => host.request({ action: 'refresh', app, channelId: ui.channelId }), 'lp-social-quick-refresh'); quickRefresh.title = 'Refresh feed'; quickRefresh.hidden = Boolean(ui.dmOpen || ui.serverOpen || ui.peopleOpen || ui.settingsOpen)
  refresh.setAttribute('aria-label', 'Refresh feed now'); refresh.dataset.socialFocus = 'Refresh feed now'
  const inbox = app === 'instagram' ? iconAction('reply', 'Instagram messages', () => { saveDmDraft(); ui.dmOpen = true; ui.settingsOpen = false; ui.dmThreadId = undefined; ui.dmAccountId = undefined; ui.dmDraft = ''; ui.scrollTop = 0; host.render() }) : undefined
  const nav = page.querySelector<HTMLElement>('.lp-nav'), navTitle = nav?.querySelector<HTMLElement>('.lp-nav-title')
  if (nav && navTitle) {
    nav.classList.add('lp-social-app-header'); navTitle.replaceChildren(identity)
    const oldBack = nav.querySelector<HTMLButtonElement>('.lp-nav-action'), oldRight = nav.querySelector('.lp-nav-action:last-child')
    if (oldRight && oldRight !== oldBack) oldRight.remove()
    if (oldBack) {
      const back = internalView || host.home ? button('', 'lp-nav-action lp-social-back') : oldBack
      if (internalView || host.home) { back.onclick = () => { if (internalView) navigateBack(); else host.home?.() }; oldBack.replaceWith(back) }
      back.disabled = false; back.setAttribute('aria-label', internalView ? backName : 'Return to Pocket home'); back.title = internalView ? backName : 'Pocket home'; back.dataset.socialFocus = 'App navigation'; back.replaceChildren(socialIcon(internalView ? 'back' : 'home')); back.classList.add('lp-social-back')
    }
    const actions = el('div', 'lp-social-header-actions'); actions.append(quickRefresh); if (inbox) actions.append(inbox); actions.append(gear); nav.append(actions)
  } else { toolbar.append(identity); const actions = el('div', 'lp-social-header-actions'); actions.append(quickRefresh); if (inbox) actions.append(inbox); actions.append(gear); toolbar.append(actions); content.append(toolbar) }
  const operation = el('div', 'lp-social-operation'), status = el('p', 'lp-social-status', ui.status || (ui.refreshing ? 'Finding new posts in your world…' : '')); status.setAttribute('role', 'status')
  operation.hidden = ((app === 'instagram' || app === 'tumblr') && Boolean(ui.dmOpen && !ui.settingsOpen && !ui.refreshing)) || (app === 'tumblr' && Boolean(ui.tumblrView || ui.ownOnly) && !ui.refreshing)
  const stop = button('Stop', 'lp-social-button lp-social-stop'); stop.setAttribute('aria-label', `Stop refreshing ${SOCIAL_NAMES[app]}`); stop.onclick = host.cancel; stop.hidden = !ui.refreshing; operation.append(status, stop); page.insertBefore(operation, content)
  if (ui.error) { const error = el('p', 'lp-social-error', ui.error); error.setAttribute('role', 'alert'); content.append(error) }
  settings.append(el('h2', '', `${SOCIAL_NAMES[app]} settings`), refresh, el('p', 'lp-copy', 'Choose when your feed updates. Each app keeps its own schedule.'))
  const savedSettings = socialAppSettings(world, owner, app)
  const scheduleSection = sectionBlock('Feed updates', 'Choose when new posts arrive.'); const generationSection = sectionBlock('Generation', 'Photos and guest authors'); const peopleSection = sectionBlock(app === 'discord' ? 'Server participants' : 'People', app === 'discord' ? 'Each server keeps its own participant bank.' : 'Friends, characters, and portable casts'); settings.append(scheduleSection.section, generationSection.section, peopleSection.section)
  const modeField = el('label', 'lp-field lp-social-field lp-social-setting-field'), mode = el('select', 'lp-select'); modeField.append(el('span', '', 'Feed refresh'), mode)
  for (const [value, label] of [['manual', 'Manual'], ['turn', 'After each turn'], ['timer', 'Automatic']] as const) { const option = el('option', '', label); option.value = value; option.selected = savedSettings.refreshMode === value; mode.append(option) }
  mode.disabled = Boolean(ui.pending); mode.dataset.socialFocus = 'Feed refresh'; mode.onchange = () => { ui.settingsFocus = 'Feed refresh'; host.request({ action: 'settings', app, refreshMode: mode.value as 'manual' | 'turn' | 'timer' }) }; scheduleSection.body.append(modeField)
  if (savedSettings.refreshMode === 'timer') {
    const intervalField = el('label', 'lp-field lp-social-field lp-social-setting-field'), interval = el('input', 'lp-input'); intervalField.append(el('span', '', 'Refresh interval (minutes)'), interval); interval.type = 'number'; interval.min = '1'; interval.max = '120'; interval.step = '1'; interval.value = String(savedSettings.refreshIntervalMinutes); interval.disabled = Boolean(ui.pending); interval.dataset.socialFocus = 'Refresh interval (minutes)'; interval.onchange = () => { const value = Math.min(120, Math.max(1, Math.round(Number(interval.value) || 5))); ui.settingsFocus = 'Refresh interval (minutes)'; host.request({ action: 'settings', app, refreshIntervalMinutes: value }) }; scheduleSection.body.append(intervalField)
  }
  for (const [key, label] of [['generateImages', 'Generate feed photos'], ['randomCards', 'Allow installed character cards to post']] as const) {
    if (app === 'discord' && key === 'randomCards') continue
    const field = el('label', 'lp-card lp-control-row lp-social-settings-toggle'), input = el('input'); input.type = 'checkbox'; input.checked = savedSettings[key]; input.disabled = Boolean(ui.pending); input.dataset.socialFocus = label; input.onchange = () => { ui.settingsFocus = label; host.request({ action: 'settings', app, [key]: input.checked }) }; field.append(el('span', 'lp-control-label', label), input); generationSection.body.append(field)
  }
  if (app === 'discord') {
    const appearance = sectionBlock('Appearance', 'Choose a home for your conversations.'), label = el('label', 'lp-field'), select = el('select', 'lp-select')
    label.append(el('span', '', 'Discord theme'), select)
    for (const [value, title] of [['gray', 'Discord gray'], ['amoled', 'AMOLED'], ['gradient', 'Custom gradient']] as const) { const option = el('option', '', title); option.value = value; option.selected = (world.preferences?.[owner]?.discordTheme || 'gray') === value; select.append(option) }
    select.disabled = Boolean(ui.pending); select.dataset.socialFocus = 'Discord theme'; select.onchange = () => { ui.settingsFocus = 'Discord theme'; host.request({ action: 'preferences', app, discordTheme: select.value as 'gray'|'amoled'|'gradient' }) }; appearance.body.append(label)
    if (world.preferences?.[owner]?.discordTheme === 'gradient') { const customize = actionButton('Edit theme gradient', 'Edit Discord theme gradient', () => discordGradientEditor(customize, world.preferences?.[owner]?.discordGradient || ['#302659','#171d37'], colors => { ui.settingsFocus = 'Edit Discord theme gradient'; host.request({ action: 'preferences', app, discordTheme: 'gradient', gradient: colors }) }, 'Discord theme gradient')); appearance.body.append(customize) }
    settings.insertBefore(appearance.section, scheduleSection.section)
  }
  const friends = el('div', 'lp-social-friend-picker')
  const friendGroup = (key: string, title: string, count: number, defaultOpen = true) => {
    const group = el('details', 'lp-social-friends-group'), summary = el('summary'), body = el('div', 'lp-social-friends-group-body')
    summary.append(el('span', '', title), el('span', 'lp-social-group-count', String(count))); group.append(summary, body)
    group.dataset.friendGroup = key
    group.open = ui.friendGroups?.[key] ?? defaultOpen
    summary.onclick = () => { ui.friendGroups ||= {}; ui.friendGroups[key] = !group.open }
    friends.append(group); return body
  }
  if (host.bankGroups?.length) {
    const casts = friendGroup('casts', 'Portable casts', host.bankGroups.length)
    for (const cast of host.bankGroups) casts.append(actionButton(`Add ${cast.name} · ${cast.memberIds.length} people`, `Add portable cast ${cast.name}`, () => host.request({ action: 'settings', app, friendEntryIds: [...new Set([...savedSettings.friendEntryIds, ...cast.memberIds])].slice(0,24) }), 'lp-social-cast-choice'))
  }
  const contacts = state.contacts.filter(contact => contact.id !== owner)
  if (contacts.length) {
    const characters = friendGroup('characters', 'Characters', contacts.length)
    for (const contact of contacts) {
      const id = `actor:${contact.id}`, field = el('label', 'lp-social-friend-row'), input = el('input'); input.type = 'checkbox'; input.checked = savedSettings.friendEntryIds.includes(id); input.disabled = Boolean(ui.pending); input.setAttribute('aria-label', `Include ${contact.name} from Characters`)
      input.onchange = () => { const selected = new Set(savedSettings.friendEntryIds); input.checked ? selected.add(id) : selected.delete(id); host.request({ action: 'settings', app, friendEntryIds: [...selected] }) }
      field.append(accountAvatar(contact.name, contact.id), el('strong', 'lp-social-friend-identity', contact.name), input); characters.append(field)
    }
  }
  const bank = friendGroup('bank', 'NPC Bank', host.npcBank?.length || 0, (host.npcBank?.length || 0) <= 6)
  if (!host.npcBank?.length) bank.append(el('p', 'lp-copy', 'Save people in NPC Bank to invite them into this app.'))
  for (const entry of host.npcBank || []) {
    const field = el('label', 'lp-social-friend-row'), input = el('input'); input.type = 'checkbox'; input.checked = savedSettings.friendEntryIds.includes(entry.id); input.disabled = Boolean(ui.pending); input.dataset.socialFocus = `Friend ${entry.id}`; input.setAttribute('aria-label', `Include ${entry.name} from NPC Bank`)
    input.onchange = () => { const selected = new Set(savedSettings.friendEntryIds); input.checked ? selected.add(entry.id) : selected.delete(entry.id); ui.settingsFocus = `Friend ${entry.id}`; host.request({ action: 'settings', app, friendEntryIds: [...selected] }) }
    const identity = el('span', 'lp-social-friend-identity'); identity.append(el('strong', '', entry.name)); if (entry.role) identity.append(el('small', '', entry.role)); field.append(accountAvatar(entry.name, undefined, entry.avatarUrl), identity, input); bank.append(field)
  }
  if (app === 'discord') {
    for (const server of world.servers.filter(server => server.memberActorIds.includes(owner))) peopleSection.body.append(actionButton(`People in ${server.name}`, `Manage people in ${server.name}`, () => { ui.serverId = server.id; ui.channelId = server.channels[0]?.id; ui.ownOnly = false; ui.settingsOpen = false; ui.peopleOpen = true; ui.channelsOpen = false; ui.serverOpen = false; ui.scrollTop = 0; host.render() }, 'lp-button lp-button-quiet'))
    if (!world.servers.some(server => server.memberActorIds.includes(owner))) peopleSection.body.append(el('p', 'lp-copy', 'Create a server to choose its participants.'))
  } else {
    const peopleButton = actionButton('Friends & casts', 'Choose friends and portable casts', () => { ui.friendsScreen = true; ui.scrollTop = 0; host.render() }, 'lp-button lp-button-quiet'); peopleSection.body.append(peopleButton)
  }
  const servers = world.servers.filter(server => server.memberActorIds.includes(owner))
  let discordPeople: HTMLElement | undefined, discordPanel: HTMLElement | undefined, discordCreation: HTMLElement | undefined, discordRail: HTMLElement | undefined, discordHeader: HTMLElement | undefined, channelsToggle: HTMLButtonElement | undefined, serverNameInput: HTMLInputElement | undefined
  if (app === 'discord') {
    const server = servers.find(server => server.id === ui.serverId) || servers[0]
    ui.serverId = server?.id
    const panel = el('section', 'lp-discord-channel-panel'); panel.id = requestId('social_channels'); panel.setAttribute('aria-label', 'Server channels'); discordPanel = panel
    const rail = el('nav', 'lp-discord-server-rail'); rail.setAttribute('aria-label', 'Discord servers'); discordRail = rail
    for (const item of servers) { const control = actionButton(item.name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(), `Open server ${item.name}`, () => { ui.serverId = item.id; ui.channelId = undefined; ui.ownOnly = false; ui.usernameEdit = false; ui.profileEdit = false; ui.serverOpen = false; ui.settingsOpen = false; ui.peopleOpen = false; ui.channelsOpen = true; host.render() }, 'lp-discord-server'); control.setAttribute('aria-pressed', String(item.id === server?.id)); control.title = item.name; if (item.imageUrl) { const image = el('img'); image.src = item.imageUrl; image.alt = ''; control.replaceChildren(image) }; rail.append(control) }
    rail.append(iconAction('plus', 'Create a Discord server', () => { ui.ownOnly = false; ui.usernameEdit = false; ui.profileEdit = false; ui.channelsOpen = false; ui.peopleOpen = false; ui.serverOpen = true; ui.focusServerCreate = true; host.render() }, 'lp-discord-server lp-discord-add-server'))
    const profileButton = actionButton('', 'Discord profile', () => { resetNavigation(); ui.ownOnly = true; ui.serverOpen = false; ui.peopleOpen = false; ui.channelsOpen = false; ui.scrollTop = 0; host.render() }, 'lp-discord-server lp-discord-profile-launch')
    profileButton.append(accountAvatar(account.name, account.actorId)); profileButton.title = 'Your Discord profile'; profileButton.setAttribute('aria-pressed', String(Boolean(ui.ownOnly))); rail.append(profileButton)
    const selected = server?.channels.find(channel => channel.id === ui.channelId) || server?.channels[0]; ui.channelId = selected?.id
    refresh.disabled ||= !selected || Boolean(ui.serverOpen); quickRefresh.disabled ||= !selected || Boolean(ui.serverOpen)
    const channelHeading = el('header', 'lp-discord-channel-heading'); discordHeader = channelHeading
    const renderChannelNavigation = () => {
      const mount = page.parentElement
      ui.focusChannels = false
      host.render()
      // Keep fast Enter/Escape sequences inside the replacement phone view.
      mount?.querySelector<HTMLElement>('[data-social-focus="Channels"]')?.focus({ preventScroll: true })
    }
    channelsToggle = iconAction(ui.peopleOpen ? 'back' : 'channels', ui.peopleOpen ? 'Back to server channels' : ui.channelsOpen ? 'Hide channels' : 'Show channels', () => { ui.channelsOpen = !ui.channelsOpen; ui.peopleOpen = false; ui.serverOpen = false; renderChannelNavigation() })
    channelsToggle.disabled = false
    channelsToggle.dataset.socialFocus = 'Channels'; channelsToggle.setAttribute('aria-expanded', String(Boolean(ui.channelsOpen))); channelsToggle.setAttribute('aria-controls', panel.id)
    const pins = button('', 'lp-social-button lp-social-icon-button lp-discord-pins-open'); pins.append(socialIcon('pin')); pins.setAttribute('aria-label', 'Pinned messages'); pins.setAttribute('aria-haspopup', 'dialog'); pins.onclick = () => discordPins(pins, world.posts.filter(post => post.app === 'discord' && post.channelId === ui.channelId), id => { const target = [...page.querySelectorAll<HTMLElement>('[data-social-post]')].find(node => node.dataset.socialPost === id); target?.scrollIntoView({ block: 'center' }); target?.focus({ preventScroll: true }) })
    pins.hidden = Boolean(ui.peopleOpen || ui.serverOpen)
    channelHeading.append(channelsToggle, el('strong', '', ui.peopleOpen && server ? server.name : selected ? `# ${selected.name}` : 'Your servers'), pins)
    panel.hidden = Boolean(!ui.channelsOpen || ui.serverOpen || ui.peopleOpen)
    if (server) {
      const menu = el('div', 'lp-discord-server-menu'), menuBody = el('div', 'lp-discord-server-menu-body'), menuId = requestId('discord_server_menu'), menuOpen = Boolean(ui.serverMenus?.[server.id])
      const menuToggle = button('', 'lp-discord-server-menu-toggle'), name = el('strong', '', server.name), picture = el('span', 'lp-discord-server-menu-picture', server.name.slice(0, 2).toUpperCase())
      picture.setAttribute('aria-hidden', 'true'); if (server.imageUrl) { const image = el('img'); image.src = server.imageUrl; image.alt = ''; picture.replaceChildren(image) }
      menuToggle.append(picture, name, socialIcon('chevron')); menuToggle.setAttribute('aria-label', server.name + ' server menu'); menuToggle.setAttribute('aria-expanded', String(menuOpen)); menuToggle.setAttribute('aria-controls', menuId); menuToggle.dataset.socialFocus = 'Server menu'
      const setMenu = (open:boolean) => { ui.serverMenus ||= {}; ui.serverMenus[server.id] = open; const mount = page.parentElement; host.render(); mount?.querySelector<HTMLElement>('[data-social-focus="Server menu"]')?.focus({preventScroll:true}) }
      menuToggle.onclick = () => setMenu(!menuOpen)
      menu.onkeydown = event => { if(event.key === 'Escape' && menuOpen) { event.preventDefault(); event.stopPropagation(); setMenu(false) } }
      menuBody.id = menuId; menuBody.hidden = !menuOpen
      menuBody.append(discordServerPicture({name:server.name,url:server.imageUrl,ui,upload:()=>host.uploadServerPicture?.(server.id),cancel:host.cancelPhoto}), actionButton('People', `People in ${server.name}`, () => { ui.serverMenus ||= {}; ui.serverMenus[server.id] = false; ui.peopleOpen = true; ui.channelsOpen = false; ui.serverOpen = false; ui.scrollTop = 0; host.render() }, 'lp-discord-menu-people'))
      menu.append(menuToggle, menuBody)
      const channels = el('div', 'lp-social-channels'); channels.setAttribute('role', 'group'); channels.setAttribute('aria-label', `${server.name} channels`)
      for (const channel of server.channels) { const control = actionButton(`# ${channel.name}`, `Open ${server.name} channel ${channel.name}`, () => { ui.serverMenus ||= {}; ui.serverMenus[server.id] = false; ui.channelId = channel.id; ui.replyTo = undefined; ui.channelsOpen = false; ui.focusChannels = true; ui.scrollTop = 0; host.render() }); control.setAttribute('aria-pressed', String(channel.id === selected?.id)); channels.append(control) }
      panel.append(menu)
      const menuError = content.querySelector<HTMLElement>('.lp-social-error'); if (menuError && ui.channelsOpen) panel.append(menuError)
      panel.append(el('span', 'lp-discord-channel-label', 'TEXT CHANNELS'), channels)
      if (server.description || selected?.topic) panel.append(el('p', 'lp-copy', selected?.topic || server.description))

    }
    if (!server) panel.append(el('p', 'lp-copy', 'No servers yet. Use + in the server rail to create your first community.'))
    const create = el('section', 'lp-discord-server-create'); create.setAttribute('aria-label', 'Create a Discord server'); discordCreation = create
    create.hidden = !ui.serverOpen
    if (!nav) create.append(actionButton('Back to channels', 'Back to Discord channels', () => { ui.serverOpen = false; ui.focusChannels = true; host.render() }))
    create.append(el('h2', '', 'Create your server'), el('p', 'lp-copy', 'Give your community a name and a few places to talk.'))
    const form = el('form', 'lp-social-compose'); form.setAttribute('aria-label', 'Create Discord server form')
    for (const [key, label, placeholder] of [['serverName', 'Server name', 'The midnight club'], ['serverTopic', 'What is it about?', 'A place for…'], ['serverChannels', 'Channels, separated by commas', 'general, off-topic, pictures']] as const) {
      const field = el('label', 'lp-social-field'), input = el('input', 'lp-input'); field.append(el('span', '', label), input); input.value = ui[key] || ''; input.placeholder = placeholder; input.maxLength = key === 'serverName' ? 80 : 240; input.required = key !== 'serverTopic'; input.disabled = Boolean(ui.pending); input.oninput = () => { ui[key] = input.value }; input.dataset.socialFocus = key; if (key === 'serverName') serverNameInput = input; form.append(field)
    }
    const submit = button('Create server', 'lp-social-button'); submit.type = 'submit'; submit.disabled = Boolean(ui.pending || ui.imageBusy)
    form.onsubmit = event => { event.preventDefault(); host.request({ action: 'server', app, imageId: ui.serverImage?.id, name: ui.serverName, text: ui.serverTopic, channels: (ui.serverChannels || '').split(',').map(name => name.trim()).filter(Boolean) }) }
    form.append(submit); create.append(discordServerPicture({ name: 'new server', url: ui.serverImage?.url, ui, upload: () => host.uploadServerPicture?.(), cancel: host.cancelPhoto }), form)
    const people = server ? renderDiscordPeople({
      server, ui, contacts, bank: host.npcBank || [], casts: host.bankGroups || [], avatar: accountAvatar,
      render: host.render, request: host.request, generate: host.generateParticipants ? () => host.generateParticipants!(server.id) : undefined,
      upload: () => host.uploadServerPicture?.(server.id), cancelUpload: host.cancelPhoto,
    }) : el('section', 'lp-discord-people')
    discordPeople = people; people.hidden = !ui.peopleOpen
  } else {
    const filters = el('div', 'lp-social-filters'); filters.hidden = Boolean(ui.ownOnly); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', `${SOCIAL_NAMES[app]} feed`)
    for (const [second, label] of [[false, app === 'tumblr' ? 'Dashboard' : app === 'twitter' ? 'For you' : 'Feed'], [true, app === 'tumblr' ? 'Your blog' : app === 'twitter' ? 'Following' : 'Your posts']] as const) {
      const selected = app === 'twitter' ? (ui.twitterFeed === 'following') === second : Boolean(ui.ownOnly) === second
      const control = actionButton(label, label, () => { if (app === 'twitter') { ui.twitterFeed = second ? 'following' : 'for-you'; ui.ownOnly = false } else ui.ownOnly = second; ui.threadId = undefined; ui.scrollTop = 0; host.render() }); control.setAttribute('aria-pressed', String(selected)); filters.append(control)
    }
    filters.hidden = Boolean(ui.ownOnly || ui.threadId || ui.replyTo || ui.reblogOf || ui.dmOpen || ui.tumblrView); content.append(filters)
  }
  const actualPlatformPosts = world.posts.filter(post => post.app === app && (app !== 'discord' || post.channelId === ui.channelId))
  const showingPreviews = app !== 'discord' && !actualPlatformPosts.length && !ui.hidePreviews
  const platformPosts = showingPreviews ? socialPreviewPosts(app) : actualPlatformPosts
  const following = socialFollowing(world, owner, app)
  if (app === 'tumblr') {
    const palette = el('details', 'lp-tumblr-palettes'), summary = el('summary', '', 'Palette'); palette.open = Boolean(ui.paletteOpen); summary.onclick = () => { ui.paletteOpen = !palette.open }
    const options = el('div', 'lp-tumblr-palette-options'); options.setAttribute('role', 'group'); options.setAttribute('aria-label', 'Tumblr palette')
    const names = { 'goth-rave': 'Goth Rave', 'true-blue': 'True Blue', 'dark-mode': 'Dark Mode', pride: 'Pride' }
    for (const theme of TUMBLR_THEMES) { const choice = actionButton(names[theme], names[theme], () => host.request({ action: 'preferences', app, theme })); choice.dataset.palette = theme; choice.setAttribute('aria-pressed', String(socialTumblrTheme(world, owner) === theme)); options.append(choice) }
    const appearance = sectionBlock('Appearance', 'Choose your Tumblr palette.'); appearance.body.append(options); settings.append(appearance.section)
  }
  if (showingPreviews && !ui.ownOnly) {
    const notice = el('div', 'lp-social-preview-notice'); notice.append(el('span', '', 'Sample posts · a local preview, outside your roleplay'), actionButton('Hide', 'Hide sample posts', () => { ui.hidePreviews = true; ui.threadId = undefined; host.render() })); content.append(notice)
    if (app === 'instagram') {
      const stories = el('section', 'lp-instagram-stories'); stories.setAttribute('aria-label', 'Sample Instagram stories')
      for (const story of SOCIAL_PREVIEW_STORIES) {
        const open = actionButton('', `Preview story by ${story.name}`, () => {
          const preview = el('div', 'lp-social-story-viewer'), image = el('img'); image.src = story.image; image.alt = story.caption
          preview.append(el('span', 'lp-social-preview-label', 'Sample story · not part of your roleplay'), image, el('strong', '', `@${story.handle}`), el('p', '', story.caption))
          showPocketSheet(open, `Preview story by ${story.name}`, preview)
          preview.closest('dialog')?.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation() })
        }, 'lp-instagram-story'); open.append(accountAvatar(story.name), el('span', '', story.name)); stories.append(open)
      }
      content.append(stories)
    }
  }
  if (ui.ownOnly) {
    const profile = el('section', `lp-social-profile lp-${app}-profile`); profile.setAttribute('aria-label', `Your ${SOCIAL_NAMES[app]} profile`); profile.hidden = Boolean(ui.settingsOpen)
    if (app === 'twitter' || app === 'tumblr') { const banner = el('div', 'lp-social-profile-banner'); banner.setAttribute('role', 'img'); banner.setAttribute('aria-label', 'Profile banner · phone wallpaper'); profile.append(banner) }
    const profileHead = el('div', 'lp-social-profile-head'), profileIdentity = el('div', 'lp-social-profile-identity')
    profileIdentity.append(el('strong', '', account.name), el('span', 'lp-social-profile-handle', `@${account.handle}`))
    const postCount = actualPlatformPosts.filter(post => post.account.actorId === owner && !post.replyTo).length
    profileHead.append(accountAvatar(account.name, account.actorId), profileIdentity)
    if (app === 'instagram') {
      const stats = el('div', 'lp-instagram-profile-stats')
      for (const [value, label] of [[postCount, 'posts'], [following.length, 'following']] as const) { const stat = el('div'); stat.append(el('strong', '', String(value)), el('span', '', label)); stats.append(stat) }
      profileHead.append(stats)
    } else profileIdentity.append(el('span', 'lp-social-profile-count', `${postCount} ${postCount === 1 ? 'post' : 'posts'}`))
    profile.append(profileHead)
    if (app === 'tumblr') profile.append(el('h2', 'lp-tumblr-blog-title', `${account.name}’s corner of the internet`))
    profile.append(el('p', 'lp-social-bio', socialBio(state, owner) || 'A little space for a bio.'), actionButton('Edit bio', 'Edit bio', () => { ui.profileEdit = !ui.profileEdit; ui.usernameEdit = false; ui.bioDraft ??= socialBio(state, owner); host.render() }, 'lp-social-button lp-social-edit-profile'))
    if (ui.profileEdit) { const form = el('form', 'lp-social-bio-form'), label = el('label', 'lp-social-field'), bio = el('textarea', 'lp-input'); label.append(el('span', '', 'Bio'), bio); bio.value = ui.bioDraft ?? socialBio(state, owner); bio.maxLength = 280; bio.rows = 3; bio.disabled = Boolean(ui.pending); bio.oninput = () => { ui.bioDraft = bio.value }; bio.dataset.socialFocus = 'Bio'; const save = button('Save bio', 'lp-social-primary'); save.type = 'submit'; save.disabled = Boolean(ui.pending); form.onsubmit = event => { event.preventDefault(); host.request({ action: 'profile', app, bio: bio.value }) }; form.append(label, save); profile.append(form) }
    const changeUsername = actionButton('Change username', 'Change username', () => { ui.usernameEdit = !ui.usernameEdit; ui.profileEdit = false; ui.usernameDraft ??= account.handle; ui.usernameFocus = ui.usernameEdit ? 'field' : 'button'; host.render() }, 'lp-social-button lp-social-edit-profile')
    const usernameFormId = requestId('social_username')
    changeUsername.setAttribute('aria-expanded', String(Boolean(ui.usernameEdit))); changeUsername.setAttribute('aria-controls', usernameFormId); profile.append(changeUsername)
    const usernameForm = el('form', 'lp-social-bio-form lp-social-username-form'); usernameForm.id = usernameFormId; usernameForm.hidden = !ui.usernameEdit; usernameForm.setAttribute('aria-label', `Change ${SOCIAL_NAMES[app]} username`)
    const usernameLabel = el('label', 'lp-social-field'), username = el('input', 'lp-input'), hint = el('p', 'lp-social-username-hint', `Your username on ${SOCIAL_NAMES[app]}. ${app === 'twitter' ? 'Letters, numbers and underscores' : app === 'tumblr' ? 'Letters, numbers and hyphens' : 'Letters, numbers, underscores and periods'}; ${app === 'discord' ? '2–32' : `up to ${SOCIAL_USERNAME_LIMITS[app]}`} characters.`)
    hint.id = requestId('social_username_hint'); username.setAttribute('aria-describedby', hint.id); username.value = ui.usernameDraft ?? account.handle; username.maxLength = SOCIAL_USERNAME_LIMITS[app] + 1; username.required = true; username.minLength = app === 'discord' ? 2 : 1; username.autocomplete = 'off'; username.autocapitalize = 'none'; username.spellcheck = false; username.disabled = Boolean(ui.pending); username.dataset.socialFocus = 'Username'
    const saveUsername = button('Save username', 'lp-social-primary'); saveUsername.type = 'submit'; saveUsername.disabled = Boolean(ui.pending) || !validSocialUsername(app, username.value.trim().replace(/^@/, '').toLowerCase())
    username.oninput = () => { ui.usernameDraft = username.value; saveUsername.disabled = Boolean(ui.pending) || !validSocialUsername(app, username.value.trim().replace(/^@/, '').toLowerCase()) }
    usernameLabel.append(el('span', '', 'Username'), username); usernameForm.append(usernameLabel, hint, saveUsername)
    usernameForm.onsubmit = event => { event.preventDefault(); if (!saveUsername.disabled) host.request({ action: 'profile', app, username: username.value }) }; profile.append(usernameForm)
    if (app === 'discord') discordOwnProfile(profile, state, owner, account, world, input => { ui.discussionFocus = 'Discord profile gradient'; ui.focusDiscussion = true; host.request(input) })
    content.append(profile)
  }
  const rootOf = (post: SocialPost): SocialPost => {
    const parent = platformPosts.find(item => item.id === (post.replyTo || (app === 'tumblr' ? post.reblogOf : undefined)))
    return parent ? rootOf(parent) : post
  }
  const threadPost = platformPosts.find(post => post.id === ui.threadId), thread = threadPost ? rootOf(threadPost) : undefined
  if (thread && !nav) content.append(actionButton('Back to feed', 'Back to social feed', () => { navigateBack() }))
  if (thread) { page.dataset.socialDiscussion = 'true'; const heading = el('h2', 'lp-social-discussion-heading', app === 'twitter' ? 'Post' : app === 'instagram' ? 'Comments' : 'Notes'); content.append(heading) }
  let notesTabs: HTMLElement | undefined
  if (thread && app === 'tumblr') {
    const tabs = el('div', 'lp-tumblr-notes-tabs'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Tumblr notes')
    for (const [mode, label] of [['comments', 'Comments'], ['reblogs', 'Reblogs']] as const) { const tab = actionButton(label, label, () => { ui.notesView = mode; ui.scrollTop = 0; host.render() }); tab.setAttribute('aria-pressed', String((ui.notesView || 'comments') === mode)); tabs.append(tab) }
    notesTabs = tabs
  }
  const reply = platformPosts.find(post => post.id === ui.replyTo), reblog = platformPosts.find(post => post.id === ui.reblogOf)
  const compose = el('form', 'lp-social-compose'); compose.setAttribute('aria-label', `${SOCIAL_NAMES[app]} composer`)
  const composerTitle = el('div', 'lp-social-compose-title', reply ? `${app === 'tumblr' ? 'Commenting on' : 'Replying to'} @${reply.account.handle}` : reblog ? `${app === 'twitter' ? 'Quoting' : 'Reblogging'} @${reblog.account.handle}` : `Posting as ${account.name}`)
  if (reblog) {
    const original = reply || reblog!, context = el('blockquote', 'lp-social-compose-context'); context.setAttribute('aria-label', `${reply ? 'Reply to' : app === 'twitter' ? 'Quote Tweet' : 'Reblog'} @${original.account.handle}`)
    context.append(el('strong', '', `@${original.account.handle}`), el('p', '', original.text || original.photo || original.title || 'Photo post')); compose.append(context)
  }
  compose.append(composerTitle)
  if (reblog) compose.append(actionButton('Cancel', 'Cancel social reply or reblog', () => { ui.replyTo = undefined; ui.reblogOf = undefined; host.render() }))
  if (reply) { compose.classList.add('lp-social-reply-compose', `lp-${app}-reply-compose`); compose.prepend(accountAvatar(account.name, account.actorId)); composerTitle.append(actionButton('Cancel', 'Cancel reply', () => { ui.replyTo = undefined; ui.composing = false; host.render() }, 'lp-social-reply-cancel')) }
  if (app === 'tumblr' && !reply) {
    const titleLabel = el('label', 'lp-social-field lp-social-post-title-field'), title = el('input', 'lp-input'); titleLabel.append(el('span', '', 'Title (optional)'), title); title.placeholder = 'Title'; title.value = ui.title || ''; title.maxLength = 160; title.disabled = Boolean(ui.pending); title.oninput = () => { ui.title = title.value }; title.dataset.socialFocus = 'Post title'; compose.append(titleLabel)
  }
  const textLabel = el('label', 'lp-social-field lp-social-post-text-field'), text = el('textarea', 'lp-input')
  textLabel.append(el('span', '', reply ? app === 'tumblr' ? 'Your comment' : 'Your reply' : app === 'instagram' ? 'Caption' : app === 'discord' ? 'Message' : 'Your post'), text)
  text.value = ui.draft || ''; text.rows = reply ? (app === 'twitter' ? 2 : 1) : app === 'tumblr' ? 4 : 2; text.maxLength = app === 'twitter' ? 280 : 6000; text.placeholder = reply ? app === 'tumblr' ? 'Add a comment' : 'Post your reply' : reblog && app === 'twitter' ? 'Add a comment' : app === 'twitter' ? 'What’s happening in your world?' : app === 'tumblr' ? 'Go on. Make a little post.' : app === 'discord' ? 'Say something to the channel…' : 'A little moment, a little caption…'; text.dataset.socialFocus = 'Social composer'; text.disabled = Boolean(ui.pending)
  const footer = el('div', 'lp-social-compose-footer'), count = el('span', 'lp-social-count', `${text.value.length}/${text.maxLength}`), submit = button(app === 'discord' ? 'Send' : reply ? app === 'tumblr' ? 'Comment' : app === 'instagram' ? 'Post' : 'Reply' : reblog ? app === 'twitter' ? 'Quote' : 'Reblog' : 'Post', 'lp-social-primary'); submit.type = 'submit'
  let updateEmotePreview=()=>{}
  let updatePhotoTools = () => {}
  const updateSubmit = () => { count.textContent = `${text.value.length}/${text.maxLength}`; submit.disabled = Boolean(ui.pending || ui.imageBusy) || (app === 'discord' && !ui.channelId) || !(text.value.trim() || ui.photo?.trim() || ui.imageId || ui.gif || reblog); if (app === 'instagram' && !reply && !reblog && !ui.imageId && !ui.photo?.trim()) submit.disabled = true; updatePhotoTools() }
  text.oninput = () => { ui.draft = text.value; updateSubmit(); updateEmotePreview() }
  compose.append(textLabel)
  if (app !== 'discord' && !reply) {
    const media = el('details', 'lp-social-media'), summary = el('summary', '', ui.imageId ? 'Photo attached' : 'Add a photo or description'); media.open = Boolean(ui.mediaOpen || ui.photosOpen || ui.photo || ui.imageId); summary.onclick = () => { ui.mediaOpen = !media.open }
    const field = el('label', 'lp-social-field'), photo = el('textarea', 'lp-input'); field.append(el('span', '', 'Photo description (optional)'), photo); photo.value = ui.photo || ''; photo.maxLength = 1000; photo.rows = 2; photo.disabled = Boolean(ui.pending); photo.oninput = () => { ui.photo = photo.value; updateSubmit() }; photo.dataset.socialFocus = 'Photo description'
    media.append(summary, field)
    const promptLabel = el('label', 'lp-social-field'), prompt = el('textarea', 'lp-input'); promptLabel.append(el('span', '', 'Photo prompt'), prompt); prompt.value = ui.photoPrompt || ''; prompt.rows = 2; prompt.maxLength = 2000; prompt.placeholder = 'Describe the photo you want to make…'; prompt.dataset.socialFocus = 'Photo prompt'; prompt.oninput = () => { ui.photoPrompt = prompt.value; updatePhotoTools() }
    const tools = el('div', 'lp-social-photo-tools'), generate = actionButton('Generate photo', 'Generate photo', () => host.generatePhoto?.(prompt.value.trim() || ui.photo?.trim() || ui.draft?.trim() || ''))
    updatePhotoTools = () => { generate.disabled = Boolean(ui.pending || ui.imageBusy) || !host.generatePhoto || !(prompt.value.trim() || ui.photo?.trim() || ui.draft?.trim()) }; updatePhotoTools()
    const upload = actionButton('Upload photo', 'Upload photo', () => host.uploadPhoto?.()); upload.disabled ||= !host.uploadPhoto || Boolean(ui.imageBusy); tools.append(generate, upload)
    if (ui.imageBusy) { const cancel = button('Cancel photo operation', 'lp-social-button'); cancel.onclick = () => host.cancelPhoto?.(); tools.append(cancel) }
    media.append(promptLabel, tools)
    if (ui.imageProgress) { const progress = el('p', 'lp-social-image-progress', ui.imageProgress); progress.setAttribute('role', 'status'); media.append(progress) }
    if (ui.imagePreview) { const preview = el('img', 'lp-social-attachment-preview'); preview.src = ui.imagePreview; preview.alt = 'Attached photo preview'; media.append(preview) }
    const gallery = actionButton('Choose from Gallery', 'Choose social photo from Gallery', () => { ui.photosOpen = true; host.photos() }); gallery.disabled ||= Boolean(ui.imageBusy); media.append(gallery)
    if (ui.photosOpen) {
      const photos = el('div', 'lp-social-photo-picker'); photos.setAttribute('role', 'group'); photos.setAttribute('aria-label', 'Gallery photos for this post')
      for (const image of host.gallery.data) {
        const choose = actionButton('', `Attach ${image.filename || image.id}`, () => { ui.imageId = image.id; ui.imagePreview = image.fullUrl || image.url || image.thumbnailUrl; ui.imageProgress = undefined; host.render() })
        choose.disabled ||= Boolean(ui.imageBusy); choose.setAttribute('aria-pressed', String(ui.imageId === image.id)); const preview = el('img'); preview.src = image.thumbnailUrl || image.url; preview.alt = ''; preview.loading = 'lazy'; choose.append(preview); photos.append(choose)
      }
      if (!host.gallery.data.length) photos.append(el('p', 'lp-copy', 'No Gallery photos loaded. You can describe the photo, or take one in Camera first.'))
      media.append(photos)
    }
    if (ui.imageId) { const remove = actionButton('Remove photo', 'Remove attached social photo', () => { ui.imageId = undefined; ui.imagePreview = undefined; ui.imageProgress = undefined; host.render() }); remove.disabled ||= Boolean(ui.imageBusy); media.append(remove) }
    if (app === 'instagram') compose.prepend(media); else compose.append(media)
    const tagLabel = el('label', 'lp-social-field lp-social-post-tags-field'), tags = el('input', 'lp-input'); tagLabel.append(el('span', '', 'Tags, separated by commas'), tags); tags.placeholder = app === 'tumblr' ? '# Add tags' : 'Add hashtags'; tags.value = ui.tags || ''; tags.maxLength = 400; tags.disabled = Boolean(ui.pending); tags.oninput = () => { ui.tags = tags.value }; tags.dataset.socialFocus = 'Post tags'; if (app === 'instagram' || app === 'tumblr') compose.append(tagLabel)
  }
  if (app === 'discord' || (app === 'twitter' && host.searchGifs)) {
    const gifs = button(app === 'discord' ? '' : 'GIF', app === 'discord' ? 'lp-discord-expression-button' : 'lp-discord-gif-button'); gifs.setAttribute('aria-label', app === 'discord' ? 'Emoji and GIFs' : 'Attach a GIF'); if(app==='discord')gifs.setAttribute('aria-expanded','false');else gifs.setAttribute('aria-haspopup', 'dialog'); gifs.disabled = Boolean(ui.pending)
    const chooseGif = (gif:SocialGif) => { ui.gif = gif; ui.focusComposer = true; host.render() }
    if (app === 'discord') { gifs.append(socialIcon('smile')); gifs.onclick = () => discordExpressionPicker(gifs, host.searchGifs, emoji => {
      const start = text.selectionStart, end = text.selectionEnd
      if (text.value.length - (end - start) + emoji.length > text.maxLength) return
      text.setRangeText(emoji, start, end, 'end'); ui.draft = text.value; ui.focusComposer = true
      const mount = page.parentElement; host.render(); const replacement = mount?.querySelector<HTMLTextAreaElement>('[data-social-focus="Social composer"]'); replacement?.focus({preventScroll:true}); replacement?.setSelectionRange(start + emoji.length, start + emoji.length)
    }, chooseGif,{library:nativeFor({...state,pocketPersonaActorId:owner}),pack:ui.emotePack,query:ui.emoteQuery,remember:(pack,query)=>{ui.emotePack=pack;ui.emoteQuery=query},manage:host.manageStickers,chooseEmote:sticker=>{const token=stickerToken(sticker),start=text.selectionStart,end=text.selectionEnd;if(text.value.length-(end-start)+token.length+2>text.maxLength)return;text.setRangeText(' '+token+' ',start,end,'end');ui.draft=text.value;ui.focusComposer=true;const mount=page.parentElement;host.render();const replacement=mount?.querySelector<HTMLTextAreaElement>('[data-social-focus="Social composer"]');replacement?.focus({preventScroll:true});replacement?.setSelectionRange(start+token.length+2,start+token.length+2)}}) } else gifs.onclick = () => gifPicker(gifs, host.searchGifs!, chooseGif)
    footer.append(gifs)
    if (ui.gif) { const preview = el('div', 'lp-social-gif-draft'), remove = actionButton('Remove GIF', 'Remove attached GIF', () => { ui.gif = undefined; host.render() }); preview.append(gifMedia(ui.gif), remove); compose.append(preview) }
  }
  if(app==='discord'){const preview=el('div','lp-discord-emote-preview');updateEmotePreview=()=>{const refs=messageEmotes(nativeFor({...state,pocketPersonaActorId:owner}),text.value);preview.replaceChildren();preview.hidden=!refs.length;if(refs.length)preview.append(discordEmoteText(text.value,refs))};compose.append(preview);updateEmotePreview()}
  if (app === 'discord') text.onkeydown = event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (!submit.disabled) compose.requestSubmit() } }
  updateSubmit(); footer.append(count, submit); compose.append(footer)
  if (app === 'discord') { submit.setAttribute('aria-label', 'Send'); submit.replaceChildren(socialIcon('send')); const bar = el('div', 'lp-discord-composer-bar'); bar.append(textLabel, footer); compose.append(bar) }
  compose.onsubmit = event => { event.preventDefault(); if (!submit.disabled) host.request({ action: reblog ? 'reblog' : 'post', app, text: ui.draft, title: ui.title, photo: ui.photo, tags: (ui.tags || '').split(',').map(tag => tag.trim()).filter(Boolean), imageId: ui.imageId, gif: ui.gif, replyTo: reply?.id, postId: reblog?.id, channelId: ui.channelId }) }
  const composeShell = el('section', 'lp-social-compose-disclosure'), composeSummary = actionButton(app === 'instagram' ? 'Create a photo post' : app === 'tumblr' ? 'Create a post' : 'What’s happening?', `Write a ${SOCIAL_NAMES[app]} post`, () => { ui.composing = true; ui.focusComposer = true; host.render() }, 'lp-social-new-post')
  composeSummary.dataset.socialFocus = 'Start social post'; composeShell.append(composeSummary)
  if (app === 'twitter' && !thread && !ui.ownOnly) content.append(composeShell)
  const feed = el('section', 'lp-social-feed'); feed.setAttribute('aria-label', `${SOCIAL_NAMES[app]} ${thread ? 'thread' : 'posts'}`)
  const visible = thread ? platformPosts.filter(post => rootOf(post).id === thread.id && (app !== 'tumblr' || post.id === thread.id || ((ui.notesView || 'comments') === 'reblogs' ? Boolean(post.reblogOf) : !post.reblogOf))) : app === 'discord' ? platformPosts : [...platformPosts].reverse().filter(post => !post.replyTo && (!ui.ownOnly || post.account.actorId === owner) && (app !== 'twitter' || ui.ownOnly || ui.twitterFeed !== 'following' || following.includes(post.account.id)))
  const quoteBlock = (post: SocialPost) => { const quote = el('blockquote', 'lp-social-quote'); quote.append(el('strong', '', `@${post.account.handle}`), el('p', '', post.text || post.photo || post.gif?.description || 'Photo post')); return quote }
  const renderPost = (post: SocialPost) => {
    if (app === 'discord') return discordMessage({ state, world, owner, posts: platformPosts, avatar: accountAvatar, timestamp: postTimestamp, request: input => { ui.discussionFocus = `Discord message ${post.id}`; ui.focusDiscussion = true; host.request(input) }, pending: Boolean(ui.pending), reply: post => { ui.replyTo = post.id; ui.threadId = undefined; ui.focusComposer = true; host.render() } }, post)
    const preview = post.id.startsWith('preview:')
    const card = el('article', 'lp-social-post'); card.dataset.socialPost = post.id; if (preview) card.dataset.socialPreview = 'true'
    const heading = el('header', 'lp-social-post-heading'), avatar = accountAvatar(post.account.name, post.account.actorId, post.account.avatarUrl)
    const identity = el('div', 'lp-social-post-identity'); identity.append(el('strong', '', app === 'tumblr' ? post.account.handle : post.account.name), el('span', '', `@${post.account.handle}`)); heading.append(avatar, identity)
    const time = el('time', '', preview ? 'Sample' : postTimestamp(post)); time.dateTime = post.createdAt; time.title = post.createdAt; heading.append(time); card.append(heading)
    const body = el('div', 'lp-social-post-body')
    if (post.reblogOf) {
      const trail: SocialPost[] = []; let original = platformPosts.find(item => item.id === post.reblogOf)
      while (original && trail.length < 8) { trail.push(original); original = platformPosts.find(item => item.id === original!.reblogOf) }
      body.append(el('span', 'lp-social-reblog-label', app === 'tumblr' ? '↻ reblogged' : '↻ quoted'))
      for (const entry of trail.reverse()) body.append(quoteBlock(entry))
    } else if (post.replyTo && !thread) { const original = platformPosts.find(item => item.id === post.replyTo); if (original) body.append(el('span', 'lp-social-reblog-label', '↳ replying'), quoteBlock(original)) }
    if (post.title && app === 'tumblr') body.append(el('h2', 'lp-social-post-title', post.title))
    if (post.imageUrl) { const image = el('img', 'lp-social-photo'); image.src = post.imageUrl; image.alt = post.photo || `Photo shared by ${post.account.name}`; image.loading = 'lazy'; image.onerror = () => { image.replaceWith(el('p', 'lp-social-photo-description', post.photo || 'This photo is unavailable.')) }; body.append(image) }
    else if (post.photo && (app === 'instagram' || app === 'tumblr')) { const photo = el('figure', 'lp-social-photo-description'); photo.append(socialIcon('camera'), el('span', '', 'PHOTO DESCRIPTION'), el('figcaption', '', post.photo)); body.append(photo) }
    if (post.gif) body.append(gifMedia(post.gif))
    if (post.text) { const copy = el('p', 'lp-social-post-text'); if (app === 'instagram') { copy.classList.add('lp-social-caption'); copy.append(el('strong', '', post.account.handle + ' '), el('span', '', post.text)) } else copy.textContent = post.text; if(app==='twitter')body.prepend(copy);else body.append(copy) }
    if (post.tags.length && (app === 'instagram' || app === 'tumblr')) body.append(el('p', 'lp-social-tags', post.tags.map(tag => `#${tag}`).join(' ')))
    const actions = el('div', 'lp-social-post-actions'), label = `${post.account.name}’s post ${post.id}`
    const openDiscussion = actionButton('', `Open discussion for ${label}`, () => { ui.discussionFocus = `Open discussion for ${rootOf(post).account.name}’s post ${rootOf(post).id}`; ui.threadId = rootOf(post).id; ui.replyTo = undefined; ui.reblogOf = undefined; ui.composing = false; if (app === 'tumblr') ui.notesView = post.reblogOf ? 'reblogs' : 'comments'; ui.scrollTop = 0; host.render() }, 'lp-social-open-discussion')
    card.append(openDiscussion)
    if (!preview && !thread && app === 'instagram' && socialCanMessage(world, owner, app, post.account)) heading.append(iconAction('reply', `Message ${post.account.name}`, () => openDm(post.account.id, state.social?.dmThreads?.find(thread => thread.owner === owner && thread.account.id === post.account.id)?.id), 'lp-instagram-message-account'))
    if (!preview && !thread && post.account.actorId !== owner) { const follow = actionButton(following.includes(post.account.id) ? 'Following' : 'Follow', `${following.includes(post.account.id) ? 'Unfollow' : 'Follow'} ${post.account.name}`, () => host.request({ action: 'follow', app, accountId: post.account.id }), 'lp-social-follow'); follow.setAttribute('aria-pressed', String(following.includes(post.account.id))); if (app === 'twitter') { follow.textContent = following.includes(post.account.id) ? 'Following' : '· Follow'; identity.append(follow) } else heading.append(follow) }
    if (preview) { actions.append(el('span', 'lp-social-preview-label', 'Sample post · open to preview the discussion')); body.append(actions); card.append(body); return card }
    const like = iconAction('heart', `Like ${label}`, () => host.request({ action: 'like', app, postId: post.id }), 'lp-social-like'); if (post.likedBy.length) like.append(el('span', 'lp-social-action-count', String(post.likedBy.length))); like.setAttribute('aria-pressed', String(post.likedBy.includes(owner))); actions.append(like)
    const replies = platformPosts.filter(item => item.replyTo === post.id).length
    const replyAction = iconAction('reply', `${app === 'tumblr' ? 'Comment on' : 'Reply to'} ${label}`, () => { ui.replyTo = app === 'tumblr' ? rootOf(post).id : post.id; ui.reblogOf = undefined; ui.threadId = rootOf(post).id; if (app === 'tumblr') ui.notesView = 'comments'; ui.composing = true; ui.focusComposer = true; host.render() }); if (app === 'tumblr') replyAction.append(el('span', '', 'Comment')); actions.append(replyAction)
    if (replies && !thread) actions.append(iconAction('thread', `Read replies to ${label}`, () => { ui.threadId = post.id; ui.scrollTop = 0; host.render() }))
    if (app === 'tumblr' || app === 'twitter') actions.append(iconAction(app === 'tumblr' ? 'reblog' : 'quote', `${app === 'tumblr' ? 'Reblog' : 'Quote'} ${label}`, () => { ui.reblogOf = post.id; ui.replyTo = undefined; ui.threadId = undefined; ui.scrollTop = 0; ui.composing = true; ui.focusComposer = true; host.render() }))
    if (post.authoredBy === owner) actions.append(iconAction('trash', `Delete ${label}`, () => host.request({ action: 'delete', app, postId: post.id })))
    if (app === 'tumblr') { const notes = el('span', 'lp-tumblr-notes', `${post.likedBy.length + replies} notes`); actions.prepend(notes) }
    body.append(actions); card.append(body); return card
  }
  const renderComment = (post: SocialPost) => {
    const preview = post.id.startsWith('preview:'), label = `${post.account.name}’s post ${post.id}`
    const comment = el('article', `lp-social-comment lp-${app}-comment`); comment.dataset.socialPost = post.id; comment.setAttribute('aria-label', `${app === 'twitter' ? 'Reply' : post.reblogOf ? 'Reblog' : 'Comment'} by ${post.account.name}`); if (preview) comment.dataset.socialPreview = 'true'
    const avatar = accountAvatar(post.account.name, post.account.actorId, post.account.avatarUrl), body = el('div', 'lp-social-comment-body'), heading = el('header', 'lp-social-comment-heading')
    heading.append(el('strong', '', app === 'tumblr' ? post.account.handle : post.account.name))
    if (app === 'twitter') heading.append(el('span', '', `@${post.account.handle}`))
    const time = el('time', '', preview ? 'Sample' : postTimestamp(post)); time.dateTime = post.createdAt; heading.append(time); body.append(heading)
    if (post.reblogOf) body.append(el('span', 'lp-social-reblog-label', 'Reblogged with tags'))
    const parent = platformPosts.find(item => item.id === post.replyTo)
    if (app === 'twitter' && parent && parent.id !== thread?.id) body.append(el('span', 'lp-social-reply-target', `Replying to @${parent.account.handle}`))
    body.append(el('p', 'lp-social-comment-text', post.text || post.photo || ''))
    if (post.gif) body.append(gifMedia(post.gif))
    if (post.tags.length && app === 'tumblr') body.append(el('p', 'lp-social-tags', post.tags.map(tag => `#${tag}`).join(' ')))
    if (!preview) {
      const actions = el('div', 'lp-social-comment-actions'), liked = post.likedBy.includes(owner)
      const like = iconAction('heart', `Like ${label}`, () => host.request({ action: 'like', app, postId: post.id }), 'lp-social-like'); like.setAttribute('aria-pressed', String(liked)); if (post.likedBy.length) like.append(el('span', '', String(post.likedBy.length)))
      const replyAction = actionButton('Reply', `${app === 'tumblr' ? 'Comment on' : 'Reply to'} ${label}`, () => { ui.replyTo = app === 'tumblr' ? thread!.id : post.id; ui.reblogOf = undefined; ui.composing = true; ui.focusComposer = true; host.render() }, 'lp-social-comment-reply')
      actions.append(replyAction, like)
      if (post.authoredBy === owner) actions.append(iconAction('trash', `Delete ${label}`, () => host.request({ action: 'delete', app, postId: post.id })))
      body.append(actions)
    }
    comment.append(avatar, body); return comment
  }
  if (thread?.id.startsWith('preview:')) {
    composeShell.hidden = true
    const previewReblog = app === 'tumblr' && ui.notesView === 'reblogs'
    const sampleReply: SocialPost = { ...thread, id: `preview:reply:${thread.id}`, account: { id: 'preview:commenter', name: 'Mika', handle: 'moonlit-mika' }, text: previewReblog ? 'this belongs on the very small list of things keeping me going' : 'A small moment, perfectly captured.', title: undefined, imageUrl: undefined, photo: undefined, tags: previewReblog ? ['a tiny reblog', 'sample commentary'] : [], replyTo: previewReblog ? undefined : thread.id, reblogOf: previewReblog ? thread.id : undefined }
    visible.push(sampleReply)
  }
  for (const post of visible) {
    feed.append(thread && post.id !== thread.id ? renderComment(post) : renderPost(post))
    if (thread && post.id === thread.id) {
      if (notesTabs) feed.append(notesTabs)
      if (reply && app === 'twitter') feed.append(compose)
    }
  }
  if (thread && reply && app !== 'twitter') feed.append(compose)
  if (thread && !reply && !thread.id.startsWith('preview:')) feed.append(actionButton(app === 'twitter' ? 'Post your reply' : 'Add a comment…', app === 'twitter' ? 'Write a reply' : 'Write a comment', () => { ui.replyTo = thread.id; ui.composing = true; ui.focusComposer = true; host.render() }, `lp-social-comment-prompt lp-${app}-comment-prompt`))
  if (!visible.length) { const empty = el('div', 'lp-social-empty'); empty.append(el('strong', '', app === 'discord' && !ui.channelId ? 'Find your people.' : ui.ownOnly ? 'Your corner of the internet.' : 'A whole world, waiting.'), el('p', '', app === 'discord' && !ui.channelId ? 'Create a server, then Refresh a channel to meet its voices.' : ui.ownOnly ? 'Your posts will appear here.' : 'Tap Refresh for posts from your cast and people beyond it.')); feed.append(empty) }
  if (reblog && app === 'twitter') { feed.hidden = true; page.dataset.socialComposeMode = 'quote' }
  if (app === 'instagram' && ui.ownOnly && !thread && visible.length) { feed.classList.add('lp-instagram-profile-grid'); for (const card of feed.querySelectorAll<HTMLElement>('.lp-social-post')) card.classList.add('lp-instagram-profile-tile') }
  content.append(feed)
  if (app !== 'discord' && !reply && (ui.composing || reblog)) {
    page.dataset.socialView = 'compose'; compose.classList.add(`lp-${app}-new-compose`)
    const editorBar = el('header', 'lp-social-editor-bar'), heading = el('h2', 'lp-social-editor-title', reblog ? app === 'twitter' ? 'Quote post' : 'Reblog' : 'New post')
    if (app === 'instagram' && !reblog) submit.textContent = 'Share'
    editorBar.append(heading, submit); compose.prepend(editorBar)
    editorBar.after(composerTitle)
    composerTitle.replaceChildren(accountAvatar(account.name, account.actorId), el('strong', '', `@${account.handle}`))
    content.replaceChildren(...(!nav ? [toolbar] : []), compose); settings.hidden = true; content.append(settings)
    quickRefresh.hidden = true; if (inbox) inbox.hidden = true; operation.hidden = !ui.refreshing && (!ui.status || ui.status === 'Saved.')
    text.placeholder = app === 'tumblr' ? 'Add something, if you’d like' : reblog && app === 'twitter' ? 'Add a comment' : app === 'twitter' ? 'What’s happening?' : 'Write a caption…'
    if (app === 'instagram') { const hint = el('p', 'lp-social-photo-hint', 'Choose a photo, then add your caption.'); compose.querySelector('.lp-social-media')?.before(hint) }
    if (ui.error) { const error = el('p', 'lp-social-error', ui.error); error.setAttribute('role', 'alert'); content.prepend(error) }
  }
  settings.hidden = !ui.settingsOpen
  if (ui.settingsOpen && app !== 'discord') for (const child of [...content.children]) if (child !== settings) (child as HTMLElement).hidden = true
  content.append(settings)
  if (ui.friendsScreen && app !== 'discord') {
    const people = el('section', 'lp-social-settings lp-settings-section lp-social-friends-screen'); people.setAttribute('aria-label', 'Friends and portable casts'); people.append(el('h2', '', 'Friends & casts'), el('p', 'lp-copy', 'Choose familiar characters, NPC Bank people, or a portable cast.')); people.append(friends); settings.hidden = true; content.replaceChildren(people, settings)
  }
  const switchTumblrTab = (tab: 'activity' | 'messages') => { saveDmDraft(); ui.tumblrView = 'activity'; ui.tumblrHubTab = tab; ui.dmOpen = tab === 'messages'; ui.dmAccountId = undefined; ui.dmThreadId = undefined; ui.dmDraft = ''; ui.scrollTop = 0; host.render() }
  const openTumblrPost = (post: SocialPost, focus?: string) => {
    ui.discussionFocus = focus; ui.threadId = rootOf(post).id; ui.notesView = post.reblogOf ? 'reblogs' : 'comments'; ui.replyTo = undefined; ui.reblogOf = undefined; ui.composing = false; leaveDm(); ui.scrollTop = 0
    const mount = page.parentElement; host.render()
    mount?.querySelector<HTMLElement>('[data-social-focus="App navigation"],[data-social-focus="Back to social feed"]')?.focus({ preventScroll: true })
  }
  if (app === 'tumblr' && ui.tumblrView && !ui.settingsOpen && !ui.friendsScreen && !ui.threadId && !ui.composing) {
    if (ui.tumblrView === 'search') content.replaceChildren(tumblrSearch({ posts: platformPosts, ui, open: openTumblrPost, renderPost }), settings)
    else if (ui.tumblrHubTab === 'messages') ui.dmOpen = true
    else {
      identity.textContent = account.handle; identity.classList.add('lp-tumblr-hub-title')
      ui.dmOpen = false
      content.replaceChildren(tumblrHub('activity', tumblrActivity({ posts: actualPlatformPosts, owner, followed: following, avatar: person => accountAvatar(person.name, person.actorId, person.avatarUrl), time: postTimestamp, open: openTumblrPost, resolveAccount: id => state.contacts.some(contact => contact.id === id) ? socialOwner(state, id, 'tumblr') : undefined }), switchTumblrTab), settings)
    }
    quickRefresh.hidden = true
  }
  if ((app === 'instagram' || app === 'tumblr') && ui.dmOpen && !ui.settingsOpen && !ui.friendsScreen) {
    const threads = (state.social?.dmThreads || []).filter(thread => thread.owner === owner && socialDirectApp(thread) === app), thread = threads.find(thread => thread.id === ui.dmThreadId) || threads.find(thread => thread.account.id === ui.dmAccountId)
    const accounts = new Map<string, SocialAccount>()
    const addAccount = (person: SocialAccount) => {
      if (person.id === owner || person.actorId === owner || person.actorId === state.pocketPersonaActorId) return
      if ([...accounts.values()].some(prior => prior.id === person.id || (person.actorId && prior.actorId === person.actorId) || (person.bankId && prior.bankId === person.bankId))) return
      accounts.set(person.id, person)
    }
    for (const thread of threads) addAccount(thread.account)
    for (const post of actualPlatformPosts) if (socialCanMessage(world, owner, app, post.account)) addAccount(post.account)
    for (const entry of host.npcBank || []) if (savedSettings.friendEntryIds.includes(entry.id)) addAccount(actualPlatformPosts.find(post => post.account.bankId === entry.id)?.account || { id: `bank:${entry.id}`, bankId: entry.id, name: entry.name, handle: generatedSocialHandle(app, entry.name), avatarUrl: entry.avatarUrl })
    for (const contact of state.contacts) if (savedSettings.friendEntryIds.includes(`actor:${contact.id}`)) addAccount(actualPlatformPosts.find(post => post.account.actorId === contact.id)?.account || { id: `bank:actor:${contact.id}`, actorId: contact.id, name: contact.name, handle: socialOwner(state, contact.id, app).handle })
    const target = thread?.account || (ui.dmAccountId ? accounts.get(ui.dmAccountId) : undefined)
    const dmClass = (part: string) => `lp-social-private-${part} lp-${app}-${part}`
    const dms = el('section', dmClass('dms')); dms.setAttribute('aria-label', `${SOCIAL_NAMES[app]} messages`); page.dataset.socialDmView = target ? 'thread' : 'inbox'; if (app === 'instagram') page.dataset.instagramView = target ? 'thread' : 'inbox'
    if (inbox) inbox.hidden = true
    if (!nav) dms.append(actionButton(target ? 'Back to inbox' : 'Back to feed', target ? `Back to ${SOCIAL_NAMES[app]} ${app === 'tumblr' ? 'messages' : 'inbox'}` : `Back to ${SOCIAL_NAMES[app]} feed`, () => { navigateBack() }))
    identity.classList.add(...dmClass('message-title').split(' ')); identity.replaceChildren()
    if (target) {
      identity.classList.add(...dmClass('recipient').split(' ')); const who = el('span'); who.append(el('strong', '', target.name), el('small', '', `@${target.handle}`)); identity.append(accountAvatar(target.name, target.actorId, target.avatarUrl), who)
      const log = el('section', dmClass('dm-log')); log.setAttribute('aria-label', `Conversation with ${target.name}`)
      if (!thread?.messages.length) { const intro = el('div', dmClass('dm-intro')); intro.append(accountAvatar(target.name, target.actorId, target.avatarUrl), el('strong', '', target.name), el('span', '', `@${target.handle}`), el('p', '', 'Send a message to start the conversation.')); log.append(intro) }
      for (const message of thread?.messages || []) {
        const row = el('div', `${dmClass('dm-row')} lp-${app}-dm-row-${message.sender}`), group = el('div', dmClass('dm-message')), bubble = el('p', `${dmClass('dm-bubble')} lp-${app}-dm-${message.sender}`, message.text), time = el('time', dmClass('dm-time'))
        time.dateTime = message.createdAt; const clock = activityClock({ presentation: { storyAt: message.createdAt, storyTimezoneOffsetMinutes: state.roleplayTimezoneOffsetMinutes } } as PocketActivity); time.textContent = clock.time || 'Story time'; time.title = clock.date
        group.append(bubble, time); if (message.sender === 'account') row.append(accountAvatar(target.name, target.actorId, target.avatarUrl)); row.append(group); log.append(row)
      }
      if (ui.dmBusy) { const typing = el('p', dmClass('typing'), `${target.name} is typing…`); typing.setAttribute('role', 'status'); log.append(typing) }
      dms.append(log)
      if (ui.dmError) { const error = el('p', 'lp-social-error', ui.dmError); error.setAttribute('role', 'alert'); dms.append(error) }
      const form = el('form', dmClass('dm-compose')); form.setAttribute('aria-label', `${SOCIAL_NAMES[app]} message composer`); const label = el('label', 'lp-social-field'), text = el('textarea', 'lp-input'); label.append(el('span', 'lp-social-visually-hidden', 'Message'), text); text.value = ui.dmDraft || ''; text.rows = 1; text.maxLength = 2000; text.placeholder = 'Message…'; text.disabled = Boolean(ui.dmBusy || ui.pending); text.dataset.socialFocus = `${SOCIAL_NAMES[app]} DM composer`
      const send = button('Send', 'lp-social-primary'); send.setAttribute('aria-label', 'Send message'); send.type = 'submit'; const update = () => { send.disabled = Boolean(ui.dmBusy || ui.pending) || !host.dmSend || !text.value.trim() }; update(); text.oninput = () => { ui.dmDraft = text.value; ui.dmDrafts ||= {}; ui.dmDrafts[target.id] = text.value; update() }; form.onsubmit = event => { event.preventDefault(); if (!send.disabled) host.dmSend?.(target.id, text.value.trim(), thread?.id) }; form.append(label, send); dms.append(form)
      log.onscroll = () => { if (!log.isConnected) return; ui.dmScrollTop ||= {}; ui.dmStickToBottom ||= {}; ui.dmScrollTop[target.id] = log.scrollTop; ui.dmStickToBottom[target.id] = log.scrollHeight - log.scrollTop - log.clientHeight < 48 }
      content.ownerDocument.defaultView?.requestAnimationFrame?.(() => { if (log.isConnected) log.scrollTop = ui.dmStickToBottom?.[target.id] === false ? ui.dmScrollTop?.[target.id] || 0 : log.scrollHeight })
    } else {
      identity.textContent = app === 'tumblr' ? account.handle : 'Messages'; if (app === 'tumblr') identity.classList.add('lp-tumblr-hub-title'); dms.append(el('h2', dmClass('inbox-heading'), 'Your messages'))
      if (ui.dmError) { const error = el('p', 'lp-social-error', ui.dmError); error.setAttribute('role', 'alert'); dms.append(error) }
      const list = el('div', dmClass('inbox-list')); list.setAttribute('aria-label', 'Private conversations')
      for (const account of accounts.values()) { const existing = threads.find(thread => thread.account.id === account.id), open = actionButton('', `Message ${account.name}`, () => openDm(account.id, existing?.id), dmClass('inbox-account')), copy = el('span'); copy.append(el('strong', '', account.name), el('span', '', existing?.messages.at(-1)?.text || `Say hello to @${account.handle}`)); open.append(accountAvatar(account.name, account.actorId, account.avatarUrl), copy); list.append(open) }
      if (!accounts.size) list.append(el('p', 'lp-copy', `Follow a blog or choose friends in ${SOCIAL_NAMES[app]} settings to start a conversation.`))
      dms.append(list)
    }
    content.replaceChildren(app === 'tumblr' && !target ? tumblrHub('messages', dms, switchTumblrTab) : dms, settings)
  }
  let scroller: HTMLElement = content
  if (app === 'discord') {
    const main = el('div', 'lp-discord-main'), messages = el('div', 'lp-discord-messages')
    // The channel timeline is the only scrolling conversation surface; rails/composer stay put.
    for (const node of [...content.childNodes]) if (node !== feed) main.append(node)
    messages.append(feed); main.prepend(discordHeader!, discordPanel!); main.append(discordCreation!, discordPeople!, messages, compose); if (ui.settingsOpen || ui.ownOnly) { discordPanel!.hidden = true; discordCreation!.hidden = true; discordPeople!.hidden = true }; discordHeader!.hidden = Boolean(ui.ownOnly || ui.settingsOpen); messages.hidden = Boolean(ui.serverOpen || ui.peopleOpen || ui.settingsOpen || ui.ownOnly); compose.hidden = Boolean(ui.serverOpen || ui.peopleOpen || ui.settingsOpen || ui.ownOnly); page.dataset.discordView = ui.ownOnly ? 'profile' : ui.serverOpen ? 'create' : ui.peopleOpen ? 'people' : 'chat'
    for (const control of discordRail!.querySelectorAll<HTMLButtonElement>('button')) control.disabled = false
    content.replaceChildren(discordRail!, main); scroller = ui.ownOnly && !ui.settingsOpen ? main.querySelector<HTMLElement>('.lp-discord-profile')! : ui.peopleOpen && !ui.settingsOpen ? discordPeople! : ui.serverOpen ? discordCreation! : messages
  } else {
    const bottom = el('nav', 'lp-social-bottomnav'); bottom.setAttribute('aria-label', `${SOCIAL_NAMES[app]} navigation`)
    const home = iconAction('home', `${SOCIAL_NAMES[app]} home`, () => { resetNavigation(); ui.ownOnly = false; ui.scrollTop = 0; host.render() }); home.setAttribute('aria-pressed', String(!ui.ownOnly))
    const create = iconAction(app === 'instagram' ? 'plus' : 'compose', `Compose ${SOCIAL_NAMES[app]} post`, () => { resetNavigation(); ui.composing = true; ui.focusComposer = true; host.render() }, 'lp-social-create')
    const profile = iconAction('profile', `${SOCIAL_NAMES[app]} profile`, () => { resetNavigation(); ui.ownOnly = true; ui.scrollTop = 0; host.render() }); profile.setAttribute('aria-pressed', String(Boolean(ui.ownOnly)))
    if (app === 'tumblr') {
      const search = iconAction('search', 'Search Tumblr posts', () => { resetNavigation(); ui.ownOnly = false; ui.tumblrView = 'search'; ui.focusTumblrSearch = true; ui.scrollTop = 0; host.render() })
      const activity = iconAction('activity', 'Tumblr activity and messages', () => { resetNavigation(); ui.ownOnly = false; ui.tumblrView = 'activity'; ui.dmOpen = ui.tumblrHubTab === 'messages'; ui.scrollTop = 0; host.render() })
      home.setAttribute('aria-pressed', String(!ui.ownOnly && !ui.tumblrView)); search.setAttribute('aria-pressed', String(ui.tumblrView === 'search')); activity.setAttribute('aria-pressed', String(ui.tumblrView === 'activity'))
      bottom.append(home, search, activity, profile); create.classList.add('lp-tumblr-floating-compose'); create.hidden = Boolean(ui.composing || ui.settingsOpen || ui.friendsScreen || ui.threadId || ui.tumblrView); page.append(create)
    } else bottom.append(home, create, profile)
    bottom.hidden = Boolean(((app === 'instagram' && ui.dmOpen) || (app === 'tumblr' && ui.dmOpen && (ui.dmAccountId || ui.dmThreadId))) && !ui.settingsOpen); page.append(bottom)
  }
  scroller.onscroll = () => { if (scroller.isConnected) ui.scrollTop = scroller.scrollTop }
  content.ownerDocument.defaultView?.requestAnimationFrame?.(() => {
    if (!page.isConnected) return
    // Rendering leaves focus on the body. A focus inside the replacement view is
    // a newer interaction and must win over deferred restoration/autofocus.
    const canRestoreFocus = () => { const active = page.ownerDocument.activeElement; return !page.contains(active) && !active?.closest('dialog[open]') }
    if (app === 'discord' && ui.discordBottom && !ui.settingsOpen && !ui.ownOnly && !ui.peopleOpen && !ui.serverOpen) { scroller.scrollTop = scroller.scrollHeight; ui.scrollTop = scroller.scrollTop; ui.discordBottom = false }
    else if (canRestoreFocus()) scroller.scrollTop = ui.scrollTop || 0
    if (ui.settingsFocus && !ui.pending && ui.settingsOpen) {
      if (canRestoreFocus()) [...page.querySelectorAll<HTMLInputElement | HTMLSelectElement>('.lp-social-settings input,.lp-social-settings select')].find(node => node.dataset.socialFocus === ui.settingsFocus)?.focus({ preventScroll: true })
      ui.settingsFocus = undefined
    }
    if (ui.usernameFocus && !ui.pending) {
      if (canRestoreFocus()) page.querySelector<HTMLElement>(ui.usernameFocus === 'field' ? '[data-social-focus="Username"]' : '[data-social-focus="Change username"]')?.focus({ preventScroll: true })
      ui.usernameFocus = undefined
    }
    if (ui.focusTumblrSearch) { ui.focusTumblrSearch = false; if (canRestoreFocus()) page.querySelector<HTMLElement>('[data-social-focus="Tumblr search"]')?.focus({ preventScroll: true }) }
    if (ui.focusDiscussion && !ui.pending) { ui.focusDiscussion = false; if (canRestoreFocus()) [...page.querySelectorAll<HTMLElement>('[data-social-focus]')].find(node => node.dataset.socialFocus === ui.discussionFocus)?.focus({ preventScroll: true }) }
    if (ui.focusServerCreate) { ui.focusServerCreate = false; if (canRestoreFocus()) serverNameInput?.focus({ preventScroll: true }) }
    if (ui.focusChannels) { ui.focusChannels = false; if (canRestoreFocus()) channelsToggle?.focus({ preventScroll: true }) }
    if (ui.focusStart) { ui.focusStart = false; if (canRestoreFocus()) (app === 'twitter' ? composeSummary : app === 'tumblr' && ui.tumblrView === 'search' ? page.querySelector<HTMLElement>('[data-social-focus="Tumblr search"]') : app === 'tumblr' && ui.tumblrView === 'activity' ? page.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') : page.querySelector<HTMLElement>(`[data-social-focus="Compose ${SOCIAL_NAMES[app]} post"]`))?.focus({ preventScroll: true }) }
    if (ui.focusComposer) { ui.focusComposer = false; if (canRestoreFocus()) { text.focus(); text.scrollIntoView?.({ block: 'nearest' }) } }
  })
  return page
}
