'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import ColorPickerModal from '@/components/admin/ColorPickerModal'
import { SIZELESS_SUBS, getDefaultSizes, POPULAR_BRANDS, colorToSwatch, HAT_STYLES } from '@/lib/constants'
import { useCategoryTree } from '@/hooks/useCategoryTree'

interface Product {
  id: string
  name: string
  slug: string
  priceCents: number
  salePriceCents: number
  imageUrl: string
  imageUrl2: string
  imageUrl3: string
  category: string
  subcategory: string
  hatStyle: string
  quantity: number
  heldQuantity: number
  remaining: number
  sizes: string
  brand: string
  status: string
  isLicensed: boolean
  isChampion: boolean
  isNewArrival: boolean
  isClearance: boolean
  isFeatured: boolean
  isSport: boolean
  isAuthenticated: boolean
  colors: any
  _count?: { holds: number }
}

interface EditProductModalProps {
  product: Product | null
  onClose: () => void
  onSaved: (updated: Product) => void
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

function buildInitialForm(product: Product) {
  return {
    name:        product.name,
    description: '',
    price:       (product.priceCents / 100).toFixed(2),
    salePrice:   product.salePriceCents > 0 ? (product.salePriceCents / 100).toFixed(2) : '',
    quantity:    String(product.quantity),
    sizes:       product.sizes,
    category:    product.category,
    subcategory: product.subcategory,
    hatStyle:    product.hatStyle || '',
    brand:       product.brand,
    status:      product.status,
    isLicensed:  product.isLicensed,
    isChampion:  product.isChampion,
    isNewArrival: product.isNewArrival,
    isClearance:  product.isClearance,
    isFeatured:   product.isFeatured,
    isSport:      product.isSport,
    isAuthenticated: product.isAuthenticated,
    imageUrl:    product.imageUrl,
    imageUrl2:   product.imageUrl2,
    imageUrl3:   product.imageUrl3,
    colors:      Array.isArray(product.colors) ? product.colors.map(c => typeof c === 'string' ? c : c.name || c.hex || '') : [],
  }
}

function buildInitialSizeQtys(product: Product): Record<string, string> {
  const sizes = product.sizes.split(',').map((s) => s.trim()).filter(Boolean)
  const result: Record<string, string> = {}
  for (const s of sizes) result[s] = ''
  return result
}

export default function EditProductModal({ product, onClose, onSaved }: EditProductModalProps) {
  const { mainCategories, subsByCat } = useCategoryTree()
  const [form, setForm] = useState(() => product ? buildInitialForm(product) : null)
  const [sizeQtys, setSizeQtys] = useState<Record<string, string>>(() => product ? buildInitialSizeQtys(product) : {})
  const [images, setImages] = useState<{ url: string; file: File | null }[]>(() => {
    if (!product) return []
    return [product.imageUrl, product.imageUrl2, product.imageUrl3]
      .filter(Boolean)
      .map(url => ({ url, file: null }))
  })
  const [colorInput, setColorInput] = useState('')
  const [saving, setSaving] = useState(false)

  if (!product || !form) return null

  const needsSizes = !SIZELESS_SUBS.has(form.subcategory)
  const currentSizeList = needsSizes ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean) : []

  function handleCategoryChange(cat: string) {
    const firstSub = subsByCat[cat]?.[0] ?? ''
    setForm((f) => f ? ({ ...f, category: cat, subcategory: firstSub, sizes: getDefaultSizes(firstSub) }) : f)
  }

  function handleSubcategoryChange(sub: string) {
    setForm((f) => f ? ({ ...f, subcategory: sub, sizes: getDefaultSizes(sub), hatStyle: sub === 'hats' ? f.hatStyle : '' }) : f)
  }

  function handleSizesChange(val: string) {
    setForm((f) => f ? ({ ...f, sizes: val }) : f)
    const newList = val.split(',').map((s) => s.trim()).filter(Boolean)
    setSizeQtys((prev) => {
      const next: Record<string, string> = {}
      for (const s of newList) next[s] = prev[s] ?? ''
      return next
    })
  }

  function handleAddColor() {
    if (form && colorInput.trim() && !form.colors.includes(colorInput.trim())) {
      setForm(f => f ? { ...f, colors: [...f.colors, colorInput.trim()] } : f)
      setColorInput('')
    }
  }

