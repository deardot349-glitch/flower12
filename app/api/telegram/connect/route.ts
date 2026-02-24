import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'

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
      include: { shop: true },
    })

    if (!user?.shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Send a test message to verify the chat ID works
    const testMsg = await sendTelegramMessage(
      chatId.trim(),
      `✅ <b>Telegram connected!</b>\n\n🌸 Your shop "<b>${user.shop.name}</b>" will now send order notifications here.\n\nWhen an order comes in, you'll see the customer's details and can confirm or cancel right from Telegram!`
    )

    if (!testMsg) {
      return NextResponse.json(
        { error: 'Could not send message to that Chat ID. Make sure you have started the bot first.' },
        { status: 400 }
      )
    }

    // Save the chat ID to the shop
    await prisma.shop.update({
      where: { id: user.shop.id },
      data: { telegramChatId: chatId.trim() },
    })

    return NextResponse.json({ success: true, message: 'Telegram connected! Check your Telegram for a test message.' })
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
