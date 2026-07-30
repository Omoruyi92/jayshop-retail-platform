'use client'
import { useEffect, useRef, useState } from 'react'
import { Cookie, Lock, FileText, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { hasConsent, saveConsent } from '@/lib/consent'

/**
 * First-visit consent gate. Renders a blocking, focus-trapped dialog over the
 * public storefront until the visitor accepts the Cookie Policy, Privacy
 * Policy, and Terms & Conditions. Consent persists in a first-party cookie +
 * localStorage (see src/lib/consent.ts), so the gate never reappears once
 * accepted. Client-only: SSR output is untouched (SEO-safe) and the check
 * runs after hydration, so already-consented visitors never see a flash or
 * content delay.
 */
export default function CookieConsentModal() {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (!hasConsent()) setOpen(true)
  }, [])

  // Lock background scroll while the gate is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Focus trap: keep Tab cycling inside the dialog. Escape is intentionally
  // NOT handled — this is a required gate.
  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return

    const focusables = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled])'
        )
      )

    // Move initial focus into the dialog.
    focusables()[0]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const els = focusables()
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !dialog?.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !dialog?.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  function handleAccept() {
    saveConsent()
    setOpen(false)
  }

  const policyLinks = [
    { href: '/cookie-policy', label: t.consent.cookiePolicy, icon: Cookie },
    { href: '/privacy', label: t.consent.privacyPolicy, icon: Lock },
    { href: '/terms', label: t.consent.terms, icon: FileText },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      data-testid="cookie-consent-overlay"
    >
      {/* Backdrop — blocks interaction with the page; no click-to-dismiss. */}
      <div className="absolute inset-0 bg-jays-navy/60 backdrop-blur-sm" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
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
            <h2 id="consent-title" className="font-display text-lg font-bold uppercase tracking-wide">
              {t.consent.title}
            </h2>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{t.consent.body}</p>

          {/* Policy links — open in a new tab so the gate stays in place. */}
          <div className="grid gap-1.5">
            {policyLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={t.consent.opensNewTab}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-jays-ice hover:border-jays-royal/30 text-sm font-medium text-jays-navy transition-colors group"
              >
                <Icon size={15} className="text-jays-royal shrink-0" />
                <span className="flex-1">{label}</span>
                <ExternalLink size={13} className="text-gray-400 group-hover:text-jays-royal transition-colors shrink-0" />
              </a>
            ))}
          </div>

          {/* Acceptance checkbox gates the button. */}
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
      </div>
    </div>
  )
}
