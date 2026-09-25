import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Crop as CropIcon, X } from 'lucide-react'
import type { Photo } from '#/state/types'

interface Props {
  photos: Photo[]
  onMove: (from: number, to: number) => void
  onRemove: (id: string) => void
  onEdit: (id: string) => void
}

export function PhotoStrip({ photos, onMove, onRemove, onEdit }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = photos.findIndex((p) => p.id === active.id)
    const to = photos.findIndex((p) => p.id === over.id)
    if (from >= 0 && to >= 0) onMove(from, to)
  }

  if (photos.length === 0) return null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={photos.map((p) => p.id)}
        strategy={rectSortingStrategy}
      >
        <ul className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <Thumb
              key={p.id}
              photo={p}
              index={i}
              onRemove={onRemove}
              onEdit={onEdit}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function Thumb({
  photo,
  index,
  onRemove,
  onEdit,
}: {
  photo: Photo
  index: number
  onRemove: (id: string) => void
  onEdit: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: photo.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group bg-muted relative size-20 touch-none overflow-hidden rounded-md ring-1 ring-black/10 ${isDragging ? 'z-10 opacity-70' : ''}`}
      {...attributes}
      {...listeners}
    >
      <img
        src={photo.thumbUrl}
        alt={photo.name}
        className="size-full object-cover"
        draggable={false}
      />
      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
        {index + 1}
      </span>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Crop ${photo.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(photo.id)}
          className="rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
        >
          <CropIcon className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Remove ${photo.name}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRemove(photo.id)}
          className="rounded bg-black/60 p-0.5 text-white hover:bg-red-600"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </li>
  )
}
