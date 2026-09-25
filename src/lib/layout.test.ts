import { describe, expect, it } from 'vitest'
import { FORMATS, SHEET_MM } from '#/config/dimensions'
import { computeLayout, fitCount, orientSheet, paginate } from '#/lib/layout'
import type { Cell } from '#/lib/layout'
import { mmToPx } from '#/lib/units'

const MINI_CARD = FORMATS['instax-mini'].card
const MINI_WINDOW = FORMATS['instax-mini'].image
const landscape = orientSheet(SHEET_MM, 'landscape')
const portrait = orientSheet(SHEET_MM, 'portrait')

function assertValid(
  cells: Cell[],
  sheet: { w: number; h: number },
  gap: number,
  margin: number,
) {
  const eps = 1e-9
  for (const c of cells) {
    expect(c.x).toBeGreaterThanOrEqual(margin - eps)
    expect(c.y).toBeGreaterThanOrEqual(margin - eps)
    expect(c.x + c.w).toBeLessThanOrEqual(sheet.w - margin + eps)
    expect(c.y + c.h).toBeLessThanOrEqual(sheet.h - margin + eps)
  }
  for (const a of cells) {
    for (const b of cells) {
      if (a === b) continue
      const sepX = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w))
      const sepY = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h))
      // Non-overlapping and at least `gap` apart on some axis.
      expect(Math.max(sepX, sepY)).toBeGreaterThanOrEqual(gap - eps)
    }
  }
}

describe('units', () => {
  it('4×6 in at 300 DPI is exactly 1800×1200', () => {
    expect(mmToPx(152.4)).toBeCloseTo(1800, 9)
    expect(mmToPx(101.6)).toBeCloseTo(1200, 9)
  })
  it('instax sizes in px', () => {
    expect(mmToPx(62)).toBeCloseTo(732.28, 2)
    expect(mmToPx(46)).toBeCloseTo(543.31, 2)
    expect(mmToPx(86)).toBeCloseTo(1015.75, 2)
    expect(mmToPx(54)).toBeCloseTo(637.8, 2)
  })
})

describe('fitCount', () => {
  it('counts with gaps', () => {
    expect(fitCount(148.4, 62, 2)).toBe(2)
    expect(fitCount(126, 62, 2)).toBe(2) // exact fit
    expect(fitCount(125.99, 62, 2)).toBe(1)
    expect(fitCount(10, 62, 2)).toBe(0)
  })
})

describe('computeLayout', () => {
  it('46×62 window on landscape: 4 cells, rotated to 62×46, 2×2', () => {
    const cells = computeLayout(landscape, MINI_WINDOW, 2, 2)
    expect(cells).toHaveLength(4)
    expect(cells.every((c) => c.rotated && c.w === 62 && c.h === 46)).toBe(true)
    expect(new Set(cells.map((c) => c.x)).size).toBe(2)
    assertValid(cells, landscape, 2, 2)
  })

  it('Mini card on landscape: 2 upright', () => {
    const cells = computeLayout(landscape, MINI_CARD, 2, 2)
    expect(cells).toHaveLength(2)
    expect(cells.every((c) => !c.rotated && c.w === 54 && c.h === 86)).toBe(
      true,
    )
    assertValid(cells, landscape, 2, 2)
  })

  it('Mini card on portrait: 2 rotated, stacked', () => {
    const cells = computeLayout(portrait, MINI_CARD, 2, 2)
    expect(cells).toHaveLength(2)
    expect(cells.every((c) => c.rotated && c.w === 86 && c.h === 54)).toBe(true)
    assertValid(cells, portrait, 2, 2)
  })

  it('46×62 window on portrait: 4 cells', () => {
    const cells = computeLayout(portrait, MINI_WINDOW, 2, 2)
    expect(cells).toHaveLength(4)
    assertValid(cells, portrait, 2, 2)
  })

  it('centres the grid in the safe area', () => {
    const cells = computeLayout(landscape, MINI_WINDOW, 2, 2)
    const left = Math.min(...cells.map((c) => c.x))
    const right = Math.max(...cells.map((c) => c.x + c.w))
    expect(left).toBeCloseTo(landscape.w - right, 9)
  })

  it('reading order', () => {
    const cells = computeLayout(landscape, MINI_WINDOW, 2, 2)
    expect(cells.map((c) => c.index)).toEqual([0, 1, 2, 3])
    expect(cells[0]!.y).toBe(cells[1]!.y)
    expect(cells[0]!.x).toBeLessThan(cells[1]!.x)
    expect(cells[2]!.y).toBeGreaterThan(cells[0]!.y)
  })

  it('bigger gap or margin reduces count', () => {
    expect(computeLayout(landscape, MINI_WINDOW, 6, 2).length).toBeLessThan(4)
    expect(computeLayout(landscape, MINI_WINDOW, 2, 4).length).toBeLessThan(4)
  })

  it('returns [] when nothing fits', () => {
    expect(computeLayout(landscape, { w: 200, h: 200 }, 2, 2)).toEqual([])
    expect(computeLayout(landscape, MINI_WINDOW, 2, 60)).toEqual([])
  })

  it('zero gap and margin still valid', () => {
    const cells = computeLayout(landscape, MINI_WINDOW, 0, 0)
    assertValid(cells, landscape, 0, 0)
    expect(cells.length).toBeGreaterThanOrEqual(4)
  })
})

describe('paginate', () => {
  it('splits 5 items into 4 + 1', () => {
    expect(paginate([1, 2, 3, 4, 5], 4)).toEqual([[1, 2, 3, 4], [5]])
  })
  it('always returns at least one page', () => {
    expect(paginate([], 4)).toEqual([[]])
    expect(paginate([1], 0)).toEqual([[]])
  })
})
