import { prisma } from '../src/lib/prisma'

async function main() {
  const prods = await prisma.product.findMany({
    where: { brand: { contains: 'Level', mode: 'insensitive' } },
    select: { id: true, name: true, brand: true },
  })
  console.log('LEVEL PRODUCTS:', JSON.stringify(prods, null, 2))

  const brands = await prisma.product.groupBy({ by: ['brand'], _count: true })
  console.log('ALL BRANDS:', brands.map((b) => b.brand))

  await prisma.$disconnect()
}

main().catch(console.error)
