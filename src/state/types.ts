import type { FormatId } from '#/config/dimensions'
import type { Crop } from '#/lib/crop'

export type Orientation = 'landscape' | 'portrait'
export type BorderColor = 'white' | 'black'

export interface Settings {
  format: FormatId
  gapMm: number
  safeMarginMm: number
  orientation: Orientation
  borderColor: BorderColor
  cutMarks: boolean
  showSafeMargin: boolean
  showCutLayout: boolean
}

export interface Photo {
  id: string
  name: string
  bitmap: ImageBitmap
  /** Object URL for the thumbnail strip. */
  thumbUrl: string
  crop?: Crop
}
