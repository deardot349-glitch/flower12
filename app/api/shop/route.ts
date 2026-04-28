import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const shop = await prisma.shop.findUnique({
      where: { id: session.user.shopId },
      include: { plan: true },
    })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    return NextResponse.json({ shop })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const shop = await prisma.shop.findUnique({
      where: { id: session.user.shopId },
      include: { plan: true },
    })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const plan = getPlanConfig(shop.plan.slug)

    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        // ── General ──────────────────────────────────────────────────────────
        name:         body.name?.trim()     || shop.name,
        about:        body.about?.trim()    || null,
        tagline:      body.tagline?.trim()  || null,
        tags:         body.tags?.trim()     || null,
        language:     body.language         || 'uk',
        currency:     body.currency         || 'UAH',
        timezone:     body.timezone         || 'Europe/Kyiv',
        city:         body.city?.trim()     || null,
        country:      body.country?.trim()  || null,

        // ── Appearance (plan-gated) ───────────────────────────────────────
        coverImageUrl: plan.allowCoverPhoto  ? (body.coverImageUrl ?? null) : undefined,
        logoUrl:       plan.allowLogoUpload  ? (body.logoUrl ?? null)       : undefined,
        primaryColor:  plan.allowCustomColors ? (body.primaryColor || '#ec4899') : undefined,
        accentColor:   plan.allowCustomColors ? (body.accentColor  || '#a855f7') : undefined,
        enableAnimations: body.enableAnimations ?? true,
        layoutStyle:   body.layoutStyle || 'classic',

        // ── Location ─────────────────────────────────────────────────────
        location:      body.location?.trim()     || null,
        googleMapsUrl: body.googleMapsUrl?.trim() || null,

        // ── Contact ──────────────────────────────────────────────────────
        email:           body.email?.trim()           || null,
        phoneNumber:     body.phoneNumber?.trim()     || null,
        whatsappNumber:  body.whatsappNumber?.trim()  || null,
        viberNumber:     body.viberNumber?.trim()     || null,
        telegramHandle:  body.telegramHandle?.trim()  || null,
        instagramHandle: body.instagramHandle?.trim() || null,

        showPhone:     body.showPhone     ?? true,
        showEmail:     body.showEmail     ?? true,
        showWhatsapp:  body.showWhatsapp  ?? true,
        showViber:     body.showViber     ?? true,
        showTelegram:  body.showTelegram  ?? true,
        showInstagram: body.showInstagram ?? true,
        showLocation:  body.showLocation  ?? true,

        // ── Pickup ───────────────────────────────────────────────────────
        pickupEnabled:      body.pickupEnabled      ?? false,
        pickupAddress:      body.pickupAddress?.trim()      || null,
        pickupInstructions: body.pickupInstructions?.trim() || null,

        // ── Payment ──────────────────────────────────────────────────────
        cashOnDelivery:  body.cashOnDelivery  ?? true,
        cardOnDelivery:  body.cardOnDelivery  ?? true,
        monojarUrl:      body.monojarUrl?.trim() || null,

        // ── Working hours ─────────────────────────────────────────────────
        workingHours: body.workingHours || null,

        // ── Delivery ─────────────────────────────────────────────────────
        sameDayDelivery:       body.sameDayDelivery       ?? true,
        deliveryTimeEstimate:  body.deliveryTimeEstimate?.trim()  || null,
        deliveryCutoffTime:    body.deliveryCutoffTime    || '14:00',
        minimumOrderAmount:    body.minimumOrderAmount    ?? 0,
        freeDeliveryFrom:      body.freeDeliveryFrom      ?? null,
        showDeliveryEstimate:  body.showDeliveryEstimate  ?? true,
        allowSameDayOrders:    body.allowSameDayOrders    ?? true,
        allowScheduledDelivery: body.allowScheduledDelivery ?? false,

        // ── Orders ────────────────────────────────────────────────────────
        autoConfirmOrders:          body.autoConfirmOrders          ?? false,
        requirePhoneVerify:         body.requirePhoneVerify         ?? false,
        requireCustomerEmail:       body.requireCustomerEmail       ?? false,
        orderNotifyEmail:           body.orderNotifyEmail?.trim()   || null,
        orderNotifyEmailEnabled:    body.orderNotifyEmailEnabled     ?? false,
        customerEmailNotifications: body.customerEmailNotifications  ?? true,
        showOrderTracking:          body.showOrderTracking           ?? true,
        orderIdPrefix:              body.orderIdPrefix?.trim()       || 'FL',
        outOfStockBehavior:         body.outOfStockBehavior          || 'show_unavailable',
        stockAlertThreshold:        body.stockAlertThreshold         ?? 5,

        // ── SEO ──────────────────────────────────────────────────────────
        seoTitle:       body.seoTitle?.trim()       || null,
        seoDescription: body.seoDescription?.trim() || null,
        seoKeywords:    body.seoKeywords?.trim()    || null,

        // ── Legal ─────────────────────────────────────────────────────────
        refundPolicy: body.refundPolicy?.trim() || null,
        termsUrl:     body.termsUrl?.trim()     || null,

        // ── Custom bouquet (plan-gated) ───────────────────────────────────
        allowCustomBouquet: plan.allowCustomBouquet
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

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    if (body.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Send { confirm: "DELETE" } to confirm.' }, { status: 400 })
    }
    await prisma.user.delete({ where: { id: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body   = await request.json()
    const shop   = await prisma.shop.findFirst({ where: { ownerId: session.user.id }, include: { plan: true } })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const plan = getPlanConfig(shop.plan.slug)
    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        location:     body.location     ?? null,
        about:        body.about        ?? null,
        workingHours: body.workingHours ?? null,
        ...(plan.allowCoverPhoto && body.coverImageUrl !== undefined
          ? { coverImageUrl: body.coverImageUrl ?? null } : {}),
      },
    })
    return NextResponse.json({ success: true, shop: updated })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}
