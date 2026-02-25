import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shop = await prisma.shop.findUnique({
      where: { id: session.user.shopId },
      include: { plan: true },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    return NextResponse.json({ shop })
  } catch (error: any) {
    console.error('Shop fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const shop = await prisma.shop.findUnique({
      where: { id: session.user.shopId },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        // General
        name: body.name?.trim() || shop.name,
        about: body.about?.trim() || null,
        language: body.language || 'en',
        currency: body.currency || 'USD',
        timezone: body.timezone || 'UTC',

        // Appearance
        coverImageUrl: body.coverImageUrl || null,
        logoUrl: body.logoUrl || null,
        primaryColor: body.primaryColor || '#ec4899',
        accentColor: body.accentColor || '#a855f7',
        enableAnimations: body.enableAnimations ?? true,

        // Location & Contact
        location: body.location?.trim() || null,
        city: body.city?.trim() || null,
        country: body.country?.trim() || null,
        googleMapsUrl: body.googleMapsUrl?.trim() || null,
        email: body.email?.trim() || null,
        phoneNumber: body.phoneNumber?.trim() || null,
        whatsappNumber: body.whatsappNumber?.trim() || null,
        telegramHandle: body.telegramHandle?.trim() || null,
        instagramHandle: body.instagramHandle?.trim() || null,

        // Working Hours (stored as JSON string)
        workingHours: body.workingHours || null,

        // Delivery
        sameDayDelivery: body.sameDayDelivery ?? true,
        deliveryTimeEstimate: body.deliveryTimeEstimate?.trim() || null,
        deliveryCutoffTime: body.deliveryCutoffTime || '14:00',
        minimumOrderAmount: body.minimumOrderAmount ?? 0,
        autoConfirmOrders: body.autoConfirmOrders ?? false,
        requirePhoneVerify: body.requirePhoneVerify ?? false,
        showDeliveryEstimate: body.showDeliveryEstimate ?? true,
        allowSameDayOrders: body.allowSameDayOrders ?? true,

        // Contact visibility
        showPhone: body.showPhone ?? true,
        showEmail: body.showEmail ?? true,
        showWhatsapp: body.showWhatsapp ?? true,
        showTelegram: body.showTelegram ?? true,
        showInstagram: body.showInstagram ?? true,
        showLocation: body.showLocation ?? true,

        // Custom bouquet
        allowCustomBouquet: body.allowCustomBouquet ?? true,
      },
    })

    return NextResponse.json({ success: true, shop: updated })
  } catch (error: any) {
    console.error('Shop update error:', error)
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      include: { plan: true },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    if (!shop.plan.allowProfileDetails) {
      return NextResponse.json(
        { error: 'Your current plan does not allow editing full profile details. Upgrade to enable this.' },
        { status: 403 }
      )
    }

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        location: body.location ?? null,
        about: body.about ?? null,
        workingHours: body.workingHours ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
      },
    })

    return NextResponse.json({ success: true, shop: updated })
  } catch (error: any) {
    console.error('Shop update error:', error)
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}
