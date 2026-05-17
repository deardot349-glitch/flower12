import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationToShop } from '@/lib/email/service'
import { sendTelegramMessage, buildOrderMessage, buildOrderKeyboard } from '@/lib/telegram'
import { getCurrencySymbol } from '@/lib/currency'
import { sanitizeString } from '@/lib/validators'
import { logger } from '@/lib/logger'

const MAX_NAME_LEN    = 100
const MAX_PHONE_LEN   = 30
const MAX_EMAIL_LEN   = 254
const MAX_ADDRESS_LEN = 300
const MAX_BOUQUET_JSON = 20_000

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

    // ── Input validation ──────────────────────────────────────────────────────
    if (!shopSlug || typeof shopSlug !== 'string' || shopSlug.length > 80) {
      return NextResponse.json({ error: 'Invalid shop identifier' }, { status: 400 })
    }

    const cleanName  = sanitizeString(String(customerName || '').trim()).slice(0, MAX_NAME_LEN)
    const cleanPhone = sanitizeString(String(phone || '').trim()).slice(0, MAX_PHONE_LEN)

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: "Введіть ім'я (мінімум 2 символи)" }, { status: 400 })
    }
    if (!cleanPhone || !/^\+?[\d\s\-\(\)]{7,}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Введіть дійсний номер телефону' }, { status: 400 })
    }

    const cleanEmail = email ? sanitizeString(String(email).trim()).slice(0, MAX_EMAIL_LEN) : null
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Невірний формат email' }, { status: 400 })
    }

    if (!customBouquet || !Array.isArray(customBouquet.flowers) || customBouquet.flowers.length === 0) {
      return NextResponse.json({ error: 'Виберіть хоча б одну квітку' }, { status: 400 })
    }

    if (deliveryMethod && !['pickup', 'delivery'].includes(deliveryMethod)) {
      return NextResponse.json({ error: 'Невірний спосіб доставки' }, { status: 400 })
    }

    const bouquetStr = JSON.stringify(customBouquet)
    if (bouquetStr.length > MAX_BOUQUET_JSON) {
      return NextResponse.json({ error: 'Конфігурація букету завелика' }, { status: 400 })
    }

    // ── Resolve shop server-side from slug ────────────────────────────────────
    const shop = await prisma.shop.findUnique({
      where:   { slug: shopSlug },
      include: { plan: true, owner: { select: { email: true } } },
    })
    if (!shop) return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
    if (shop.suspended) return NextResponse.json({ error: 'Магазин тимчасово недоступний' }, { status: 403 })

    if (shop.plan.slug !== 'premium' || !shop.allowCustomBouquet) {
      return NextResponse.json({ error: 'Кастомні букети доступні лише на тарифі Преміум' }, { status: 403 })
    }

    const sym = getCurrencySymbol(shop.currency)

    // ── Build human-readable order message ────────────────────────────────────
    const flowerLines = (customBouquet.flowers as Array<{ quantity: number; name: string; color?: string; pricePerStem: number }>)
      .map(f =>
        `  • ${f.quantity}x ${sanitizeString(f.name)}${f.color ? ` (${sanitizeString(f.color)})` : ''} — ${sym}${(f.quantity * f.pricePerStem).toFixed(0)}`
      )
      .join('\n')

    const extraLines = Array.isArray(customBouquet.extras)
      ? (customBouquet.extras as Array<{ name: string; price: number }>)
          .map(ex => `  • ${sanitizeString(ex.name)}${ex.price > 0 ? ` — ${sym}${ex.price}` : ' (безкоштовно)'}`)
          .join('\n')
      : ''

    const deliveryAddressStr = deliveryMethod === 'delivery' && deliveryAddress && typeof deliveryAddress === 'object'
      ? [
          sanitizeString(String(deliveryAddress.address || '').slice(0, 200)),
          sanitizeString(String(deliveryAddress.city    || '').slice(0, 100)),
          sanitizeString(String(deliveryAddress.zipCode || '').slice(0, 20)),
        ].filter(Boolean).join(', ').slice(0, MAX_ADDRESS_LEN)
      : null

    const orderMessage = [
      '🎨 КАСТОМНИЙ БУКЕТ',
      '',
      '💐 Квіти:',
      flowerLines,
      customBouquet.wrapping
        ? `🎁 Обгортка: ${sanitizeString(String(customBouquet.wrapping.name))}${Number(customBouquet.wrapping.price) > 0 ? ` (+${sym}${customBouquet.wrapping.price})` : ' (безкоштовно)'}`
        : '',
      extraLines ? `🎀 Додатково:\n${extraLines}` : '',
      customBouquet.specialInstructions
        ? `💬 Побажання: ${sanitizeString(String(customBouquet.specialInstructions).slice(0, 500))}`
        : '',
      `💰 Разом: ${sym}${(Number(customBouquet.totalPrice) || 0).toFixed(0)}`,
      '',
      deliveryMethod === 'pickup'
        ? '🏪 Самовивіз'
        : `🚚 Доставка${deliveryAddressStr ? `: ${deliveryAddressStr}` : ''}`,
    ].filter(s => s !== '').join('\n')

    const totalAmount = Math.max(0, Number(customBouquet.totalPrice) || 0)

    // ── Create order ──────────────────────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        shopId:          shop.id,
        customerName:    cleanName,
        phone:           cleanPhone,
        email:           cleanEmail,
        message:         orderMessage,
        orderType:       'custom_bouquet',
        deliveryMethod:  deliveryMethod || null,
        deliveryAddress: deliveryAddressStr,
        customBouquet:   bouquetStr,
        totalAmount,
        status:          'pending',
      },
    })

    // ── Notifications (non-blocking) ──────────────────────────────────────────
    sendOrderNotificationToShop(shop.owner.email, shop.name, order, null).catch(() => {})

    if (shop.telegramChatId) {
      const text     = buildOrderMessage(order, shop.name, null, sym)
      const keyboard = buildOrderKeyboard(order.id, 'pending')
      sendTelegramMessage(shop.telegramChatId, text, keyboard).catch(() => {})
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error: unknown) {
    logger.error('custom-bouquet/post', 'Failed to create custom bouquet order', { error: String(error) })
    return NextResponse.json({ error: 'Не вдалося створити замовлення. Спробуйте ще раз.' }, { status: 500 })
  }
}
