'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

const FALLBACK_IMAGE = '/placeholder-product.svg'

export default function RecentlyViewed() {
  const { recentlyViewed } = useRecentlyViewed()
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set())

  if (recentlyViewed.length === 0) return null

  return (
    <div className="mt-6">
      {/* Banner container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 shadow-xl">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="relative z-10 px-4 sm:px-5 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/20">
                <Clock size={14} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-xs sm:text-sm uppercase tracking-wider leading-none">
                  Recently Viewed
                </h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Pick up where you left off</p>
              </div>
            </div>
            <Link
              href="/shop"
              className="flex items-center gap-0.5 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
            >
              Shop All
              <ChevronRight size={12} />
            </Link>
          </div>

          {/* Product carousel */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {recentlyViewed.map((item) => (
              <Link
                key={item.id}
                href={`/shop/${item.slug}`}
                className="group shrink-0 w-[120px] sm:w-[140px]"
              >
                <div className="relative rounded-xl overflow-hidden bg-white/[0.07] border border-white/10 backdrop-blur-sm hover:bg-white/[0.12] hover:border-cyan-400/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-b from-white/10 to-white/5">
                    <Image
                      src={item.imageUrl && !brokenIds.has(item.id) ? item.imageUrl : FALLBACK_IMAGE}
                      alt={item.name}
                      fill
                      sizes="140px"
                      onError={() => setBrokenIds((prev) => new Set(prev).add(item.id))}
                      className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Subtle shine overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  {/* Info */}
                  <div className="px-2.5 py-2 border-t border-white/5">
                    <p className="text-[9px] sm:text-[10px] font-semibold text-slate-200 uppercase leading-tight line-clamp-2 group-hover:text-white transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold text-white mt-1">
                      ${(item.priceCents / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
