'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ClearHistoryModal } from '@/components/admin/ClearHistoryModal'
import { useCurrentAdmin } from '@/hooks/useCurrentAdmin'
import {
  Star,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  BarChart2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Heart,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Filter,
} from 'lucide-react'

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface ProductStat {
  productId: string
  productName: string
  productSlug: string
  productImage: string
  brand: string
  category: string
  totalReviews: number
  avgRating: number
  ratings: Record<number, number>
}

interface RecentReview {
  id: string
  customerName: string
  rating: number
  comment: string
  status: ReviewStatus
  moderatedBy: string | null
  moderatedAt: string | null
  createdAt: string
  productName: string
  productSlug: string
  productImage: string
}

interface SentimentDay {
  date: string
  count: number
  avgRating: number
}

interface AnalyticsData {
  totalReviews: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  avgRating: number
  distribution: Record<number, number>
  perProduct: ProductStat[]
  mostRated: ProductStat | null
  leastRated: ProductStat | null
  highestRated: ProductStat | null
  sentimentTrend: SentimentDay[]
  recentReviews: RecentReview[]
}

interface LikedProduct {
  productId: string
  productName: string
  productImage: string
  productSlug: string
  category: string
  brand: string
  likeCount: number
}

interface LikeTrendDay {
  date: string
  count: number
}

interface RecentLike {
  id: string
  productName: string
  productImage: string
  productSlug: string
  createdAt: string
}

interface LikesData {
  totalLikes: number
  uniqueProductsLiked: number
  topLiked: LikedProduct[]
  likesTrend: LikeTrendDay[]
  recent: RecentLike[]
}

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${dim} ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

const RATING_COLORS = ['', 'bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-green-500']
const SENTIMENT_LABELS = ['', 'Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive']

const STATUS_STYLES: Record<ReviewStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

