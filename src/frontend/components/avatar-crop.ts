import { normalizeAvatarFocus } from '../../domain/contacts.js'

/** Same cover/position geometry as the circular preview, baked into a square asset. */
export function avatarCropRect(width: number, height: number, focus: { x: number; y: number }) {
  if (!(width > 0 && height > 0)) throw new Error('The photo has no usable dimensions.')
  const position = normalizeAvatarFocus(focus)
  const size = Math.min(width, height)
  return { x: (width - size) * position.x / 100, y: (height - size) * position.y / 100, size }
}

export async function cropAvatarPhoto(url: string, focus: { x: number; y: number }): Promise<string> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = url
  await image.decode()
  const crop = avatarCropRect(image.naturalWidth, image.naturalHeight, focus)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.min(512, crop.size)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Avatar framing is unavailable in this browser.')
  context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}
