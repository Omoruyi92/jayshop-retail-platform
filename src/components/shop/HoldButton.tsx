'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@prisma/client'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useCart } from '@/lib/store/CartContext'

interface SizeAvailability {
  size: string
  available: number
}

export default function HoldButton({
  product,
  remaining,
  isSoldOut,
  sizes,
  sizeAvailability,
}: {
  product: Product
  remaining: number
  isSoldOut: boolean
  sizes: string[]
  sizeAvailability: SizeAvailability[] | null
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const { removeItem } = useCart()
  const hb = t.holdButton

  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isStadiumHold, setIsStadiumHold] = useState(false)
  const [locationSizeAvailability, setLocationSizeAvailability] = useState<SizeAvailability[] | null>(null)
  const [precheck, setPrecheck] = useState<{
    gameDay: boolean
    extendedAvailable: boolean
    stadiumHours: number
    gate5Hours: number | null
    standardHoldHours: number
  } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    phone?: string
    size?: string
    quantity?: string
  }>({})

  const hasSizes = sizes.length > 0

  // Fetch game-day / hold-window info AND location-scoped size availability
  // whenever the modal opens or the hold type (Gate 5 vs Section 123)
  // changes, so displayed availability/max qty/OOS sizes always reflect the
  // fulfilling location only — never the combined total across all locations.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const holdType = isStadiumHold ? 'stadium' : 'standard'
    fetch(`/api/holds/precheck?productId=${product.id}&holdType=${holdType}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setPrecheck({
          gameDay: data.gameDay,
          extendedAvailable: data.extendedAvailable,
          stadiumHours: data.stadiumHours,
          gate5Hours: data.gate5Hours,
          standardHoldHours: data.standardHoldHours,
        })
        setLocationSizeAvailability(Array.isArray(data.sizeAvailability) ? data.sizeAvailability : null)
        // Stadium queue is only available on active game days — force back
        // to standard hold if it was selected before this loaded.
        if (!data.gameDay) setIsStadiumHold(false)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, product.id, isStadiumHold])

  const standardHoldHours = precheck
    ? (precheck.extendedAvailable ? precheck.gate5Hours ?? precheck.standardHoldHours : precheck.standardHoldHours)
    : null
  const stadiumHoldHours = precheck?.stadiumHours ?? null
  const stadiumAvailable = precheck?.gameDay ?? false

  // Availability must always reflect ONLY the fulfilling location (Gate 5 for
  // standard holds, Section 123 for stadium holds) — never the combined total
  // across every location. Use the location-scoped precheck result once it
  // has loaded; fall back to the global sizeAvailability prop only for the
  // brief instant before the modal's precheck fetch resolves.
  const effectiveSizeAvailability = locationSizeAvailability ?? sizeAvailability

  // When a size is selected and per-size availability is known, cap maxQty to
  // that size's available stock. Otherwise fall back to the total remaining.
  const selectedSizeAvailable =
    selectedSize && effectiveSizeAvailability
      ? (effectiveSizeAvailability.find((s) => s.size === selectedSize)?.available ?? remaining)
      : remaining
  const maxQty = selectedSizeAvailable

  // Clamp quantity if the selected size has fewer units than the current qty
  useEffect(() => {
    if (maxQty > 0 && quantity > maxQty) {
      setQuantity(maxQty)
    }
  }, [maxQty, quantity])

  const hasAnyOos =
    effectiveSizeAvailability !== null &&
    sizes.some((size) => {
      const sizeStock = effectiveSizeAvailability?.find((s) => s.size === size)
      return sizeStock !== undefined && sizeStock.available <= 0
    })

  function isSizeOos(size: string): boolean {
    if (effectiveSizeAvailability === null) return false
    const sizeStock = effectiveSizeAvailability?.find((s) => s.size === size)
    return sizeStock !== undefined && sizeStock.available <= 0
  }

  async function submitHold() {
    const errors: typeof fieldErrors = {}

    if (!fullName.trim()) {
      errors.fullName = hb.toastNamePhone
    }
    if (!phone.trim()) {
      errors.phone = hb.toastNamePhone
    } else {
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length !== 10) {
        errors.phone = hb.toastPhoneDigits
      }
    }
    if (hasSizes && !selectedSize) {
      errors.size = hb.toastSelectSize
    }
    if (hasSizes && selectedSize && isSizeOos(selectedSize)) {
      errors.size = hb.toastOosSize
    }
    if (quantity < 1 || quantity > maxQty) {
      errors.quantity = hb.toastQuantity(maxQty)
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const digitsOnly = phone.replace(/\D/g, '')
    setLoading(true)
    try {
      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          fullName,
          phone: digitsOnly,
          size: hasSizes ? selectedSize : undefined,
          quantity,
          isStadiumHold,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? hb.toastCouldNotHold)
        return
      }
      toast.success(hb.toastSuccess)
      // Remove the reserved item from the cart so the fan cannot accidentally
      // purchase or reserve the same unit again through checkout.
      removeItem(product.id, hasSizes ? selectedSize : undefined)
      setOpen(false)
      router.push(`/holds/${data.reservationCode}`)
    } catch {
      toast.error(hb.toastNetworkError)
    } finally {
      setLoading(false)
    }
  }

  if (isSoldOut) {
    return (
      <button
        disabled
        className="w-full bg-gray-100 text-gray-400 font-display font-semibold uppercase tracking-wide py-4 rounded-xl cursor-not-allowed"
      >
        {hb.soldOut}
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-jays-red text-white font-display font-semibold uppercase tracking-wide text-lg py-4 rounded-xl hover:bg-red-600 transition-colors active:scale-[0.98]"
      >
        {hb.holdItem}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
          <div className="flex w-full max-w-md flex-col overflow-x-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl max-h-[88vh]">
            {/* Sticky header */}
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h2 className="line-clamp-2 font-display text-sm font-bold uppercase leading-snug text-jays-navy sm:text-lg">
                  {hb.reserveTitle(product.name)}
                </h2>
                <p className="mt-0.5 text-[11px] text-jays-steel sm:text-xs">{hb.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setFieldErrors({}) }}
                aria-label={hb.cancel}
                className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-jays-steel hover:bg-gray-100 hover:text-jays-navy transition-colors"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-3 divide-y divide-gray-100 sm:px-5 sm:py-4">
              {/* Hold type selector */}
              <div className="pb-3 sm:pb-4">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:mb-2 sm:text-xs">{hb.holdTypeLabel}</label>
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label
                    className={`flex items-start gap-2.5 rounded-xl border p-2 cursor-pointer transition-colors sm:gap-3 sm:p-2.5 ${
                      !isStadiumHold ? 'border-jays-navy bg-jays-ice' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="holdType"
                      checked={!isStadiumHold}
                      onChange={() => setIsStadiumHold(false)}
                      className="mt-0.5 shrink-0 accent-jays-navy"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-jays-navy sm:text-sm">{hb.standardHoldTitle}</p>
                      <p className="text-[11px] text-jays-steel sm:text-xs">
                        {hb.standardHoldDesc(standardHoldHours ?? 3)}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 rounded-xl border p-2 transition-colors sm:gap-3 sm:p-2.5 ${
                      !stadiumAvailable
                        ? 'opacity-40 cursor-not-allowed border-gray-200'
                        : isStadiumHold
                        ? 'border-jays-red bg-red-50 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                  >
                    <input
                      type="radio"
                      name="holdType"
                      checked={isStadiumHold}
                      disabled={!stadiumAvailable}
                      onChange={() => stadiumAvailable && setIsStadiumHold(true)}
                      className="mt-0.5 shrink-0 accent-jays-red"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-jays-navy sm:text-sm">{hb.stadiumHoldTitle}</p>
                      <p className="text-[11px] text-jays-steel sm:text-xs">
                        {hb.stadiumHoldDesc(stadiumHoldHours ?? 24)}
                      </p>
                      {!stadiumAvailable && (
                        <p className="text-[11px] text-amber-700 mt-0.5 sm:text-xs">{hb.stadiumUnavailableNote}</p>
                      )}
                    </div>
                  </label>
                </div>

                {isStadiumHold && (
                  <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-2 text-amber-800 text-[11px] sm:px-3 sm:text-xs">
                    <span className="mt-0.5">⚾</span>
                    <div className="min-w-0">
                      <p className="font-bold">{hb.stadiumHoldAlertTitle}</p>
                      <p className="font-medium">{hb.stadiumHoldAlertBody}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity + Size */}
              <div className="grid grid-cols-1 gap-3 py-3 sm:gap-4 sm:py-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:mb-2 sm:text-xs">{hb.quantity}</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:border-jays-navy sm:h-10 sm:w-10"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold text-jays-navy sm:w-8">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:border-jays-navy sm:h-10 sm:w-10"
                    >
                      +
                    </button>
                    <span className="text-[11px] text-jays-steel sm:ml-1 sm:text-xs">{maxQty} {hb.available}</span>
                  </div>
                </div>

                {hasSizes && (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:mb-2 sm:text-xs">{hb.selectSize}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {sizes.map((size) => {
                        const oos = isSizeOos(size)
                        return (
                          <button
                            key={size}
                            type="button"
                            disabled={oos}
                            onClick={() => {
                              if (!oos) setSelectedSize(size)
                            }}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:py-2 sm:text-xs ${
                              oos
                                ? 'opacity-40 cursor-not-allowed line-through bg-gray-100 border-gray-200 text-gray-400'
                                : selectedSize === size
                                ? 'bg-jays-navy text-white border-jays-navy'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-jays-navy'
                            }`}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                    {hasAnyOos && (
                      <p className="mt-1.5 text-[11px] text-gray-400 sm:mt-2 sm:text-xs">{hb.sizeOosLegend}</p>
                    )}
                    {fieldErrors.size && (
                      <p className="mt-1.5 text-[11px] text-red-500 sm:text-xs" role="alert">{fieldErrors.size}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 gap-2.5 py-3 sm:gap-3 sm:py-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">{hb.fullName}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setFieldErrors((prev) => ({ ...prev, fullName: undefined })) }}
                    placeholder={hb.fullNamePlaceholder}
                    aria-invalid={!!fieldErrors.fullName}
                    className={`w-full min-w-0 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy sm:px-3.5 sm:py-2.5 ${fieldErrors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1.5 text-[11px] text-red-500 sm:text-xs" role="alert">{fieldErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">{hb.phoneNumber}</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setPhone(digitsOnly)
                      setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                    }}
                    placeholder={hb.phonePlaceholder}
                    aria-invalid={!!fieldErrors.phone}
                    className={`w-full min-w-0 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy sm:px-3.5 sm:py-2.5 ${fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1.5 text-[11px] text-red-500 sm:text-xs" role="alert">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <p className="pt-3 text-[11px] text-jays-steel sm:pt-4 sm:text-xs">
                {hb.privacyNote}
              </p>
            </div>

            {/* Sticky footer */}
            <div className="flex gap-2.5 border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:gap-3 sm:px-5 sm:py-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                onClick={() => { setOpen(false); setFieldErrors({}) }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-jays-steel hover:bg-gray-50 sm:py-3"
              >
                {hb.cancel}
              </button>
              <button
                onClick={submitHold}
                disabled={loading}
                className="flex-1 rounded-xl bg-jays-red py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 sm:py-3"
              >
                {loading ? hb.placingHold : hb.confirmHold}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
