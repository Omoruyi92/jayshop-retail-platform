'use client'
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { translations, type Locale, type Translations } from './translations'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'jays-shop-locale'

/**
 * Merges a locale's translation object onto the English baseline so that any
 * namespace or key missing from a non-English locale (e.g. an incomplete
 * translation shipped for `fr`/`es`) falls back to the English string instead
 * of leaving `undefined` in the tree. A missing translation must never crash
 * the page — see incident: `t.about` was absent entirely for `fr`/`es`,
 * throwing `Cannot read properties of undefined` on the About page.
 */
function withEnglishFallback(locale: Locale): Translations {
  if (locale === 'en') return translations.en as Translations

  const base = translations.en as Record<string, unknown>
  const override = (translations[locale] ?? {}) as Record<string, unknown>
  const merged: Record<string, unknown> = { ...base }

  for (const key of Object.keys(base)) {
    const baseVal = base[key]
    const overrideVal = override[key]
    if (overrideVal === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing translation namespace "${key}" for locale "${locale}" — falling back to English.`)
      }
      merged[key] = baseVal
    } else if (
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal) &&
      overrideVal !== null &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal)
    ) {
      merged[key] = { ...(baseVal as Record<string, unknown>), ...(overrideVal as Record<string, unknown>) }
    } else {
      merged[key] = overrideVal
    }
  }

  return merged as Translations
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && (stored === 'en' || stored === 'fr' || stored === 'es')) {
      setLocaleState(stored)
    }
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const t = useMemo(() => withEnglishFallback(locale), [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
