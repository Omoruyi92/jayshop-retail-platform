import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { put, del } from '@vercel/blob'
import { isBlobUpload, isStaticHeroVideo } from '../upload'

/**
 * Server-side helpers for persisting uploaded files. These import Node's
 * `fs/promises` and therefore must only be used inside API routes / server
 * components, never in client bundles.
 */

function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

/**
 * Persists an uploaded file buffer and returns its public URL.
 *  - If BLOB_READ_WRITE_TOKEN is set: uploads to Vercel Blob (`put`).
 *  - Otherwise: writes to `public/uploads/<subdir>/<fileName>`.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  subdir?: string
): Promise<string> {
  const pathname = subdir ? `${subdir}/${fileName}` : fileName

  if (blobEnabled()) {
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    })
    return blob.url
  }

  const uploadDir = subdir
    ? join(process.cwd(), 'public', 'uploads', subdir)
    : join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/${pathname}`
}

/**
 * Saves a hero video directly to `public/hero-videos/<scope>/<fileName>` so it
 * is served as a static asset instead of via Vercel Blob.
 */
export async function saveHeroVideo(
  buffer: Buffer,
  fileName: string,
  scope: string
): Promise<string> {
  const dir = join(process.cwd(), 'public', 'hero-videos', scope)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, fileName), buffer)
  return `/hero-videos/${scope}/${fileName}`
}

/**
 * Best-effort delete of a previously-uploaded file on Blob, `public/uploads/`,
 * or `public/hero-videos/`. Never throws.
 */
export async function deleteUploadedFile(url: string): Promise<void> {
  if (isBlobUpload(url)) {
    try {
      await del(url)
    } catch {
      // ignore
    }
    return
  }

  if (url.startsWith('/uploads/')) {
    try {
      await unlink(join(process.cwd(), 'public', url))
    } catch {
      // ignore
    }
    return
  }

  if (isStaticHeroVideo(url)) {
    try {
      await unlink(join(process.cwd(), 'public', url))
    } catch {
      // ignore
    }
  }
}
