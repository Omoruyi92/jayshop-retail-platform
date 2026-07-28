'use client'

import { useEffect } from 'react'

/**
 * Route-level error boundary. Without this, any uncaught client exception
 * (e.g. a missing translation key) bubbles all the way up and Next.js
 * unmounts the entire app, leaving a blank page with only the generic
 * "Application error: a client-side exception has occurred" message.
 * This boundary catches it, logs it, and gives the user a way back to a
 * working page instead of a dead end.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm text-jays-steel">
        We hit an unexpected error loading this page. You can try again, or head back to the homepage.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-jays-red px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white shadow-md transition-colors hover:bg-red-600"
        >
          Try Again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-jays-navy px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-jays-navy transition-colors hover:bg-jays-navy hover:text-white"
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}
