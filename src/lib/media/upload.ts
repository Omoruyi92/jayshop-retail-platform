import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { put, del } from '@vercel/blob'

/**
 * Vercel's serverless functions have a read-only, ephemeral filesystem —
 * writes to `public/uploads/` at runtime either fail outright (500) or
 * vanish on the next deploy. When a Blob read/write token is configured
 * (always in production; optionally in local dev), runtime uploads go to
 * Vercel Blob storage instead. Without a token (typical local dev), we fall
 * back to writing under `public/uploads/` exactly as before so local
 * development keeps working without any extra setup.
 *
 * NOTE: this only affects NEW uploads made through the admin panel. The
 * ~65 seed images already committed under `public/uploads/` in git are
 * untouched — they keep being served as static build assets.
 */
function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

/** Matches a URL returned by Vercel Blob's `put()` (public store domain). */
export function isBlobUpload(url: string): boolean {
  return /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(url)
}

/**
 * Persists an uploaded file buffer and returns its public URL.
 *  - If BLOB_READ_WRITE_TOKEN is set: uploads to Vercel Blob (`put`) and
 *    returns the Blob's absolute https URL.
 *  - Otherwise: writes to `public/uploads/<subdir>/<fileName>` and returns
 *    the local `/uploads/...` path, same as the original behavior.
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
 * Best-effort delete of a previously-uploaded file, whether it lives on
 * Vercel Blob or the local `public/uploads/` filesystem. Never throws —
 * mirrors the existing "ignore delete failures" behavior of the local-fs
 * helpers this replaces.
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

  if (!url.startsWith('/uploads/')) return

  try {
    await unlink(join(process.cwd(), 'public', url))
  } catch {
    // ignore (already deleted, or never existed)
  }
}
