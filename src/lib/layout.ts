import type { Size } from '#/config/dimensions'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** A slot on the sheet, in mm. `rotated` means the canonical (portrait) cell is turned 90°. */
export interface Cell extends Rect {
  index: number
  rotated: boolean
}

const EPS = 1e-9

/** How many items of `size` fit in `avail`, with `gap` between neighbours. */
export function fitCount(avail: number, size: number, gap: number): number {
  if (size <= 0 || avail < size - EPS) return 0
  return Math.floor((avail + gap) / (size + gap) + EPS)
}

/**
 * Lay out a uniform grid of `cell`-sized slots on `sheet`, keeping everything
 * inside `margin` and `gap` apart. Tries the cell as-is and rotated 90° and keeps
 * whichever fits more (ties keep the unrotated cell). The grid is centred in the
 * safe area and cells come back in reading order.
 */
export function computeLayout(
  sheet: Size,
  cell: Size,
  gap: number,
  margin: number,
): Cell[] {
  const avail = { w: sheet.w - 2 * margin, h: sheet.h - 2 * margin }
  if (avail.w <= 0 || avail.h <= 0) return []

  const options = [
    { size: cell, rotated: false },
    { size: { w: cell.h, h: cell.w }, rotated: true },
  ].map((o) => {
    const cols = fitCount(avail.w, o.size.w, gap)
    const rows = fitCount(avail.h, o.size.h, gap)
    return { ...o, cols, rows, count: cols * rows }
  })

  const best = options.reduce((a, b) => (b.count > a.count ? b : a))
  if (best.count === 0) return []

  const { size, cols, rows, rotated } = best
  const gridW = cols * size.w + (cols - 1) * gap
  const gridH = rows * size.h + (rows - 1) * gap
  const x0 = margin + (avail.w - gridW) / 2
  const y0 = margin + (avail.h - gridH) / 2

  const cells: Cell[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        index: cells.length,
        x: x0 + c * (size.w + gap),
        y: y0 + r * (size.h + gap),
        w: size.w,
        h: size.h,
        rotated,
      })
    }
  }
  return cells
}

/** Split `items` into consecutive pages of `perPage` (always at least one page). */
export function paginate<T>(items: readonly T[], perPage: number): T[][] {
  if (perPage <= 0 || items.length === 0) return [[]]
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += perPage)
    pages.push(items.slice(i, i + perPage))
  return pages
}

export function orientSheet(
  sheet: Size,
  orientation: 'landscape' | 'portrait',
): Size {
  const long = Math.max(sheet.w, sheet.h)
  const short = Math.min(sheet.w, sheet.h)
  return orientation === 'landscape'
    ? { w: long, h: short }
    : { w: short, h: long }
}

export function rectContains(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}
