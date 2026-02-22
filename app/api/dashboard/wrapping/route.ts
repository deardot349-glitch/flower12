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

    const options = await prisma.wrappingOption.findMany({
      where: { shopId: session.user.shopId },
      orderBy: { price: 'asc' }
    })

    return NextResponse.json({ options })
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
    const { name, price, imageUrl } = body

    const option = await prisma.wrappingOption.create({
      data: {
        shopId: session.user.shopId,
        name,
        price,
        imageUrl: imageUrl || null
      }
    })

    return NextResponse.json({ success: true, option })
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
    const { id, available } = body

    const option = await prisma.wrappingOption.findUnique({ where: { id } })
    if (!option || option.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.wrappingOption.update({
      where: { id },
      data: { available }
    })

    return NextResponse.json({ success: true, option: updated })
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

    const option = await prisma.wrappingOption.findUnique({ where: { id } })
    if (!option || option.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.wrappingOption.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