  function handleRemoveColor(col: string) {
    setForm(f => f ? { ...f, colors: f.colors.filter(c => c !== col) } : f)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      if (images.length >= 3) { toast.error('Max 3 images allowed'); return }
      const newFiles = Array.from(e.target.files).slice(0, 3 - images.length)
      const newImages = newFiles.map(file => ({
        url: URL.createObjectURL(file),
        file
      }))
      setImages(prev => [...prev, ...newImages])
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!form || !product) return
    if (!form) return; if (!form) return; if (!form) return; if (!form) return; if (!form) return; if (!form.name.trim()) { toast.error('Name is required'); return }
    const priceNum = parseFloat(form.price)
    if (!Number.isFinite(priceNum) || priceNum <= 0) { toast.error('Enter a valid price'); return }
    let salePriceCents = 0
    if (form.salePrice.trim()) {
      const saleNum = parseFloat(form.salePrice)
      if (!Number.isFinite(saleNum) || saleNum <= 0) { toast.error('Enter a valid sale price'); return }
      if (saleNum >= priceNum) { toast.error('Sale price must be less than the regular price'); return }
      salePriceCents = Math.round(saleNum * 100)
    }
    if (!form.category) { toast.error('Category is required'); return }
    if (images.length === 0) { toast.error('At least one image is required'); return }

    setSaving(true)

    const priceCents = Math.round(priceNum * 100)
    const sizeInventories = needsSizes
      ? currentSizeList.map((size) => {
          const raw = sizeQtys[size]
          const qty = parseInt(raw, 10)
          return { size, quantity: Number.isFinite(qty) && qty >= 0 ? qty : parseInt(form.quantity, 10) || 1 }
        })
      : []

    const formData = new FormData()
    formData.append('name', form.name.trim())
    if (form.description) formData.append('description', form.description)
    formData.append('priceCents', priceCents.toString())
    formData.append('salePriceCents', salePriceCents.toString())
    formData.append('category', form.category)
    formData.append('subcategory', form.subcategory)
    formData.append('hatStyle', form.subcategory === 'hats' ? form.hatStyle : '')
    formData.append('brand', form.brand)
    formData.append('status', form.status)
    formData.append('isLicensed', String(form.isLicensed))
    formData.append('isChampion', String(form.isChampion))
    formData.append('isNewArrival', String(form.isNewArrival))
    formData.append('isClearance', String(form.isClearance))
    formData.append('isFeatured', String(form.isFeatured))
    formData.append('isSport', String(form.isSport))
    formData.append('isAuthenticated', String(form.isAuthenticated))
    formData.append('quantity', (parseInt(form.quantity, 10) || 1).toString())
    if (needsSizes) formData.append('sizes', form.sizes)
    formData.append('colors', JSON.stringify(form.colors.map(c => ({ name: c, hex: c }))))
    
    if (needsSizes && sizeInventories.length > 0) {
      formData.append('sizeInventories', JSON.stringify(sizeInventories))
    }

    images.forEach((img, idx) => {
      if (idx === 0) {
        if (img.file) formData.append('imageFile', img.file)
        else formData.append('imageUrl', img.url)
      } else {
        if (img.file) formData.append(`imageFile${idx + 1}`, img.file)
        else formData.append(`imageUrl${idx + 1}`, img.url)
      }
    })
    
