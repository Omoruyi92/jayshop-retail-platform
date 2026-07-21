import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import PlayerBadge from '@/components/players/PlayerBadge'
import Reveal from '@/components/ui/Reveal'

const PREVIEW_COUNT = 5

/**
 * Homepage preview of the /players catalog — pulls straight from the Player
 * model, prioritizing featured/trending players (the same signal used by
 * the full Popular Players page's "Featured Players" carousel) so the
 * homepage teaser always surfaces the most relevant players first. Read-only
 * preview; the full /players page, its filters, and its API are untouched.
 */
export default async function PlayerCatalogPreview() {
  const players = await prisma.player.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ isFeatured: 'desc' }, { isTrending: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: PREVIEW_COUNT,
    select: {
      id: true,
      name: true,
      slug: true,
      jerseyNumber: true,
      position: true,
      heroImageUrl: true,
      isFeatured: true,
      isTrending: true,
      isNewArrival: true,
    },
  })

  if (players.length === 0) return null

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1600px] px-3 py-14 sm:px-5 sm:py-20 lg:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-[0.25em] text-jays-red">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red" />
              Shop by Player
            </span>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-jays-navy sm:text-4xl">
              Popular Players
            </h2>
            <p className="mt-2 max-w-lg text-sm text-jays-steel sm:text-base">
              Rep the gear worn by your favourite Blue Jays.
            </p>
          </div>
          <Link
            href="/players"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-jays-navy transition-colors hover:text-jays-red"
          >
            View All Players
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="scrollbar-hide -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
          {players.map((player, index) => (
            <Reveal key={player.id} index={index} className="w-[42%] shrink-0 snap-start sm:w-auto">
            <Link
              href={`/players/${player.slug}`}
              className="group relative block overflow-hidden rounded-2xl bg-white transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white">
                <Image
                  src={player.heroImageUrl}
                  alt={player.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                />
                {/* Bottom gradient keeps the name legible while placing it
                    directly on the tile — a premium overlay treatment
                    rather than a separate label strip below the image. */}
                <div className="absolute inset-x-0 bottom-0 z-[1] h-20 bg-gradient-to-t from-black/70 to-transparent" />

                <PlayerBadge
                  isFeatured={player.isFeatured}
                  isTrending={player.isTrending}
                  isNewArrival={player.isNewArrival}
                  className="absolute left-2 top-2 z-10"
                />
                {player.jerseyNumber && (
                  <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-jays-navy/85 font-display text-xs font-bold text-white shadow-md backdrop-blur-sm">
                    {player.jerseyNumber}
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 p-3">
                  <h3 className="truncate font-display text-sm font-bold text-white drop-shadow-sm">{player.name}</h3>
                  {player.position && (
                    <p className="truncate text-[11px] uppercase tracking-wide text-white/75">{player.position}</p>
                  )}
                </div>
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
