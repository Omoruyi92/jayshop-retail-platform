import { prisma } from '../src/lib/prisma'
import { getMainStoreLocationId } from '../src/lib/store-locations'

const ONE_SIZE = 'ONE_SIZE'

async function main() {
  const mainStoreLocationId = await getMainStoreLocationId()
  if (!mainStoreLocationId) {
    throw new Error('No main store location found')
  }

  const productsWithoutInventory = await prisma.product.findMany({
    where: {
      status: { not: 'ARCHIVED' },
      sizeInventories: { none: {} },
    },
    select: { id: true, name: true, quantity: true, sizes: true },
  })

  if (productsWithoutInventory.length === 0) {
    console.log('No products need backfilling.')
    return
  }

  console.log(`Backfilling ${productsWithoutInventory.length} product(s) without SizeInventory rows...`)

  let created = 0
  let skipped = 0

  for (const product of productsWithoutInventory) {
    const activeSizes = (product.sizes ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    if (activeSizes.length > 0) {
      // Sized product that somehow has no inventory records. Skip to avoid
      // inventing a size; this should be handled manually.
      console.log(`Skipping sized product "${product.name}" (ID: ${product.id}) — sizes: ${activeSizes.join(', ')}`)
      skipped++
      continue
    }

    await prisma.sizeInventory.create({
      data: {
        productId: product.id,
        size: ONE_SIZE,
        quantity: product.quantity,
        locationId: mainStoreLocationId,
      },
    })

    await prisma.product.update({
      where: { id: product.id },
      data: { heldQuantity: 0, pickedQuantity: 0 },
    })

    console.log(`Created ONE_SIZE inventory for "${product.name}" (qty: ${product.quantity})`)
    created++
  }

  console.log(`Done. Created: ${created}, Skipped (sized/none): ${skipped}.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
