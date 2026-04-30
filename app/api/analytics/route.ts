import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const shop = await prisma.shop.findFirst({
    where: { owner: { email: session.user.email } },
    select: { id: true, currency: true },
  })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30' // 7 | 30 | 90
  const days = parseInt(period)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // All orders in period
  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, createdAt: { gte: since } },
    select: {
      id: true, totalAmount: true, status: true, createdAt: true,
      discountAmount: true, deliveryFee: true,
      flower: { select: { name: true, category: true } },
      customerName: true, phone: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Revenue by day
  const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    revenueByDay[key] = { revenue: 0, orders: 0 }
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().split('T')[0]
    if (revenueByDay[key]) {
      revenueByDay[key].revenue += o.totalAmount || 0
      revenueByDay[key].orders += 1
    }
  }

  // Summary stats
  const completed = orders.filter(o => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const totalOrders = orders.length
  const completedCount = completed.length
  const avgOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0
  const totalDiscounts = orders.reduce((s, o) => s + (o.discountAmount || 0), 0)

  // Status breakdown
  const statusCount: Record<string, number> = {}
  for (const o of orders) {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1
  }

  // Top products
  const productMap: Record<string, { name: string; category: string | null; count: number; revenue: number }> = {}
  for (const o of orders) {
    if (o.flower) {
      const k = o.flower.name
      if (!productMap[k]) productMap[k] = { name: k, category: o.flower.category, count: 0, revenue: 0 }
      productMap[k].count++
      productMap[k].revenue += o.totalAmount || 0
    }
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Repeat customers (ordered more than once)
  const phoneCounts: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const o of orders) {
    if (!phoneCounts[o.phone]) phoneCounts[o.phone] = { name: o.customerName, count: 0, revenue: 0 }
    phoneCounts[o.phone].count++
    phoneCounts[o.phone].revenue += o.totalAmount || 0
  }
  const repeatCustomers = Object.values(phoneCounts).filter(c => c.count > 1).length
  const newCustomers = Object.values(phoneCounts).filter(c => c.count === 1).length

  // Previous period for comparison
  const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000)
  const prevOrders = await prisma.order.findMany({
    where: { shopId: shop.id, createdAt: { gte: prevSince, lt: since }, status: 'completed' },
    select: { totalAmount: true },
  })
  const prevRevenue = prevOrders.reduce((s, o) => s + (o.totalAmount || 0), 0)
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null

  return NextResponse.json({
    currency: shop.currency,
    summary: { totalRevenue, totalOrders, completedCount, avgOrderValue, totalDiscounts, repeatCustomers, newCustomers, revenueChange },
    revenueByDay: Object.entries(revenueByDay).map(([date, v]) => ({ date, ...v })),
    statusCount,
    topProducts,
  })
}
