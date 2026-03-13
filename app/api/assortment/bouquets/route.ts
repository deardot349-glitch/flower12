import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const shopId = session.user.shopId

    const [shop, bouquets] = await Promise.all([
      prisma.shop.findUnique({
        where: { id: shopId },
        include: { plan: true, _count: { select: { flowers: true } } },
      }),
      prisma.flower.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      bouquets,
      planInfo: shop ? {
        current: shop._count.flowers,
        max: shop.plan.maxBouquets,
        planSlug: shop.plan.slug,
        allowCustomBouquet: shop.plan.slug === 'premium',
      } : null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
