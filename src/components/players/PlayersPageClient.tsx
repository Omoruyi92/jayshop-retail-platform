'use client'

import { useMemo, useState } from 'react'
import PlayerCard, { PlayerCardData } from '@/components/players/PlayerCard'
import FeaturedPlayersCarousel from '@/components/players/FeaturedPlayersCarousel'
import PlayerSearchFilter from '@/components/players/PlayerSearchFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import Reveal from '@/components/ui/Reveal'

/**
 * Client "island" holding the only genuinely interactive parts of the
 * Popular Players page — search/position filtering over an already
 * server-fetched player list. The page itself (`page.tsx`) is now an async
 * Server Component with a direct Prisma query (matching the Shop/Brands
 * pattern), so this component receives the full list as a prop and never
 * fetches on its own — no loading skeleton flash, no client round trip.
 */
export default function PlayersPageClient({ players }: { players: PlayerCardData[] }) {
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('')

  const positions = useMemo(
    () => Array.from(new Set(players.map((p) => p.position).filter(Boolean))),
    [players]
  )

  const featured = useMemo(() => players.filter((p) => p.isFeatured), [players])

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch = search.trim()
        ? p.name.toLowerCase().includes(search.trim().toLowerCase())
        : true
      const matchesPosition = position ? p.position === position : true
      return matchesSearch && matchesPosition
    })
  }, [players, search, position])

  // Only one image on the page should be marked `priority` for LCP — the
  // Featured Players carousel renders first (above the main grid) when it
  // has items, so its first card is the true first-visible player image;
  // otherwise the main grid's first card is.
  const hasFeatured = featured.length > 0

  return (
    <>
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-jays-navy uppercase tracking-tight">
            Popular Players
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Shop official Blue Jays jerseys worn by your favorite players.
          </p>
        </div>
        {players.length > 0 && (
          <PlayerSearchFilter
            search={search}
            onSearchChange={setSearch}
            position={position}
            onPositionChange={setPosition}
            positions={positions}
          />
        )}
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="No players yet"
          body="Check back soon for Blue Jays player profiles and gear."
        />
      ) : (
        <>
          <FeaturedPlayersCarousel players={featured} />

          {filtered.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              title="No matching players"
              body="Try a different search term or position filter."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((player, index) => (
                <Reveal key={player.id} index={index}>
                  <PlayerCard player={player} priority={!hasFeatured && index === 0} />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
