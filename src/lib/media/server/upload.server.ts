import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { isBlobUpload, isStaticHeroVideo } from '../upload'

/**
 * Server-side helpers for persisting uploaded files. These import Node's
 * `fs/promises` and therefore must only be used inside API routes / server
 * components, never in client bundles.
 *
 * All uploads now go to the local `public/` directory and are served as static
 * assets by Vercel's Edge Network. The previous Vercel Blob path has been
 * removed so the Blob store can be deleted/downgraded without breaking uploads.
 */

/**
 * Persists an uploaded file buffer and returns its public URL.
 * Writes to `public/uploads/<subdir>/<fileName>` and returns `/uploads/...`.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  fileName: string,
  _contentType: string,
  subdir?: string
): Promise<string> {
  const pathname = subdir ? `${subdir}/${fileName}` : fileName
  const uploadDir = subdir
    ? join(process.cwd(), 'public', 'uploads', subdir)
    : join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/${pathname}`
}

/**
 * Saves a hero video directly to `public/hero-videos/<scope>/<fileName>` so it
 * is served as a static asset.
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
 * Best-effort delete of a previously-uploaded file on `public/uploads/`
 * or `public/hero-videos/`. Never throws.
 */
export async function deleteUploadedFile(url: string): Promise<void> {
  const filePath = url.startsWith('/uploads/')
    ? join(process.cwd(), 'public', url)
    : isStaticHeroVideo(url)
    ? join(process.cwd(), 'public', url)
    : null

  if (!filePath) return
  try {
    await unlink(filePath)
  } catch {
    // ignore (already deleted or never existed)
  }
}
