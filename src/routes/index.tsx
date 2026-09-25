import { useMemo, useReducer, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Download, FileArchive } from 'lucide-react'
import { CropDialog } from '#/components/CropDialog'
import { CutPlanList } from '#/components/CutPlanList'
import { PhotoStrip } from '#/components/PhotoStrip'
import { SettingsPanel } from '#/components/SettingsPanel'
import { SheetPreview } from '#/components/SheetPreview'
import { UploadDropzone } from '#/components/UploadDropzone'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  downloadBlob,
  exportSheet,
  sheetFileName,
  zipFiles,
} from '#/lib/export'
import type { ExportFormat } from '#/lib/export'
import { sheetGeometry } from '#/lib/geometry'
import { paginate } from '#/lib/layout'
import { bitmapToUrl, isAcceptedImage, loadImage } from '#/lib/loadImage'
import { initialState, reducer } from '#/state/reducer'
import type { Photo } from '#/state/types'

const DECODE_CONCURRENCY = 3

async function loadPhoto(file: File): Promise<Photo> {
  const bitmap = await loadImage(file)
  try {
    const { url } = await bitmapToUrl(bitmap, 240)
    return { id: crypto.randomUUID(), name: file.name, bitmap, thumbUrl: url }
  } catch (err) {
    bitmap.close()
    throw err
  }
}

// Canvas + File APIs only: render purely on the client.
export const Route = createFileRoute('/')({ ssr: false, component: App })

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { photos, settings } = state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingBatches, setPendingBatches] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [format, setFormat] = useState<ExportFormat>('jpeg')
  const [exporting, setExporting] = useState(false)

  const geometry = useMemo(() => sheetGeometry(settings), [settings])
  const perSheet = geometry.slots.length
  const sheets = useMemo(() => paginate(photos, perSheet), [photos, perSheet])
  const editing = photos.find((p) => p.id === editingId) ?? null

  async function addFiles(files: File[]) {
    const accepted = files.filter(isAcceptedImage)
    const rejected = files
      .filter((f) => !isAcceptedImage(f))
      .map((f) => `${f.name}: unsupported type`)
    setPendingBatches((n) => n + 1)
    const added: Photo[] = []
    // A few at a time: each decode briefly holds a full-size bitmap.
    for (let i = 0; i < accepted.length; i += DECODE_CONCURRENCY) {
      const batch = accepted.slice(i, i + DECODE_CONCURRENCY)
      const results = await Promise.allSettled(batch.map(loadPhoto))
      results.forEach((r, j) => {
        if (r.status === 'fulfilled') added.push(r.value)
        else rejected.push(`${batch[j]?.name ?? 'file'}: could not be decoded`)
      })
    }
    dispatch({ type: 'add', photos: added })
    setErrors(rejected)
    setPendingBatches((n) => n - 1)
  }

  function removePhoto(id: string) {
    const p = photos.find((x) => x.id === id)
    if (p) {
      URL.revokeObjectURL(p.thumbUrl)
      p.bitmap.close()
    }
    dispatch({ type: 'remove', id })
  }

  async function download(indices: number[]) {
    setExporting(true)
    try {
      const files = await Promise.all(
        indices.map(async (i) => ({
          name: sheetFileName(i, format),
          blob: await exportSheet(
            { geometry, photos: sheets[i] ?? [], settings },
            format,
          ),
        })),
      )
      const [only] = files
      if (files.length === 1 && only) downloadBlob(only.blob, only.name)
      else downloadBlob(await zipFiles(files), 'instax-sheets.zip')
    } catch (err) {
      setErrors([
        `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      ])
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-muted/40 min-h-screen">
      <header className="bg-background flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="size-10" />
          <div>
            <h1 className="text-lg font-semibold">Instant Photo Sheet Maker</h1>
            <p className="text-muted-foreground text-xs">
              4×6 in · 300 DPI · Canon SELPHY
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={format}
            onValueChange={(v) => setFormat(v === 'png' ? 'png' : 'jpeg')}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
          <Button
            disabled={photos.length === 0 || perSheet === 0 || exporting}
            onClick={() => void download(sheets.map((_, i) => i))}
          >
            {sheets.length > 1 ? <FileArchive /> : <Download />}
            {sheets.length > 1
              ? `Download all (${sheets.length}) .zip`
              : 'Download'}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[300px_1fr]">
        <aside className="bg-background h-fit space-y-6 rounded-lg border p-5">
          <UploadDropzone
            onFiles={(f) => void addFiles(f)}
            busy={pendingBatches > 0}
          />
          {errors.length > 0 && (
            <ul className="text-destructive space-y-1 text-xs">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          <SettingsPanel
            settings={settings}
            perSheet={perSheet}
            onChange={(patch) => dispatch({ type: 'settings', patch })}
            onReset={() => dispatch({ type: 'resetSettings' })}
          />
        </aside>

        <main className="min-w-0 space-y-6">
          <PhotoStrip
            photos={photos}
            onMove={(from, to) => dispatch({ type: 'move', from, to })}
            onRemove={removePhoto}
            onEdit={setEditingId}
          />
          {photos.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Add photos to fill the sheet. Click a photo on a sheet to adjust
              its crop.
            </p>
          )}
          {settings.showCutLayout && perSheet > 0 && (
            <CutPlanList cells={geometry.slots.map((s) => s.cell)} />
          )}
          <div className="grid gap-6 xl:grid-cols-[repeat(2,minmax(0,1fr))]">
            {sheets.map((sheetPhotos, i) => (
              <section key={i} className="min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium">
                    Sheet {i + 1} of {sheets.length}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sheetPhotos.length === 0 || exporting}
                    onClick={() => void download([i])}
                  >
                    <Download /> {sheetFileName(i, format)}
                  </Button>
                </div>
                <SheetPreview
                  geometry={geometry}
                  photos={sheetPhotos}
                  settings={settings}
                  onSlotClick={(slot) =>
                    setEditingId(sheetPhotos[slot]?.id ?? null)
                  }
                />
              </section>
            ))}
          </div>
        </main>
      </div>

      <CropDialog
        photo={editing}
        aspect={geometry.imageAspect}
        onClose={() => setEditingId(null)}
        onSave={(id, crop) => dispatch({ type: 'setCrop', id, crop })}
      />
    </div>
  )
}
