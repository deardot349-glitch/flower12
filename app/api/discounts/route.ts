import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sanitizeString } from '@/lib/validators'

const VALID_TYPES = ['percentage', 'fixed']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const codes = await prisma.discountCode.findMany({
      where:   { shopId: session.user.shopId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ codes })
  } catch (error: unknown) {
    logger.error('discounts/get', 'Failed to list discount codes', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch discount codes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, type, value, minOrderAmount, maxUses, expiresAt } = body

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!code) return NextResponse.json({ error: "Код обов'язковий" }, { status: 400 })
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Тип має бути 'percentage' або 'fixed'" }, { status: 400 })
    }
    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Значення знижки обов'язкове" }, { status: 400 })
    }

    const parsedValue = parseFloat(value)
    if (isNaN(parsedValue) || parsedValue <= 0 || parsedValue > (type === 'percentage' ? 100 : 1_000_000)) {
      return NextResponse.json({ error: 'Невірне значення знижки' }, { status: 400 })
    }

    const normalizedCode = sanitizeString(code.toUpperCase().trim().replace(/\s+/g, '')).slice(0, 50)
    if (!normalizedCode || normalizedCode.length < 2) {
      return NextResponse.json({ error: 'Код занадто короткий (мінімум 2 символи)' }, { status: 400 })
    }

    let parsedMinOrder: number | null = null
    if (minOrderAmount !== undefined && minOrderAmount !== null && minOrderAmount !== '') {
      parsedMinOrder = parseFloat(minOrderAmount)
      if (isNaN(parsedMinOrder) || parsedMinOrder < 0) {
        return NextResponse.json({ error: 'Невірна мінімальна сума замовлення' }, { status: 400 })
      }
    }

    let parsedMaxUses: number | null = null
    if (maxUses !== undefined && maxUses !== null && maxUses !== '') {
      parsedMaxUses = parseInt(maxUses)
      if (isNaN(parsedMaxUses) || parsedMaxUses < 1) {
        return NextResponse.json({ error: 'Максимальна кількість використань має бути ≥1' }, { status: 400 })
      }
    }

    let parsedExpiresAt: Date | null = null
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt)
      if (isNaN(parsedExpiresAt.getTime())) {
        return NextResponse.json({ error: 'Невірна дата закінчення' }, { status: 400 })
      }
      if (parsedExpiresAt < new Date()) {
        return NextResponse.json({ error: 'Дата закінчення має бути в майбутньому' }, { status: 400 })
      }
    }

    const discount = await prisma.discountCode.create({
      data: {
        shopId:         session.user.shopId,
        code:           normalizedCode,
        type,
        value:          parsedValue,
        minOrderAmount: parsedMinOrder ?? 0,
        maxUses:        parsedMaxUses,
        expiresAt:      parsedExpiresAt,
        active:         true,
      },
    })

    return NextResponse.json({ code: discount })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Промокод з таким кодом вже існує' }, { status: 409 })
    }
    logger.error('discounts/post', 'Failed to create discount code', { error: String(error) })
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 })
  }
}
