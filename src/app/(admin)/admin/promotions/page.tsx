'use client'

import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import PromotionFormModal from '@/components/admin/PromotionFormModal'

export type Promotion = {
  id: string
  text: string
  link: string | null
  status: 'PENDING' | 'APPROVED' | 'ARCHIVED'
  priority: number
  startsAt: string | null
  expiresAt: string | null
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
}

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
  ARCHIVED: 'bg-gray-50 text-gray-500 border-gray-200',
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

export default function AdminPromotionsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [search, setSearch] = useState('')

  const fetchPromotions = useCallback(async (): Promise<Promotion[]> => {
    const res = await fetch('/api/admin/promotions?status=ALL')
    const data = await res.json()
    return data.promotions ?? []
  }, [])

  const { data: promotions, loading } = useFetch<Promotion[]>('admin-promotions', fetchPromotions)
  const promotionList = useMemo(() => promotions ?? [], [promotions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return promotionList
    return promotionList.filter((p) => p.text.toLowerCase().includes(q))
  }, [promotionList, search])

  const archiveMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-promotions'],
      onSuccess: () => toast.success('Promotion archived'),
      onError: () => toast.error('Failed to archive promotion'),
    }
  )

  const statusMutation = useMutation(
    async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-promotions'],
      onSuccess: (_, vars) => toast.success(vars.status === 'APPROVED' ? 'Promotion approved' : 'Promotion status updated'),
      onError: () => toast.error('Failed to update promotion'),
    }
  )

  return (
    <div>
      <div className="page-header mt-2 flex-col sm:flex-row items-start sm:items-center gap-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Promotions</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Promotion
        </button>
      </div>

      <p className="text-sm text-jays-steel mt-1 mb-3">
        Approved promotions scroll in the customer-facing header announcement banner.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="search"
          placeholder="Search promotion text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLS} max-w-xs`}
        />
      </div>

      <TableWrapper>
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Message</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Link</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Priority</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Status</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Schedule</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  <EmptyState title={search ? 'No promotions match your search' : 'No promotions yet'} />
                </td>
              </tr>
            ) : (
              filtered.map((promo) => (
                <tr key={promo.id} className="border-b border-border hover:bg-jays-ice/30">
                  <td className="px-2 py-2 font-semibold text-jays-navy max-w-[200px] truncate" title={promo.text}>{promo.text}</td>
                  <td className="px-2 py-2 text-jays-steel">
                    {promo.link ? (
                      <Link href={promo.link} target="_blank" rel="noopener noreferrer" className="text-jays-royal hover:underline truncate max-w-[120px] inline-block">{promo.link}</Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2 py-2">{promo.priority}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => {
                        const next = promo.status === 'PENDING' ? 'APPROVED' : promo.status === 'APPROVED' ? 'PENDING' : 'PENDING'
                        statusMutation.mutate({ id: promo.id, status: next })
                      }}
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[promo.status]}`}
                    >
                      {promo.status}
                    </button>
                  </td>
                  <td className="px-2 py-2 text-jays-steel text-[10px] sm:text-xs">
                    {promo.startsAt ? new Date(promo.startsAt).toLocaleDateString() : 'Always'}
                    {' · '}
                    {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingPromotion(promo)}
                        className="text-jays-navy hover:text-jays-royal text-xs font-semibold"
                      >
                        Edit
                      </button>
                      {promo.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => {
                            if (confirm('Archive this promotion?')) archiveMutation.mutate(promo.id)
                          }}
                          className="text-jays-red hover:text-red-700 text-xs font-semibold"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrapper>

      {(showAdd || editingPromotion) && (
        <PromotionFormModal
          promotion={editingPromotion}
          onClose={() => { setShowAdd(false); setEditingPromotion(null) }}
        />
      )}
    </div>
  )
}
