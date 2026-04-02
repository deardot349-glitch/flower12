import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── Shared verification logic ──────────────────────────────────────────────────
async function verifyToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiry: { gt: new Date() },
    },
  })
  if (!user) return null

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  })
  return user
}

// ── GET — for clicking a link in the email ─────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')?.trim()

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Redirect to login with a success flag
    return NextResponse.redirect(new URL('/login?verified=1', request.url))
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}

// ── POST — programmatic (API call from client) ─────────────────────────────────
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email підтверджено! Тепер можна увійти.',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
