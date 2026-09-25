import { describe, expect, it } from 'vitest'
import { CUT_MARK_LENGTH_MM, FORMATS, FORMAT_IDS } from '#/config/dimensions'
import type { FormatId } from '#/config/dimensions'
import { imageRectInCard } from '#/lib/card'
import { cutMarkSegments, cutPlan } from '#/lib/cutMarks'
import { sheetGeometry } from '#/lib/geometry'
import type { Rect } from '#/lib/layout'
import { DEFAULT_SETTINGS } from '#/state/reducer'
import type { Orientation, Settings } from '#/state/types'

const settings = (patch: Partial<Settings>): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

/** `inner` within `outer` shrunk by `e` on every side (negative `e` grows it). */
function strictlyInside(inner: Rect, outer: Rect, e: number) {
  return (
    inner.x > outer.x + e &&
    inner.y > outer.y + e &&
    inner.x + inner.w < outer.x + outer.w - e &&
    inner.y + inner.h < outer.y + outer.h - e
  )
}

function inside(inner: Rect, outer: Rect) {
  return strictlyInside(inner, outer, -1e-9)
}

describe('film formats', () => {
  it.each(FORMAT_IDS)('%s: photo window fits inside the card', (id) => {
    const { card, image, imageOffset } = FORMATS[id]
    expect(imageOffset.x).toBeGreaterThan(0)
    expect(imageOffset.y).toBeGreaterThan(0)
    expect(imageOffset.x + image.w).toBeLessThan(card.w)
    expect(imageOffset.y + image.h).toBeLessThan(card.h)
  })

  it('Instax Mini: 4 mm sides, 6 mm top, 18 mm bottom', () => {
    const r = imageRectInCard(
      { index: 0, x: 10, y: 20, w: 54, h: 86, rotated: false },
      FORMATS['instax-mini'],
    )
    expect(r).toEqual({ x: 14, y: 26, w: 46, h: 62 })
  })

  it('rotated card: thick border on the left', () => {
    const r = imageRectInCard(
      { index: 0, x: 10, y: 20, w: 86, h: 54, rotated: true },
      FORMATS['instax-mini'],
    )
    expect(r).toEqual({ x: 28, y: 24, w: 62, h: 46 })
    expect(10 + 86 - (r.x + r.w)).toBe(6)
  })

  it('Wide (Vertical) is Wide turned clockwise: portrait photo, chin on the left', () => {
    const v = FORMATS['instax-wide-vertical']
    const h = FORMATS['instax-wide']
    expect(v.card).toEqual({ w: h.card.h, h: h.card.w })
    expect(v.image).toEqual({ w: h.image.h, h: h.image.w })
    expect(v.imageOffset.x).toBe(h.card.h - h.imageOffset.y - h.image.h)
    expect(v.imageOffset.y).toBe(h.imageOffset.x)
  })
})

describe('sheetGeometry', () => {
  const expected: Record<FormatId, Record<Orientation, number>> = {
    'instax-mini': { landscape: 2, portrait: 2 },
    'instax-square': { landscape: 2, portrait: 2 },
    'instax-wide': { landscape: 1, portrait: 1 },
    'instax-wide-vertical': { landscape: 1, portrait: 1 },
    'polaroid-go': { landscape: 2, portrait: 2 },
    polaroid: { landscape: 1, portrait: 1 },
  }

  for (const format of FORMAT_IDS) {
    for (const orientation of ['landscape', 'portrait'] as const) {
      it(`${format} on ${orientation}: ${expected[format][orientation]} per sheet, all inside the safe area`, () => {
        const g = sheetGeometry(settings({ format, orientation }))
        expect(g.slots).toHaveLength(expected[format][orientation])
        const { card, image } = FORMATS[format]
        for (const s of g.slots) {
          expect([s.cell.w, s.cell.h].sort()).toEqual([card.w, card.h].sort())
          expect([s.image.w, s.image.h].sort()).toEqual(
            [image.w, image.h].sort(),
          )
          expect(inside(s.image, s.cell)).toBe(true)
          expect(inside(s.cell, g.safeArea)).toBe(true)
        }
      })
    }
  }
})

