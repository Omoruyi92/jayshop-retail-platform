import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

const PREVIEW_COUNT = 5

/**
 * Homepage preview of the "linked gear" feature — the admin PlayerProduct
 * mapping that ties specific products to specific players (managed via the
 * Players admin form, see PlayerFormModal's `products` linking UI). This is
 * the same data the player detail page's "Featured Gear" rail is built from
 * (see /players/[slug]/page.tsx: `gear` from GET /api/players/[slug]).
 * The homepage teaser surfaces a sample of these player-linked products with
 * a "Shop {Player}" badge, deep-linking to the product's PDP. Read-only
 * preview; the underlying admin linking feature and player detail page are
 * untouched.
 */
export default async function LinkedGearPreview() {
  const links = await prisma.playerProduct.findMany({
    where: {
      product: { status: { not: 'ARCHIVED' } },
      player: { status: 'ACTIVE' },
    },
    orderBy: [{ player: { isFeatured: 'desc' } }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: PREVIEW_COUNT,
    include: {
      product: { select: { id: true, name: true, slug: true, imageUrl: true, priceCents: true } },
      player: { select: { id: true, name: true, slug: true } },
    },
  })

  if (links.length === 0) return null

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-[0.25em] text-jays-red">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red" />
              Player-Approved Gear
            </span>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-jays-navy sm:text-4xl">
              Linked Gear
            </h2>
            <p className="mt-2 max-w-lg text-sm text-jays-steel sm:text-base">
              Products tied to the players who wear them.
            </p>
          </div>
          <Link
            href="/players"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-jays-navy transition-colors hover:text-jays-red"
          >
            View All
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {links.map((link) => (
            <Link
              key={link.id}
              href={`/shop/${link.product.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-jays-ice/60 ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-jays-navy/10"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-white">
                <Image
                  src={link.product.imageUrl}
                  alt={link.product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-jays-navy/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                  {link.player.name}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <p className="truncate text-sm font-semibold text-jays-navy" title={link.product.name}>
                  {link.label || link.product.name}
                </p>
                <p className="text-sm font-bold text-jays-red">${(link.product.priceCents / 100).toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
