import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Normalize phone: strip all non-digits
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')?.trim()
    const shopSlug = searchParams.get('shopSlug')?.trim()

    if (!phone || phone.length < 7) {
      return NextResponse.json({ error: 'Введіть номер телефону' }, { status: 400 })
    }
    if (!shopSlug) {
      return NextResponse.json({ error: 'shopSlug обов\'язковий' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
      select: { id: true, currency: true },
    })
    if (!shop) {
      return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
    }

    const normalized = normalizePhone(phone)

    // Fetch all orders for this shop, then filter by normalized phone
    const allOrders = await prisma.order.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        customerName: true,
        phone: true,
        status: true,
        deliveryMethod: true,
        deliveryAddress: true,
        totalAmount: true,
        message: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const orders = allOrders.filter(o => normalizePhone(o.phone) === normalized)

    return NextResponse.json({ orders, currency: shop.currency })
  } catch (error: any) {
    console.error('Track order error:', error)
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
