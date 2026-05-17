import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { sanitizeString } from '@/lib/validators'

const VALID_AVAILABILITY = ['in_stock', 'limited', 'out_of_stock']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flowerId = params.id
    if (!flowerId || typeof flowerId !== 'string' || flowerId.length > 50) {
      return NextResponse.json({ error: 'Invalid flower ID' }, { status: 400 })
    }

    const body = await request.json()

    // ── Verify ownership before anything else ─────────────────────────────────
    const flower = await prisma.flower.findUnique({ where: { id: flowerId } })
    if (!flower || flower.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // ── Validate price ────────────────────────────────────────────────────────
    let parsedPrice: number | undefined
    if (body.price !== undefined) {
      parsedPrice = parseFloat(body.price)
      if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 1_000_000) {
        return NextResponse.json({ error: 'Невірна ціна' }, { status: 400 })
      }
    }

    // ── Validate name ─────────────────────────────────────────────────────────
    let cleanName: string | undefined
    if (body.name !== undefined) {
      cleanName = sanitizeString(String(body.name).trim()).slice(0, 200)
      if (!cleanName) {
        return NextResponse.json({ error: 'Назва не може бути порожньою' }, { status: 400 })
      }
    }

    // ── Validate availability ─────────────────────────────────────────────────
    if (body.availability !== undefined && !VALID_AVAILABILITY.includes(body.availability)) {
      return NextResponse.json({ error: 'Невірний статус наявності' }, { status: 400 })
    }

    // ── Validate image URL ────────────────────────────────────────────────────
    let cleanImageUrl: string | null | undefined
    if (body.imageUrl !== undefined) {
      if (!body.imageUrl) {
        cleanImageUrl = null
      } else {
        try {
          const parsed = new URL(String(body.imageUrl).trim())
          if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
          cleanImageUrl = parsed.href.slice(0, 500)
        } catch {
          return NextResponse.json({ error: 'Невірний URL зображення' }, { status: 400 })
        }
      }
    }

    // ── Validate date ─────────────────────────────────────────────────────────
    let cleanMadeAt: Date | null | undefined
    if (body.madeAt !== undefined) {
      if (!body.madeAt) {
        cleanMadeAt = null
      } else {
        const d = new Date(body.madeAt)
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: 'Невірна дата' }, { status: 400 })
        }
        cleanMadeAt = d
      }
    }

    const updated = await prisma.flower.update({
      where: { id: flowerId },
      data: {
        ...(body.availability !== undefined ? { availability: body.availability }          : {}),
        ...(cleanName         !== undefined ? { name: cleanName }                          : {}),
        ...(parsedPrice       !== undefined ? { price: parsedPrice }                       : {}),
        ...(cleanImageUrl     !== undefined ? { imageUrl: cleanImageUrl }                  : {}),
        ...(body.description  !== undefined ? { description: sanitizeString(String(body.description || '').trim()).slice(0, 1000) || null } : {}),
        ...(cleanMadeAt       !== undefined ? { madeAt: cleanMadeAt }                      : {}),
        ...(body.isCustom     !== undefined ? { isCustom: Boolean(body.isCustom) }         : {}),
      },
    })

    return NextResponse.json({ success: true, flower: updated })
  } catch (error: unknown) {
    logger.error('flowers/patch', 'Flower update failed', { id: params.id, error: String(error) })
    return NextResponse.json({ error: 'Failed to update flower' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const flowerId = params.id
    if (!flowerId || typeof flowerId !== 'string' || flowerId.length > 50) {
      return NextResponse.json({ error: 'Invalid flower ID' }, { status: 400 })
    }

    // ── Verify ownership ──────────────────────────────────────────────────────
    const flower = await prisma.flower.findUnique({ where: { id: flowerId } })
    if (!flower || flower.shopId !== session.user.shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.flower.delete({ where: { id: flowerId } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('flowers/delete', 'Flower deletion failed', { id: params.id, error: String(error) })
    return NextResponse.json({ error: 'Failed to delete flower' }, { status: 500 })
  }
}
