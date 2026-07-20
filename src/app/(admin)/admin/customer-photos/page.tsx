'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, X, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import AdminBackButton from '@/components/admin/AdminBackButton'

type Photo = {
  id: string
  imageUrl: string
  customerName: string | null
  instagramHandle: string | null
  caption: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  product: { id: string; name: string; slug: string; imageUrl: string }
}

export default function CustomerPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customer-photos?status=${status}`)
      const data = await res.json()
      setPhotos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [status])

  async function updateStatus(id: string, newStatus: 'APPROVED' | 'REJECTED') {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/customer-photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(`Photo ${newStatus.toLowerCase()}`)
      setPhotos((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to update photo')
    } finally {
      setProcessingId(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this photo permanently?')) return
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/customer-photos?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Photo deleted')
      setPhotos((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to delete photo')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <AdminBackButton />
      <h1 className="text-2xl font-bold text-jays-navy mt-4 mb-6">Customer Photos</h1>

      <div className="flex gap-2 mb-6">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === s
                ? 'bg-jays-navy text-white'
                : 'bg-white border border-jays-navy/10 text-jays-navy hover:bg-jays-ice'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-jays-navy" />
        </div>
      ) : photos.length === 0 ? (
        <p className="text-jays-steel text-sm">No {status.toLowerCase()} photos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-xl border border-jays-navy/10 overflow-hidden">
              <div className="relative aspect-square bg-gray-100">
                <Image src={photo.imageUrl} alt="Customer photo" fill className="object-cover" unoptimized />
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 relative">
                    <Image src={photo.product.imageUrl} alt={photo.product.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-jays-navy truncate">{photo.product.name}</p>
                    <p className="text-[10px] text-jays-steel truncate">
                      {photo.customerName || 'Anonymous'}
                      {photo.instagramHandle && ` • @${photo.instagramHandle}`}
                    </p>
                  </div>
                </div>
                {photo.caption && <p className="text-xs text-jays-steel line-clamp-2">{photo.caption}</p>}
                <div className="flex gap-2 pt-1">
                  {status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(photo.id, 'APPROVED')}
                        disabled={processingId === photo.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors disabled:opacity-60"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(photo.id, 'REJECTED')}
                        disabled={processingId === photo.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => remove(photo.id)}
                    disabled={processingId === photo.id}
                    className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
