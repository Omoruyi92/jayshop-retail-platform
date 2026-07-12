'use client'

import Link from 'next/link'

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  baseUrl,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  baseUrl: string
}) {
  if (totalPages <= 1) return null

  const pageHref = (page: number) => (page <= 1 ? baseUrl : `${baseUrl}?page=${page}`)

  const pages: number[] = []
  for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) {
    pages.push(p)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8">
      <p className="text-xs text-jays-steel">
        {totalItems} item{totalItems === 1 ? '' : 's'} total
      </p>
      <nav className="flex items-center gap-1">
        <Link
          href={pageHref(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage === 1}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold border border-border ${
            currentPage === 1
              ? 'pointer-events-none opacity-40'
              : 'text-jays-navy hover:bg-jays-ice'
          }`}
        >
          Prev
        </Link>
        {pages.map((p) => (
          <Link
            key={p}
            href={pageHref(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
              p === currentPage
                ? 'bg-jays-navy text-white border-jays-navy'
                : 'text-jays-navy border-border hover:bg-jays-ice'
            }`}
          >
            {p}
          </Link>
        ))}
        <Link
          href={pageHref(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage === totalPages}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold border border-border ${
            currentPage === totalPages
              ? 'pointer-events-none opacity-40'
              : 'text-jays-navy hover:bg-jays-ice'
          }`}
        >
          Next
        </Link>
      </nav>
    </div>
  )
}
