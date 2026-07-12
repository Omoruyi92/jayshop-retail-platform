'use client'
import { useEffect, useRef } from 'react'

export type InventoryChangedEvent = {
  productId: string
  size: string | null
  locationId: string
  oldQty: number
  newQty: number
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  ts: number
}

export type HoldChangedEvent = {
  holdId: string
  productId: string
  size: string | null
  status: string
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  ts: number
}

export type InventoryStreamFilter = {
  /** When set, only fire callbacks for events matching this productId. */
  productId?: string
}

export type InventoryStreamHandlers = {
  onInventoryChanged?: (payload: InventoryChangedEvent) => void
  onHoldChanged?: (payload: HoldChangedEvent) => void
}

/**
 * Subscribes to the server-sent `/api/realtime/inventory` stream
 * (see `src/app/api/realtime/inventory/route.ts`) and invokes the provided
 * callbacks whenever an `inventory_changed` or `hold_changed` event arrives.
 *
 * Reconnects automatically with a short fixed backoff if the connection
 * drops (e.g. dev server restart). Safe to mount from multiple components
 * simultaneously — each call opens its own EventSource.
 */
export function useInventoryStream(
  filter: InventoryStreamFilter,
  handlers: InventoryStreamHandlers
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const productIdFilter = filter.productId

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return

    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    function connect() {
      es = new EventSource('/api/realtime/inventory')

      es.addEventListener('inventory_changed', (evt) => {
        try {
          const payload = JSON.parse((evt as MessageEvent).data) as InventoryChangedEvent
          if (productIdFilter && payload.productId !== productIdFilter) return
          handlersRef.current.onInventoryChanged?.(payload)
        } catch {
          // ignore malformed payload
        }
      })

      es.addEventListener('hold_changed', (evt) => {
        try {
          const payload = JSON.parse((evt as MessageEvent).data) as HoldChangedEvent
          if (productIdFilter && payload.productId !== productIdFilter) return
          handlersRef.current.onHoldChanged?.(payload)
        } catch {
          // ignore malformed payload
        }
      })

      es.onerror = () => {
        es?.close()
        es = null
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [productIdFilter])
}
