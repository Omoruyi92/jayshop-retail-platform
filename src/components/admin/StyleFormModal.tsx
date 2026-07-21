'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { useMutation } from '@/components/sync/hooks/useMutation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { StyleCategory } from '@/app/(admin)/admin/styles/page'

const INPUT_CLS = 'w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40 placeholder:text-muted-foreground'
const FILE_INPUT_CLS = 'w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-jays-navy file:text-white hover:file:bg-jays-royal'

type CoverMode = 'image' | 'video'

export default function StyleFormModal({
  mode,
  style,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'edit'
  style: StyleCategory | null
  onClose: () => void
  onSaved: (style: StyleCategory) => void
}) {
  const [form, setForm] = useState({
    name: style?.name ?? '',
    description: style?.description ?? '',
  })
  // Cover media is either an image or a video, never both at once. Default
  // to whichever the style already has; new styles start on Image.
  const [coverMode, setCoverMode] = useState<CoverMode>(style?.heroVideoUrl ? 'video' : 'image')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverVideoFile, setCoverVideoFile] = useState<File | null>(null)
  const [coverVideoPreview, setCoverVideoPreview] = useState<string | null>(null)
  // Tracks whether the admin explicitly removed the existing media via the
  // delete button, so we know to clear it server-side even without a
  // replacement file.
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, modalRef, onClose)

  function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setCoverFile(file)
    setRemoveExistingImage(false)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setCoverPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setCoverPreview(null)
    }
  }

  function handleCoverVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setCoverVideoFile(file)
    setRemoveExistingVideo(false)
    setCoverVideoPreview(file ? URL.createObjectURL(file) : null)
  }

  function handleDeleteImage() {
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveExistingImage(true)
  }

  function handleDeleteVideo() {
    setCoverVideoFile(null)
    setCoverVideoPreview(null)
    setRemoveExistingVideo(true)
    setCoverMode('image')
  }

  function switchToVideo() {
    // Switching to video clears any pending image change and marks the
    // image for removal, since only one media type is used at a time.
    setCoverMode('video')
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveExistingImage(!!style?.coverImageUrl)
  }

  function switchToImage() {
    setCoverMode('image')
    setCoverVideoFile(null)
    setCoverVideoPreview(null)
    setRemoveExistingVideo(!!style?.heroVideoUrl)
  }

  const hasImage = !!(coverPreview || (!removeExistingImage && style?.coverImageUrl))
  const hasVideo = !!(coverVideoPreview || (!removeExistingVideo && style?.heroVideoUrl))

  const saveMutation = useMutation(
    async (body: FormData) => {
      const url = mode === 'create' ? '/api/admin/styles' : `/api/admin/styles/${style!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, body })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save style')
      }
      const data = await res.json()
      return (data.style ?? data) as StyleCategory
    },
    {
      invalidateOnSuccess: ['admin-styles', 'public-styles'],
      onSuccess: (result) => {
        toast.success(mode === 'create' ? 'Style category added' : 'Style category updated')
        onSaved(result)
      },
      onError: (err) => toast.error(err.message),
    }
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (coverMode === 'image' && !coverFile && !hasImage) {
      toast.error('Please upload a cover image')
      return
    }
    if (coverMode === 'video' && !coverVideoFile && !hasVideo) {
      toast.error('Please upload a cover video')
      return
    }

    const body = new FormData()
    body.append('name', form.name.trim())
    body.append('description', form.description)

    if (coverMode === 'image') {
      if (coverFile) body.append('coverImageFile', coverFile)
      // Video isn't used while in image mode — clear it if one existed.
      if (style?.heroVideoUrl) body.append('heroVideoUrl', '')
    } else {
      if (coverVideoFile) body.append('heroVideoFile', coverVideoFile)
      // coverImageUrl is a required field in the schema (used as the video's
      // poster/fallback), so it's never cleared — only replaced.
      if (coverFile) body.append('coverImageFile', coverFile)
    }

    saveMutation.mutate(body)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto focus:outline-none">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold uppercase text-jays-navy text-lg">
              {mode === 'create' ? 'New Style Category' : `Edit ${style?.name}`}
            </h2>
            <button type="button" onClick={onClose} className="text-jays-steel hover:text-jays-red text-xl leading-none">&times;</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Streetwear"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Short description shown on the Shop by Style landing page"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Cover Media *</label>

              {/* Image / Video segmented toggle — only one media type is used
                  for the masonry card cover at a time. */}
              <div className="inline-flex rounded-lg border border-border p-0.5 mb-3">
                <button
                  type="button"
                  onClick={switchToImage}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    coverMode === 'image' ? 'bg-jays-navy text-white' : 'text-jays-steel hover:bg-jays-ice'
                  }`}
                >
                  Image
                </button>
                <button
                  type="button"
                  onClick={switchToVideo}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    coverMode === 'video' ? 'bg-jays-navy text-white' : 'text-jays-steel hover:bg-jays-ice'
                  }`}
                >
                  Video
                </button>
              </div>

              {coverMode === 'image' ? (
                <>
                  <input type="file" accept="image/*" onChange={handleCoverFile} className={FILE_INPUT_CLS} />
                  {hasImage ? (
                    <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-border bg-jays-ice">
                      <Image src={coverPreview || style!.coverImageUrl} alt="Cover preview" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        title="Remove image"
                        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-jays-red"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-jays-steel gap-1.5">
                      <ImagePlus size={24} />
                      <p className="text-xs">Used as the masonry card on the Shop by Style page</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <input type="file" accept="video/mp4,video/webm" onChange={handleCoverVideoFile} className={FILE_INPUT_CLS} />
                  {hasVideo ? (
                    <div className="mt-2 relative w-full rounded-xl overflow-hidden border border-border bg-jays-ice">
                      <video
                        src={coverVideoPreview || style!.heroVideoUrl!}
                        muted
                        loop
                        playsInline
                        controls
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteVideo}
                        title="Remove video"
                        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-jays-red"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-jays-steel">
                      Plays on the masonry card in place of a static image.
                    </p>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-jays-steel">
              Hero media for the Shop by Style landing page is managed separately in Hero Media &rarr; Style Hero.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saveMutation.loading}
              className="bg-jays-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors disabled:opacity-50"
            >
              {saveMutation.loading ? 'Saving…' : mode === 'create' ? 'Add Style' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm border border-border hover:bg-jays-ice transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
