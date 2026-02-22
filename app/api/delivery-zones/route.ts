import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    })

    if (!user?.shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const zones = await prisma.deliveryZone.findMany({
      where: { shopId: user.shop.id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ zones })
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    })

    if (!user?.shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const body = await request.json()
    
    const zone = await prisma.deliveryZone.create({
      data: {
        shopId: user.shop.id,
        name: body.name,
        fee: body.fee,
        estimatedMinHours: body.estimatedMinHours,
        estimatedMaxHours: body.estimatedMaxHours,
        sameDayAvailable: body.sameDayAvailable,
        minimumOrder: body.minimumOrder || 0,
        active: body.active !== undefined ? body.active : true,
      },
    })

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Failed to create delivery zone:', error)
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
  }
}
