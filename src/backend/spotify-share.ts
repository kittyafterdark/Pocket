import { SPOTIFY_SHARE_MAX_LYRICS, normalizeSpotifyShare, selectedSpotifyLyrics, spotifyLyricsLines, spotifyShareText, spotifyTrackKey, type SpotifyShareAttachment, type SpotifyShareMode, type SpotifyTrackSnapshot } from '../domain/spotify-share.js'

type ResolveMacros = (template: string, scope: { chatId: string; characterId?: string; userId?: string; commit: false }) => Promise<{ text: string; diagnostics: Array<{ message: string }> }>

interface PreviewEntry {
  id: string
  userKey: string
  chatId: string
  characterId: string
  conversationId: string
  snapshot: SpotifyTrackSnapshot
  expiresAt: number
}

const MARKER = '__POCKET_SPOTIFY_SHARE_V1_8F4D6B__'
const clean = (value: unknown, max: number): string => typeof value === 'string' ? value.trim().slice(0, max) : ''
const flag = (value: string): boolean => value.trim().toLowerCase() === 'true'

export class SpotifyShareBridge {
  private previews = new Map<string, PreviewEntry>()

  constructor(
    private readonly resolveMacros: ResolveMacros,
    private readonly now: () => number = () => Date.now(),
    private readonly makeId: () => string = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
  ) {}

  private userKey(userId?: string): string { return userId || '_owner' }
  private prune(): void {
    const now = this.now()
    for (const [id, entry] of this.previews) if (entry.expiresAt <= now) this.previews.delete(id)
  }

  async preview(input: { chatId: string; characterId: string; conversationId: string; userId?: string }): Promise<{ previewId: string; snapshot: SpotifyTrackSnapshot; lines: string[] }> {
    this.prune()
    const template = [
      MARKER,
      '{{spotify_now_playing}}',
      '{{spotify_track_name}}',
      '{{spotify_artists}}',
      '{{spotify_album_name}}',
      '{{spotify_album_art}}',
      '{{spotify_is_playing}}',
      '{{spotify_has_lyrics}}',
      '{{spotify_lyrics}}',
    ].join(`\n${MARKER}\n`)
    const scope = { chatId: input.chatId, characterId: input.characterId, userId: input.userId, commit: false as const }
    const resolved = await this.resolveMacros(template, scope)
    if (resolved.diagnostics?.length) throw new Error('SpotifyControls could not resolve the current song. Make sure it is enabled and connected.')
    const parts = resolved.text.split(`\n${MARKER}\n`)
    if (parts.length !== 9 || parts[0] !== MARKER || parts.slice(1).some((value) => value.includes(MARKER))) throw new Error('Spotify returned an unsafe or incomplete preview. Try again.')
    const [, before, titleRaw, artistsRaw, albumRaw, artRaw, playingRaw, hasLyricsRaw, lyricsRaw] = parts
    const title = clean(titleRaw, 240), artists = clean(artistsRaw, 300)
    if (!title || !artists || /^\{\{spotify_/i.test(title) || /^\{\{spotify_/i.test(artists) || before.trim() === 'Nothing playing') {
      throw new Error('Play a Spotify song first, then try sharing again.')
    }
    if (before.trim().toLocaleLowerCase() !== `${title} by ${artists}`.toLocaleLowerCase()) throw new Error('The Spotify track changed while the preview was loading. Open the share again.')
    let albumArtUrl: string | undefined
    try { if (new URL(artRaw.trim()).protocol === 'https:') albumArtUrl = artRaw.trim().slice(0, 2_000) } catch { /* omit unsafe art */ }
    const hasLyrics = flag(hasLyricsRaw) && !/^No lyrics available$/i.test(lyricsRaw.trim()) && lyricsRaw.trim() !== '[Instrumental]'
    const snapshot: SpotifyTrackSnapshot = {
      title, artists, album: clean(albumRaw, 300), albumArtUrl, isPlaying: flag(playingRaw),
      hasLyrics, lyrics: hasLyrics ? lyricsRaw.replace(/\r\n?/g, '\n').trim().slice(0, 20_000) : '',
    }
    const after = await this.resolveMacros(`{{spotify_track_name}}\n${MARKER}\n{{spotify_artists}}`, scope)
    const afterParts = after.text.split(`\n${MARKER}\n`)
    if (after.diagnostics?.length || afterParts.length !== 2 || spotifyTrackKey(snapshot) !== spotifyTrackKey({ title: clean(afterParts[0], 240), artists: clean(afterParts[1], 300) })) {
      throw new Error('The Spotify track changed while lyrics were loading. Open the share again.')
    }
    const previewId = `spotify_${this.makeId()}`
    this.previews.set(previewId, { id: previewId, userKey: this.userKey(input.userId), chatId: input.chatId, characterId: input.characterId, conversationId: input.conversationId, snapshot, expiresAt: this.now() + 5 * 60_000 })
    return { previewId, snapshot, lines: spotifyLyricsLines(snapshot.lyrics) }
  }

  consume(input: { previewId?: unknown; mode?: unknown; selectedLineIndexes?: unknown; note?: unknown }, scope: { chatId: string; characterId: string; conversationId: string; userId?: string }): { attachment: SpotifyShareAttachment; text: string } {
    this.prune()
    const previewId = clean(input.previewId, 180)
    const entry = this.previews.get(previewId)
    if (!entry || entry.userKey !== this.userKey(scope.userId) || entry.chatId !== scope.chatId || entry.characterId !== scope.characterId || entry.conversationId !== scope.conversationId) {
      throw new Error('This Spotify preview expired or belongs to another conversation. Open it again.')
    }
    const mode: SpotifyShareMode = input.mode === 'excerpt' || input.mode === 'full' ? input.mode : 'card'
    if (!['card', 'excerpt', 'full'].includes(String(input.mode))) throw new Error('Choose what to include in the song share.')
    if (mode !== 'card' && !entry.snapshot.hasLyrics) throw new Error('Lyrics are not available for this song.')
    const lyrics = mode === 'excerpt' ? selectedSpotifyLyrics(entry.snapshot, input.selectedLineIndexes)
      : mode === 'full' ? entry.snapshot.lyrics : ''
    if (lyrics.length > SPOTIFY_SHARE_MAX_LYRICS) throw new Error('These lyrics are too long to share in full. Choose selected lyric lines instead.')
    if (typeof input.note === 'string' && input.note.trim().length > 600) throw new Error('Keep the song note within 600 characters.')
    const attachment = normalizeSpotifyShare({
      version: 1, title: entry.snapshot.title, artists: entry.snapshot.artists, album: entry.snapshot.album,
      albumArtUrl: entry.snapshot.albumArtUrl, mode, lyrics, note: clean(input.note, 600),
    })
    if (!attachment) throw new Error('The Spotify share is incomplete. Open it again.')
    const text = spotifyShareText(attachment)
    this.previews.delete(previewId)
    return { attachment, text }
  }
}
