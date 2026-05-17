import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'
import { logger } from '@/lib/logger'

function detectCardType(cardNumber: string): string {
  const first = cardNumber.replace(/\s/g, '')[0]
  if (first === '4') return 'Visa'
  if (first === '5') return 'Mastercard'
  if (first === '3') return 'Amex'
  return 'Card'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planSlug, cardNumber, cardExpiry, cardCvc, cardHolderName } = await request.json()

    // ── Validate required fields ──────────────────────────────────────────────
    if (!planSlug || !cardNumber || !cardExpiry || !cardCvc || !cardHolderName) {
      return NextResponse.json({ error: 'All payment fields are required' }, { status: 400 })
    }

    const planConfig = getPlanConfig(planSlug)
    const plan = await prisma.plan.findUnique({ where: { slug: planConfig.slug } })

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }
    if (plan.price === 0) {
      return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 })
    }

    // ── Extract only last 4 digits — NEVER persist full card details ──────────
    const rawNumber = cardNumber.replace(/\s/g, '')
    if (!/^\d{13,19}$/.test(rawNumber)) {
      return NextResponse.json({ error: 'Invalid card number' }, { status: 400 })
    }
    const last4    = rawNumber.slice(-4)
    const cardType = detectCardType(rawNumber)

    const cleanHolderName = String(cardHolderName).trim().slice(0, 100)
    if (!cleanHolderName) {
      return NextResponse.json({ error: 'Cardholder name is required' }, { status: 400 })
    }

    // ── Create subscription with minimal payment record ───────────────────────
    const subscription = await prisma.subscription.create({
      data: {
        shopId: session.user.shopId,
        planId: plan.id,
        status: 'pending',
        payment: {
          create: {
            cardLast4:      last4,
            cardType,
            cardHolderName: cleanHolderName,
            amount:         plan.price,
            status:         'pending',
            // Full card number, expiry, and CVV are intentionally NOT stored
          },
        },
      },
      include: { payment: true, plan: true },
    })

    logger.info('subscriptions/post', 'New subscription request created', {
      shopId:  session.user.shopId,
      planSlug: plan.slug,
      subId:   subscription.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Заявку прийнято! Ваш план буде активовано після перевірки оплати (до 24 год).',
      subscription: {
        id:       subscription.id,
        status:   subscription.status,
        planName: subscription.plan.name,
      },
    })
  } catch (error: unknown) {
    logger.error('subscriptions/post', 'Failed to process subscription', { error: String(error) })
    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await prisma.subscription.findMany({
      where:   { shopId: session.user.shopId },
      include: { plan: true, payment: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ subscriptions })
  } catch (error: unknown) {
    logger.error('subscriptions/get', 'Failed to fetch subscriptions', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}
