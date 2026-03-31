import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationToShop, sendOrderConfirmationToCustomer } from '@/lib/email/service'
import { sendTelegramMessage, buildOrderMessage, buildOrderKeyboard } from '@/lib/telegram'
import { getCurrencySymbol } from '@/lib/currency'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shopSlug,
      shopId,
      customerName,
      phone,
      message,
      flowerId,
      email,
      deliveryMethod,
      deliveryAddress,
      totalAmount: bodyTotalAmount,
    } = body

    if (!customerName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Ім'я та телефон обов'язкові" },
        { status: 400 }
      )
    }

    // ── Resolve shop ─────────────────────────────────────────────────────────
    // Explicitly type the result so TypeScript knows `owner` is present.
    type ShopWithOwner = NonNullable<Awaited<ReturnType<typeof prisma.shop.findUnique>>> & {
      owner: { id: string; email: string; passwordHash: string; createdAt: Date; updatedAt: Date }
    }

    let finalShopId = shopId
    let shop: ShopWithOwner | null = null

    if (shopSlug && !shopId) {
      shop = (await prisma.shop.findUnique({
        where:   { slug: shopSlug },
        include: { owner: true },
      })) as ShopWithOwner | null
      if (!shop) return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
      finalShopId = shop.id
    } else if (finalShopId) {
      shop = (await prisma.shop.findUnique({
        where:   { id: finalShopId },
        include: { owner: true },
      })) as ShopWithOwner | null
    }

    if (!finalShopId || !shop) {
      return NextResponse.json(
        { error: "shopSlug або shopId обов'язковий" },
        { status: 400 }
      )
    }

    // ── Flower details ────────────────────────────────────────────────────────
    let flower: Awaited<ReturnType<typeof prisma.flower.findUnique>> | null = null
    if (flowerId) {
      flower = await prisma.flower.findUnique({ where: { id: flowerId } })
    }

    // ── Build readable message ────────────────────────────────────────────────
    const deliveryLine = deliveryMethod === 'pickup' ? '🏪 Самовивіз' : '🚚 Доставка'
    const currencyLine = flower ? `💐 Букет: ${flower.name}` : ''
    const addressLine  = deliveryAddress
      ? `📍 ${[deliveryAddress.address, deliveryAddress.city, deliveryAddress.zipCode].filter(Boolean).join(', ')}`
      : ''
    const notesLine = message ? `💬 ${message}` : ''

    const orderMessage = [deliveryLine, currencyLine, addressLine, notesLine]
      .filter(Boolean)
      .join('\n')

    // ── Delivery address string for DB ────────────────────────────────────────
    let deliveryAddressStr: string | null = null
    if (deliveryMethod === 'delivery' && deliveryAddress) {
      deliveryAddressStr = [
        deliveryAddress.address,
        deliveryAddress.city,
        deliveryAddress.zipCode,
      ]
        .filter(Boolean)
        .join(', ')
    }

    const order = await prisma.order.create({
      data: {
        shopId:          finalShopId,
        flowerId:        flower?.id ?? null,
        customerName:    customerName.trim(),
        phone:           phone.trim(),
        email:           email?.trim() || null,
        message:         orderMessage || null,
        orderType:       'inquiry',
        deliveryMethod:  deliveryMethod || null,
        deliveryAddress: deliveryAddressStr,
        totalAmount:     bodyTotalAmount ?? flower?.price ?? 0,
        status:          'pending',
      },
    })

    // ── Email notifications ───────────────────────────────────────────────────
    try {
      const shopOwnerEmail = shop.owner.email
      await sendOrderNotificationToShop(shopOwnerEmail, shop.name, order, flower)
      if (email && flower) {
        await sendOrderConfirmationToCustomer(email, customerName, shop.name, flower)
      }
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr)
    }

    // ── Telegram notification ─────────────────────────────────────────────────
    try {
      if (shop.telegramChatId) {
        const sym      = getCurrencySymbol(shop.currency)
        const text     = buildOrderMessage(order, shop.name, flower, sym)
        const keyboard = buildOrderKeyboard(order.id, 'pending')
        await sendTelegramMessage(shop.telegramChatId, text, keyboard)
      }
    } catch (tgErr) {
      console.error('Telegram notification failed:', tgErr)
    }

    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Не вдалося створити замовлення: ' + (error.message || 'невідома помилка') },
      { status: 500 }
    )
  }
}
