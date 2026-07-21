'use client'
import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Lightweight, dependency-free focus-trap for custom modals.
 *
 * The project's `Dialog` primitive (`@/components/ui/Dialog`) intentionally
 * avoids `@radix-ui/react-dialog` because it triggers an infinite-render bug
 * on this React 18 build (see Dialog.tsx). That workaround dropped Radix's
 * built-in focus management, so this hook re-implements the essentials:
 *  - traps Tab/Shift+Tab focus cycling within the modal container
 *  - closes on Escape
 *  - restores focus to whatever element had focus before the modal opened
 *    (typically the trigger button) once the modal closes
 *  - focuses the first focusable element (or the container itself) on open
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void
) {
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    const focusables = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])

    const raf = requestAnimationFrame(() => {
      const first = focusables()[0]
      ;(first ?? container)?.focus()
    })

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (current === first || !container?.contains(current)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (current === last || !container?.contains(current)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown, true)
      previouslyFocused.current?.focus?.()
    }
  }, [active, containerRef, onClose])
}
