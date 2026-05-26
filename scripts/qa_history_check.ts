import { prisma } from "@/lib/prisma"

async function main() {
    const history = await prisma.holdHistory.findMany({
        take: 8,
        orderBy: { resolvedAt: 'desc' }
    })
    console.log(JSON.stringify(history.map(h => ({
        code: h.reservationCode,
        finalStatus: h.finalStatus,
        fulfQty: h.fulfilledQuantity,
        holdQty: h.holdQuantity,
        resolvedAt: h.resolvedAt
    }))))
    await prisma.$disconnect()
}
main().catch(e => { console.error(JSON.stringify({ error: e.message })); process.exit(1) })
