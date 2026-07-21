import Image from 'next/image'
import Link from 'next/link'
import PlayerBadge from './PlayerBadge'

export type PlayerCardData = {
  id: string
  name: string
  slug: string
  jerseyNumber: string
  position: string
  heroImageUrl: string
  isFeatured: boolean
  isTrending: boolean
  isNewArrival: boolean
}

export default function PlayerCard({ player }: { player: PlayerCardData }) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
    >
      <div className="relative aspect-square w-full bg-jays-ice overflow-hidden">
        <Image
          src={player.heroImageUrl}
          alt={player.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain group-hover:scale-105 transition-transform duration-500"
        />
        <PlayerBadge
          isFeatured={player.isFeatured}
          isTrending={player.isTrending}
          isNewArrival={player.isNewArrival}
          className="absolute top-2 left-2 z-10"
        />
        {player.jerseyNumber && (
          <span className="absolute bottom-2 right-2 z-10 bg-jays-navy/90 text-white text-sm font-display font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md">
            {player.jerseyNumber}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
        <h3 className="font-display font-bold text-jays-navy text-sm leading-tight truncate">{player.name}</h3>
        {player.position && (
          <p className="text-xs text-gray-500 uppercase tracking-wide">{player.position}</p>
        )}
      </div>
    </Link>
  )
}
