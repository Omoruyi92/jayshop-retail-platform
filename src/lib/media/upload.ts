import { put, del } from '@vercel/blob'

/** Matches a URL returned by Vercel Blob's `put()` (public store domain). */
export function isBlobUpload(url: string): boolean {
  return /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(url)
}

/** Matches a URL that points at a committed/static video under `public/hero-videos/`. */
export function isStaticHeroVideo(url: string): boolean {
  return url.startsWith('/hero-videos/')
}
