import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSubscriptionExpiryWarning } from '@/lib/email/service'
import { logger } from '@/lib/logger'

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error('cron/auth', 'CRON_SECRET env var is not set — cron routes are disabled')
    return false
  }
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

// GET — suspend shops whose active subscription has expired
export async function GET(request: Request) {
  try {
    if (!checkCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status:     'active',
        expiryDate: { lte: now },
      },
      include: {
        shop: { include: { owner: { select: { email: true } } } },
        plan: true,
      },
    })

    logger.info('cron/subscriptions', `Processing expired subscriptions`, { count: expiredSubscriptions.length })

    const results: Array<{ shopId: string; shopName?: string; planName?: string; status: string; error?: string }> = []

    for (const subscription of expiredSubscriptions) {
      try {
        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: subscription.id },
            data:  { status: 'expired' },
          }),
          prisma.shop.update({
            where: { id: subscription.shopId },
            data:  { suspended: true, suspendedAt: now, suspendedReason: 'subscription_expired' },
          }),
        ])

        results.push({
          shopId:   subscription.shopId,
          shopName: subscription.shop.name,
          planName: subscription.plan.name,
          status:   'suspended',
        })

        logger.info('cron/subscriptions', `Suspended shop`, { shop: subscription.shop.name, plan: subscription.plan.name })
      } catch (err) {
        logger.error('cron/subscriptions', `Failed to process subscription`, { subscriptionId: subscription.id })
        results.push({ shopId: subscription.shopId, status: 'failed', error: String(err) })
      }
    }

    // Send expiry notification emails (non-blocking)
    for (const result of results) {
      if (result.status === 'suspended') {
        const sub = expiredSubscriptions.find(s => s.shopId === result.shopId)
        if (sub?.shop?.owner?.email) {
          sendSubscriptionExpiryWarning(
            sub.shop.owner.email,
            sub.shop.name,
            sub.plan.name,
            0,
            sub.expiryDate ?? new Date()
          ).catch(() => {})
        }
      }
    }

    return NextResponse.json({
      success:   true,
      processed: expiredSubscriptions.length,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: unknown) {
    logger.error('cron/subscriptions', 'Cron job failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to check subscriptions' }, { status: 500 })
  }
}

// POST — send 3-day expiry warning emails
export async function POST(request: Request) {
  try {
    if (!checkCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now          = new Date()
    const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const expiringSoon = await prisma.subscription.findMany({
      where: {
        status:     'active',
        expiryDate: { gte: now, lte: threeDaysOut },
      },
      include: {
        shop: { include: { owner: { select: { email: true } } } },
        plan: true,
      },
    })

    logger.info('cron/warnings', `Found subscriptions expiring soon`, { count: expiringSoon.length })

    const warnings = []
    for (const sub of expiringSoon) {
      const daysRemaining = Math.ceil(
        (sub.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      sendSubscriptionExpiryWarning(
        sub.shop.owner.email,
        sub.shop.name,
        sub.plan.name,
        daysRemaining,
        sub.expiryDate ?? new Date()
      ).catch(() => {})

      warnings.push({
        shopName:     sub.shop.name,
        planName:     sub.plan.name,
        expiryDate:   sub.expiryDate,
        daysRemaining,
      })
    }

    return NextResponse.json({ success: true, count: expiringSoon.length, warnings })
  } catch (error: unknown) {
    logger.error('cron/warnings', 'Warning check failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to check expiring subscriptions' }, { status: 500 })
  }
}
