'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useDropdownPosition } from '@/hooks/useDropdownPosition'

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
 *
 * Positioning/open-close behavior mirrors the Language selector dropdown
 * in `Header.tsx`: the panel is only mounted while open (via
 * `useDropdownPosition`, same hook Header/HeaderActions/NotificationBell
 * use), so there is no stale `top:0,left:0` position left over from a
 * previous render to animate from on close.
 */
export default function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  id,
  className,
  buttonClassName,
  panelClassName,
  trigger,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reactId = useId()
  const buttonId = id ? `${id}-button` : `dropdown-button-${reactId}`
  const listId = id ? `${id}-listbox` : `dropdown-listbox-${reactId}`

  const panelStyle = useDropdownPosition(isOpen, triggerRef, panelRef)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
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

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex items-center justify-between gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-left text-sm font-medium text-primary shadow-sm transition-all hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20',
          buttonClassName
        )}
      >
        {trigger ?? (
          <>
            <span className="truncate">{activeLabel}</span>
            <svg
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
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

      {mounted &&
        isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id={listId}
            ref={panelRef}
            role="listbox"
            aria-labelledby={buttonId}
            style={panelStyle}
            className={cn(
              'z-[60] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200',
              panelClassName ?? 'w-56'
            )}
          >
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
                      active ? 'bg-primary font-semibold text-primary-foreground' : 'text-primary hover:bg-jays-ice/60'
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />}
                    <span className="break-words leading-snug">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
