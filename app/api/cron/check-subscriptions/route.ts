import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSubscriptionExpiryWarning } from '@/lib/email/service'

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET env var is not set — cron routes are disabled')
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

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`)

    const results = []

    for (const subscription of expiredSubscriptions) {
      try {
        // Mark subscription expired + suspend the shop (goes offline)
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

        console.log(`Suspended shop "${subscription.shop.name}" — plan ${subscription.plan.name} expired`)
      } catch (err) {
        console.error(`Failed to process subscription ${subscription.id}:`, err)
        results.push({ shopId: subscription.shopId, status: 'failed', error: String(err) })
      }
    }

    // Send expiry email notifications
    for (const result of results) {
      if (result.status === 'suspended') {
        try {
          const sub = expiredSubscriptions.find(s => s.shopId === result.shopId)
          if (sub?.shop?.owner?.email) {
            await sendSubscriptionExpiryWarning(
              sub.shop.owner.email,
              sub.shop.name,
              sub.plan.name,
              0,
              sub.expiryDate ?? new Date()
            )
          }
        } catch (emailErr) {
          console.error('Failed to send expiry email:', emailErr)
        }
      }
    }

    // Auto-delete orders older than 30 days
    const orderCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const deletedOrders = await prisma.order.deleteMany({
      where: { createdAt: { lt: orderCutoff } },
    })
    console.log(`Auto-deleted ${deletedOrders.count} orders older than 30 days`)

    return NextResponse.json({
      success:       true,
      processed:     expiredSubscriptions.length,
      results,
      ordersDeleted: deletedOrders.count,
      timestamp:     now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to check subscriptions', details: error.message },
      { status: 500 }
    )
  }
}

// POST — send 3-day expiry warning emails
export async function POST(request: Request) {
  try {
    if (!checkCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now           = new Date()
    const threeDaysOut  = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

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

    console.log(`Found ${expiringSoon.length} subscriptions expiring in 3 days`)

    const warnings = []
    for (const sub of expiringSoon) {
      const daysRemaining = Math.ceil(
        (sub.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      try {
        await sendSubscriptionExpiryWarning(
          sub.shop.owner.email,
          sub.shop.name,
          sub.plan.name,
          daysRemaining,
          sub.expiryDate ?? new Date()
        )
      } catch (emailErr) {
        console.error('Failed to send warning email to', sub.shop.owner.email, emailErr)
      }
      warnings.push({
        shopName:     sub.shop.name,
        ownerEmail:   sub.shop.owner.email,
        planName:     sub.plan.name,
        expiryDate:   sub.expiryDate,
        daysRemaining,
      })
    }

    return NextResponse.json({ success: true, count: expiringSoon.length, warnings })
  } catch (error: any) {
    console.error('Warning check error:', error)
    return NextResponse.json({ error: 'Failed to check expiring subscriptions' }, { status: 500 })
  }
}
