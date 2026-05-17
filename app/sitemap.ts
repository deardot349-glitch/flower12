import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://flowergoua.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${baseUrl}/shops`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/login`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/signup`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Active shop pages
  let shopPages: MetadataRoute.Sitemap = []
  try {
    const shops = await prisma.shop.findMany({
      where:  { suspended: false },
      select: { slug: true, updatedAt: true },
      take:   500,
    })
    shopPages = shops.map((shop) => ({
      url:             `${baseUrl}/${shop.slug}`,
      lastModified:    shop.updatedAt,
      changeFrequency: 'daily' as const,
      priority:        0.8,
    }))
  } catch {
    // DB unavailable at build time — skip shop pages
  }

  return [...staticPages, ...shopPages]
}
