'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface RevealProps {
  children: ReactNode
  /** Index within a grid/list — used to compute a staggered delay. */
  index?: number
  /** Per-item stagger step in ms. Capped so long lists don't feel sluggish. */
  step?: number
  className?: string
}

/**
 * Scoped, per-component zoom+fade reveal used for content tiles (product /
 * player / style / category cards, catalog preview sections) — intentionally
 * NOT applied globally to whole pages/hero sections, which must keep their
 * full visual impact untouched.
 *
 * Uses IntersectionObserver so cards animate in once, the first time they
 * enter the viewport (including immediately on page load for above-the-fold
 * content), then stay settled — no replay on scroll-away/back, no layout
 * thrash. Animation is a pure transform/opacity transition (GPU-accelerated)
 * so it stays fast on both desktop and mobile.
 */
export default function Reveal({ children, index = 0, step = 60, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const delay = Math.min(index * step, 480)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-500 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none',
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
        className
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
