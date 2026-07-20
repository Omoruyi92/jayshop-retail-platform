'use client'
import Link from 'next/link'
import { ChevronLeft, Camera, ShieldCheck, Eye, MessageSquareWarning, Sparkles } from 'lucide-react'

export default function StyleSubmissionPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-jays-ice to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-jays-navy via-[#1a4480] to-jays-royal text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 sm:pt-24 sm:pb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-200/70 hover:text-white text-xs mb-4 transition-colors">
            <ChevronLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide">Style Submission Policy &amp; Disclaimer</h1>
              <p className="text-blue-200/80 text-sm mt-1">How we handle customer style photo submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-5">
        <div className="bg-gradient-to-r from-blue-50 to-jays-ice border border-jays-navy/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Sparkles size={22} className="text-jays-royal mt-0.5 shrink-0" />
            <p className="text-sm text-jays-navy/80 leading-relaxed">
              &quot;How Others Are Wearing It&quot; lets fans share up to 2 photos of themselves wearing a product,
              displayed on that product&apos;s page for other shoppers to see. By submitting a photo, you agree to
              the guidelines below.
            </p>
          </div>
        </div>

        {/* Submission Guidelines */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-jays-navy/5 flex items-center justify-center">
              <Camera size={16} className="text-jays-navy" />
            </div>
            <h2 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide">Submission Guidelines</h2>
          </div>
          <ul className="space-y-2">
            {[
              'Up to 2 photos may be submitted per product style.',
              'Photos must clearly feature the product being reviewed.',
              'Accepted formats: JPG, PNG, WEBP, AVIF. Maximum file size applies per upload.',
              'Photos should be your own and appropriate for a general audience.',
              'You may optionally include your name or Instagram handle to be credited.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-jays-royal mt-0.5 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Usage Rights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-jays-navy/5 flex items-center justify-center">
              <ShieldCheck size={16} className="text-jays-navy" />
            </div>
            <h2 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide">Content Usage Rights</h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            By submitting a photo, you grant Jays Shop a non-exclusive, royalty-free license to display it on the
            relevant product detail page and in related marketing (e.g. homepage or shop hero features). You retain
            ownership of your photo and may request its removal at any time by contacting support.
          </p>
        </div>

        {/* Approval & Moderation */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Eye size={16} className="text-jays-navy" />
              <h3 className="font-display font-bold text-jays-navy text-xs uppercase tracking-wide">Admin Approval Required</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              All submissions are reviewed by our team before publishing. Photos remain private and are not shown to
              other customers until approved.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <MessageSquareWarning size={16} className="text-jays-navy" />
              <h3 className="font-display font-bold text-jays-navy text-xs uppercase tracking-wide">Moderation Rules</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We reserve the right to reject or remove any submission that is inappropriate, irrelevant to the
              product, low quality, or otherwise violates these guidelines, without notice.
            </p>
          </div>
        </div>

        {/* Consent */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide mb-2">Customer Consent</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Submitting a photo constitutes your consent for it to be publicly displayed on the relevant product page
            once approved, optionally alongside your name or Instagram handle if provided. If you no longer wish for
            your photo to be displayed, contact us and we will remove it promptly.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Last updated: July 2026</p>
          <Link href="/policy" className="text-xs text-jays-royal hover:underline mt-1 inline-block">View Store Policy</Link>
        </div>
      </div>
    </div>
  )
}
