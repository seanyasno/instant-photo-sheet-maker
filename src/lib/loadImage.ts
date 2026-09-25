function looksLikeHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

export function isAcceptedImage(file: File): boolean {
  return (
    /^image\/(jpeg|png)$/i.test(file.type) ||
    /\.(jpe?g|png)$/i.test(file.name) ||
    looksLikeHeic(file)
  )
}

/**
 * Longest side kept in memory. A 62 mm cell is 732 px at 300 DPI, so 4096 px
 * still allows ~5.6× crop zoom at full print resolution, while a 48 MP photo
 * would otherwise hold ~190 MB of decoded pixels.
 */
const MAX_SIDE_PX = 4096

async function decode(file: File): Promise<ImageBitmap> {
  const options: ImageBitmapOptions = { imageOrientation: 'from-image' }
  try {
    return await createImageBitmap(file, options)
  } catch (err) {
    // Safari decodes HEIC natively; other browsers need the lazy-loaded decoder.
    if (!looksLikeHeic(file)) throw err
    const { heicTo } = await import('heic-to')
    return heicTo({ blob: file, type: 'bitmap', options })
  }
}

/** Decode a file into an upright ImageBitmap (EXIF applied), capped at MAX_SIDE_PX. */
export async function loadImage(file: File): Promise<ImageBitmap> {
  const full = await decode(file)
  const k = MAX_SIDE_PX / Math.max(full.width, full.height)
  if (k >= 1) return full
  try {
    return await createImageBitmap(full, {
      resizeWidth: Math.round(full.width * k),
      resizeHeight: Math.round(full.height * k),
      resizeQuality: 'high',
    })
  } finally {
    full.close()
  }
}

/**
 * Downscaled JPEG of a bitmap as an object URL (works for HEIC too, since it
 * draws from the decoded bitmap). `scale` = output width / bitmap width.
 */
export async function bitmapToUrl(
  bitmap: ImageBitmap,
  maxSide: number,
): Promise<{ url: string; scale: number }> {
  const k = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = new OffscreenCanvas(
    Math.max(1, Math.round(bitmap.width * k)),
    Math.max(1, Math.round(bitmap.height * k)),
  )
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
  return { url: URL.createObjectURL(blob), scale: canvas.width / bitmap.width }
}
