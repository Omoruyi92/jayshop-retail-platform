'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
          aria-label="Previous product"
          className="group flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-jays-steel transition-colors hover:bg-jays-ice hover:text-jays-navy"
        >
          <ChevronLeft
            size={18}
            className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5"
          />
          Previous
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
          aria-label="Next product"
          className="group flex shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-jays-steel transition-colors hover:bg-jays-ice hover:text-jays-navy"
        >
          Next
          <ChevronRight
            size={18}
            className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
