import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationToShop } from '@/lib/email/service'
import { sendTelegramMessage, buildOrderMessage, buildOrderKeyboard } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shopSlug,
      customerName,
      phone,
      email,
      deliveryMethod,
      deliveryAddress,
      customBouquet,
    } = body

    if (!customerName?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Ім'я та телефон обов'язкові" }, { status: 400 })
    }
    if (!customBouquet || !customBouquet.flowers?.length) {
      return NextResponse.json({ error: 'Виберіть хоча б одну квітку' }, { status: 400 })
    }

    // Guard against oversized payloads bloating the DB
    const bouquetStr = JSON.stringify(customBouquet)
    if (bouquetStr.length > 20_000) {
      return NextResponse.json(
        { error: 'Конфігурація букету завелика' },
        { status: 400 }
      )
    }

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
      include: { plan: true, owner: true },
    })
    if (!shop) return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })

    // Plan gate check
    if (shop.plan.slug !== 'premium') {
      return NextResponse.json(
        { error: 'Кастомні букети доступні лише на тарифі Преміум' },
        { status: 403 }
      )
    }

    const sym = shop.currency === 'UAH' ? '₴'
      : shop.currency === 'EUR' ? '€'
      : shop.currency === 'GBP' ? '£' : '$'

    // Build readable order message
    const flowerLines = customBouquet.flowers
      .map((f: any) => `  • ${f.quantity}x ${f.name}${f.color ? ` (${f.color})` : ''} — ${sym}${(f.quantity * f.pricePerStem).toFixed(2)}`)
      .join('\n')

    const extraLines = (customBouquet.extras || [])
      .map((ex: any) => `  • ${ex.name}${ex.price > 0 ? ` — ${sym}${ex.price}` : ' (безкоштовно)'}`)
      .join('\n')

    const orderMessage = [
      '🎨 КАСТОМНИЙ БУКЕТ',
      '',
      '💐 Квіти:',
      flowerLines,
      customBouquet.wrapping
        ? `🎁 Обгортка: ${customBouquet.wrapping.name}${customBouquet.wrapping.price > 0 ? ` (+${sym}${customBouquet.wrapping.price})` : ' (безкоштовно)'}`
        : '',
      extraLines ? `🎀 Додатково:\n${extraLines}` : '',
      customBouquet.specialInstructions ? `💬 Побажання: ${customBouquet.specialInstructions}` : '',
      `💰 Разом: ${sym}${(customBouquet.totalPrice || 0).toFixed(2)}`,
      '',
      deliveryMethod === 'pickup'
        ? '🏪 Самовивіз'
        : `🚚 Доставка: ${deliveryAddress ? [deliveryAddress.address, deliveryAddress.city].filter(Boolean).join(', ') : ''}`,
    ].filter(s => s !== '').join('\n')

    const deliveryAddressStr = deliveryMethod === 'delivery' && deliveryAddress
      ? [deliveryAddress.address, deliveryAddress.city, deliveryAddress.zipCode].filter(Boolean).join(', ')
      : null

    const order = await prisma.order.create({
      data: {
        shopId: shop.id,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        message: orderMessage,
        orderType: 'custom_bouquet',
        deliveryMethod,
        deliveryAddress: deliveryAddressStr,
        customBouquet: bouquetStr,
        totalAmount: customBouquet.totalPrice || 0,
        status: 'pending',
      },
    })

    // Email notification
    try {
      await sendOrderNotificationToShop(shop.owner.email, shop.name, order, null)
    } catch (err) {
      console.error('Email notification failed:', err)
    }

    // Telegram notification
    try {
      if ((shop as any).telegramChatId) {
        const text = buildOrderMessage(order, shop.name, null, sym)
        const keyboard = buildOrderKeyboard(order.id)
        await sendTelegramMessage((shop as any).telegramChatId, text, keyboard)
      }
    } catch (err) {
      console.error('Telegram notification failed:', err)
    }

    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    console.error('Custom bouquet order error:', error)
    return NextResponse.json(
      { error: 'Не вдалося створити замовлення: ' + (error.message || 'невідома помилка') },
      { status: 500 }
    )
  }
}
