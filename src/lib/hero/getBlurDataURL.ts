import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Generates (and caches) a tiny base64-encoded LQIP for a hero image URL,
 * for use as `next/image`'s `blurDataURL`. This is what eliminates the
 * solid `bg-jays-navy` flash on first paint: instead of the section's flat
 * background color being the only thing visible until the full-res image
 * finishes downloading + decoding, the browser paints this ~20px-wide blur
 * immediately (it's inlined in the HTML, no network round-trip), so what
 * appears is a soft preview of the *actual photo* rather than a mismatched
 * solid color.
 *
 * Module-level in-memory cache keyed by URL: hero slides are uploaded
 * rarely (via the admin panel) and read on every storefront page load, so
 * recomputing a resize+encode per request would be wasteful. The cache is
 * intentionally process-local (no Redis/DB) — worst case after a deploy or
 * cold start is a handful of extra sharp calls, not a correctness issue.
 */
const cache = new Map<string, string | null>()

async function readSourceBytes(url: string): Promise<Buffer | null> {
  try {
    // Local seed images (public/uploads/...) and any other root-relative
    // path are read straight off disk — faster than a self-fetch over HTTP
    // and works even if the dev server can't reach its own origin.
    if (url.startsWith('/')) {
      return await readFile(join(process.cwd(), 'public', url))
    }
    if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url)
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    }
    return null
  } catch {
    return null
  }
}

/**
 * Returns a `data:image/...;base64,...` string sized for `next/image`'s
 * `blurDataURL`, or `null` if the source couldn't be read/decoded (caller
 * falls back to rendering without a blur placeholder rather than failing
 * the whole page).
 */
export async function getBlurDataURL(url: string): Promise<string | null> {
  if (cache.has(url)) return cache.get(url) ?? null

  const result = await (async () => {
    const bytes = await readSourceBytes(url)
    if (!bytes) return null
    try {
      // 16px-wide, heavily blurred + low quality — the goal is a soft color
      // wash matching the source image, not a recognizable thumbnail, so
      // this stays a tiny (<1KB) inline string.
      const buf = await sharp(bytes)
        .resize(16, 16, { fit: 'inside' })
        .blur()
        .toFormat('webp', { quality: 40 })
        .toBuffer()
      return `data:image/webp;base64,${buf.toString('base64')}`
    } catch {
      return null
    }
  })()

  cache.set(url, result)
  return result
}
