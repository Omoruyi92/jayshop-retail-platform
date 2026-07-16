'use client'
import { useEffect } from 'react'

/**
 * Guards against a common local-dev symptom: an old production build
 * (`npm run build && npm start`) registers the PWA service worker, which then
 * keeps serving stale cached CSS/JS chunks to `npm run dev` on subsequent
 * refreshes/restarts (service worker registration + Cache Storage persist in
 * the browser regardless of the dev server restarting). Stale/mismatched CSS
 * chunks are what cause the "zoomed"/broken-layout look, since components
 * relying on Tailwind classes (e.g. `position: relative` containers for
 * next/image `fill`) silently lose their styling.
 *
 * In development, proactively unregister any service worker and clear the
 * Cache Storage so every refresh always gets fresh assets from the dev server.
 */
export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    }).catch(() => {})

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key))
      }).catch(() => {})
    }
  }, [])

  return null
}
