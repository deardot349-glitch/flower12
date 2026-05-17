import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPlanConfig } from '@/lib/plans'
import { logger } from '@/lib/logger'
import { sanitizeString } from '@/lib/validators'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shop = await prisma.shop.findUnique({
      where: { id: session.user.shopId },
      include: { plan: true },
    })
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    return NextResponse.json({ shop })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 })
  }
}

// Helper: strip undefined fields so Prisma doesn't unintentionally clear them
function defined<T>(val: T | undefined): T | undefined {
  return val !== undefined ? val : undefined
}

// Helper: sanitize + trim a string, returning null if empty
function clean(val: unknown, maxLen = 500): string | null {
  if (val === null || val === undefined || val === '') return null
  return sanitizeString(String(val).trim()).slice(0, maxLen) || null
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
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const plan = getPlanConfig(shop.plan.slug)

    // ── Validate known enum fields ────────────────────────────────────────────
    const VALID_LAYOUTS      = ['classic', 'modern', 'list', 'bold']
    const VALID_OOS_BEHAVIOR = ['show_unavailable', 'hide', 'show_notify']
    const VALID_CURRENCIES   = ['UAH', 'USD', 'EUR', 'GBP', 'PLN']
    const VALID_LANGUAGES    = ['uk', 'en', 'pl']

    if (body.layoutStyle && !VALID_LAYOUTS.includes(body.layoutStyle)) {
      return NextResponse.json({ error: 'Invalid layout style' }, { status: 400 })
    }
    if (body.outOfStockBehavior && !VALID_OOS_BEHAVIOR.includes(body.outOfStockBehavior)) {
      return NextResponse.json({ error: 'Invalid out-of-stock behavior' }, { status: 400 })
    }
    if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
    }
    if (body.language && !VALID_LANGUAGES.includes(body.language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
    }

    // ── Validate numeric fields ───────────────────────────────────────────────
    let minimumOrderAmount: number | undefined
    if (body.minimumOrderAmount !== undefined) {
      minimumOrderAmount = parseFloat(body.minimumOrderAmount)
      if (isNaN(minimumOrderAmount) || minimumOrderAmount < 0) {
        return NextResponse.json({ error: 'Invalid minimum order amount' }, { status: 400 })
      }
    }

    let freeDeliveryFrom: number | null | undefined
    if (body.freeDeliveryFrom !== undefined) {
      if (body.freeDeliveryFrom === null || body.freeDeliveryFrom === '') {
        freeDeliveryFrom = null
      } else {
        freeDeliveryFrom = parseFloat(body.freeDeliveryFrom)
        if (isNaN(freeDeliveryFrom) || freeDeliveryFrom < 0) {
          return NextResponse.json({ error: 'Invalid free delivery amount' }, { status: 400 })
        }
      }
    }

    // ── Build update payload ──────────────────────────────────────────────────
    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        // ── General ──────────────────────────────────────────────────────────
        ...(body.name !== undefined     ? { name:     clean(body.name, 100)     || shop.name } : {}),
        ...(body.about !== undefined    ? { about:    clean(body.about, 1000)   } : {}),
        ...(body.tagline !== undefined  ? { tagline:  clean(body.tagline, 200)  } : {}),
        ...(body.tags !== undefined     ? { tags:     clean(body.tags, 300)     } : {}),
        ...(body.language !== undefined ? { language: body.language             } : {}),
        ...(body.currency !== undefined ? { currency: body.currency             } : {}),
        ...(body.timezone !== undefined ? { timezone: clean(body.timezone, 60)  } : {}),
        ...(body.city !== undefined     ? { city:     clean(body.city, 100)     } : {}),
        ...(body.country !== undefined  ? { country:  clean(body.country, 100)  } : {}),

        // ── Appearance (plan-gated) ───────────────────────────────────────────
        ...(plan.allowCoverPhoto  && body.coverImageUrl  !== undefined ? { coverImageUrl:  clean(body.coverImageUrl,  500) } : {}),
        ...(plan.allowLogoUpload  && body.logoUrl        !== undefined ? { logoUrl:        clean(body.logoUrl,        500) } : {}),
        ...(plan.allowCustomColors && body.primaryColor  !== undefined ? { primaryColor:   clean(body.primaryColor,  20) || '#ec4899' } : {}),
        ...(plan.allowCustomColors && body.accentColor   !== undefined ? { accentColor:    clean(body.accentColor,   20) || '#a855f7' } : {}),
        ...(body.enableAnimations !== undefined ? { enableAnimations: Boolean(body.enableAnimations) } : {}),
        ...(body.layoutStyle      !== undefined ? { layoutStyle: body.layoutStyle  } : {}),

        // ── Location ─────────────────────────────────────────────────────────
        ...(body.location     !== undefined ? { location:     clean(body.location, 300)     } : {}),
        ...(body.googleMapsUrl !== undefined ? { googleMapsUrl: clean(body.googleMapsUrl, 500) } : {}),

        // ── Contact ──────────────────────────────────────────────────────────
        ...(body.email           !== undefined ? { email:           clean(body.email, 254)           } : {}),
        ...(body.phoneNumber     !== undefined ? { phoneNumber:     clean(body.phoneNumber, 30)      } : {}),
        ...(body.whatsappNumber  !== undefined ? { whatsappNumber:  clean(body.whatsappNumber, 30)   } : {}),
        ...(body.viberNumber     !== undefined ? { viberNumber:     clean(body.viberNumber, 30)      } : {}),
        ...(body.telegramHandle  !== undefined ? { telegramHandle:  clean(body.telegramHandle, 60)   } : {}),
        ...(body.instagramHandle !== undefined ? { instagramHandle: clean(body.instagramHandle, 60)  } : {}),

        ...(body.showPhone     !== undefined ? { showPhone:     Boolean(body.showPhone)     } : {}),
        ...(body.showEmail     !== undefined ? { showEmail:     Boolean(body.showEmail)     } : {}),
        ...(body.showWhatsapp  !== undefined ? { showWhatsapp:  Boolean(body.showWhatsapp)  } : {}),
        ...(body.showViber     !== undefined ? { showViber:     Boolean(body.showViber)     } : {}),
        ...(body.showTelegram  !== undefined ? { showTelegram:  Boolean(body.showTelegram)  } : {}),
        ...(body.showInstagram !== undefined ? { showInstagram: Boolean(body.showInstagram) } : {}),
        ...(body.showLocation  !== undefined ? { showLocation:  Boolean(body.showLocation)  } : {}),

        // ── Pickup ───────────────────────────────────────────────────────────
        ...(body.pickupEnabled      !== undefined ? { pickupEnabled:      Boolean(body.pickupEnabled)               } : {}),
        ...(body.pickupAddress      !== undefined ? { pickupAddress:      clean(body.pickupAddress, 300)            } : {}),
        ...(body.pickupInstructions !== undefined ? { pickupInstructions: clean(body.pickupInstructions, 500)       } : {}),

        // ── Payment ──────────────────────────────────────────────────────────
        ...(body.cashOnDelivery !== undefined ? { cashOnDelivery: Boolean(body.cashOnDelivery) } : {}),
        ...(body.cardOnDelivery !== undefined ? { cardOnDelivery: Boolean(body.cardOnDelivery) } : {}),
        ...(body.monojarUrl     !== undefined ? { monojarUrl:     clean(body.monojarUrl, 500)  } : {}),

        // ── Working hours ─────────────────────────────────────────────────────
        ...(body.workingHours !== undefined ? { workingHours: body.workingHours || null } : {}),

        // ── Delivery ─────────────────────────────────────────────────────────
        ...(body.sameDayDelivery        !== undefined ? { sameDayDelivery:       Boolean(body.sameDayDelivery)                       } : {}),
        ...(body.deliveryTimeEstimate   !== undefined ? { deliveryTimeEstimate:  clean(body.deliveryTimeEstimate, 100)               } : {}),
        ...(body.deliveryCutoffTime     !== undefined ? { deliveryCutoffTime:    clean(body.deliveryCutoffTime, 10) || '14:00'       } : {}),
        ...(minimumOrderAmount          !== undefined ? { minimumOrderAmount                                                         } : {}),
        ...(freeDeliveryFrom            !== undefined ? { freeDeliveryFrom                                                           } : {}),
        ...(body.showDeliveryEstimate   !== undefined ? { showDeliveryEstimate:  Boolean(body.showDeliveryEstimate)                  } : {}),
        ...(body.allowSameDayOrders     !== undefined ? { allowSameDayOrders:    Boolean(body.allowSameDayOrders)                    } : {}),
        ...(body.allowScheduledDelivery !== undefined ? { allowScheduledDelivery: Boolean(body.allowScheduledDelivery)               } : {}),

        // ── Orders ────────────────────────────────────────────────────────────
        ...(body.autoConfirmOrders          !== undefined ? { autoConfirmOrders:          Boolean(body.autoConfirmOrders)          } : {}),
        ...(body.requirePhoneVerify         !== undefined ? { requirePhoneVerify:         Boolean(body.requirePhoneVerify)         } : {}),
        ...(body.requireCustomerEmail       !== undefined ? { requireCustomerEmail:       Boolean(body.requireCustomerEmail)       } : {}),
        ...(body.orderNotifyEmail           !== undefined ? { orderNotifyEmail:           clean(body.orderNotifyEmail, 254)        } : {}),
        ...(body.orderNotifyEmailEnabled    !== undefined ? { orderNotifyEmailEnabled:    Boolean(body.orderNotifyEmailEnabled)    } : {}),
        ...(body.customerEmailNotifications !== undefined ? { customerEmailNotifications: Boolean(body.customerEmailNotifications) } : {}),
        ...(body.showOrderTracking          !== undefined ? { showOrderTracking:          Boolean(body.showOrderTracking)          } : {}),
        ...(body.orderIdPrefix              !== undefined ? { orderIdPrefix:              clean(body.orderIdPrefix, 10) || 'FL'   } : {}),
        ...(body.outOfStockBehavior         !== undefined ? { outOfStockBehavior:         body.outOfStockBehavior                  } : {}),
        ...(body.stockAlertThreshold        !== undefined ? { stockAlertThreshold:        Math.max(0, parseInt(body.stockAlertThreshold) || 5) } : {}),

        // ── Telegram ─────────────────────────────────────────────────────────
        ...(body.telegramChatId !== undefined ? { telegramChatId: clean(body.telegramChatId, 50) } : {}),

        // ── SEO ──────────────────────────────────────────────────────────────
        ...(body.seoTitle       !== undefined ? { seoTitle:       clean(body.seoTitle, 70)       } : {}),
        ...(body.seoDescription !== undefined ? { seoDescription: clean(body.seoDescription, 160) } : {}),
        ...(body.seoKeywords    !== undefined ? { seoKeywords:    clean(body.seoKeywords, 200)   } : {}),

        // ── Legal ─────────────────────────────────────────────────────────────
        ...(body.refundPolicy !== undefined ? { refundPolicy: clean(body.refundPolicy, 5000) } : {}),
        ...(body.termsUrl     !== undefined ? { termsUrl:     clean(body.termsUrl, 500)      } : {}),

        // ── Custom bouquet (plan-gated) ───────────────────────────────────────
        ...(body.allowCustomBouquet !== undefined ? {
          allowCustomBouquet: plan.allowCustomBouquet ? Boolean(body.allowCustomBouquet) : false,
        } : {}),
      },
    })

    return NextResponse.json({ success: true, shop: updated })
  } catch (error: unknown) {
    logger.error('shop/put', 'Shop update failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    if (body.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Send { confirm: "DELETE" } to confirm account deletion.' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: session.user.id } })
    logger.info('shop/delete', 'Account deleted', { userId: session.user.id })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('shop/delete', 'Account deletion failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
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
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

    const plan = getPlanConfig(shop.plan.slug)
    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        ...(body.location     !== undefined ? { location:     clean(body.location, 300)     } : {}),
        ...(body.about        !== undefined ? { about:        clean(body.about, 1000)        } : {}),
        ...(body.workingHours !== undefined ? { workingHours: body.workingHours || null      } : {}),
        ...(plan.allowCoverPhoto && body.coverImageUrl !== undefined ? { coverImageUrl: clean(body.coverImageUrl, 500) } : {}),
      },
    })

    return NextResponse.json({ success: true, shop: updated })
  } catch (error: unknown) {
    logger.error('shop/patch', 'Shop partial update failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 })
  }
}
