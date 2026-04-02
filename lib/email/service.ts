// Email service using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev'

// ── Shared styles ──────────────────────────────────────────────────────────────
const baseStyle = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
  .button { display: inline-block; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 15px; }
  .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  h1 { margin: 0 0 10px; }
  h2 { margin: 0 0 12px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
`

// ── Welcome email ──────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, shopName: string, shopSlug: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Вітаємо у FlowerGoUa, ${shopName}! 🌸`,
      html: `
        <!DOCTYPE html><html><head><style>${baseStyle}
          .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; }
          .button { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🌸 Вітаємо у FlowerGoUa!</h1></div>
            <div class="content">
              <h2>Вітаємо, ${shopName}!</h2>
              <p>Ваш квітковий магазин готовий приймати замовлення!</p>
              <p><strong>Адреса вашого магазину:</strong><br>
              ${process.env.NEXTAUTH_URL}/${shopSlug}</p>
              <p><strong>Наступні кроки:</strong></p>
              <ul>
                <li>Підтвердіть email (перевірте наступний лист)</li>
                <li>Додайте букети до каталогу</li>
                <li>Налаштуйте зовнішній вигляд магазину</li>
                <li>Поділіться посиланням з клієнтами</li>
              </ul>
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Перейти до дашборду</a>
              <p>Маєте питання? Відповідайте на цей лист — допоможемо!</p>
              <p>Вдалого продажу! 🌺</p>
            </div>
            <div class="footer"><p>FlowerGoUa — красивий продаж квітів</p></div>
          </div>
        </body></html>
      `
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

// ── Email verification ─────────────────────────────────────────────────────────
export async function sendVerificationEmail(email: string, shopName: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: '✉️ Підтвердіть вашу електронну пошту — FlowerGoUa',
      html: `
        <!DOCTYPE html><html><head><style>${baseStyle}
          .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; }
          .button { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
          .info-box { background: #f0f9ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>✉️ Підтвердження email</h1></div>
            <div class="content">
              <h2>Привіт, ${shopName}!</h2>
              <p>Натисніть кнопку нижче, щоб підтвердити свою адресу електронної пошти та активувати акаунт:</p>
              <div style="text-align: center;">
                <a href="${verifyUrl}" class="button">Підтвердити email</a>
              </div>
              <div class="info-box">
                <strong>⏱ Посилання дійсне 24 години.</strong><br>
                Якщо кнопка не працює, скопіюйте це посилання у браузер:<br>
                <small style="word-break: break-all;">${verifyUrl}</small>
              </div>
              <p>Якщо ви не реєструвалися у FlowerGoUa — просто ігноруйте цей лист.</p>
            </div>
            <div class="footer"><p>FlowerGoUa — красивий продаж квітів</p></div>
          </div>
        </body></html>
      `
    })
  } catch (error) {
    console.error('Failed to send verification email:', error)
  }
}

// ── Order notification to shop owner ──────────────────────────────────────────
export async function sendOrderNotificationToShop(
  shopOwnerEmail: string,
  shopName: string,
  order: any,
  flower?: any
) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: shopOwnerEmail,
      subject: `🔔 Нове замовлення від ${order.customerName}`,
      html: `
        <!DOCTYPE html><html><head><style>${baseStyle}
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
          .order-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .label { font-weight: bold; color: #059669; }
          .button { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🎉 Нове замовлення!</h1></div>
            <div class="content">
              <h2>Вітаємо, ${shopName}!</h2>
              <p>У вас нове замовлення. Деталі:</p>
              <div class="order-box">
                ${flower ? `<p><span class="label">Букет:</span> ${flower.name} — ${flower.price} грн</p>` : ''}
                <p><span class="label">Клієнт:</span> ${order.customerName}</p>
                <p><span class="label">Телефон:</span> ${order.phone}</p>
                <p><span class="label">Дата:</span> ${new Date(order.createdAt).toLocaleString('uk-UA')}</p>
                ${order.message ? `<p><span class="label">Повідомлення:</span><br>${order.message.replace(/\n/g, '<br>')}</p>` : ''}
              </div>
              <a href="${process.env.NEXTAUTH_URL}/dashboard/orders" class="button">Переглянути замовлення</a>
              <p><strong>Потрібна дія:</strong> Зв'яжіться з клієнтом для підтвердження замовлення!</p>
            </div>
          </div>
        </body></html>
      `
    })
  } catch (error) {
    console.error('Failed to send order notification:', error)
  }
}

