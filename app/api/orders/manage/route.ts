import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage, buildOrderKeyboard, STATUS_LABELS_UA } from '@/lib/telegram'

// ── GET — list all orders for this shop ───────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    })

    if (!user?.shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const orders = await prisma.order.findMany({
      where: { shopId: user.shop.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// ── PATCH — update order status ───────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    })

    if (!user?.shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, shopId: user.shop.id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })

    if (user.shop.telegramChatId) {
      try {
        const label    = STATUS_LABELS_UA[status] || status
        const keyboard = buildOrderKeyboard(orderId, status)
        const sym      = user.shop.currency === 'UAH' ? '₴' : user.shop.currency === 'EUR' ? '€' : user.shop.currency === 'GBP' ? '£' : '$'

        const text = [
          `🔄 <b>Статус оновлено — ${user.shop.name}</b>`,
          ``,
          `👤 <b>Клієнт:</b> ${order.customerName}`,
          `📞 <b>Телефон:</b> ${order.phone}`,
          order.totalAmount && order.totalAmount > 0 ? `💵 <b>Сума:</b> ${sym}${order.totalAmount}` : '',
          ``,
          `📊 <b>Новий статус:</b> ${label}`,
          `#${order.id.slice(-6).toUpperCase()}`,
        ].filter(Boolean).join('\n')

        await sendTelegramMessage(user.shop.telegramChatId, text, keyboard)
      } catch (tgErr) {
        console.error('Telegram status update notification failed:', tgErr)
      }
    }

    return NextResponse.json({ success: true, order: updated })
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// ── DELETE — delete one order or all orders older than 30 days ────────────────
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    })

    if (!user?.shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const orderId  = searchParams.get('orderId')
    const clearOld = searchParams.get('clearOld') === '1'

    if (orderId) {
      // Delete a single specific order
      const order = await prisma.order.findFirst({
        where: { id: orderId, shopId: user.shop.id },
      })
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      await prisma.order.delete({ where: { id: orderId } })
      return NextResponse.json({ success: true, message: 'Замовлення видалено' })
    }

    if (clearOld) {
      // Delete all orders older than 30 days for this shop
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const result = await prisma.order.deleteMany({
        where: { shopId: user.shop.id, createdAt: { lt: cutoff } },
      })
      return NextResponse.json({
        success: true,
        message: `Видалено ${result.count} замовлень старших за 30 днів`,
        count: result.count,
      })
    }

    return NextResponse.json({ error: 'Вкажіть orderId або clearOld=1' }, { status: 400 })
  } catch (error) {
    console.error('Failed to delete order(s):', error)
    return NextResponse.json({ error: 'Failed to delete order(s)' }, { status: 500 })
  }
}
