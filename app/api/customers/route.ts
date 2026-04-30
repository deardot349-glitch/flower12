import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findFirst({
    where: { owner: { email: session.user.email } },
    select: { id: true, currency: true },
  })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id },
    select: { customerName: true, phone: true, totalAmount: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  // Group by phone
  const customerMap: Record<string, {
    name: string; phone: string; orderCount: number; totalSpent: number
    lastOrderAt: string; statuses: string[]
  }> = {}

  for (const o of orders) {
    if (!customerMap[o.phone]) {
      customerMap[o.phone] = {
        name: o.customerName, phone: o.phone,
        orderCount: 0, totalSpent: 0,
        lastOrderAt: o.createdAt.toISOString(),
        statuses: [],
      }
    }
    customerMap[o.phone].orderCount++
    customerMap[o.phone].totalSpent += o.totalAmount || 0
    if (!customerMap[o.phone].statuses.includes(o.status)) {
      customerMap[o.phone].statuses.push(o.status)
    }
    // keep most recent name if it changed
    if (new Date(o.createdAt) > new Date(customerMap[o.phone].lastOrderAt)) {
      customerMap[o.phone].name = o.customerName
      customerMap[o.phone].lastOrderAt = o.createdAt.toISOString()
    }
  }

  const customers = Object.values(customerMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)

  return NextResponse.json({ customers, currency: shop.currency })
}
