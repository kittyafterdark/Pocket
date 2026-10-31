import { SPOTIFY_SHARE_MAX_MESSAGE, SPOTIFY_SHARE_MAX_NOTE, SPOTIFY_SHARE_MAX_SELECTED_LINES, spotifyShareText, type SpotifyShareAttachment, type SpotifyTrackSnapshot } from '../../domain/spotify-share.js'
import { button, el } from '../shared.js'
import { fieldBlock } from './ui.js'

export interface SpotifySharePreview {
  previewId: string
  snapshot: SpotifyTrackSnapshot
  lines: string[]
}

function recordSleeve(): HTMLDivElement {
  const sleeve = el('div', 'lp-record-sleeve')
  sleeve.setAttribute('aria-hidden', 'true')
  const record = el('div', 'lp-record-disc'); record.append(el('span', 'lp-record-heart', '♥'))
  sleeve.append(el('span', 'lp-record-edition', 'POCKET SESSIONS / VOL. 01'), record, el('span', 'lp-record-label', 'on repeat.'))
  return sleeve
}

/** A song preview, with sharing controls; playback remains in Spotify. */
export function spotifyPlayer(options: { snapshot?: SpotifyTrackSnapshot; loading: boolean; canRefresh?: boolean; error?: string; refresh(): void; share(): void }): HTMLElement {
  const root = el('section', 'lp-song-player')
  root.setAttribute('aria-label', 'Spotify song preview')
  const top = el('div', 'lp-song-player-top'), refresh = button('↻', 'lp-song-refresh')
  refresh.setAttribute('aria-label', 'Refresh current song'); refresh.disabled = options.loading || options.canRefresh === false; refresh.onclick = options.refresh
  top.append(el('span', 'lp-share-eyebrow', options.snapshot?.isPlaying ? 'NOW PLAYING' : 'ON YOUR SPOTIFY'), refresh)
  const art = el('div', 'lp-song-art')
  art.append(recordSleeve())
  if (options.snapshot?.albumArtUrl) {
    const image = el('img'); image.src = options.snapshot.albumArtUrl; image.alt = `Album artwork for ${options.snapshot.album || options.snapshot.title}`
    image.onerror = () => image.remove(); art.append(image)
  }
  const details = el('div', 'lp-song-details')
  details.append(el('h2', '', options.snapshot?.title || 'A little song for you'), el('p', '', options.snapshot?.artists || 'Some things sound better shared.'))
  if (options.snapshot?.album) details.append(el('span', 'lp-song-album', options.snapshot.album))
  const progress = el('div', 'lp-song-progress'); progress.setAttribute('aria-hidden', 'true'); progress.append(el('span'))
  const foot = el('div', 'lp-song-player-foot'), waves = el('span', 'lp-song-waves')
  waves.setAttribute('aria-hidden', 'true'); for (let i = 0; i < 5; i++) waves.append(el('i'))
  foot.append(waves, el('span', '', 'Playback stays in Spotify'), el('span', 'lp-song-heart', '♡'))
  foot.lastElementChild!.setAttribute('aria-hidden', 'true')
  const status = el('p', 'lp-song-status'); status.setAttribute('role', 'status')
  status.textContent = options.loading ? 'Finding your current song…' : options.error || ''
  const share = button('Share this song ↗', 'lp-button lp-button-primary lp-song-share'); share.setAttribute('aria-label', 'Share this song')
  share.disabled = !options.snapshot || options.loading; share.onclick = options.share
  root.append(top, art, details, progress, foot, status, share)
  return root
}

export function renderSpotifyShareCard(share: SpotifyShareAttachment): HTMLDivElement {
  const card = el('div', 'lp-spotify-card')
  const art = el('div', 'lp-spotify-cover'); art.append(recordSleeve())
  if (share.albumArtUrl) {
    const image = el('img', 'lp-spotify-art'); image.src = share.albumArtUrl; image.alt = ''; image.loading = 'lazy'; image.onerror = () => image.remove(); art.append(image)
  }
  const copy = el('div', 'lp-spotify-copy')
  copy.append(el('span', 'lp-share-eyebrow', 'A SONG FOR YOU'), el('strong', 'lp-spotify-title', share.title), el('span', 'lp-copy', share.artists))
  if (share.album) copy.append(el('span', 'lp-copy', share.album))
  card.append(art, copy)
  if (share.lyrics) card.append(el('pre', 'lp-spotify-lyrics', share.lyrics))
  if (share.note) card.append(el('p', 'lp-spotify-note', share.note))
  return card
}

