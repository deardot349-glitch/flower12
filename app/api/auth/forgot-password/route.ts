import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email/service'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalized = email.toLowerCase().trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } })

    // Always return the same message — don't reveal whether the email exists
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.',
      })
    }

    const resetToken       = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data:  { resetToken, resetTokenExpiry },
    })

    sendPasswordResetEmail(normalized, resetToken).catch(() => {
      logger.error('auth/forgot-password', 'Failed to send reset email', { userId: user.id })
    })

    return NextResponse.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
    })
  } catch (error: unknown) {
    logger.error('auth/forgot-password', 'Handler failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
