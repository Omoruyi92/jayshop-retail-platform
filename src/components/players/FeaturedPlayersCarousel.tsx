'use client'

import PlayerCard, { PlayerCardData } from './PlayerCard'

export default function FeaturedPlayersCarousel({ players }: { players: PlayerCardData[] }) {
  if (players.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="font-display font-bold text-jays-navy text-lg mb-3 px-1">Featured Players</h2>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-thin">
        {players.map((player, index) => (
          <div key={player.id} className="snap-start shrink-0 w-40 sm:w-48">
            <PlayerCard player={player} priority={index === 0} />
          </div>
        ))}
      </div>
    </div>
  )
}
