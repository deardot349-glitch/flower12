import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST — validate a discount code for a given shop and order amount
export async function POST(req: Request) {
  try {
    const { shopId, code, orderAmount } = await req.json()
    if (!shopId || !code) return NextResponse.json({ valid: false, error: 'Missing params' })

    const discount = await prisma.discountCode.findUnique({
      where: { shopId_code: { shopId, code: code.toUpperCase().trim() } },
    })

    if (!discount) return NextResponse.json({ valid: false, error: 'Промокод не знайдено' })
    if (!discount.active) return NextResponse.json({ valid: false, error: 'Промокод неактивний' })
    if (discount.expiresAt && discount.expiresAt < new Date()) return NextResponse.json({ valid: false, error: 'Промокод вже закінчився' })
    if (discount.maxUses && discount.usedCount >= discount.maxUses) return NextResponse.json({ valid: false, error: 'Промокод вже використано максимальну кількість разів' })
    if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
      return NextResponse.json({ valid: false, error: `Мінімальна сума замовлення: ₴${discount.minOrderAmount}` })
    }

    const discountAmount = discount.type === 'percentage'
      ? (orderAmount * discount.value) / 100
      : Math.min(discount.value, orderAmount)

    return NextResponse.json({
      valid: true,
      discountId: discount.id,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount: Math.round(discountAmount * 100) / 100,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Помилка сервера' })
  }
}
