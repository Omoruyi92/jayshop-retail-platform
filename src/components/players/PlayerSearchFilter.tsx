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
    <div ref={listRef} className="w-full bg-white/60 rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
          placeholder="Search players by name…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-jays-royal/40 transition-shadow"
        />
      </div>

      {/* Dropdown */}
      <label className="block text-[11px] font-bold uppercase tracking-wider text-jays-steel mb-1.5">
        Filter by Position
      </label>
      <button
        id={buttonId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={toggle}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left text-sm font-semibold transition-all border',
          'bg-white border-gray-200 hover:border-jays-royal/40 focus:outline-none focus:ring-2 focus:ring-jays-royal/40'
        )}
      >
        <span className="truncate text-jays-navy">{activeLabel}</span>
        <svg
          className={cn(
            'w-4 h-4 text-jays-steel transition-transform duration-200',
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
          'grid transition-[grid-template-rows] duration-200',
          isOpen ? 'grid-rows-[1fr] mt-1.5' : 'grid-rows-[0fr]'
        )}
      >
        <div className={cn('overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm', !isOpen && 'invisible')}>
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((option) => {
              const active = option.value === position
              return (
                <button
                  key={option.value || 'all'}
                  role="option"
                  aria-selected={active}
                  onClick={() => select(option.value)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-sm transition-colors focus:outline-none focus:bg-jays-ice',
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
  )
}
