import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

async function verifyToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken:       token,
      verificationTokenExpiry: { gt: new Date() },
    },
  })
  if (!user) return null

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified:           true,
      verificationToken:       null,
      verificationTokenExpiry: null,
    },
  })
  return user
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')?.trim()

    if (!token || token.length > 200) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    return NextResponse.redirect(new URL('/login?verified=1', request.url))
  } catch (error: unknown) {
    logger.error('auth/verify-email', 'Verification failed', { error: String(error) })
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string' || token.length > 200) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Email підтверджено! Тепер можна увійти.' })
  } catch (error: unknown) {
    logger.error('auth/verify-email/post', 'Verification failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 })
  }
}
