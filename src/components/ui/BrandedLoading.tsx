// BrandedLoading.tsx — branded route-level loading state: a large translucent
// Blue Jays roundel watermark on the navy brand background, with a small
// spinner for clarity. Used by App Router `loading.tsx` boundaries on the
// public site. Animation is gated behind `motion-safe:` so users with
// `prefers-reduced-motion` get a static watermark.
import Image from 'next/image'

export default function BrandedLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative flex min-h-[70vh] w-full flex-1 items-center justify-center overflow-hidden bg-jays-navy"
    >
      {/* Watermark: same roundel asset the site header uses (/brand/logo.png).
          Static opacity lives on the outer div; the pulse animation runs on the
          inner div so its keyframes can't override the watermark translucency. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-10"
      >
        <div className="relative h-64 w-72 motion-safe:animate-pulse sm:h-80 sm:w-[22rem] lg:h-96 lg:w-[26rem]">
          <Image
            src="/brand/logo.png"
            alt=""
            fill
            sizes="(max-width: 640px) 18rem, (max-width: 1024px) 22rem, 26rem"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Spinner ring — static circle for reduced-motion users */}
      <div
        aria-hidden="true"
        className="relative h-9 w-9 rounded-full border-2 border-white/25 border-t-white/80 motion-safe:animate-spin"
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}
