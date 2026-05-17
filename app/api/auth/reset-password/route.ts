import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/validators'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || typeof token !== 'string' || token.length > 200) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 })
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken:       token,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12) // cost factor 12 in production

    await prisma.user.update({
      where: { id: user.id },
      data:  {
        passwordHash,
        resetToken:       null,
        resetTokenExpiry: null,
      },
    })

    logger.info('auth/reset-password', 'Password reset successfully', { userId: user.id })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    })
  } catch (error: unknown) {
    logger.error('auth/reset-password', 'Reset failed', { error: String(error) })
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
