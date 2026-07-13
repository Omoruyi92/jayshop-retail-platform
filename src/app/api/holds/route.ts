import { NextResponse } from 'next/server'
import { createHold } from '@/lib/holds/createHold'
import { sendSlackNewHold } from '@/lib/slack'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, fullName, phone, size, quantity, isStadiumHold } = body

    if (!productId || !fullName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const digitsOnly = String(phone).replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      return NextResponse.json({ error: 'Phone number must be exactly 10 digits' }, { status: 400 })
    }

    if (size !== undefined && (typeof size !== 'string' || size.trim() === '')) {
      return NextResponse.json({ error: 'size must be a non-empty string' }, { status: 400 })
    }

    const qty = typeof quantity === 'number' ? quantity : 1
    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
    }
    const hold = await createHold(productId, {
      fullName,
      phone: digitsOnly,
      size,
      quantity: qty,
      isStadiumHold: isStadiumHold === true,
    })

    // Send Slack notification (non-blocking)
    sendSlackNewHold({
      reservationCode: hold.reservationCode,
      productName: hold.product.name,
      productImageUrl: hold.product.imageUrl,
      priceCents: hold.product.priceCents,
      customerName: hold.customer.fullName,
      customerPhone: hold.customer.phone,
      expiresAt: hold.expiresAt,
    }).catch(console.error)

    return NextResponse.json({
      reservationCode: hold.reservationCode,
      expiresAt: hold.expiresAt,
      isStadiumHold: hold.isStadiumHold,
      pickupQueueAt: hold.pickupQueueAt,
    }, { status: 201 })
  } catch (err) {
    const error = err as Error
    if (error.message === 'ITEM_ALREADY_ON_HOLD') {
      return NextResponse.json({ error: 'This item is already on hold' }, { status: 409 })
    }
    if (error.message === 'HOLD_LIMIT_REACHED') {
      return NextResponse.json({ error: 'You already have 3 active holds' }, { status: 429 })
    }
    if (error.message === 'ITEM_NOT_AVAILABLE') {
      return NextResponse.json({ error: 'This item is not available' }, { status: 409 })
    }
    if (error.message === 'SIZE_NOT_AVAILABLE') {
      return NextResponse.json({ error: 'This size is no longer available' }, { status: 409 })
    }
    if (error.message === 'SECTION_123_GAME_DAY_ONLY') {
      return NextResponse.json(
        { error: 'Section 123 stadium pickup is only available on active game days', code: 'SECTION_123_GAME_DAY_ONLY' },
        { status: 409 }
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
