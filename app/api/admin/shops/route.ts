import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-2024'

// GET - fetch all shops with full details
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = authHeader?.replace('Bearer ', '') || searchParams.get('secret')
  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shops = await prisma.shop.findMany({
    include: {
      owner: { select: { email: true } },
      plan: { select: { name: true, slug: true } },
      _count: { select: { flowers: true, orders: true } },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { name: true, slug: true } },
          payment: {
            select: { amount: true, status: true, cardLast4: true, cardType: true, cardHolderName: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ shops })
}

// POST - suspend / unsuspend a shop
export async function POST(request: Request) {
  try {
    const { secret, shopId, action } = await request.json()

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!shopId || !['suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        suspended: action === 'suspend',
        suspendedAt: action === 'suspend' ? new Date() : null,
      }
    })

    return NextResponse.json({
      success: true,
      message: action === 'suspend'
        ? `Магазин "${shop.name}" заблоковано`
        : `Магазин "${shop.name}" розблоковано`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - cancel / activate a subscription
export async function PATCH(request: Request) {
  try {
    const { secret, subscriptionId, action } = await request.json()

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!subscriptionId || !['cancel', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, shop: true }
    })
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    if (action === 'cancel') {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'cancelled' }
        }),
        // Downgrade shop to free plan
        prisma.shop.update({
          where: { id: sub.shopId },
          data: {
            planId: (await prisma.plan.findUnique({ where: { slug: 'free' } }))!.id
          }
        })
      ])
      return NextResponse.json({ success: true, message: `Підписку скасовано, магазин переведено на безкоштовний план` })
    }

    if (action === 'activate') {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + sub.plan.durationDays)

      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'active', startDate: new Date(), expiryDate }
        }),
        prisma.shop.update({
          where: { id: sub.shopId },
          data: { planId: sub.planId }
        })
      ])
      return NextResponse.json({ success: true, message: `Підписку активовано — план ${sub.plan.name}` })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
