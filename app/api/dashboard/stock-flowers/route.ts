import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flowers = await prisma.stockFlower.findMany({
      where: { shopId: session.user.shopId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ flowers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, pricePerStem, stockCount, imageUrl } = body

    const flower = await prisma.stockFlower.create({
      data: {
        shopId: session.user.shopId,
        name,
        color,
        pricePerStem,
        stockCount,
        imageUrl: imageUrl || null
      }
    })

    return NextResponse.json({ success: true, flower })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, stockChange } = body

    const flower = await prisma.stockFlower.findUnique({ where: { id } })
    if (!flower || flower.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.stockFlower.update({
      where: { id },
      data: {
        stockCount: Math.max(0, flower.stockCount + stockChange)
      }
    })

    return NextResponse.json({ success: true, flower: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    const flower = await prisma.stockFlower.findUnique({ where: { id } })
    if (!flower || flower.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.stockFlower.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
