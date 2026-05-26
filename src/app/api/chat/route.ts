import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { formatCAD } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      // Canned reply mode — no OpenAI key needed
      const lastMsg = (messages[messages.length - 1]?.content ?? '').toLowerCase()
      let reply = "Hi! I'm Birdie, your Jays Shop assistant. I can help you find Blue Jays merch. Try asking about jerseys, caps, hoodies, or how holds work!"

      if (/hold|reserve|reservation/.test(lastMsg)) {
        reply = "To place a hold: browse our shop, click on an item, then click 'Hold This Item'. You'll need your name and phone number — no payment required! Holds last 48 hours."
      } else if (/how long|expire|48/.test(lastMsg)) {
        reply = "Your hold is reserved for 48 hours. After that, if you haven't picked it up, it's automatically released back to the shop."
      } else if (/jersey|jerseys/.test(lastMsg)) {
        reply = "We carry official Nike replica jerseys including Vlad Jr. #27, Bo Bichette #11, and Cavan Biggio #8. Visit /shop and filter by Jerseys to see availability."
      } else if (/cap|hat|toque|snapback/.test(lastMsg)) {
        reply = "We have fitted caps, snapbacks, and winter toques. Head to /shop and filter by Caps to check what's in stock."
      } else if (/hoodie|sweater/.test(lastMsg)) {
        reply = "We stock the navy pullover hoodie and a zip-up hoodie. Visit /shop → Hoodies to see availability."
      } else if (/pickup|pick up|collect/.test(lastMsg)) {
        reply = "Bring your reservation code (or QR code) to the store. Show it at the counter and our staff will locate your item right away!"
      } else if (/cancel|release/.test(lastMsg)) {
        reply = "To cancel a hold, visit /account and enter your phone number to view your holds. Or just don't pick it up — holds release automatically after 48 hours."
      } else if (/ship|deliver|online/.test(lastMsg)) {
        reply = "We're an in-store pickup service only — no shipping in v1. Reserve online, pick up at the Rogers Centre Team Store!"
      } else if (/price|cost|how much/.test(lastMsg)) {
        reply = "Prices are shown in CAD on each product page. Jerseys range $159–$189, caps from $39–$49, hoodies $89–$99, and accessories from $12."
      }

      return NextResponse.json({ reply, demoMode: true })
    }

    // Lazy-init so missing key doesn't crash the module at build time
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Fetch live product catalog for context
    const products = await prisma.product.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: { name: true, priceCents: true, status: true, category: true },
      take: 30,
    })

    const catalogSummary = products
      .map((p) => `- ${p.name} (${p.category}): ${formatCAD(p.priceCents)} \u2014 ${p.status.replace('_', ' ')}`)
      .join('\n')

    const systemPrompt = `You are Birdie, the friendly assistant for Jays Shop \u2014 a Toronto Blue Jays merchandise store.
You help customers navigate the store, find products, and understand how holds work.

CURRENT PRODUCT CATALOG:
${catalogSummary}

HOW HOLDS WORK:
- Holds are free \u2014 no payment required
- Each hold lasts 48 hours
- Customers can hold up to 3 items at once
- Show QR code in-store to pick up
- Items expire automatically if not picked up

STORE FAQ:
- No payment is required to place a hold
- Holds cannot be extended
- Staff are notified immediately when a hold is placed
- Items marked "ON HOLD" are currently reserved by another customer

GUARDRAILS:
- You CANNOT place, modify, or cancel holds \u2014 direct users to the shop page
- Do not discuss topics unrelated to Jays Shop or Blue Jays merchandise
- Keep responses concise and helpful
- If asked about specific sizes or stock beyond what's listed, say "please check with staff in store"`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    })

    return NextResponse.json({
      reply: response.choices[0].message.content,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Chat unavailable' }, { status: 500 })
  }
}
