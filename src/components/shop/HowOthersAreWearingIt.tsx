'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Camera, Loader2, Instagram, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/Dialog'

interface CustomerStyleImage {
  id: string
  imageUrl: string
  caption: string | null
  sortOrder: number
}

interface Submission {
  id: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  instagramHandle: string | null
  caption: string | null
  images: CustomerStyleImage[]
}

interface HowOthersAreWearingItProps {
  productId: string
}

export default function HowOthersAreWearingIt({ productId }: HowOthersAreWearingItProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{ submission: Submission; index: number } | null>(null)

  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/customer-style-submissions?productId=${encodeURIComponent(productId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setSubmissions(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setSubmissions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [productId])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).slice(0, 2 - files.length)
    if (selected.length === 0) return
    const nextFiles = [...files, ...selected].slice(0, 2)
    setFiles(nextFiles)

    const newPreviews: string[] = []
    selected.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === selected.length) {
          setPreviews((prev) => [...prev, ...newPreviews].slice(0, 2))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (files.length === 0) return
    setSubmitting(true)
    try {
      const body = new FormData()
      files.forEach((file) => body.append('images', file))
      body.append('productId', productId)
      body.append('customerName', customerName)
      body.append('customerEmail', customerEmail)
      body.append('customerPhone', customerPhone)
      body.append('instagramHandle', instagramHandle.replace(/^@/, ''))
      body.append('caption', caption)
      const res = await fetch('/api/customer-style-submissions', { method: 'POST', body })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }
      setUploadOpen(false)
      setFiles([])
      setPreviews([])
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setInstagramHandle('')
      setCaption('')
      alert('Photos submitted for review. Thanks!')
    } catch (err: any) {
      alert(err.message || 'Upload failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const featuredImages = submissions.flatMap((s) =>
    s.images.map((img) => ({ ...img, submission: s }))
  )

  function openLightbox(submission: Submission, index: number) {
    setLightbox({ submission, index })
  }

  function lightboxNext() {
    if (!lightbox) return
    setLightbox((prev) => {
      if (!prev) return prev
      const next = (prev.index + 1) % prev.submission.images.length
      return { ...prev, index: next }
    })
  }

  function lightboxPrev() {
    if (!lightbox) return
    setLightbox((prev) => {
      if (!prev) return prev
      const next = (prev.index - 1 + prev.submission.images.length) % prev.submission.images.length
      return { ...prev, index: next }
    })
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-jays-navy uppercase">
          How Others Are Wearing It
        </h3>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-jays-royal hover:text-jays-navy transition-colors"
        >
          <Camera size={14} /> Upload Your Photos
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-jays-steel">Loading gallery…</p>
      ) : (
        <>
          <p className="text-sm text-jays-steel mb-3">
            Be the first to share how you wear it. Upload up to 2 photos or mention{' '}
            <span className="font-semibold text-jays-navy">@BlueJays</span> on Instagram for a chance to be featured.
          </p>
          {submissions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {featuredImages.map(({ id, imageUrl, submission }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => openLightbox(submission, submission.images.findIndex((i) => i.id === id))}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 text-left"
                >
                  <Image src={imageUrl} alt="Customer style" fill className="object-cover" unoptimized />
                  {submission.instagramHandle && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                      <p className="text-[10px] text-white flex items-center gap-1">
                        <Instagram size={10} /> @{submission.instagramHandle}
                      </p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Your Photo</DialogTitle>
            <DialogClose className="rounded-lg p-1.5 text-jays-steel hover:bg-jays-ice transition-colors">
              <X size={18} />
            </DialogClose>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-jays-steel">
              Upload up to 2 photos. Mention{' '}
              <span className="font-semibold text-jays-navy">@BlueJays</span> on Instagram for a chance to be featured. Submissions are reviewed before publishing.
            </p>

            <label className="block">
              <span className="block text-xs font-medium text-gray-700 mb-1">Photos (1–2)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={files.length >= 2}
                className="block w-full text-sm text-jays-steel file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-jays-ice file:text-jays-navy disabled:opacity-50"
              />
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
            <input
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
            <input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="Instagram handle (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />

            <button
              type="submit"
              disabled={submitting || files.length === 0}
              className="w-full bg-jays-navy text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Submit {files.length > 1 ? 'Photos' : 'Photo'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How Others Are Wearing It</DialogTitle>
            <DialogClose className="rounded-lg p-1.5 text-jays-steel hover:bg-jays-ice transition-colors">
              <X size={18} />
            </DialogClose>
          </DialogHeader>
          {lightbox && (
            <div className="space-y-3">
              <div className="relative aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={lightbox.submission.images[lightbox.index].imageUrl}
                  alt="Customer style"
                  fill
                  className="object-contain"
                  unoptimized
                />
                {lightbox.submission.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={lightboxPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={lightboxNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
              <div className="text-sm text-jays-steel">
                {lightbox.submission.customerName && <p className="font-medium text-jays-navy">{lightbox.submission.customerName}</p>}
                {lightbox.submission.instagramHandle && (
                  <p className="flex items-center gap-1 text-xs">
                    <Instagram size={12} /> @{lightbox.submission.instagramHandle}
                  </p>
                )}
                {lightbox.submission.caption && <p className="mt-1">{lightbox.submission.caption}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
