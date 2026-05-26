import { prisma } from "@/lib/prisma"
import { resolveHold } from "@/lib/holds/resolveHold"
import { createHold } from "@/lib/holds/createHold"

async function main() {
    const results: Record<string, any> = {}
    
    // Find a product to test partial pickup
    const product = await prisma.product.findFirst({
        where: { status: 'AVAILABLE', quantity: { gte: 5 } }
    })
    if (!product) { console.log(JSON.stringify({ error: 'No product available' })); return }
    
    // Create a hold with qty=3
    const hold = await createHold(product.id, {
        fullName: 'QA Partial Test',
        phone: '4165550181',
        quantity: 3,
        isStadiumHold: false
    })
    results.hold_created = { code: hold.reservationCode, qty: hold.holdQuantity, id: hold.id }
    
    // Capture before
    const prodBefore = await prisma.product.findUnique({ where: { id: product.id } })
    results.before = { held: prodBefore?.heldQuantity, picked: prodBefore?.pickedQuantity }
    
    // Partial pickup: fulfill 2 of 3
    await resolveHold(hold.id, 'PICKED_UP', undefined, 2)
    
    // Capture after
    const prodAfter = await prisma.product.findUnique({ where: { id: product.id } })
    const origHold = await prisma.hold.findUnique({ where: { id: hold.id } })
    const newHold = await prisma.hold.findFirst({
        where: { customerId: hold.customerId, status: 'ACTIVE', productId: product.id, holdQuantity: 1 }
    })
    const histRecord = await prisma.holdHistory.findFirst({ where: { holdId: hold.id } })
    
    results.after_partial = {
        origHoldStatus: origHold?.status,
        newHoldCode: newHold?.reservationCode,
        newHoldQty: newHold?.holdQuantity,
        product: { held: prodAfter?.heldQuantity, picked: prodAfter?.pickedQuantity, qty: prodAfter?.quantity },
        historyFinalStatus: histRecord?.finalStatus,
        historyFulfilledQty: histRecord?.fulfilledQuantity
    }
    
    // Verify: origHold=PICKED_UP, newHold=ACTIVE with remainQty=1
    // product.heldQuantity should reflect remaining (1), picked should be +2
    const origPickedUp = origHold?.status === 'PICKED_UP'
    const newHoldExists = newHold?.holdQuantity === 1
    const heldCorrect = prodAfter?.heldQuantity === (prodBefore?.heldQuantity ?? 0) - 1 // -fulfilledQty only
    const pickedCorrect = prodAfter?.pickedQuantity === (prodBefore?.pickedQuantity ?? 0) + 2
    
    results.checks = {
        origHoldPickedUp: origPickedUp,
        newHoldCreated: !!newHold,
        newHoldQtyIsRemaining: newHoldExists,
        historyStatus: histRecord?.finalStatus === 'PICKED_UP',
        historyFulfilledQty: histRecord?.fulfilledQuantity === 2,
        pickedQtyCorrect: pickedCorrect
    }
    
    console.log(JSON.stringify(results, null, 2))
    await prisma.$disconnect()
}

main().catch(e => { console.error(JSON.stringify({ error: e.message, stack: e.stack })); process.exit(1) })
