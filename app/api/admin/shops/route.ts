import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

function checkAdminAuth(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    logger.error('admin/auth', 'ADMIN_SECRET is not configured — admin routes are disabled')
    return false
  }
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const provided = authHeader?.replace('Bearer ', '') || searchParams.get('_a')
  // Constant-time comparison to prevent timing attacks
  if (!provided || provided.length !== secret.length) return false
  let equal = true
  for (let i = 0; i < secret.length; i++) {
    if (provided.charCodeAt(i) !== secret.charCodeAt(i)) equal = false
  }
  return equal
}

// ── GET — fetch all shops ─────────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const shops = await prisma.shop.findMany({
      include: {
        owner:  { select: { email: true } },
        plan:   { select: { name: true, slug: true } },
        _count: { select: { flowers: true, orders: true } },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            plan:    { select: { name: true, slug: true } },
            payment: {
              select: {
                amount:         true,
                status:         true,
                cardLast4:      true,
                cardType:       true,
                cardHolderName: true,
                // cardExpiry and full card numbers are never stored
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ shops })
  } catch (error: unknown) {
    logger.error('admin/shops/get', 'Failed to fetch shops', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
  }
}

// ── POST — suspend / unsuspend a shop ─────────────────────────────────────────
export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { shopId, action } = await request.json()

    if (!shopId || typeof shopId !== 'string' || shopId.length > 50) {
      return NextResponse.json({ error: 'Invalid shopId' }, { status: 400 })
    }
    if (!['suspend', 'unsuspend'].includes(action)) {
      return NextResponse.json({ error: "Action must be 'suspend' or 'unsuspend'" }, { status: 400 })
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

    logger.info('admin/shops', `Shop ${action}ed`, { shopId, shopName: shop.name })

    return NextResponse.json({
      success: true,
      message: action === 'suspend'
        ? `Магазин "${shop.name}" заблоковано`
        : `Магазин "${shop.name}" розблоковано`,
    })
  } catch (error: unknown) {
    logger.error('admin/shops/post', 'Failed to update shop status', { error: String(error) })
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}

// ── DELETE — permanently delete a shop and its owner account ──────────────────
export async function DELETE(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { shopId, confirm } = await request.json()

    if (!shopId || typeof shopId !== 'string' || shopId.length > 50) {
      return NextResponse.json({ error: 'shopId required' }, { status: 400 })
    }
    // Require explicit confirmation field to prevent accidental deletion
    if (confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Send { confirm: "DELETE" } to confirm permanent deletion' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({
      where:   { id: shopId },
      include: { owner: true },
    })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    await prisma.user.delete({ where: { id: shop.ownerId } })

    logger.info('admin/shops/delete', 'Shop and owner permanently deleted', { shopId, shopName: shop.name })

    return NextResponse.json({
      success: true,
      message: `Магазин «${shop.name}» та акаунт видалено.`,
    })
  } catch (error: unknown) {
    logger.error('admin/shops/delete', 'Failed to delete shop', { error: String(error) })
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 })
  }
}

// ── PATCH — change plan / activate / cancel subscription ─────────────────────
export async function PATCH(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    // ── Change plan ───────────────────────────────────────────────────────────
    if (action === 'changePlan') {
      const { shopId, planSlug } = body

      if (!shopId || typeof shopId !== 'string' || shopId.length > 50) {
        return NextResponse.json({ error: 'shopId required' }, { status: 400 })
      }
      if (!planSlug || typeof planSlug !== 'string') {
        return NextResponse.json({ error: 'planSlug required' }, { status: 400 })
      }

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
          data: {
            planId:          plan.id,
            suspended:       false,
            suspendedAt:     null,
            suspendedReason: null,
          },
        }),
      ])

      logger.info('admin/shops/patch', 'Plan changed', { shopId, planSlug })
      return NextResponse.json({ success: true, message: `План змінено на «${plan.name}»` })
    }

    // ── Cancel / activate subscription ────────────────────────────────────────
    const { subscriptionId } = body
    if (!subscriptionId || typeof subscriptionId !== 'string' || subscriptionId.length > 50) {
      return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 })
    }
    if (!['cancel', 'activate'].includes(action)) {
      return NextResponse.json({ error: "Action must be 'changePlan', 'cancel', or 'activate'" }, { status: 400 })
    }

    const sub = await prisma.subscription.findUnique({
      where:   { id: subscriptionId },
      include: { plan: true, shop: true },
    })
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

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
      logger.info('admin/shops/patch', 'Subscription cancelled', { subscriptionId })
      return NextResponse.json({ success: true, message: 'Підписку скасовано, магазин переведено в офлайн' })
    }

    // activate
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

    logger.info('admin/shops/patch', 'Subscription activated', { subscriptionId })
    return NextResponse.json({ success: true, message: `Підписку активовано — план ${sub.plan.name}` })
  } catch (error: unknown) {
    logger.error('admin/shops/patch', 'Failed to patch subscription', { error: String(error) })
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}
