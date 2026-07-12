'use client'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type CacheEntry<T = unknown> = {
  data: T
  ts: number
}

type DataSyncContextValue = {
  /** Monotonic revision counter. Bumped whenever any key matching a prefix is invalidated. */
  rev: number
  getCache: <T>(key: string) => CacheEntry<T> | undefined
  setCache: <T>(key: string, data: T) => void
  /** Invalidates every cached key that starts with `prefix` and bumps `rev`. */
  invalidate: (prefix: string) => void
}

const DataSyncContext = createContext<DataSyncContextValue | null>(null)

/**
 * Lightweight, in-memory stale-while-revalidate cache shared across the
 * admin dashboard. Pairs with `useFetch` (reads) and `useMutation`
 * (writes + cache invalidation) in `src/components/sync/hooks`.
 *
 * Intentionally process-local (no persistence) — a page refresh always
 * re-fetches from the server, which stays the source of truth.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const cacheRef = useRef(new Map<string, CacheEntry>())
  const [rev, setRev] = useState(0)

  const getCache = useCallback(<T,>(key: string) => {
    return cacheRef.current.get(key) as CacheEntry<T> | undefined
  }, [])

  const setCache = useCallback(<T,>(key: string, data: T) => {
    cacheRef.current.set(key, { data, ts: Date.now() })
  }, [])

  const invalidate = useCallback((prefix: string) => {
    for (const key of Array.from(cacheRef.current.keys())) {
      if (key.startsWith(prefix)) cacheRef.current.delete(key)
    }
    setRev((r) => r + 1)
  }, [])

  const value = useMemo(
    () => ({ rev, getCache, setCache, invalidate }),
    [rev, getCache, setCache, invalidate]
  )

  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>
}

export function useDataSync(): DataSyncContextValue {
  const ctx = useContext(DataSyncContext)
  if (!ctx) {
    throw new Error('useDataSync must be used within a <DataProvider>')
  }
  return ctx
}
