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
      className="relative h-[56vh] max-h-[520px] min-h-[380px] w-full overflow-hidden bg-white sm:h-[60vh] sm:max-h-[560px] lg:h-[calc(64vh+151px)] lg:max-h-[771px]"
      style={heroFallbackStyle(initialSlides)}
    >
      {/* imagePosition="top" (GALLERY-only override) keeps the top of the
          uploaded storefront photo — e.g. signage — in frame instead of
          being center-cropped. HeroSlideshow's `imagePosition` prop already
          supports this per-scope; Home/Shop/Style/Players continue to pass
          their own values (or default to "center") unaffected. */}
      <HeroSlideshow scope="GALLERY" imagePosition="top" initialSlides={initialSlides} />

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
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
            className="inline-flex items-center gap-2 mt-3 text-jays-red hover:text-white text-sm font-semibold transition-colors"
          >
            <MapPin size={16} /> Find us at Rogers Centre
          </Link>
        </div>
      </div>
    </section>
  )
}
