import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationToShop, sendOrderConfirmationToCustomer } from '@/lib/email/service'
import { sendTelegramMessage, buildOrderMessage, buildOrderKeyboard } from '@/lib/telegram'
import { getCurrencySymbol } from '@/lib/currency'
import { sanitizeString } from '@/lib/validators'

// Maximum field lengths to prevent abuse
const MAX_NAME_LEN    = 100
const MAX_PHONE_LEN   = 30
const MAX_EMAIL_LEN   = 254
const MAX_ADDRESS_LEN = 300
const MAX_MESSAGE_LEN = 1000

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shopSlug,
      customerName,
      phone,
      message,
      flowerId,
      email,
      deliveryMethod,
      deliveryAddress,
      totalAmount: bodyTotalAmount,
      discountCode,
      discountAmount,
    } = body

    // ── Input validation ─────────────────────────────────────────────────────
    const rawName  = sanitizeString(String(customerName || '').slice(0, MAX_NAME_LEN))
    const rawPhone = sanitizeString(String(phone        || '').slice(0, MAX_PHONE_LEN))

    if (!rawName || rawName.length < 2) {
      return NextResponse.json({ error: "Введіть ім'я (мінімум 2 символи)" }, { status: 400 })
    }
    if (!rawPhone || !/^\+?[\d\s\-\(\)]{7,}$/.test(rawPhone)) {
      return NextResponse.json({ error: 'Введіть дійсний номер телефону' }, { status: 400 })
    }
    if (!shopSlug || typeof shopSlug !== 'string' || shopSlug.length > 80) {
      return NextResponse.json({ error: 'Невірний ідентифікатор магазину' }, { status: 400 })
    }

    const rawEmail   = email   ? sanitizeString(String(email).slice(0, MAX_EMAIL_LEN))   : null
    const rawMessage = message ? sanitizeString(String(message).slice(0, MAX_MESSAGE_LEN)) : null

    if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      return NextResponse.json({ error: 'Невірний формат email' }, { status: 400 })
    }

    // ── Resolve shop by slug ONLY (never trust shopId from client) ───────────
    const shop = await prisma.shop.findUnique({
      where:   { slug: shopSlug },
      include: { owner: { select: { email: true } } },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
    }
    if (shop.suspended) {
      return NextResponse.json({ error: 'Магазин тимчасово недоступний' }, { status: 403 })
    }

    const finalShopId = shop.id

    // ── Flower validation (scoped to this shop) ──────────────────────────────
    let flower: Awaited<ReturnType<typeof prisma.flower.findUnique>> | null = null
    if (flowerId) {
      if (typeof flowerId !== 'string' || flowerId.length > 50) {
        return NextResponse.json({ error: 'Невірний ідентифікатор букету' }, { status: 400 })
      }
      flower = await prisma.flower.findUnique({
        where: { id: flowerId, shopId: finalShopId },
      })
      if (!flower) {
        return NextResponse.json({ error: 'Букет не знайдено' }, { status: 404 })
      }
      if (flower.availability === 'out_of_stock') {
        return NextResponse.json({ error: 'Цього букету немає в наявності' }, { status: 400 })
      }
    }

    // ── Minimum order check ───────────────────────────────────────────────────
    const orderTotal = typeof bodyTotalAmount === 'number' && bodyTotalAmount > 0
      ? bodyTotalAmount
      : (flower?.price ?? 0)
    const minOrder = shop.minimumOrderAmount ?? 0
    if (minOrder > 0 && orderTotal < minOrder) {
      return NextResponse.json(
        { error: `Мінімальна сума замовлення: ${minOrder} ${shop.currency || 'UAH'}` },
        { status: 400 }
      )
    }

    // ── Validate delivery method ──────────────────────────────────────────────
    if (deliveryMethod && !['pickup', 'delivery'].includes(deliveryMethod)) {
      return NextResponse.json({ error: 'Невірний спосіб доставки' }, { status: 400 })
    }

    // ── Delivery address string for DB ────────────────────────────────────────
    let deliveryAddressStr: string | null = null
    if (deliveryMethod === 'delivery' && deliveryAddress && typeof deliveryAddress === 'object') {
      deliveryAddressStr = [
        sanitizeString(String(deliveryAddress.address || '').slice(0, 200)),
        sanitizeString(String(deliveryAddress.city    || '').slice(0, 100)),
        sanitizeString(String(deliveryAddress.zipCode || '').slice(0, 20)),
      ]
        .filter(Boolean)
        .join(', ')
        .slice(0, MAX_ADDRESS_LEN)
    }

    // ── Build readable message for internal use ───────────────────────────────
    const deliveryLine = deliveryMethod === 'pickup' ? '🏪 Самовивіз' : '🚚 Доставка'
    const flowerLine   = flower ? `💐 Букет: ${flower.name}` : ''
    const addressLine  = deliveryAddressStr ? `📍 ${deliveryAddressStr}` : ''
    const notesLine    = rawMessage ? `💬 ${rawMessage}` : ''

    const orderMessage = [deliveryLine, flowerLine, addressLine, notesLine]
      .filter(Boolean)
      .join('\n')

    // ── Validate discount code server-side ────────────────────────────────────
    let validatedDiscountCode: string | null = null
    let validatedDiscountAmount: number | null = null

    if (discountCode && typeof discountCode === 'string') {
      const sanitizedCode = discountCode.toUpperCase().trim().slice(0, 50)
      const discount = await prisma.discountCode.findFirst({
        where: {
          shopId:   finalShopId,
          code:     sanitizedCode,
          active:   true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      })

      if (discount) {
        const withinUseLimit = !discount.maxUses || discount.usedCount < discount.maxUses
        const meetsMinOrder  = !discount.minOrderAmount || orderTotal >= discount.minOrderAmount

        if (withinUseLimit && meetsMinOrder) {
          const calculated = discount.type === 'percentage'
            ? Math.round((orderTotal * discount.value) / 100)
            : discount.value
          validatedDiscountCode   = sanitizedCode
          validatedDiscountAmount = Math.min(calculated, orderTotal)
        }
      }
    }

    const finalTotal = Math.max(0, orderTotal - (validatedDiscountAmount ?? 0))

    // ── Create order ─────────────────────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        shopId:          finalShopId,
        flowerId:        flower?.id ?? null,
        customerName:    rawName,
        phone:           rawPhone,
        email:           rawEmail,
        message:         orderMessage || null,
        orderType:       'inquiry',
        deliveryMethod:  deliveryMethod || null,
        deliveryAddress: deliveryAddressStr,
        totalAmount:     finalTotal,
        discountCode:    validatedDiscountCode,
        discountAmount:  validatedDiscountAmount,
        status:          'pending',
      },
    })

    // ── Increment discount code usage ─────────────────────────────────────────
    if (validatedDiscountCode) {
      await prisma.discountCode.updateMany({
        where: { shopId: finalShopId, code: validatedDiscountCode },
        data:  { usedCount: { increment: 1 } },
      })
    }

    // ── Notifications (non-blocking) ──────────────────────────────────────────
    const shopOwnerEmail = shop.owner.email
    sendOrderNotificationToShop(shopOwnerEmail, shop.name, order, flower).catch(() => {})
    if (rawEmail && flower) {
      sendOrderConfirmationToCustomer(rawEmail, rawName, shop.name, flower).catch(() => {})
    }

    if (shop.telegramChatId) {
      const sym      = getCurrencySymbol(shop.currency)
      const text     = buildOrderMessage(order, shop.name, flower, sym)
      const keyboard = buildOrderKeyboard(order.id, 'pending')
      sendTelegramMessage(shop.telegramChatId, text, keyboard).catch(() => {})
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Невідома помилка'
    if (process.env.NODE_ENV === 'development') {
      console.error('[orders/POST]', msg)
    }
    return NextResponse.json(
      { error: 'Не вдалося створити замовлення. Спробуйте ще раз.' },
      { status: 500 }
    )
  }
}
