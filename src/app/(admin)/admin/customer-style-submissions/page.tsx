'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, X, Trash2, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface CustomerStyleImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
}

interface ProductSnippet {
  id: string
  name: string
  slug: string
  imageUrl: string
}

interface Submission {
  id: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  instagramHandle: string | null
  caption: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  images: CustomerStyleImage[]
  product: ProductSnippet
}

export default function CustomerStyleSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [status, setStatus] = useState<Submission['status']>('PENDING')
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customer-style-submissions?status=${status}`)
      const data = await res.json()
      setSubmissions(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function updateStatus(id: string, newStatus: Submission['status']) {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/customer-style-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success(`Submission ${newStatus.toLowerCase()}`)
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast.error('Failed to update submission')
    } finally {
      setProcessingId(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this submission permanently?')) return
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/customer-style-submissions?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Submission deleted')
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast.error('Failed to delete submission')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-jays-navy mt-4 mb-6">Customer Style Submissions</h1>

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
      ) : submissions.length === 0 ? (
        <p className="text-jays-steel text-sm">No {status.toLowerCase()} submissions.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-xl border border-jays-navy/10 overflow-hidden">
              <div className="grid grid-cols-2 gap-1 bg-gray-100">
                {submission.images.map((img) => (
                  <div key={img.id} className="relative aspect-square">
                    <Image src={img.imageUrl} alt="Customer style" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 relative shrink-0">
                    <Image src={submission.product.imageUrl} alt={submission.product.name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-jays-navy truncate">{submission.product.name}</p>
                    <p className="text-[10px] text-jays-steel truncate">
                      {submission.images.length} {submission.images.length === 1 ? 'image' : 'images'}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-jays-navy truncate">
                    {submission.customerName || 'Anonymous'}
                  </p>
                  <p className="text-[10px] text-jays-steel truncate">
                    {submission.customerEmail || submission.customerPhone || 'No contact'}
                    {submission.instagramHandle && ` • @${submission.instagramHandle}`}
                  </p>
                </div>
                {submission.caption && <p className="text-xs text-jays-steel line-clamp-2">{submission.caption}</p>}
                <div className="flex gap-2 pt-1">
                  {status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(submission.id, 'APPROVED')}
                        disabled={processingId === submission.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors disabled:opacity-60"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(submission.id, 'REJECTED')}
                        disabled={processingId === submission.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => remove(submission.id)}
                    disabled={processingId === submission.id}
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