    // Explicitly clear removed images
    if (images.length < 2) formData.append('imageUrl2', '')
    if (images.length < 3) formData.append('imageUrl3', '')

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        body: formData,
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Failed to update product')
        setSaving(false)
        return
      }
      const updated: Product = await res.json()
      toast.success('Product updated')
      onSaved(updated)
    } catch {
      toast.error('Network error')
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-jays-ice relative shrink-0">
              {images[0] && <Image src={images[0].url} alt={product.name} fill className="object-cover" unoptimized />}
            </div>
            <DialogTitle>Edit Product</DialogTitle>
          </div>
          <DialogClose className="rounded-lg p-1.5 text-jays-steel hover:bg-jays-ice transition-colors text-lg leading-none">
            ✕
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => f ? ({ ...f, name: e.target.value }) : f)} className={INPUT_CLS} />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => f ? ({ ...f, description: e.target.value }) : f)} rows={2} className={INPUT_CLS} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Price (CAD) *</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((f) => f ? ({ ...f, price: e.target.value }) : f)} placeholder="49.99" className={INPUT_CLS} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sale Price (CAD) <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm((f) => f ? ({ ...f, salePrice: e.target.value }) : f)} placeholder="e.g. 39.99" className={INPUT_CLS} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total Quantity</label>
            <input type="number" min="0" value={form.quantity} onChange={(e) => setForm((f) => f ? ({ ...f, quantity: e.target.value }) : f)} className={INPUT_CLS} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Main Category</label>
            <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)} className={INPUT_CLS}>
              {mainCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
            <select value={form.subcategory} onChange={(e) => handleSubcategoryChange(e.target.value)} className={INPUT_CLS}>
              {(subsByCat[form.category] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {form.subcategory === 'hats' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hat Style</label>
              <select value={form.hatStyle} onChange={(e) => setForm((f) => f ? ({ ...f, hatStyle: e.target.value }) : f)} className={INPUT_CLS}>
                <option value="">Select style…</option>
                {HAT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Brand / Designer</label>
            <input list="edit-brand-suggestions" value={form.brand} onChange={(e) => setForm((f) => f ? ({ ...f, brand: e.target.value }) : f)} placeholder="e.g. Nike, New Era…" className={INPUT_CLS} />
            <datalist id="edit-brand-suggestions">
              {POPULAR_BRANDS.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => f ? ({ ...f, status: e.target.value }) : f)} className={INPUT_CLS}>
              <option value="AVAILABLE">Available</option>
              <option value="ARCHIVED">Archived</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          <div className="sm:col-span-2 border-t border-border pt-4">
             <label className="block text-xs font-medium text-gray-600 mb-2">Product Images (up to 3)</label>
             <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={images.length >= 3} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal mb-3 disabled:opacity-50" />
             <div className="flex gap-4">
               {images.map((img, idx) => (
                 <div key={idx} className="relative w-32 h-32 rounded-xl overflow-hidden border border-border group">
                   <Image src={img.url} alt="Preview" fill className="object-cover" unoptimized />
                   <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                 </div>
               ))}
             </div>
          </div>

          <div className="sm:col-span-2 border-t border-border pt-4">
             <label className="block text-xs font-medium text-gray-600 mb-2">Colors</label>
             <div className="flex flex-wrap gap-2 mb-2">
               <ColorPickerModal selected={form.colors} onChange={(colors) => setForm((f) => f ? ({ ...f, colors }) : f)} />
               <input value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddColor())} placeholder="e.g. Red, Blue, #1E2761" className={INPUT_CLS} />
               <button type="button" onClick={handleAddColor} className="px-4 py-2 bg-jays-ice text-jays-navy font-semibold rounded-xl text-sm">Add</button>
             </div>
             <div className="flex flex-wrap gap-2">
               {form.colors.map((c: string) => (
                 <span key={c} className="px-3 py-1 bg-jays-ice text-jays-navy rounded-full text-xs font-medium flex items-center gap-2">
                   <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: colorToSwatch(c) }}></span>
                   {c}
                   <button type="button" onClick={() => handleRemoveColor(c)} className="text-jays-steel hover:text-red-500 font-bold">×</button>
                 </span>
               ))}
             </div>
          </div>

          {needsSizes && (
            <div className="sm:col-span-2 border-t border-border pt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sizes (comma-separated)</label>
              <input value={form.sizes} onChange={(e) => handleSizesChange(e.target.value)} placeholder="S,M,L,XL,2XL,3XL" className={INPUT_CLS} />
            </div>
          )}

          {needsSizes && currentSizeList.length > 0 && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Qty per size</label>
              <div className="flex flex-wrap gap-2">
                {currentSizeList.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-jays-navy uppercase">{size}</span>
                    <input type="number" min="0" value={sizeQtys[size] ?? ''} onChange={(e) => setSizeQtys((prev) => ({ ...prev, [size]: e.target.value }))} placeholder={form.quantity || '1'} className="w-16 border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-jays-navy/40" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-jays-steel/70 mb-2">Storefront Collections</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => f ? ({ ...f, isFeatured: e.target.checked }) : f)} className="w-4 h-4 rounded border-gray-300 accent-jays-navy" />
                <span className="font-medium text-jays-navy">Featured Products</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm((f) => f ? ({ ...f, isNewArrival: e.target.checked }) : f)} className="w-4 h-4 rounded border-gray-300 accent-cyan-600" />
                <span className="font-medium text-jays-navy">New Arrivals</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.isClearance} onChange={(e) => setForm((f) => f ? ({ ...f, isClearance: e.target.checked }) : f)} className="w-4 h-4 rounded border-gray-300 accent-jays-red" />
                <span className="font-medium text-jays-navy">Sales & Clearance</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.isAuthenticated} onChange={(e) => setForm((f) => f ? ({ ...f, isAuthenticated: e.target.checked }) : f)} className="w-4 h-4 rounded border-gray-300 accent-emerald-600" />
                <span className="font-medium text-jays-navy">Authentic Collection</span>
              </label>
            </div>
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isSport} onChange={(e) => setForm((f) => f ? ({ ...f, isSport: e.target.checked }) : f)} className="w-4 h-4 rounded border-gray-300 accent-jays-navy" />
              <span className="font-medium text-jays-navy">Sport Collection</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isLicensed} onChange={(e) => setForm((f) => f ? ({ ...f, isLicensed: e.target.checked }) : f)} className="w-4 h-4 rounded border-gray-300 accent-jays-navy" />
              <span className="font-medium text-jays-navy">Official Licensed</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isChampion} onChange={(e) => setForm((f) => f ? ({ ...f, isChampion: e.target.checked }) : f)} className="w-4 h-4 rounded border-gray-300 accent-yellow-500" />
              <span className="font-medium text-jays-navy">ALC Champion 2025</span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-jays-steel border-t border-border pt-4">
          <span>Current status:</span>
          <StatusBadge status={product.status} />
          <span className="ml-2">Held: {product.heldQuantity}</span>
          <span className="ml-2">Remaining: {product.remaining}</span>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors">
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
