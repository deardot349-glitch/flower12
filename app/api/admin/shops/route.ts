import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── Auth helper ─────────────────────────────────────────────────────────────
function checkAdminAuth(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    console.error('ADMIN_SECRET env var is not set — admin routes are disabled')
    return false
  }
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const provided = authHeader?.replace('Bearer ', '') || searchParams.get('secret')
  return provided === secret
}

// GET — fetch all shops with full details
export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shops = await prisma.shop.findMany({
    include: {
      owner:  { select: { email: true } },
      plan:   { select: { name: true, slug: true } },
      _count: { select: { flowers: true, orders: true } },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        include: {
          plan:    { select: { name: true, slug: true } },
          payment: { select: { amount: true, status: true, cardLast4: true, cardType: true, cardHolderName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ shops })
}

// POST — suspend / unsuspend a shop
export async function POST(request: Request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shopId, action } = await request.json()

    if (!shopId || !['suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    await prisma.shop.update({
      where: { id: shopId },
      data: {
        suspended:   action === 'suspend',
        suspendedAt: action === 'suspend' ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: action === 'suspend'
        ? `Магазин "${shop.name}" заблоковано`
        : `Магазин "${shop.name}" розблоковано`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — permanently delete a shop and all its data
export async function DELETE(request: Request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shopId } = await request.json()
    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 })

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: true },
    })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    // Delete the owner user — cascades to Shop → everything
    await prisma.user.delete({ where: { id: shop.ownerId } })

    return NextResponse.json({
      success: true,
      message: `Магазин «${shop.name}» та акаунт видалено.`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH — cancel / activate a subscription
export async function PATCH(request: Request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId, action } = await request.json()

    if (!subscriptionId || !['cancel', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const sub = await prisma.subscription.findUnique({
      where:   { id: subscriptionId },
      include: { plan: true, shop: true },
    })
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    if (action === 'cancel') {
      const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })
      if (!freePlan) return NextResponse.json({ error: 'Free plan not found' }, { status: 500 })

      await prisma.$transaction([
        prisma.subscription.update({ where: { id: subscriptionId }, data: { status: 'cancelled' } }),
        prisma.shop.update({ where: { id: sub.shopId }, data: { planId: freePlan.id } }),
      ])
      return NextResponse.json({ success: true, message: 'Підписку скасовано, магазин переведено на безкоштовний план' })
    }

    if (action === 'activate') {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + sub.plan.durationDays)
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscriptionId },
          data:  { status: 'active', startDate: new Date(), expiryDate },
        }),
        prisma.shop.update({ where: { id: sub.shopId }, data: { planId: sub.planId } }),
      ])
      return NextResponse.json({ success: true, message: `Підписку активовано — план ${sub.plan.name}` })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
