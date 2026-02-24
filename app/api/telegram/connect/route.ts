import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'
import { getPlanConfig } from '@/lib/plans'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await request.json()
    if (!chatId || !chatId.trim()) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: { include: { plan: true } } },
    })

    if (!user?.shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Check plan allows Telegram
    const planConfig = getPlanConfig(user.shop.plan.slug)
    if (!planConfig.allowTelegram) {
      return NextResponse.json(
        { error: 'Telegram notifications are not available on the Free plan. Upgrade to Basic or Premium to use this feature.' },
        { status: 403 }
      )
    }

    const testMsg = await sendTelegramMessage(
      chatId.trim(),
      `✅ <b>Telegram підключено!</b>\n\n🌸 Ваш магазин "<b>${user.shop.name}</b>" тепер надсилатиме сповіщення про замовлення сюди.\n\nКоли надійде замовлення, ви побачите деталі клієнта і зможете підтвердити або скасувати прямо з Telegram!`
    )

    if (!testMsg) {
      return NextResponse.json(
        { error: 'Could not send message to that Chat ID. Make sure you have started the bot first.' },
        { status: 400 }
      )
    }

    await prisma.shop.update({
      where: { id: user.shop.id },
      data: { telegramChatId: chatId.trim() },
    })

    return NextResponse.json({ success: true, message: 'Telegram підключено! Перевірте Telegram — туди надійшло тестове повідомлення.' })
  } catch (error) {
    console.error('Telegram connect error:', error)
    return NextResponse.json({ error: 'Failed to connect Telegram' }, { status: 500 })
  }
}

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

    await prisma.shop.update({
      where: { id: user.shop.id },
      data: { telegramChatId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
