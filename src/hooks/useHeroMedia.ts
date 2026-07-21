'use client'

import { useEffect, useState } from 'react'
import type { HeroScope, Slide } from '@/types/hero'

interface UseHeroMediaResult {
  /** Active slides, sorted by sortOrder. Empty until `loaded` is true. */
  slides: Slide[]
  /** True once the slides are known (either passed in or fetched). */
  loaded: boolean
  /** Convenience flag: true when there is at least one active slide. */
  hasSlides: boolean
}

/**
 * Shared hero-slide data hook used by every hero section (Home, Shop, Shop
 * by Style, Players). Centralizes the "use server-provided slides when
 * available, otherwise fetch client-side" logic and the active/sortOrder
 * filtering that was previously duplicated between `HeroSlideshow` (internal
 * fetch fallback) and `PlayersHero` (manual fetch + state).
 *
 * When `initialSlides` is provided (server-rendered pages), no client fetch
 * happens and the data is available on first render — avoiding a flash of
 * default/fallback content. When omitted (e.g. a fully client-rendered page
 * like Popular Players), it fetches `/api/hero-slides?scope=<scope>` once.
 */
export function useHeroMedia(scope: HeroScope, initialSlides?: Slide[]): UseHeroMediaResult {
  const hasInitialSlides = Array.isArray(initialSlides)
  const sortActive = (data: Slide[]) =>
    data.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder)

  const [slides, setSlides] = useState<Slide[]>(
    hasInitialSlides ? sortActive(initialSlides!) : []
  )
  const [loaded, setLoaded] = useState(hasInitialSlides)

  useEffect(() => {
    // Slides were already provided synchronously (server-fetched) — skip
    // the client-side fetch entirely so there is no loading gap/flash.
    if (hasInitialSlides) return

    let cancelled = false
    fetch(`/api/hero-slides?scope=${scope}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Slide[]) => {
        if (cancelled) return
        setSlides(sortActive(Array.isArray(data) ? data : []))
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, hasInitialSlides])

  return { slides, loaded, hasSlides: slides.length > 0 }
}
