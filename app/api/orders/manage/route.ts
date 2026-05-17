import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage, buildOrderKeyboard, STATUS_LABELS_UA } from '@/lib/telegram'
import { logger } from '@/lib/logger'

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'completed', 'cancelled']

// ── Auth helper: resolve shop from session, always via DB ────────────────────
async function getShopFromSession(session: { user?: { shopId?: string; email?: string } } | null) {
  if (!session?.user) return null
  // Use shopId from JWT token first (fast path)
  if (session.user.shopId) {
    return prisma.shop.findUnique({
      where: { id: session.user.shopId },
      select: { id: true, telegramChatId: true, currency: true, name: true },
    })
  }
  // Fallback via email (shouldn't normally be needed)
  if (session.user.email) {
    return prisma.shop.findFirst({
      where: { owner: { email: session.user.email } },
      select: { id: true, telegramChatId: true, currency: true, name: true },
    })
  }
  return null
}

// ── GET — list all orders for this shop ───────────────────────────────────────
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const shop = await getShopFromSession(session)
    if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const page         = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit        = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    const where = {
      shopId: shop.id,
      ...(statusFilter && VALID_STATUSES.includes(statusFilter) ? { status: statusFilter } : {}),
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, limit })
  } catch (error: unknown) {
    logger.error('orders/manage/get', 'Failed to fetch orders', { error: String(error) })
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// ── PATCH — update order status or notes ──────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const shop = await getShopFromSession(session)
    if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { orderId, status, ownerNotes } = body

    if (!orderId || typeof orderId !== 'string' || orderId.length > 50) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // ── Notes-only update ─────────────────────────────────────────────────────
    if (ownerNotes !== undefined && !status) {
      const updated = await prisma.order.update({
        where: { id: orderId, shopId: shop.id }, // ownership check in query
        data:  { ownerNotes: String(ownerNotes || '').slice(0, 1000) || null },
      })
      return NextResponse.json({ success: true, order: updated })
    }

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // ── Verify order belongs to this shop (scoped update) ────────────────────
    const order = await prisma.order.findFirst({
      where: { id: orderId, shopId: shop.id },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data:  { status },
    })

    // ── Deduct stock when order is completed (fires once) ────────────────────
    if (status === 'completed' && order.status !== 'completed' && order.customBouquet) {
      try {
        const bouquet = JSON.parse(order.customBouquet as string)
        const flowers: Array<{ id: string; quantity: number }> = bouquet.flowers || []
        await Promise.all(
          flowers.map(f =>
            prisma.stockFlower.updateMany({
              where: { id: f.id, shopId: shop.id },
              data:  { stockCount: { decrement: f.quantity } },
            })
          )
        )
      } catch (stockErr) {
        logger.error('orders/stock-deduct', 'Stock deduction failed after order completion', {
          orderId, error: String(stockErr),
        })
        // Non-fatal — order already marked completed
      }
    }

    // ── Telegram status notification ──────────────────────────────────────────
    if (shop.telegramChatId) {
      const label    = STATUS_LABELS_UA[status] || status
      const keyboard = buildOrderKeyboard(orderId, status)
      const sym      = shop.currency === 'UAH' ? '₴' : shop.currency === 'EUR' ? '€' : shop.currency === 'GBP' ? '£' : '$'

      const text = [
        `🔄 <b>Статус оновлено — ${shop.name}</b>`,
        '',
        `👤 <b>Клієнт:</b> ${order.customerName}`,
        `📞 <b>Телефон:</b> ${order.phone}`,
        order.totalAmount && order.totalAmount > 0 ? `💵 <b>Сума:</b> ${sym}${order.totalAmount}` : '',
        '',
        `📊 <b>Новий статус:</b> ${label}`,
        `#${order.id.slice(-6).toUpperCase()}`,
      ].filter(Boolean).join('\n')

      sendTelegramMessage(shop.telegramChatId, text, keyboard).catch(() => {})
    }

    return NextResponse.json({ success: true, order: updated })
  } catch (error: unknown) {
    logger.error('orders/manage/patch', 'Failed to update order', { error: String(error) })
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// ── DELETE — delete one order or old orders ───────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const shop = await getShopFromSession(session)
    if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const orderId  = searchParams.get('orderId')
    const clearOld = searchParams.get('clearOld') === '1'

    if (orderId) {
      if (typeof orderId !== 'string' || orderId.length > 50) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
      }
      // Scoped delete: WHERE includes shopId for ownership check
      const deleted = await prisma.order.deleteMany({
        where: { id: orderId, shopId: shop.id },
      })
      if (deleted.count === 0) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, message: 'Замовлення видалено' })
    }

    if (clearOld) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const result = await prisma.order.deleteMany({
        where: { shopId: shop.id, createdAt: { lt: cutoff } },
      })
      return NextResponse.json({
        success: true,
        message: `Видалено ${result.count} замовлень старших за 30 днів`,
        count:   result.count,
      })
    }

    return NextResponse.json({ error: 'Вкажіть orderId або clearOld=1' }, { status: 400 })
  } catch (error: unknown) {
    logger.error('orders/manage/delete', 'Failed to delete order(s)', { error: String(error) })
    return NextResponse.json({ error: 'Failed to delete order(s)' }, { status: 500 })
  }
}
