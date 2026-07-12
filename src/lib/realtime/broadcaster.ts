import { EventEmitter } from 'events'

/**
 * Process-wide event bus for real-time inventory/hold change events.
 *
 * PG triggers (see prisma/migrations/20260704000000_inventory_realtime_notify)
 * are the primary source: pgListener.ts LISTENs on both channels and calls
 * `broadcaster.emit(channel, payload)` for every NOTIFY it receives.
 *
 * `logInventoryTransaction` also calls `broadcaster.emit` directly as a
 * belt-and-suspenders fallback for the window between a DB restart and the
 * PG listener reconnecting. Events are deduped by `ts` (+ productId/holdId)
 * so a mutation that fires both the trigger AND the fallback only reaches
 * SSE subscribers once.
 */

export type InventoryChangedPayload = {
  productId: string
  size: string | null
  locationId: string
  oldQty: number
  newQty: number
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  ts: number
}

export type HoldChangedPayload = {
  holdId: string
  productId: string
  size: string | null
  status: string
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  ts: number
}

export type RealtimeChannel = 'inventory_changed' | 'hold_changed'
export type RealtimePayload = InventoryChangedPayload | HoldChangedPayload

type Listener = (payload: RealtimePayload) => void

const MAX_LISTENERS = 200
// De-dup window: identical (channel, key, ts) pairs within this window are
// dropped so the PG-trigger path and the logTransaction fallback path never
// double-fire the same logical event to SSE subscribers.
const DEDUPE_WINDOW_MS = 2000
const DEDUPE_MAX_ENTRIES = 500

class Broadcaster extends EventEmitter {
  private recentKeys = new Map<string, number>()

  constructor() {
    super()
    this.setMaxListeners(MAX_LISTENERS)
  }

  // Note: deliberately excludes `ts` — the PG-trigger path (DB clock) and the
  // logTransaction fallback path (Node clock) will report slightly different
  // timestamps for the *same* logical mutation, so identity here is based on
  // "what changed", and recency is checked separately via the time window.
  private dedupeKey(channel: RealtimeChannel, payload: RealtimePayload): string {
    if (channel === 'inventory_changed') {
      const p = payload as InventoryChangedPayload
      return `${channel}:${p.productId}:${p.size}:${p.locationId}:${p.newQty}`
    }
    const p = payload as HoldChangedPayload
    return `${channel}:${p.holdId}:${p.status}`
  }

  private isDuplicate(key: string): boolean {
    const now = Date.now()
    // Prune stale entries opportunistically.
    if (this.recentKeys.size > DEDUPE_MAX_ENTRIES) {
      for (const [k, ts] of Array.from(this.recentKeys.entries())) {
        if (now - ts > DEDUPE_WINDOW_MS) this.recentKeys.delete(k)
      }
    }
    const existing = this.recentKeys.get(key)
    if (existing !== undefined && now - existing < DEDUPE_WINDOW_MS) return true
    this.recentKeys.set(key, now)
    return false
  }

  publish(channel: RealtimeChannel, payload: RealtimePayload) {
    const key = this.dedupeKey(channel, payload)
    if (this.isDuplicate(key)) return
    this.emit(channel, payload)
  }

  subscribe(channel: RealtimeChannel, fn: Listener): () => void {
    this.on(channel, fn)
    return () => { this.off(channel, fn) }
  }
}

const globalForBroadcaster = globalThis as unknown as {
  __inventoryBroadcaster: Broadcaster | undefined
}

export const broadcaster =
  globalForBroadcaster.__inventoryBroadcaster ?? new Broadcaster()

if (process.env.NODE_ENV !== 'production') {
  globalForBroadcaster.__inventoryBroadcaster = broadcaster
}
