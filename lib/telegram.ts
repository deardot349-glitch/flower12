// Telegram Bot service
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Escape HTML special chars — prevents injection when using parse_mode:'HTML'
function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return null
  }

  try {
    const body: any = { chat_id: chatId, text, parse_mode: 'HTML' }
    if (replyMarkup) body.reply_markup = replyMarkup

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

export async function editTelegramMessage(chatId: string, messageId: number, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) return null

  try {
    const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }
    if (replyMarkup) body.reply_markup = replyMarkup

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
    })
  } catch (err) {
    console.error('Failed to answer callback query:', err)
  }
}

export function buildOrderMessage(order: any, shopName: string, flower?: any, currencySymbol = '₴') {
  const date = new Date(order.createdAt).toLocaleString('uk-UA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  let text = `🌸 <b>Нове замовлення — ${esc(shopName)}</b>\n`
  text += `━━━━━━━━━━━━━━━━━━\n`
  text += `👤 <b>Клієнт:</b> ${esc(order.customerName)}\n`
  text += `📞 <b>Телефон:</b> <a href="tel:${esc(order.phone)}">${esc(order.phone)}</a>\n`
  if (order.email) text += `✉️ <b>Email:</b> ${esc(order.email)}\n`
  if (flower) text += `💐 <b>Букет:</b> ${esc(flower.name)} — ${currencySymbol}${flower.price}\n`
  if (order.deliveryMethod) {
    text += `🚚 <b>Отримання:</b> ${order.deliveryMethod === 'delivery' ? 'Доставка' : 'Самовивіз'}\n`
  }
  if (order.deliveryAddress) text += `📍 <b>Адреса:</b> ${esc(order.deliveryAddress)}\n`
  if (order.totalAmount && order.totalAmount > 0) {
    text += `💵 <b>Сума:</b> ${currencySymbol}${order.totalAmount}\n`
  }
  if (order.message) text += `\n💬 <b>Повідомлення:</b>\n${order.message}\n`
  text += `\n🕐 <i>${date}</i>`
  text += `\n#замовлення #${order.id.slice(-6).toUpperCase()}`

  return text
}

// Full pipeline keyboard — shows buttons based on current status
export function buildOrderKeyboard(orderId: string, currentStatus: string = 'pending') {
  const id = orderId

  // Each status gets the logical next action(s)
  const keyboards: Record<string, any[][]> = {
    pending: [
      [
        { text: '✅ Підтвердити', callback_data: `confirmed:${id}` },
        { text: '❌ Скасувати',  callback_data: `cancelled:${id}` },
      ],
    ],
    confirmed: [
      [{ text: '💐 Розпочати підготовку', callback_data: `preparing:${id}` }],
      [{ text: '❌ Скасувати', callback_data: `cancelled:${id}` }],
    ],
    preparing: [
      [{ text: '🎁 Готово до видачі', callback_data: `ready:${id}` }],
      [{ text: '❌ Скасувати', callback_data: `cancelled:${id}` }],
    ],
    ready: [
      [
        { text: '🚚 Передано кур\'єру', callback_data: `delivering:${id}` },
        { text: '🎉 Видано (самовивіз)', callback_data: `delivered:${id}` },
      ],
      [{ text: '❌ Скасувати', callback_data: `cancelled:${id}` }],
    ],
    delivering: [
      [{ text: '🎉 Доставлено', callback_data: `delivered:${id}` }],
      [{ text: '❌ Скасувати', callback_data: `cancelled:${id}` }],
    ],
    delivered: [
      [{ text: '⭐ Завершити', callback_data: `completed:${id}` }],
    ],
    cancelled: [
      [{ text: '↩️ Відновити', callback_data: `pending:${id}` }],
    ],
    completed: [], // no more actions
  }

  const rows = keyboards[currentStatus] ?? []
  if (rows.length === 0) return undefined
  return { inline_keyboard: rows }
}

export const STATUS_LABELS_UA: Record<string, string> = {
  pending:    '⏳ Очікує підтвердження',
  confirmed:  '✅ Підтверджено',
  preparing:  '💐 Готується',
  ready:      '🎁 Готово до видачі',
  delivering: '🚚 В дорозі',
  delivered:  '🎉 Доставлено',
  completed:  '⭐ Завершено',
  cancelled:  '❌ Скасовано',
}
