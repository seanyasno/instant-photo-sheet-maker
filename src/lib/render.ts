import { CUT_MARK_LENGTH_MM, CUT_MARK_WIDTH_MM } from '#/config/dimensions'
import { effectiveCrop, rotationMatrix } from '#/lib/crop'
import type { Crop } from '#/lib/crop'
import { cutMarkSegments, cutPlan } from '#/lib/cutMarks'
import type { SheetGeometry } from '#/lib/geometry'
import type { Rect } from '#/lib/layout'
import type { Settings } from '#/state/types'

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export interface SheetPhoto {
  bitmap: ImageBitmap
  crop?: Crop
}

/** Screen-only helpers. Export passes all `false`, so it prints exactly the preview minus these. */
export interface Overlays {
  cutGuides: boolean
  safeMargin: boolean
  placeholders: boolean
  /** Full-length numbered cut lines with their distance from the sheet edge. */
  cutLayout: boolean
}

export const NO_OVERLAYS: Overlays = {
  cutGuides: false,
  safeMargin: false,
  placeholders: false,
  cutLayout: false,
}

export interface RenderArgs {
  geometry: SheetGeometry
  /** Photo for each slot, in slot order. Missing entries are empty slots. */
  photos: readonly (SheetPhoto | undefined)[]
  settings: Settings
  /** Output pixels per millimetre. 300 DPI ≈ 11.811. */
  scale: number
  overlays: Overlays
}

/** Snap a mm rect to whole output pixels (each edge rounds independently, so size error ≤ 1 px). */
function toPx(r: Rect, s: number): Rect {
  const x = Math.round(r.x * s)
  const y = Math.round(r.y * s)
  return {
    x,
    y,
    w: Math.round((r.x + r.w) * s) - x,
    h: Math.round((r.y + r.h) * s) - y,
  }
}

/**
 * Draw a photo into `rect` (sheet px), upright relative to its card: when the
 * card is turned 90° clockwise on the sheet, the photo turns with it.
 * `aspect` is the card-frame w/h from the mm geometry (pixel snapping drifts).
 */
function drawPhoto(
  ctx: Ctx2D,
  photo: SheetPhoto,
  rect: Rect,
  rotated: boolean,
  aspect: number,
) {
  const { bitmap } = photo
  const crop = effectiveCrop(photo.crop, bitmap.width, bitmap.height, aspect)
  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.w, rect.h)
  ctx.clip()
  // Card space: origin at the card-frame top-left, x right, y down.
  let w = rect.w
  let h = rect.h
  if (rotated) {
    ctx.translate(rect.x + rect.w, rect.y)
    ctx.rotate(Math.PI / 2)
    ;[w, h] = [h, w]
  } else {
    ctx.translate(rect.x, rect.y)
  }
  ctx.scale(w / crop.area.w, h / crop.area.h)
  ctx.translate(-crop.area.x, -crop.area.y)
  ctx.transform(...rotationMatrix(crop.rotation, bitmap.width, bitmap.height))
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0)
  ctx.restore()
}

/**
 * The one sheet renderer. Preview and export both call this; only `scale` and
 * `overlays` differ.
 */
export function renderSheet(ctx: Ctx2D, args: RenderArgs): void {
  const { geometry, photos, settings, scale: s, overlays } = args
  const { sheet, safeArea, slots } = geometry

  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, Math.round(sheet.w * s), Math.round(sheet.h * s))

  slots.forEach((slot, i) => {
    const photo = photos[i]
    // Empty slots print nothing (no ink wasted on blank frames); the preview shows a placeholder.
    if (!photo && !overlays.placeholders) return
    const card = toPx(slot.cell, s)
    ctx.fillStyle = settings.borderColor === 'black' ? '#000000' : '#ffffff'
    ctx.fillRect(card.x, card.y, card.w, card.h)
    const image = toPx(slot.image, s)
    if (photo) {
      drawPhoto(ctx, photo, image, slot.cell.rotated, geometry.imageAspect)
    } else if (overlays.placeholders) {
      ctx.fillStyle = '#e4e4e7'
      ctx.fillRect(image.x, image.y, image.w, image.h)
    }
  })

  if (settings.cutMarks) {
    const lw = Math.max(1, Math.round(CUT_MARK_WIDTH_MM * s))
    ctx.fillStyle = '#000000'
    // Export marks only filled slots; the preview marks every slot.
    const marked = slots.filter((_, i) => photos[i] || overlays.placeholders)
    const segments = cutMarkSegments(
      marked.map((sl) => sl.cell),
      safeArea,
      CUT_MARK_LENGTH_MM,
    )
    for (const seg of segments) {
      const x1 = Math.round(seg.x1 * s)
      const y1 = Math.round(seg.y1 * s)
      const x2 = Math.round(seg.x2 * s)
      const y2 = Math.round(seg.y2 * s)
      // Centre the line on the cut; it only ever sits in gutters and margins.
      if (x1 === x2) ctx.fillRect(x1 - Math.floor(lw / 2), y1, lw, y2 - y1)
      else ctx.fillRect(x1, y1 - Math.floor(lw / 2), x2 - x1, lw)
    }
  }

  const hairline = Math.max(1, s * 0.15)
  if (overlays.cutGuides) {
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.9)'
    ctx.lineWidth = hairline
    ctx.setLineDash([hairline * 4, hairline * 3])
    for (const slot of slots) {
      const r = toPx(slot.cell, s)
      ctx.strokeRect(r.x, r.y, r.w, r.h)
    }
  }

  if (overlays.safeMargin) {
    const r = toPx(safeArea, s)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)'
    ctx.lineWidth = hairline
    ctx.setLineDash([hairline * 2, hairline * 2])
    ctx.strokeRect(r.x, r.y, r.w, r.h)
  }

  if (overlays.cutLayout) drawCutLayout(ctx, geometry, s)
  ctx.restore()
}

/** Screen-only: every guillotine cut as a full-length line, numbered in cut order. */
function drawCutLayout(ctx: Ctx2D, geometry: SheetGeometry, s: number) {
  const { sheet, slots } = geometry
  const W = Math.round(sheet.w * s)
  const H = Math.round(sheet.h * s)
  const lines = cutPlan(slots.map((sl) => sl.cell))
  const font = Math.max(10, 3.2 * s)
  ctx.save()
  ctx.setLineDash([])
  ctx.lineWidth = Math.max(1, s * 0.25)
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)'
  ctx.font = `600 ${font}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  lines.forEach((line, i) => {
    const p = Math.round(line.at * s)
    ctx.beginPath()
    if (line.axis === 'vertical') {
      ctx.moveTo(p, 0)
      ctx.lineTo(p, H)
    } else {
      ctx.moveTo(0, p)
      ctx.lineTo(W, p)
    }
    ctx.stroke()
    const label = `${i + 1} · ${line.at.toFixed(1)}`
    const tw = ctx.measureText(label).width + font * 0.6
    const th = font * 1.4
    // Vertical labels stagger top/bottom so neighbours across a gutter don't overlap.
    const [lx, ly] =
      line.axis === 'vertical'
        ? [p - tw / 2, i % 2 === 0 ? th * 0.2 : H - th * 1.2]
        : [i % 2 === 0 ? th * 0.2 : W - tw - th * 0.2, p - th / 2]
    ctx.fillStyle = 'rgba(220, 38, 38, 0.95)'
    ctx.fillRect(lx, ly, tw, th)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, lx + font * 0.3, ly + th / 2)
  })
  ctx.restore()
}
