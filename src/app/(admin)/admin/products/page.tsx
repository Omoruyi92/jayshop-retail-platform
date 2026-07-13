'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { formatCAD } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import LicensedBadge from '@/components/ui/LicensedBadge'
import ChampionBadge from '@/components/ui/ChampionBadge'
import { MAIN_CATEGORIES, SUBS_BY_CAT, SIZELESS_SUBS, getDefaultSizes, POPULAR_BRANDS } from '@/lib/constants'
import EditProductModal from '@/components/admin/EditProductModal'
import ProductLocationsModal from '@/components/admin/ProductLocationsModal'
import RestockModal from '@/components/admin/RestockModal'

interface Product {
  id: string
  name: string
  slug: string
  priceCents: number
  imageUrl: string
  imageUrl2: string
  imageUrl3: string
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
  isFeatured: boolean
  isSport: boolean
  colors: any
  _count?: { holds: number }
}

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', priceCents: '', quantity: '1',
    sizes: 'S,M,L,XL,2XL,3XL', category: 'men', subcategory: 'jerseys', imageUrl: '', brand: '',
    isLicensed: false, isChampion: false, isNewArrival: false, isClearance: false,
    isFeatured: false, isSport: false, colors: [] as string[]
  })
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, string>>({})
  const [images, setImages] = useState<{url: string; file: File | null}[]>([])
  const [colorInput, setColorInput] = useState('')
  const [saving, setSaving]           = useState(false)

  const [showArchived, setShowArchived] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [locationsProduct, setLocationsProduct] = useState<Product | null>(null)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)

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

  function handleAddColor() {
    if (colorInput.trim() && !form.colors.includes(colorInput.trim())) {
      setForm(f => ({ ...f, colors: [...f.colors, colorInput.trim()] }))
      setColorInput('')
    }
  }

  function handleRemoveColor(col: string) {
    setForm(f => ({ ...f, colors: f.colors.filter(c => c !== col) }))
  }

  const needsSizes = !SIZELESS_SUBS.has(form.subcategory)

  const currentSizeList = needsSizes
    ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const body = new FormData()
    body.append('name',        form.name)
    body.append('description', form.description)
    body.append('priceCents',  String(Math.round(parseFloat(form.priceCents) * 100)))
    body.append('quantity',    form.quantity || '1')
    body.append('sizes',       needsSizes ? form.sizes : '')
    body.append('category',    form.category)
    body.append('subcategory', form.subcategory)
    body.append('brand',       form.brand)
    body.append('imageUrl',    form.imageUrl)
    body.append('isLicensed',  String(form.isLicensed))
    body.append('isChampion',  String(form.isChampion))
    body.append('isNewArrival', String(form.isNewArrival))
    body.append('isClearance',  String(form.isClearance))
    

    if (needsSizes && currentSizeList.length > 0) {
      const sqMap: Record<string, number> = {}
      for (const size of currentSizeList) {
        const val = parseInt(sizeQuantities[size] ?? '', 10)
        sqMap[size] = Number.isFinite(val) && val >= 0 ? val : parseInt(form.quantity || '1', 10)
      }
      body.append('sizeQuantities', JSON.stringify(sqMap))
    }

    const res = await fetch('/api/admin/products', { method: 'POST', body })
    setSaving(false)
    if (res.ok) {
      toast.success('Product added')
      setForm({ name: '', description: '', priceCents: '', quantity: '1', sizes: getDefaultSizes('jerseys'), category: 'men', subcategory: 'jerseys', imageUrl: '', brand: '', isLicensed: false, isChampion: false, isNewArrival: false, isClearance: false, isFeatured: false, isSport: false, colors: [] })
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
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Product
        </button>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
              <input required type="number" min="0" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="1" className={INPUT_CLS} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Main Category</label>
              <select value={form.category} onChange={(e) => { const cat = e.target.value; const firstSub = SUBS_BY_CAT[cat]?.[0] ?? ''; setForm(f => ({ ...f, category: cat, subcategory: firstSub, sizes: getDefaultSizes(firstSub) })) }} className={INPUT_CLS}>
                {MAIN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
              <select value={form.subcategory} onChange={(e) => setForm(f => ({ ...f, subcategory: e.target.value, sizes: getDefaultSizes(e.target.value) }))} className={INPUT_CLS}>
                {(SUBS_BY_CAT[form.category] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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
                {POPULAR_BRANDS.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
            {needsSizes && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Sizes (comma-separated)</label>
                <input value={form.sizes} onChange={(e) => setForm(f => ({ ...f, sizes: e.target.value }))} placeholder="S,M,L,XL,2XL,3XL" className={INPUT_CLS} />
              </div>
            )}
            {needsSizes && currentSizeList.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Qty per size <span className="text-gray-400 font-normal">(leave blank to use total qty for each)</span></label>
                <div className="flex flex-wrap gap-2">
                  {currentSizeList.map((size) => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-jays-navy uppercase">{size}</span>
                      <input
                        type="number"
                        min="0"
                        value={sizeQuantities[size] ?? ''}
                        onChange={(e) => setSizeQuantities((prev) => ({ ...prev, [size]: e.target.value }))}
                        placeholder={form.quantity || '1'}
                        className="w-16 border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
                      />
                    </div>
                  ))}
                </div>
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
              <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={images.length >= 3} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal mb-3 disabled:opacity-50" />
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
              <div className="flex gap-2 mb-2">
                <input value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddColor())} placeholder="e.g. Red, Blue, #1E2761" className={INPUT_CLS} />
                <button type="button" onClick={handleAddColor} className="px-4 py-2 bg-jays-ice text-jays-navy font-semibold rounded-xl text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colors.map((c: string) => (
                  <span key={c} className="px-3 py-1 bg-jays-ice text-jays-navy rounded-full text-xs font-medium flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c }}></span>
                    {c}
                    <button type="button" onClick={() => handleRemoveColor(c)} className="text-jays-steel hover:text-red-500 font-bold">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 accent-jays-navy" />
              <span className="font-medium text-jays-navy">Featured Product</span>
            </label>
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
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isNewArrival}
                onChange={(e) => setForm(f => ({ ...f, isNewArrival: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 accent-cyan-600"
              />
              <span className="font-medium text-jays-navy">New Arrival</span>
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
          {MAIN_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
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
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Status</th>
              <th className="px-3 py-2 font-medium text-jays-steel text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={8}><EmptyState
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
                  {/* Product: name + branding badges */}
                  <td className="px-3 py-2">
                    <div className="font-medium leading-tight">{p.name}</div>
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
                    {p.category}{p.subcategory ? <> › {p.subcategory}</> : null}
                  </td>
                  {/* Price */}
                  <td className="px-3 py-2 text-jays-red font-bold whitespace-nowrap">{formatCAD(p.priceCents)}</td>
                  {/* Inventory: remaining / held */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`font-semibold ${remaining <= 0 ? 'text-red-600' : 'text-green-600'}`}>{remaining} rem</span>
                    <span className="text-jays-steel text-xs ml-1">/ {p._count?.holds ?? 0} held</span>
                  </td>
                  {/* Status */}
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="px-2 py-1 bg-jays-navy/10 text-jays-navy text-xs rounded-lg hover:bg-jays-navy/20 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setLocationsProduct(p)}
                        className="px-2 py-1 bg-jays-royal/10 text-jays-royal text-xs rounded-lg hover:bg-jays-royal/20 transition-colors whitespace-nowrap"
                      >
                        Locations
                      </button>
                      <button
                        onClick={() => setRestockProduct(p)}
                        className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                      >
                        Restock
                      </button>
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
      />

      <RestockModal
        key={restockProduct ? `restock-${restockProduct.id}` : 'restock-none'}
        productId={restockProduct?.id ?? null}
        productName={restockProduct?.name ?? ''}
        sizes={restockProduct?.sizes ?? ''}
        onClose={() => setRestockProduct(null)}
        onRestocked={() => { setRestockProduct(null); load() }}
      />
    </div>
  )
}
