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

    const updated = await prisma.flower.update({
      where: { id: params.id },
      data: {
        availability: body.availability ?? flower.availability,
        name: body.name ?? flower.name,
        price: body.price ?? flower.price,
        imageUrl: body.imageUrl ?? flower.imageUrl,
        description: body.description ?? flower.description,
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
