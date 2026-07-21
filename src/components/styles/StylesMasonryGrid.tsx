'use client'

import StyleCard, { type StyleCardData } from './StyleCard'
import Reveal from '@/components/ui/Reveal'

/**
 * Bento/brick span pattern for the desktop masonry grid — cycles every 6
 * cards so any number of active style categories still reads as an
 * intentional, varied brick layout (Nike SNKRS-style visual merchandising)
 * rather than a plain uniform grid. `lg:grid-flow-dense` lets the grid
 * auto-fill any gaps the spans leave behind.
 */
const SPAN_PATTERN = [
  'lg:col-span-2 lg:row-span-2', // large feature tile
  'lg:col-span-1 lg:row-span-1',
  'lg:col-span-1 lg:row-span-1',
  'lg:col-span-2 lg:row-span-1', // wide banner tile
  'lg:col-span-1 lg:row-span-2', // tall tile
  'lg:col-span-1 lg:row-span-1',
]

// Tablet uses a lighter pattern — first tile spans both columns, everything
// else stays a single, evenly-sized brick so the layout doesn't get
// awkwardly tall in portrait orientation.
function tabletSpan(index: number) {
  return index === 0 ? 'sm:col-span-2' : 'sm:col-span-1'
}

export default function StylesMasonryGrid({ styles }: { styles: StyleCardData[] }) {
  if (styles.length === 0) return null

  return (
    <div
      className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-0.5 lg:grid-flow-dense lg:auto-rows-[260px] lg:grid-cols-4 lg:gap-0.5 xl:auto-rows-[300px]"
    >
      {styles.map((style, index) => (
        <Reveal
          key={style.id}
          index={index}
          className={`${tabletSpan(index)} ${SPAN_PATTERN[index % SPAN_PATTERN.length]}`}
        >
          <StyleCard
            style={style}
            priority={index < 2}
            className="aspect-[4/5] h-full w-full sm:aspect-auto sm:h-[320px] lg:aspect-auto lg:h-full"
          />
        </Reveal>
      ))}
    </div>
  )
}
