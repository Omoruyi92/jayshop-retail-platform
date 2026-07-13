'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import LetsGoJaysWatermark from '@/components/ui/LetsGoJaysWatermark'

interface Testimonial {
  id: string
  type: 'review' | 'feedback'
  name: string
  rating: number
  comment: string
  createdAt: string
  productName?: string
  productSlug?: string
  productImage?: string
}

interface TestimonialsData {
  avgRating: number
  reviewCount: number
  recentReviewCount: number
  testimonials: Testimonial[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 fill-gray-300'
          }`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

function relativeDate(isoDate: string) {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export default function FanTestimonials() {
  const { t } = useLanguage()
  const h = t.home
  const [data, setData] = useState<TestimonialsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/testimonials?limit=5')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!cancelled && payload) setData(payload)
      })
      .catch(() => {
        // No-op: hide section silently on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!loading && !data?.testimonials.length) return null

  const ratingText = data ? `${data.avgRating.toFixed(1)} / 5` : '—'
  const stats = [
    { value: ratingText, label: 'Average Rating' },
    { value: data?.reviewCount ?? '—', label: 'Positive Reviews' },
    { value: data?.recentReviewCount ?? '—', label: 'This Month' },
  ]

  const renderCard = (item: Testimonial, keySuffix = '') => (
    <div
      key={`${item.id}${keySuffix}`}
      aria-hidden={keySuffix !== '' || undefined}
      className="group/card shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-jays-navy/10 hover:-translate-y-1 hover:border-jays-navy/10 transition-all duration-300 p-5 flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-jays-navy text-sm truncate">
            {item.name}
          </p>
          <p className="text-[10px] text-jays-steel">{relativeDate(item.createdAt)}</p>
        </div>
        <StarRating rating={item.rating} />
      </div>

      <p className="text-jays-steel text-sm leading-relaxed line-clamp-4 flex-1">
        &ldquo;{item.comment}&rdquo;
      </p>

      {item.productName && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          {item.productImage && (
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 ring-1 ring-gray-100">
              <Image
                src={item.productImage}
                alt={item.productName}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          )}
          <p className="text-[11px] text-jays-steel truncate">
            Reviewed{' '}
            <span className="font-medium text-jays-navy">{item.productName}</span>
          </p>
        </div>
      )}

      {item.type === 'feedback' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-jays-royal bg-blue-50 rounded-full px-2 py-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified Fan
          </span>
        </div>
      )}
    </div>
  )

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true" style={{
        backgroundImage: 'radial-gradient(circle, #134A8E 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      <LetsGoJaysWatermark color="navy" density="light" />

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-[0.25em] text-jays-red mb-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Fan Feedback
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-jays-navy tracking-wide">
              {h.testimonialsTitle}
            </h2>
            <p className="text-jays-steel text-sm mt-2 max-w-lg">
              {h.testimonialsSubtitle}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-white/70 ring-1 ring-jays-navy/5 backdrop-blur-sm px-4 py-3 shadow-sm">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`text-center sm:text-right ${i > 0 ? 'pl-3 sm:pl-4 border-l border-jays-navy/10' : ''}`}
              >
                <p className="font-display text-lg sm:text-xl font-bold text-jays-navy leading-none">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-xs text-jays-steel uppercase tracking-wider mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[280px] sm:w-[320px] h-40 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Marquee — continuous, seamless, pause-on-hover/touch */}
        {!loading && data && (
          <div
            className="group/marquee relative overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <div
              className="animate-marquee flex w-max gap-4"
              style={{
                animationDuration: `${Math.max(data.testimonials.length * 7, 20)}s`,
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {data.testimonials.map((item) => renderCard(item))}
              {/* duplicated for a seamless infinite loop */}
              {data.testimonials.map((item) => renderCard(item, '-dup'))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
