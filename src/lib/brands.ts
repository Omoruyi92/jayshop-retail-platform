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
  // Single query instead of one COUNT per brand (was N+1 — e.g. the
  // homepage's Top Brands preview and /brands index each triggered a
  // separate DB round trip per brand). Product.brand is free-text so we
  // still need case-insensitive matching, which Prisma's `groupBy` can't
  // do directly — instead pull all non-archived brand values once and
  // tally matches in memory.
  const rows = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: { brand: true },
  })
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = row.brand.trim().toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return brandNames.map((name) => counts.get(name.trim().toLowerCase()) ?? 0)
}
