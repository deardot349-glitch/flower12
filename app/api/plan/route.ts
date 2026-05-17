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
      select: {
        currency: true,
        plan:     { select: { slug: true, maxBouquets: true, name: true } },
        _count:   { select: { flowers: true } },
      },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    return NextResponse.json({
      planSlug:        shop.plan.slug,
      planName:        shop.plan.name,
      maxBouquets:     shop.plan.maxBouquets,
      currentBouquets: shop._count.flowers,
      currency:        shop.currency,
    })
  } catch (error: unknown) {
    logger.error('plan/get', 'Plan fetch failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}
