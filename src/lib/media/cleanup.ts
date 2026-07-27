import { unlink, access } from 'fs/promises'
import { join } from 'path'
import type { PrismaClient } from '@prisma/client'
import { isR2Upload, isStaticHeroVideo } from './upload'
import { deleteFromR2 } from './r2.server'

/**
 * Returns true if the imageUrl is a locally-uploaded file (starts with /uploads/).
 */
export function isLocalUpload(imageUrl: string): boolean {
  return imageUrl.startsWith('/uploads/')
}

/**
 * Returns true if the imageUrl is a runtime upload managed by this app
 * (local filesystem, R2, or hero video), as opposed to an external URL
 * (Cloudinary, Unsplash, etc.) or a committed seed image.
 */
export function isManagedUpload(imageUrl: string): boolean {
  return isLocalUpload(imageUrl) || isR2Upload(imageUrl) || isStaticHeroVideo(imageUrl)
}

/**
 * Extracts the bare filename from a local upload URL.
 * e.g. "/uploads/abc123.webp" → "abc123.webp"
 */
export function extractFilename(imageUrl: string): string {
  return imageUrl.replace(/^\/uploads\//, '')
}

/**
 * Resolves a filename to its absolute path on disk.
 */
export function resolveUploadPath(filename: string): string {
  return join(process.cwd(), 'public', 'uploads', filename)
}

/**
 * Counts all DB references to a given upload URL across:
 *   - Product.imageUrl / imageUrl2 / imageUrl3
 *   - HoldHistory.productImageUrlSnapshot
 *
 * A file is only safe to delete when this returns 0. Checking all three
 * image slots (not just imageUrl) prevents deleting a file that is still
 * displayed as Image 2 or Image 3 on this product or any other product.
 *
 * Accepts local `/uploads/...` URLs or R2 URLs — both are stored verbatim.
 */
export async function getImageReferences(
  prisma: PrismaClient,
  urlOrFilename: string
): Promise<number> {
  const url = isR2Upload(urlOrFilename) ? urlOrFilename : `/uploads/${extractFilename(urlOrFilename)}`

  const [productCount, historyCount] = await Promise.all([
    prisma.product.count({
      where: { OR: [{ imageUrl: url }, { imageUrl2: url }, { imageUrl3: url }] },
    }),
    prisma.holdHistory.count({ where: { productImageUrlSnapshot: url } }),
  ])

  return productCount + historyCount
}

/**
 * Safely deletes a previously-uploaded file.
 * - R2 URLs are deleted from the bucket.
 * - Local `/uploads/` or `/hero-videos/` files are deleted from disk.
 * - Swallows "already deleted" errors silently.
 * - Re-throws unexpected errors for local files (preserves prior behavior).
 */
export async function safeUnlinkUpload(imageUrl: string): Promise<void> {
  if (isR2Upload(imageUrl)) {
    await deleteFromR2(imageUrl)
    return
  }

  if (!isLocalUpload(imageUrl) && !isStaticHeroVideo(imageUrl)) return

  const filename = isStaticHeroVideo(imageUrl) ? imageUrl.replace(/^\/hero-videos\//, '') : extractFilename(imageUrl)
  const filePath = isStaticHeroVideo(imageUrl)
    ? join(process.cwd(), 'public', 'hero-videos', filename)
    : resolveUploadPath(filename)

  try {
    await unlink(filePath)
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') return
    throw err
  }
}

/**
 * Returns true if a local upload file physically exists on disk.
 */
export async function uploadFileExists(imageUrl: string): Promise<boolean> {
  if (!isLocalUpload(imageUrl)) return true // external / R2 URLs are assumed reachable

  const filename = extractFilename(imageUrl)
  const filePath = resolveUploadPath(filename)

  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === 'object' && err !== null && 'code' in err
}
