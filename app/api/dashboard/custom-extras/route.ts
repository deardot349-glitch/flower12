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
    const extras = await prisma.customExtra.findMany({
      where: { shopId: session.user.shopId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ extras })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { name, description, price, imageUrl } = await request.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const extra = await prisma.customExtra.create({
      data: {
        shopId: session.user.shopId,
        name,
        description: description || null,
        price: parseFloat(price) || 0,
        imageUrl: imageUrl || null,
      },
    })
    return NextResponse.json({ success: true, extra })
  } catch {
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
    const { id, ...data } = body
    const extra = await prisma.customExtra.findUnique({ where: { id } })
    if (!extra || extra.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const updated = await prisma.customExtra.update({ where: { id }, data })
    return NextResponse.json({ success: true, extra: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await request.json()
    const extra = await prisma.customExtra.findUnique({ where: { id } })
    if (!extra || extra.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.customExtra.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
