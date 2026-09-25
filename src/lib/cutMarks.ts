import type { Rect } from '#/lib/layout'

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

type Interval = [number, number]

const EPS = 1e-6

function uniqueSorted(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.filter((v, i) => i === 0 || v - (sorted[i - 1] ?? v) > EPS)
}

/** Parts of [from, to] not covered by any of `blocked`. */
function freeIntervals(
  from: number,
  to: number,
  blocked: Interval[],
): Interval[] {
  const free: Interval[] = []
  let cursor = from
  for (const [a, b] of [...blocked].sort((p, q) => p[0] - q[0])) {
    if (a > cursor + EPS) free.push([cursor, Math.min(a, to)])
    cursor = Math.max(cursor, b)
    if (cursor >= to) break
  }
  if (cursor < to - EPS) free.push([cursor, to])
  return free.filter(([a, b]) => b - a > EPS)
}

/**
 * Cut marks for a set of cut rectangles: every rect edge is extended as a line,
 * drawn only where it doesn't cross a rect: into the outer margin (up to
 * `length`) and fully across gutters. Everything stays inside `bounds` (the safe area).
 */
export function cutMarkSegments(
  rects: Rect[],
  bounds: Rect,
  length: number,
): Segment[] {
  if (rects.length === 0) return []
  const segments: Segment[] = []

  const top = Math.min(...rects.map((r) => r.y))
  const bottom = Math.max(...rects.map((r) => r.y + r.h))
  const left = Math.min(...rects.map((r) => r.x))
  const right = Math.max(...rects.map((r) => r.x + r.w))

  const yFrom = Math.max(bounds.y, top - length)
  const yTo = Math.min(bounds.y + bounds.h, bottom + length)
  for (const x of uniqueSorted(rects.flatMap((r) => [r.x, r.x + r.w]))) {
    const blocked = rects
      .filter((r) => x >= r.x - EPS && x <= r.x + r.w + EPS)
      .map((r): Interval => [r.y, r.y + r.h])
    for (const [a, b] of freeIntervals(yFrom, yTo, blocked)) {
      segments.push({ x1: x, y1: a, x2: x, y2: b })
    }
  }

  const xFrom = Math.max(bounds.x, left - length)
  const xTo = Math.min(bounds.x + bounds.w, right + length)
  for (const y of uniqueSorted(rects.flatMap((r) => [r.y, r.y + r.h]))) {
    const blocked = rects
      .filter((r) => y >= r.y - EPS && y <= r.y + r.h + EPS)
      .map((r): Interval => [r.x, r.x + r.w])
    for (const [a, b] of freeIntervals(xFrom, xTo, blocked)) {
      segments.push({ x1: a, y1: y, x2: b, y2: y })
    }
  }

  return segments
}

export interface CutLine {
  axis: 'vertical' | 'horizontal'
  /** Distance from the sheet's left (vertical) or top (horizontal) edge, mm. */
  at: number
}

/**
 * Guillotine cut order for a grid of cards: every vertical line edge-to-edge
 * first, then every horizontal line. Grids from `computeLayout` are always
 * guillotine-cuttable, so full-length lines never cross a card.
 */
export function cutPlan(rects: Rect[]): CutLine[] {
  const xs = uniqueSorted(rects.flatMap((r) => [r.x, r.x + r.w]))
  const ys = uniqueSorted(rects.flatMap((r) => [r.y, r.y + r.h]))
  return [
    ...xs.map((at): CutLine => ({ axis: 'vertical', at })),
    ...ys.map((at): CutLine => ({ axis: 'horizontal', at })),
  ]
}
