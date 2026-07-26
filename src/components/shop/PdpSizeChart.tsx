'use client'

import { useEffect, useRef, useState } from 'react'
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
  const wrapperRef = useRef<HTMLDivElement>(null)
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
        <div
          role="dialog"
          aria-label="Size chart"
          className={`absolute z-40 left-0 top-full mt-2 w-[280px] max-w-[85vw] origin-top-left rounded-xl border border-gray-100 bg-white shadow-xl transition-all duration-200 ease-out ${
            open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
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
          <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
            {kinds.map((kind) => (
              <SizeChartTable key={kind} kind={kind} />
            ))}
            <a
              href="/size-chart"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[11px] font-semibold text-jays-royal hover:underline"
            >
              View full size chart →
            </a>
          </div>
        </div>
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