// ── Order confirmation to customer ─────────────────────────────────────────────
export async function sendOrderConfirmationToCustomer(
  customerEmail: string,
  customerName: string,
  shopName: string,
  flower: any
) {
  if (!customerEmail) return
  try {
    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `Замовлення прийнято — ${shopName}`,
      html: `
        <!DOCTYPE html><html><head><style>${baseStyle}
          .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>✅ Замовлення прийнято!</h1></div>
            <div class="content">
              <h2>Дякуємо, ${customerName}!</h2>
              <p>Ваше замовлення з <strong>${shopName}</strong> отримано.</p>
              <p><strong>Деталі замовлення:</strong></p>
              <ul>
                <li>${flower.name} — ${flower.price} грн</li>
              </ul>
              <p>Магазин незабаром зв'яжеться з вами для підтвердження та узгодження доставки.</p>
              <p>Дякуємо за замовлення! 🌸</p>
            </div>
          </div>
        </body></html>
      `
    })
  } catch (error) {
    console.error('Failed to send customer confirmation:', error)
  }
}

// ── Payment approved ────────────────────────────────────────────────────────────
export async function sendPaymentApprovedEmail(
  email: string,
  shopName: string,
  planName: string,
  expiryDate: Date
) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `✅ Оплату підтверджено — план ${planName} активовано!`,
      html: `
        <!DOCTYPE html><html><head><style>${baseStyle}
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
          .success-box { background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .button { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🎉 Оплату підтверджено!</h1></div>
            <div class="content">
              <h2>Чудові новини, ${shopName}!</h2>
              <div class="success-box">
                <h3>Ваш план «${planName}» активовано! ✨</h3>
                <p><strong>Дійсний до:</strong> ${expiryDate.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <p>Тепер вам доступні всі можливості плану «${planName}».</p>
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Перейти до дашборду</a>
            </div>
          </div>
        </body></html>
      `
    })
  } catch (error) {
    console.error('Failed to send payment approved email:', error)
  }
}

// ── Subscription expiry warning ─────────────────────────────────────────────────
export async function sendSubscriptionExpiryWarning(
  email: string,
  shopName: string,
  planName: string,
  daysRemaining: number,
  expiryDate: Date
) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `⚠️ Ваш план «${planName}» спливає через ${daysRemaining} дн.`,
      html: `
        <!DOCTYPE html><html><head><style>${baseStyle}
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
          .warning-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>⚠️ Підписка спливає</h1></div>
            <div class="content">
              <h2>Привіт, ${shopName}!</h2>
              <div class="warning-box">
                <p><strong>Ваш план «${planName}» спливає через ${daysRemaining} ${daysRemaining === 1 ? 'день' : 'днів'}</strong></p>
                <p>Дата закінчення: ${expiryDate.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <p>Продовжіть підписку, щоб зберегти всі функції та не перейти на безкоштовний план.</p>
              <a href="${process.env.NEXTAUTH_URL}/dashboard/subscription" class="button">Продовжити підписку</a>
              <p>Маєте питання? Відповідайте на цей лист!</p>
            </div>
          </div>
        </body></html>
      `
    })
  } catch (error) {
    console.error('Failed to send expiry warning:', error)
  }
}

// ── Password reset ──────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Скидання паролю — FlowerGoUa',
      html: `
        <!DOCTYPE html><html><head><style>${baseStyle}
          .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; }
          .button { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        </style></head>
        <body>
          <div class="container">
            <div class="header"><h1>🔐 Скидання паролю</h1></div>
            <div class="content">
              <p>Ви надіслали запит на скидання паролю. Натисніть кнопку нижче:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Скинути пароль</a>
              </div>
              <p>Посилання дійсне 1 годину.</p>
              <div class="warning">
                <strong>⚠️ Увага:</strong> Якщо ви не надсилали цей запит — просто ігноруйте лист. Ваш акаунт у безпеці.
              </div>
            </div>
          </div>
        </body></html>
      `
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}
