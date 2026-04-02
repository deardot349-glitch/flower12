import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'

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
      include: { plan: true },
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const planConfig = getPlanConfig(shop.plan.slug)

    // ── Enforce feature gates ──────────────────────────────────────────────────

    // Cover photo: free plan cannot set a cover photo
    const coverImageUrl = planConfig.allowCoverPhoto
      ? (body.coverImageUrl ?? null)
      : null  // silently strip it so the DB stays clean

    // Logo: only premium can upload a logo
    const logoUrl = planConfig.allowLogoUpload
      ? (body.logoUrl ?? null)
      : null

    // Custom colours: only premium
    const primaryColor = planConfig.allowCustomColors
      ? (body.primaryColor || '#ec4899')
      : '#ec4899'
    const accentColor = planConfig.allowCustomColors
      ? (body.accentColor || '#a855f7')
      : '#a855f7'

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        // General
        name: body.name?.trim() || shop.name,
        about: body.about?.trim() || null,
        language: body.language || 'uk',
        currency: body.currency || 'UAH',
        timezone: body.timezone || 'Europe/Kyiv',

        // Appearance (plan-gated above)
        coverImageUrl,
        logoUrl,
        primaryColor,
        accentColor,
        enableAnimations: body.enableAnimations ?? true,
        ...(body.layoutStyle !== undefined ? { layoutStyle: body.layoutStyle || 'classic' } : {}),

        // Location & Contact (allowed on all plans — free gets a proper-looking page)
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

        // Custom bouquet toggle (only premium can enable it)
        allowCustomBouquet: planConfig.allowCustomBouquet
          ? (body.allowCustomBouquet ?? true)
          : false,
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

    // Apply plan gate to coverImageUrl (same as PUT handler)
    const planConfig = getPlanConfig(shop.plan.slug)

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        location: body.location ?? null,
        about: body.about ?? null,
        workingHours: body.workingHours ?? null,
        // Only allow cover image if the plan permits it
        ...(planConfig.allowCoverPhoto && body.coverImageUrl !== undefined
          ? { coverImageUrl: body.coverImageUrl ?? null }
          : {}),
      },
    })

    return NextResponse.json({ success: true, shop: updated })
  } catch (error: any) {
    console.error('Shop update error:', error)
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}
