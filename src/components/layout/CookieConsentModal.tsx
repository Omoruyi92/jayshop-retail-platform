'use client'
import { useEffect, useRef, useState } from 'react'
import { Cookie, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  hasConsent,
  saveConsent,
  wasDismissedThisSession,
  markDismissedThisSession,
} from '@/lib/consent'
import CookiePolicyContent, { CookiePolicyDownloadLink } from '@/components/policies/CookiePolicyContent'

/**
 * Optional first-visit cookie consent notice on the public storefront.
 *
 * Non-blocking: dismissible via backdrop click, Escape, or the X button.
 * Dismissal is session-scoped (sessionStorage) — the notice returns on the
 * next visit until the user accepts. Acceptance persists in a first-party
 * cookie + localStorage (see src/lib/consent.ts) and hides it permanently.
 *
 * A single "Cookies" link swaps the modal content to an in-app scrollable
 * Cookie Policy view (shared with /cookie-policy via CookiePolicyContent)
 * with its own checkbox + Accept and a PDF download link.
 */
export default function CookieConsentModal() {
  const [open, setOpen] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)
  const [checked, setChecked] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (!hasConsent() && !wasDismissedThisSession()) setOpen(true)
  }, [])

  function dismiss() {
    markDismissedThisSession()
    setOpen(false)
  }

  // Escape dismisses (optional notice, not a gate).
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  function handleAccept() {
    saveConsent()
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      data-testid="cookie-consent-overlay"
    >
      {/* Backdrop — click anywhere outside the modal to dismiss. */}
      <div
        className="absolute inset-0 bg-jays-navy/40 backdrop-blur-[2px]"
        aria-hidden="true"
        data-testid="cookie-consent-backdrop"
        onClick={dismiss}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="consent-title"
        data-testid="cookie-consent-dialog"
        className="relative w-full sm:max-w-md mx-0 sm:mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300"
      >
        {/* Branded header */}
        <div className="bg-gradient-to-br from-jays-navy via-[#1a4480] to-jays-royal text-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Cookie size={18} className="text-white" />
            </div>
            <h2 id="consent-title" className="flex-1 font-display text-lg font-bold uppercase tracking-wide">
              {showPolicy ? t.consent.policyTitle : t.consent.title}
            </h2>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t.consent.close}
              data-testid="cookie-consent-close"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-200/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {showPolicy ? (
          /* ── In-app Cookie Policy view ── */
          <div className="px-5 py-4 space-y-4" data-testid="cookie-consent-policy-view">
            <button
              type="button"
              onClick={() => setShowPolicy(false)}
              data-testid="cookie-consent-back"
              className="inline-flex items-center gap-1 text-xs font-semibold text-jays-royal hover:text-jays-navy transition-colors"
            >
              <ChevronLeft size={14} />
              {t.consent.back}
            </button>

            <div className="max-h-[45vh] overflow-y-auto pr-1 -mr-1">
              <CookiePolicyContent />
            </div>

            <CookiePolicyDownloadLink label={t.consent.download} />

            <label className="flex items-start gap-2.5 cursor-pointer select-none border-t border-gray-100 pt-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                data-testid="cookie-consent-checkbox"
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-gray-300 text-jays-royal focus:ring-jays-royal accent-[#134A8E]"
              />
              <span className="text-xs text-gray-600 leading-relaxed">{t.consent.checkboxLabel}</span>
            </label>

            <button
              type="button"
              onClick={handleAccept}
              disabled={!checked}
              data-testid="cookie-consent-accept"
              className="w-full py-2.5 rounded-full bg-jays-royal hover:bg-jays-navy disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-colors"
            >
              {t.consent.accept}
            </button>
          </div>
        ) : (
          /* ── Compact view ── */
          <div className="px-5 py-4 space-y-4" data-testid="cookie-consent-compact-view">
            <p className="text-sm text-gray-600 leading-relaxed">{t.consent.body}</p>

            {/* Single in-app policy link — no navigation, swaps the modal view. */}
            <button
              type="button"
              onClick={() => setShowPolicy(true)}
              data-testid="cookie-consent-cookies-link"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-jays-ice hover:border-jays-royal/30 text-sm font-medium text-jays-navy transition-colors group"
            >
              <Cookie size={15} className="text-jays-royal shrink-0" />
              <span className="flex-1 text-left">{t.consent.cookiePolicy}</span>
              <ChevronRight size={14} className="text-gray-400 group-hover:text-jays-royal transition-colors shrink-0" />
            </button>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                data-testid="cookie-consent-checkbox"
                className="mt-0.5 w-4 h-4 shrink-0 rounded border-gray-300 text-jays-royal focus:ring-jays-royal accent-[#134A8E]"
              />
              <span className="text-xs text-gray-600 leading-relaxed">{t.consent.checkboxLabel}</span>
            </label>

            <button
              type="button"
              onClick={handleAccept}
              disabled={!checked}
              data-testid="cookie-consent-accept"
              className="w-full py-2.5 rounded-full bg-jays-royal hover:bg-jays-navy disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-colors"
            >
              {t.consent.accept}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
