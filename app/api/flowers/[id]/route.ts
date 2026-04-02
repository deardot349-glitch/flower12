import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = session.user.shopId

    if (!shopId) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const body = await request.json()

    // Verify ownership
    const flower = await prisma.flower.findUnique({
      where: { id: params.id }
    })

    if (!flower || flower.shopId !== shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Validate price if provided
    let parsedPrice: number | undefined
    if (body.price !== undefined) {
      parsedPrice = parseFloat(body.price)
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json({ error: 'Невірна ціна' }, { status: 400 })
      }
    }

    // Validate name if provided
    if (body.name !== undefined && !String(body.name).trim()) {
      return NextResponse.json({ error: 'Назва не може бути порожньою' }, { status: 400 })
    }

    const updated = await prisma.flower.update({
      where: { id: params.id },
      data: {
        availability: body.availability ?? flower.availability,
        name: body.name !== undefined ? String(body.name).trim() : flower.name,
        price: parsedPrice ?? flower.price,
        imageUrl: body.imageUrl !== undefined ? (body.imageUrl || null) : flower.imageUrl,
        description: body.description !== undefined ? (body.description?.trim() || null) : flower.description,
        madeAt: body.madeAt !== undefined ? (body.madeAt ? new Date(body.madeAt) : null) : flower.madeAt,
        ...(body.isCustom !== undefined ? { isCustom: Boolean(body.isCustom) } : {}),
      }
    })

    return NextResponse.json({ success: true, flower: updated })
  } catch (error: any) {
    console.error('Flower update error:', error)
    return NextResponse.json(
      { error: 'Failed to update flower' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = session.user.shopId

    if (!shopId) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Verify ownership
    const flower = await prisma.flower.findUnique({
      where: { id: params.id }
    })

    if (!flower || flower.shopId !== shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.flower.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Flower deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete flower' },
      { status: 500 }
    )
  }
}
