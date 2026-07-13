'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { EmptyState } from '@/components/ui/EmptyState'
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, Plus, Trash2, Check, X, Pencil } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  isActive: boolean
  sortOrder: number
  children: Category[]
}

const INPUT_CLS = 'border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40'

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Request failed')
  return data
}

export default function AdminCategoriesPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [newTopName, setNewTopName] = useState('')
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    const data = await jsonFetch('/api/admin/categories')
    return data.categories ?? []
  }, [])

  const { data: categories, loading } = useFetch<Category[]>('admin-categories', fetchCategories)
  const list = useMemo(() => categories ?? [], [categories])

  const createMutation = useMutation(
    async (body: { name: string; parentId?: string | null }) =>
      jsonFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    {
      invalidateOnSuccess: ['admin-categories'],
      onSuccess: () => toast.success('Category added'),
      onError: (err) => toast.error(err.message || 'Failed to add category'),
    }
  )

  const patchMutation = useMutation(
    async ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      jsonFetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    {
      invalidateOnSuccess: ['admin-categories'],
      onError: (err) => toast.error(err.message || 'Failed to update category'),
    }
  )

  const deleteMutation = useMutation(
    async (id: string) => jsonFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }),
    {
      invalidateOnSuccess: ['admin-categories'],
      onSuccess: () => toast.success('Category deleted'),
      onError: (err) => toast.error(err.message || 'Failed to delete category'),
    }
  )

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditingName(cat.name)
  }

  function saveEdit() {
    if (!editingId) return
    if (!editingName.trim()) { toast.error('Name cannot be empty'); return }
    patchMutation.mutate({ id: editingId, body: { name: editingName.trim() } })
    setEditingId(null)
    setEditingName('')
  }

  function handleAddTop(e: React.FormEvent) {
    e.preventDefault()
    if (!newTopName.trim()) return
    createMutation.mutate({ name: newTopName.trim() })
    setNewTopName('')
  }

  function handleAddSub(e: React.FormEvent, parentId: string) {
    e.preventDefault()
    if (!newSubName.trim()) return
    createMutation.mutate({ name: newSubName.trim(), parentId })
    setNewSubName('')
    setAddingSubFor(null)
    setExpanded((prev) => new Set(prev).add(parentId))
  }

  function renderRow(cat: Category, depth: 0 | 1) {
    const isEditing = editingId === cat.id
    return (
      <div
        key={cat.id}
        className={`flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border border-border ${
          depth === 1 ? 'ml-6 bg-jays-ice/30' : 'bg-white'
        }`}
      >
        {depth === 0 && (
          <button
            onClick={() => toggleExpand(cat.id)}
            className="text-jays-steel hover:text-jays-navy"
            aria-label="Toggle subcategories"
          >
            {expanded.has(cat.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}

        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
            <input
              autoFocus
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
              className={`${INPUT_CLS} flex-1`}
            />
            <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
            <button onClick={() => setEditingId(null)} className="text-jays-steel hover:text-jays-navy"><X size={16} /></button>
          </div>
        ) : (
          <p className={`flex-1 min-w-[120px] font-semibold text-sm ${depth === 0 ? 'text-jays-navy' : 'text-jays-navy/80'}`}>
            {cat.name}
            <span className="ml-2 text-xs font-normal text-jays-steel">/{cat.slug}</span>
          </p>
        )}

        <button
          onClick={() => patchMutation.mutate({ id: cat.id, body: { isActive: !cat.isActive } })}
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
            cat.isActive
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {cat.isActive ? 'Active' : 'Inactive'}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => patchMutation.mutate({ id: cat.id, body: { move: 'up' } })}
            className="p-1.5 text-jays-steel hover:text-jays-navy rounded-lg hover:bg-jays-ice"
            aria-label="Move up"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => patchMutation.mutate({ id: cat.id, body: { move: 'down' } })}
            className="p-1.5 text-jays-steel hover:text-jays-navy rounded-lg hover:bg-jays-ice"
            aria-label="Move down"
          >
            <ArrowDown size={14} />
          </button>
          {!isEditing && (
            <button
              onClick={() => startEdit(cat)}
              className="p-1.5 text-jays-steel hover:text-jays-navy rounded-lg hover:bg-jays-ice"
              aria-label="Rename"
            >
              <Pencil size={14} />
            </button>
          )}
          {depth === 0 && (
            <button
              onClick={() => { setAddingSubFor(cat.id); setExpanded((prev) => new Set(prev).add(cat.id)) }}
              className="p-1.5 text-jays-steel hover:text-jays-navy rounded-lg hover:bg-jays-ice"
              aria-label="Add subcategory"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            onClick={() => {
              if (confirm(`Delete “${cat.name}”? This cannot be undone.`)) deleteMutation.mutate(cat.id)
            }}
            className="p-1.5 text-jays-red hover:text-red-700 rounded-lg hover:bg-red-50"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header mt-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Categories</h1>
      </div>
      <p className="text-sm text-jays-steel mb-4">
        Manage the main categories and subcategories used across product creation, shop filters, and category navigation.
        Changes here sync automatically to the storefront.
      </p>

      <form onSubmit={handleAddTop} className="flex flex-wrap gap-2 mb-4">
        <input
          value={newTopName}
          onChange={(e) => setNewTopName(e.target.value)}
          placeholder="New category name (e.g. Outerwear)"
          className={`${INPUT_CLS} max-w-xs flex-1`}
        />
        <button
          type="submit"
          className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Add Category
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-jays-steel">Loading categories…</p>
      ) : list.length === 0 ? (
        <EmptyState title="No categories yet" body="Add your first category above." />
      ) : (
        <div className="space-y-3">
          {list.map((cat) => (
            <div key={cat.id} className="space-y-2">
              {renderRow(cat, 0)}
              {expanded.has(cat.id) && (
                <div className="space-y-2">
                  {cat.children.map((sub) => renderRow(sub, 1))}
                  {addingSubFor === cat.id ? (
                    <form onSubmit={(e) => handleAddSub(e, cat.id)} className="ml-6 flex flex-wrap gap-2">
                      <input
                        autoFocus
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="New subcategory name"
                        className={`${INPUT_CLS} max-w-xs flex-1`}
                      />
                      <button type="submit" className="bg-jays-navy text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-jays-royal transition-colors">
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddingSubFor(null); setNewSubName('') }}
                        className="text-xs font-semibold text-jays-steel hover:text-jays-navy px-2"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingSubFor(cat.id)}
                      className="ml-6 text-xs font-semibold text-jays-navy hover:text-jays-royal inline-flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Subcategory
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
