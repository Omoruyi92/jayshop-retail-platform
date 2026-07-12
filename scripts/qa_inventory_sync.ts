import { prisma } from "@/lib/prisma"
import { resolveHold } from "@/lib/holds/resolveHold"
import { createHold } from "@/lib/holds/createHold"
import { getMainStoreLocationId } from "@/lib/store-locations"

async function main() {
    const results: Record<string, any> = {}
    const locationId = await getMainStoreLocationId()
    
    // Use Women's Quarter-Zip Fleece (has SizeInventory rows)
    const product = await prisma.product.findFirst({
        where: { slug: 'women-quarter-zip-fleece' },
        include: { sizeInventories: true }
    })
    if (!product) { console.log(JSON.stringify({ error: 'Fleece not found' })); return }
    
    const sizeLBefore = product.sizeInventories.find(s => s.size === 'L')
    const sizeSBefore = product.sizeInventories.find(s => s.size === 'S')
    results.before = {
        product: { held: product.heldQuantity, picked: product.pickedQuantity, qty: product.quantity },
        sizeL: sizeLBefore ? { qty: sizeLBefore.quantity, held: sizeLBefore.heldQuantity, picked: sizeLBefore.pickedQuantity } : null,
        sizeS: sizeSBefore ? { qty: sizeSBefore.quantity, held: sizeSBefore.heldQuantity, picked: sizeSBefore.pickedQuantity } : null
    }
    
    // Create hold for size L
    const holdL = await createHold(product.id, {
        fullName: 'QA Inventory Sync L',
        phone: '4165550175',
        size: 'L',
        quantity: 1,
        isStadiumHold: false
    })
    results.holdL_created = { code: holdL.reservationCode, qty: holdL.holdQuantity, size: 'L' }
    
    // Verify size L held incremented
    const sizeLAfterCreate = await prisma.sizeInventory.findUnique({
        where: { productId_size_locationId: { productId: product.id, size: 'L', locationId } }
    })
    results.sizeL_after_create = { held: sizeLAfterCreate?.heldQuantity }
    
    // Release the hold (simulate release, not pickup)
    await resolveHold(holdL.id, 'RELEASED', undefined, 0)
    
    // Verify size L restored
    const sizeLAfterRelease = await prisma.sizeInventory.findUnique({
        where: { productId_size_locationId: { productId: product.id, size: 'L', locationId } }
    })
    const prodAfterRelease = await prisma.product.findUnique({ where: { id: product.id } })
    
    results.after_release = {
        product: { held: prodAfterRelease?.heldQuantity, qty: prodAfterRelease?.quantity },
        sizeL: { qty: sizeLAfterRelease?.quantity, held: sizeLAfterRelease?.heldQuantity, picked: sizeLAfterRelease?.pickedQuantity }
    }
    
    // Verify inventory sync
    const sizeLRestored = sizeLAfterRelease?.heldQuantity === (sizeLBefore?.heldQuantity ?? 0)
    const prodRestored = prodAfterRelease?.heldQuantity === product.heldQuantity
    
    results.checks = {
        sizeLHeldIncremented: sizeLAfterCreate?.heldQuantity === (sizeLBefore?.heldQuantity ?? 0) + 1,
        sizeLHeldRestoredAfterRelease: sizeLRestored,
        productHeldRestoredAfterRelease: prodRestored
    }
    
    console.log(JSON.stringify(results, null, 2))
    await prisma.$disconnect()
}

main().catch(e => { console.error(JSON.stringify({ error: e.message, stack: e.stack })); process.exit(1) })
