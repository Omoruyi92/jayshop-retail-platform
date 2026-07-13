'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/Dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MAIN_CATEGORIES, SUBS_BY_CAT, SIZELESS_SUBS, getDefaultSizes, POPULAR_BRANDS } from '@/lib/constants'

interface Product {
  id: string
  name: string
  slug: string
  priceCents: number
  imageUrl: string
  category: string
  subcategory: string
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
    quantity:    String(product.quantity),
    sizes:       product.sizes,
    category:    product.category,
    subcategory: product.subcategory,
    brand:       product.brand,
    status:      product.status,
    isLicensed:  product.isLicensed,
    isChampion:  product.isChampion,
    isNewArrival: product.isNewArrival,
    isClearance:  product.isClearance,
    imageUrl:    product.imageUrl,
  }
}

function buildInitialSizeQtys(product: Product): Record<string, string> {
  // Start with empty; user can populate. Real qty-per-size requires a separate fetch.
  const sizes = product.sizes.split(',').map((s) => s.trim()).filter(Boolean)
  const result: Record<string, string> = {}
  for (const s of sizes) result[s] = ''
  return result
}

export default function EditProductModal({ product, onClose, onSaved }: EditProductModalProps) {
  const [form, setForm] = useState(() => product ? buildInitialForm(product) : null)
  const [sizeQtys, setSizeQtys] = useState<Record<string, string>>(() =>
    product ? buildInitialSizeQtys(product) : {}
  )
  const [saving, setSaving] = useState(false)

  if (!product || !form) return null

  const needsSizes = !SIZELESS_SUBS.has(form.subcategory)
  const currentSizeList = needsSizes
    ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  function handleCategoryChange(cat: string) {
    const firstSub = SUBS_BY_CAT[cat]?.[0] ?? ''
    setForm((f) => f ? ({ ...f, category: cat, subcategory: firstSub, sizes: getDefaultSizes(firstSub) }) : f)
  }

  function handleSubcategoryChange(sub: string) {
    setForm((f) => f ? ({ ...f, subcategory: sub, sizes: getDefaultSizes(sub) }) : f)
  }

  function handleSizesChange(val: string) {
    setForm((f) => f ? ({ ...f, sizes: val }) : f)
    // Sync sizeQtys: keep existing values, add empty for new sizes
    const newList = val.split(',').map((s) => s.trim()).filter(Boolean)
    setSizeQtys((prev) => {
      const next: Record<string, string> = {}
      for (const s of newList) next[s] = prev[s] ?? ''
      return next
    })
  }

  async function handleSave() {
    if (!form || !product) return
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const priceNum = parseFloat(form.price)
    if (!Number.isFinite(priceNum) || priceNum <= 0) { toast.error('Enter a valid price'); return }
    if (!form.category) { toast.error('Category is required'); return }

    setSaving(true)

    const priceCents = Math.round(priceNum * 100)
    const sizeInventories = needsSizes
      ? currentSizeList.map((size) => {
          const raw = sizeQtys[size]
          const qty = parseInt(raw, 10)
          return { size, quantity: Number.isFinite(qty) && qty >= 0 ? qty : parseInt(form.quantity, 10) || 1 }
        })
      : []

    const body: Record<string, unknown> = {
      name:        form.name.trim(),
      description: form.description,
      priceCents,
      category:    form.category,
      subcategory: form.subcategory,
      brand:       form.brand,
      status:      form.status,
      isLicensed:  form.isLicensed,
      isChampion:  form.isChampion,
      isNewArrival: form.isNewArrival,
      isClearance:  form.isClearance,
      quantity:    parseInt(form.quantity, 10) || 1,
      sizes:       needsSizes ? form.sizes : '',
    }
    if (needsSizes && sizeInventories.length > 0) {
      body.sizeInventories = sizeInventories
    }

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-jays-ice relative shrink-0">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
            </div>
            <DialogTitle>Edit Product</DialogTitle>
          </div>
          <DialogClose className="rounded-lg p-1.5 text-jays-steel hover:bg-jays-ice transition-colors text-lg leading-none">
            ✕
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => f ? ({ ...f, name: e.target.value }) : f)}
              className={INPUT_CLS}
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => f ? ({ ...f, description: e.target.value }) : f)}
              rows={2}
              className={INPUT_CLS}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Price (CAD) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => f ? ({ ...f, price: e.target.value }) : f)}
              placeholder="49.99"
              className={INPUT_CLS}
            />
          </div>

          {/* Total Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total Quantity</label>
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm((f) => f ? ({ ...f, quantity: e.target.value }) : f)}
              className={INPUT_CLS}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Main Category</label>
            <select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={INPUT_CLS}
            >
              {MAIN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
            <select
              value={form.subcategory}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              className={INPUT_CLS}
            >
              {(SUBS_BY_CAT[form.category] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Brand / Designer</label>
            <input
              list="edit-brand-suggestions"
              value={form.brand}
              onChange={(e) => setForm((f) => f ? ({ ...f, brand: e.target.value }) : f)}
              placeholder="e.g. Nike, New Era…"
              className={INPUT_CLS}
            />
            <datalist id="edit-brand-suggestions">
              {POPULAR_BRANDS.map((b) => <option key={b} value={b} />)}
            </datalist>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => f ? ({ ...f, status: e.target.value }) : f)}
              className={INPUT_CLS}
            >
              <option value="AVAILABLE">Available</option>
              <option value="ARCHIVED">Archived</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          {/* Image URL */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => f ? ({ ...f, imageUrl: e.target.value }) : f)}
              placeholder="https://…"
              className={INPUT_CLS}
            />
          </div>

          {/* Sizes string */}
          {needsSizes && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sizes (comma-separated)</label>
              <input
                value={form.sizes}
                onChange={(e) => handleSizesChange(e.target.value)}
                placeholder="S,M,L,XL,2XL,3XL"
                className={INPUT_CLS}
              />
            </div>
          )}

          {/* Per-size quantities */}
          {needsSizes && currentSizeList.length > 0 && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Qty per size
                <span className="ml-1 text-gray-400 font-normal">(leave blank to use total qty)</span>
              </label>
              <p className="text-xs text-amber-600 mb-2">Removing a size may affect active holds.</p>
              <div className="flex flex-wrap gap-2">
                {currentSizeList.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-jays-navy uppercase">{size}</span>
                    <input
                      type="number"
                      min="0"
                      value={sizeQtys[size] ?? ''}
                      onChange={(e) => setSizeQtys((prev) => ({ ...prev, [size]: e.target.value }))}
                      placeholder={form.quantity || '1'}
                      className="w-16 border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags */}
          <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isLicensed}
                onChange={(e) => setForm((f) => f ? ({ ...f, isLicensed: e.target.checked }) : f)}
                className="w-4 h-4 rounded border-gray-300 accent-jays-navy"
              />
              <span className="font-medium text-jays-navy">Official Licensed Product</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isChampion}
                onChange={(e) => setForm((f) => f ? ({ ...f, isChampion: e.target.checked }) : f)}
                className="w-4 h-4 rounded border-gray-300 accent-yellow-500"
              />
              <span className="font-medium text-jays-navy">ALC Champion 2025</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm((f) => f ? ({ ...f, isNewArrival: e.target.checked }) : f)}
                className="w-4 h-4 rounded border-gray-300 accent-cyan-600"
              />
              <span className="font-medium text-jays-navy">New Arrival</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isClearance}
                onChange={(e) => setForm((f) => f ? ({ ...f, isClearance: e.target.checked }) : f)}
                className="w-4 h-4 rounded border-gray-300 accent-jays-red"
              />
              <span className="font-medium text-jays-navy">Sales &amp; Clearance</span>
            </label>
          </div>
        </div>

        {/* Current status preview */}
        <div className="mt-4 flex items-center gap-2 text-xs text-jays-steel border-t border-border pt-4">
          <span>Current status:</span>
          <StatusBadge status={product.status} />
          <span className="ml-2">Held: {product.heldQuantity}</span>
          <span className="ml-2">Remaining: {product.remaining}</span>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
