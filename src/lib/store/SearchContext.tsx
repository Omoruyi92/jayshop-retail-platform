'use client'
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

interface SearchContextType {
  searchInput: string
  searchQuery: string
  setSearchInput: (v: string) => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType>({
  searchInput: '',
  searchQuery: '',
  setSearchInput: () => {},
  clearSearch: () => {},
})

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchInput, setSearchInputState] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setSearchInput = useCallback((v: string) => {
    setSearchInputState(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(v), 250)
  }, [])

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchInputState('')
    setSearchQuery('')
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <SearchContext.Provider value={{ searchInput, searchQuery, setSearchInput, clearSearch }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  return useContext(SearchContext)
}
