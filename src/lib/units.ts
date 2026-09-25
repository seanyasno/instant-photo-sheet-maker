import { DPI, MM_PER_INCH } from '#/config/dimensions'

export function mmToPx(mm: number, dpi: number = DPI): number {
  return (mm / MM_PER_INCH) * dpi
}

/** Pixels per millimetre at the given DPI. */
export function pxPerMm(dpi: number = DPI): number {
  return dpi / MM_PER_INCH
}
