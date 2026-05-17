// Server component — ISR with 60s revalidation for performance + freshness.
// All interactive logic lives in ShopClient.tsx.

export const revalidate = 60

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ShopClient from './ShopClient'

// ── Types ──────────────────────────────────────────────────────────────────────

type OfflineShop = { offline: true; name: string }
type OnlineShop  = Awaited<ReturnType<typeof fetchOnlineShop>>

// ── Data fetcher ───────────────────────────────────────────────────────────────

async function fetchOnlineShop(slug: string) {
  return prisma.shop.findUnique({
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
}

async function getShop(slug: string): Promise<OnlineShop | OfflineShop | null> {
  const shop = await fetchOnlineShop(slug)

  if (!shop) return null                          // 404 — shop doesn't exist

  if (shop.suspended) {
    return { offline: true, name: shop.name }     // offline page — plan expired
  }

  // Enforce plan gate on allowCustomBouquet — only 'premium' (Бізнес) gets it
  return {
    ...shop,
    allowCustomBouquet: shop.plan.slug === 'premium' && shop.allowCustomBouquet,
  }
}

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { shopSlug: string } }
): Promise<Metadata> {
  const shop = await fetchOnlineShop(params.shopSlug)

  if (!shop || shop.suspended) {
    return { title: 'Магазин тимчасово недоступний — FlowerGoUa' }
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

// ── Offline page ───────────────────────────────────────────────────────────────

function ShopOfflinePage({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
          🌸
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {name}
        </h1>
        <p className="text-gray-500 text-base mb-8">
          Цей магазин тимчасово недоступний.
          <br />
          Спробуйте зайти пізніше або зв'яжіться з власником напряму.
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-6 text-sm text-gray-400">
          Powered by{' '}
          <a href="/" className="font-semibold text-pink-500 hover:text-pink-600 transition-colors">
            FlowerGoUa
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ShopPage(
  { params }: { params: { shopSlug: string } }
) {
  const shop = await getShop(params.shopSlug)

  if (!shop) notFound()

  // Offline / suspended state
  if ('offline' in shop) {
    return <ShopOfflinePage name={shop.name} />
  }

  // Serialize dates to strings for client component
  const serialized = {
    ...shop,
    flowers: shop.flowers.map(f => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      madeAt:    f.madeAt ? f.madeAt.toISOString() : null,
    })),
    plan: undefined,
  }

  return <ShopClient shop={serialized as any} />
}
