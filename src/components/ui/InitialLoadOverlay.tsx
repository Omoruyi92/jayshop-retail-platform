'use client'

// InitialLoadOverlay.tsx — full-viewport branded overlay shown on every FULL
// document load (hard refresh / first visit). Route-level `loading.tsx`
// boundaries only cover the page area during SSR streaming; they cannot stop
// the first-paint churn of a hard reload (font swap, status pill population,
// image decode, hydration). This overlay reuses the same BrandedLoading
// visual, holds for a minimum branded beat (~1.2s), waits for fonts + the
// window load event (capped), then crossfades out — so the page underneath
// settles fully before it is revealed.
//
// It renders VISIBLE in the SSR HTML (no JS needed for first paint, so there
// is never a flash of half-loaded content before hydration), and is removed
// client-side after the fade. Client-side navigations never remount the
// (public) layout, so the overlay only ever runs once per full document load.
import { useEffect, useState } from 'react'
import BrandedLoading from '@/components/ui/BrandedLoading'

const MIN_VISIBLE_MS = 1200 // minimum branded beat, measured from navigation start
const MAX_WAIT_MS = 2600 // never hold the page hostage waiting for slow assets
const FADE_MS = 600

export default function InitialLoadOverlay() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible')

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const fontsReady: Promise<unknown> =
      typeof document !== 'undefined' && document.fonts ? document.fonts.ready : Promise.resolve()
    const windowLoaded: Promise<void> =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }))
    const cap = new Promise<void>((resolve) => {
      timers.push(setTimeout(resolve, MAX_WAIT_MS))
    })

    Promise.race([Promise.all([fontsReady, windowLoaded]), cap]).then(() => {
      if (cancelled) return
      // performance.now() is relative to navigation start, so the minimum
      // visible time counts from the moment the SSR overlay first painted,
      // not from hydration.
      const remaining = Math.max(0, MIN_VISIBLE_MS - performance.now())
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          setPhase('fading')
          timers.push(
            setTimeout(() => {
              if (!cancelled) setPhase('gone')
            }, FADE_MS)
          )
        }, remaining)
      )
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <>
      {/* If JS never runs (disabled / fatally failed), don't trap the user
          behind a permanent overlay. */}
      <noscript>
        <style>{`[data-initial-load-overlay]{display:none !important}`}</style>
      </noscript>
      <div
        data-initial-load-overlay
        aria-hidden={phase === 'fading'}
        className={`fixed inset-0 z-[200] flex transition-opacity ease-out ${
          phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <BrandedLoading />
      </div>
    </>
  )
}
