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
      className="relative h-[46vh] max-h-[440px] min-h-[320px] w-full overflow-hidden bg-jays-navy sm:h-[52vh] sm:max-h-[480px] lg:h-[58vh] lg:max-h-[540px]"
      style={heroFallbackStyle(initialSlides)}
    >
      {hasSlides ? (
        <HeroSlideshow scope="STYLE_LANDING" imagePosition="center" initialSlides={initialSlides} />
      ) : (
        <>
          <Image
            src="/uploads/hero-slides/shop-by-style/shop-by-style-hero.jpg"
            alt="Shop by Style"
            fill
            priority
            sizes="100vw"
            quality={95}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-jays-navy/85 via-jays-navy/30 to-jays-navy/10" />
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
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
