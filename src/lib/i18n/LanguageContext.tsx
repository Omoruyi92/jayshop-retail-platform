'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, type Locale, type Translations } from './translations'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'jays-shop-locale'

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

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] as Translations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
