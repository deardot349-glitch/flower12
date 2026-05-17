import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  answerCallbackQuery,
  editTelegramMessage,
  buildOrderKeyboard,
  STATUS_LABELS_UA,
} from '@/lib/telegram'
import { logger } from '@/lib/logger'

const VALID_STATUSES = [
  'pending', 'confirmed', 'preparing', 'ready',
  'delivering', 'delivered', 'completed', 'cancelled',
]

/**
 * Validate Telegram webhook secret token.
 * Telegram sends it in the X-Telegram-Bot-Api-Secret-Token header when configured.
 * If TELEGRAM_WEBHOOK_SECRET is set, we enforce this check.
 */
function validateWebhookSecret(request: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret) return true // Not configured — skip (dev mode)
  const headerVal = request.headers.get('x-telegram-bot-api-secret-token')
  return headerVal === secret
}

export async function POST(request: Request) {
  // Telegram always expects HTTP 200, even on error — so we wrap everything
  // and return { ok: true } regardless.
  try {
    if (!validateWebhookSecret(request)) {
      logger.warn('telegram/webhook', 'Invalid webhook secret — request rejected')
      return NextResponse.json({ ok: true }) // Silently reject; don't reveal why
    }

    const update = await request.json()

    // ── Handle inline button presses ──────────────────────────────────────────
    if (update.callback_query) {
      const { id: callbackQueryId, data, message } = update.callback_query
      const chatId    = String(message?.chat?.id)
      const messageId = message?.message_id

      if (!data || !chatId || !messageId) {
        await answerCallbackQuery(callbackQueryId, '❓ Помилка')
        return NextResponse.json({ ok: true })
      }

      // Payload format: "newStatus:orderId"
      const colonIdx = data.indexOf(':')
      if (colonIdx === -1) {
        await answerCallbackQuery(callbackQueryId, '❓ Невідома дія')
        return NextResponse.json({ ok: true })
      }

      const newStatus = data.slice(0, colonIdx)
      const orderId   = data.slice(colonIdx + 1)

      if (!VALID_STATUSES.includes(newStatus) || !orderId || orderId.length > 50) {
        await answerCallbackQuery(callbackQueryId, '❓ Невідома дія')
        return NextResponse.json({ ok: true })
      }

      // Load order — verify it belongs to the shop that owns this Telegram chat
      const order = await prisma.order.findFirst({
        where:   { id: orderId },
        include: { shop: { select: { telegramChatId: true, name: true } } },
      })

      if (!order) {
        await answerCallbackQuery(callbackQueryId, '❌ Замовлення не знайдено')
        return NextResponse.json({ ok: true })
      }

      if (order.shop.telegramChatId !== chatId) {
        await answerCallbackQuery(callbackQueryId, '❌ Немає доступу')
        return NextResponse.json({ ok: true })
      }

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data:  { status: newStatus },
      })

      const label = STATUS_LABELS_UA[newStatus] || newStatus

      // Rebuild message text: replace the last status marker if present
      const existingText: string = message.text || ''
      const statusMarker = '\n\n📊 Статус:'
      const baseText = existingText.includes(statusMarker)
        ? existingText.slice(0, existingText.indexOf(statusMarker))
        : existingText

      const updatedText = `${baseText}${statusMarker} <b>${label}</b>`
      const newKeyboard = buildOrderKeyboard(orderId, newStatus)

      await editTelegramMessage(chatId, messageId, updatedText, newKeyboard)
      await answerCallbackQuery(callbackQueryId, label)

      logger.info('telegram/webhook', 'Order status updated via Telegram', {
        orderId, status: newStatus,
      })
    }

    // ── Handle text commands ──────────────────────────────────────────────────
    if (update.message?.text) {
      const chatId = String(update.message.chat.id)
      const text   = String(update.message.text).trim()
      const token  = process.env.TELEGRAM_BOT_TOKEN

      if (!token) {
        logger.error('telegram/webhook', 'TELEGRAM_BOT_TOKEN not set')
        return NextResponse.json({ ok: true })
      }

      if (text === '/start' || text === '/getchatid') {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id:    chatId,
            parse_mode: 'HTML',
            text: [
              `👋 <b>Вітаємо у FlowerGoUa!</b>`,
              ``,
              `Ваш Chat ID:`,
              `<code>${chatId}</code>`,
              ``,
              `Скопіюйте це число і вставте у:`,
              `<b>Dashboard → Налаштування → Telegram Chat ID</b>`,
              ``,
              `Після цього всі нові замовлення будуть приходити сюди з кнопками для швидкого підтвердження.`,
            ].join('\n'),
          }),
        })
      }
    }
  } catch (error: unknown) {
    // Always 200 to Telegram to prevent retries, but log the error
    logger.error('telegram/webhook', 'Webhook handler threw', { error: String(error) })
  }

  return NextResponse.json({ ok: true })
}
