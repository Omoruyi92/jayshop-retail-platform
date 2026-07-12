import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Jays Shop',
  description:
    'The official retail destination for Toronto Blue Jays fans. Authentic merchandise, jerseys, and game-day products at Rogers Centre.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
