// PartnerLogoMarquee.tsx — bold, colorful scrolling strip of clickable partner/brand logos
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { PARTNERS } from './PartnerLogosBar'

/* Cycle through the Jays palette so the strip reads as vibrant, not monochrome */
const ACCENTS = [
  {
    ring: 'ring-jays-red/25 group-hover:ring-jays-red',
    glow: 'group-hover:shadow-[0_10px_30px_-8px_rgba(232,41,28,0.45)]',
    dot: 'bg-jays-red',
    tag: 'text-jays-red',
  },
  {
    ring: 'ring-blue-400/30 group-hover:ring-blue-400',
    glow: 'group-hover:shadow-[0_10px_30px_-8px_rgba(96,165,250,0.45)]',
    dot: 'bg-blue-400',
    tag: 'text-blue-400',
  },
  {
    ring: 'ring-amber-400/30 group-hover:ring-amber-400',
    glow: 'group-hover:shadow-[0_10px_30px_-8px_rgba(251,191,36,0.45)]',
    dot: 'bg-amber-400',
    tag: 'text-amber-400',
  },
]

function LogoCard({
  src,
  alt,
  landscape,
  href,
  accent,
}: {
  src: string
  alt: string
  landscape: boolean
  href: string
  accent: (typeof ACCENTS)[number]
}) {
  return (
    <Link
      href={href}
      title={`Shop ${alt}`}
      className={`group relative flex h-24 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-lg ring-2 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.04] sm:h-28 sm:w-44 ${accent.ring} ${accent.glow}`}
    >
      <Image
        src={src}
        alt={alt}
        width={landscape ? 120 : 56}
        height={48}
        className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110 sm:h-12"
      />
      <span
        className={`pointer-events-none absolute inset-x-2 bottom-1.5 flex items-center justify-center gap-1 rounded-full bg-jays-navy/0 text-[9px] font-display font-bold uppercase tracking-[0.15em] opacity-0 transition-all duration-300 group-hover:bg-jays-navy/[0.04] group-hover:opacity-100 ${accent.tag}`}
      >
        Shop Now
        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </span>
      <span className={`absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full ${accent.dot} opacity-0 shadow-[0_0_10px_rgba(255,255,255,0.6)] transition-opacity duration-300 group-hover:opacity-100`} />
    </Link>
  )
}

function LogoRow() {
  return (
    <>
      {PARTNERS.map((p, i) => (
        <LogoCard
          key={p.alt}
          src={p.src}
          alt={p.alt}
          landscape={p.landscape}
          href={p.href}
          accent={ACCENTS[i % ACCENTS.length]}
        />
      ))}
    </>
  )
}

export default function PartnerLogoMarquee() {
  return (
    <div className="mt-6">
      <div className="mb-5 flex items-center justify-center gap-3">
        <span className="h-px w-8 shrink-0 bg-gradient-to-r from-transparent to-jays-red/60 sm:w-14" aria-hidden="true" />
        <p className="flex items-center gap-2 whitespace-nowrap text-center font-display text-xs font-bold uppercase tracking-[0.3em] text-jays-navy sm:text-sm">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red animate-pulse" />
          Official Partners
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 animate-pulse" />
        </p>
        <span className="h-px w-8 shrink-0 bg-gradient-to-l from-transparent to-amber-400/60 sm:w-14" aria-hidden="true" />
      </div>
      <div className="group/marquee relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div
          className="animate-marquee flex w-max items-center gap-5 group-hover/marquee:[animation-play-state:paused]"
          style={{ animationDuration: '34s' }}
        >
          <LogoRow />
          {/* duplicated for seamless loop */}
          <LogoRow />
        </div>
      </div>
    </div>
  )
}
