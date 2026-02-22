import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationToShop } from '@/lib/email/service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shopSlug,
      customerName,
      phone,
      email,
      deliveryMethod,
      deliveryAddress,
      customBouquet
    } = body

    // Find shop
    const shop = await prisma.shop.findUnique({
      where: { slug: shopSlug },
      include: { owner: true }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Create detailed order message
    const flowersList = customBouquet.flowers
      .map((f: any) => `${f.quantity}x ${f.name} (${f.color}) @ $${f.pricePerStem}/stem = $${(f.quantity * f.pricePerStem).toFixed(2)}`)
      .join('\n')

    const orderMessage = `
🎨 CUSTOM BOUQUET ORDER

📦 Flowers:
${flowersList}

🎁 Wrapping: ${customBouquet.wrapping?.name || 'None'} ${customBouquet.wrapping?.price > 0 ? `(+$${customBouquet.wrapping.price})` : ''}

💬 Special Instructions:
${customBouquet.specialInstructions || 'None'}

💰 Total: $${customBouquet.totalPrice.toFixed(2)}

${deliveryMethod === 'pickup' ? '🏪 PICKUP at store' : `🚚 DELIVERY to:
${deliveryAddress.address}
${deliveryAddress.city}, ${deliveryAddress.zipCode}`}

Contact: ${customerName}
Phone: ${phone}
${email ? `Email: ${email}` : ''}
    `.trim()

    // Create order
    const order = await prisma.order.create({
      data: {
        shopId: shop.id,
        customerName,
        phone,
        email: email || null,
        message: orderMessage,
        orderType: 'custom_bouquet',
        deliveryMethod,
        deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
        customBouquet: JSON.stringify(customBouquet),
        status: 'pending'
      }
    })

    // Send email notification
    try {
      await sendOrderNotificationToShop(shop.owner.email, shop.name, order, null)
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Custom bouquet order placed successfully!'
    })
  } catch (error: any) {
    console.error('Custom bouquet order error:', error)
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    )
  }
}
