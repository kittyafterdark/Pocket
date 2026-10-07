export const GALLERY_PAGE_SIZE = 48

export function galleryOffset(value: unknown): number {
  const offset = Number(value)
  return Number.isFinite(offset) ? Math.max(0, Math.min(1_000_000, Math.floor(offset))) : 0
}
