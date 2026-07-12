'use client'

import { useState, useEffect, useCallback } from 'react'

interface Review {
  id: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  pendingApproval?: boolean
}

function StarRating({ rating, onRate, interactive = false, size = 'md' }: {
  rating: number
  onRate?: (r: number) => void
  interactive?: boolean
  size?: 'sm' | 'md'
}) {
  const [hover, setHover] = useState(0)
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <svg
            className={`${dim} ${
              star <= (hover || rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-300'
            } transition-colors`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [productId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !comment.trim() || rating === 0 || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      })

      if (res.ok) {
        const { review } = await res.json()

        // Optimistically show the review immediately on the product page
        const optimisticReview: Review = {
          ...review,
          id: review?.id ?? `pending-${Date.now()}`,
          createdAt: review?.createdAt ?? new Date().toISOString(),
          pendingApproval: true,
        }

        setReviews((prev) => [optimisticReview, ...prev])
        setName('')
        setRating(0)
        setComment('')
        setShowForm(false)

        // Re-fetch in the background to sync with server state
        fetchReviews()
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-jays-navy uppercase text-sm tracking-wide">
            Fan Reviews
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(avgRating)} size="sm" />
              <span className="text-xs text-jays-steel">
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-display font-semibold uppercase tracking-wide text-jays-red hover:text-red-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-jays-ice rounded-xl p-4 mb-4 border border-gray-100">
          <div className="mb-3">
            <label className="block text-xs font-semibold text-jays-navy mb-1 uppercase tracking-wide">Your Rating</label>
            <StarRating rating={rating} onRate={setRating} interactive size="md" />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-jays-navy mb-1 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-jays-navy focus:outline-none focus:ring-2 focus:ring-jays-navy/20"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-jays-navy mb-1 uppercase tracking-wide">Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-jays-navy focus:outline-none focus:ring-2 focus:ring-jays-navy/20 resize-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || !comment.trim() || rating === 0 || submitting}
            className="bg-jays-navy text-white font-display font-semibold uppercase tracking-wide text-xs px-5 py-2 rounded-lg hover:bg-jays-royal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 && !showForm ? (
        <p className="text-sm text-jays-steel/70 text-center py-4">No reviews yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-jays-navy text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">
                    {review.customerName.charAt(0)}
                  </div>
                  <span className="font-semibold text-jays-navy text-sm">{review.customerName}</span>
                  {review.pendingApproval && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
                      Pending Approval
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-jays-steel">
                  {new Date(review.createdAt).toLocaleDateString('en-CA')}
                </span>
              </div>
              <StarRating rating={review.rating} size="sm" />
              <p className="text-sm text-jays-steel mt-1.5 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
