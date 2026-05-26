import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PrintPageClient from './PrintPageClient'

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { format?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  const hold = await prisma.hold.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      customer: true,
    },
  })
  if (!hold) notFound()

  // Compute queue position for stadium holds
  let queuePosition: number | null = null
  if (hold.isStadiumHold) {
    const stadiumHolds = await prisma.hold.findMany({
      where: { isStadiumHold: true, status: 'ACTIVE' },
      orderBy: { pickupQueueAt: 'asc' },
      select: { id: true },
    })
    const idx = stadiumHolds.findIndex((h) => h.id === hold.id)
    queuePosition = idx >= 0 ? idx + 1 : null
  }

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

  const format = searchParams.format === 'label' ? 'label' : 'receipt'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jays-shop.vercel.app'

  return (
    <PrintPageClient
      format={format}
      reservationCode={hold.reservationCode}
      customerFullName={hold.customer.fullName}
      customerPhone={hold.customer.phone}
      productName={hold.product.name}
      productBrand={hold.product.brand}
      size={hold.size}
      holdQuantity={hold.holdQuantity ?? 1}
      totalPriceCents={hold.totalPriceCents}
      expiryStr={expiryStr}
      pickupEtaStr={pickupEtaStr}
      isStadiumHold={hold.isStadiumHold ?? false}
      queuePosition={queuePosition}
      appUrl={appUrl}
    />
  )
}
