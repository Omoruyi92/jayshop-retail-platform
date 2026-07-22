// PartnerLogoMarquee.tsx — bold, colorful scrolling strip of partner/brand logos.
// Clicking a logo navigates to the Shop catalog pre-filtered to that brand
// (/shop?brand=<name>), which renders the prominent brand-header hero (see
// ShopPageClient's active-brand banner). Sourced from the same Brand model
// (via /api/brands) used by the Top Brands preview and the /brands listing
// page, so any brand added/edited in the admin panel is reflected here
// automatically — single source of truth across all three surfaces.
//
// Brands are passed in as a prop (fetched server-side by the parent page)
// rather than fetched client-side here — this used to do its own
// `fetch('/api/brands')` on mount, duplicating the brand query the
// homepage's BrandCatalogPreview Server Component already runs.
'use client'
import Link from 'next/link'
import Image from 'next/image'

/* Cycle through the Jays palette so the strip reads as vibrant, not monochrome */
const ACCENTS = [
  {
    ring: 'ring-jays-red/25 group-hover:ring-jays-red',
    glow: 'group-hover:shadow-[0_10px_30px_-8px_rgba(232,41,28,0.45)]',
    dot: 'bg-jays-red',
  },
  {
    ring: 'ring-blue-400/30 group-hover:ring-blue-400',
    glow: 'group-hover:shadow-[0_10px_30px_-8px_rgba(96,165,250,0.45)]',
    dot: 'bg-blue-400',
  },
  {
    ring: 'ring-amber-400/30 group-hover:ring-amber-400',
    glow: 'group-hover:shadow-[0_10px_30px_-8px_rgba(251,191,36,0.45)]',
    dot: 'bg-amber-400',
  },
]

interface Brand {
  name: string
  slug: string
  imageUrl: string
}

function LogoCard({
  src,
  alt,
  accent,
}: {
  src: string
  alt: string
  accent: (typeof ACCENTS)[number]
}) {
  return (
    <Link
      href={`/shop?brand=${encodeURIComponent(alt)}`}
      title={`Shop ${alt}`}
      className={`group relative flex h-24 w-36 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-lg ring-2 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] sm:h-28 sm:w-44 ${accent.ring} ${accent.glow}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={120}
          height={48}
          className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110 sm:h-12"
        />
      ) : (
        <span className="font-display text-lg font-bold text-jays-navy">{alt.charAt(0)}</span>
      )}
      <span className={`absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full ${accent.dot} opacity-0 shadow-[0_0_10px_rgba(255,255,255,0.6)] transition-opacity duration-300 group-hover:opacity-100`} />
    </Link>
  )
}

function LogoRow({ brands }: { brands: Brand[] }) {
  return (
    <>
      {brands.map((b, i) => (
        <LogoCard key={b.slug} src={b.imageUrl} alt={b.name} accent={ACCENTS[i % ACCENTS.length]} />
      ))}
    </>
  )
}

export default function PartnerLogoMarquee({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null

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
          <LogoRow brands={brands} />
          {/* duplicated for seamless loop */}
          <LogoRow brands={brands} />
        </div>
      </div>
    </div>
  )
}
