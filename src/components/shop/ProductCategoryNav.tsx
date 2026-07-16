'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { loadProductListContext, type ProductListContextItem } from '@/lib/shop/shopState'

/**
 * Previous/Next navigation within the exact category/filter/sort sequence
 * the customer was browsing on /shop before opening this product. Reads the
 * list context ShopPageClient persists to sessionStorage — renders nothing
 * if the customer arrived via a direct link (no saved context) or is at the
 * edge of a single-item list.
 */
export default function ProductCategoryNav({ currentSlug }: { currentSlug: string }) {
  const [list, setList] = useState<ProductListContextItem[] | null>(null)

  useEffect(() => {
    setList(loadProductListContext())
  }, [currentSlug])

  if (!list || list.length <= 1) return null

  const index = list.findIndex((item) => item.slug === currentSlug)
  if (index === -1) return null

  const prev = index > 0 ? list[index - 1] : null
  const next = index < list.length - 1 ? list[index + 1] : null
  if (!prev && !next) return null

  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white/70 px-3 py-2 shadow-sm">
      {prev ? (
        <Link
          href={`/shop/${prev.slug}`}
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-jays-ice"
        >
          <ChevronLeft
            size={18}
            className="shrink-0 text-jays-steel transition-transform duration-150 group-hover:-translate-x-0.5"
          />
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-jays-ice">
            <Image src={prev.imageUrl} alt={prev.name} fill sizes="36px" className="object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-jays-steel">Previous</p>
            <p className="truncate text-xs font-semibold text-jays-navy">{prev.name}</p>
          </div>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      <p className="shrink-0 text-xs font-medium text-jays-steel">
        {index + 1} / {list.length}
      </p>

      {next ? (
        <Link
          href={`/shop/${next.slug}`}
          className="group flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl px-2 py-1.5 text-right transition-colors hover:bg-jays-ice"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-jays-steel">Next</p>
            <p className="truncate text-xs font-semibold text-jays-navy">{next.name}</p>
          </div>
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-jays-ice">
            <Image src={next.imageUrl} alt={next.name} fill sizes="36px" className="object-contain" />
          </div>
          <ChevronRight
            size={18}
            className="shrink-0 text-jays-steel transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
