import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationToShop, sendOrderConfirmationToCustomer } from '@/lib/email/service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shopSlug, shopId, customerName, phone, message, flowerId, email } = body

    if (!customerName || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    let finalShopId = shopId

    // If shopSlug provided instead of shopId, look it up
    if (shopSlug && !shopId) {
      const shop = await prisma.shop.findUnique({
        where: { slug: shopSlug }
      })
      
      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        )
      }
      
      finalShopId = shop.id
    }

    if (!finalShopId) {
      return NextResponse.json(
        { error: 'Shop ID or slug is required' },
        { status: 400 }
      )
    }

    // Get flower name if flowerId provided
    let orderMessage = message || ''
    let flower = null
    
    if (flowerId) {
      flower = await prisma.flower.findUnique({
        where: { id: flowerId }
      })
      
      if (flower) {
        orderMessage = `Inquiry about: ${flower.name}${message ? `\n\n${message}` : ''}`
      }
    }

    const order = await prisma.order.create({
      data: {
        shopId: finalShopId,
        customerName,
        phone,
        message: orderMessage || null,
      }
    })

    // Get shop and owner for email notifications
    const shop = await prisma.shop.findUnique({
      where: { id: finalShopId },
      include: { owner: true }
    })

    // Send email notifications
    try {
      // Notify shop owner
      if (shop) {
        await sendOrderNotificationToShop(shop.owner.email, shop.name, order, flower)
      }

      // Confirm to customer if email provided
      if (email && flower) {
        await sendOrderConfirmationToCustomer(email, customerName, shop!.name, flower)
      }
    } catch (emailError) {
      console.error('Failed to send order emails:', emailError)
      // Don't fail the order if email fails
    }

    return NextResponse.json({ 
      success: true, 
      order,
      message: 'Inquiry sent successfully!'
    })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to send inquiry' },
      { status: 500 }
    )
  }
}
