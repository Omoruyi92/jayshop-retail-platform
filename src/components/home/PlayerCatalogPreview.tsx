import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import PlayerBadge from '@/components/players/PlayerBadge'

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
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-jays-ice/60 ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-jays-navy/10"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-jays-ice">
                <Image
                  src={player.heroImageUrl}
                  alt={player.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <PlayerBadge
                  isFeatured={player.isFeatured}
                  isTrending={player.isTrending}
                  isNewArrival={player.isNewArrival}
                  className="absolute left-2 top-2 z-10"
                />
                {player.jerseyNumber && (
                  <span className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-jays-navy/90 font-display text-xs font-bold text-white shadow-md">
                    {player.jerseyNumber}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <h3 className="truncate font-display text-sm font-bold text-jays-navy">{player.name}</h3>
                {player.position && (
                  <p className="truncate text-xs uppercase tracking-wide text-jays-steel">{player.position}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
