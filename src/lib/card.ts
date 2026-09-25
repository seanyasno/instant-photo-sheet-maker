import type { FilmFormat } from '#/config/dimensions'
import type { Cell, Rect } from '#/lib/layout'

/**
 * Where the photo window sits inside a card cell. A rotated cell holds the card
 * turned 90° clockwise, so its thick bottom border ends up on the left.
 */
export function imageRectInCard(cell: Cell, format: FilmFormat): Rect {
  const { card, image, imageOffset } = format
  if (!cell.rotated) {
    return {
      x: cell.x + imageOffset.x,
      y: cell.y + imageOffset.y,
      w: image.w,
      h: image.h,
    }
  }
  // Clockwise 90°: card-top → sheet-right, card-left → sheet-top.
  const bottom = card.h - imageOffset.y - image.h
  return {
    x: cell.x + bottom,
    y: cell.y + imageOffset.x,
    w: image.h,
    h: image.w,
  }
}
