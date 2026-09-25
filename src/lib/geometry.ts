import { FORMATS, SHEET_MM } from '#/config/dimensions'
import type { Size } from '#/config/dimensions'
import { imageRectInCard } from '#/lib/card'
import { computeLayout, orientSheet } from '#/lib/layout'
import type { Cell, Rect } from '#/lib/layout'
import type { Settings } from '#/state/types'

export interface SlotGeometry {
  /** The card outline — what you cut along. */
  cell: Cell
  /** Where the photo goes. */
  image: Rect
}

export interface SheetGeometry {
  sheet: Size
  safeArea: Rect
  slots: SlotGeometry[]
  /** w/h of the photo window as seen on the upright card (the crop aspect). */
  imageAspect: number
}

/** Everything that depends only on settings (not on photos), in mm. */
export function sheetGeometry(settings: Settings): SheetGeometry {
  const format = FORMATS[settings.format]
  const sheet = orientSheet(SHEET_MM, settings.orientation)
  const m = settings.safeMarginMm
  const safeArea = { x: m, y: m, w: sheet.w - 2 * m, h: sheet.h - 2 * m }
  const cells = computeLayout(sheet, format.card, settings.gapMm, m)
  const slots = cells.map((cell) => ({
    cell,
    image: imageRectInCard(cell, format),
  }))
  const imageAspect = format.image.w / format.image.h
  return { sheet, safeArea, slots, imageAspect }
}
