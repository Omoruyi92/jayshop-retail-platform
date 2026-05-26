interface SlackHoldPayload {
  reservationCode: string
  productName: string
  productImageUrl: string
  priceCents: number
  customerName: string
  customerPhone: string
  expiresAt: Date
}

function formatCAD(cents: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

export async function sendSlackNewHold(payload: SlackHoldPayload) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return
  }

  const expiryStr = payload.expiresAt.toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const body = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '\uD83D\uDD14 New Hold Placed \u2014 Jays Shop' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Product:*\n${payload.productName}` },
          { type: 'mrkdwn', text: `*Price:*\n${formatCAD(payload.priceCents)}` },
          { type: 'mrkdwn', text: `*Customer:*\n${payload.customerName}` },
          { type: 'mrkdwn', text: `*Phone:*\n${payload.customerPhone}` },
          { type: 'mrkdwn', text: `*Reservation Code:*\n\`${payload.reservationCode}\`` },
          { type: 'mrkdwn', text: `*Expires:*\n${expiryStr} ET` },
        ],
        accessory: {
          type: 'image',
          image_url: payload.productImageUrl,
          alt_text: payload.productName,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Mark Picked Up' },
            style: 'primary',
            value: `pickup_${payload.reservationCode}`,
            action_id: 'hold_pickup',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Release Now' },
            style: 'danger',
            value: `release_${payload.reservationCode}`,
            action_id: 'hold_release',
          },
        ],
      },
    ],
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('[slack] sendSlackNewHold failed:', err)
  }
}

export async function sendSlackExpiry(payload: {
  reservationCode: string
  productName: string
  priceCents: number
  customerName: string
  customerPhone: string
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return
  }

  const body = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\u23F0 *Hold Expired* \u2014 \`${payload.reservationCode}\`\n*${payload.productName}* (${formatCAD(payload.priceCents)}) held by ${payload.customerName} (${payload.customerPhone}) was not picked up. Item is back on the shelf.`,
        },
      },
    ],
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('[slack] sendSlackExpiry failed:', err)
  }
}
