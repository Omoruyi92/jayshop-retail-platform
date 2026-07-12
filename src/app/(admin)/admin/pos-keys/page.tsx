'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { KeyRound, Copy, Ban, RotateCcw } from 'lucide-react'

type Location = { id: string; code: string; name: string }
type PosKey = {
  id: string
  name: string
  locationId: string | null
  location: Location | null
  active: boolean
  lastUsedAt: string | null
  createdAt: string
  createdBy: string | null
}

export default function PosKeysPage() {
  const [keys, setKeys] = useState<PosKey[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [locationId, setLocationId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [revealedKey, setRevealedKey] = useState<{ name: string; rawKey: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/pos-keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    fetch('/api/store-locations')
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? []))
      .catch(() => {})
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/pos-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), locationId: locationId || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setRevealedKey({ name: data.key.name, rawKey: data.rawKey })
        setName('')
        setLocationId('')
        load()
        toast.success('API key created — copy it now, it will not be shown again')
      } else {
        toast.error(data.error || 'Failed to create key')
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(key: PosKey) {
    const res = await fetch(`/api/admin/pos-keys/${key.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !key.active }),
    })
    if (res.ok) {
      toast.success(key.active ? 'Key revoked' : 'Key reactivated')
      load()
    } else {
      toast.error('Failed to update key')
    }
  }

  function copyKey() {
    if (!revealedKey) return
    navigator.clipboard.writeText(revealedKey.rawKey).then(() => toast.success('Copied to clipboard'))
  }

  return (
    <div>
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">POS API Keys</h1>
          <p className="text-jays-steel text-sm mt-1">
            Generate keys for stadium POS registers to authenticate against /api/pos/transaction
          </p>
        </div>
      </div>

      {revealedKey && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={16} className="text-amber-700" />
            <h2 className="font-semibold text-amber-800 text-sm">
              New key for &ldquo;{revealedKey.name}&rdquo; — copy it now, it won&apos;t be shown again
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm font-mono break-all">
              {revealedKey.rawKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 bg-jays-navy text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors flex items-center gap-1.5"
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-3 text-xs text-amber-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-4">Generate New Key</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Section 146 Register 2"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-jays-navy"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Scoped Location (optional)</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-jays-navy"
            >
              <option value="">Global (all locations)</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="bg-jays-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-jays-royal disabled:opacity-40 transition-colors"
          >
            {submitting ? 'Generating…' : 'Generate Key'}
          </button>
        </form>
      </div>

      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Name</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Scope</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Status</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Last Used</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Created</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No POS API keys yet" /></td></tr>
            ) : keys.map((k) => (
              <tr key={k.id} className="hover:bg-jays-ice/50 transition-colors">
                <td className="px-4 py-3 font-medium">{k.name}</td>
                <td className="px-4 py-3 text-xs text-jays-steel">
                  {k.location ? `${k.location.code} — ${k.location.name}` : 'Global'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${k.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {k.active ? 'Active' : 'Revoked'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-jays-steel">
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('en-CA') : 'Never'}
                </td>
                <td className="px-4 py-3 text-xs text-jays-steel">
                  {new Date(k.createdAt).toLocaleString('en-CA')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(k)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      k.active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {k.active ? <><Ban size={12} /> Revoke</> : <><RotateCcw size={12} /> Reactivate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
