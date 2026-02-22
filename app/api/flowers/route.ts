import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = session.user.shopId

    if (!shopId) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }
    const { name, price, imageUrl, availability, description } = await request.json()

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify shop ownership and load plan
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { plan: true, _count: { select: { flowers: true } } },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Enforce bouquet limit based on plan
    const planConfig = getPlanConfig(shop.plan.slug)
    const currentCount = shop._count.flowers

    if (currentCount >= planConfig.maxBouquets) {
      return NextResponse.json(
        {
          error: `Your current plan (${planConfig.name}) allows up to ${planConfig.maxBouquets} bouquets. Please remove an existing bouquet or upgrade your plan to add more.`,
          code: 'BOUQUET_LIMIT_REACHED',
        },
        { status: 403 }
      )
    }

    const flower = await prisma.flower.create({
      data: {
        shopId,
        name,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        availability: availability || 'in_stock',
        description: description || null,
      }
    })

    return NextResponse.json({ success: true, flower })
  } catch (error: any) {
    console.error('Flower creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create flower' },
      { status: 500 }
    )
  }
}
