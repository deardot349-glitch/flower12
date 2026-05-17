import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const DIRECTORY_PLAN_SLUGS = ['basic', 'premium']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city         = searchParams.get('city')?.trim()
    const sort         = searchParams.get('sort') || 'activity'      // activity | newest | plan
    const filterSameDay  = searchParams.get('sameDay') === '1'
    const filterCustom   = searchParams.get('custom')  === '1'

    const where: Record<string, unknown> = {
      suspended: false,
      plan: { slug: { in: DIRECTORY_PLAN_SLUGS } },
    }

    if (city && city !== 'all') {
      where.city = { equals: city, mode: 'insensitive' }
    }
    if (filterSameDay) where.sameDayDelivery = true
    if (filterCustom)  where.allowCustomBouquet = true

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
        tagline: true,
        tags: true,
        coverImageUrl: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
        phoneNumber: true,
        showPhone: true,
        whatsappNumber: true,
        showWhatsapp: true,
        instagramHandle: true,
        showInstagram: true,
        telegramHandle: true,
        showTelegram: true,
        workingHours: true,
        sameDayDelivery: true,
        allowCustomBouquet: true,
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
            orders:  { where: { status: 'completed' } },
          },
        },
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' },
    })

    // Client-side sort after fetching so we can rank by plan + activity
    const sorted = [...shops].sort((a, b) => {
      if (sort === 'plan') {
        // premium first, then basic
        const pa = a.plan.slug === 'premium' ? 0 : 1
        const pb = b.plan.slug === 'premium' ? 0 : 1
        if (pa !== pb) return pa - pb
      }
      if (sort === 'activity' || sort === 'plan') {
        // within same tier: most completed orders first
        return b._count.orders - a._count.orders
      }
      return 0
    })

    // Distinct cities
    const allCities = await prisma.shop.findMany({
      where: {
        suspended: false,
        city: { not: null },
        plan: { slug: { in: DIRECTORY_PLAN_SLUGS } },
      },
      select: { city: true },
      distinct: ['city'],
    })

    const cities = allCities
      .map((s: { city: string | null }) => s.city)
      .filter(Boolean)
      .sort() as string[]

    return NextResponse.json({ shops: sorted, cities })
  } catch (error: unknown) {
    logger.error('shops-directory/get', 'Failed to load shops', { error: String(error) })
    return NextResponse.json({ error: 'Failed to load shops' }, { status: 500 })
  }
}
