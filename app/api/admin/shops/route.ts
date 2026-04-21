import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// POST — suspend / unsuspend a shop manually
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
        suspended:       action === 'suspend',
        suspendedAt:     action === 'suspend' ? new Date() : null,
        suspendedReason: action === 'suspend' ? 'admin_manual' : null,
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

    await prisma.user.delete({ where: { id: shop.ownerId } })

    return NextResponse.json({
      success: true,
      message: `Магазин «${shop.name}» та акаунт видалено.`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH — activate / cancel a subscription, or change plan manually
export async function PATCH(request: Request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscriptionId, action } = body

    // ── Change plan manually ─────────────────────────────────────────────────
    if (action === 'changePlan') {
      const { shopId, planSlug } = body
      if (!shopId || !planSlug) return NextResponse.json({ error: 'shopId and planSlug required' }, { status: 400 })

      const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

      const expiryDate = plan.durationDays > 0
        ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
        : null

      await prisma.$transaction([
        prisma.subscription.updateMany({
          where: { shopId, status: 'active' },
          data:  { status: 'cancelled' },
        }),
        prisma.subscription.create({
          data: {
            shopId,
            planId:     plan.id,
            status:     'active',
            startDate:  new Date(),
            expiryDate,
          },
        }),
        prisma.shop.update({
          where: { id: shopId },
          // Unsuspend when a plan is manually assigned
          data: { planId: plan.id, suspended: false, suspendedAt: null, suspendedReason: null },
        }),
      ])

      return NextResponse.json({ success: true, message: `План змінено на «${plan.name}»` })
    }

    if (!subscriptionId || !['cancel', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const sub = await prisma.subscription.findUnique({
      where:   { id: subscriptionId },
      include: { plan: true, shop: true },
    })
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    // Cancel → suspend the shop (no active plan = offline)
    if (action === 'cancel') {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscriptionId },
          data:  { status: 'cancelled' },
        }),
        prisma.shop.update({
          where: { id: sub.shopId },
          data:  { suspended: true, suspendedAt: new Date(), suspendedReason: 'subscription_cancelled' },
        }),
      ])
      return NextResponse.json({ success: true, message: 'Підписку скасовано, магазин переведено в офлайн' })
    }

    // Activate → unsuspend + update plan + set expiry
    if (action === 'activate') {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + sub.plan.durationDays)

      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: subscriptionId },
          data:  { status: 'active', startDate: new Date(), expiryDate },
        }),
        prisma.shop.update({
          where: { id: sub.shopId },
          data:  {
            planId:          sub.planId,
            suspended:       false,
            suspendedAt:     null,
            suspendedReason: null,
          },
        }),
      ])
      return NextResponse.json({ success: true, message: `Підписку активовано — план ${sub.plan.name}` })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
