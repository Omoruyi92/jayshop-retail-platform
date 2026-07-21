import sharp from 'sharp'

/**
 * Max width we ever need to serve an uploaded image at. Product photos,
 * gallery images, and hero banners are never displayed larger than this on
 * any current layout (including 2x/3x retina density), so anything wider is
 * safely downscaled without any visible loss of detail — this keeps file
 * size down for fast loading while preserving full sharpness at every
 * breakpoint Next/Image will request (mobile, tablet, desktop).
 */
const MAX_DIMENSION = 2400

/** High-quality encode settings. 90 is effectively visually lossless for
 * photographic content while still giving a meaningful size reduction vs.
 * an unprocessed camera/phone export. */
const WEBP_QUALITY = 90
const JPEG_QUALITY = 90

export interface OptimizedImage {
  buffer: Buffer
  ext: string
  contentType: string
}

/**
 * Normalizes an uploaded image so every image on the platform (product
 * photos, banners, gallery, players, brands, style submissions) is served
 * at consistent high quality:
 *  - Auto-rotates based on EXIF orientation (fixes sideways/upside-down phone photos)
 *  - Caps dimensions at MAX_DIMENSION without ever upscaling a smaller source
 *  - Re-encodes to WebP (or keeps GIF as-is to preserve animation) at a high
 *    quality setting, which both compresses for performance and strips
 *    metadata bloat while keeping the image visually sharp
 *
 * Falls back to the original buffer/extension if the file can't be parsed
 * as an image (e.g. an unexpected format), so uploads never hard-fail.
 */
export async function optimizeImageBuffer(input: Buffer, originalExt: string): Promise<OptimizedImage> {
  const ext = (originalExt || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')

  // Preserve animated GIFs as-is — re-encoding would drop animation frames.
  if (ext === 'gif') {
    return { buffer: input, ext: 'gif', contentType: 'image/gif' }
  }

  try {
    const image = sharp(input, { animated: false }).rotate()
    const metadata = await image.metadata()

    const width = metadata.width ?? MAX_DIMENSION
    const height = metadata.height ?? MAX_DIMENSION
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION

    const pipeline = needsResize
      ? image.resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
      : image

    const buffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
    return { buffer, ext: 'webp', contentType: 'image/webp' }
  } catch {
    // Not a processable image (or an unsupported format) — keep the
    // original bytes rather than failing the upload.
    const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream'
    return { buffer: input, ext, contentType }
  }
}

export { MAX_DIMENSION, WEBP_QUALITY, JPEG_QUALITY }
