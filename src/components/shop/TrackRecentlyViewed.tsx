'use client'
import { useEffect } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

interface Props {
  id: string
  slug: string
  name: string
  imageUrl: string
  priceCents: number
}

export default function TrackRecentlyViewed({ id, slug, name, imageUrl, priceCents }: Props) {
  const { addItem } = useRecentlyViewed()

  useEffect(() => {
    addItem({ id, slug, name, imageUrl, priceCents })
  }, [id, slug, name, imageUrl, priceCents, addItem])

  return null
}
