'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { useMutation } from '@/components/sync/hooks/useMutation'

interface Brand {
  id: string
  name: string
  slug: string
  imageUrl: string
  status: string
}

interface Props {
  brand: Brand | null
  onClose: () => void
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'
const SELECT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-jays-navy/40'

export default function BrandFormModal({ brand, onClose }: Props) {
  const isEdit = Boolean(brand)
  const [name, setName] = useState(brand?.name ?? '')
  const [status, setStatus] = useState(brand?.status ?? 'ACTIVE')
  const [imageUrl, setImageUrl] = useState(brand?.imageUrl ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(brand?.imageUrl ?? '')

  useEffect(() => {
    if (brand) {
      setName(brand.name)
      setStatus(brand.status)
      setImageUrl(brand.imageUrl)
      setPreview(brand.imageUrl)
    }
  }, [brand])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(selected)
  }

  const saveMutation = useMutation(
    async () => {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('status', status)
      if (imageUrl) formData.append('imageUrl', imageUrl)
      if (file) formData.append('imageFile', file)

      const url = isEdit ? `/api/admin/brands/${brand!.id}` : '/api/admin/brands'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
    },
    {
      invalidateOnSuccess: ['admin-brands'],
      onSuccess: () => {
        toast.success(isEdit ? 'Brand updated' : 'Brand created')
        onClose()
      },
      onError: (err: Error) => toast.error(err.message || `Failed to ${isEdit ? 'update' : 'create'} brand`),
    }
  )

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Brand name is required')
      return
    }
    if (!imageUrl && !file) {
      toast.error('Upload a logo or provide a logo URL')
      return
    }
    saveMutation.mutate()
  }, [name, imageUrl, file, saveMutation])

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase text-jays-navy">
            {isEdit ? 'Edit Brand' : 'Add Brand'}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Brand Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nike"
              className={INPUT_CLS}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLS}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Logo</label>
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center shrink-0">
                {preview ? (
                  <Image src={preview} alt="Logo preview" fill className="object-contain p-2" sizes="80px" />
                ) : (
                  <span className="text-2xl font-bold text-jays-navy">{name.charAt(0) || 'B'}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-jays-navy file:text-white file:font-semibold hover:file:bg-jays-royal"
                />
                <p className="text-[10px] text-jays-steel">Or provide a URL below</p>
                <input
                  value={imageUrl}
                  onChange={(e) => { setImageUrl(e.target.value); setPreview(e.target.value) }}
                  placeholder="https://..."
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.loading}
              className="px-4 py-2 rounded-xl bg-jays-navy text-white text-sm font-semibold hover:bg-jays-royal disabled:opacity-50"
            >
              {saveMutation.loading ? 'Saving…' : isEdit ? 'Update Brand' : 'Create Brand'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
