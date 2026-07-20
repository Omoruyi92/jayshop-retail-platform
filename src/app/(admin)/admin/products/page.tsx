'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { formatCAD, cn } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import LicensedBadge from '@/components/ui/LicensedBadge'
import ChampionBadge from '@/components/ui/ChampionBadge'
import { SIZELESS_SUBS, getDefaultSizes, POPULAR_BRANDS, colorToSwatch, HAT_STYLES, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_IMAGE_SIZE_MB, categoryHasAudience, categoryHasAgeGroup, AUDIENCES, KIDS_AGE_GROUPS, PRODUCT_TYPES } from '@/lib/constants'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import EditProductModal from '@/components/admin/EditProductModal'
import ColorPickerModal from '@/components/admin/ColorPickerModal'
import ProductLocationsModal from '@/components/admin/ProductLocationsModal'
import { useInventoryStream } from '@/hooks/useInventoryStream'
import { useCurrentAdmin } from '@/hooks/useCurrentAdmin'
import type { ProductAvailability } from '@/lib/inventory/aggregate'

interface Product {
  id: string
  name: string
  slug: string
  description?: string | null
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
  pickedQuantity: number
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
  isBlankJersey: boolean
  colors: any
  sku?: string | null
  material?: string
  careInstructions?: string
  _count?: { holds: number; likes?: number }
  availability?: ProductAvailability
}

const LOW_STOCK_THRESHOLD = 10

/**
 * Returns the centralized availability-driven stock badge status:
 * in-stock (green), low-stock (yellow), out-of-stock (red).
 */
