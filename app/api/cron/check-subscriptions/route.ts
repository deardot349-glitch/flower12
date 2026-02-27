import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSubscriptionExpiryWarning } from '@/lib/email/service'

// This endpoint should be called by a cron job (e.g., Vercel Cron, or daily via curl)
// For security, add an authorization header check in production

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'cron-secret-2024'
    
    // Basic security check
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    // Find all active subscriptions that have expired
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiryDate: {
          lte: now // Less than or equal to now (expired)
        }
      },
      include: {
        shop: {
          include: {
            owner: {
              select: { email: true }
            }
          }
        },
        plan: true
      }
    })

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`)

    // Get the free plan to downgrade shops to
    const freePlan = await prisma.plan.findUnique({
      where: { slug: 'free' }
    })

    if (!freePlan) {
      throw new Error('Free plan not found in database')
    }

    const results = []

    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        // Update subscription status and downgrade shop plan
        await prisma.$transaction([
          // Mark subscription as expired
          prisma.subscription.update({
            where: { id: subscription.id },
            data: { 
              status: 'expired'
            }
          }),
          // Downgrade shop to free plan
          prisma.shop.update({
            where: { id: subscription.shopId },
            data: { 
              planId: freePlan.id 
            }
          })
        ])

        results.push({
          shopId: subscription.shopId,
          shopName: subscription.shop.name,
          previousPlan: subscription.plan.name,
          status: 'downgraded'
        })

        console.log(`Downgraded shop ${subscription.shop.name} to free plan`)
      } catch (err) {
        console.error(`Failed to process subscription ${subscription.id}:`, err)
        results.push({
          shopId: subscription.shopId,
          status: 'failed',
          error: String(err)
        })
      }
    }

    // Send email notifications to shop owners about expiry
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
      success: true,
      processed: expiredSubscriptions.length,
      results,
      timestamp: now.toISOString()
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check subscriptions',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// Also check for subscriptions expiring soon (7 days warning)
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'cron-secret-2024'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    // Find subscriptions expiring in the next 7 days
    const expiringSoon = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiryDate: {
          gte: now,
          lte: sevenDaysFromNow
        }
      },
      include: {
        shop: {
          include: {
            owner: {
              select: {
                email: true
              }
            }
          }
        },
        plan: true
      }
    })

    console.log(`Found ${expiringSoon.length} subscriptions expiring soon`)

    // Send warning emails to shop owners
    const warnings = []
    for (const sub of expiringSoon) {
      const daysRemaining = Math.ceil((sub.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      try {
        await sendSubscriptionExpiryWarning(
          sub.shop.owner.email,
          sub.shop.name,
          sub.plan.name,
          daysRemaining
        )
      } catch (emailErr) {
        console.error('Failed to send warning email to', sub.shop.owner.email, emailErr)
      }
      warnings.push({
        shopName: sub.shop.name,
        ownerEmail: sub.shop.owner.email,
        planName: sub.plan.name,
        expiryDate: sub.expiryDate,
        daysRemaining,
      })
    }
    return NextResponse.json({
      success: true,
      count: expiringSoon.length,
      warnings,
      message: 'Warning emails should be sent to these users'
    })
  } catch (error: any) {
    console.error('Warning check error:', error)
    return NextResponse.json(
      { error: 'Failed to check expiring subscriptions' },
      { status: 500 }
    )
  }
}
