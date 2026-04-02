// Server component — fetched at request time, fully crawlable by search engines.
// All interactive logic lives in ShopClient.tsx.

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ShopClient from './ShopClient'

// ── Data fetcher (shared by generateMetadata + page) ──────────────────────────

async function getShop(slug: string) {
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      suspended: true,
      about: true,
      location: true,
      city: true,
      country: true,
      googleMapsUrl: true,
      workingHours: true,
      coverImageUrl: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      enableAnimations: true,
      email: true,
      phoneNumber: true,
      whatsappNumber: true,
      telegramHandle: true,
      instagramHandle: true,
      sameDayDelivery: true,
      deliveryTimeEstimate: true,
      deliveryCutoffTime: true,
      minimumOrderAmount: true,
      showDeliveryEstimate: true,
      allowSameDayOrders: true,
      currency: true,
      language: true,
      showPhone: true,
      showEmail: true,
      showWhatsapp: true,
      showTelegram: true,
      showInstagram: true,
      showLocation: true,
      allowCustomBouquet: true,
      layoutStyle: true,
      plan: { select: { slug: true } },
      deliveryZones: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          fee: true,
          estimatedMinHours: true,
          estimatedMaxHours: true,
          sameDayAvailable: true,
        },
      },
      flowers: {
        where: { availability: { not: 'out_of_stock' } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          availability: true,
          description: true,
          createdAt: true,
          madeAt: true,
        },
      },
    },
  })

  if (!shop || shop.suspended) return null

  // Enforce plan gate on allowCustomBouquet
  const shopWithGate = {
    ...shop,
    allowCustomBouquet: shop.plan.slug === 'premium' && shop.allowCustomBouquet,
  }

  return shopWithGate
}

// ── generateMetadata — gives every shop page its own <title> + OG tags ────────

export async function generateMetadata(
  { params }: { params: { shopSlug: string } }
): Promise<Metadata> {
  const shop = await getShop(params.shopSlug)

  if (!shop) {
    return { title: 'Магазин не знайдено — FlowerGoUa' }
  }

  const title       = `${shop.name} — квіти та букети`
  const description = shop.about
    ? shop.about.slice(0, 155)
    : `Замовте свіжі букети онлайн у ${shop.name}${shop.location ? ` (${shop.location})` : ''}. Швидка доставка та самовивіз.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'uk_UA',
      ...(shop.coverImageUrl ? { images: [{ url: shop.coverImageUrl, width: 1200, height: 630, alt: shop.name }] } : {}),
    },
    twitter: {
      card: shop.coverImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(shop.coverImageUrl ? { images: [shop.coverImageUrl] } : {}),
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ShopPage(
  { params }: { params: { shopSlug: string } }
) {
  const shop = await getShop(params.shopSlug)

  if (!shop) {
    // Renders the app/not-found.tsx (or Next.js default 404)
    notFound()
  }

  // Serialize dates to strings so the client component gets plain JSON props
  const serialized = {
    ...shop,
    flowers: shop.flowers.map(f => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      madeAt:    f.madeAt ? f.madeAt.toISOString() : null,
    })),
    // Remove plan (only used for the gate above)
    plan: undefined,
  }

  return <ShopClient shop={serialized as any} />
}
