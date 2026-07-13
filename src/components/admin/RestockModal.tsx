'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/Dialog'

interface RestockModalProps {
  productId: string | null
  productName: string
  sizes: string
  onClose: () => void
  onRestocked: () => void
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40'

export default function RestockModal({ productId, productName, sizes, onClose, onRestocked }: RestockModalProps) {
  const sizeList = sizes.split(',').map((s) => s.trim()).filter(Boolean)
  const [size, setSize] = useState(sizeList[0] ?? '')
  const [addQuantity, setAddQuantity] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (!productId) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseInt(addQuantity, 10)
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Enter a quantity greater than 0')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addQuantity: qty,
          size: sizeList.length > 0 ? size : undefined,
          note: note.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? 'Failed to restock')
        setSaving(false)
        return
      }
      toast.success(`Restocked +${qty}${size ? ` (${size})` : ''}`)
      setAddQuantity('')
      setNote('')
      onRestocked()
    } catch {
      toast.error('Network error')
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!productId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Restock — {productName}</DialogTitle>
          <DialogClose className="rounded-lg p-1.5 text-jays-steel hover:bg-jays-ice transition-colors text-lg leading-none">
            ✕
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {sizeList.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
              <select value={size} onChange={(e) => setSize(e.target.value)} className={INPUT_CLS}>
                {sizeList.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Add Quantity *</label>
            <input
              required
              type="number"
              min="1"
              value={addQuantity}
              onChange={(e) => setAddQuantity(e.target.value)}
              placeholder="e.g. 25"
              className={INPUT_CLS}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. New shipment from supplier"
              className={INPUT_CLS}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50"
            >
              {saving ? 'Restocking…' : 'Restock'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
