'use client'
import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { ImagePlus } from 'lucide-react'
import type { StyleCategory } from '@/app/(admin)/admin/styles/page'

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'
const FILE_INPUT_CLS = 'w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal'

export default function StyleFormModal({
  mode,
  style,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  style: StyleCategory | null
  onClose: () => void
  onSaved: (style: StyleCategory) => void
}) {
  const [form, setForm] = useState({
    name: style?.name ?? '',
    description: style?.description ?? '',
    heroOverlayText: style?.heroOverlayText ?? '',
    heroCtaLabel: style?.heroCtaLabel ?? '',
    heroCtaUrl: style?.heroCtaUrl ?? '',
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setCoverFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setCoverPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setCoverPreview(null)
    }
  }

  const saveMutation = useMutation(
    async (body: FormData) => {
      const url = mode === 'create' ? '/api/admin/styles' : `/api/admin/styles/${style!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, body })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save style')
      }
      const data = await res.json()
      return (data.style ?? data) as StyleCategory
    },
    {
      invalidateOnSuccess: ['admin-styles', 'public-styles'],
      onSuccess: (result) => {
        toast.success(mode === 'create' ? 'Style category added' : 'Style category updated')
        onSaved(result)
      },
      onError: (err) => toast.error(err.message),
    }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (mode === 'create' && !coverFile) {
      toast.error('Please upload a cover image')
      return
    }

    const body = new FormData()
    body.append('name', form.name.trim())
    body.append('description', form.description)
    body.append('heroOverlayText', form.heroOverlayText)
    body.append('heroCtaLabel', form.heroCtaLabel)
    body.append('heroCtaUrl', form.heroCtaUrl)
    if (coverFile) body.append('coverImageFile', coverFile)

    saveMutation.mutate(body)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold uppercase text-jays-navy text-lg">
              {mode === 'create' ? 'New Style Category' : `Edit ${style?.name}`}
            </h2>
            <button type="button" onClick={onClose} className="text-jays-steel hover:text-jays-red text-xl leading-none">&times;</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Streetwear"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Short description shown on the Shop by Style landing page"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {mode === 'create' ? 'Cover Image *' : 'Replace Cover Image'}
              </label>
              <input type="file" accept="image/*" onChange={handleCoverFile} className={FILE_INPUT_CLS} />
              {(coverPreview || style?.coverImageUrl) && (
                <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-border bg-jays-ice">
                  <Image src={coverPreview || style!.coverImageUrl} alt="Cover preview" fill className="object-cover" unoptimized />
                </div>
              )}
              {!coverPreview && !style?.coverImageUrl && (
                <div className="mt-2 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-jays-steel gap-1.5">
                  <ImagePlus size={24} />
                  <p className="text-xs">Used as the masonry card on the Shop by Style page</p>
                </div>
              )}
            </div>

            <p className="text-xs text-jays-steel">
              Hero media for the Shop by Style landing page is managed separately in Hero Media &rarr; Style Hero.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hero Overlay Text</label>
                <input
                  value={form.heroOverlayText}
                  onChange={(e) => setForm((f) => ({ ...f, heroOverlayText: e.target.value }))}
                  placeholder="e.g. Game Day Ready"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hero CTA Label</label>
                <input
                  value={form.heroCtaLabel}
                  onChange={(e) => setForm((f) => ({ ...f, heroCtaLabel: e.target.value }))}
                  placeholder="e.g. Shop Now"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hero CTA URL</label>
              <input
                value={form.heroCtaUrl}
                onChange={(e) => setForm((f) => ({ ...f, heroCtaUrl: e.target.value }))}
                placeholder="/shop?style=streetwear"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saveMutation.loading}
              className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50"
            >
              {saveMutation.loading ? 'Saving…' : mode === 'create' ? 'Add Style' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
