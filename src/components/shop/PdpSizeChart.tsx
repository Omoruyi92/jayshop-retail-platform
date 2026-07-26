'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Ruler, X } from 'lucide-react'
import {
  resolveSizeChartKinds,
  SIZE_CHART_LABELS,
  MENS_SIZES,
  MENS_CHEST,
  MENS_WAIST,
  WOMENS_SIZES,
  WOMENS_BUST,
  WOMENS_WAIST,
  KIDS_ROWS,
  HAT_ROWS,
  type SizeChartKind,
} from '@/lib/sizeChartData'

interface Props {
  category?: string | null
  productType?: string | null
  hatStyle?: string | null
  ageGroup?: string | null
}

/**
 * PDP-only "Size Chart" dropdown trigger + panel.
 *
 * Deliberately separate from the global "Size Chart" nav link (SubNavBar.tsx
 * → /size-chart), which keeps navigating to the full page from every page,
 * including the PDP. This component only ever renders where ProductDetails
 * renders it (the PDP), so it can never leak onto the shop grid, home page,
 * or any other route.
 *
 * Layout stability: the panel is `absolute` (not part of document flow) and
 * anchored to this trigger's own wrapper, which is `position: relative`.
 * Opening/closing therefore never changes the height of surrounding content
 * (Select Size buttons, price, Add to Cart, etc.) — no CLS, unlike e.g. an
 * inline-expanding accordion would cause.
 */
