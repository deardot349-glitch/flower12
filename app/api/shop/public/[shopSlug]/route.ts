import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { shopSlug: string } }
) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug: params.shopSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        city: true,
        country: true,
        googleMapsUrl: true,
        about: true,
        workingHours: true,
        timezone: true,
        coverImageUrl: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
        enableAnimations: true,
        phoneNumber: true,
        email: true,
        whatsappNumber: true,
        telegramHandle: true,
        instagramHandle: true,
        deliveryZones: true,
        sameDayDelivery: true,
        deliveryTimeEstimate: true,
        deliveryCutoffTime: true,
        minimumOrderAmount: true,
        showDeliveryEstimate: true,
        allowSameDayOrders: true,
        currency: true,
        language: true,
        suspended: true,
        plan: true,
        flowers: {
          where: {
            availability: {
              not: 'out_of_stock'
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    if ((shop as any).suspended) {
      return NextResponse.json({ error: 'This shop has been suspended' }, { status: 403 })
    }

    return NextResponse.json({ shop })
  } catch (error: any) {
    console.error('Failed to fetch shop:', error)
    return NextResponse.json({ error: 'Failed to load shop' }, { status: 500 })
  }
}
