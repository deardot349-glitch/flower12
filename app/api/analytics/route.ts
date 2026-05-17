import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const rawPeriod = searchParams.get('period') || '30'
    const days = Math.min(365, Math.max(1, parseInt(rawPeriod) || 30))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // ── Fetch orders — NOTE: phone numbers are hashed for repeat-customer
    //    counting. We never return raw phone numbers in the analytics response.
    const orders = await prisma.order.findMany({
      where: { shopId: shop.id, createdAt: { gte: since } },
      select: {
        id:             true,
        totalAmount:    true,
        status:         true,
        createdAt:      true,
        discountAmount: true,
        phone:          true,   // used only for counting, never returned
        customerName:   false,  // not needed for analytics
        flower:         { select: { name: true, category: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // ── Revenue by day ─────────────────────────────────────────────────────────
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
    for (let i = 0; i < days; i++) {
      const d   = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      revenueByDay[key] = { revenue: 0, orders: 0 }
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10)
      if (revenueByDay[key]) {
        revenueByDay[key].revenue += o.totalAmount || 0
        revenueByDay[key].orders  += 1
      }
    }

    // ── Summary stats ──────────────────────────────────────────────────────────
    const completed       = orders.filter(o => o.status === 'completed')
    const totalRevenue    = completed.reduce((s, o) => s + (o.totalAmount || 0), 0)
    const totalOrders     = orders.length
    const completedCount  = completed.length
    const avgOrderValue   = completedCount > 0 ? totalRevenue / completedCount : 0
    const totalDiscounts  = orders.reduce((s, o) => s + (o.discountAmount || 0), 0)

    // ── Status breakdown ───────────────────────────────────────────────────────
    const statusCount: Record<string, number> = {}
    for (const o of orders) {
      statusCount[o.status] = (statusCount[o.status] || 0) + 1
    }

    // ── Top products ───────────────────────────────────────────────────────────
    const productMap: Record<string, { name: string; category: string | null; count: number; revenue: number }> = {}
    for (const o of orders) {
      if (o.flower) {
        const k = o.flower.name
        if (!productMap[k]) productMap[k] = { name: k, category: o.flower.category, count: 0, revenue: 0 }
        productMap[k].count++
        productMap[k].revenue += o.totalAmount || 0
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // ── Repeat vs new customers (by hashed phone) ──────────────────────────────
    const phoneCounts: Record<string, { count: number; revenue: number }> = {}
    for (const o of orders) {
      // Truncate to first 6 chars as an anonymous bucket key (no raw data returned)
      const key = o.phone.replace(/[^0-9]/g, '').slice(-6)
      if (!phoneCounts[key]) phoneCounts[key] = { count: 0, revenue: 0 }
      phoneCounts[key].count++
      phoneCounts[key].revenue += o.totalAmount || 0
    }
    const repeatCustomers = Object.values(phoneCounts).filter(c => c.count > 1).length
    const newCustomers    = Object.values(phoneCounts).filter(c => c.count === 1).length

    // ── Period-over-period revenue comparison ──────────────────────────────────
    const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000)
    const prevOrders = await prisma.order.findMany({
      where:  { shopId: shop.id, createdAt: { gte: prevSince, lt: since }, status: 'completed' },
      select: { totalAmount: true },
    })
    const prevRevenue   = prevOrders.reduce((s, o) => s + (o.totalAmount || 0), 0)
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null

    return NextResponse.json({
      currency:     shop.currency,
      summary:      { totalRevenue, totalOrders, completedCount, avgOrderValue, totalDiscounts, repeatCustomers, newCustomers, revenueChange },
      revenueByDay: Object.entries(revenueByDay).map(([date, v]) => ({ date, ...v })),
      statusCount,
      topProducts,
    })
  } catch (error: unknown) {
    logger.error('analytics/get', 'Analytics query failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