export default function PdpSizeChart({ category, productType, hatStyle, ageGroup }: Props) {
  const [open, setOpen] = useState(false)
  const [rendered, setRendered] = useState(false)
  const [flipUp, setFlipUp] = useState(false)
  const [desktopMaxHeight, setDesktopMaxHeight] = useState<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const kinds = resolveSizeChartKinds({ category, productType, hatStyle, ageGroup })

  useEffect(() => {
    if (open) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
      setRendered(true)
      return
    }
    // Keep the panel mounted briefly so the closing transition can play,
    // then unmount so it doesn't sit in the DOM (and can't be tabbed into)
    // while hidden.
    closeTimeoutRef.current = setTimeout(() => setRendered(false), 200)
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  // Desktop/tablet collision detection: the panel is anchored below the
  // trigger (`sm:top-full`) by default, matching how the "Select Size" row
  // sits high up on most PDPs. But on shorter viewports (or a trigger lower
  // on the page), anchoring below can push the panel's bottom past the
  // viewport edge. Flip it to open upward when there isn't enough room
  // below but there is enough above, and clamp its max-height to whichever
  // side's available space so it never bleeds past the top or bottom edge
  // either — internal `overflow-y-auto` handles any remaining content.
  // (Below `sm`, the panel is a `fixed` bottom-sheet and is always
  // viewport-safe regardless of trigger position, so this is skipped.)
  useLayoutEffect(() => {
    if (!rendered) {
      setFlipUp(false)
      setDesktopMaxHeight(null)
      return
    }
    function measure() {
      if (window.innerWidth < 640) {
        setFlipUp(false)
        setDesktopMaxHeight(null)
        return
      }
      const trigger = wrapperRef.current
      const panel = panelRef.current
      if (!trigger || !panel) return
      const triggerRect = trigger.getBoundingClientRect()
      const panelHeight = panel.offsetHeight
      const margin = 12 // matches sm:mt-2 / sm:mb-2 gap
      const edgeGutter = 8 // small breathing room from the viewport edge
      const spaceBelow = Math.max(0, window.innerHeight - triggerRect.bottom - margin - edgeGutter)
      const spaceAbove = Math.max(0, triggerRect.top - margin - edgeGutter)
      // Flip up only if there's not enough room below AND the top side
      // genuinely offers more room — otherwise stay below (default).
      const shouldFlip = spaceBelow < panelHeight && spaceAbove > spaceBelow
      setFlipUp(shouldFlip)
      // Clamp strictly to whichever side was chosen so the panel can never
      // bleed past that edge, even on very short viewports — internal
      // overflow-y-auto (on the table wrapper) takes over from there.
      const available = shouldFlip ? spaceAbove : spaceBelow
      setDesktopMaxHeight(Math.max(0, Math.min(available, window.innerHeight * 0.7)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [rendered, open, kinds])

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-jays-navy underline underline-offset-4 decoration-jays-navy/30 hover:decoration-jays-navy transition-colors"
      >
        <Ruler size={13} strokeWidth={2.2} />
        Size Chart
      </button>

      {rendered && (
        <>
          {/* Mobile/small-viewport backdrop for the bottom-sheet variant. */}
          <div
            className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ease-out sm:hidden ${
              open ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Size chart"
            style={desktopMaxHeight != null ? ({ '--sc-max-h': `${desktopMaxHeight}px` } as CSSProperties) : undefined}
            className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] w-full rounded-t-2xl border-t border-gray-100 bg-white shadow-xl transition-all duration-200 ease-out
              sm:absolute sm:inset-x-auto sm:inset-auto sm:bottom-auto sm:right-0 sm:left-auto sm:w-[280px] sm:max-w-[min(85vw,320px)] sm:rounded-xl sm:rounded-t-xl sm:border-t-0 sm:border
              ${desktopMaxHeight != null ? 'sm:max-h-[var(--sc-max-h)]' : 'sm:max-h-[70vh]'}
              ${flipUp ? 'sm:bottom-full sm:top-auto sm:mb-2' : 'sm:top-full sm:bottom-auto sm:mt-2'}
              ${
                open
                  ? 'opacity-100 translate-y-0 sm:scale-100'
                  : `opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 pointer-events-none ${flipUp ? 'sm:translate-y-1' : 'sm:-translate-y-1'}`
              }`}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
              <p className="font-display text-xs font-bold uppercase tracking-wider text-jays-navy">
                {kinds.map((k) => SIZE_CHART_LABELS[k]).join(' / ')}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close size chart"
                className="rounded-lg p-1 text-jays-steel hover:bg-jays-ice transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div
              className={`max-h-[70vh] overflow-y-auto px-4 py-3 ${
                desktopMaxHeight != null ? 'sm:max-h-[max(0px,calc(var(--sc-max-h)-48px))]' : 'sm:max-h-[calc(70vh-48px)]'
              }`}
            >
              {kinds.map((kind) => (
                <SizeChartTable key={kind} kind={kind} />
              ))}
              <a
                href="/size-chart"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 mb-1 inline-block text-[11px] font-semibold text-jays-royal hover:underline"
              >
                View full size chart →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SizeChartTable({ kind }: { kind: SizeChartKind }) {
  if (kind === 'hats') {
    return (
      <table className="w-full text-xs">
        <thead>
          <tr className="text-jays-steel">
            <th className="text-left py-1 font-medium">Size</th>
            <th className="text-center py-1 font-medium">Inches</th>
            <th className="text-center py-1 font-medium">CM</th>
          </tr>
        </thead>
        <tbody>
          {HAT_ROWS.map((r) => (
            <tr key={r.size} className="border-t border-gray-50">
              <td className="py-1 font-semibold text-jays-navy">{r.size}</td>
              <td className="py-1 text-center text-jays-steel">{r.inch}</td>
              <td className="py-1 text-center text-jays-steel">{r.cm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (kind === 'kids') {
    return (
      <table className="w-full text-xs">
        <thead>
          <tr className="text-jays-steel">
            <th className="text-left py-1 font-medium">Size</th>
            <th className="text-center py-1 font-medium">Age</th>
            <th className="text-center py-1 font-medium">Chest (in)</th>
          </tr>
        </thead>
        <tbody>
          {KIDS_ROWS.map((r) => (
            <tr key={r.size} className="border-t border-gray-50">
              <td className="py-1 font-semibold text-jays-navy">{r.size}</td>
              <td className="py-1 text-center text-jays-steel">{r.age}</td>
              <td className="py-1 text-center text-jays-steel">{r.chest}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (kind === 'womens') {
    return (
      <table className="w-full text-xs">
        <thead>
          <tr className="text-jays-steel">
            <th className="text-left py-1 font-medium">Size</th>
            <th className="text-center py-1 font-medium">Bust (in)</th>
            <th className="text-center py-1 font-medium">Waist (in)</th>
          </tr>
        </thead>
        <tbody>
          {WOMENS_SIZES.map((s) => (
            <tr key={s} className="border-t border-gray-50">
              <td className="py-1 font-semibold text-jays-navy">{s}</td>
              <td className="py-1 text-center text-jays-steel">{WOMENS_BUST[s]}</td>
              <td className="py-1 text-center text-jays-steel">{WOMENS_WAIST[s]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // mens / unisex (default)
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-jays-steel">
          <th className="text-left py-1 font-medium">Size</th>
          <th className="text-center py-1 font-medium">Chest (in)</th>
          <th className="text-center py-1 font-medium">Waist (in)</th>
        </tr>
      </thead>
      <tbody>
        {MENS_SIZES.map((s) => (
          <tr key={s} className="border-t border-gray-50">
            <td className="py-1 font-semibold text-jays-navy">{s}</td>
            <td className="py-1 text-center text-jays-steel">{MENS_CHEST[s]}</td>
            <td className="py-1 text-center text-jays-steel">{MENS_WAIST[s]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
