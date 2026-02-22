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
        },
        wrappingOptions: {
          where: {
            available: true
          },
          orderBy: {
            price: 'asc'
          }
        }
      }
    })

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      stockFlowers: shop.stockFlowers,
      wrappingOptions: shop.wrappingOptions
    })
  } catch (error: any) {
    console.error('Failed to fetch custom bouquet data:', error)
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    )
  }
}
