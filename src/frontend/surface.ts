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

export function applyPhoneSurface(widget: SpindleFloatWidgetHandle, scale: number): PhoneSurfaceGeometry {
  const geometry = calculatePhoneSurface(scale)
  widget.setFullscreen(geometry.fullscreen)
  if (!geometry.fullscreen) {
    widget.setSize(geometry.width, geometry.height)
    widget.moveTo(geometry.x, geometry.y)
  }
  return geometry
}
