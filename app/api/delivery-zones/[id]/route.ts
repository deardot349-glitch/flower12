import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const zone = await prisma.deliveryZone.update({
      where: { 
        id: params.id,
        shopId: user.shop.id, // Ensure user owns this zone
      },
      data: {
        name: body.name,
        fee: body.fee,
        estimatedMinHours: body.estimatedMinHours,
        estimatedMaxHours: body.estimatedMaxHours,
        sameDayAvailable: body.sameDayAvailable,
        minimumOrder: body.minimumOrder,
        active: body.active,
      },
    })

    return NextResponse.json({ zone })
  } catch (error) {
    console.error('Failed to update delivery zone:', error)
    return NextResponse.json({ error: 'Failed to update zone' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    await prisma.deliveryZone.delete({
      where: { 
        id: params.id,
        shopId: user.shop.id, // Ensure user owns this zone
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete delivery zone:', error)
    return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 })
  }
}
