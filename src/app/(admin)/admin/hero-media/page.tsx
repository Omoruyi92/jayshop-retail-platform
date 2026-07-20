'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { SlideScope, MediaType } from '@prisma/client'

interface HeroSlide {
  id: string
  scope: SlideScope
  mediaType: MediaType
  url: string
  mobileUrl: string | null
  altText: string | null
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'
const TAB_CLS = 'px-4 py-2 text-sm font-semibold rounded-xl transition-colors'
const TAB_ACTIVE = 'bg-jays-navy text-white'
const TAB_INACTIVE = 'bg-gray-100 text-jays-steel hover:bg-gray-200'

export default function AdminHeroMediaPage() {
  const [scope, setScope] = useState<SlideScope>('HOME')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchSlides = useCallback(async (): Promise<HeroSlide[]> => {
    const res = await fetch(`/api/admin/hero-slides?scope=${scope}`)
    if (!res.ok) throw new Error('Failed to load slides')
    return res.json()
  }, [scope])

  const { data: slides, loading } = useFetch<HeroSlide[]>(`hero-slides-${scope}`, fetchSlides)
  const slideList = useMemo(() => slides ?? [], [slides])

  const uploadMutation = useMutation(
    async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('scope', scope)
      const res = await fetch('/api/admin/hero-slides', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      return res.json()
    },
    {
      invalidateOnSuccess: [`hero-slides-${scope}`, 'public-hero-slides'],
      onSuccess: () => toast.success('Slide uploaded'),
      onError: (err) => toast.error(err.message),
    }
  )

  const patchMutation = useMutation(
    async (payload: { id: string; active?: boolean; sortOrder?: number; altText?: string }) => {
      const res = await fetch('/api/admin/hero-slides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Update failed')
      return res.json()
    },
    {
      invalidateOnSuccess: [`hero-slides-${scope}`, 'public-hero-slides'],
      onSuccess: () => toast.success('Slide updated'),
      onError: () => toast.error('Update failed'),
    }
  )

  const deleteMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/hero-slides?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      return res.json()
    },
    {
      invalidateOnSuccess: [`hero-slides-${scope}`, 'public-hero-slides'],
      onSuccess: () => toast.success('Slide deleted'),
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
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= slideList.length) return
    const updated = [...slideList]
    const [moved] = updated.splice(index, 1)
    updated.splice(target, 0, moved)
    updated.forEach((slide, idx) => {
      if (slide.sortOrder !== idx) {
        patchMutation.mutate({ id: slide.id, sortOrder: idx })
      }
    })
  }

  return (
    <div>
      <div className="page-header mt-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Hero Media</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.loading}
            className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            + Add Slide
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setScope('HOME')} className={`${TAB_CLS} ${scope === 'HOME' ? TAB_ACTIVE : TAB_INACTIVE}`}>
          Home Hero
        </button>
        <button onClick={() => setScope('SHOP')} className={`${TAB_CLS} ${scope === 'SHOP' ? TAB_ACTIVE : TAB_INACTIVE}`}>
          Shop Hero
        </button>
      </div>

      <TableWrapper>
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-2 py-1.5 w-16">Preview</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Type</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Alt Text</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Order</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Status</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : slideList.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No slides yet" body={`Upload the first ${scope === 'HOME' ? 'home' : 'shop'} hero slide.`} /></td></tr>
            ) : slideList.map((slide, idx) => (
              <tr key={slide.id} className="hover:bg-jays-ice/50 transition-colors">
                <td className="px-2 py-1.5">
                  <div className="w-14 h-10 rounded-md overflow-hidden bg-jays-ice relative">
                    {slide.mediaType === 'VIDEO' ? (
                      <video src={slide.url} className="w-full h-full object-cover" muted />
                    ) : (
                      slide.url && <Image src={slide.url} alt={slide.altText || ''} fill className="object-cover" unoptimized />
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-jays-steel">{slide.mediaType}</td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    defaultValue={slide.altText || ''}
                    onBlur={(e) => {
                      const value = e.target.value
                      if (value !== (slide.altText || '')) {
                        patchMutation.mutate({ id: slide.id, altText: value })
                      }
                    }}
                    className={`${INPUT_CLS} max-w-[200px]`}
                    placeholder="Alt text"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => move(idx, 'up')}
                      className="px-1.5 py-0.5 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 text-[11px]"
                    >
                      ↑
                    </button>
                    <button
                      disabled={idx === slideList.length - 1}
                      onClick={() => move(idx, 'down')}
                      className="px-1.5 py-0.5 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40 text-[11px]"
                    >
                      ↓
                    </button>
                    <span className="ml-1 text-jays-steel">{slide.sortOrder}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => patchMutation.mutate({ id: slide.id, active: !slide.active })}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${slide.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {slide.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => deleteMutation.mutate(slide.id)}
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
