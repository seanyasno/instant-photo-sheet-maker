// Physical source of truth. All values in millimetres unless noted.

export interface Size {
  w: number
  h: number
}

export const MM_PER_INCH = 25.4
export const DPI = 300

/** 4×6 in postcard, landscape. Portrait is the same sheet with w/h swapped. */
export const SHEET_MM: Size = { w: 152.4, h: 101.6 }

/**
 * An instant-film print: the card you cut out, and the photo window inside it.
 * `imageOffset` is the window's top-left corner inside the card, so the
 * remaining space below the window is the thick "chin" border.
 */
export interface FilmFormat {
  label: string
  card: Size
  image: Size
  imageOffset: { x: number; y: number }
}

/** Build a format whose photo window is centred horizontally. */
function film(label: string, card: Size, image: Size, top: number): FilmFormat {
  return {
    label,
    card,
    image,
    imageOffset: { x: (card.w - image.w) / 2, y: top },
  }
}

/** A format turned 90° clockwise, the way a camera held sideways produces it (chin on the left). */
function turned(label: string, f: FilmFormat): FilmFormat {
  const chin = f.card.h - f.imageOffset.y - f.image.h
  return {
    label,
    card: { w: f.card.h, h: f.card.w },
    image: { w: f.image.h, h: f.image.w },
    imageOffset: { x: chin, y: f.imageOffset.x },
  }
}

// Instax films share an 86 mm height and 62 mm tall window; the chin is ~18 mm.
const INSTAX_TOP = 6
const INSTAX_WIDE = film(
  'Instax Wide (Horizontal)',
  { w: 108, h: 86 },
  { w: 99, h: 62 },
  INSTAX_TOP,
)

export const FORMATS = {
  'instax-mini': film(
    'Instax Mini',
    { w: 54, h: 86 },
    { w: 46, h: 62 },
    INSTAX_TOP,
  ),
  'instax-square': film(
    'Instax Square',
    { w: 72, h: 86 },
    { w: 62, h: 62 },
    INSTAX_TOP,
  ),
  'instax-wide': INSTAX_WIDE,
  'instax-wide-vertical': turned('Instax Wide (Vertical)', INSTAX_WIDE),
  'polaroid-go': film('Polaroid Go', { w: 53.9, h: 66.6 }, { w: 47, h: 46 }, 5),
  polaroid: film(
    'Polaroid (i-Type / 600)',
    { w: 88, h: 107 },
    { w: 79, h: 79 },
    6,
  ),
} satisfies Record<string, FilmFormat>

export type FormatId = keyof typeof FORMATS
export const FORMAT_IDS = Object.keys(FORMATS) as FormatId[]
export const DEFAULT_FORMAT: FormatId = 'instax-mini'

/** Length of each printed cut mark tick. */
export const CUT_MARK_LENGTH_MM = 3
/** Cut mark stroke width. ~0.1 mm prints as a thin but visible line. */
export const CUT_MARK_WIDTH_MM = 0.1

export const DEFAULT_SAFE_MARGIN_MM = 2
export const DEFAULT_GAP_MM = 2
export const JPEG_QUALITY = 0.95
