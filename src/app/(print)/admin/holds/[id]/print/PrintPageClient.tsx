'use client'
import { useEffect, useState } from 'react'
import HoldTagPrint from '@/components/holds/HoldTagPrint'

interface Props {
  format: 'label' | 'receipt'
  reservationCode: string
  customerFullName: string
  customerPhone: string
  productName: string
  productBrand: string
  size: string | null
  holdQuantity: number
  totalPriceCents: number
  expiryStr: string
  pickupEtaStr: string | null
  isStadiumHold: boolean
  queuePosition: number | null
  appUrl: string
}

export default function PrintPageClient(props: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <HoldTagPrint {...props} />
}
