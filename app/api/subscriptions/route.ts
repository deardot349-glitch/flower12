import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.shopId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { planSlug, cardNumber, cardExpiry, cardCvc, cardHolderName } = await request.json()

    // Validation
    if (!planSlug || !cardNumber || !cardExpiry || !cardCvc || !cardHolderName) {
      return NextResponse.json(
        { error: 'All payment fields are required' },
        { status: 400 }
      )
    }

    const planConfig = getPlanConfig(planSlug)
    const plan = await prisma.plan.findUnique({
      where: { slug: planConfig.slug }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    if (plan.price === 0) {
      return NextResponse.json(
        { error: 'Free plan does not require payment' },
        { status: 400 }
      )
    }

    // Extract last 4 digits and card type (basic detection)
    const last4 = cardNumber.replace(/\s/g, '').slice(-4)
    const firstDigit = cardNumber.replace(/\s/g, '')[0]
    let cardType = 'Unknown'
    if (firstDigit === '4') cardType = 'Visa'
    else if (firstDigit === '5') cardType = 'Mastercard'
    else if (firstDigit === '3') cardType = 'Amex'

    // Create subscription and payment record
    const subscription = await prisma.subscription.create({
      data: {
        shopId: session.user.shopId,
        planId: plan.id,
        status: 'pending',
        payment: {
          create: {
            cardLast4: last4,
            cardType,
            cardHolderName: cardHolderName.trim(),
            amount: plan.price,
            status: 'pending'
          }
        }
      },
      include: {
        payment: true,
        plan: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully. Your plan will be activated once payment is verified.',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.plan.name
      }
    })
  } catch (error: any) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.shopId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        shopId: session.user.shopId
      },
      include: {
        plan: true,
        payment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ subscriptions })
  } catch (error: any) {
    console.error('Get subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
