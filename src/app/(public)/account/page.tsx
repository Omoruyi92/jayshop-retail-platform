'use client'
import { useState } from 'react'
import { formatCAD } from '@/lib/utils'
import Link from 'next/link'

interface HoldData {
  reservationCode: string
  status: string
  expiresAt: string
  product: { name: string; imageUrl: string; priceCents: number }
}

export default function AccountPage() {
  const [phone, setPhone] = useState('')
  const [holds, setHolds] = useState<HoldData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function lookup() {
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      setError('Phone number must be exactly 10 digits')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(digitsOnly)}/holds`)
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
      <h1 className="font-display text-3xl font-bold uppercase text-jays-navy mb-6">My Holds</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter your phone number
        </label>
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
            placeholder="4165550123"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy"
          />
          <button
            onClick={lookup}
            disabled={loading || !phone}
            className="w-full sm:w-auto bg-jays-navy text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-jays-royal transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {loading ? 'Looking up…' : 'Look Up'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {holds !== null && (
        <div className="space-y-3">
          {holds.length === 0 ? (
            <p className="text-center text-jays-steel py-8">No holds found for this number.</p>
          ) : (
            holds.map((hold) => (
              <Link
                key={hold.reservationCode}
                href={`/holds/${hold.reservationCode}`}
                className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-jays-navy transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-display font-semibold text-jays-navy uppercase text-sm">
                      {hold.product.name}
                    </p>
                    <p className="text-jays-red font-bold">{formatCAD(hold.product.priceCents)}</p>
                    <p className="text-xs text-jays-steel mt-1">
                      Code: <span className="font-mono">{hold.reservationCode}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    hold.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {hold.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
