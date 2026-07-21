// PartnerLogosBar.tsx — inline banner with location status + promotion marquee
'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const OPEN_HOUR = 10
const CLOSE_HOUR = 17

function useStoreStatus() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const hour = now.getHours()
  const isOpen = hour >= OPEN_HOUR && hour < CLOSE_HOUR

  const statusLabel = isOpen ? 'Open' : 'Closed'
  const nextChange = isOpen
    ? `Closes at ${CLOSE_HOUR > 12 ? CLOSE_HOUR - 12 : CLOSE_HOUR}:00 PM`
    : `Opens at ${OPEN_HOUR}:00 AM`

  return { isOpen, statusLabel, nextChange }
}

/* Shared location badge used on both desktop (inline) and mobile (strip below header) */
export function LocationBadge({ compact = false }: { compact?: boolean }) {
  const { isOpen, statusLabel, nextChange } = useStoreStatus()

  return (
    <div className="flex items-center gap-2 shrink-0">
      <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-300/80 shrink-0`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
      </svg>
      <div className="leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-bold uppercase tracking-wide text-white ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            Jays Shop
          </span>
          <span className="text-blue-300/40 text-[9px]">·</span>
          <span className="text-blue-200/60 text-[9px]">Toronto</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.5)]'}`} />
          <span className={`text-[9px] font-semibold ${isOpen ? 'text-emerald-300' : 'text-red-300'}`}>
            {statusLabel}
          </span>
          <span className="text-blue-300/30 text-[8px]">·</span>
          <span className="text-blue-200/50 text-[8px]">{nextChange}</span>
        </div>
      </div>
    </div>
  )
}

interface Promotion {
  id: string
  text: string
  link: string | null
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])

  useEffect(() => {
    fetch('/api/promotions')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.promotions)) setPromotions(d.promotions) })
      .catch(() => {})
  }, [])

  return promotions
}

/* Duplicated promo set for seamless marquee loop */
function PromoStrip({ promotions }: { promotions: Promotion[] }) {
  return (
    <>
      {promotions.map((p, i) => {
        const content = (
          <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-white/10 px-3 py-1 whitespace-nowrap hover:bg-white/15 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-jays-red animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-100">{p.text}</span>
          </span>
        )
        return p.link ? (
          <Link key={`${p.id}-${i}`} href={p.link} className="shrink-0">
            {content}
          </Link>
        ) : (
          <div key={`${p.id}-${i}`} className="shrink-0">{content}</div>
        )
      })}
    </>
  )
}

/**
 * Marquee that only renders while there is at least one active admin-published
 * promotion. Renders nothing otherwise — there is no "partners" fallback
 * marquee anymore; the scrolling logo strip was removed from the header.
 * Shared between the desktop pill (PartnerLogosBar) and the mobile strip
 * (Header's secondary row) so both stay in sync with the same promotions.
 */
export function PromoMarquee({ compact = false }: { compact?: boolean }) {
  const promotions = usePromotions()
  if (promotions.length === 0) return null

  return (
    <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
      <span className={`text-blue-300/40 uppercase tracking-[0.12em] font-display shrink-0 mr-1 ${compact ? 'text-[6px]' : 'text-[7px]'}`}>
        Deals
      </span>
      <div className="group/promo overflow-hidden flex-1 min-w-0 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex items-center gap-2 w-max group-hover/promo:[animation-play-state:paused]">
          <PromoStrip promotions={promotions} />
          {/* Duplicate for seamless loop */}
          <PromoStrip promotions={promotions} />
        </div>
      </div>
    </div>
  )
}

export default function PartnerLogosBar() {
  const promotions = usePromotions()
  const hasPromotions = promotions.length > 0

  return (
    <div className={`flex items-center bg-white/[0.06] rounded-full px-3 py-1 border border-white/10 gap-2 ${hasPromotions ? 'justify-between' : ''}`}>
      {/* Location + Status */}
      <LocationBadge />

      {hasPromotions && (
        <>
          <span className="w-px h-6 bg-white/10 shrink-0" aria-hidden="true" />
          <PromoMarquee />
        </>
      )}
    </div>
  )
}
