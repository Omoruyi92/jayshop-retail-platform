'use client'
import { useState, useCallback } from 'react'
import { useDataSync } from '../DataProvider'

export type InvalidateFn = (prefix: string) => void

type MutationState<T> = {
  data: T | undefined
  loading: boolean
  error: Error | null
}

type MutateFn<TData, TArg> = (arg: TArg) => Promise<TData>

/**
 * Simple mutation wrapper that auto-invalidates cache keys on success.
 */
export function useMutation<TData = void, TArg = void>(
  mutateFn: MutateFn<TData, TArg>,
  opts?: {
    invalidateOnSuccess?: string[]
    onSuccess?: (data: TData, arg: TArg) => void
    onError?: (err: Error) => void
  }
) {
  const { invalidate } = useDataSync()
  const [state, setState] = useState<MutationState<TData>>({
    data: undefined,
    loading: false,
    error: null,
  })

  const mutate = useCallback(
    async (arg: TArg) => {
      setState({ data: undefined, loading: true, error: null })
      try {
        const data = await mutateFn(arg)
        setState({ data, loading: false, error: null })
        if (opts?.invalidateOnSuccess) {
          for (const prefix of opts.invalidateOnSuccess) {
            invalidate(prefix)
          }
        }
        opts?.onSuccess?.(data, arg)
        return data
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setState({ data: undefined, loading: false, error })
        opts?.onError?.(error)
      }
    },
    [mutateFn, invalidate, opts]
  )

  return { mutate, ...state }
}