function getStockBadgeStatus(p: Product): { status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'; label: string } {
  if (p.availability) {
    // Use the worst-case per size/location status so a size that's genuinely
    // low/out at a specific location is flagged even if the product's total
    // stock across all locations still looks healthy.
    switch (p.availability.worstStatus ?? p.availability.status) {
      case 'low-stock':
        return { status: 'LOW_STOCK', label: 'Low Stock' }
      case 'out-of-stock':
        return { status: 'OUT_OF_STOCK', label: 'Out of Stock' }
      case 'in-stock':
      default:
        return { status: 'IN_STOCK', label: 'In Stock' }
    }
  }
  // Fallback if availability is missing (shouldn't happen with updated API)
  if (p.remaining <= 0) return { status: 'OUT_OF_STOCK', label: 'Out of Stock' }
  if (p.remaining <= LOW_STOCK_THRESHOLD) return { status: 'LOW_STOCK', label: 'Low Stock' }
  return { status: 'IN_STOCK', label: 'In Stock' }
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

/**
 * Product.status is the authoritative AVAILABLE/SOLD signal computed from
 * live inventory (quantity - held - picked, see computeProductStatus). But
 * "no stock left" can mean either "everything is currently on hold" (not
 * yet sold, reversible) or "actually sold/picked up" — those are very
 * different states for an admin. Refine the raw status using heldQuantity
 * so the badge accurately reflects Held vs Sold in real time.
 */
function getDisplayStatus(p: Product): string {
  if (p.status !== 'AVAILABLE' && p.status !== 'SOLD') return p.status
  if (p.status === 'SOLD' && p.heldQuantity > 0) return 'ON_HOLD'
  return p.status
}

/**
 * Builds the label shown inside the STATUS badge. When units are currently
 * held or already sold (picked up / POS-sold), surface the live quantity
 * (e.g. "1 Held", "3 Sold") instead of a static word, so admins can see the
 * real-time inventory breakdown at a glance without opening the product.
 */
function getStatusLabel(p: Product, displayStatus: string): string | undefined {
  if (displayStatus === 'ON_HOLD' && p.heldQuantity > 0) return `${p.heldQuantity} Held`
  if (displayStatus === 'SOLD' && p.pickedQuantity > 0) return `${p.pickedQuantity} Sold`
  return undefined
}

export default function AdminProductsPage() {
  const { isOwner, isManager, isStaff } = useCurrentAdmin()
  const { mainCategories, subsByCat, labelsBySlug, productTypesBySlug, brandsBySlug } = useCategoryTree()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', priceCents: '', salePrice: '', quantity: '1',
    sizes: 'S,M,L,XL,2XL,3XL', category: 'men', subcategory: 'jerseys', imageUrl: '', brand: '',
    isLicensed: false, isChampion: false, isNewArrival: false, isClearance: false,
    isFeatured: false, isSport: false, isBlankJersey: false, colors: [] as string[], hatStyle: '',
    sku: '', material: '', careInstructions: '', audience: '', ageGroup: '', productType: 'Jerseys'
  })
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, string>>({})
  const [images, setImages] = useState<{url: string; file: File | null}[]>([])
  const [colorInput, setColorInput] = useState('')
  const [saving, setSaving]           = useState(false)

  const [showArchived, setShowArchived] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [locationsProduct, setLocationsProduct] = useState<Product | null>(null)

  const [search, setSearch]           = useState('')
  const [catFilter, setCatFilter]     = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesQ = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory ?? '').toLowerCase().includes(q)
      const matchesCat   = catFilter   === 'all' || p.category === catFilter
      const matchesBrand = brandFilter === 'all' || p.brand    === brandFilter
      return matchesQ && matchesCat && matchesBrand
    })
  }, [products, search, catFilter, brandFilter])

  const uniqueBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  )

  const load = useCallback(() => {
    const url = showArchived ? '/api/products?includeArchived=true' : '/api/products'
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setProducts(d.products ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [showArchived])

  useEffect(() => { load() }, [load])

  // Keep the product list (and its Held/Sold badges + remaining counts) in
  // sync with the single source of truth in real time — reload whenever any
  // inventory or hold mutation happens anywhere in the app (POS sale, hold
  // create/resolve/release, restock, etc.) instead of only on manual refresh.
  useInventoryStream({}, { onInventoryChanged: () => load(), onHoldChanged: () => load() })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      if (images.length >= 3) { toast.error('Max 3 images allowed'); return }
      const candidates = Array.from(e.target.files)
      const accepted: File[] = []
      for (const file of candidates) {
        if (accepted.length + images.length >= 3) break
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
      if (accepted.length === 0) { e.target.value = ''; return }
      const newImages = accepted.map(file => ({
        url: URL.createObjectURL(file),
        file
      }))
      setImages(prev => [...prev, ...newImages])
      e.target.value = ''
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  function handleAddColor() {
    if (colorInput.trim() && !form.colors.includes(colorInput.trim())) {
      setForm(f => ({ ...f, colors: [...f.colors, colorInput.trim()] }))
      setColorInput('')
    }
  }

  function handleRemoveColor(col: string) {
    setForm(f => ({ ...f, colors: f.colors.filter(c => c !== col) }))
  }

  const currentProductTypes = useMemo(
    () => productTypesBySlug[form.category.toLowerCase()] ?? productTypesBySlug.men ?? [],
    [form.category, productTypesBySlug]
  )
  const showAudience = categoryHasAudience(form.category)
  const showAgeGroup = categoryHasAgeGroup(form.category)
  const isHatProduct = form.productType === 'Hats' || form.productType === 'Caps'

  const needsSizes = !SIZELESS_SUBS.has(form.subcategory)

  const currentSizeList = needsSizes
    ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  useEffect(() => {
    setForm(f => ({
      ...f,
      productType: currentProductTypes[0] ?? 'Jerseys',
      subcategory: currentProductTypes[0] ? currentProductTypes[0].toLowerCase() : f.subcategory,
      audience: showAudience ? (f.audience || 'Men') : '',
      ageGroup: showAgeGroup ? (f.ageGroup || 'Infant') : '',
    }))
  }, [form.category, currentProductTypes, showAudience, showAgeGroup])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (images.length === 0) { toast.error('At least one image is required'); return }
    const priceNum = parseFloat(form.priceCents)
    let salePriceCents = 0
    if (form.salePrice.trim()) {
      const saleNum = parseFloat(form.salePrice)
      if (!Number.isFinite(saleNum) || saleNum <= 0) { toast.error('Enter a valid sale price'); return }
      if (saleNum >= priceNum) { toast.error('Sale price must be less than the regular price'); return }
      salePriceCents = Math.round(saleNum * 100)
    }
    setSaving(true)
    const body = new FormData()
    body.append('name',        form.name)
    body.append('description', form.description)
    body.append('priceCents',  String(Math.round(priceNum * 100)))
    body.append('salePriceCents', String(salePriceCents))
    body.append('quantity',    form.quantity || '1')
    body.append('sizes',       needsSizes ? form.sizes : '')
    body.append('category',    form.category)
    body.append('subcategory', form.subcategory)
    body.append('productType', form.productType)
    body.append('audience',    form.audience)
    body.append('ageGroup',    form.ageGroup)
    body.append('hatStyle',    isHatProduct ? form.hatStyle : '')
    body.append('brand',       form.brand)
    body.append('imageUrl',    form.imageUrl)
    images.forEach((img, idx) => {
      if (!img.file) return
      body.append(idx === 0 ? 'imageFile' : `imageFile${idx + 1}`, img.file)
    })
    body.append('isLicensed',  String(form.isLicensed))
    body.append('isChampion',  String(form.isChampion))
    body.append('isNewArrival', String(form.isNewArrival))
    body.append('isClearance',  String(form.isClearance))
    body.append('isFeatured',   String(form.isFeatured))
    body.append('isSport',      String(form.isSport))
    body.append('isBlankJersey', String(form.isBlankJersey))
    body.append('colors',       JSON.stringify(form.colors))
    body.append('sku',          form.sku.trim())
    body.append('material',     form.material.trim())
    body.append('careInstructions', form.careInstructions.trim())
    

    if (needsSizes && currentSizeList.length > 0) {
      const sqMap: Record<string, number> = {}
      const totalQty = parseInt(form.quantity || '1', 10)
      const baseQty = Math.floor(totalQty / currentSizeList.length)
      const remainder = totalQty - baseQty * currentSizeList.length
      for (let i = 0; i < currentSizeList.length; i++) {
        sqMap[currentSizeList[i]] = baseQty + (i < remainder ? 1 : 0)
      }
      body.append('sizeQuantities', JSON.stringify(sqMap))
    }

    const res = await fetch('/api/admin/products', { method: 'POST', body })
    setSaving(false)
    if (res.ok) {
      toast.success('Product added')
      setForm({ name: '', description: '', priceCents: '', salePrice: '', quantity: '1', sizes: getDefaultSizes('jerseys'), category: 'men', subcategory: 'jerseys', imageUrl: '', brand: '', isLicensed: false, isChampion: false, isNewArrival: false, isClearance: false, isFeatured: false, isSport: false, isBlankJersey: false, colors: [], hatStyle: '', sku: '', material: '', careInstructions: '', audience: '', ageGroup: '', productType: 'Jerseys' })
      setSizeQuantities({})
      setImages([]); setColorInput(""); setShowAdd(false)
      load()
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed to add product')
    }
  }

  async function handleArchive(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ARCHIVED' }),
    })
    if (res.ok) { toast.success('Archived'); load() } else toast.error('Failed')
  }

  async function handleUnarchive(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'AVAILABLE' }),
    })
    if (res.ok) { toast.success('Unarchived'); load() } else toast.error('Failed')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product permanently?')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); load() } else toast.error('Failed to delete')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Products</h1>
        {(isOwner || isManager) && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            + Add Product
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-border p-5 mb-6 space-y-4 animate-fade-in-up">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">New Product</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (CAD) *</label>
              <input required type="number" step="0.01" min="0" value={form.priceCents} onChange={(e) => setForm(f => ({ ...f, priceCents: e.target.value }))} placeholder="149.99" className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sale Price (CAD) <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm(f => ({ ...f, salePrice: e.target.value }))} placeholder="e.g. 119.99" className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
              <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="1" className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Main Category</label>
              <select value={form.category} onChange={(e) => { const cat = e.target.value; setForm(f => ({ ...f, category: cat })) }} className={INPUT_CLS}>
                {mainCategories.map(c => <option key={c} value={c}>{labelsBySlug[c] ?? c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Type</label>
              <select value={form.productType} onChange={(e) => { const pt = e.target.value; setForm(f => ({ ...f, productType: pt, subcategory: pt.toLowerCase(), sizes: getDefaultSizes(pt.toLowerCase()) })) }} className={INPUT_CLS}>
                {currentProductTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {showAudience && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Audience</label>
                <select value={form.audience} onChange={(e) => setForm(f => ({ ...f, audience: e.target.value }))} className={INPUT_CLS}>
                  {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
            {showAgeGroup && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Age Group</label>
                <select value={form.ageGroup} onChange={(e) => setForm(f => ({ ...f, ageGroup: e.target.value, sizes: getDefaultSizes(e.target.value) }))} className={INPUT_CLS}>
                  {KIDS_AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}
            {isHatProduct && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hat Style</label>
                <select value={form.hatStyle} onChange={(e) => setForm(f => ({ ...f, hatStyle: e.target.value }))} className={INPUT_CLS}>
                  <option value="">Select style…</option>
                  {HAT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Brand / Designer</label>
              <input
                list="brand-suggestions"
                value={form.brand}
                onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
                placeholder="e.g. Nike, New Era…"
                className={INPUT_CLS}
              />
              <datalist id="brand-suggestions">
                {Array.from(new Set([...(brandsBySlug[form.category.toLowerCase()] ?? []), ...POPULAR_BRANDS])).map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
            {needsSizes && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Sizes (comma-separated)</label>
                <input value={form.sizes} onChange={(e) => setForm(f => ({ ...f, sizes: e.target.value }))} placeholder="S,M,L,XL,2XL,3XL" className={INPUT_CLS} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SKU <span className="text-gray-400 font-normal">(optional)</span></label>
              <input value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. JS-JERSEY-001" className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Material</label>
              <input value={form.material} onChange={(e) => setForm(f => ({ ...f, material: e.target.value }))} placeholder="e.g. 100% Polyester" className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Care Instructions</label>
              <textarea value={form.careInstructions} onChange={(e) => setForm(f => ({ ...f, careInstructions: e.target.value }))} rows={2} placeholder="Machine wash cold, tumble dry low..." className={INPUT_CLS} />
            </div>
            {needsSizes && currentSizeList.length > 0 && (
              <div className="sm:col-span-2 bg-jays-ice/30 rounded-xl p-3 border border-jays-ice">
                <p className="text-xs font-medium text-jays-steel mb-2">
                  Main Store auto-allocation preview <span className="text-[10px] font-normal">(edit quantities in Locations after creation)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentSizeList.map((size) => {
                    const totalQty = parseInt(form.quantity || '1', 10)
                    const baseQty = Math.floor(totalQty / currentSizeList.length)
                    const remainder = totalQty - baseQty * currentSizeList.length
                    const index = currentSizeList.indexOf(size)
                    return (
                      <div key={size} className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-jays-navy uppercase">{size}</span>
                        <input
                          type="number"
                          min="0"
                          value={baseQty + (index < remainder ? 1 : 0)}
                          disabled
                          placeholder={String(baseQty + (index < remainder ? 1 : 0))}
                          className="w-16 border border-border rounded-lg px-2 py-1.5 text-sm text-center bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-jays-steel mt-2">
                  Auto-allocated total: {form.quantity || '1'} units
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL (optional)</label>
              <input value={form.imageUrl} onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://images.unsplash.com/..." className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={INPUT_CLS} />
            </div>
            <div className="sm:col-span-2 border-t border-border pt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Product Images (up to 3)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleFileChange} disabled={images.length >= 3} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal mb-3 disabled:opacity-50" />
              <p className="text-[10px] text-jays-steel mb-2">JPG, PNG, WebP, or AVIF. Max {MAX_IMAGE_SIZE_MB}MB each. At least one image required.</p>
              <div className="flex gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-32 h-32 rounded-xl overflow-hidden border border-border group">
                    <Image src={img.url} alt="Preview" fill className="object-cover" unoptimized />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-border pt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Colors</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <ColorPickerModal selected={form.colors} onChange={(colors) => setForm(f => ({ ...f, colors }))} />
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
          </div>
          <div className="pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-jays-steel/70 mb-2">Storefront Collections</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 accent-jays-navy" />
                <span className="font-medium text-jays-navy">Featured Products</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(e) => setForm(f => ({ ...f, isNewArrival: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 accent-cyan-600"
                />
                <span className="font-medium text-jays-navy">New Arrivals</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isClearance}
                  onChange={(e) => setForm(f => ({ ...f, isClearance: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 accent-jays-red"
                />
                <span className="font-medium text-jays-navy">Sales &amp; Clearance</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isBlankJersey}
                  onChange={(e) => setForm(f => ({ ...f, isBlankJersey: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 accent-emerald-600"
                />
                <span className="font-medium text-jays-navy">Blanks</span>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isSport} onChange={(e) => setForm(f => ({ ...f, isSport: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 accent-jays-navy" />
              <span className="font-medium text-jays-navy">Sport Collection</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isLicensed}
                onChange={(e) => setForm(f => ({ ...f, isLicensed: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 accent-jays-navy"
              />
              <span className="font-medium text-jays-navy">Official Licensed Product</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isChampion}
                onChange={(e) => setForm(f => ({ ...f, isChampion: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 accent-yellow-500"
              />
              <span className="font-medium text-jays-navy">ALC Champion 2025</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Product'}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name, brand, category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLS} max-w-xs`}
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className={`${INPUT_CLS} w-40`}
        >
          <option value="all">All categories</option>
          {mainCategories.map((c) => (
            <option key={c} value={c}>{labelsBySlug[c] ?? c}</option>
          ))}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className={`${INPUT_CLS} w-40`}
        >
          <option value="all">All brands</option>
          {uniqueBrands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {(search || catFilter !== 'all' || brandFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setCatFilter('all'); setBrandFilter('all') }}
            className="px-3 py-2 rounded-xl text-xs border border-border hover:bg-jays-ice transition-colors text-jays-steel"
          >
            Clear filters
          </button>
        )}
      </div>

      <TableWrapper>
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-jays-steel cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => { setShowArchived(e.target.checked); setLoading(true) }}
              className="w-4 h-4 rounded border-gray-300 accent-jays-navy"
            />
            Show archived
          </label>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-3 py-2 w-12"></th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Product</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase hidden md:table-cell">Brand</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Category</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Price</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Inventory</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Likes</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Status</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={9}><EmptyState
                title={products.length === 0 ? "No products yet" : "No results"}
                body={products.length === 0 ? "Click + Add Product to create your first item." : "Try adjusting your search or filters."}
              /></td></tr>
            ) : filteredProducts.map((p) => {
              const remaining = p.remaining
              const isArchived = p.status === 'ARCHIVED'
              return (
                <tr key={p.id} className={`hover:bg-jays-ice/50 transition-colors ${isArchived ? 'opacity-50 bg-gray-50' : remaining <= 0 ? 'opacity-50' : ''}`}>
                  {/* Image */}
                  <td className="px-3 py-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-jays-ice relative">
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                    </div>
                  </td>
                  {/* Product: name + sku + branding badges */}
                  <td className="px-3 py-2">
                    <div className="font-medium leading-tight">{p.name}</div>
                    {p.sku && <div className="text-[10px] text-jays-steel mt-0.5">SKU: {p.sku}</div>}
                    {(p.isLicensed || p.isChampion) && (
                      <div className="flex gap-1 mt-0.5">
                        {p.isLicensed && <LicensedBadge variant="card" />}
                        {p.isChampion && <ChampionBadge variant="card" />}
                      </div>
                    )}
                  </td>
                  {/* Brand */}
                  <td className="px-3 py-2 text-jays-steel text-xs hidden md:table-cell">{p.brand || '—'}</td>
                  {/* Category › Subcategory */}
                  <td className="px-3 py-2 text-jays-steel text-xs capitalize whitespace-nowrap">
                    {p.category}{p.subcategory ? <> › {p.subcategory}</> : null}{p.hatStyle ? <> › {p.hatStyle}</> : null}
                  </td>
                  {/* Price */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    {p.salePriceCents > 0 && p.salePriceCents < p.priceCents ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-jays-red font-bold">{formatCAD(p.salePriceCents)}</span>
                        <span className="text-jays-steel text-xs line-through">{formatCAD(p.priceCents)}</span>
                      </div>
                    ) : (
                      <span className="text-jays-red font-bold">{formatCAD(p.priceCents)}</span>
                    )}
                  </td>
                  {/* Inventory: remaining / held */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`font-semibold ${remaining <= 0 ? 'text-red-600' : 'text-green-600'}`}>{remaining} rem</span>
                    <span className="text-jays-steel text-xs ml-1">/ {p.heldQuantity} held</span>
                  </td>
                  {/* Likes */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-jays-steel">
                      <Heart className="w-3.5 h-3.5 text-jays-red fill-jays-red/10" />
                      <span className="font-semibold text-jays-navy">{p._count?.likes ?? 0}</span>
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-3 py-2 align-top">
                    {(() => {
                      const stock = getStockBadgeStatus(p)
                      const isInStock = stock.status === 'IN_STOCK'
                      const alertDetails = [
                        ...(p.availability?.outOfStockDetails ?? []),
                        ...(p.availability?.lowStockDetails ?? []),
                      ]
                      return (
                        <div className="space-y-1">
                          <StatusBadge status={stock.status} label={stock.label} />
                          {!isInStock && alertDetails.length > 0 && (
                            <p className="text-[10px] text-jays-steel leading-tight">
                              {alertDetails.map((d, i) => (
                                <span key={i}>
                                  {i > 0 && ', '}
                                  {d.locationName} · {d.size === 'ONE_SIZE' ? 'Qty' : d.size}: {d.available}
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {(isOwner || isManager) && (
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="px-2 py-1 bg-jays-navy/10 text-jays-navy text-xs rounded-lg hover:bg-jays-navy/20 transition-colors whitespace-nowrap"
                        >
                          Edit
                        </button>
                      )}
                      {(isStaff || isManager || isOwner) && (
                        <button
                          onClick={() => setLocationsProduct(p)}
                          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                        >
                          Inventory
                        </button>
                      )}
                      {(isOwner || isManager) && (
                        <>
                          {isArchived ? (
                            remaining > 0 ? (
                              <button onClick={() => handleUnarchive(p.id)} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap">Unarchive</button>
                            ) : (
                              <span className="px-2 py-1 text-gray-400 text-xs whitespace-nowrap">No stock</span>
                            )
                          ) : (
                            <>
                              <button onClick={() => handleArchive(p.id)} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">Archive</button>
                              <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap">Delete</button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrapper>

      <EditProductModal
        key={editingProduct?.id ?? 'none'}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSaved={(updated) => {
          setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p))
          setEditingProduct(null)
        }}
      />

      <ProductLocationsModal
        key={locationsProduct?.id ?? 'none'}
        productId={locationsProduct?.id ?? null}
        productName={locationsProduct?.name ?? ''}
        sizes={locationsProduct?.sizes ?? ''}
        onClose={() => setLocationsProduct(null)}
        onSaved={() => load()}
      />
    </div>
  )
}