export default function ReviewsAnalyticsPage() {
  const { can } = useCurrentAdmin()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [likesData, setLikesData] = useState<LikesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'recent' | 'likes'>('overview')
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL')
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [showClearLikes, setShowClearLikes] = useState(false)

  async function fetchData(silent = false) {
    if (!silent) setLoading(true)
    try {
      const url = statusFilter !== 'ALL' ? `/api/admin/reviews?status=${statusFilter}` : '/api/admin/reviews'
      const [reviewsRes, likesRes] = await Promise.all([
        fetch(url),
        fetch('/api/admin/likes'),
      ])
      if (reviewsRes.ok) setData(await reviewsRes.json())
      if (likesRes.ok) setLikesData(await likesRes.json())
    } catch { /* ignore */ }
    if (!silent) setLoading(false)
  }

  useEffect(() => { fetchData() }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep engagement/likes data close to real-time without requiring a
  // manual refresh: poll silently in the background while the tab is visible.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(true)
      }
    }, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function updateReviewStatus(id: string, status: ReviewStatus) {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const { review } = await res.json()
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            recentReviews: prev.recentReviews.map((r) => (r.id === id ? { ...r, status: review.status, moderatedBy: review.moderatedBy, moderatedAt: review.moderatedAt } : r)),
          }
        })
      }
    } catch { /* ignore */ }
    setActionLoading((prev) => ({ ...prev, [id]: false }))
  }

  async function deleteReview(id: string) {
    if (!confirm('Permanently delete this review?')) return
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            recentReviews: prev.recentReviews.filter((r) => r.id !== id),
          }
        })
      }
    } catch { /* ignore */ }
    setActionLoading((prev) => ({ ...prev, [id]: false }))
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 text-center text-jays-steel">
        Failed to load analytics data.
      </div>
    )
  }

  const overallSentiment = data.avgRating >= 4 ? 'Positive' : data.avgRating >= 3 ? 'Neutral' : 'Negative'
  const maxDistribution = Math.max(...Object.values(data.distribution), 1)

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-jays-navy uppercase tracking-wide">
            Reviews & Feedback
          </h1>
          <p className="text-sm text-jays-steel mt-0.5">Customer sentiment and product feedback analytics</p>
        </div>
        <div className="flex items-center gap-4">
          {activeTab === 'likes' && can('likes:clear') && (
            <button
              onClick={() => setShowClearLikes(true)}
              className="flex items-center gap-1.5 text-sm text-jays-red hover:text-red-700 transition-colors"
              data-testid="clear-likes-button"
            >
              <Trash2 size={14} />
              Clear Likes
            </button>
          )}
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 text-sm text-jays-navy hover:text-jays-red transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-jays-steel text-xs font-medium uppercase tracking-wider mb-2">
            <MessageSquare size={14} />
            Total Reviews
          </div>
          <p className="text-2xl font-bold text-jays-navy">{data.totalReviews}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-jays-steel text-xs font-medium uppercase tracking-wider mb-2">
            <AlertCircle size={14} className="text-amber-500" />
            Pending
          </div>
          <p className="text-2xl font-bold text-amber-600">{data.pendingCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-jays-steel text-xs font-medium uppercase tracking-wider mb-2">
            <CheckCircle size={14} className="text-green-600" />
            Approved
          </div>
          <p className="text-2xl font-bold text-green-600">{data.approvedCount}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-jays-steel text-xs font-medium uppercase tracking-wider mb-2">
            <Star size={14} />
            Avg Rating
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-jays-navy">{data.avgRating.toFixed(1)}</p>
            <StarDisplay rating={data.avgRating} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-jays-steel text-xs font-medium uppercase tracking-wider mb-2">
            <BarChart2 size={14} />
            Products Reviewed
          </div>
          <p className="text-2xl font-bold text-jays-navy">{data.perProduct.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-jays-steel text-xs font-medium uppercase tracking-wider mb-2">
            <Heart size={14} className="text-jays-red" />
            Fan Likes
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-jays-red">{likesData?.totalLikes ?? 0}</p>
            <span className="text-xs text-jays-steel">
              {likesData?.uniqueProductsLiked ?? 0} products
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200">
        <div className="flex gap-1">
          {(['overview', 'products', 'recent', 'likes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-display font-semibold uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-jays-red text-jays-navy'
                  : 'border-transparent text-jays-steel hover:text-jays-navy'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'products' ? 'By Product' : tab === 'recent' ? 'Recent Reviews' : (
                <span className="flex items-center gap-1">
                  <Heart size={12} />
                  Likes
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'recent' && (
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-jays-steel" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | 'ALL')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-jays-navy focus:outline-none focus:ring-2 focus:ring-jays-red/20"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Rating Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide mb-4">
              Rating Distribution
            </h3>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.distribution[star] || 0
                const pct = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 shrink-0">
                      <span className="text-sm font-semibold text-jays-navy">{star}</span>
                      <svg className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${RATING_COLORS[star]}`}
                        style={{ width: `${Math.max((count / maxDistribution) * 100, count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-jays-steel w-16 text-right">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sentiment Trend (last 30 days) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide mb-4">
              Sentiment Trend (30 Days)
            </h3>
            {data.sentimentTrend.every((d) => d.count === 0) ? (
              <p className="text-sm text-jays-steel/70 text-center py-8">No reviews in the last 30 days</p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-end gap-px h-32">
                  {data.sentimentTrend.map((day) => {
                    const maxCount = Math.max(...data.sentimentTrend.map((d) => d.count), 1)
                    const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 8) : 0
                    const sentimentIdx = day.avgRating > 0 ? Math.round(day.avgRating) : 0
                    return (
                      <div key={day.date} className="flex-1 flex flex-col justify-end group relative">
                        <div
                          className={`rounded-t-sm transition-all ${day.count > 0 ? RATING_COLORS[sentimentIdx] || 'bg-gray-300' : 'bg-transparent'}`}
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                          <div className="bg-jays-navy text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            <p>{day.date}</p>
                            <p>{day.count} review{day.count !== 1 ? 's' : ''}</p>
                            {day.avgRating > 0 && <p>Avg: {day.avgRating.toFixed(1)} — {SENTIMENT_LABELS[Math.round(day.avgRating)]}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-jays-steel/60 px-0.5">
                  <span>{data.sentimentTrend[0]?.date.slice(5)}</span>
                  <span>{data.sentimentTrend[data.sentimentTrend.length - 1]?.date.slice(5)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Most/Highest/Least rated product cards */}
          <div className="lg:col-span-2 grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Most Reviewed', stat: data.mostRated, icon: TrendingUp, color: 'text-blue-600' },
              { label: 'Highest Rated', stat: data.highestRated, icon: ThumbsUp, color: 'text-green-600' },
              { label: 'Lowest Rated', stat: data.leastRated, icon: TrendingDown, color: 'text-red-500' },
            ].map(({ label, stat, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} className={color} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-jays-steel">{label}</span>
                </div>
                {stat ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-jays-ice rounded-lg overflow-hidden shrink-0 relative">
                      <Image src={stat.productImage} alt={stat.productName} fill className="object-contain p-1" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-jays-navy text-sm truncate">{stat.productName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarDisplay rating={stat.avgRating} size="sm" />
                        <span className="text-xs text-jays-steel">{stat.avgRating.toFixed(1)} ({stat.totalReviews})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-jays-steel/70">No data yet</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {data.perProduct.length === 0 ? (
            <p className="text-sm text-jays-steel/70 text-center py-12">No approved reviews submitted yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-jays-ice/50 text-left">
                  <th className="px-4 py-3 font-display font-semibold text-jays-navy uppercase text-xs tracking-wider">Product</th>
                  <th className="px-4 py-3 font-display font-semibold text-jays-navy uppercase text-xs tracking-wider text-center">Reviews</th>
                  <th className="px-4 py-3 font-display font-semibold text-jays-navy uppercase text-xs tracking-wider text-center">Avg Rating</th>
                  <th className="px-4 py-3 font-display font-semibold text-jays-navy uppercase text-xs tracking-wider hidden sm:table-cell">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.perProduct.map((p) => (
                  <tr key={p.productId} className="hover:bg-jays-ice/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-jays-ice rounded-lg overflow-hidden shrink-0 relative">
                          <Image src={p.productImage} alt={p.productName} fill className="object-contain p-0.5" sizes="40px" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-jays-navy truncate">{p.productName}</p>
                          <p className="text-xs text-jays-steel">{p.brand} · {p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-jays-navy">{p.totalReviews}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-semibold text-jays-navy">{p.avgRating.toFixed(1)}</span>
                        <StarDisplay rating={p.avgRating} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const count = p.ratings[star] || 0
                          const pct = p.totalReviews > 0 ? (count / p.totalReviews) * 100 : 0
                          return (
                            <div key={star} className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden" title={`${star}★: ${count} (${pct.toFixed(0)}%)`}>
                              <div className={`h-full rounded-full ${RATING_COLORS[star]}`} style={{ width: `${pct}%` }} />
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-3">
          {data.recentReviews.length === 0 ? (
            <p className="text-sm text-jays-steel/70 text-center py-12">No reviews match the selected filter.</p>
          ) : (
            data.recentReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-jays-ice rounded-lg overflow-hidden shrink-0 relative">
                    <Image src={review.productImage} alt={review.productName} fill className="object-contain p-1" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-jays-navy text-white rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                          {review.customerName.charAt(0)}
                        </div>
                        <span className="font-semibold text-jays-navy text-sm">{review.customerName}</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[review.status]}`}>
                          {review.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-jays-steel shrink-0">
                        {new Date(review.createdAt).toLocaleDateString('en-CA')}
                      </span>
                    </div>
                    <p className="text-xs text-jays-steel mt-0.5">{review.productName}</p>
                    <StarDisplay rating={review.rating} size="sm" />
                    <p className="text-sm text-jays-steel mt-1.5 leading-relaxed">{review.comment}</p>

                    {review.moderatedBy && (
                      <p className="text-[10px] text-jays-steel/70 mt-1">
                        Moderated by {review.moderatedBy} on{' '}
                        {new Date(review.moderatedAt ?? review.createdAt).toLocaleString('en-CA')}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {review.status !== 'APPROVED' && (
                        <button
                          onClick={() => updateReviewStatus(review.id, 'APPROVED')}
                          disabled={actionLoading[review.id]}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={12} />
                          Approve
                        </button>
                      )}
                      {review.status !== 'REJECTED' && (
                        <button
                          onClick={() => updateReviewStatus(review.id, 'REJECTED')}
                          disabled={actionLoading[review.id]}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={actionLoading[review.id]}
                        className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-jays-steel hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Likes tab */}
      {activeTab === 'likes' && likesData && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Heart size={14} className="text-jays-red" />
              Likes Trend (30 Days)
            </h3>
            {likesData.likesTrend.every((d) => d.count === 0) ? (
              <p className="text-sm text-jays-steel/70 text-center py-8">No likes in the last 30 days</p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-end gap-px h-32">
                  {likesData.likesTrend.map((day) => {
                    const maxCount = Math.max(...likesData.likesTrend.map((d) => d.count), 1)
                    const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 8) : 0
                    return (
                      <div key={day.date} className="flex-1 flex flex-col justify-end group relative">
                        <div
                          className="rounded-t-sm transition-all bg-jays-red/80"
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                          <div className="bg-jays-navy text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            <p>{day.date}</p>
                            <p>{day.count} like{day.count !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-jays-steel/60 px-0.5">
                  <span>{likesData.likesTrend[0]?.date.slice(5)}</span>
                  <span>{likesData.likesTrend[likesData.likesTrend.length - 1]?.date.slice(5)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-jays-red" />
              Most Liked Products
            </h3>
            {likesData.topLiked.length === 0 ? (
              <p className="text-sm text-jays-steel/70 text-center py-8">No likes yet</p>
            ) : (
              <div className="space-y-2.5">
                {likesData.topLiked.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3 group">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      i === 0 ? 'bg-jays-red text-white' : i === 1 ? 'bg-orange-400 text-white' : i === 2 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-jays-steel'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 bg-jays-ice rounded-lg overflow-hidden shrink-0 relative">
                      <Image src={p.productImage} alt={p.productName} fill className="object-contain p-0.5" sizes="32px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-jays-navy truncate">{p.productName}</p>
                      <p className="text-[10px] text-jays-steel">{p.brand} · {p.category}</p>
                    </div>
                    <div className="flex items-center gap-1 text-jays-red">
                      <Heart size={12} fill="currentColor" />
                      <span className="text-sm font-bold">{p.likeCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide mb-4">
              Recent Likes
            </h3>
            {likesData.recent.length === 0 ? (
              <p className="text-sm text-jays-steel/70 text-center py-8">No likes yet</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {likesData.recent.map((like) => (
                  <div key={like.id} className="flex items-center gap-2.5 bg-jays-ice/40 rounded-lg p-2.5 border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 relative">
                      <Image src={like.productImage} alt={like.productName} fill className="object-contain p-0.5" sizes="40px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-jays-navy truncate">{like.productName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Heart size={10} className="text-jays-red" fill="currentColor" />
                        <span className="text-[10px] text-jays-steel">
                          {new Date(like.createdAt).toLocaleDateString('en-CA')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showClearLikes && (
        <ClearHistoryModal
          title="Clear Fan Likes"
          itemLabel="fan likes"
          endpoint="/api/admin/likes/clear"
          confirmLabel="Clear Likes"
          hasFilters={false}
          onClose={() => setShowClearLikes(false)}
          onCleared={(deleted) => {
            toast.success(`Cleared ${deleted.toLocaleString('en-CA')} fan like${deleted !== 1 ? 's' : ''}`)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
