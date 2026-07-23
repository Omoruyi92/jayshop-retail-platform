'use client'

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

const VIEWPORT_MARGIN = 8 // px gutter kept clear of the screen edges
const TRIGGER_GAP = 12 // px gap below the trigger icon (matches previous `mt-3`)

/**
 * Positions a header dropdown/popover panel using the trigger's real,
 * on-screen position instead of CSS `absolute right-0` anchored to the
 * trigger's own (narrow) wrapper. That anchoring approach clips off-screen
 * on mobile because other header elements (language selector, hamburger)
 * sit to the right of the bell/heart/bag icons, so the icons are never
 * actually flush with the viewport's right edge.
 *
 * Returns inline styles for `position: fixed`, right-aligned under the
 * trigger by default, clamped so the panel never overflows either edge of
 * the viewport. Recomputed on open, and while open on resize/scroll so the
 * panel keeps tracking the trigger.
 */
export function useDropdownPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>
) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })

  useLayoutEffect(() => {
    if (!open) return

    function update() {
      const trigger = triggerRef.current
      const panel = panelRef.current
      if (!trigger || !panel) return

      const triggerRect = trigger.getBoundingClientRect()
      const panelWidth = panel.offsetWidth
      const viewportWidth = window.innerWidth

      // Default: right-align panel under the trigger.
      let left = triggerRect.right - panelWidth
      // Clamp so it never overflows the right edge...
      left = Math.min(left, viewportWidth - panelWidth - VIEWPORT_MARGIN)
      // ...or the left edge.
      left = Math.max(left, VIEWPORT_MARGIN)

      const top = triggerRect.bottom + TRIGGER_GAP

      setStyle({ position: 'fixed', top, left, visibility: 'visible' })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, triggerRef, panelRef])

  return style
}
