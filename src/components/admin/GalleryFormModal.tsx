'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ImagePlus } from 'lucide-react'
import type { GalleryImage } from '@/app/(admin)/admin/gallery/page'

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

const CATEGORY_PRESETS = [
  'General',
  'Storefront',
  'Seasonal Display',
  'Visual Merchandising',
  'Jersey Wall',
  'Caps & Accessories',
  'Game Day Setup',
  'Grand Opening',
]

export default function GalleryFormModal({
  mode,
  image,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  image: GalleryImage | null
  onClose: () => void
  onSaved: (img: GalleryImage) => void
}) {
  const [form, setForm] = useState({
    title: image?.title ?? '',
    description: image?.description ?? '',
    category: image?.category ?? 'General',
    sortOrder: image?.sortOrder ?? 0,
    status: image?.status ?? 'ACTIVE',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, modalRef, onClose)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    if (selected) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(selected)
    } else {
      setPreview(null)
    }
  }

  const saveMutation = useMutation(
    async (body: FormData) => {
      const url = mode === 'create' ? '/api/admin/gallery' : `/api/admin/gallery/${image!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, body })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save image')
      }
      const data = await res.json()
      return (data.image ?? data) as GalleryImage
    },
    {
      invalidateOnSuccess: ['admin-gallery', 'admin-gallery-archived', 'gallery'],
      onSuccess: (result) => {
        toast.success(mode === 'create' ? 'Photo added' : 'Photo updated')
        onSaved(result)
      },
      onError: (err) => toast.error(err.message),
    }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (mode === 'create' && !file) {
      toast.error('Please upload an image')
      return
    }

    const body = new FormData()
    body.append('title', form.title.trim())
    body.append('description', form.description)
    body.append('category', form.category)
    body.append('sortOrder', String(form.sortOrder))
    if (mode === 'edit') body.append('status', form.status)
    if (file) body.append('imageFile', file)

    saveMutation.mutate(body)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto focus:outline-none">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold uppercase text-jays-navy text-lg">
              {mode === 'create' ? 'New Gallery Photo' : `Edit ${image?.title}`}
            </h2>
            <button type="button" onClick={onClose} className="text-jays-steel hover:text-jays-red text-xl leading-none">×</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Spring Training Display"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Short caption for the photo"
                className={INPUT_CLS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input
                  list="gallery-categories"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Theme or display type"
                  className={INPUT_CLS}
                />
                <datalist id="gallery-categories">
                  {CATEGORY_PRESETS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value || '0', 10) }))}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {mode === 'edit' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={INPUT_CLS}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{mode === 'create' ? 'Upload Image *' : 'Replace Image'}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal"
              />
              {(preview || image?.imageUrl) && (
                <div className="mt-3 relative w-full h-48 rounded-xl overflow-hidden border border-border bg-jays-ice">
                  <Image src={preview || image!.imageUrl} alt="Preview" fill className="object-contain" unoptimized />
                </div>
              )}
              {!preview && !image?.imageUrl && (
                <div className="mt-3 h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-jays-steel gap-2">
                  <ImagePlus size={28} />
                  <p className="text-xs">Select a store photo to upload</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saveMutation.loading}
              className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50"
            >
              {saveMutation.loading ? 'Saving…' : mode === 'create' ? 'Add Photo' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
