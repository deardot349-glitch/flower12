import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationToShop, sendOrderConfirmationToCustomer } from '@/lib/email/service'
import { sendTelegramMessage, buildOrderMessage, buildOrderKeyboard } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shopSlug, shopId, customerName, phone, message,
      flowerId, email, deliveryMethod, deliveryAddress, totalAmount: bodyTotalAmount
    } = body

    if (!customerName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "Ім'я та телефон обов'язкові" },
        { status: 400 }
      )
    }

    // Resolve shopId
    let finalShopId = shopId
    if (shopSlug && !shopId) {
      const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } })
      if (!shop) return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
      finalShopId = shop.id
    }
    if (!finalShopId) {
      return NextResponse.json({ error: 'shopSlug або shopId обов\'язковий' }, { status: 400 })
    }

    // Load flower details
    let flower = null
    if (flowerId) {
      flower = await prisma.flower.findUnique({ where: { id: flowerId } })
    }

    // Build human-readable message
    const currencyLine = flower ? `💐 Букет: ${flower.name}` : ''
    const deliveryLine = deliveryMethod === 'pickup' ? '🏪 Самовивіз' : '🚚 Доставка'
    const addressLine = deliveryAddress
      ? `📍 ${[deliveryAddress.address, deliveryAddress.city, deliveryAddress.zipCode].filter(Boolean).join(', ')}`
      : ''
    const notesLine = message ? `💬 ${message}` : ''

    const orderMessage = [
      deliveryLine,
      currencyLine,
      addressLine,
      notesLine,
    ].filter(Boolean).join('\n')

    // Delivery address string for DB
    let deliveryAddressStr: string | null = null
    if (deliveryMethod === 'delivery' && deliveryAddress) {
      deliveryAddressStr = [deliveryAddress.address, deliveryAddress.city, deliveryAddress.zipCode]
        .filter(Boolean).join(', ')
    }

    const order = await prisma.order.create({
      data: {
        shopId: finalShopId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        message: orderMessage || null,
        orderType: 'inquiry',
        deliveryMethod: deliveryMethod || null,
        deliveryAddress: deliveryAddressStr,
        totalAmount: bodyTotalAmount ?? flower?.price ?? 0,
        status: 'pending',
      },
    })

    // Load shop for notifications
    const shop = await prisma.shop.findUnique({
      where: { id: finalShopId },
      include: { owner: true },
    })

    // Email notifications — never crash the order if they fail
    try {
      if (shop) {
        await sendOrderNotificationToShop(shop.owner.email, shop.name, order, flower)
      }
      if (email && flower && shop) {
        await sendOrderConfirmationToCustomer(email, customerName, shop.name, flower)
      }
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr)
    }

    // Telegram notification — never crash the order if it fails
    try {
      if (shop && (shop as any).telegramChatId) {
        const sym = shop.currency === 'UAH' ? '₴' : shop.currency === 'EUR' ? '€' : shop.currency === 'GBP' ? '£' : '$'
        const text = buildOrderMessage(order, shop.name, flower, sym)
        const keyboard = buildOrderKeyboard(order.id)
        await sendTelegramMessage((shop as any).telegramChatId, text, keyboard)
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
