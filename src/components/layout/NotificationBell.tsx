'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { Bell, X, Sparkles } from 'lucide-react'
import { useDropdownPosition } from '@/hooks/useDropdownPosition'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  productId: string | null
  productSlug: string | null
  imageUrl: string | null
  isRead: boolean
  isOpened: boolean
  createdAt: string
}

const GUEST_COOKIE = 'jays_guest_id'
const GUEST_ID_KEY = 'jays_guest_notification_id'

function getOrCreateGuestId(): string {
  if (typeof document === 'undefined') return ''
  let guestId = localStorage.getItem(GUEST_ID_KEY)
  if (!guestId) {
    guestId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(GUEST_ID_KEY, guestId)
  }
  document.cookie = `${GUEST_COOKIE}=${guestId}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  return guestId
}

function timeAgo(isoDate: string) {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoDate).toLocaleDateString('en-CA')
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      getOrCreateGuestId()
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function openNotification(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isOpened: true } : n))
      )
    } catch { /* ignore */ }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(prev - 1, 0))
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* ignore */ }
  }

  const style = useDropdownPosition(open, triggerRef, panelRef)

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => {
          setOpen((p) => !p)
        }}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-jays-red text-white text-[10px] font-bold border-2 border-jays-navy animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={style}
          className="w-80 sm:w-96 max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-jays-navy">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">New Arrivals</h3>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-medium text-blue-200 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto text-jays-steel/40 mb-2" size={28} />
                <p className="text-sm text-jays-steel">No new arrivals right now.</p>
                <p className="text-xs text-jays-steel/70 mt-0.5">Check back soon for the latest gear.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => {
                  const href = n.productSlug ? `/shop/${n.productSlug}` : '/shop'
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => { openNotification(n.id); if (!n.isRead) markAsRead(n.id); setOpen(false) }}
                      className={`flex items-start gap-3 p-3 transition-colors hover:bg-jays-ice/50 ${n.isRead ? 'opacity-70' : 'bg-blue-50/40'}`}
                    >
                      <div className="w-12 h-12 bg-jays-ice rounded-lg overflow-hidden shrink-0 relative border border-gray-100">
                        {n.imageUrl ? (
                          <Image src={n.imageUrl} alt={n.title} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-jays-steel/40">
                            <Sparkles size={20} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-jays-steel' : 'text-jays-navy'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-jays-steel shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-jays-steel leading-snug line-clamp-2">{n.body}</p>
                        {!n.isRead && (
                          <span className="inline-block w-2 h-2 rounded-full bg-jays-red mt-1.5" aria-label="Unread" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-2">
            <Link
              href="/shop?filter=new"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-jays-navy hover:text-jays-red py-2 rounded-lg hover:bg-jays-ice transition-colors"
            >
              View all new arrivals
            </Link>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
