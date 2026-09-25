import {
  DEFAULT_FORMAT,
  DEFAULT_GAP_MM,
  DEFAULT_SAFE_MARGIN_MM,
} from '#/config/dimensions'
import type { Crop } from '#/lib/crop'
import type { Photo, Settings } from '#/state/types'

export interface State {
  photos: Photo[]
  settings: Settings
}

export type Action =
  | { type: 'add'; photos: Photo[] }
  | { type: 'remove'; id: string }
  | { type: 'move'; from: number; to: number }
  | { type: 'setCrop'; id: string; crop: Crop }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'resetSettings' }

export const DEFAULT_SETTINGS: Settings = {
  format: DEFAULT_FORMAT,
  gapMm: DEFAULT_GAP_MM,
  safeMarginMm: DEFAULT_SAFE_MARGIN_MM,
  orientation: 'landscape',
  borderColor: 'white',
  cutMarks: true,
  showSafeMargin: true,
  showCutLayout: false,
}

export const initialState: State = { photos: [], settings: DEFAULT_SETTINGS }

export function arrayMove<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  if (item === undefined) return [...items]
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}

/** Pure reducer. Releasing bitmaps/URLs of removed photos is the caller's job. */
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { ...state, photos: [...state.photos, ...action.photos] }
    case 'remove':
      return {
        ...state,
        photos: state.photos.filter((p) => p.id !== action.id),
      }
    case 'move':
      return {
        ...state,
        photos: arrayMove(state.photos, action.from, action.to),
      }
    case 'setCrop':
      return {
        ...state,
        photos: state.photos.map((p) =>
          p.id === action.id ? { ...p, crop: action.crop } : p,
        ),
      }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'resetSettings':
      return { ...state, settings: DEFAULT_SETTINGS }
  }
}
