/**
 * Client-side consent persistence for the first-visit cookie consent gate.
 *
 * Consent is stored redundantly in a first-party cookie (`jays_consent`,
 * ~12 months, SameSite=Lax) AND localStorage. If either store holds a valid
 * record matching the current CONSENT_VERSION, the consent modal never shows.
 * Bumping CONSENT_VERSION forces re-consent after a policy change.
 */

export const CONSENT_VERSION = 1
export const CONSENT_COOKIE = 'jays_consent'
export const CONSENT_STORAGE_KEY = 'jays-shop-consent'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // ~12 months

interface ConsentRecord {
  v: number
  acceptedAt: string
}

function parseRecord(raw: string | null | undefined): ConsentRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as ConsentRecord).v === 'number'
    ) {
      return parsed as ConsentRecord
    }
  } catch {
    // malformed record — treat as absent
  }
  return null
}

function readCookieRecord(): ConsentRecord | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
  if (!match) return null
  try {
    return parseRecord(decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1)))
  } catch {
    return null
  }
}

function readStorageRecord(): ConsentRecord | null {
  if (typeof window === 'undefined') return null
  try {
    return parseRecord(window.localStorage.getItem(CONSENT_STORAGE_KEY))
  } catch {
    // localStorage unavailable (private mode / blocked) — cookie still covers us
    return null
  }
}

/** True when a valid consent record at the current version exists in either store. */
export function hasConsent(): boolean {
  const record = readCookieRecord() ?? readStorageRecord()
  return record !== null && record.v >= CONSENT_VERSION
}

export const CONSENT_DISMISSED_KEY = 'jays-shop-consent-dismissed'

/**
 * Session-scoped dismissal: dismissing the (optional) consent modal hides it
 * for the rest of the browsing session, but it reappears on the next visit
 * until the user actually accepts.
 */
export function wasDismissedThisSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(CONSENT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function markDismissedThisSession(): void {
  try {
    window.sessionStorage.setItem(CONSENT_DISMISSED_KEY, '1')
  } catch {
    // sessionStorage unavailable — worst case the modal shows again this session
  }
}

/** Persist acceptance to both the cookie and localStorage. */
export function saveConsent(): void {
  const record: ConsentRecord = { v: CONSENT_VERSION, acceptedAt: new Date().toISOString() }
  const value = encodeURIComponent(JSON.stringify(record))
  try {
    document.cookie = `${CONSENT_COOKIE}=${value}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`
  } catch {
    // ignore — localStorage below is the fallback
  }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // ignore — cookie above is the fallback
  }
}
