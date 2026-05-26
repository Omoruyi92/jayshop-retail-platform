'use client'
import { useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

const RESET_EVENTS = [
  'mousemove',
  'mousedown',
  'keypress',
  'touchstart',
  'scroll',
] as const

export function useAdminSessionTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: '/admin/login' })
      }, TIMEOUT_MS)
    }

    RESET_EVENTS.forEach((event) =>
      window.addEventListener(event, reset, { passive: true })
    )

    // Start the timer immediately on mount
    reset()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      RESET_EVENTS.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [])
}
