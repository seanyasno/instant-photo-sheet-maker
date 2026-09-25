import { FORMATS, FORMAT_IDS } from '#/config/dimensions'

export const SITE_URL = 'https://photosheet.seanyasno.com'
export const SITE_NAME = 'Instant Photo Sheet Maker'
export const SITE_TITLE =
  'Instant Photo Sheet Maker: print Instax and Polaroid-size photos on 4×6 paper'
export const SITE_DESCRIPTION =
  'Free, private photo layout tool. Lay out your photos as Instax Mini, Square, Wide, Polaroid Go or Polaroid prints on a 4×6 in postcard sheet, print at 300 DPI on a Canon SELPHY or any 4×6 printer, and cut them out along the marks.'
export const REPO_URL = 'https://github.com/seanyasno/instant-photo-sheet-maker'
export const OG_IMAGE = `${SITE_URL}/og-image.png`

function mm(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

const formatList = FORMAT_IDS.map((id) => {
  const f = FORMATS[id]
  return `${f.label} (card ${mm(f.card.w)} × ${mm(f.card.h)} mm, photo ${mm(f.image.w)} × ${mm(f.image.h)} mm)`
}).join('; ')

/** Shown on the page and emitted as FAQPage JSON-LD, so both always match. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Which instant film sizes can I print?',
    a: `${FORMAT_IDS.length} formats with true-to-size borders: ${formatList}.`,
  },
  {
    q: 'How many prints fit on one 4×6 sheet?',
    a: 'Two Instax Mini, two Instax Square, two Polaroid Go, or one Instax Wide or Polaroid per sheet, with the default 2 mm gap and 2 mm safe margin. The layout is calculated automatically, and cards are rotated when that fits more.',
  },
  {
    q: 'Which printer and paper should I use?',
    a: 'Any printer that prints 4×6 in (10×15 cm) at 100% scale. The tool is designed for the Canon SELPHY CP1500 with postcard-size paper. Exports are 1800 × 1200 px at 300 DPI, so 1 mm is exactly 11.81 px.',
  },
  {
    q: 'Are my photos uploaded anywhere?',
    a: 'No. Photos are decoded, cropped and rendered entirely in your browser with the Canvas API. Nothing is sent to a server.',
  },
  {
    q: 'How do I cut the prints out?',
    a: 'Thin cut marks are printed in the gutters. Turn on "Show cut layout" to see numbered cuts with their distance from the sheet edge: make every vertical cut first, then the horizontal cuts. A paper trimmer works best.',
  },
  {
    q: 'Why is my borderless print slightly larger than expected?',
    a: 'Borderless printing on the Canon SELPHY enlarges the image a little so it bleeds off the paper edge. The exported file is exact; the adjustable safe margin keeps everything important away from the edges.',
  },
  {
    q: 'Does it work with iPhone HEIC photos?',
    a: 'Yes. JPEG, PNG and HEIC are supported. EXIF orientation is respected, and each photo can be cropped, zoomed and rotated to fit the film window.',
  },
]
