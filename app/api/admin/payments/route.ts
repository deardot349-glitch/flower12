import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentApprovedEmail } from '@/lib/email/service'

// Simple admin check - in production, use proper authentication
// For now, we'll use a simple secret key
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin-secret-2024'

export async function GET(request: Request) {
  try {
    // Accept secret from Authorization header (preferred) or query param (legacy fallback)
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const secret = authHeader?.replace('Bearer ', '') || searchParams.get('secret')

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pending'
      },
      include: {
        subscription: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ payments: pendingPayments })
  } catch (error: any) {
    console.error('Admin fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { secret, paymentId, action, notes } = await request.json()

    if (secret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: 'Payment ID and action are required' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            plan: true,
            shop: {
              include: {
                owner: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      const startDate = new Date()
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + payment.subscription.plan.durationDays)

      // Update payment and subscription
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'approved',
            approvedAt: new Date(),
            notes: notes || null
          }
        }),
        prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'active',
            startDate,
            expiryDate: payment.subscription.plan.durationDays > 0 ? expiryDate : null
          }
        }),
        // Update shop's plan
        prisma.shop.update({
          where: { id: payment.subscription.shopId },
          data: {
            planId: payment.subscription.planId
          }
        })
      ])

      // Send approval email
      try {
        await sendPaymentApprovedEmail(
          payment.subscription.shop.owner.email,
          payment.subscription.shop.name,
          payment.subscription.plan.name,
          expiryDate
        )
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
        // Don't fail the approval if email fails
      }

      return NextResponse.json({
        success: true,
        message: 'Payment approved and subscription activated'
      })
    } else if (action === 'reject') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'rejected',
            notes: notes || null
          }
        }),
        prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'cancelled'
          }
        })
      ])

      return NextResponse.json({
        success: true,
        message: 'Payment rejected'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Admin action error:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}
