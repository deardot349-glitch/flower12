import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { shopSlug: string } }
) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug: params.shopSlug },
      include: {
        plan: true,
        stockFlowers: {
          where: { stockCount: { gt: 0 } },
          orderBy: { name: 'asc' }
        },
        wrappingOptions: {
          where: { available: true },
          orderBy: { price: 'asc' }
        },
        customExtras: {
          where: { available: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // 🔒 Custom bouquet is PREMIUM only
    if (shop.plan.slug !== 'premium') {
      return NextResponse.json(
        { error: 'Custom bouquets require a Premium plan', planRequired: 'premium' },
        { status: 403 }
      )
    }

    // Also check the shop has custom bouquet enabled
    if (!shop.allowCustomBouquet) {
      return NextResponse.json(
        { error: 'Custom bouquets are disabled for this shop' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      stockFlowers: shop.stockFlowers,
      wrappingOptions: shop.wrappingOptions,
      customExtras: shop.customExtras,
      currency: shop.currency,
      shopName: shop.name
    })
  } catch (error: any) {
    console.error('Failed to fetch custom bouquet data:', error)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}
