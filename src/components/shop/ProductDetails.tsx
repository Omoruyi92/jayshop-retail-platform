'use client'
import HoldButton from '@/components/shop/HoldButton'
import StatusChip from '@/components/ui/StatusChip'
import LicensedBadge from '@/components/ui/LicensedBadge'
import ChampionBadge from '@/components/ui/ChampionBadge'
import BackToShopButton from '@/components/shop/BackToShopButton'
import { formatCAD } from '@/lib/utils'
import type { Product } from '@prisma/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface SizeAvailability {
  size: string
  available: number
}

interface Props {
  product: Product
  remaining: number
  isSoldOut: boolean
  sizes: string[]
  displayStatus: string
  sizeAvailability: SizeAvailability[] | null
}

export default function ProductDetails({ product, remaining, isSoldOut, sizes, displayStatus, sizeAvailability }: Props) {
  const { t } = useLanguage()
  const pd = t.product

  return (
    <div className="p-6">
      <BackToShopButton />
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="font-display text-2xl font-bold text-jays-navy uppercase leading-tight">
          {product.name}
        </h1>
        <StatusChip status={displayStatus} />
      </div>

      {(product.isLicensed || product.isChampion) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {product.isLicensed && <LicensedBadge variant="detail" />}
          {product.isChampion && <ChampionBadge variant="detail" />}
        </div>
      )}

      <p className="font-display text-3xl font-bold text-jays-red mb-2">
        {formatCAD(product.priceCents)}
      </p>

      {product.brand && (
        <p className="text-xs font-semibold uppercase tracking-widest text-jays-steel mb-3">
          {product.brand}
        </p>
      )}

      <p className="text-sm text-jays-steel mb-4">
        {isSoldOut ? (
          <span className="text-jays-red font-medium">{pd.soldOut}</span>
        ) : (
          <span>{pd.leftInStock(remaining)}</span>
        )}
      </p>

      {product.description && (
        <p className="text-jays-steel text-sm mb-6">{product.description}</p>
      )}

      <HoldButton
        product={product}
        remaining={remaining}
        isSoldOut={isSoldOut}
        sizes={sizes}
        sizeAvailability={sizeAvailability}
      />

      {/* FAQ */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h3 className="font-display font-semibold text-jays-navy uppercase mb-3">
          {pd.howHoldsWork}
        </h3>
        <ul className="text-sm text-jays-steel space-y-2">
          {pd.faqItems.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
