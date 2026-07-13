'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@prisma/client'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/LanguageContext'

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
  const hb = t.holdButton

  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isStadiumHold, setIsStadiumHold] = useState(false)
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

  // Fetch game-day / hold-window info when the modal opens so the stadium
  // queue option can be gated to active game days (server-enforced too) and
  // the displayed hold windows reflect the admin-configured settings.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch(`/api/holds/precheck?productId=${product.id}`)
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
        // Stadium queue is only available on active game days — force back
        // to standard hold if it was selected before this loaded.
        if (!data.gameDay) setIsStadiumHold(false)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, product.id])

  const standardHoldHours = precheck
    ? (precheck.extendedAvailable ? precheck.gate5Hours ?? precheck.standardHoldHours : precheck.standardHoldHours)
    : null
  const stadiumHoldHours = precheck?.stadiumHours ?? null
  const stadiumAvailable = precheck?.gameDay ?? false

  // When a size is selected and per-size availability is known, cap maxQty to
  // that size's available stock. Otherwise fall back to the total remaining.
  const selectedSizeAvailable =
    selectedSize && sizeAvailability
      ? (sizeAvailability.find((s) => s.size === selectedSize)?.available ?? remaining)
      : remaining
  const maxQty = selectedSizeAvailable

  // Clamp quantity if the selected size has fewer units than the current qty
  useEffect(() => {
    if (maxQty > 0 && quantity > maxQty) {
      setQuantity(maxQty)
    }
  }, [maxQty, quantity])

  const hasAnyOos =
    sizeAvailability !== null &&
    sizes.some((size) => {
      const sizeStock = sizeAvailability?.find((s) => s.size === size)
      return sizeStock !== undefined && sizeStock.available <= 0
    })

  function isSizeOos(size: string): boolean {
    if (sizeAvailability === null) return false
    const sizeStock = sizeAvailability?.find((s) => s.size === size)
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-bold uppercase text-jays-navy mb-1">
              {hb.reserveTitle(product.name)}
            </h2>
            <p className="text-jays-steel text-sm mb-5">{hb.subtitle}</p>

            {/* Hold type selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">{hb.holdTypeLabel}</label>
              <div className="flex flex-col gap-2">
                <label
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                    !isStadiumHold ? 'border-jays-navy bg-jays-ice' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="holdType"
                    checked={!isStadiumHold}
                    onChange={() => setIsStadiumHold(false)}
                    className="mt-0.5 accent-jays-navy"
                  />
                  <div>
                    <p className="text-sm font-semibold text-jays-navy">{hb.standardHoldTitle}</p>
                    <p className="text-xs text-jays-steel">
                      {hb.standardHoldDesc(standardHoldHours ?? 3)}
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
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
                    className="mt-0.5 accent-jays-red"
                  />
                  <div>
                    <p className="text-sm font-semibold text-jays-navy">{hb.stadiumHoldTitle}</p>
                    <p className="text-xs text-jays-steel">
                      {hb.stadiumHoldDesc(stadiumHoldHours ?? 24)}
                    </p>
                    {!stadiumAvailable && (
                      <p className="text-xs text-amber-700 mt-0.5">{hb.stadiumUnavailableNote}</p>
                    )}
                  </div>
                </label>
              </div>

              {isStadiumHold && (
                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-800 text-xs">
                  <span className="mt-0.5">⚾</span>
                  <div>
                    <p className="font-bold">{hb.stadiumHoldAlertTitle}</p>
                    <p className="font-medium">{hb.stadiumHoldAlertBody}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{hb.quantity}</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 rounded-xl border border-gray-200 text-gray-700 hover:border-jays-navy flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold text-jays-navy">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="w-11 h-11 rounded-xl border border-gray-200 text-gray-700 hover:border-jays-navy flex items-center justify-center"
                >
                  +
                </button>
                <span className="text-xs text-jays-steel ml-1">{maxQty} {hb.available}</span>
              </div>
            </div>

            {/* Size selector */}
            {hasSizes && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{hb.selectSize}</label>
                <div className="flex flex-wrap gap-2">
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
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
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
                  <p className="mt-2 text-xs text-gray-400">{hb.sizeOosLegend}</p>
                )}
                {fieldErrors.size && (
                  <p className="mt-1.5 text-xs text-red-500" role="alert">{fieldErrors.size}</p>
                )}
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{hb.fullName}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setFieldErrors((prev) => ({ ...prev, fullName: undefined })) }}
                  placeholder={hb.fullNamePlaceholder}
                  aria-invalid={!!fieldErrors.fullName}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy ${fieldErrors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1.5 text-xs text-red-500" role="alert">{fieldErrors.fullName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{hb.phoneNumber}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setFieldErrors((prev) => ({ ...prev, phone: undefined })) }}
                  placeholder={hb.phonePlaceholder}
                  aria-invalid={!!fieldErrors.phone}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy ${fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {fieldErrors.phone && (
                  <p className="mt-1.5 text-xs text-red-500" role="alert">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-jays-steel mb-4">
              {hb.privacyNote}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setFieldErrors({}) }}
                className="flex-1 border border-gray-200 text-jays-steel rounded-xl py-3 font-medium text-sm hover:bg-gray-50"
              >
                {hb.cancel}
              </button>
              <button
                onClick={submitHold}
                disabled={loading}
                className="flex-1 bg-jays-red text-white rounded-xl py-3 font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
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
