import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

function checkAdminAuth(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const provided = authHeader?.replace('Bearer ', '') || searchParams.get('_a')
  if (!provided || provided.length !== secret.length) return false
  // Constant-time comparison
  let equal = true
  for (let i = 0; i < secret.length; i++) {
    if (provided.charCodeAt(i) !== secret.charCodeAt(i)) equal = false
  }
  return equal
}

export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now          = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const in14Days     = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const [
      approvedPayments,
      plans,
      expiringSoon,
      totalShops,
      suspendedShops,
      pendingPayments,
    ] = await Promise.all([
      prisma.payment.findMany({
        where:   { status: 'approved' },
        include: {
          subscription: {
            include: { plan: { select: { name: true, slug: true } } },
          },
        },
      }),
      prisma.plan.findMany({ orderBy: { price: 'asc' } }),
      prisma.subscription.count({
        where: {
          status:     'active',
          expiryDate: { not: null, lte: in14Days, gte: now },
        },
      }),
      prisma.shop.count(),
      prisma.shop.count({ where: { suspended: true } }),
      prisma.payment.count({ where: { status: 'pending' } }),
    ])

    const totalRevenue = approvedPayments.reduce((s, p) => s + p.amount, 0)
    const monthRevenue = approvedPayments
      .filter(p => new Date(p.approvedAt ?? p.createdAt) >= startOfMonth)
      .reduce((s, p) => s + p.amount, 0)

    const byPlan: Record<string, { name: string; total: number; count: number }> = {}
    for (const p of approvedPayments) {
      const { slug, name } = p.subscription.plan
      if (!byPlan[slug]) byPlan[slug] = { name, total: 0, count: 0 }
      byPlan[slug].total += p.amount
      byPlan[slug].count += 1
    }

    return NextResponse.json({
      totalRevenue,
      monthRevenue,
      byPlan,
      plans,
      expiringSoon,
      totalShops,
      suspendedShops,
      pendingPayments,
    })
  } catch (error: unknown) {
    logger.error('admin/stats', 'Failed to compute stats', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
