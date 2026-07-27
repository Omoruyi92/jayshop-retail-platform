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
