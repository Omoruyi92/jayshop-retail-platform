import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ReceiptCard from '@/components/holds/ReceiptCard'
import ScanActionBanner from '@/components/holds/ScanActionBanner'

export async function generateMetadata({ params }: { params: { reservationId: string } }): Promise<Metadata> {
  return { title: `Hold ${params.reservationId}` }
}

export default async function ReceiptPage({ params }: { params: { reservationId: string } }) {
  const hold = await prisma.hold.findUnique({
    where: { reservationCode: params.reservationId },
    include: { product: true, customer: true },
  })

  if (!hold) notFound()

  const history =
    hold.status !== 'ACTIVE'
      ? await prisma.holdHistory.findUnique({
          where: { holdId: hold.id },
          select: { fulfilledQuantity: true, finalTotalCents: true, finalStatus: true },
        })
      : null

  const expiryStr = hold.expiresAt.toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const pickupEtaStr = hold.pickupQueueAt
    ? hold.pickupQueueAt.toLocaleString('en-CA', {
        timeZone: 'America/Toronto',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : null

  const isActive = hold.status === 'ACTIVE'
  const isResolved = hold.status === 'PICKED_UP' || hold.status === 'RELEASED' || hold.status === 'EXPIRED'
  const isPickedUp = hold.status === 'PICKED_UP'
  const holdQty = hold.holdQuantity ?? 1
  const fulfilledQty = history?.fulfilledQuantity ?? holdQty
  const isPartialPickup = isPickedUp && fulfilledQty < holdQty
  const displayQty = isPickedUp ? fulfilledQty : holdQty
  const totalPriceCents =
    isResolved && history?.finalTotalCents != null
      ? history.finalTotalCents
      : hold.totalPriceCents

  // statusLabel is computed client-side via t.receipt — pass raw status flags
  const statusLabel = isActive
    ? 'Hold Confirmed'
    : isPickedUp
    ? isPartialPickup
      ? 'Partially Picked Up'
      : 'Picked Up'
    : `Hold ${hold.status.replace('_', ' ')}`

  return (
    <>
      <ScanActionBanner reservationCode={hold.reservationCode} />
      <ReceiptCard
      reservationCode={hold.reservationCode}
      statusLabel={statusLabel}
      isActive={isActive}
      isPartialPickup={isPartialPickup}
      isStadiumHold={hold.isStadiumHold ?? false}
      holdQty={holdQty}
      displayQty={displayQty}
      fulfilledQty={fulfilledQty}
      totalPriceCents={totalPriceCents}
      productName={hold.product.name}
      productImageUrl={hold.product.imageUrl}
      size={hold.size}
      customerFullName={hold.customer.fullName}
      expiryStr={expiryStr}
      pickupEtaStr={pickupEtaStr}
      queuePosition={hold.queuePosition ?? null}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://jays-shop.vercel.app'}
      />
    </>
  )
}
