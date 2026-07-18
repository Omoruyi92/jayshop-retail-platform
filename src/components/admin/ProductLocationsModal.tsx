'use client'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/Dialog'
import TransferModal from '@/components/admin/TransferModal'

interface SizeRow { size: string; quantity: number; heldQuantity: number; pickedQuantity: number }
interface LocationRow {
  locationId: string
  code: string
  name: string
  isMainStore: boolean
  isPickupQueue: boolean
  assigned: boolean
  sizes: SizeRow[]
  availableBalance: number
  soldQuantity: number
}

interface ProductLocationsModalProps {
  productId: string | null
  productName: string
  sizes: string
  onClose: () => void
  onSaved?: () => void
}

export default function ProductLocationsModal({ productId, productName, sizes, onClose, onSaved }: ProductLocationsModalProps) {
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Record<string, Record<string, string>>>({})
  const [assignedSet, setAssignedSet] = useState<Set<string>>(new Set())
  const [transferState, setTransferState] = useState<{ size: string; fromLocationId?: string } | null>(null)

  const sizeList = sizes.split(',').map((s) => s.trim()).filter(Boolean)

  const load = useCallback(() => {
    if (!productId) return
    setLoading(true)
    fetch(`/api/admin/products/${productId}/inventory`)
      .then((r) => r.json())
      .then((d) => {
        const locs: LocationRow[] = d.inventoryByLocation ?? []
        setLocations(locs)
        setAssignedSet(new Set(locs.filter((l) => l.assigned).map((l) => l.locationId)))
        const nextDraft: Record<string, Record<string, string>> = {}
        for (const loc of locs) {
          nextDraft[loc.locationId] = {}
          for (const size of sizeList) {
            nextDraft[loc.locationId][size] = ''
          }
        }
        setDraft(nextDraft)
        setLoading(false)
      })
      .catch(() => { toast.error('Failed to load location inventory'); setLoading(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  useEffect(() => { load() }, [load])

  if (!productId) return null

  function toggleLocation(locationId: string) {
    setAssignedSet((prev) => {
      const next = new Set(prev)
      if (next.has(locationId)) next.delete(locationId)
      else next.add(locationId)
      return next
    })
  }

  function setQty(locationId: string, size: string, val: string) {
    setDraft((prev) => ({
      ...prev,
      [locationId]: { ...(prev[locationId] ?? {}), [size]: val },
    }))
  }

  async function handleSave() {
    if (!productId) return
    setSaving(true)
    const inventoryByLocation = Array.from(assignedSet).map((locationId) => ({
      locationId,
      sizes: sizeList.map((size) => {
        const row = locations.find((l) => l.locationId === locationId)?.sizes.find((s) => s.size === size)
        const addQty = parseInt(draft[locationId]?.[size] ?? '', 10)
        const currentQty = row?.quantity ?? 0
        const quantity = Number.isFinite(addQty) && addQty > 0 ? currentQty + addQty : currentQty
        return { size, quantity }
      }),
    }))
    try {
      const res = await fetch(`/api/admin/products/${productId}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryByLocation }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? 'Failed to save location assignments')
        setSaving(false)
        return
      }
      toast.success('Inventory saved')
      onSaved?.()
      load()
      setDraft((prev) => {
        const cleared: Record<string, Record<string, string>> = {}
        for (const locId of Object.keys(prev)) {
          cleared[locId] = {}
          for (const size of Object.keys(prev[locId])) cleared[locId][size] = ''
        }
        return cleared
      })
    } catch {
      toast.error('Network error')
    }
    setSaving(false)
  }

  const transferLocations = locations.map((l) => ({
    locationId: l.locationId,
    code: l.code,
    name: l.name,
    isMainStore: l.isMainStore,
    assigned: assignedSet.has(l.locationId),
    sizes: l.sizes,
  }))

  return (
    <>
      <Dialog open={!!productId} onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory — {productName}</DialogTitle>
            <DialogClose className="rounded-lg p-1.5 text-jays-steel hover:bg-jays-ice transition-colors text-lg leading-none">
              ✕
            </DialogClose>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-sm text-jays-steel">Loading…</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {locations.map((loc) => {
                const isAssigned = assignedSet.has(loc.locationId)
                return (
                  <div key={loc.locationId} className={`rounded-xl border p-3 ${isAssigned ? 'border-jays-navy/30 bg-jays-ice/40' : 'border-border'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          disabled={loc.isMainStore}
                          onChange={() => toggleLocation(loc.locationId)}
                          className="w-4 h-4 rounded border-gray-300 accent-jays-navy"
                        />
                        <span className="font-semibold text-jays-navy">{loc.code} — {loc.name}</span>
                        {loc.isMainStore && <span className="text-xs text-jays-steel">(main store, required)</span>}
                        {loc.isPickupQueue && <span className="text-xs text-jays-steel">(pickup queue)</span>}
                      </label>
                      <span className="text-xs text-jays-steel">Available: {loc.availableBalance}</span>
                    </div>

                    {isAssigned && sizeList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sizeList.map((size) => {
                          const row = loc.sizes.find((s) => s.size === size)
                          const hasStock = !!row && row.quantity > 0
                          const currentQty = row?.quantity ?? 0
                          const addQty = parseInt(draft[loc.locationId]?.[size] ?? '', 10)
                          const newQty = Number.isFinite(addQty) && addQty > 0 ? currentQty + addQty : currentQty
                          return (
                            <div key={size} className="flex flex-col items-center gap-1">
                              <span className="text-xs font-semibold text-jays-navy uppercase">{size}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-jays-steel w-6 text-center">{currentQty}</span>
                                <span className="text-xs text-jays-steel">+</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={draft[loc.locationId]?.[size] ?? ''}
                                  onChange={(e) => setQty(loc.locationId, size, e.target.value)}
                                  placeholder="0"
                                  className="w-14 border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
                                />
                                <span className="text-xs font-semibold text-jays-navy w-6 text-center">={newQty}</span>
                              </div>
                              {hasStock && (
                                <button
                                  type="button"
                                  onClick={() => setTransferState({ size, fromLocationId: loc.locationId })}
                                  className="text-[10px] text-jays-royal hover:underline"
                                >
                                  Transfer
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Inventory'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {transferState && (
        <TransferModal
          open={!!transferState}
          onClose={() => setTransferState(null)}
          productId={productId}
          productName={productName}
          size={transferState.size}
          locations={transferLocations}
          defaultFromLocationId={transferState.fromLocationId}
          onTransferred={() => { setTransferState(null); load() }}
        />
      )}
    </>
  )
}
