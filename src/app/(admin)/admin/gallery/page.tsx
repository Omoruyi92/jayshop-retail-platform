'use client'
import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import GalleryFormModal from '@/components/admin/GalleryFormModal'

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

export interface GalleryImage {
  id: string
  title: string
  description: string
  category: string
  imageUrl: string
  sortOrder: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function AdminGalleryPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [search, setSearch] = useState('')

  const fetchImages = useCallback(async (): Promise<GalleryImage[]> => {
    const url = showArchived ? '/api/admin/gallery?includeArchived=true' : '/api/admin/gallery'
    const res = await fetch(url)
    const data = await res.json()
    return data.images ?? []
  }, [showArchived])

  const cacheKey = showArchived ? 'admin-gallery-archived' : 'admin-gallery'
  const { data: images, loading } = useFetch<GalleryImage[]>(cacheKey, fetchImages)
  const imageList = useMemo(() => images ?? [], [images])

  const filteredImages = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return imageList
    return imageList.filter((img) =>
      img.title.toLowerCase().includes(q) ||
      img.category.toLowerCase().includes(q) ||
      img.description.toLowerCase().includes(q)
    )
  }, [imageList, search])

  const archiveMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-gallery', 'admin-gallery-archived', 'gallery'],
      onSuccess: () => toast.success('Image archived'),
      onError: () => toast.error('Failed to archive image'),
    }
  )

  const unarchiveMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'PATCH',
        body: new URLSearchParams({ status: 'ACTIVE' }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-gallery', 'admin-gallery-archived', 'gallery'],
      onSuccess: () => toast.success('Image restored'),
      onError: () => toast.error('Failed'),
    }
  )

  return (
    <div>
      <div className="page-header mt-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Store Gallery</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Photo
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="search"
          placeholder="Search by title, category, description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLS} max-w-xs`}
        />
      </div>

      <TableWrapper>
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-jays-steel cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-jays-navy"
            />
            Show archived
          </label>
        </div>
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-2 py-1.5 w-12"></th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Title</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Category</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Sort</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Status</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : filteredImages.length === 0 ? (
              <tr><td colSpan={6}><EmptyState
                title={imageList.length === 0 ? 'No gallery photos yet' : 'No results'}
                body={imageList.length === 0 ? 'Click + Add Photo to upload the first store image.' : 'Try adjusting your search.'}
              /></td></tr>
            ) : filteredImages.map((img) => {
              const isArchived = img.status === 'ARCHIVED'
              return (
                <tr key={img.id} className={`hover:bg-jays-ice/50 transition-colors ${isArchived ? 'opacity-50 bg-gray-50' : ''}`}>
                  <td className="px-2 py-1.5">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-jays-ice relative">
                      {img.imageUrl && <Image src={img.imageUrl} alt={img.title} fill className="object-cover" unoptimized />}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 font-medium leading-tight">
                    <p>{img.title}</p>
                    {img.description && <p className="text-[11px] text-jays-steel line-clamp-1">{img.description}</p>}
                  </td>
                  <td className="px-2 py-1.5 text-jays-steel">{img.category}</td>
                  <td className="px-2 py-1.5 text-jays-steel">{img.sortOrder}</td>
                  <td className="px-2 py-1.5"><StatusBadge status={img.status} /></td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1 flex-wrap">
                      <button
                        onClick={() => setEditingImage(img)}
                        className="px-1.5 py-0.5 bg-jays-navy/10 text-jays-navy text-[11px] rounded-md hover:bg-jays-navy/20 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </button>
                      {isArchived ? (
                        <button onClick={() => unarchiveMutation.mutate(img.id)} disabled={unarchiveMutation.loading} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[11px] rounded-md hover:bg-green-100 transition-colors whitespace-nowrap disabled:opacity-50">Unarchive</button>
                      ) : (
                        <button onClick={() => archiveMutation.mutate(img.id)} disabled={archiveMutation.loading} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50">Archive</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrapper>

      {showAdd && (
        <GalleryFormModal
          mode="create"
          image={null}
          onClose={() => setShowAdd(false)}
          onSaved={() => setShowAdd(false)}
        />
      )}

      {editingImage && (
        <GalleryFormModal
          mode="edit"
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSaved={() => setEditingImage(null)}
        />
      )}
    </div>
  )
}
