'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/Dialog'
import { useMutation } from '@/components/sync/hooks/useMutation'

interface LocationOption {
  locationId: string
  code: string
  name: string
  isMainStore: boolean
  assigned: boolean
  sizes: { size: string; quantity: number; heldQuantity: number; pickedQuantity: number }[]
}

interface TransferModalProps {
  open: boolean
  onClose: () => void
  productId: string
  productName: string
  size: string
  /** All locations for this product, from GET /api/admin/products/[id]/inventory */
  locations: LocationOption[]
  /** Defaults the source location picker (e.g. the location row the user clicked "Transfer" from) */
  defaultFromLocationId?: string
  onTransferred: () => void
}

export default function TransferModal({
  open,
  onClose,
  productId,
  productName,
  size,
  locations,
  defaultFromLocationId,
  onTransferred,
}: TransferModalProps) {
  const assignedLocations = locations.filter((l) => l.assigned)

  const [fromLocationId, setFromLocationId] = useState(defaultFromLocationId ?? assignedLocations[0]?.locationId ?? '')
  const [toLocationId, setToLocationId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setFromLocationId(defaultFromLocationId ?? assignedLocations[0]?.locationId ?? '')
      setToLocationId('')
      setQuantity('1')
      setNote('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultFromLocationId])

  const fromLoc = locations.find((l) => l.locationId === fromLocationId)
  const toLoc = locations.find((l) => l.locationId === toLocationId)
  const fromSizeRow = fromLoc?.sizes.find((s) => s.size === size)
  const toSizeRow = toLoc?.sizes.find((s) => s.size === size)
  const available = fromSizeRow ? fromSizeRow.quantity - fromSizeRow.heldQuantity - fromSizeRow.pickedQuantity : 0
  const destCurrentQty = toSizeRow?.quantity ?? 0

  const qtyNum = parseInt(quantity, 10)
  const qtyValid = Number.isFinite(qtyNum) && qtyNum > 0
  const overAvailable = qtyValid && qtyNum > available
  const canSubmit =
    qtyValid && !overAvailable && !!fromLocationId && !!toLocationId && fromLocationId !== toLocationId

  const transferMutation = useMutation<{ success: boolean }, void>(
    async () => {
      const res = await fetch('/api/admin/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          size,
          fromLocationId,
          toLocationId,
          quantity: qtyNum,
          note: note.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to transfer inventory')
      }
      return res.json()
    },
    {
      onSuccess: () => {
        toast.success(`Transferred ${qtyNum} × ${size} from ${fromLoc?.code} to ${toLoc?.code}`)
        onTransferred()
        onClose()
      },
      onError: (err) => toast.error(err.message),
    }
  )

  if (!open) return null

  const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Inventory</DialogTitle>
          <DialogClose className="rounded-lg p-1.5 text-jays-steel hover:bg-jays-ice transition-colors text-lg leading-none">
            ✕
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-jays-steel">
            <span className="font-semibold text-jays-navy">{productName}</span> — size{' '}
            <span className="font-semibold uppercase text-jays-navy">{size}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From location</label>
            <select value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)} className={INPUT_CLS}>
              <option value="">Select source…</option>
              {assignedLocations.map((l) => (
                <option key={l.locationId} value={l.locationId}>{l.code} — {l.name}</option>
              ))}
            </select>
            {fromLoc && (
              <p className="text-xs text-jays-steel mt-1">
                Available: <span className={available <= 0 ? 'text-red-600 font-semibold' : 'font-semibold text-jays-navy'}>{available}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To location</label>
            <select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} className={INPUT_CLS}>
              <option value="">Select destination…</option>
              {locations
                .filter((l) => l.locationId !== fromLocationId)
                .map((l) => (
                  <option key={l.locationId} value={l.locationId}>{l.code} — {l.name}</option>
                ))}
            </select>
            {toLoc && (
              <p className="text-xs text-jays-steel mt-1">
                Current qty at destination: <span className="font-semibold text-jays-navy">{destCurrentQty}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`${INPUT_CLS} ${overAvailable ? 'border-red-400' : ''}`}
            />
            {overAvailable && (
              <p className="text-xs text-red-600 mt-1">Quantity exceeds available stock ({available})</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={INPUT_CLS}
              placeholder="Reason for transfer…"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => transferMutation.mutate()}
            disabled={!canSubmit || transferMutation.loading}
            className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50"
          >
            {transferMutation.loading ? 'Transferring…' : 'Transfer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
