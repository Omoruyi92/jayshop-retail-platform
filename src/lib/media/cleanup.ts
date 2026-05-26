import { unlink, access } from 'fs/promises'
import { join } from 'path'
import type { PrismaClient } from '@prisma/client'

/**
 * Returns true if the imageUrl is a locally-uploaded file (starts with /uploads/).
 */
export function isLocalUpload(imageUrl: string): boolean {
  return imageUrl.startsWith('/uploads/')
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
 * Counts all DB references to a given upload filename across:
 *   - Product.imageUrl
 *   - HoldHistory.productImageUrlSnapshot
 *
 * A file is only safe to delete when this returns 0.
 */
export async function getImageReferences(
  prisma: PrismaClient,
  filename: string
): Promise<number> {
  const url = `/uploads/${filename}`

  const [productCount, historyCount] = await Promise.all([
    prisma.product.count({ where: { imageUrl: url } }),
    prisma.holdHistory.count({ where: { productImageUrlSnapshot: url } }),
  ])

  return productCount + historyCount
}

/**
 * Safely unlinks a local upload file.
 * - Skips if the URL is not a local upload.
 * - Swallows ENOENT (already deleted) silently.
 * - Re-throws all other errors.
 */
export async function safeUnlinkUpload(imageUrl: string): Promise<void> {
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
