import { unlink, access } from 'fs/promises'
import { join } from 'path'
import { del } from '@vercel/blob'
import type { PrismaClient } from '@prisma/client'

/**
 * Returns true if the imageUrl is a locally-uploaded file (starts with /uploads/).
 */
export function isLocalUpload(imageUrl: string): boolean {
  return imageUrl.startsWith('/uploads/')
}

/**
 * Returns true if the imageUrl points to a Vercel Blob-hosted upload
 * (runtime uploads made via src/lib/media/upload.ts when
 * BLOB_READ_WRITE_TOKEN is configured, e.g. in production).
 */
export function isBlobUpload(imageUrl: string): boolean {
  return /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(imageUrl)
}

/**
 * Returns true if the imageUrl is a runtime upload managed by this app
 * (either local filesystem or Vercel Blob), as opposed to an external URL
 * (Cloudinary, Unsplash, etc.) or a committed seed image.
 */
export function isManagedUpload(imageUrl: string): boolean {
  return isLocalUpload(imageUrl) || isBlobUpload(imageUrl)
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
 * Accepts either a local `/uploads/...` URL or a Vercel Blob URL — both are
 * stored verbatim in the DB's imageUrl fields, so no translation is needed.
 */
export async function getImageReferences(
  prisma: PrismaClient,
  urlOrFilename: string
): Promise<number> {
  const url = isBlobUpload(urlOrFilename) ? urlOrFilename : `/uploads/${extractFilename(urlOrFilename)}`

  const [productCount, historyCount] = await Promise.all([
    prisma.product.count({
      where: { OR: [{ imageUrl: url }, { imageUrl2: url }, { imageUrl3: url }] },
    }),
    prisma.holdHistory.count({ where: { productImageUrlSnapshot: url } }),
  ])

  return productCount + historyCount
}

/**
 * Safely deletes a previously-uploaded file, whether it's a local
 * `public/uploads/` file or a Vercel Blob object.
 * - Skips if the URL is neither (e.g. an external/seed image).
 * - Swallows "already deleted" errors silently.
 * - Re-throws unexpected errors for local files (preserves prior behavior).
 */
export async function safeUnlinkUpload(imageUrl: string): Promise<void> {
  if (isBlobUpload(imageUrl)) {
    try {
      await del(imageUrl)
    } catch {
      // ignore — already deleted or unreachable
    }
    return
  }

  if (!isLocalUpload(imageUrl)) return

  const filename = extractFilename(imageUrl)
  const filePath = resolveUploadPath(filename)

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
  if (!isLocalUpload(imageUrl)) return true // external URLs are assumed reachable

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
