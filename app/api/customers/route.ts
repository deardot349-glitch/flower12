import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shop = await prisma.shop.findUnique({
      where:  { id: session.user.shopId },
      select: { id: true, currency: true },
    })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const orders = await prisma.order.findMany({
      where:   { shopId: shop.id },
      select: {
        customerName: true,
        phone:        true,
        totalAmount:  true,
        status:       true,
        createdAt:    true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // ── Group orders by phone into customer profiles ──────────────────────────
    type CustomerEntry = {
      name:        string
      phone:       string
      orderCount:  number
      totalSpent:  number
      lastOrderAt: string
      statuses:    string[]
    }

    const customerMap: Record<string, CustomerEntry> = {}

    for (const o of orders) {
      if (!customerMap[o.phone]) {
        customerMap[o.phone] = {
          name:        o.customerName,
          phone:       o.phone,
          orderCount:  0,
          totalSpent:  0,
          lastOrderAt: o.createdAt.toISOString(),
          statuses:    [],
        }
      }

      const entry = customerMap[o.phone]
      entry.orderCount++
      entry.totalSpent += o.totalAmount || 0

      if (!entry.statuses.includes(o.status)) {
        entry.statuses.push(o.status)
      }

      // Keep the name from the most recent order
      if (new Date(o.createdAt) > new Date(entry.lastOrderAt)) {
        entry.name        = o.customerName
        entry.lastOrderAt = o.createdAt.toISOString()
      }
    }

    const customers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent)

    return NextResponse.json({ customers, currency: shop.currency })
  } catch (error: unknown) {
    logger.error('customers/get', 'Failed to fetch customers', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
