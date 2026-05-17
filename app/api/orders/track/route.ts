import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Strip all non-digits from a phone number for comparison
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawPhone   = searchParams.get('phone')?.trim()
    const rawSlug    = searchParams.get('shopSlug')?.trim()

    if (!rawPhone) {
      return NextResponse.json({ error: 'Введіть номер телефону' }, { status: 400 })
    }
    if (!rawSlug || rawSlug.length > 80) {
      return NextResponse.json({ error: "shopSlug обов'язковий" }, { status: 400 })
    }

    const normalizedInput = normalizePhone(rawPhone)
    if (normalizedInput.length < 7 || normalizedInput.length > 15) {
      return NextResponse.json({ error: 'Невірний формат номера телефону' }, { status: 400 })
    }

    // Resolve shop by slug — never trust an ID from the client
    const shop = await prisma.shop.findUnique({
      where:  { slug: rawSlug },
      select: { id: true, currency: true, suspended: true },
    })
    if (!shop) {
      return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
    }
    if (shop.suspended) {
      return NextResponse.json({ error: 'Магазин тимчасово недоступний' }, { status: 403 })
    }

    // Fetch a limited window of recent orders for this shop and filter by phone.
    // This avoids a full table scan while keeping server-side phone normalisation.
    const recent = await prisma.order.findMany({
      where:   { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      take:    500,
      select: {
        id:              true,
        customerName:    true,
        phone:           true,
        status:          true,
        deliveryMethod:  true,
        deliveryAddress: true,
        totalAmount:     true,
        createdAt:       true,
        updatedAt:       true,
        // Deliberately omit: message, customBouquet, email, ownerNotes
        // (these are internal/private fields)
      },
    })

    const orders = recent
      .filter(o => normalizePhone(o.phone) === normalizedInput)
      .map(o => ({
        id:             o.id,
        customerName:   o.customerName,
        status:         o.status,
        deliveryMethod: o.deliveryMethod,
        // Only show city-level address, not full street (privacy)
        deliveryCity:   o.deliveryAddress
          ? o.deliveryAddress.split(',').slice(-1)[0]?.trim() || null
          : null,
        totalAmount:    o.totalAmount,
        createdAt:      o.createdAt,
        updatedAt:      o.updatedAt,
      }))

    return NextResponse.json({ orders, currency: shop.currency })
  } catch (error: unknown) {
    logger.error('orders/track', 'Track order lookup failed', { error: String(error) })
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
