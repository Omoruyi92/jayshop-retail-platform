'use client'
import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { X } from 'lucide-react'
import type { StyleCategory } from '@/app/(admin)/admin/styles/page'

interface ProductOption {
  id: string
  name: string
  slug: string
  imageUrl: string
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Request failed')
  return data
}

export default function StyleProductsModal({
  style,
  onClose,
}: {
  style: StyleCategory
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  const fetchProducts = useCallback(async (): Promise<ProductOption[]> => {
    const data = await jsonFetch('/api/products?includeArchived=true')
    return (data.products ?? []).map((p: { id: string; name: string; slug: string; imageUrl: string }) => ({
      id: p.id, name: p.name, slug: p.slug, imageUrl: p.imageUrl,
    }))
  }, [])
  const { data: productOptions } = useFetch<ProductOption[]>('admin-products-options', fetchProducts)
  const allProducts = useMemo(() => productOptions ?? [], [productOptions])

  const assignedIds = useMemo(
    () => new Set((style.products ?? []).map((link) => link.product.id)),
    [style.products]
  )

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allProducts
    return allProducts.filter((p) => p.name.toLowerCase().includes(q))
  }, [allProducts, search])

  const assignMutation = useMutation(
    async (productId: string) =>
      jsonFetch(`/api/admin/styles/${style.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      }),
    {
      invalidateOnSuccess: ['admin-styles', 'public-styles'],
      onSuccess: () => toast.success('Product assigned'),
      onError: (err) => toast.error(err.message || 'Failed to assign product'),
    }
  )

  const unassignMutation = useMutation(
    async (productId: string) =>
      jsonFetch(`/api/admin/styles/${style.id}/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      }),
    {
      invalidateOnSuccess: ['admin-styles', 'public-styles'],
      onSuccess: () => toast.success('Product unassigned'),
      onError: (err) => toast.error(err.message || 'Failed to unassign product'),
    }
  )

  function toggleProduct(id: string) {
    if (assignedIds.has(id)) unassignMutation.mutate(id)
    else assignMutation.mutate(id)
  }

  const assignedProducts = (style.products ?? []).map((link) => link.product)

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold uppercase text-jays-navy text-lg">
              Products in &quot;{style.name}&quot;
            </h2>
            <button type="button" onClick={onClose} className="text-jays-steel hover:text-jays-red text-xl leading-none">&times;</button>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-jays-steel mb-1.5">
              Assigned ({assignedProducts.length})
            </p>
            <div className="flex flex-wrap gap-2 mb-1">
              {assignedProducts.length === 0 ? (
                <span className="text-xs text-jays-steel">No products assigned yet.</span>
              ) : assignedProducts.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-jays-ice/40 pl-1 pr-2 py-1 text-xs font-medium text-jays-navy"
                >
                  <span className="w-5 h-5 rounded-full overflow-hidden bg-white relative shrink-0">
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                  </span>
                  <span className="max-w-[160px] truncate">{p.name}</span>
                  <button
                    onClick={() => unassignMutation.mutate(p.id)}
                    className="text-jays-red hover:text-red-700"
                    aria-label={`Unassign ${p.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Add products</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name…"
              className={`${INPUT_CLS} mb-2`}
            />
            <div className="max-h-64 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {allProducts.length === 0 ? (
                <p className="p-3 text-sm text-jays-steel">No products available.</p>
              ) : filteredProducts.length === 0 ? (
                <p className="p-3 text-sm text-jays-steel">No products match &quot;{search}&quot;.</p>
              ) : filteredProducts.map((p) => {
                const checked = assignedIds.has(p.id)
                return (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(p.id)}
                      className="w-4 h-4 rounded border-gray-300 accent-jays-navy shrink-0"
                    />
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-jays-ice relative shrink-0">
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                    </div>
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors">Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}
