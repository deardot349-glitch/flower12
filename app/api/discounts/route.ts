import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list all discount codes for the shop
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const shop = await prisma.shop.findFirst({ where: { owner: { email: session.user.email } }, select: { id: true } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const codes = await prisma.discountCode.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ codes })
}

// POST — create a new discount code
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const shop = await prisma.shop.findFirst({ where: { owner: { email: session.user.email } }, select: { id: true } })
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { code, type, value, minOrderAmount, maxUses, expiresAt } = body

  if (!code || !type || !value) return NextResponse.json({ error: 'Код, тип та значення обов\'язкові' }, { status: 400 })

  const normalizedCode = code.toUpperCase().trim().replace(/\s+/g, '')

  try {
    const discount = await prisma.discountCode.create({
      data: {
        shopId: shop.id,
        code: normalizedCode,
        type,
        value: parseFloat(value),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
    })
    return NextResponse.json({ code: discount })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Такий код вже існує' }, { status: 409 })
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
