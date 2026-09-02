import type { SpindleFloatWidgetHandle } from 'lumiverse-spindle-types'

export const PHONE_ASPECT = 9 / 16
export const PHONE_BASE_WIDTH = 360
export const PHONE_SCALE_MIN = 0.8
export const PHONE_SCALE_MAX = 1.25

export interface SurfaceViewport { width: number; height: number }
export interface PhoneSurfaceGeometry extends SurfaceViewport { fullscreen: boolean; x: number; y: number }

export function currentViewport(): SurfaceViewport {
  const visual = window.visualViewport
  return {
    width: Math.max(1, Math.floor(visual?.width || window.innerWidth)),
    height: Math.max(1, Math.floor(visual?.height || window.innerHeight)),
  }
}

export function calculatePhoneSurface(scale: number, viewport = currentViewport(), allowFullscreen = true): PhoneSurfaceGeometry {
  const normalizedScale = Math.max(PHONE_SCALE_MIN, Math.min(PHONE_SCALE_MAX, Number(scale) || 1))
  const fullscreen = allowFullscreen && (viewport.width <= 720 || viewport.height <= 540)
  if (fullscreen) return { ...viewport, fullscreen: true, x: 0, y: 0 }
  const margin = 24
  const desiredWidth = PHONE_BASE_WIDTH * normalizedScale
  const width = Math.max(240, Math.floor(Math.min(desiredWidth, viewport.width - margin, (viewport.height - margin) * PHONE_ASPECT)))
  const height = Math.floor(width / PHONE_ASPECT)
  return {
    width,
    height,
    fullscreen: false,
    x: Math.max(12, Math.floor(viewport.width - width - 18)),
    y: Math.max(12, Math.floor((viewport.height - height) / 2)),
  }
}

/** Only the dedicated fullscreen handset float is resized here. Desktop handsets live in an interactive dock. */
export function applyMobilePhoneSurface(widget: SpindleFloatWidgetHandle, scale: number): PhoneSurfaceGeometry {
  const geometry = calculatePhoneSurface(scale)
  if (widget.isFullscreen() !== geometry.fullscreen) widget.setFullscreen(geometry.fullscreen)
  if (!geometry.fullscreen) {
    widget.setSize(geometry.width, geometry.height)
    widget.moveTo(geometry.x, geometry.y)
  }
  return geometry
}

/** Size the handset to the visual viewport without resizing the fullscreen host while an IME is open. */
export function applyVisualViewportSurface(host: HTMLElement): SurfaceViewport & { offsetLeft: number; offsetTop: number } {
  const visual = window.visualViewport
  const width = Math.max(1, Math.round(visual?.width || window.innerWidth))
  const height = Math.max(1, Math.round(visual?.height || window.innerHeight))
  const offsetLeft = Math.round(visual?.offsetLeft || 0)
  const offsetTop = Math.round(visual?.offsetTop || 0)
  host.style.width = `${width}px`
  host.style.height = `${height}px`
  host.style.position = 'absolute'
  host.style.left = '0'
  host.style.top = '0'
  host.style.transform = `translate3d(${offsetLeft}px,${offsetTop}px,0)`
  host.style.margin = '0'
  host.style.setProperty('--lp-visual-height', `${height}px`)
  return { width, height, offsetLeft, offsetTop }
}

export function clearVisualViewportSurface(host: HTMLElement): void {
  for (const property of ['width', 'height', 'position', 'left', 'top', 'transform', 'margin']) host.style.removeProperty(property)
  host.style.removeProperty('--lp-visual-height')
}

export function desktopDockSize(scale: number, viewport = currentViewport()): number {
  const geometry = calculatePhoneSurface(scale, viewport, false)
  return Math.min(viewport.width - 40, Math.max(geometry.width + 32, 292))
}
