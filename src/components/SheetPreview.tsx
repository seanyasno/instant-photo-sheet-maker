import { useEffect, useRef, useState } from 'react'
import type { SheetGeometry } from '#/lib/geometry'
import { rectContains } from '#/lib/layout'
import { renderSheet } from '#/lib/render'
import type { SheetPhoto } from '#/lib/render'
import type { Settings } from '#/state/types'

interface Props {
  geometry: SheetGeometry
  photos: readonly (SheetPhoto | undefined)[]
  settings: Settings
  onSlotClick: (slotIndex: number) => void
}

/** On-screen sheet, drawn by the same `renderSheet` as the export, just at screen scale. */
export function SheetPreview({
  geometry,
  photos,
  settings,
  onSlotClick,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cssWidth, setCssWidth] = useState(0)
  const { sheet } = geometry

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) =>
      setCssWidth(entry?.contentRect.width ?? 0),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || cssWidth === 0) return
    const scale = (cssWidth / sheet.w) * window.devicePixelRatio
    canvas.width = Math.round(sheet.w * scale)
    canvas.height = Math.round(sheet.h * scale)
    renderSheet(ctx, {
      geometry,
      photos,
      settings,
      scale,
      overlays: {
        cutGuides: true,
        safeMargin: settings.showSafeMargin,
        placeholders: true,
        cutLayout: settings.showCutLayout,
      },
    })
  }, [geometry, photos, settings, cssWidth, sheet])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * sheet.w
    const y = ((e.clientY - box.top) / box.height) * sheet.h
    const i = geometry.slots.findIndex((s) => rectContains(s.cell, x, y))
    if (i >= 0 && photos[i]) onSlotClick(i)
  }

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto overflow-hidden rounded-sm shadow-md ring-1 ring-black/10"
      // Same on-screen scale in both orientations: the long edge always spans the column.
      style={{
        aspectRatio: `${sheet.w} / ${sheet.h}`,
        width: `${(100 * sheet.w) / Math.max(sheet.w, sheet.h)}%`,
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="absolute inset-0 block size-full cursor-pointer"
      />
    </div>
  )
}
