import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getShop(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { shop: true },
  })
  return user?.shop ?? null
}

// All plans can use delivery zones — it's no longer a paid differentiator.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shop = await getShop(session.user.email)
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const zones = await prisma.deliveryZone.findMany({
      where:   { shopId: shop.id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ zones, planAllows: true })
  } catch (error) {
    console.error('Failed to fetch delivery zones:', error)
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shop = await getShop(session.user.email)
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Назва зони обов'язкова" }, { status: 400 })
    }
    const fee = parseFloat(body.fee)
    if (isNaN(fee) || fee < 0) {
      return NextResponse.json({ error: 'Невірна вартість доставки' }, { status: 400 })
    }
    const minHours = parseInt(body.estimatedMinHours ?? '1')
    const maxHours = parseInt(body.estimatedMaxHours ?? '4')
    if (isNaN(minHours) || minHours < 0 || isNaN(maxHours) || maxHours < minHours) {
      return NextResponse.json({ error: 'Невірний час доставки' }, { status: 400 })
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        shopId:            shop.id,
        name:              body.name.trim(),
        fee,
        estimatedMinHours: minHours,
        estimatedMaxHours: maxHours,
        sameDayAvailable:  body.sameDayAvailable ?? true,
        minimumOrder:      Math.max(0, parseFloat(body.minimumOrder) || 0),
        active:            body.active !== undefined ? Boolean(body.active) : true,
      },
    })

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Failed to create delivery zone:', error)
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
  }
}
