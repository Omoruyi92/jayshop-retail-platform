'use client'
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'jays-shop-likes'
const SESSION_KEY = 'jays-shop-session-id'

/** Get or create a stable anonymous session ID */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

function readLocalLikes(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeLocalLikes(likes: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(likes)))
}

/** Global listener so all mounted cards stay in sync */
const listeners = new Set<() => void>()
function notify() {
  listeners.forEach((fn) => fn())
}

export function useLikes() {
  const [likes, setLikes] = useState<Set<string>>(new Set())

  // Hydrate from localStorage then sync from server
  useEffect(() => {
    setLikes(readLocalLikes())

    // Fetch server-side likes for this session
    const sid = getSessionId()
    if (sid) {
      fetch(`/api/likes?sessionId=${encodeURIComponent(sid)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.likes && Array.isArray(data.likes)) {
            const serverSet = new Set<string>(data.likes)
            writeLocalLikes(serverSet)
            setLikes(serverSet)
            notify()
          }
        })
        .catch(() => { /* use local fallback */ })
    }

    const refresh = () => setLikes(readLocalLikes())
    listeners.add(refresh)
    return () => { listeners.delete(refresh) }
  }, [])

  const toggle = useCallback((productId: string) => {
    // Optimistic local update
    const current = readLocalLikes()
    const wasLiked = current.has(productId)
    if (wasLiked) {
      current.delete(productId)
    } else {
      current.add(productId)
    }
    writeLocalLikes(current)
    notify()

    // Persist to server
    const sid = getSessionId()
    fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, sessionId: sid }),
    }).catch(() => {
      // Revert on failure
      const reverted = readLocalLikes()
      if (wasLiked) {
        reverted.add(productId)
      } else {
        reverted.delete(productId)
      }
      writeLocalLikes(reverted)
      notify()
    })
  }, [])

  const isLiked = useCallback((productId: string) => likes.has(productId), [likes])

  return { toggle, isLiked, count: likes.size }
}
