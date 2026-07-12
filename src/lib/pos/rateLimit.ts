/**
 * Simple in-memory sliding-window rate limiter for /api/pos/transaction.
 * ~50 rps per API key, no Redis — process-local state is acceptable since
 * this is a single-instance admin/POS backend (same convention as the
 * in-memory analytics cache in /api/admin/analytics/overview).
 */

const WINDOW_MS = 1000
const MAX_PER_WINDOW = 50

type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()

/** Returns true if the request is allowed, false if the caller should get a 429. */
export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { timestamps: [] }
    buckets.set(key, bucket)
  }
  // Drop timestamps outside the current window.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS)
  if (bucket.timestamps.length >= MAX_PER_WINDOW) {
    return false
  }
  bucket.timestamps.push(now)

  // Opportunistic cleanup so the map doesn't grow unbounded across many keys.
  if (buckets.size > 1000) {
    for (const [k, b] of Array.from(buckets.entries())) {
      if (b.timestamps.every((t) => now - t > WINDOW_MS * 5)) buckets.delete(k)
    }
  }

  return true
}
