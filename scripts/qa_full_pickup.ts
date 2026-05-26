import { prisma } from "@/lib/prisma"
import { resolveHold } from "@/lib/holds/resolveHold"
import { createHold } from "@/lib/holds/createHold"

async function main() {
    const results: Record<string, any> = {}
    
    // Find available product
    const product = await prisma.product.findFirst({
        where: { status: 'AVAILABLE', quantity: { gte: 3 } }
    })
    if (!product) { console.log(JSON.stringify({ error: 'No product available' })); return }
    
    const prodBefore = await prisma.product.findUnique({ where: { id: product.id } })
    
    // Create hold qty=2
    const hold = await createHold(product.id, {
        fullName: 'QA Full Pickup Test',
        phone: '4165550180',
        quantity: 2,
        isStadiumHold: false
    })
    results.hold_created = { code: hold.reservationCode, qty: hold.holdQuantity, id: hold.id }
    
    // Full pickup: fulfill all 2
    await resolveHold(hold.id, 'PICKED_UP', undefined, 2)
    
    const prodAfter = await prisma.product.findUnique({ where: { id: product.id } })
    const holdAfter = await prisma.hold.findUnique({ where: { id: hold.id } })
    const histRecord = await prisma.holdHistory.findFirst({ where: { holdId: hold.id } })
    // No new active hold should exist for this customer/product combination
    const remainingHold = await prisma.hold.findFirst({
        where: { customerId: hold.customerId, status: 'ACTIVE', productId: product.id, id: { not: hold.id } }
    })
    
    results.after_full = {
        holdStatus: holdAfter?.status,
        product: { held: prodAfter?.heldQuantity, picked: prodAfter?.pickedQuantity, qty: prodAfter?.quantity },
        historyFinalStatus: histRecord?.finalStatus,
        historyFulfilledQty: histRecord?.fulfilledQuantity,
        noRemainingHold: !remainingHold
    }
    
    // inventory should be restored (held -= 2, picked += 2)
    const heldDecremented = prodAfter?.heldQuantity === (prodBefore?.heldQuantity ?? 0)
    const pickedIncremented = prodAfter?.pickedQuantity === (prodBefore?.pickedQuantity ?? 0) + 2
    
    results.checks = {
        holdStatus_PICKED_UP: holdAfter?.status === 'PICKED_UP',
        historyStatus_PICKED_UP: histRecord?.finalStatus === 'PICKED_UP',
        historyFulfilledQty_2: histRecord?.fulfilledQuantity === 2,
        heldQtyDecremented: heldDecremented,
        pickedQtyIncremented: pickedIncremented,
        noRemainingActiveHold: !remainingHold
    }
    
    console.log(JSON.stringify(results, null, 2))
    await prisma.$disconnect()
}

main().catch(e => { console.error(JSON.stringify({ error: e.message })); process.exit(1) })
