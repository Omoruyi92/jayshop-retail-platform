import Image from 'next/image'
import HeroSlideshow, { type Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import { heroFallbackStyle } from '@/lib/hero/heroFallbackStyle'

/**
 * Premium, full-bleed hero for the "Shop by Style" landing page.
 *
 * Admin-managed via the Hero Media admin page's "Style Hero" tab
 * (scope=STYLE_LANDING), reusing the same HeroSlideshow component and
 * upload/order/delete infrastructure already powering the Home and Shop
 * heroes. Falls back to a static evergreen banner image when no admin
 * media has been configured yet, so the page never renders empty.
 */
export default function StylesHero({ initialSlides }: { initialSlides?: HeroSlide[] }) {
  const hasSlides = Array.isArray(initialSlides) && initialSlides.some((s) => s.active)

  return (
    <section
      className="relative h-[calc(100svh-var(--header-height,5.75rem)-2.75rem-56px-env(safe-area-inset-bottom,0px))] min-h-[320px] sm:min-h-0 w-full overflow-hidden bg-jays-navy sm:h-[60vh] sm:max-h-[560px] lg:h-[calc(64vh+151px)] lg:max-h-[771px]"
      style={heroFallbackStyle(initialSlides)}
    >
      {hasSlides ? (
        <HeroSlideshow scope="STYLE_LANDING" imagePosition="top" initialSlides={initialSlides} />
      ) : (
        <>
          <Image
            src="/uploads/hero-slides/shop-by-style/shop-by-style-hero.jpg"
            alt="Shop by Style"
            fill
            priority
            sizes="100vw"
            quality={95}
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-jays-navy/85 via-jays-navy/30 to-jays-navy/10" />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10">
        {/* Bottom padding reserves the slideshow-control band so the text
            block always ends above the controls, whatever the hero height:
            controls sit at bottom-3 (12px) with 44px-tall buttons below sm
            (56px footprint) and bottom-4 (16px) + 44px from sm up (60px
            footprint). Reserve footprint + 16px clearance: 72px (4.5rem)
            mobile, 76px (4.75rem) sm+. */}
        <div className="mx-auto max-w-7xl px-4 pb-[4.5rem] sm:px-6 sm:pb-[4.75rem] lg:px-8">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.15em] text-blue-100 backdrop-blur-sm">
            Curated Collections
          </span>
          <h1 className="font-display text-3xl font-bold uppercase leading-[1.05] tracking-wide text-white drop-shadow-md sm:text-5xl lg:text-6xl">
            Shop by Style
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-blue-100/90 drop-shadow sm:text-base">
            Find your fit — from jerseys to game day essentials, browse gear curated by look and lifestyle.
          </p>
        </div>
      </div>
    </section>
  )
}
