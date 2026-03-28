import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage, buildOrderKeyboard, STATUS_LABELS_UA } from '@/lib/telegram'

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

    // Make sure the order belongs to this shop
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

    // Notify via Telegram when status changes (if shop has Telegram connected)
    if (user.shop.telegramChatId) {
      try {
        const label = STATUS_LABELS_UA[status] || status
        const keyboard = buildOrderKeyboard(orderId, status)
        const sym = user.shop.currency === 'UAH' ? '₴' : user.shop.currency === 'EUR' ? '€' : user.shop.currency === 'GBP' ? '£' : '$'

        const text = [
          `🔄 <b>Статус оновлено — ${user.shop.name}</b>`,
          ``,
          `👤 <b>Клієнт:</b> ${order.customerName}`,
          `📞 <b>Телефон:</b> ${order.phone}`,
          order.totalAmount && order.totalAmount > 0 ? `💵 <b>Сума:</b> ${sym}${order.totalAmount}` : '',
          ``,
          `📊 <b>Новий статус:</b> ${label}`,
          `#${order.id.slice(-6).toUpperCase()}`,
        ].filter(l => l !== null && l !== undefined && (l !== '' || true)).join('\n')

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
