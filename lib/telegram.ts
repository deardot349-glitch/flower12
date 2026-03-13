// Telegram Bot service
// Uses the Telegram Bot API to send messages and handle callbacks

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return null
  }

  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }
    if (replyMarkup) {
      body.reply_markup = replyMarkup
    }

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!data.ok) {
      console.error('Telegram API error:', data)
      return { ok: false, error: data.description || 'Unknown error', error_code: data.error_code }
    }
    return data.result
  } catch (err) {
    console.error('Failed to send Telegram message:', err)
    return null
  }
}

export async function editTelegramMessage(chatId: string, messageId: number, text: string) {
  if (!BOT_TOKEN) return null

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
      }),
    })
    const data = await res.json()
    return data.ok ? data.result : null
  } catch (err) {
    console.error('Failed to edit Telegram message:', err)
    return null
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text: string) {
  if (!BOT_TOKEN) return

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    })
  } catch (err) {
    console.error('Failed to answer callback query:', err)
  }
}

export function buildOrderMessage(order: any, shopName: string, flower?: any, currencySymbol = '$') {
  const date = new Date(order.createdAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  let text = `🌸 <b>New Order — ${shopName}</b>\n\n`
  text += `👤 <b>Customer:</b> ${order.customerName}\n`
  text += `📞 <b>Phone:</b> <a href="tel:${order.phone}">${order.phone}</a>\n`
  if (order.email) text += `✉️ <b>Email:</b> ${order.email}\n`
  if (flower) text += `💐 <b>Flower:</b> ${flower.name} — ${currencySymbol}${flower.price}\n`
  if (order.deliveryMethod) text += `🚚 <b>Delivery:</b> ${order.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}\n`
  if (order.deliveryAddress) text += `📍 <b>Address:</b> ${order.deliveryAddress}\n`
  if (order.totalAmount && order.totalAmount > 0) text += `💵 <b>Total:</b> ${currencySymbol}${order.totalAmount}\n`
  if (order.message) text += `\n💬 <b>Message:</b>\n${order.message}\n`
  text += `\n🕐 <i>${date}</i>`

  return text
}

export function buildOrderKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Confirm', callback_data: `confirm:${orderId}` },
        { text: '❌ Cancel', callback_data: `cancel:${orderId}` },
      ],
      [
        { text: '🎉 Mark Completed', callback_data: `complete:${orderId}` },
      ],
    ],
  }
}
