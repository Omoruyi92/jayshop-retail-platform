'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import BrandFormModal from '@/components/admin/BrandFormModal'

export type Brand = {
  id: string
  name: string
  slug: string
  imageUrl: string
  status: string
  productCount?: number
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

export default function AdminBrandsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [search, setSearch] = useState('')

  const fetchBrands = useCallback(async (): Promise<Brand[]> => {
    const res = await fetch('/api/admin/brands?status=ALL')
    const data = await res.json()
    return data.brands ?? []
  }, [])

  const { data: brands, loading } = useFetch<Brand[]>('admin-brands', fetchBrands)
  const brandList = useMemo(() => brands ?? [], [brands])

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return brandList
    return brandList.filter((b) => b.name.toLowerCase().includes(q))
  }, [brandList, search])

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-brands'],
      onSuccess: () => toast.success('Brand deleted'),
      onError: () => toast.error('Failed to delete brand'),
    }
  )

  const toggleStatus = useMutation(
    async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/brands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-brands'],
      onSuccess: () => toast.success('Brand status updated'),
      onError: () => toast.error('Failed to update status'),
    }
  )

  return (
    <div>
      <div className="page-header mt-2 flex-col sm:flex-row items-start sm:items-center gap-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Brands</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Brand
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 mt-3">
        <input
          type="search"
          placeholder="Search brand name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLS} max-w-xs`}
        />
      </div>

      <TableWrapper>
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-2 py-1.5 w-12"></th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Brand</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Slug</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Products</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Status</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6">
                  <EmptyState title={search ? 'No brands match your search' : 'No brands yet'} />
                </td>
              </tr>
            ) : (
              filteredBrands.map((brand) => (
                <tr key={brand.id} className="border-b border-border hover:bg-jays-ice/30">
                  <td className="px-2 py-2">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex items-center justify-center">
                      {brand.imageUrl ? (
                        <Image src={brand.imageUrl} alt={brand.name} fill className="object-contain p-1" sizes="40px" />
                      ) : (
                        <span className="text-sm font-bold text-jays-navy">{brand.name.charAt(0)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2 font-semibold text-jays-navy">{brand.name}</td>
                  <td className="px-2 py-2 text-jays-steel">/{brand.slug}</td>
                  <td className="px-2 py-2">{brand.productCount ?? 0}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => toggleStatus.mutate({ id: brand.id, status: brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        brand.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {brand.status}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingBrand(brand)}
                        className="text-jays-navy hover:text-jays-royal text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete brand “${brand.name}”? Products will be unlinked but not deleted.`)) {
                            deleteMutation.mutate(brand.id)
                          }
                        }}
                        className="text-jays-red hover:text-red-700 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableWrapper>

      {(showAdd || editingBrand) && (
        <BrandFormModal
          brand={editingBrand}
          onClose={() => { setShowAdd(false); setEditingBrand(null) }}
        />
      )}
    </div>
  )
}
