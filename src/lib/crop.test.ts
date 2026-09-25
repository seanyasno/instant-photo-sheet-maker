import { describe, expect, it } from 'vitest'
import {
  coverCrop,
  effectiveCrop,
  nextRotation,
  rotatedSize,
  rotationMatrix,
} from '#/lib/crop'
import type { Rotation } from '#/lib/crop'

function apply(m: ReturnType<typeof rotationMatrix>, x: number, y: number) {
  const [a, b, c, d, e, f] = m
  return [a * x + c * y + e, b * x + d * y + f]
}

describe('coverCrop', () => {
  it('wide image, landscape cell: crops the sides', () => {
    const r = coverCrop(4000, 2000, 0, 62 / 46)
    expect(r.h).toBe(2000)
    expect(r.w / r.h).toBeCloseTo(62 / 46)
    expect(r.x).toBeCloseTo((4000 - r.w) / 2)
    expect(r.y).toBe(0)
  })
  it('tall image: crops top and bottom', () => {
    const r = coverCrop(1000, 3000, 0, 62 / 46)
    expect(r.w).toBe(1000)
    expect(r.w / r.h).toBeCloseTo(62 / 46)
    expect(r.y).toBeCloseTo((3000 - r.h) / 2)
  })
  it('works in rotated space', () => {
    const r = coverCrop(1000, 3000, 90, 62 / 46) // rotated: 3000×1000
    expect(r.h).toBe(1000)
    expect(r.x + r.w).toBeLessThanOrEqual(3000)
  })
})

describe('rotation', () => {
  it('cycles', () => {
    expect([0, 90, 180, 270].map((r) => nextRotation(r as Rotation))).toEqual([
      90, 180, 270, 0,
    ])
  })
  it('matrix maps image corners onto the rotated bounding box', () => {
    const w = 400
    const h = 300
    for (const rot of [0, 90, 180, 270] as const) {
      const m = rotationMatrix(rot, w, h)
      const size = rotatedSize(w, h, rot)
      const pts = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ].map(([x, y]) => apply(m, x!, y!))
      const xs = pts.map((p) => p[0]!)
      const ys = pts.map((p) => p[1]!)
      expect(Math.min(...xs)).toBeCloseTo(0)
      expect(Math.max(...xs)).toBeCloseTo(size.w)
      expect(Math.min(...ys)).toBeCloseTo(0)
      expect(Math.max(...ys)).toBeCloseTo(size.h)
    }
  })
  it('90° is clockwise: image top-left lands at top-right', () => {
    expect(apply(rotationMatrix(90, 400, 300), 0, 0)).toEqual([300, 0])
  })
})

describe('effectiveCrop', () => {
  it('keeps a matching crop', () => {
    const crop = {
      rotation: 90 as const,
      aspect: 1.5,
      area: { x: 1, y: 2, w: 3, h: 2 },
    }
    expect(effectiveCrop(crop, 100, 100, 1.5)).toBe(crop)
  })
  it('falls back to cover-fit (keeping rotation) when the aspect changed', () => {
    const crop = {
      rotation: 90 as const,
      aspect: 1.5,
      area: { x: 1, y: 2, w: 3, h: 2 },
    }
    const e = effectiveCrop(crop, 100, 200, 0.5)
    expect(e.rotation).toBe(90)
    expect(e.area).toEqual(coverCrop(100, 200, 90, 0.5))
  })
})
