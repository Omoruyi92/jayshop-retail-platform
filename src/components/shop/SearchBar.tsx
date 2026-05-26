'use client'
import { useRef, useEffect } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search products…' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus is opt-in; just expose ref externally if needed
  useEffect(() => {
    // nothing — no auto-focus on mount to avoid hijacking mobile scroll
  }, [])

  return (
    <div className="relative w-full">
      <label htmlFor="shop-search" className="sr-only">
        Search products
      </label>
      {/* Search icon */}
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>

      <input
        ref={inputRef}
        id="shop-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white py-2.5 pl-9 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-jays-navy focus:outline-none focus:ring-2 focus:ring-jays-navy/20 transition-colors duration-150"
        autoComplete="off"
        spellCheck={false}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-2 flex items-center px-1 text-gray-400 hover:text-gray-600 transition-colors duration-150"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
