import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { RotateCw } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Slider } from '#/components/ui/slider'
import { effectiveCrop, nextRotation } from '#/lib/crop'
import type { Crop, Rotation } from '#/lib/crop'
import { bitmapToUrl } from '#/lib/loadImage'
import type { Photo } from '#/state/types'

interface Props {
  photo: Photo | null
  aspect: number
  onClose: () => void
  onSave: (id: string, crop: Crop) => void
}

/** Largest side of the image shown in the cropper; crops are scaled back to full resolution on save. */
const EDITOR_MAX_SIDE = 2048

export function CropDialog({ photo, aspect, onClose, onSave }: Props) {
  return (
    <Dialog open={photo !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adjust crop</DialogTitle>
          <DialogDescription>
            Drag to pan, scroll or use the slider to zoom.
          </DialogDescription>
        </DialogHeader>
        {photo && (
          <CropEditor
            key={photo.id}
            photo={photo}
            aspect={aspect}
            onCancel={onClose}
            onSave={(crop) => {
              onSave(photo.id, crop)
              onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CropEditor({
  photo,
  aspect,
  onCancel,
  onSave,
}: {
  photo: Photo
  aspect: number
  onCancel: () => void
  onSave: (crop: Crop) => void
}) {
  const initial = effectiveCrop(
    photo.crop,
    photo.bitmap.width,
    photo.bitmap.height,
    aspect,
  )
  const [media, setMedia] = useState<{ url: string; scale: number } | null>(
    null,
  )
  const [failed, setFailed] = useState(false)
  const [rotation, setRotation] = useState<Rotation>(initial.rotation)
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  // Only restore the saved crop for the rotation it was made with.
  const [restore, setRestore] = useState(true)

  useEffect(() => {
    let url: string | null = null
    let cancelled = false
    bitmapToUrl(photo.bitmap, EDITOR_MAX_SIDE).then(
      (m) => {
        url = m.url
        if (cancelled) URL.revokeObjectURL(m.url)
        else setMedia(m)
      },
      () => !cancelled && setFailed(true),
    )
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [photo.bitmap])

  if (failed)
    return (
      <p className="text-destructive text-sm">Could not open this photo.</p>
    )
  if (!media)
    return <div className="bg-muted h-[60vh] animate-pulse rounded-md" />

  const k = media.scale
  const initialArea = {
    x: initial.area.x * k,
    y: initial.area.y * k,
    width: initial.area.w * k,
    height: initial.area.h * k,
  }

  function rotate() {
    setRestore(false)
    setRotation((r) => nextRotation(r))
    setPosition({ x: 0, y: 0 })
    setZoom(1)
  }

  function save() {
    if (!area) return
    onSave({
      rotation,
      aspect,
      area: {
        x: area.x / k,
        y: area.y / k,
        w: area.width / k,
        h: area.height / k,
      },
    })
  }

  return (
    <>
      <div className="relative h-[60vh] overflow-hidden rounded-md bg-neutral-900">
        <Cropper
          image={media.url}
          crop={position}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          maxZoom={8}
          initialCroppedAreaPixels={restore ? initialArea : undefined}
          onCropChange={setPosition}
          onZoomChange={setZoom}
          onCropAreaChange={(_, pixels) => setArea(pixels)}
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground text-sm">Zoom</span>
        <Slider
          min={1}
          max={8}
          step={0.01}
          value={[zoom]}
          onValueChange={([z]) => z !== undefined && setZoom(z)}
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={rotate}>
          <RotateCw /> Rotate 90°
        </Button>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!area}>
          Save crop
        </Button>
      </DialogFooter>
    </>
  )
}
