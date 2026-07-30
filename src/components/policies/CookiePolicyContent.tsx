import Link from 'next/link'
import { Download } from 'lucide-react'

export const COOKIE_POLICY_PDF = '/docs/jays-shop-cookie-policy.pdf'

export const COOKIE_POLICY_ITEMS = [
  'Jays Shop uses cookies and similar technologies (such as localStorage) to make our website work and to improve your experience.',
  'Essential cookies are required for core functionality — keeping your cart, holds, language preference, and consent choice — and cannot be disabled.',
  'A first-party consent cookie (jays_consent) records that you have accepted our policies so we do not ask you again on every visit. It expires after 12 months.',
  'Performance cookies help us understand how visitors use the site (pages visited, load times) in aggregate, anonymized form so we can improve our services.',
  'We do not use third-party advertising or cross-site tracking cookies. Your browsing on Jays Shop is not sold to or shared with advertisers.',
  'Your language preference and recently viewed products are stored locally on your device to personalize your visit.',
  'You can clear cookies and site data at any time through your browser settings. Doing so will reset your preferences and you will be asked to accept our policies again.',
  'For questions about how we use cookies, contact us at Gate 5: 416.341.2904.',
]

/**
 * Single source of truth for the Cookie Policy body. Consumed by both the
 * /cookie-policy route and the in-modal policy view of CookieConsentModal so
 * the two can never drift.
 */
export default function CookiePolicyContent() {
  return (
    <ul className="space-y-3">
      {COOKIE_POLICY_ITEMS.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
          <span className="text-jays-royal mt-1 shrink-0">•</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

/** Shared download link for the static PDF copy of the policy. */
export function CookiePolicyDownloadLink({ label }: { label: string }) {
  return (
    <Link
      href={COOKIE_POLICY_PDF}
      download="jays-shop-cookie-policy.pdf"
      data-testid="cookie-policy-download"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-jays-royal hover:text-jays-navy hover:underline transition-colors"
    >
      <Download size={13} className="shrink-0" />
      {label}
    </Link>
  )
}
