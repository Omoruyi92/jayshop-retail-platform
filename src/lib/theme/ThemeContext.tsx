'use client'
import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { THEMES, THEME_CLASS, ALL_THEME_CLASSES, DEFAULT_THEME, isTheme, type Theme } from './themes'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export const THEME_STORAGE_KEY = 'jays-shop-theme'

/**
 * Applies (or removes) the storefront theme class on <html>. Admin routes
 * are intentionally left untouched here — `[data-admin-root]` in
 * globals.css re-declares the default token values on the admin container
 * itself, so admin renders correctly regardless of what class is on <html>.
 * We still avoid writing a non-default class while on an admin route so
 * DevTools inspection of <html> doesn't look misleading, but this is a
 * belt-and-suspenders nicety, not the mechanism admin immunity relies on.
 */
function applyThemeClass(theme: Theme, isAdminRoute: boolean) {
  const root = document.documentElement
  root.classList.remove(...ALL_THEME_CLASSES)
  const effective = isAdminRoute ? DEFAULT_THEME : theme
  root.classList.add(THEME_CLASS[effective])
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') ?? false

  // Fail-safe read: corrupt/unknown localStorage values fall back to default
  // instead of throwing (see incident: unguarded i18n key access white-screened
  // the About page in prod — theming must not repeat that pattern).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (isTheme(stored)) {
        setThemeState(stored)
      }
    } catch {
      // localStorage unavailable (private mode, disabled storage, etc.) — stay on default.
    }
  }, [])

  useEffect(() => {
    applyThemeClass(theme, isAdminRoute)
  }, [theme, isAdminRoute])

  const setTheme = useCallback((next: Theme) => {
    if (!isTheme(next)) return
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Best-effort persistence only; in-memory state still updates.
    }
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export { THEMES }
export type { Theme }
