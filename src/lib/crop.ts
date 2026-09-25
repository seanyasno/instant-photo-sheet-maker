import type { Rect } from '#/lib/layout'

export type Rotation = 0 | 90 | 180 | 270

/**
 * A user-chosen crop. `area` is in pixels of the image *after* rotating it
 * clockwise by `rotation` (the same space react-easy-crop reports in).
 * `aspect` records which cell aspect it was made for.
 */
export interface Crop {
  rotation: Rotation
  aspect: number
  area: Rect
}

export function nextRotation(r: Rotation): Rotation {
  return ((r + 90) % 360) as Rotation
}

export function rotatedSize(
  w: number,
  h: number,
  rotation: Rotation,
): { w: number; h: number } {
  return rotation === 90 || rotation === 270 ? { w: h, h: w } : { w, h }
}

/** Largest centred rect of `aspect` (w/h) inside the rotated image. */
export function coverCrop(
  imgW: number,
  imgH: number,
  rotation: Rotation,
  aspect: number,
): Rect {
  const { w: rw, h: rh } = rotatedSize(imgW, imgH, rotation)
  if (rw / rh > aspect) {
    const w = rh * aspect
    return { x: (rw - w) / 2, y: 0, w, h: rh }
  }
  const h = rw / aspect
  return { x: 0, y: (rh - h) / 2, w: rw, h }
}

/** Canvas `transform(a, b, c, d, e, f)` mapping original image px → rotated image px. */
export function rotationMatrix(
  rotation: Rotation,
  w: number,
  h: number,
): [number, number, number, number, number, number] {
  switch (rotation) {
    case 0:
      return [1, 0, 0, 1, 0, 0]
    case 90:
      return [0, 1, -1, 0, h, 0]
    case 180:
      return [-1, 0, 0, -1, w, h]
    case 270:
      return [0, -1, 1, 0, 0, w]
  }
}

const ASPECT_TOLERANCE = 1e-3

/** The crop to use for a cell: the stored one if it matches the aspect, else cover-fit. */
export function effectiveCrop(
  crop: Crop | undefined,
  imgW: number,
  imgH: number,
  aspect: number,
): Crop {
  if (crop && Math.abs(crop.aspect - aspect) < ASPECT_TOLERANCE) return crop
  const rotation = crop?.rotation ?? 0
  return { rotation, aspect, area: coverCrop(imgW, imgH, rotation, aspect) }
}
