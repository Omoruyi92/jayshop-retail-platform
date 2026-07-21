'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { Promotion } from '@/app/(admin)/admin/promotions/page'

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'
const LABEL_CLS = 'block text-xs font-semibold text-jays-steel mb-1'

export default function PromotionFormModal({
  promotion,
  onClose,
}: {
  promotion: Promotion | null
  onClose: () => void
}) {
  const isEdit = Boolean(promotion)
  const [text, setText] = useState(promotion?.text ?? '')
  const [link, setLink] = useState(promotion?.link ?? '')
  const [priority, setPriority] = useState(String(promotion?.priority ?? 0))
  const [status, setStatus] = useState<Promotion['status']>(promotion?.status ?? 'PENDING')
  const [startsAt, setStartsAt] = useState(promotion?.startsAt ? toLocalInput(promotion.startsAt) : '')
  const [expiresAt, setExpiresAt] = useState(promotion?.expiresAt ? toLocalInput(promotion.expiresAt) : '')
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, modalRef, onClose)

  const saveMutation = useMutation(
    async () => {
      const payload = {
        text,
        link,
        priority: Number(priority) || 0,
        status,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }
      const res = await fetch(
        isEdit ? `/api/admin/promotions/${promotion!.id}` : '/api/admin/promotions',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-promotions'],
      onSuccess: () => {
        toast.success(isEdit ? 'Promotion updated' : 'Promotion created')
        onClose()
      },
      onError: () => toast.error(isEdit ? 'Failed to update promotion' : 'Failed to create promotion'),
    }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error('Promotion text is required')
      return
    }
    saveMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1} className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 focus:outline-none">
        <h2 className="font-display text-xl font-bold uppercase text-jays-navy mb-4">
          {isEdit ? 'Edit Promotion' : 'Add Promotion'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={LABEL_CLS}>Message *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Free shipping on orders over $75 this weekend!"
              rows={3}
              className={INPUT_CLS}
              required
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Link (optional)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/shop or https://..."
              className={INPUT_CLS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Promotion['status'])}
                className={INPUT_CLS}
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Start date</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Expiry date</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border rounded-xl py-2 text-sm font-semibold hover:bg-jays-ice transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.loading}
              className="flex-1 bg-jays-red text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              {saveMutation.loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
