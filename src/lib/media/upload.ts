/** Matches a legacy Vercel Blob public URL. Kept so existing blob URLs in the
 * DB are still recognised as remote media (e.g. for the fallback-on-error path
 * in HeroSlideshow) even though new uploads no longer use Blob. */
export function isBlobUpload(url: string): boolean {
  return /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(url)
}

/** Matches a URL that points at a committed/static video under `public/hero-videos/`. */
export function isStaticHeroVideo(url: string): boolean {
  return url.startsWith('/hero-videos/')
}

/** Matches a URL served from the configured Cloudflare R2 public domain. */
export function isR2Upload(url: string): boolean {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!publicUrl) return false
  return url.startsWith(publicUrl.replace(/\/$/, ''))
}

/**
 * Vercel serverless functions cap request bodies at ~4.5 MB, which is why
 * the hero-media admin UI has two upload paths: a server-side multipart POST
 * (file bytes pass through the Next.js API route) and a presigned direct PUT
 * to Cloudflare R2 from the browser (bytes never touch the serverless
 * function, but requires the R2 bucket's CORS policy to allow PUT from the
 * app's origin).
 *
 * This threshold decides which path a given file should use. It is
 * deliberately based on file SIZE, not file type: most hero videos are only
 * ~1 MB and fit comfortably through the server-side path, which works
 * out-of-the-box with no bucket CORS configuration required. Only files that
 * would actually blow the serverless body limit need the presigned path.
 *
 * Kept a bit under the real ~4.5 MB Vercel ceiling to leave headroom for
 * multipart/form-data overhead (boundaries, headers, base64-ish inflation
 * from some clients) around the raw file bytes.
 */
export const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024

/**
 * Returns true when a file is large enough that it must use the presigned
 * direct-to-R2 PUT instead of the server-side multipart upload route.
 */
export function usesPresignedUpload(file: { size: number }): boolean {
  return file.size > SERVER_UPLOAD_MAX_BYTES
}
