import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — toggle active / update
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const shop = await prisma.shop.findFirst({ where: { owner: { email: session.user.email } }, select: { id: true } })
  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const code = await prisma.discountCode.updateMany({
    where: { id: params.id, shopId: shop.id },
    data: body,
  })
  return NextResponse.json({ ok: true })
}

// DELETE
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const shop = await prisma.shop.findFirst({ where: { owner: { email: session.user.email } }, select: { id: true } })
  if (!shop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.discountCode.deleteMany({ where: { id: params.id, shopId: shop.id } })
  return NextResponse.json({ ok: true })
}
