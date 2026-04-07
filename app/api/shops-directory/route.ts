import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Plans that are allowed to appear in the public directory
const DIRECTORY_PLAN_SLUGS = ['basic', 'premium']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')?.trim()

    const where: Record<string, unknown> = {
      suspended: false,
      // Only show shops whose plan allows directory listing
      plan: { slug: { in: DIRECTORY_PLAN_SLUGS } },
      // Respect the shop owner's opt-in toggle (default true if not set)
      showInDirectory: { not: false },
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
          where: { availability: { not: 'out_of_stock' } },
          select: { id: true, name: true, price: true, imageUrl: true, availability: true },
          take: 4,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            flowers: { where: { availability: { not: 'out_of_stock' } } },
            orders: { where: { status: 'completed' } },
          },
        },
      },
      orderBy: [
        // Premium shops appear first
        { plan: { slug: 'asc' } },
        { createdAt: 'asc' },
      ],
    })

    // Collect distinct cities from listed shops
    const allCities = await prisma.shop.findMany({
      where: {
        suspended: false,
        city: { not: null },
        plan: { slug: { in: DIRECTORY_PLAN_SLUGS } },
        showInDirectory: { not: false },
      },
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