describe('crop aspect follows the upright card', () => {
  it('Wide (Vertical) on landscape: card turned on the sheet, crop stays portrait', () => {
    const g = sheetGeometry(
      settings({ format: 'instax-wide-vertical', orientation: 'landscape' }),
    )
    expect(g.slots[0]!.cell.rotated).toBe(true)
    expect(g.imageAspect).toBeCloseTo(62 / 99)
  })

  it('Instax Mini keeps a portrait crop on either sheet orientation', () => {
    for (const orientation of ['landscape', 'portrait'] as const) {
      const g = sheetGeometry(settings({ orientation }))
      expect(g.imageAspect).toBeCloseTo(46 / 62)
    }
  })
})

describe('cutMarkSegments', () => {
  for (const format of FORMAT_IDS) {
    for (const orientation of ['landscape', 'portrait'] as const) {
      it(`${format}/${orientation}: marks never enter a card and stay in the safe area`, () => {
        const g = sheetGeometry(settings({ format, orientation }))
        const rects = g.slots.map((s) => s.cell)
        const segs = cutMarkSegments(rects, g.safeArea, CUT_MARK_LENGTH_MM)
        expect(segs.length).toBeGreaterThan(0)
        for (const s of segs) {
          for (let t = 0; t <= 1; t += 0.05) {
            const x = s.x1 + (s.x2 - s.x1) * t
            const y = s.y1 + (s.y2 - s.y1) * t
            const pt = { x, y, w: 0, h: 0 }
            expect(strictlyInside(pt, g.safeArea, -1e-9)).toBe(true)
            for (const r of rects)
              expect(strictlyInside(pt, r, 1e-6)).toBe(false)
          }
        }
      })
    }
  }

  it('2×2 grid: marks every cut line, including across gutters', () => {
    const cells = [0, 1, 2, 3].map((i) => ({
      x: 10 + (i % 2) * 64,
      y: 5 + Math.floor(i / 2) * 48,
      w: 62,
      h: 46,
    }))
    const bounds = { x: 2, y: 2, w: 148.4, h: 97.6 }
    const segs = cutMarkSegments(cells, bounds, CUT_MARK_LENGTH_MM)
    const xs = new Set(segs.filter((s) => s.x1 === s.x2).map((s) => s.x1))
    const ys = new Set(segs.filter((s) => s.y1 === s.y2).map((s) => s.y1))
    expect(xs.size).toBe(4)
    expect(ys.size).toBe(4)
    const gutter = segs.filter(
      (s) => s.x1 === s.x2 && Math.abs(s.y2 - s.y1 - 2) < 1e-9,
    )
    expect(gutter).toHaveLength(4)
  })

  it('empty input', () => {
    expect(cutMarkSegments([], { x: 0, y: 0, w: 10, h: 10 }, 3)).toEqual([])
  })
})

describe('cutPlan', () => {
  it('Instax Mini landscape: 4 vertical cuts then 2 horizontal, in order', () => {
    const g = sheetGeometry(settings({}))
    const plan = cutPlan(g.slots.map((s) => s.cell))
    expect(plan.map((l) => l.axis)).toEqual([
      'vertical',
      'vertical',
      'vertical',
      'vertical',
      'horizontal',
      'horizontal',
    ])
    const v = plan.filter((l) => l.axis === 'vertical').map((l) => l.at)
    expect(v).toEqual([...v].sort((a, b) => a - b))
    expect(v[1]! - v[0]!).toBeCloseTo(54)
    expect(v[2]! - v[1]!).toBeCloseTo(2) // gutter
    const h = plan.filter((l) => l.axis === 'horizontal').map((l) => l.at)
    expect(h[1]! - h[0]!).toBeCloseTo(86)
  })

  it('full-length cuts never cross a card (guillotine-safe)', () => {
    for (const format of FORMAT_IDS) {
      for (const orientation of ['landscape', 'portrait'] as const) {
        const cells = sheetGeometry(
          settings({ format, orientation }),
        ).slots.map((s) => s.cell)
        for (const line of cutPlan(cells)) {
          for (const c of cells) {
            const [lo, hi] =
              line.axis === 'vertical' ? [c.x, c.x + c.w] : [c.y, c.y + c.h]
            expect(line.at > lo + 1e-6 && line.at < hi - 1e-6).toBe(false)
          }
        }
      }
    }
  })
})
