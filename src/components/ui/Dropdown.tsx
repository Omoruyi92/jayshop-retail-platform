'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  ariaLabel?: string
  id?: string
  align?: 'left' | 'right'
  className?: string
  buttonClassName?: string
  panelClassName?: string
  /**
   * Optional trigger element. When provided, the default text+arrow button is
   * replaced entirely. Useful for compact mobile icon toggles.
   */
  trigger?: React.ReactNode
}

/**
 * Branded, accessible replacement for a native `<select>`, matching the
 * app's pill/gradient design system (rounded trigger + floating listbox).
 */
export default function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  id,
  align = 'right',
  className,
  buttonClassName,
  panelClassName,
  trigger,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left?: number; right?: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const reactId = useId()
  const buttonId = id ? `${id}-button` : `dropdown-button-${reactId}`
  const listId = id ? `${id}-listbox` : `dropdown-listbox-${reactId}`

  useEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }
    function compute() {
      const button = rootRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const gap = 6
      const panelWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? Math.min(288, window.innerWidth - 16) : 256
      const viewportWidth = window.innerWidth
      let left = Math.max(8, rect.left)
      let right: number | undefined
      if (left + panelWidth > viewportWidth - 8) {
        left = Math.max(8, viewportWidth - panelWidth - 8)
      }
      if (rect.left > viewportWidth - rect.left - rect.width) {
        right = Math.max(8, viewportWidth - rect.right)
        left = 0
      }
      setPosition({ top: rect.bottom + gap, left: left === 0 ? undefined : left, right })
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onClickOutside(event: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const activeLabel = options.find((o) => o.value === value)?.label ?? options[0]?.label ?? ''

  const panel = (
    <div
      id={listId}
      role="listbox"
      aria-labelledby={buttonId}
      style={
        position
          ? { top: position.top, left: position.left, right: position.right }
          : { top: 0, left: 0 }
      }
      className={cn(
        'fixed z-[60] mt-1.5 max-w-[calc(100vw-1rem)] overflow-hidden transition-all duration-150',
        isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
        panelClassName ?? 'w-56'
      )}
    >
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm transition-colors focus:outline-none focus:bg-jays-ice',
                  active ? 'bg-jays-navy font-semibold text-white' : 'text-jays-navy hover:bg-jays-ice/60'
                )}
              >
                {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red" />}
                <span className="break-words leading-snug">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-left text-sm font-medium text-jays-navy shadow-sm transition-all hover:border-jays-navy/30 focus:outline-none focus:ring-2 focus:ring-jays-navy/20',
          buttonClassName
        )}
      >
        {trigger ?? (
          <>
            <span className="truncate">{activeLabel}</span>
            <svg
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-jays-steel transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {typeof document !== 'undefined' ? createPortal(panel, document.body) : panel}
    </div>
  )
}
