import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSubscriptionExpiryWarning } from '@/lib/email/service'

// ─── Auth helper ─────────────────────────────────────────────────────────────
// CRON_SECRET must be set in .env — no fallback to catch misconfigured deployments.
function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET env var is not set — cron routes are disabled')
    return false
  }
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

// GET — expire overdue subscriptions and downgrade shops to free plan
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

    const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })
    if (!freePlan) throw new Error('Free plan not found in database')

    const results = []

    for (const subscription of expiredSubscriptions) {
      try {
        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: subscription.id },
            data:  { status: 'expired' },
          }),
          prisma.shop.update({
            where: { id: subscription.shopId },
            data:  { planId: freePlan.id },
          }),
        ])

        results.push({
          shopId:       subscription.shopId,
          shopName:     subscription.shop.name,
          previousPlan: subscription.plan.name,
          status:       'downgraded',
        })

        console.log(`Downgraded shop ${subscription.shop.name} to free plan`)
      } catch (err) {
        console.error(`Failed to process subscription ${subscription.id}:`, err)
        results.push({ shopId: subscription.shopId, status: 'failed', error: String(err) })
      }
    }

    // Email notifications
    for (const result of results) {
      if (result.status === 'downgraded') {
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

    return NextResponse.json({
      success:   true,
      processed: expiredSubscriptions.length,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to check subscriptions', details: error.message },
      { status: 500 }
    )
  }
}

// POST — send 7-day expiry warning emails
export async function POST(request: Request) {
  try {
    if (!checkCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now              = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const expiringSoon = await prisma.subscription.findMany({
      where: {
        status:     'active',
        expiryDate: { gte: now, lte: sevenDaysFromNow },
      },
      include: {
        shop: { include: { owner: { select: { email: true } } } },
        plan: true,
      },
    })

    console.log(`Found ${expiringSoon.length} subscriptions expiring soon`)

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
