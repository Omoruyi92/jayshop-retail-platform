'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useDataSync } from '../DataProvider'

type FetchState<T> = {
  data: T | undefined
  loading: boolean
  error: Error | null
  /** True when a background revalidation is in progress (data is already shown) */
  isValidating: boolean
}

/**
 * Stale-while-revalidate data fetcher with global cache + auto-invalidation.
 *
 * Behaviour:
 * 1. On mount → read cache. If cached data exists, show it instantly (loading=false).
 * 2. If no cache → show loading=true, fetch in background.
 * 3. When cache is invalidated (rev changes) → keep showing stale data,
 *    set isValidating=true, fetch in background, swap data when ready.
 * 4. On tab focus → silent revalidation (isValidating=true, loading stays false).
 * 5. On error → preserve existing data, show error, 2s cooldown before retry.
 */
export function useFetch<T>(key: string, fetcher: () => Promise<T>, options?: { refreshInterval?: number }) {
  const { getCache, setCache, rev } = useDataSync()
  const refreshInterval = options?.refreshInterval

  const [state, setState] = useState<FetchState<T>>(() => {
    if (!key) return { data: undefined, loading: false, error: null, isValidating: false }
    const cached = getCache<T>(key)
    return {
      data: cached?.data,
      loading: !cached, // only loading if we have nothing to show
      error: null,
      isValidating: false,
    }
  })

  const fetchingRef = useRef(false)
  const keyRef = useRef<string>('')
  const revRef = useRef<number>(0)
  const lastErrorTsRef = useRef<number>(0)

  // Stable fetcher ref (avoids re-creating doFetch every render)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const doFetch = useCallback(
    async (opts?: { silent: boolean }) => {
      if (!key || fetchingRef.current) return
      if (state.error && Date.now() - lastErrorTsRef.current < 2000) return

      fetchingRef.current = true
      const silent = opts?.silent ?? false

      // If we already have data, this is a background revalidation
      setState((s) =>
        s.data !== undefined
          ? { ...s, isValidating: true, error: null }
          : { ...s, loading: true, isValidating: true, error: null }
      )

      try {
        const data = await fetcherRef.current()
        setCache(key, data)
        setState({ data, loading: false, error: null, isValidating: false })
        lastErrorTsRef.current = 0
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        lastErrorTsRef.current = Date.now()
        setState((s) => ({
          data: s.data, // keep stale data
          loading: s.data === undefined, // only stay loading if we never had data
          error,
          isValidating: false,
        }))
      } finally {
        fetchingRef.current = false
      }
    },
    [key, setCache, state.error]
  )

  // Fetch on key change, cache invalidation, or initial mount when key is set
  useEffect(() => {
    if (!key) {
      keyRef.current = ''
      revRef.current = rev
      return
    }
    const keyChanged = keyRef.current !== key
    const invalidated = revRef.current !== rev
    const isInitialMount = keyRef.current === '' && revRef.current === 0
    if (keyChanged || invalidated || isInitialMount) {
      void doFetch({ silent: !isInitialMount && !keyChanged && invalidated })
    }
    keyRef.current = key
    revRef.current = rev
  }, [key, rev, doFetch])

  // Silent revalidation on tab focus
  useEffect(() => {
    if (!key) return
    const onVis = () => {
      if (document.visibilityState === 'visible') void doFetch({ silent: true })
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [doFetch, key])

  // Optional periodic silent revalidation (cross-view sync — e.g. holds
  // status must never drift between admin dashboard, /admin/holds,
  // /admin/analytics, and fan-facing pages).
  useEffect(() => {
    if (!key || !refreshInterval) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void doFetch({ silent: true })
    }, refreshInterval)
    return () => clearInterval(id)
  }, [doFetch, key, refreshInterval])

  return state
}