export function spotifyShareSheet(options: {
  preview: SpotifySharePreview
  send(payload: Record<string, unknown>): void
  dismiss(): void
}): HTMLDivElement {
  const { preview } = options
  const content = el('div', 'lp-stack lp-spotify-sheet')
  content.append(el('p', 'lp-share-intro', 'This one made me think of you.'))
  const head: SpotifyShareAttachment = { version: 1, title: preview.snapshot.title, artists: preview.snapshot.artists, album: preview.snapshot.album, albumArtUrl: preview.snapshot.albumArtUrl, mode: 'card' }
  content.append(renderSpotifyShareCard(head))

  const mode = el('select', 'lp-select')
  const choices: Array<[string, string]> = [['card', 'Song only']]
  if (preview.snapshot.hasLyrics && preview.lines.length) choices.push(['excerpt', 'Selected lyric lines'], ['full', 'Full lyrics'])
  for (const [value, label] of choices) { const option = el('option', '', label); option.value = value; mode.append(option) }
  const lyrics = el('fieldset', 'lp-spotify-line-list'), legend = el('legend', '', 'Pick your favourite lines'), lyricRows = el('div', 'lp-spotify-line-scroll')
  lyrics.append(legend, el('p', 'lp-copy', `Choose up to ${SPOTIFY_SHARE_MAX_SELECTED_LINES} lines. Only selected lines will be shared.`), lyricRows)
  const fullLyrics = el('pre', 'lp-spotify-lyrics', preview.snapshot.lyrics)
  const checks: HTMLInputElement[] = []
  preview.lines.forEach((line, index) => {
    const row = el('label', 'lp-spotify-line')
    const check = el('input'); check.type = 'checkbox'; check.value = String(index)
    const visible = line || '(blank line)', number = el('span', 'lp-spotify-line-number', String(index + 1).padStart(2, '0'))
    number.setAttribute('aria-hidden', 'true')
    row.append(check, number, el('span', 'lp-spotify-line-text', visible)); checks.push(check); lyricRows.append(row)
  })
  const note = el('textarea', 'lp-textarea'); note.rows = 2; note.maxLength = SPOTIFY_SHARE_MAX_NOTE; note.placeholder = 'Add a note (optional)'
  const status = el('p', 'lp-copy'); status.setAttribute('role', 'status')
  const send = button('Share song', 'lp-button lp-button-primary')

  const draft = (): SpotifyShareAttachment => {
    const currentMode = mode.value as SpotifyShareAttachment['mode']
    const selected = checks.filter((check) => check.checked).map((check) => Number(check.value))
    const selectedLyrics = currentMode === 'excerpt' ? selected.map((index) => preview.lines[index]).join('\n').trim() : currentMode === 'full' ? preview.snapshot.lyrics : ''
    return { ...head, mode: currentMode, lyrics: selectedLyrics || undefined, note: note.value.trim() || undefined }
  }
  const update = () => {
    const excerpt = mode.value === 'excerpt', full = mode.value === 'full'
    lyrics.hidden = !excerpt
    fullLyrics.hidden = !full
    const selected = checks.filter((check) => check.checked).length
    for (const check of checks) check.disabled = !excerpt || !check.checked && selected >= SPOTIFY_SHARE_MAX_SELECTED_LINES
    status.textContent = excerpt ? `${selected}/${SPOTIFY_SHARE_MAX_SELECTED_LINES} lines selected` : full ? 'The complete available lyrics will be included.' : 'Only the song details will be included.'
    try {
      const text = spotifyShareText(draft())
      send.disabled = (excerpt && !selected) || selected > SPOTIFY_SHARE_MAX_SELECTED_LINES || text.length > SPOTIFY_SHARE_MAX_MESSAGE
      if (text.length > SPOTIFY_SHARE_MAX_MESSAGE) status.textContent = 'This share is too long. Choose selected lyric lines instead.'
    } catch (error) {
      send.disabled = true
      if (!(excerpt && !selected)) status.textContent = error instanceof Error ? error.message : 'This share is not ready.'
    }
  }
  for (const check of checks) check.addEventListener('change', () => {
    if (check.checked && checks.filter((entry) => entry.checked).length > SPOTIFY_SHARE_MAX_SELECTED_LINES) check.checked = false
    update()
  })
  mode.addEventListener('change', update); note.addEventListener('input', update)
  send.addEventListener('click', () => {
    if (send.disabled) return
    const selectedLineIndexes = checks.filter((check) => check.checked).map((check) => Number(check.value))
    send.disabled = true
    options.send({ previewId: preview.previewId, mode: mode.value, selectedLineIndexes, note: note.value.trim() })
    options.dismiss()
  })
  const footer = el('div', 'lp-share-send'); footer.append(status, send)
  content.append(fieldBlock('Include', mode), lyrics, fullLyrics, fieldBlock('Your note', note), footer)
  update()
  return content
}
