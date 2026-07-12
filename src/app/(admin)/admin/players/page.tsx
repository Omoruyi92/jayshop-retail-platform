'use client'
import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFetch } from '@/components/sync/hooks/useFetch'
import { useMutation } from '@/components/sync/hooks/useMutation'
import PlayerFormModal, { type Player, type ProductOption } from '@/components/admin/PlayerFormModal'

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'

export default function AdminPlayersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [search, setSearch] = useState('')

  const fetchPlayers = useCallback(async (): Promise<Player[]> => {
    const url = showArchived ? '/api/admin/players?includeArchived=true' : '/api/admin/players'
    const res = await fetch(url)
    const data = await res.json()
    return data.players ?? []
  }, [showArchived])

  const cacheKey = showArchived ? 'admin-players-archived' : 'admin-players'
  const { data: players, loading } = useFetch<Player[]>(cacheKey, fetchPlayers)
  const playerList = useMemo(() => players ?? [], [players])

  const fetchProducts = useCallback(async (): Promise<ProductOption[]> => {
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    return (data.products ?? []).map((p: { id: string; name: string; slug: string; imageUrl: string }) => ({
      id: p.id, name: p.name, slug: p.slug, imageUrl: p.imageUrl,
    }))
  }, [])
  const { data: productOptions } = useFetch<ProductOption[]>('admin-products-options', fetchProducts)

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return playerList
    return playerList.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.position ?? '').toLowerCase().includes(q)
    )
  }, [playerList, search])

  const archiveMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/players/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-players', 'admin-players-archived', 'players'],
      onSuccess: () => toast.success('Player archived'),
      onError: () => toast.error('Failed to archive player'),
    }
  )

  const unarchiveMutation = useMutation(
    async (id: string) => {
      const res = await fetch(`/api/admin/players/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    {
      invalidateOnSuccess: ['admin-players', 'admin-players-archived', 'players'],
      onSuccess: () => toast.success('Player restored'),
      onError: () => toast.error('Failed'),
    }
  )

  return (
    <div>
      <div className="page-header mt-2">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Popular Players</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-jays-red text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Player
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <input
          type="search"
          placeholder="Search by name or position…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLS} max-w-xs`}
        />
      </div>

      <TableWrapper>
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-jays-steel cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-jays-navy"
            />
            Show archived
          </label>
        </div>
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-2 py-1.5 w-10"></th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Player</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Number</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Position</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Flags</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Gear</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Status</th>
              <th className="px-2 py-1.5 font-medium text-jays-steel text-[10px] uppercase sm:text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : filteredPlayers.length === 0 ? (
              <tr><td colSpan={8}><EmptyState
                title={playerList.length === 0 ? 'No players yet' : 'No results'}
                body={playerList.length === 0 ? 'Click + Add Player to create your first profile.' : 'Try adjusting your search.'}
              /></td></tr>
            ) : filteredPlayers.map((p) => {
              const isArchived = p.status === 'ARCHIVED'
              return (
                <tr key={p.id} className={`hover:bg-jays-ice/50 transition-colors ${isArchived ? 'opacity-50 bg-gray-50' : ''}`}>
                  <td className="px-2 py-1.5">
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-jays-ice relative">
                      {p.heroImageUrl && <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" unoptimized />}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 font-medium leading-tight">{p.name}</td>
                  <td className="px-2 py-1.5 text-jays-steel">#{p.jerseyNumber || '—'}</td>
                  <td className="px-2 py-1.5 text-jays-steel">{p.position || '—'}</td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1 flex-wrap">
                      {p.isFeatured && <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-semibold">Featured</span>}
                      {p.isTrending && <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-semibold">Trending</span>}
                      {p.isNewArrival && <span className="px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-700 text-[10px] font-semibold">New</span>}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-jays-steel">{p.products?.length ?? 0} product{(p.products?.length ?? 0) === 1 ? '' : 's'}</td>
                  <td className="px-2 py-1.5"><StatusBadge status={p.status} /></td>
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1 flex-wrap">
                      <button
                        onClick={() => setEditingPlayer(p)}
                        className="px-1.5 py-0.5 bg-jays-navy/10 text-jays-navy text-[11px] rounded-md hover:bg-jays-navy/20 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </button>
                      {isArchived ? (
                        <button onClick={() => unarchiveMutation.mutate(p.id)} disabled={unarchiveMutation.loading} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[11px] rounded-md hover:bg-green-100 transition-colors whitespace-nowrap disabled:opacity-50">Unarchive</button>
                      ) : (
                        <button onClick={() => archiveMutation.mutate(p.id)} disabled={archiveMutation.loading} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50">Archive</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrapper>

      {showAdd && (
        <PlayerFormModal
          mode="create"
          player={null}
          productOptions={productOptions ?? []}
          onClose={() => setShowAdd(false)}
          onSaved={() => setShowAdd(false)}
        />
      )}

      {editingPlayer && (
        <PlayerFormModal
          mode="edit"
          player={editingPlayer}
          productOptions={productOptions ?? []}
          onClose={() => setEditingPlayer(null)}
          onSaved={() => setEditingPlayer(null)}
        />
      )}
    </div>
  )
}
