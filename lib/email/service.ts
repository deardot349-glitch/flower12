// Email service using Resend
// Install: npm install resend

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.FROM_EMAIL || 'noreply@flowerplatform.com'

export async function sendWelcomeEmail(email: string, shopName: string, shopSlug: string) {
  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Welcome to Flower Platform, ${shopName}! 🌸`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌸 Welcome to Flower Platform!</h1>
              </div>
              <div class="content">
                <h2>Hello ${shopName}!</h2>
                <p>Your flower shop is now live and ready to receive orders! 🎉</p>
                
                <p><strong>Your shop URL:</strong><br>
                ${process.env.NEXTAUTH_URL}/${shopSlug}</p>
                
                <p><strong>Next steps:</strong></p>
                <ul>
                  <li>Add your beautiful flowers to the catalog</li>
                  <li>Customize your shop appearance in Settings</li>
                  <li>Share your shop link with customers</li>
                  <li>Start receiving orders!</li>
                </ul>
                
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
                
                <p>Need help? Reply to this email and we'll assist you!</p>
                
                <p>Happy selling! 🌺</p>
              </div>
              <div class="footer">
                <p>Flower Platform - Making flower selling beautiful</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    console.log('Welcome email sent to:', email)
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}

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
      subject: `🔔 New Order from ${order.customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .order-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .label { font-weight: bold; color: #059669; }
              .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 New Order Received!</h1>
              </div>
              <div class="content">
                <h2>Hello ${shopName}!</h2>
                <p>You have a new order! Here are the details:</p>
                
                <div class="order-box">
                  ${flower ? `<p><span class="label">Flower:</span> ${flower.name} - $${flower.price}</p>` : ''}
                  <p><span class="label">Customer:</span> ${order.customerName}</p>
                  <p><span class="label">Phone:</span> ${order.phone}</p>
                  <p><span class="label">Date:</span> ${new Date(order.createdAt).toLocaleString()}</p>
                  ${order.message ? `<p><span class="label">Message:</span><br>${order.message.replace(/\n/g, '<br>')}</p>` : ''}
                </div>
                
                <a href="${process.env.NEXTAUTH_URL}/dashboard/orders" class="button">View All Orders</a>
                
                <p><strong>Action required:</strong> Contact the customer to confirm the order!</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    console.log('Order notification sent to shop:', shopOwnerEmail)
  } catch (error) {
    console.error('Failed to send order notification:', error)
  }
}

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
      subject: `Order Confirmation - ${shopName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Order Confirmed!</h1>
              </div>
              <div class="content">
                <h2>Thank you, ${customerName}!</h2>
                <p>Your order from <strong>${shopName}</strong> has been received.</p>
                
                <p><strong>Order Details:</strong></p>
                <ul>
                  <li>${flower.name} - $${flower.price}</li>
                </ul>
                
                <p>The shop will contact you shortly to confirm your order and arrange delivery/pickup.</p>
                
                <p>Thank you for your order! 🌸</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    console.log('Order confirmation sent to customer:', customerEmail)
  } catch (error) {
    console.error('Failed to send customer confirmation:', error)
  }
}

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
      subject: `✅ Payment Approved - ${planName} Plan Activated!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-box { background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
              .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Payment Approved!</h1>
              </div>
              <div class="content">
                <h2>Great news, ${shopName}!</h2>
                
                <div class="success-box">
                  <h3>Your ${planName} plan is now active! ✨</h3>
                  <p><strong>Expires:</strong> ${expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <p>You now have access to all ${planName} features:</p>
                <ul>
                  ${planName === 'Basic' ? `
                    <li>Up to 50 bouquets</li>
                    <li>Full profile customization</li>
                    <li>Priority support</li>
                  ` : `
                    <li>Up to 200 bouquets</li>
                    <li>Analytics dashboard</li>
                    <li>Priority support</li>
                    <li>Custom domain ready</li>
                  `}
                </ul>
                
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
                
                <p>Make the most of your subscription!</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    console.log('Payment approved email sent to:', email)
  } catch (error) {
    console.error('Failed to send payment approved email:', error)
  }
}

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
      subject: `⚠️ Your ${planName} plan expires in ${daysRemaining} days`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .warning-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Subscription Expiring Soon</h1>
              </div>
              <div class="content">
                <h2>Hello ${shopName},</h2>
                
                <div class="warning-box">
                  <p><strong>Your ${planName} plan will expire in ${daysRemaining} days</strong></p>
                  <p>Expiry date: ${expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <p>Renew now to keep your premium features and avoid downgrading to the free plan.</p>
                
                <p><strong>What you'll lose if you don't renew:</strong></p>
                <ul>
                  <li>Extended flower catalog</li>
                  <li>Full profile customization</li>
                  <li>Priority support</li>
                </ul>
                
                <a href="${process.env.NEXTAUTH_URL}/dashboard/subscription" class="button">Renew Now</a>
                
                <p>Questions? Reply to this email and we'll help!</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
    console.log('Expiry warning sent to:', email)
  } catch (error) {
    console.error('Failed to send expiry warning:', error)
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset Your Password - Flower Platform',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>You requested to reset your password. Click the button below to set a new password:</p>
                
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <p>This link will expire in 1 hour.</p>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is safe.
                </div>
              </div>
            </div>
          </body>
        </html>
      `
    })
    console.log('Password reset email sent to:', email)
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}
