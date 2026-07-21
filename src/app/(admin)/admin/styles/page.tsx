'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { EmptyState } from '@/components/ui/EmptyState'
import { ArrowUp, ArrowDown, Trash2, Pencil, Package } from 'lucide-react'
import StyleFormModal from '@/components/admin/StyleFormModal'
import StyleProductsModal from '@/components/admin/StyleProductsModal'

export interface StyleProductLink {
  id: string
  product: { id: string; name: string; slug: string; imageUrl: string }
}

export interface StyleCategory {
  id: string
  name: string
  slug: string
  description: string | null
  coverImageUrl: string
  heroImageUrl: string | null
  heroVideoUrl: string | null
  heroOverlayText: string | null
  heroCtaLabel: string | null
  heroCtaUrl: string | null
  sortOrder: number
  isActive: boolean
  _count?: { products: number }
  products?: StyleProductLink[]
}

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Request failed')
  return data
}

export default function AdminStylesPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingStyle, setEditingStyle] = useState<StyleCategory | null>(null)
  const [productsStyle, setProductsStyle] = useState<StyleCategory | null>(null)

  const fetchStyles = useCallback(async (): Promise<StyleCategory[]> => {
    const data = await jsonFetch('/api/admin/styles')
    return data.styles ?? []
  }, [])

  const { data: styles, loading } = useFetch<StyleCategory[]>('admin-styles', fetchStyles)
  const list = useMemo(() => styles ?? [], [styles])

  // Keep the currently-open products modal in sync with the latest fetched
  // data (assignment changes invalidate 'admin-styles' and refetch).
  const activeProductsStyle = useMemo(
    () => (productsStyle ? list.find((s) => s.id === productsStyle.id) ?? productsStyle : null),
    [list, productsStyle]
  )

  const patchMutation = useMutation(
    async ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      jsonFetch(`/api/admin/styles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    {
      invalidateOnSuccess: ['admin-styles', 'public-styles'],
      onError: (err) => toast.error(err.message || 'Failed to update style'),
    }
  )

  const deleteMutation = useMutation(
    async (id: string) => jsonFetch(`/api/admin/styles/${id}`, { method: 'DELETE' }),
    {
      invalidateOnSuccess: ['admin-styles', 'public-styles'],
      onSuccess: () => toast.success('Style category deleted'),
      onError: (err) => toast.error(err.message || 'Failed to delete style'),
    }
  )

  return (
    <div>
      <div className="page-header mt-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Shop by Style</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Style
        </button>
      </div>
      <p className="text-sm text-jays-steel mb-4">
        Manage the merchandising style categories (e.g. Jerseys, Streetwear, Game Day Fits) used to build the
        &quot;Shop by Style&quot; landing page. Order here controls the display order on the storefront.
      </p>

      {loading ? (
        <p className="text-sm text-jays-steel">Loading styles…</p>
      ) : list.length === 0 ? (
        <EmptyState title="No style categories yet" body="Click + Add Style to create your first style category." />
      ) : (
        <div className="space-y-3">
          {list.map((style, idx) => (
            <div
              key={style.id}
              className="flex flex-wrap items-center gap-3 px-3 py-3 rounded-xl border border-border bg-white"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-jays-ice relative shrink-0">
                <Image src={style.coverImageUrl} alt={style.name} fill className="object-cover" unoptimized />
              </div>

              <div className="flex-1 min-w-[160px]">
                <p className="font-semibold text-sm text-jays-navy">
                  {style.name}
                  <span className="ml-2 text-xs font-normal text-jays-steel">/{style.slug}</span>
                </p>
                {style.description && (
                  <p className="text-xs text-jays-steel line-clamp-1 max-w-md">{style.description}</p>
                )}
              </div>

              <button
                onClick={() => patchMutation.mutate({ id: style.id, body: { isActive: !style.isActive } })}
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  style.isActive
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}
                title={style.isActive ? 'Visible on storefront — click to hide' : 'Hidden from storefront — click to show'}
              >
                {style.isActive ? 'Visible' : 'Hidden'}
              </button>

              <button
                onClick={() => setProductsStyle(style)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-jays-navy bg-jays-ice hover:bg-jays-ice/70 transition-colors"
              >
                <Package size={13} />
                {style._count?.products ?? 0} product{(style._count?.products ?? 0) === 1 ? '' : 's'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => patchMutation.mutate({ id: style.id, body: { move: 'up' } })}
                  className="p-1.5 text-jays-steel hover:text-jays-navy rounded-lg hover:bg-jays-ice disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  disabled={idx === list.length - 1}
                  onClick={() => patchMutation.mutate({ id: style.id, body: { move: 'down' } })}
                  className="p-1.5 text-jays-steel hover:text-jays-navy rounded-lg hover:bg-jays-ice disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => setEditingStyle(style)}
                  className="p-1.5 text-jays-steel hover:text-jays-navy rounded-lg hover:bg-jays-ice"
                  aria-label="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete "${style.name}"? This permanently removes the style category and its product assignments, but does NOT delete or affect the actual products themselves. This cannot be undone.`
                      )
                    ) {
                      deleteMutation.mutate(style.id)
                    }
                  }}
                  className="p-1.5 text-jays-red hover:text-red-700 rounded-lg hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <StyleFormModal
          mode="create"
          style={null}
          onClose={() => setShowAdd(false)}
          onSaved={() => setShowAdd(false)}
        />
      )}

      {editingStyle && (
        <StyleFormModal
          mode="edit"
          style={editingStyle}
          onClose={() => setEditingStyle(null)}
          onSaved={() => setEditingStyle(null)}
        />
      )}

      {activeProductsStyle && (
        <StyleProductsModal
          style={activeProductsStyle}
          onClose={() => setProductsStyle(null)}
        />
      )}
    </div>
  )
}
