'use client'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  position: string
  onPositionChange: (value: string) => void
  positions: string[]
}

export default function PlayerSearchFilter({
  search,
  onSearchChange,
  position,
  onPositionChange,
  positions,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const buttonId = 'position-dropdown-button'
  const listId = 'position-listbox'

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!listRef.current) return
      const target = event.target as Node
      if (!listRef.current.contains(target)) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', onClickOutside)
      return () => document.removeEventListener('mousedown', onClickOutside)
    }
  }, [isOpen])

  const toggle = () => setIsOpen((v) => !v)
  const select = (pos: string) => {
    onPositionChange(pos)
    setIsOpen(false)
  }

  const options = [{ value: '', label: 'All Players' }, ...positions.map((pos) => ({ value: pos, label: pos }))]
  const activeLabel = options.find((o) => o.value === position)?.label ?? 'All Players'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-xs">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search players…"
          className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jays-royal/30 transition-shadow"
        />
      </div>

      {/* Dropdown */}
      <div ref={listRef} className="relative shrink-0">
        <button
          id={buttonId}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listId}
          onClick={toggle}
          className={cn(
            'flex items-center justify-between gap-2 px-3.5 py-2 rounded-full text-left text-sm font-semibold transition-all border',
            'bg-white border-gray-200 hover:border-jays-royal/40 focus:outline-none focus:ring-2 focus:ring-jays-royal/30'
          )}
        >
          <span className="truncate text-jays-navy">{activeLabel}</span>
          <svg
            className={cn(
              'w-3.5 h-3.5 text-jays-steel transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>

        <div
          id={listId}
          role="listbox"
          aria-labelledby={buttonId}
          className={cn(
            'absolute right-0 z-20 mt-1.5 w-44 origin-top-right transition-all duration-150',
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          )}
        >
          <div className="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-lg py-1">
            <div className="max-h-56 overflow-y-auto">
              {options.map((option) => {
                const active = option.value === position
                return (
                  <button
                    key={option.value || 'all'}
                    role="option"
                    aria-selected={active}
                    onClick={() => select(option.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors focus:outline-none focus:bg-jays-ice',
                      active ? 'bg-jays-navy text-white font-semibold' : 'text-jays-navy hover:bg-jays-ice/60'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-jays-red" />}
                      <span className="truncate">{option.label}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
