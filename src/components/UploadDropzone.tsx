import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '#/lib/utils'

interface Props {
  onFiles: (files: File[]) => void
  busy: boolean
}

export function UploadDropzone({ onFiles, busy }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) =>
        (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()
      }
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onFiles(Array.from(e.dataTransfer.files))
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        over ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
      )}
    >
      <ImagePlus className="text-muted-foreground size-8" />
      <p className="text-sm font-medium">
        {busy ? 'Loading…' : 'Drop photos or click to choose'}
      </p>
      <p className="text-muted-foreground text-xs">JPEG, PNG, HEIC</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </div>
  )
}
