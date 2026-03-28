import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { answerCallbackQuery, editTelegramMessage, buildOrderKeyboard, buildOrderMessage, STATUS_LABELS_UA } from '@/lib/telegram'

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'completed', 'cancelled']

export async function POST(request: Request) {
  try {
    const update = await request.json()

    // ── Handle button presses ─────────────────────────────────────
    if (update.callback_query) {
      const { id: callbackQueryId, data, message } = update.callback_query
      const chatId = String(message.chat.id)
      const messageId = message.message_id

      if (!data) return NextResponse.json({ ok: true })

      // Format: "newStatus:orderId"
      const colonIdx = data.indexOf(':')
      if (colonIdx === -1) {
        await answerCallbackQuery(callbackQueryId, '❓ Невідома дія')
        return NextResponse.json({ ok: true })
      }

      const newStatus = data.slice(0, colonIdx)
      const orderId = data.slice(colonIdx + 1)

      if (!VALID_STATUSES.includes(newStatus) || !orderId) {
        await answerCallbackQuery(callbackQueryId, '❓ Невідома дія')
        return NextResponse.json({ ok: true })
      }

      // Load order + verify it belongs to this chat's shop
      const order = await prisma.order.findFirst({
        where: { id: orderId },
        include: { shop: true },
      })

      if (!order) {
        await answerCallbackQuery(callbackQueryId, '❌ Замовлення не знайдено')
        return NextResponse.json({ ok: true })
      }

      if (order.shop.telegramChatId !== chatId) {
        await answerCallbackQuery(callbackQueryId, '❌ Немає доступу')
        return NextResponse.json({ ok: true })
      }

      // Update DB
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      })

      const label = STATUS_LABELS_UA[newStatus] || newStatus

      // Rebuild message text with updated status line appended
      // Keep original message text clean, append status history
      const existingText: string = message.text || ''
      // Find or replace the last status line
      const statusMarker = '\n\n📊 Статус:'
      const baseText = existingText.includes(statusMarker)
        ? existingText.slice(0, existingText.indexOf(statusMarker))
        : existingText

      const updatedText = `${baseText}${statusMarker} <b>${label}</b>`

      // Build new keyboard for the updated status
      const newKeyboard = buildOrderKeyboard(orderId, newStatus)

      await editTelegramMessage(chatId, messageId, updatedText, newKeyboard)
      await answerCallbackQuery(callbackQueryId, `${label}`)
    }

    // ── Handle text commands ─────────────────────────────────────
    if (update.message?.text) {
      const chatId = String(update.message.chat.id)
      const text = update.message.text.trim()
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

      if (text === '/start' || text === '/getchatid') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `👋 Вітаємо! Ваш Chat ID:\n\n<code>${chatId}</code>\n\nСкопіюйте це число і вставте у Dashboard → Налаштування → Telegram, щоб отримувати замовлення сюди.`,
            parse_mode: 'HTML',
          }),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always 200 to Telegram
  }
}
