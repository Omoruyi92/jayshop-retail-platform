import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { isStaticHeroVideo, isR2Upload } from '../upload'
import { saveToR2, deleteFromR2 } from '../r2.server'

/**
 * Server-side helpers for persisting uploaded files. These import Node's
 * `fs/promises` and therefore must only be used inside API routes / server
 * components, never in client bundles.
 *
 * - Hero videos are always saved to `public/hero-videos/` and committed to git
 *   so they are durable static assets.
 * - All other image uploads go to Cloudflare R2 when R2 credentials are
 *   configured, otherwise fall back to the local `public/uploads/` filesystem.
 */

function r2Enabled(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  )
}

/**
 * Persists an uploaded file buffer and returns its public URL.
 *  - If R2 credentials are configured: uploads to Cloudflare R2.
 *  - Otherwise: writes to `public/uploads/<subdir>/<fileName>`.
 */
export async function saveUploadedFile(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  subdir?: string
): Promise<string> {
  if (r2Enabled()) {
    return saveToR2(buffer, fileName, contentType, subdir)
  }

  const pathname = subdir ? `${subdir}/${fileName}` : fileName
  const uploadDir = subdir
    ? join(process.cwd(), 'public', 'uploads', subdir)
    : join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/${pathname}`
}

/**
 * Saves a hero video to Cloudflare R2 when R2 credentials are configured,
 * otherwise falls back to the local `public/hero-videos/` filesystem.
 *
 * Using R2 in production is required because Vercel's serverless filesystem is
 * ephemeral — videos written locally at runtime disappear on the next deploy
 * or function cold start, causing "Upload failed" errors for managers.
 */
export async function saveHeroVideo(
  buffer: Buffer,
  fileName: string,
  scope: string
): Promise<string> {
  if (r2Enabled()) {
    return saveToR2(buffer, fileName, 'video/mp4', `hero-videos/${scope}`)
  }

  const dir = join(process.cwd(), 'public', 'hero-videos', scope)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, fileName), buffer)
  return `/hero-videos/${scope}/${fileName}`
}

/**
 * Best-effort delete of a previously-uploaded file, whether it lives on
 * Cloudflare R2, the local `public/uploads/` filesystem, or `public/hero-videos/`.
 * Never throws.
 */
export async function deleteUploadedFile(url: string): Promise<void> {
  if (isR2Upload(url)) {
    await deleteFromR2(url)
    return
  }

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
