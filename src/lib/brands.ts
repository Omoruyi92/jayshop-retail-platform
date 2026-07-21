import { prisma } from '@/lib/prisma'

/**
 * Single source of truth for "how many live products does a brand have".
 * Always excludes ARCHIVED products and matches brand names case-insensitively
 * (product.brand is a free-text field, so trimming/casing differences must
 * not cause undercounts). Used by both the admin brands list and the
 * customer-facing brand pages so counts never drift apart.
 */
export async function getBrandProductCount(brandName: string): Promise<number> {
  return prisma.product.count({
    where: {
      status: { not: 'ARCHIVED' },
      brand: { equals: brandName.trim(), mode: 'insensitive' },
    },
  })
}

export async function getBrandProductCounts(brandNames: string[]): Promise<number[]> {
  return Promise.all(brandNames.map((name) => getBrandProductCount(name)))
}
