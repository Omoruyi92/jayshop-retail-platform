'use client'

import { useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'

interface GalleryHeroImage {
  id: string
  imageUrl: string
  altText: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

export default function AdminGalleryHeroPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchImages = useCallback(async (): Promise<GalleryHeroImage[]> => {
    const res = await fetch('/api/admin/gallery-hero')
    if (!res.ok) throw new Error('Failed to load hero images')
    return res.json()
  }, [])

  const { data: images, loading } = useFetch<GalleryHeroImage[]>('admin-gallery-hero', fetchImages)
  const imageList = useMemo(() => images ?? [], [images])

  const uploadMutation = useMutation(
    async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/gallery-hero', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      return res.json()
    },
    {
      invalidateOnSuccess: ['admin-gallery-hero', 'gallery-hero'],
      onSuccess: () => toast.success('Hero image uploaded'),
      onError: (err) => toast.error(err.message),
    }
  )

  const patchMutation = useMutation(
    async (payload: { id: string; isActive?: boolean; sortOrder?: number; altText?: string }) => {
      const res = await fetch('/api/admin/gallery-hero', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Update failed')
      return res.json()
    },
    {
      invalidateOnSuccess: ['admin-gallery-hero', 'gallery-hero'],
      onSuccess: () => toast.success('Hero image updated'),
      onError: () => toast.error('Update failed'),
    }
  )

  const reorderMutation = useMutation(
    async (updates: { id: string; sortOrder: number }[]) => {
      await Promise.all(
        updates.map((payload) =>
          fetch('/api/admin/gallery-hero', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then((res) => {
            if (!res.ok) throw new Error('Reorder failed')
          })
        )
      )
    },
    {
      invalidateOnSuccess: ['admin-gallery-hero', 'gallery-hero'],
      onSuccess: () => toast.success('Order updated'),
      onError: () => toast.error('Reorder failed'),
    }
  )

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/gallery-hero?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return res.json()
    },
    {
      invalidateOnSuccess: ['admin-gallery-hero', 'gallery-hero'],
      onSuccess: () => toast.success('Hero image deleted'),
      onError: () => toast.error('Delete failed'),
    }
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMutation.mutate(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const move = (index: number, direction: 'up' | 'down') => {
    if (reorderMutation.loading) return
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= imageList.length) return
    const updated = [...imageList]
    const [moved] = updated.splice(index, 1)
    updated.splice(target, 0, moved)
    const changes = updated
      .map((img, idx) => ({ id: img.id, sortOrder: idx, changed: img.sortOrder !== idx }))
      .filter((c) => c.changed)
      .map(({ id, sortOrder }) => ({ id, sortOrder }))
    if (changes.length > 0) {
      reorderMutation.mutate(changes)
    }
  }

  return (
    <div>
      <div className="page-header mt-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Gallery Hero</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.loading}
            className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            + Add Hero Image
          </button>
        </div>
      </div>

      <p className="text-sm text-jays-steel mb-4">
        Manage the rotating hero banner shown at the top of the public <strong>Gallery</strong> page. Only active images are shown to visitors, ordered as below.
      </p>

      <TableWrapper>
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-2 py-1.5 w-16">Preview</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Alt Text</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Order</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Status</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : imageList.length === 0 ? (
              <tr><td colSpan={5}><EmptyState title="No hero images yet" body="Upload the first Gallery hero image." /></td></tr>
            ) : imageList.map((img, idx) => (
              <tr key={img.id} className="hover:bg-jays-ice/50 transition-colors">
                <td className="px-2 py-1.5">
                  <div className="w-14 h-10 rounded-md overflow-hidden bg-jays-ice relative">
                    {img.imageUrl && <Image src={img.imageUrl} alt={img.altText || ''} fill className="object-cover" unoptimized />}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    defaultValue={img.altText || ''}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value !== (img.altText || '')) {
                        patchMutation.mutate({ id: img.id, altText: value })
                      }
                    }}
                    className={`${INPUT_CLS} max-w-[200px]`}
                    placeholder="Alt text"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0 || reorderMutation.loading}
                      onClick={() => move(idx, 'up')}
                      className="px-1.5 py-0.5 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 text-[11px]"
                    >
                      ↑
                    </button>
                    <button
                      disabled={idx === imageList.length - 1 || reorderMutation.loading}
                      onClick={() => move(idx, 'down')}
                      className="px-1.5 py-0.5 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 text-[11px]"
                    >
                      ↓
                    </button>
                    <span className="ml-1 text-jays-steel">{img.sortOrder}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => patchMutation.mutate({ id: img.id, isActive: !img.isActive })}
                    disabled={patchMutation.loading}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50 ${img.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {img.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => deleteMutation.mutate(img.id)}
                    disabled={deleteMutation.loading}
                    className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[11px] rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
