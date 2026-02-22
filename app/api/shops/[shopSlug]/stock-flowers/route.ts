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
        stockFlowers: {
          where: {
            stockCount: {
              gt: 0
            }
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    return NextResponse.json({ flowers: shop.stockFlowers })
  } catch (error) {
    console.error('Error fetching stock flowers:', error)
    return NextResponse.json({ error: 'Failed to fetch flowers' }, { status: 500 })
  }
}
