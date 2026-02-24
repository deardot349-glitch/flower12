import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { answerCallbackQuery, editTelegramMessage } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const update = await request.json()

    // Handle button presses (callback_query)
    if (update.callback_query) {
      const { id: callbackQueryId, data, message } = update.callback_query
      const chatId = String(message.chat.id)
      const messageId = message.message_id

      if (!data) return NextResponse.json({ ok: true })

      const [action, orderId] = data.split(':')

      if (!orderId || !['confirm', 'cancel', 'complete'].includes(action)) {
        await answerCallbackQuery(callbackQueryId, 'Unknown action')
        return NextResponse.json({ ok: true })
      }

      // Find the order and make sure it belongs to a shop with this telegram chat
      const order = await prisma.order.findFirst({
        where: { id: orderId },
        include: {
          shop: true,
        },
      })

      if (!order) {
        await answerCallbackQuery(callbackQueryId, '❌ Order not found')
        return NextResponse.json({ ok: true })
      }

      if (order.shop.telegramChatId !== chatId) {
        await answerCallbackQuery(callbackQueryId, '❌ Not authorized')
        return NextResponse.json({ ok: true })
      }

      const statusMap: Record<string, string> = {
        confirm: 'confirmed',
        cancel: 'cancelled',
        complete: 'completed',
      }

      const newStatus = statusMap[action]

      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      })

      const statusEmoji: Record<string, string> = {
        confirmed: '✅ Confirmed',
        cancelled: '❌ Cancelled',
        completed: '🎉 Completed',
      }

      // Update the Telegram message to show the new status (remove buttons)
      const updatedText = message.text + `\n\n<b>Status updated: ${statusEmoji[newStatus]}</b>`
      await editTelegramMessage(chatId, messageId, updatedText)
      await answerCallbackQuery(callbackQueryId, `Order ${statusEmoji[newStatus]}!`)
    }

    // Handle /start or /getchatid text messages
    if (update.message?.text) {
      const chatId = String(update.message.chat.id)
      const text = update.message.text

      if (text === '/start' || text === '/getchatid') {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `👋 Hello! Your Chat ID is:\n\n<code>${chatId}</code>\n\nCopy this and paste it in your shop dashboard → Settings → Telegram to start receiving orders here!`,
            parse_mode: 'HTML',
          }),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}
