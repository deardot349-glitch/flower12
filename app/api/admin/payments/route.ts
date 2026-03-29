import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentApprovedEmail } from '@/lib/email/service'

// ─── Auth helper ─────────────────────────────────────────────────────────────
// ADMIN_SECRET must be set in .env — no hardcoded fallback in production.
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

export async function GET(request: Request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingPayments = await prisma.payment.findMany({
      where: { status: 'pending' },
      include: {
        subscription: {
          include: {
            shop: {
              include: { owner: { select: { email: true } } },
            },
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ payments: pendingPayments })
  } catch (error: any) {
    console.error('Admin fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch pending payments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId, action, notes } = await request.json()

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
            shop: { include: { owner: true } },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (action === 'approve') {
      const startDate  = new Date()
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + payment.subscription.plan.durationDays)

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'approved', approvedAt: new Date(), notes: notes || null },
        }),
        prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status:     'active',
            startDate,
            expiryDate: payment.subscription.plan.durationDays > 0 ? expiryDate : null,
          },
        }),
        prisma.shop.update({
          where: { id: payment.subscription.shopId },
          data:  { planId: payment.subscription.planId },
        }),
      ])

      try {
        await sendPaymentApprovedEmail(
          payment.subscription.shop.owner.email,
          payment.subscription.shop.name,
          payment.subscription.plan.name,
          expiryDate
        )
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
      }

      return NextResponse.json({ success: true, message: 'Payment approved and subscription activated' })
    }

    if (action === 'reject') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data:  { status: 'rejected', notes: notes || null },
        }),
        prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data:  { status: 'cancelled' },
        }),
      ])
      return NextResponse.json({ success: true, message: 'Payment rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Admin action error:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
