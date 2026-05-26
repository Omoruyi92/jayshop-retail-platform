'use client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { formatCAD } from '@/lib/utils'
import QRCodeDisplay from '@/components/holds/QRCodeDisplay'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  reservationCode: string
  statusLabel: string
  isActive: boolean
  isPartialPickup: boolean
  isStadiumHold: boolean
  holdQty: number
  displayQty: number
  fulfilledQty: number
  totalPriceCents: number
  productName: string
  productImageUrl: string
  size: string | null
  customerFullName: string
  expiryStr: string
  pickupEtaStr: string | null
  queuePosition: number | null
  appUrl: string
}

export default function ReceiptCard({
  reservationCode,
  statusLabel,
  isActive,
  isPartialPickup,
  isStadiumHold,
  holdQty,
  displayQty,
  fulfilledQty,
  totalPriceCents,
  productName,
  productImageUrl,
  size,
  customerFullName,
  expiryStr,
  pickupEtaStr,
  queuePosition,
  appUrl,
}: Props) {
  const { t } = useLanguage()
  const rc = t.receipt

  return (
    <div className="min-h-screen bg-jays-navy flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-jays-navy px-6 pt-6 pb-4 text-white text-center">
          {isStadiumHold && (
            <div className="inline-flex items-center gap-1.5 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <span>⚾</span>
              <span>Stadium Priority Hold</span>
            </div>
          )}
          <p className="text-blue-200 text-sm uppercase tracking-widest font-medium mb-1">
            {statusLabel}
          </p>
          <p className="font-mono text-4xl font-bold tracking-widest text-white">
            {reservationCode}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center bg-white px-6 py-6">
          <QRCodeDisplay value={`${appUrl}/holds/${reservationCode}`} />
        </div>

        {/* Product info */}
        <div className="px-6 pb-4 flex gap-3 items-center border-t border-gray-100 pt-4">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-none">
            <Image src={productImageUrl} alt={productName} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-jays-navy uppercase text-sm leading-tight truncate">
              {productName}
            </p>
            {size && (
              <p className="text-xs text-jays-steel mt-0.5">
                {rc.size}: <span className="font-medium text-gray-800">{size}</span>
              </p>
            )}
            <div className="mt-1 flex items-baseline gap-1 flex-wrap">
              <span className="text-xs text-jays-steel font-medium">
                {isPartialPickup ? rc.pickedUpOf(fulfilledQty, holdQty) : rc.qty(displayQty)}
              </span>
              <span className="mx-1 text-jays-steel text-xs">·</span>
              <span className="text-jays-red font-bold text-base">{formatCAD(totalPriceCents)}</span>
            </div>
          </div>
        </div>

        {/* Customer + expiry */}
        <div className="px-6 pb-6 space-y-2 text-sm text-jays-steel">
          <div className="flex justify-between">
            <span>{rc.customer}</span>
            <span className="font-medium text-gray-800">{customerFullName}</span>
          </div>
          {isPartialPickup ? (
            <>
              <div className="flex justify-between">
                <span>{rc.holdQuantity}</span>
                <span className="font-bold text-jays-navy">{holdQty}</span>
              </div>
              <div className="flex justify-between">
                <span>{rc.fulfilledQuantity}</span>
                <span className="font-bold text-blue-700">{fulfilledQty}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span>{rc.quantity}</span>
              <span className="font-bold text-jays-navy text-base">{displayQty}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="font-medium text-gray-800">{rc.total}</span>
            <span className="font-bold text-jays-red text-base">{formatCAD(totalPriceCents)}</span>
          </div>
          {isActive && (
            <div className="flex justify-between">
              <span>{rc.holdExpires}</span>
              <span className="font-medium text-gray-800 text-right">{expiryStr}</span>
            </div>
          )}
          {isStadiumHold && isActive && pickupEtaStr && (
            <div className="flex justify-between">
              <span>Pickup ETA</span>
              <span className="font-medium text-amber-700 text-right">{pickupEtaStr}</span>
            </div>
          )}
          {isStadiumHold && queuePosition != null && (
            <div className="flex justify-between">
              <span>Queue position</span>
              <span className="font-bold text-amber-700">#{queuePosition}</span>
            </div>
          )}
          {isStadiumHold && isActive && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-amber-800 text-xs font-medium">
              ⚾ Stadium priority hold — your item will be ready for pickup approximately {pickupEtaStr ?? 'soon'}
            </div>
          )}
          <div className="mt-4 bg-jays-ice rounded-xl p-3 text-center text-jays-navy text-xs font-medium">
            {rc.showScreen}
          </div>
          <div className="mt-2 bg-jays-ice rounded-xl p-3 text-center text-jays-navy text-xs font-medium">
            {rc.storeHours}
          </div>
          <div className="text-center pt-2">
            <Link href="/my-holds" className="text-xs text-jays-navy underline hover:text-jays-red">
              {rc.viewAllHolds}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
