'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { Zap } from 'lucide-react'

type Location = { id: string; code: string; name: string }
type Product = { id: string; name: string }
type InventoryByLocation = { locationId: string; assigned: boolean; sizes: { size: string; quantity: number }[] }

function makeExternalId() {
  return `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function PosSimulatorPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locationId, setLocationId] = useState('')
  const [productId, setProductId] = useState('')
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [type, setType] = useState<'sale' | 'return'>('sale')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [resultStatus, setResultStatus] = useState<number | null>(null)
  const [availableSizes, setAvailableSizes] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/store-locations').then((r) => r.ok ? r.json() : { locations: [] }).then((d) => setLocations(d.locations ?? []))
    fetch('/api/products').then((r) => r.ok ? r.json() : { products: [] }).then((d) => setProducts(d.products ?? d ?? []))
  }, [])

  useEffect(() => {
    if (!productId) {
      setAvailableSizes([])
      return
    }
    const effectiveLocationId = locationId || locations.find((l) => l.code === 'SEC-110')?.id
    fetch(`/api/admin/products/${productId}/inventory`)
      .then((r) => r.json())
      .then((d) => {
        const byLocation: InventoryByLocation[] = d.inventoryByLocation ?? []
        const match = effectiveLocationId
          ? byLocation.find((l) => l.locationId === effectiveLocationId)
          : undefined
        const sizes = (match?.sizes ?? []).map((s) => s.size)
        setAvailableSizes(sizes)
        setSize((prev) => (sizes.includes(prev) ? prev : sizes[0] ?? ''))
      })
      .catch(() => setAvailableSizes([]))
  }, [productId, locationId, locations]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFire(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !size) {
      toast.error('Select a product and size')
      return
    }
    if (type === 'sale' && !locationId) {
      toast.error('Location is required for a sale')
      return
    }
    setSubmitting(true)
    setResult(null)
    setResultStatus(null)
    try {
      const body = {
        externalId: makeExternalId(),
        type,
        locationId: locationId || undefined,
        items: [{ productId, size, quantity }],
      }
      const res = await fetch('/api/admin/pos-simulator/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult(data)
      setResultStatus(res.status)
      if (res.ok) {
        toast.success(data.deduped ? 'Deduped (already applied)' : `${type === 'sale' ? 'Sale' : 'Return'} applied`)
      } else {
        toast.error(data.error || 'Simulation failed')
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy flex items-center gap-2">
            <Zap size={22} className="text-jays-red" /> POS Simulator
          </h1>
          <p className="text-jays-steel text-sm mt-1">
            Fires a real POST /api/pos/transaction using a dev API key — useful for demos without real POS hardware
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <form onSubmit={handleFire} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('sale')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                type === 'sale' ? 'bg-jays-navy text-white' : 'bg-gray-100 text-jays-steel hover:bg-gray-200'
              }`}
            >
              Sale
            </button>
            <button
              type="button"
              onClick={() => setType('return')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                type === 'return' ? 'bg-jays-navy text-white' : 'bg-gray-100 text-jays-steel hover:bg-gray-200'
              }`}
            >
              Return
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Location {type === 'return' && '(defaults SEC-110 if empty)'}
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy"
              >
                <option value="">{type === 'sale' ? 'Select location…' : 'Default (SEC-110)'}</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy"
                required
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy"
                required
                disabled={availableSizes.length === 0}
              >
                {availableSizes.length === 0 ? (
                  <option value="">No sizes found</option>
                ) : (
                  availableSizes.map((s) => <option key={s} value={s}>{s}</option>)
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-jays-navy text-white py-3 rounded-xl text-sm font-semibold hover:bg-jays-royal disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Firing…' : `Fire ${type === 'sale' ? 'Sale' : 'Return'}`}
          </button>
        </form>
      </div>

      {result !== null && (
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-3">
            Response {resultStatus && <span className="ml-2 text-xs font-mono text-jays-steel">HTTP {resultStatus}</span>}
          </h2>
          <pre className="bg-jays-ice/50 border border-border rounded-xl p-3 text-xs overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          <p className="text-xs text-jays-steel mt-3">
            Check <a href="/admin/pos-events" className="underline text-jays-navy">POS Events</a> or{' '}
            <a href="/admin/inventory/history" className="underline text-jays-navy">Inventory History</a> — updates
            propagate to admin/fan UIs in real time via SSE.
          </p>
        </div>
      )}
    </div>
  )
}
