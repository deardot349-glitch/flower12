import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sanitizeString } from '@/lib/validators'

async function getShopId(session: { user?: { shopId?: string } } | null): Promise<string | null> {
  return session?.user?.shopId ?? null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const shopId  = await getShopId(session)
    if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const zones = await prisma.deliveryZone.findMany({
      where:   { shopId },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ zones, planAllows: true })
  } catch (error: unknown) {
    logger.error('delivery-zones/get', 'Failed to fetch zones', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const shopId  = await getShopId(session)
    if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const cleanName = sanitizeString(String(body.name || '').trim()).slice(0, 200)
    if (!cleanName) {
      return NextResponse.json({ error: "Назва зони обов'язкова" }, { status: 400 })
    }

    const fee = parseFloat(body.fee)
    if (isNaN(fee) || fee < 0 || fee > 100_000) {
      return NextResponse.json({ error: 'Невірна вартість доставки' }, { status: 400 })
    }

    const minHours = parseInt(body.estimatedMinHours ?? '1')
    const maxHours = parseInt(body.estimatedMaxHours ?? '4')
    if (isNaN(minHours) || minHours < 0 || isNaN(maxHours) || maxHours < minHours) {
      return NextResponse.json({ error: 'Невірний час доставки' }, { status: 400 })
    }

    const minimumOrder = Math.max(0, parseFloat(body.minimumOrder) || 0)

    const zone = await prisma.deliveryZone.create({
      data: {
        shopId,
        name:              cleanName,
        fee,
        estimatedMinHours: minHours,
        estimatedMaxHours: maxHours,
        sameDayAvailable:  Boolean(body.sameDayAvailable ?? true),
        minimumOrder,
        active:            body.active !== undefined ? Boolean(body.active) : true,
      },
    })

    return NextResponse.json({ zone })
  } catch (error: unknown) {
    logger.error('delivery-zones/post', 'Failed to create zone', { error: String(error) })
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
  }
}
