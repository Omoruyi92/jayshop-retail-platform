'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'

export default function FeedbackTab() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!message.trim()) {
      toast.error('Please share your feedback before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          message: message.trim(),
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Could not send feedback')
      }

      toast.success('Thanks for your feedback!')
      setName('')
      setMessage('')
      setOpen(false)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Could not send feedback'
      toast.error(messageText)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 rounded-r-xl bg-jays-red px-2.5 py-4 font-display text-xs font-bold uppercase tracking-[0.25em] text-white shadow-xl transition-transform hover:translate-x-0.5 md:block"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        aria-label="Open feedback form"
      >
        FEEDBACK
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-40 rounded-full bg-jays-red px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.2em] text-white shadow-xl transition-transform active:scale-[0.98] md:hidden"
        aria-label="Open feedback form"
      >
        Feedback
      </button>

      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-jays-navy via-jays-royal to-jays-navy px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Share Feedback</DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-blue-100">
            Tell us about your Jays Shop experience, product requests, or anything we should improve.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label htmlFor="feedback-name" className="text-sm font-medium text-jays-navy">
              Name
            </label>
            <input
              id="feedback-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-jays-navy focus:ring-2 focus:ring-jays-navy/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="feedback-message" className="text-sm font-medium text-jays-navy">
              Feedback
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share your thoughts"
              rows={6}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-jays-navy focus:ring-2 focus:ring-jays-navy/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-jays-steel transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-jays-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}