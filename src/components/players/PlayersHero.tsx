'use client'

import { useEffect, useState } from 'react'
import HeroSlideshow, { type Slide } from '@/components/shop/HeroSlideshow'

/**
 * Premium, full-bleed hero for the "Popular Players" landing page.
 *
 * Admin-managed via the Hero Media admin page's "Players Hero" tab
 * (scope=PLAYERS), reusing the same HeroSlideshow component and
 * upload/order/delete infrastructure already powering the Home, Shop,
 * and Shop by Style heroes. Renders nothing when no admin media has
 * been configured yet, so the page falls back cleanly to the existing
 * text header below without showing an empty banner block.
 */
export default function PlayersHero() {
  const [slides, setSlides] = useState<Slide[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/hero-slides?scope=PLAYERS')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Slide[]) => {
        if (!cancelled) setSlides(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setSlides([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hasSlides = Array.isArray(slides) && slides.some((s) => s.active)
  if (!hasSlides) return null

  return (
    <section className="relative h-[38vh] max-h-[380px] min-h-[220px] w-full overflow-hidden bg-jays-navy sm:h-[46vh] sm:max-h-[440px] lg:h-[52vh] lg:max-h-[500px]">
      <HeroSlideshow scope="PLAYERS" imagePosition="top" overlay={false} initialSlides={slides!} transition="fade" />
    </section>
  )
}
