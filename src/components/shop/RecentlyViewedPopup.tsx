'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

const SESSION_COUNT_KEY = 'jays-recently-viewed-popup-count'
const DISPLAY_DELAY_MS = 3000

export default function RecentlyViewedPopup() {
  const pathname = usePathname()
  const { recentlyViewed } = useRecentlyViewed()
  const [isOpen, setIsOpen] = useState(false)
  const [showCount, setShowCount] = useState(0)

  // Read session display count from sessionStorage on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_COUNT_KEY)
      setShowCount(raw ? Math.max(0, parseInt(raw, 10) || 0) : 0)
    } catch {
      setShowCount(0)
    }
  }, [])

  // Trigger the popup when the user has viewed items and we have budget left.
  useEffect(() => {
    if (!recentlyViewed.length) return
    if (showCount >= 2) return

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, DISPLAY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [recentlyViewed.length, showCount])

  // Book the session budget when the popup opens.
  useEffect(() => {
    if (!isOpen) return
    setShowCount((c) => {
      const next = c + 1
      try {
        sessionStorage.setItem(SESSION_COUNT_KEY, String(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [isOpen])

  const handleClose = () => setIsOpen(false)

  if (!isOpen) return null

  // Filter out the current product when on its page; show the most recent 4.
  const items = recentlyViewed
    .filter((item) => pathname !== `/shop/${item.slug}`)
    .slice(0, 4)

  // If nothing remains after filtering, hide the popup.
  if (!items.length) return null

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:justify-end sm:pr-4 sm:pb-4"
      onClick={handleClose}
      aria-hidden="true"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-80 max-w-md m-0 sm:m-4 animate-in slide-in-from-bottom-4 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recently-viewed-title"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 id="recently-viewed-title" className="font-bold text-jays-navy">
                Pick up where you left off
              </h3>
              <p className="text-xs text-jays-steel">
                Recently viewed items
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-jays-steel hover:bg-jays-ice transition-colors"
              aria-label="Close recently viewed items"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/shop/${item.slug}`}
                onClick={handleClose}
                className="flex-shrink-0 w-28 snap-start group"
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-jays-ice border border-gray-100 mb-1.5">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    unoptimized
                  />
                </div>
                <p className="text-xs font-medium text-jays-navy line-clamp-2 leading-snug">
                  {item.name}
                </p>
                <p className="text-xs text-jays-steel">
                  ${(item.priceCents / 100).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
