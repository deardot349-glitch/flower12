import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Не авторизований' }, { status: 401 })
    }

    const shopId = session.user.shopId
    const body = await request.json()
    const { name, price, imageUrl, availability, description, madeAt, isCustom } = body

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ error: "Назва та ціна обов'язкові" }, { status: 400 })
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Невірна ціна' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { plan: true, _count: { select: { flowers: true } } },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
    }

    const planConfig = getPlanConfig(shop.plan.slug)
    const currentCount = shop._count.flowers

    if (currentCount >= planConfig.maxBouquets) {
      return NextResponse.json(
        {
          error: `Ліміт вашого плану (${planConfig.name}): максимум ${planConfig.maxBouquets} букетів. Видаліть існуючий або перейдіть на вищий план.`,
          code: 'BOUQUET_LIMIT_REACHED',
        },
        { status: 403 }
      )
    }

    const flower = await prisma.flower.create({
      data: {
        shopId,
        name: String(name).trim(),
        price: parsedPrice,
        imageUrl: imageUrl || null,
        availability: availability || 'in_stock',
        description: description?.trim() || null,
        madeAt: madeAt ? new Date(madeAt) : null,
        ...(isCustom !== undefined ? { isCustom: isCustom === true } : {}),
      },
    })

    return NextResponse.json({ success: true, flower })
  } catch (error: any) {
    console.error('Flower creation error:', error)
    return NextResponse.json({ error: 'Помилка збереження букету' }, { status: 500 })
  }
}
