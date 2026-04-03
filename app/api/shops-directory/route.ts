import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')?.trim()

    const where: Record<string, unknown> = {
      suspended: false,
    }

    if (city && city !== 'all') {
      where.city = { equals: city, mode: 'insensitive' }
    }

    const shops = await prisma.shop.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        country: true,
        location: true,
        about: true,
        coverImageUrl: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
        phoneNumber: true,
        showPhone: true,
        instagramHandle: true,
        showInstagram: true,
        telegramHandle: true,
        showTelegram: true,
        workingHours: true,
        deliveryTimeEstimate: true,
        sameDayDelivery: true,
        minimumOrderAmount: true,
        currency: true,
        plan: { select: { slug: true } },
        flowers: {
          where: { availability: 'in_stock' },
          select: { id: true, name: true, price: true, imageUrl: true },
          take: 4,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            flowers: { where: { availability: 'in_stock' } },
            orders: { where: { status: 'completed' } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Collect all distinct cities for the filter dropdown
    const allCities = await prisma.shop.findMany({
      where: { suspended: false, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
    })

    const cities = allCities
      .map((s: { city: string | null }) => s.city)
      .filter(Boolean)
      .sort() as string[]

    return NextResponse.json({ shops, cities })
  } catch (error) {
    console.error('Shops directory error:', error)
    return NextResponse.json({ error: 'Failed to load shops' }, { status: 500 })
  }
}
