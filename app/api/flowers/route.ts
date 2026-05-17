import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'
import { logger } from '@/lib/logger'
import { sanitizeString } from '@/lib/validators'

const MAX_NAME_LEN = 200
const MAX_DESC_LEN = 1000
const MAX_IMG_LEN  = 500

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Не авторизований' }, { status: 401 })
    }

    const shopId = session.user.shopId
    const body = await request.json()
    const { name, price, imageUrl, availability, description, madeAt, isCustom } = body

    // ── Validate name ─────────────────────────────────────────────────────────
    const cleanName = sanitizeString(String(name || '').trim()).slice(0, MAX_NAME_LEN)
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: "Назва має містити мінімум 2 символи" }, { status: 400 })
    }

    // ── Validate price ────────────────────────────────────────────────────────
    if (price === undefined || price === null) {
      return NextResponse.json({ error: "Ціна обов'язкова" }, { status: 400 })
    }
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 1_000_000) {
      return NextResponse.json({ error: 'Невірна ціна' }, { status: 400 })
    }

    // ── Validate availability ─────────────────────────────────────────────────
    const VALID_AVAILABILITY = ['in_stock', 'limited', 'out_of_stock']
    const cleanAvailability = availability || 'in_stock'
    if (!VALID_AVAILABILITY.includes(cleanAvailability)) {
      return NextResponse.json({ error: 'Невірний статус наявності' }, { status: 400 })
    }

    // ── Validate image URL ────────────────────────────────────────────────────
    let cleanImageUrl: string | null = null
    if (imageUrl) {
      const img = String(imageUrl).trim().slice(0, MAX_IMG_LEN)
      try {
        const parsed = new URL(img)
        if (['http:', 'https:'].includes(parsed.protocol)) {
          cleanImageUrl = img
        }
      } catch {
        return NextResponse.json({ error: 'Невірний URL зображення' }, { status: 400 })
      }
    }

    // ── Validate date ─────────────────────────────────────────────────────────
    let cleanMadeAt: Date | null = null
    if (madeAt) {
      const d = new Date(madeAt)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Невірна дата виготовлення' }, { status: 400 })
      }
      cleanMadeAt = d
    }

    // ── Check plan bouquet limit ──────────────────────────────────────────────
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { plan: true, _count: { select: { flowers: true } } },
    })
    if (!shop) {
      return NextResponse.json({ error: 'Магазин не знайдено' }, { status: 404 })
    }

    const planConfig = getPlanConfig(shop.plan.slug)
    if (shop._count.flowers >= planConfig.maxBouquets) {
      return NextResponse.json(
        {
          error: `Ліміт плану "${planConfig.name}": максимум ${planConfig.maxBouquets} букетів. Видаліть існуючий або оновіть план.`,
          code: 'BOUQUET_LIMIT_REACHED',
        },
        { status: 403 }
      )
    }

    const flower = await prisma.flower.create({
      data: {
        shopId,
        name:         cleanName,
        price:        parsedPrice,
        imageUrl:     cleanImageUrl,
        availability: cleanAvailability,
        description:  description ? sanitizeString(String(description).trim()).slice(0, MAX_DESC_LEN) || null : null,
        madeAt:       cleanMadeAt,
        ...(isCustom !== undefined ? { isCustom: isCustom === true } : {}),
      },
    })

    return NextResponse.json({ success: true, flower })
  } catch (error: unknown) {
    logger.error('flowers/post', 'Flower creation failed', { error: String(error) })
    return NextResponse.json({ error: 'Помилка збереження букету' }, { status: 500 })
  }
}
