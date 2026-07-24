'use client'
import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB } from '@/lib/constants'

const MAX_GALLERY_FILES = 6

/** Reads a fetch Response body as JSON only when the server actually sent
 * JSON. Platform-level errors (e.g. Vercel's 413 Request Entity Too Large)
 * return a plain-text/HTML body, so calling `.json()` unconditionally
 * throws a confusing "Unexpected token" SyntaxError instead of a useful
 * message. */
async function safeParseResponse(res: Response): Promise<{ error?: string; [key: string]: unknown }> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch {
      // fall through to text handling below
    }
  }
  const text = await res.text().catch(() => '')
  if (res.status === 413 || /request entity too large/i.test(text)) {
    return { error: 'Upload too large — please use smaller images or fewer gallery photos.' }
  }
  return { error: text ? text.slice(0, 200) : `Request failed (${res.status})` }
}

export interface ProductOption {
  id: string
  name: string
  slug: string
  imageUrl: string
}

export interface PlayerProductLink {
  label: string
  product: ProductOption
}

export interface Player {
  id: string
  name: string
  slug: string
  jerseyNumber: string
  position: string
  bio: string
  heroImageUrl: string
  imageUrls: string
  isFeatured: boolean
  isTrending: boolean
  isNewArrival: boolean
  status: string
  products?: PlayerProductLink[]
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

export default function PlayerFormModal({
  mode,
  player,
  productOptions,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  player: Player | null
  productOptions: ProductOption[]
  onClose: () => void
  onSaved: (player: Player) => void
}) {
  const [form, setForm] = useState({
    name: player?.name ?? '',
    jerseyNumber: player?.jerseyNumber ?? '',
    position: player?.position ?? '',
    bio: player?.bio ?? '',
    heroImageUrl: player?.heroImageUrl ?? '',
    isFeatured: player?.isFeatured ?? false,
    isTrending: player?.isTrending ?? false,
    isNewArrival: player?.isNewArrival ?? false,
  })
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreview, setHeroPreview] = useState<string | null>(null)
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>(() =>
    (player?.imageUrls ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  )
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const link of player?.products ?? []) {
      initial[link.product.id] = link.label
    }
    return initial
  })
  const [productSearch, setProductSearch] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, modalRef, onClose)

  function handleHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported format. Use JPG, PNG, WebP, or AVIF.`)
        e.target.value = ''
        return
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${file.name}: file too large. Max ${MAX_IMAGE_SIZE_MB}MB.`)
        e.target.value = ''
        return
      }
    }
    setHeroFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setHeroPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setHeroPreview(null)
    }
  }

  function handleGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const candidates = Array.from(e.target.files ?? [])
    const accepted: File[] = []
    for (const file of candidates) {
      if (galleryFiles.length + accepted.length >= MAX_GALLERY_FILES) {
        toast.error(`Max ${MAX_GALLERY_FILES} gallery images allowed`)
        break
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`${file.name}: unsupported format. Use JPG, PNG, WebP, or AVIF.`)
        continue
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`${file.name}: file too large. Max ${MAX_IMAGE_SIZE_MB}MB.`)
        continue
      }
      accepted.push(file)
    }
    e.target.value = ''
    if (accepted.length === 0) return
    setGalleryFiles((prev) => [...prev, ...accepted])
    setGalleryPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))])
  }

  function removeExistingGalleryUrl(url: string) {
    setExistingGalleryUrls((prev) => prev.filter((u) => u !== url))
  }

  function removeNewGalleryFile(index: number) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const filteredProductOptions = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return productOptions
    return productOptions.filter((p) => p.name.toLowerCase().includes(q))
  }, [productOptions, productSearch])

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => {
      const next = { ...prev }
      if (id in next) delete next[id]
      else next[id] = ''
      return next
    })
  }

  const saveMutation = useMutation(
    async (body: FormData) => {
      const url = mode === 'create' ? '/api/admin/players' : `/api/admin/players/${player!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, body })
      if (!res.ok) {
        const d = await safeParseResponse(res)
        throw new Error(d.error ?? 'Failed to save player')
      }
      const data = await safeParseResponse(res)
      return (data.player ?? data) as Player
    },
    {
      invalidateOnSuccess: ['admin-players', 'admin-players-archived', 'players'],
      onSuccess: (result) => {
        toast.success(mode === 'create' ? 'Player added' : 'Player updated')
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
    const body = new FormData()
    body.append('name', form.name)
    body.append('jerseyNumber', form.jerseyNumber)
    body.append('position', form.position)
    body.append('bio', form.bio)
    body.append('heroImageUrl', form.heroImageUrl)
    body.append('imageUrls', existingGalleryUrls.join(','))
    body.append('isFeatured', String(form.isFeatured))
    body.append('isTrending', String(form.isTrending))
    body.append('isNewArrival', String(form.isNewArrival))
    if (heroFile) body.append('heroImageFile', heroFile)
    galleryFiles.forEach((f, i) => body.append(`galleryFile${i}`, f))

    const productLinks = Object.entries(selectedProducts).map(([productId, label]) => ({ productId, label }))
    body.append('productLinks', JSON.stringify(productLinks))

    saveMutation.mutate(body)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto focus:outline-none">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold uppercase text-jays-navy text-lg">
              {mode === 'create' ? 'New Player' : `Edit ${player?.name}`}
            </h2>
            <button type="button" onClick={onClose} className="text-jays-steel hover:text-jays-red text-xl leading-none">&times;</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jersey Number</label>
              <input value={form.jerseyNumber} onChange={(e) => setForm(f => ({ ...f, jerseyNumber: e.target.value }))} placeholder="e.g. 27" className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
              <input value={form.position} onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))} placeholder="e.g. Outfielder" className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Hero image URL (optional)</label>
              <input value={form.heroImageUrl} onChange={(e) => setForm(f => ({ ...f, heroImageUrl: e.target.value }))} placeholder="https://…" className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Upload hero image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleHeroFile} className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal" />
              <p className="mt-1 text-[10px] text-jays-steel">JPG, PNG, WebP, or AVIF. Max {MAX_IMAGE_SIZE_MB}MB.</p>
              {(heroPreview || form.heroImageUrl) && (
                <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                  <Image src={heroPreview || form.heroImageUrl} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Upload additional gallery images</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={handleGalleryFiles}
                disabled={galleryFiles.length >= MAX_GALLERY_FILES}
                className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal disabled:opacity-50"
              />
              <p className="mt-1 text-[10px] text-jays-steel">JPG, PNG, WebP, or AVIF. Max {MAX_IMAGE_SIZE_MB}MB each, up to {MAX_GALLERY_FILES} images.</p>
              {(existingGalleryUrls.length > 0 || galleryPreviews.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {existingGalleryUrls.map((url) => (
                    <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                      <Image src={url} alt="Gallery image" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removeExistingGalleryUrl(url)}
                        title="Remove image"
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs leading-none flex items-center justify-center hover:bg-jays-red transition-colors"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {galleryPreviews.map((url, i) => (
                    <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-jays-navy/40 group">
                      <Image src={url} alt="New gallery image" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removeNewGalleryFile(i)}
                        title="Remove image"
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white text-xs leading-none flex items-center justify-center hover:bg-jays-red transition-colors"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
              <span className="font-medium text-jays-navy">Featured</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isTrending} onChange={(e) => setForm(f => ({ ...f, isTrending: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 accent-orange-500" />
              <span className="font-medium text-jays-navy">Trending</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm(f => ({ ...f, isNewArrival: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 accent-cyan-600" />
              <span className="font-medium text-jays-navy">New</span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-600">Link Gear ({Object.keys(selectedProducts).length} selected)</label>
            </div>
            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products by name…"
              className={`${INPUT_CLS} mb-2`}
            />
            <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border">
              {productOptions.length === 0 ? (
                <p className="p-3 text-sm text-jays-steel">No products available.</p>
              ) : filteredProductOptions.length === 0 ? (
                <p className="p-3 text-sm text-jays-steel">No products match &quot;{productSearch}&quot;.</p>
              ) : filteredProductOptions.map((p) => {
                const checked = p.id in selectedProducts
                return (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                    <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} className="w-4 h-4 rounded border-gray-300 accent-jays-navy shrink-0" />
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-jays-ice relative shrink-0">
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                    </div>
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                    {checked && (
                      <input
                        value={selectedProducts[p.id]}
                        onChange={(e) => setSelectedProducts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Label (e.g. Home Jersey)"
                        className="w-40 border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saveMutation.loading} className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50">
              {saveMutation.loading ? 'Saving…' : mode === 'create' ? 'Add Player' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
