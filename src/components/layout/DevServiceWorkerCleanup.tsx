'use client'
import { useEffect } from 'react'

const RELOAD_FLAG = 'jays-shop-dev-sw-cleanup-reloaded'

/**
 * Guards against a common local-dev symptom: an old production build
 * (`npm run build && npm start`) registers the PWA service worker, which then
 * keeps intercepting fetches - including `/​_next/static/css/*.css` requests -
 * on subsequent `npm run dev` sessions regardless of the dev server restarting
 * (service worker registration + Cache Storage persist in the browser, not on
 * the server). When the stale worker serves a cached/mismatched response for
 * the stylesheet request, Tailwind never applies at all: components render
 * with raw browser defaults (underlined links, no layout, no font), and any
 * unconstrained `next/image` `fill` element balloons to the size of its
 * nearest positioned ancestor (often the viewport), looking like the whole
 * page is "zoomed".
 *
 * A plain unregister-on-mount is not enough: the CURRENT page load is already
 * controlled by the stale worker by the time this effect runs, so the broken
 * first paint has already happened. To self-heal within the same session, we
 * unregister + clear all caches, and if we actually found a stale
 * registration/cache, force a single automatic reload (guarded by
 * sessionStorage so we never loop) so the next request is served by a clean,
 * un-intercepted network fetch straight from the dev server.
 */
export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let foundStaleState = false

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        if (registrations.length > 0) {
          foundStaleState = true
          await Promise.all(registrations.map((registration) => registration.unregister()))
        }
      } catch {
        // ignore
      }

      try {
        if ('caches' in window) {
          const keys = await caches.keys()
          if (keys.length > 0) {
            foundStaleState = true
            await Promise.all(keys.map((key) => caches.delete(key)))
          }
        }
      } catch {
        // ignore
      }

      if (foundStaleState && !sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
      }
    }

    cleanup()
  }, [])

  return null
}
