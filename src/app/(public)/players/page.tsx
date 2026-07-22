import { prisma } from '@/lib/prisma'
import PlayersHero from '@/components/players/PlayersHero'
import PlayersPageClient from '@/components/players/PlayersPageClient'

// ISR: player data rarely changes; a 60s TTL matches the caching approach
// used by /api/players (and is busted on-demand via revalidatePath/
// revalidateTag('players') from the admin players mutation routes), so
// admin edits still show up promptly without every visitor hitting the DB.
export const revalidate = 60

export default async function PopularPlayersPage() {
  const players = await prisma.player.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
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

  return (
    <div>
      <PlayersHero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PlayersPageClient players={players} />
      </div>
    </div>
  )
}
