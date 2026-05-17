import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizeString } from '@/lib/validators'
import { logger } from '@/lib/logger'

/**
 * POST /api/discounts/validate
 *
 * Validates a discount code by shopSlug (not shopId — client must never
 * control shopId directly). Returns whether the code is valid plus the
 * calculated discount amount.
 *
 * Body: { shopSlug: string, code: string, orderAmount: number }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { shopSlug, code, orderAmount } = body

    // ── Input validation ──────────────────────────────────────────────────────
    if (!shopSlug || typeof shopSlug !== 'string' || shopSlug.length > 80) {
      return NextResponse.json({ valid: false, error: 'Invalid shop identifier' })
    }
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Code is required' })
    }
    const cleanCode = sanitizeString(code.toUpperCase().trim()).slice(0, 50)
    if (!cleanCode) {
      return NextResponse.json({ valid: false, error: 'Code is required' })
    }

    const amount = typeof orderAmount === 'number' && orderAmount >= 0 ? orderAmount : 0

    // ── Resolve shop server-side ──────────────────────────────────────────────
    const shop = await prisma.shop.findUnique({
      where:  { slug: shopSlug },
      select: { id: true, suspended: true },
    })
    if (!shop || shop.suspended) {
      return NextResponse.json({ valid: false, error: 'Магазин не знайдено' })
    }

    // ── Find the discount code scoped to this shop ────────────────────────────
    const discount = await prisma.discountCode.findUnique({
      where: { shopId_code: { shopId: shop.id, code: cleanCode } },
    })

    if (!discount)                                          return NextResponse.json({ valid: false, error: 'Промокод не знайдено' })
    if (!discount.active)                                   return NextResponse.json({ valid: false, error: 'Промокод неактивний' })
    if (discount.expiresAt && discount.expiresAt < new Date()) return NextResponse.json({ valid: false, error: 'Термін дії промокоду минув' })
    if (discount.maxUses && discount.usedCount >= discount.maxUses) return NextResponse.json({ valid: false, error: 'Промокод вже використано максимальну кількість разів' })
    if (discount.minOrderAmount && amount < discount.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        error: `Мінімальна сума замовлення для цього промокоду: ${discount.minOrderAmount}`,
      })
    }

    const discountAmount = discount.type === 'percentage'
      ? Math.min((amount * discount.value) / 100, amount)
      : Math.min(discount.value, amount)

    return NextResponse.json({
      valid:          true,
      discountId:     discount.id,
      code:           discount.code,
      type:           discount.type,
      value:          discount.value,
      discountAmount: Math.round(discountAmount * 100) / 100,
    })
  } catch (error: unknown) {
    logger.error('discounts/validate', 'Validation error', { error: String(error) })
    return NextResponse.json({ valid: false, error: 'Помилка сервера' })
  }
}
