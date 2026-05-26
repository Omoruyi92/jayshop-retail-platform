import { prisma } from "@/lib/prisma"
import { resolveHold } from "@/lib/holds/resolveHold"

async function main() {
    // Find the size-M fleece hold (JS-AXVH4) for testing
    const holdM = await prisma.hold.findFirst({
        where: { reservationCode: 'JS-AXVH4', status: 'ACTIVE' },
        include: { product: true }
    })
    
    if (!holdM) {
        console.log(JSON.stringify({ error: 'JS-AXVH4 not found or not active' }))
        return
    }
    
    // Capture state BEFORE resolve
    const sizeBefore = await prisma.sizeInventory.findUnique({
        where: { productId_size: { productId: holdM.productId, size: 'M' } }
    })
    const prodBefore = await prisma.product.findUnique({ where: { id: holdM.productId } })
    
    console.log(JSON.stringify({
        step: 'before',
        hold: { id: holdM.id, code: holdM.reservationCode, qty: holdM.holdQuantity, size: holdM.size },
        sizeM: sizeBefore,
        product: { qty: prodBefore?.quantity, held: prodBefore?.heldQuantity, picked: prodBefore?.pickedQuantity }
    }))
    
    // Test FULL pickup (fulfilledQty = holdQuantity = 1)
    await resolveHold(holdM.id, 'PICKED_UP', undefined, 1)
    
    // Capture state AFTER resolve
    const sizeAfter = await prisma.sizeInventory.findUnique({
        where: { productId_size: { productId: holdM.productId, size: 'M' } }
    })
    const prodAfter = await prisma.product.findUnique({ where: { id: holdM.productId } })
    const holdAfter = await prisma.hold.findUnique({ where: { id: holdM.id } })
    const histRecord = await prisma.holdHistory.findFirst({ where: { holdId: holdM.id } })
    
    console.log(JSON.stringify({
        step: 'after_full_pickup',
        holdStatus: holdAfter?.status,
        sizeM: sizeAfter,
        product: { qty: prodAfter?.quantity, held: prodAfter?.heldQuantity, picked: prodAfter?.pickedQuantity },
        history: histRecord ? { finalStatus: histRecord.finalStatus, fulfQty: histRecord.fulfilledQuantity } : null
    }))
    
    await prisma.$disconnect()
}

main().catch(e => { console.error(JSON.stringify({ error: e.message })); process.exit(1) })
