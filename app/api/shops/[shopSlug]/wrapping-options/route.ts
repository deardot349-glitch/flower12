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
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    return NextResponse.json({ options: shop.wrappingOptions })
  } catch (error) {
    console.error('Error fetching wrapping options:', error)
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
  }
}
