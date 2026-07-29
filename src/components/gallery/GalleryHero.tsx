import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import HeroSlideshow, { type Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import { heroFallbackStyle } from '@/lib/hero/heroFallbackStyle'

/**
 * Full-bleed, image-driven hero for the public Gallery page. Follows the
 * same structural pattern as HomeHero/ShopHero (HeroSlideshow for the
 * full-bleed media + gradient overlay, heroFallbackStyle for a zero-JS
 * blurred first paint) so it has the same responsive/CLS-safe behavior,
 * but is its own component — it does not modify or share state with the
 * Home/Shop/Style/Players heroes.
 *
 * The "Store Gallery" title, description, and the two nav links render as
 * text directly overlaid on the hero image (matching how the other heroes
 * overlay their own headline/CTA), replacing the previous separate solid
 * navy title block.
 */
export default function GalleryHero({ initialSlides }: { initialSlides?: HeroSlide[] }) {
  return (
    <section
      className="relative h-[calc(100svh-var(--header-height,5.75rem)-2.75rem-56px-env(safe-area-inset-bottom,0px))] min-h-[320px] w-full overflow-hidden bg-jays-navy sm:h-[60vh] sm:max-h-[560px] lg:h-[calc(64vh+151px)] lg:max-h-[771px]"
      style={heroFallbackStyle(initialSlides)}
    >
      {/* imagePosition="top" (GALLERY-only override) keeps the top of the
          uploaded storefront photo — e.g. signage — in frame instead of
          being center-cropped. HeroSlideshow's `imagePosition` prop already
          supports this per-scope; Home/Shop/Style/Players continue to pass
          their own values (or default to "center") unaffected.
          controlsAlign="corner" moves the prev/play-pause/next cluster to
          the bottom-right — GALLERY-only, since this is the one hero that
          also overlays its own bottom-anchored CTA link (below) and the two
          must never share a band; the other heroes using HeroSlideshow keep
          the default bottom-center placement. */}
      <HeroSlideshow scope="GALLERY" imagePosition="top" initialSlides={initialSlides} controlsAlign="corner" />

      <div className="absolute inset-x-0 bottom-0 z-10">
        {/* Bottom padding on this wrapper reserves a dedicated vertical band
            for HeroSlideshow's control cluster, which is a SIBLING overlay
            (not a DOM child of this content block) absolutely positioned at
            bottom-3 (mobile) up to bottom-4 (sm:+) with a fixed h-11
            (2.75rem/44px) button height (44px is also the min accessible tap
            target, so this value is shared/tied to that constraint, not
            picked independently). Reserving control-bottom-offset (12-16px)
            + control-height (44px) + an explicit clearance margin as this
            wrapper's own pb-* means the CTA link below (the last item in
            this block, so it sits at the very bottom of the reserved
            content area) always finishes its own row above the controls'
            top edge, at every viewport width — the two can never land on
            the same horizontal band regardless of CTA text length, since
            they're on structurally separate rows (content flow vs. reserved
            padding gutter), not separated by a fixed px nudge. */}
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-[4.5rem] lg:px-8 lg:pb-[4.5rem]">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} /> Back to shop
          </Link>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white uppercase tracking-tight drop-shadow-md">
            Store Gallery
          </h1>
          <p className="text-white/85 text-sm sm:text-base mt-2 max-w-2xl drop-shadow">
            Take a look inside the Jays Shop — seasonal displays, visual merchandising, and the atmosphere waiting for you at Rogers Centre.
          </p>
          <Link
            href="https://www.google.com/maps/search/?api=1&query=Rogers+Centre+Toronto+Blue+Jays+Shop"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 text-jays-red hover:text-white text-sm font-semibold transition-colors w-fit"
          >
            <MapPin size={16} /> Find us at Rogers Centre
          </Link>
        </div>
      </div>
    </section>
  )
}
