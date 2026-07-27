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
