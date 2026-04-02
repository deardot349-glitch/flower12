import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'

async function getShopWithPlan(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { shop: { include: { plan: true } } },
  })
  return user?.shop ?? null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shop = await getShopWithPlan(session.user.email)
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const planConfig = getPlanConfig(shop.plan.slug)

    // If plan does not allow delivery zones, return empty array (not an error,
    // so the dashboard page can show the gate UI gracefully)
    if (!planConfig.allowDeliveryZones) {
      return NextResponse.json({ zones: [], planAllows: false })
    }

    const zones = await prisma.deliveryZone.findMany({
      where: { shopId: shop.id },
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

    const shop = await getShopWithPlan(session.user.email)
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const planConfig = getPlanConfig(shop.plan.slug)
    if (!planConfig.allowDeliveryZones) {
      return NextResponse.json(
        { error: `Зони доставки недоступні на плані «${planConfig.name}». Перейдіть на Базовий або Преміум план.` },
        { status: 403 }
      )
    }

    const body = await request.json()

    // ── Validation ────────────────────────────────────────────────────────────
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Назва зони обов\'язкова' }, { status: 400 })
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
        shopId: shop.id,
        name: body.name.trim(),
        fee,
        estimatedMinHours: minHours,
        estimatedMaxHours: maxHours,
        sameDayAvailable: body.sameDayAvailable ?? true,
        minimumOrder: Math.max(0, parseFloat(body.minimumOrder) || 0),
        active: body.active !== undefined ? Boolean(body.active) : true,
      },
    })

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Failed to create delivery zone:', error)
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
  }
}
