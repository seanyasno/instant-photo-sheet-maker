import { zipSync } from 'fflate'
import { DPI, JPEG_QUALITY } from '#/config/dimensions'
import { NO_OVERLAYS, renderSheet } from '#/lib/render'
import type { RenderArgs } from '#/lib/render'
import { mmToPx, pxPerMm } from '#/lib/units'

export type ExportFormat = 'jpeg' | 'png'

/** Render one sheet at print resolution (300 DPI → 1800×1200 for 4×6). */
export async function exportSheet(
  args: Omit<RenderArgs, 'scale' | 'overlays'>,
  format: ExportFormat,
): Promise<Blob> {
  const { sheet } = args.geometry
  const canvas = new OffscreenCanvas(
    Math.round(mmToPx(sheet.w)),
    Math.round(mmToPx(sheet.h)),
  )
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  renderSheet(ctx, { ...args, scale: pxPerMm(DPI), overlays: NO_OVERLAYS })
  return canvas.convertToBlob(
    format === 'jpeg'
      ? { type: 'image/jpeg', quality: JPEG_QUALITY }
      : { type: 'image/png' },
  )
}

export function sheetFileName(index: number, format: ExportFormat): string {
  return `instax-sheet-${String(index + 1).padStart(2, '0')}.${format === 'jpeg' ? 'jpg' : 'png'}`
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function zipFiles(
  files: { name: string; blob: Blob }[],
): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {}
  for (const f of files)
    entries[f.name] = new Uint8Array(await f.blob.arrayBuffer())
  // Images are already compressed; store only.
  const zipped = zipSync(entries, { level: 0 })
  return new Blob([zipped.slice().buffer], { type: 'application/zip' })
}
