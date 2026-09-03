import type { PocketImageSource, PocketResolvedImage } from '../types.js'

type ImageApi = Pick<import('lumiverse-spindle-types').SpindleAPI, 'cors' | 'images' | 'permissions' | 'userStorage'>

interface UrlCacheEntry {
  sourceUrl: string
  assetId: string
  updatedAt: string
}

interface UrlCache {
  version: 1
  entries: UrlCacheEntry[]
}

const URL_CACHE_PATH = 'device/pocket-image-url-cache.json'
const SOURCE_LABELS: Record<PocketImageSource['kind'], string> = {
  gallery: 'Lumiverse Gallery',
  asset: 'Uploaded asset',
  url: 'Image URL',
}

function empty(): PocketResolvedImage {
  return { url: '', status: 'empty', sourceKind: 'none', sourceLabel: 'Theme gradient' }
}

function failure(source: PocketImageSource, error: unknown): PocketResolvedImage {
  return {
    url: '', status: 'error', sourceKind: source.kind, sourceLabel: SOURCE_LABELS[source.kind],
    error: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
  }
}

async function getStoredImage(api: ImageApi, source: Extract<PocketImageSource, { kind: 'gallery' | 'asset' }>, userId?: string): Promise<PocketResolvedImage> {
  if (!api.permissions.has('images')) throw new Error('Images permission is required to resolve this image.')
  const imageId = source.kind === 'gallery' ? source.imageId : source.assetId
  const image = await api.images.get(imageId, {
    specificity: 'full',
    onlyOwned: source.kind === 'asset',
    userId,
  })
  if (!image) throw new Error(source.kind === 'asset' ? 'The uploaded asset is missing or is not owned by Pocket.' : 'The Gallery image is missing.')
  if (!String(image.mime_type || '').toLowerCase().startsWith('image/')) throw new Error('The selected asset is not an image.')
  if (!image.url) throw new Error('Lumiverse did not return a renderable image URL.')
  return { url: image.url, status: 'ready', sourceKind: source.kind, sourceLabel: SOURCE_LABELS[source.kind] }
}

async function loadUrlCache(api: ImageApi, userId?: string): Promise<UrlCache> {
  const raw = await api.userStorage.getJson(URL_CACHE_PATH, { fallback: { version: 1, entries: [] }, userId }) as Partial<UrlCache> | null
  return {
    version: 1,
    entries: Array.isArray(raw?.entries) ? raw.entries.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const value = entry as Partial<UrlCacheEntry>
      return typeof value.sourceUrl === 'string' && typeof value.assetId === 'string'
        ? [{ sourceUrl: value.sourceUrl.slice(0, 2_000), assetId: value.assetId.slice(0, 180), updatedAt: String(value.updatedAt || '') }]
        : []
    }).slice(-32) : [],
  }
}

async function resolveRemoteUrl(api: ImageApi, source: Extract<PocketImageSource, { kind: 'url' }>, userId?: string): Promise<PocketResolvedImage> {
  if (source.url.startsWith('/')) return { url: source.url, status: 'ready', sourceKind: 'url', sourceLabel: SOURCE_LABELS.url }
  if (!/^https:\/\//i.test(source.url)) throw new Error('Pocket image URLs must use HTTPS.')
  if (!api.permissions.has('images')) throw new Error('Images permission is required to cache a remote image safely.')
  if (!api.permissions.has('cors_proxy')) throw new Error('CORS Proxy permission is required to verify and cache a remote image.')

  const cache = await loadUrlCache(api, userId)
  const cached = [...cache.entries].reverse().find((entry) => entry.sourceUrl === source.url)
  if (cached) {
    const resolved = await getStoredImage(api, { kind: 'asset', assetId: cached.assetId }, userId).catch(() => null)
    if (resolved) return { ...resolved, sourceKind: 'url', sourceLabel: SOURCE_LABELS.url }
    cache.entries = cache.entries.filter((entry) => entry !== cached)
  }

  const response = await api.cors(source.url, { method: 'GET', responseType: 'arraybuffer', mediaType: 'image' }) as {
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: string
    encoding?: string
  }
  if (!response || Number(response.status) < 200 || Number(response.status) >= 300) {
    throw new Error(`Remote image returned ${response?.status || 'an invalid response'}${response?.statusText ? ` ${response.statusText}` : ''}.`)
  }
  if (response.encoding !== 'base64' || !response.body) throw new Error('Lumiverse could not read the remote image bytes.')
  const mimeType = Object.entries(response.headers || {}).find(([key]) => key.toLowerCase() === 'content-type')?.[1]?.split(';')[0]?.trim() || 'image/png'
  if (!mimeType.toLowerCase().startsWith('image/')) throw new Error(`Remote URL returned ${mimeType}, not an image.`)
  const uploaded = await api.images.uploadFromDataUrl(`data:${mimeType};base64,${response.body}`, {
    originalFilename: 'pocket-remote-wallpaper',
    userId,
  })
  if (!uploaded?.id) throw new Error('Lumiverse did not return an asset ID for the cached remote image.')
  const entry: UrlCacheEntry = { sourceUrl: source.url, assetId: uploaded.id, updatedAt: new Date().toISOString() }
  cache.entries = [...cache.entries.filter((item) => item.sourceUrl !== source.url), entry].slice(-32)
  await api.userStorage.setJson(URL_CACHE_PATH, cache, { indent: 2, userId })
  const resolved = await getStoredImage(api, { kind: 'asset', assetId: uploaded.id }, userId)
  return { ...resolved, sourceKind: 'url', sourceLabel: SOURCE_LABELS.url }
}

/** The only boundary that translates a persisted PocketImageSource into something renderable. */
export async function resolvePocketImageSource(api: ImageApi, source: PocketImageSource | null, userId?: string): Promise<PocketResolvedImage> {
  if (!source) return empty()
  try {
    if (source.kind === 'url') return await resolveRemoteUrl(api, source, userId)
    return await getStoredImage(api, source, userId)
  } catch (error) {
    return failure(source, error)
  }
}

export function assertPocketImageResolved(result: PocketResolvedImage): void {
  if (result.status !== 'ready' || !result.url) throw new Error(result.error || 'Pocket could not resolve that image.')
}
