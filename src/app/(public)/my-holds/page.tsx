'use client'
import { useState } from 'react'
import { formatCAD } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface HoldData {
  id: string
  reservationCode: string
  status: string
  expiresAt: string
  placedAt: string
  holdQuantity: number
  totalPriceCents: number
  fulfilledQuantity: number | null
  finalTotalCents: number | null
  product: { name: string; imageUrl: string; priceCents: number }
}

export default function MyHoldsPage() {
  const { t } = useLanguage()
  const mh = t.myHolds

  const [phone, setPhone]     = useState('')
  const [holds, setHolds]     = useState<HoldData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function lookup() {
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      setError(mh.phoneError)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(digitsOnly)}/holds`)
      if (res.status === 429) throw new Error('Too many requests. Try again in a minute.')
      if (!res.ok) throw new Error('Phone number not found')
      const data = await res.json()
      setHolds(data.holds)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold uppercase text-jays-navy mb-2">{mh.title}</h1>
      <p className="text-jays-steel text-sm mb-6">{mh.subtitle}</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 border border-border">
        <label className="block text-sm font-medium text-gray-700 mb-2">{mh.phoneLabel}</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
              setPhone(digitsOnly)
              if (error) setError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder={mh.phonePlaceholder}
            className="flex-1 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground"
          />
          <button
            onClick={lookup}
            disabled={loading || !phone}
            className="w-full sm:w-auto bg-jays-navy text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-jays-royal transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? mh.lookingUp : mh.lookUp}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {holds !== null && (
        holds.length === 0 ? (
          <EmptyState title={mh.noHoldsTitle} body={mh.noHoldsBody} />
        ) : (
          <div className="space-y-3">
            {holds.map((hold) => {
              const isResolved = ['PICKED_UP', 'RELEASED', 'EXPIRED'].includes(hold.status)
              const isPartialPickup = hold.status === 'PICKED_UP' && hold.fulfilledQuantity !== null && hold.fulfilledQuantity < hold.holdQuantity
              const displayTotal = isResolved && hold.finalTotalCents !== null ? hold.finalTotalCents : hold.totalPriceCents

              return (
                <Link
                  key={hold.reservationCode}
                  href={`/holds/${hold.reservationCode}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm border border-border hover:border-jays-navy transition-colors duration-150 animate-fade-in"
                >
                  <div className="flex gap-3 items-start">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-jays-ice flex-none">
                      <Image src={hold.product.imageUrl} alt={hold.product.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-jays-navy uppercase text-sm truncate">
                            {hold.product.name}
                          </p>
                          <p className="text-jays-red font-bold">{formatCAD(displayTotal)}</p>
                        </div>
                        <StatusBadge status={hold.status} className="shrink-0" />
                      </div>

                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {isPartialPickup ? (
                          <>
                            <span className="text-xs text-jays-steel">
                              {mh.held}: <span className="font-medium text-jays-navy">{hold.holdQuantity}</span>
                            </span>
                            <span className="text-jays-steel text-xs">·</span>
                            <span className="text-xs text-jays-steel">
                              {mh.pickedUp}: <span className="font-medium text-blue-700">{hold.fulfilledQuantity}</span>
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-jays-steel">
                            {mh.qty}: <span className="font-medium text-jays-navy">{hold.holdQuantity}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-jays-steel mt-0.5">
                        {mh.code}: <span className="font-mono">{hold.reservationCode}</span>
                      </p>
                      {hold.status === 'ACTIVE' && (
                        <p className="text-xs text-jays-steel mt-0.5">
                          {mh.expires}: {new Date(hold.expiresAt).toLocaleString('en-CA', {
                            timeZone: 'America/Toronto',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
