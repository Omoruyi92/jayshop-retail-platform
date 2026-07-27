import type { Slide } from '@/types/hero'
import { isBlobUpload } from '@/lib/media/upload'

/**
 * Emits a `<link rel="preload">` hint for the first active hero video slide.
 *
 * For IMAGE slides, Next.js Image's `priority` prop already adds the correct
 * preload link (pointing to the `/_next/image`-optimized URL) during SSR, so
 * no manual hint is needed there.
 *
 * For VIDEO slides there is no equivalent automatic mechanism, so the browser
 * only begins buffering when it encounters the `<video>` element — which can
 * be late in the hydration sequence. This component emits the hint in the
 * server-rendered `<head>` (Next.js hoists resource-hint `<link>` tags from
 * server components automatically) so the browser starts the download as
 * early as possible, matching the treatment images get via `priority`.
 *
 * We deliberately skip preloading remote blob videos. Preloading a blob-hosted
 * video causes every visitor to download the entire file, which is exactly the
 * behaviour that burned through the Hobby Blob Data Transfer limit. Local or
 * same-origin static videos are safe (and cheap) to preload.
 *
 * This component must be rendered in a **server component** context so
 * Next.js can hoist the `<link>` into the page `<head>`.
 */
export default function HeroPreload({ slides }: { slides: Slide[] }) {
  const first = slides.find((s) => s.active)
  if (!first || first.mediaType !== 'VIDEO') return null
  if (isBlobUpload(first.url)) return null

  // Derive a MIME type hint from the URL extension so the browser can
  // determine format compatibility before it starts the download.
  const ext = first.url.split('?')[0].split('.').pop()?.toLowerCase()
  const type =
    ext === 'webm' ? 'video/webm' : ext === 'ogg' ? 'video/ogg' : 'video/mp4'

  return (
    <link
      rel="preload"
      as="video"
      href={first.url}
      type={type}
      // crossOrigin is required for cross-origin Vercel Blob / CDN video
      // URLs to avoid a CORS preflight that would negate the preload benefit.
      crossOrigin="anonymous"
    />
  )
}
