import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Emergency password reset - secured by ADMIN_SECRET env var
// POST /api/auth/emergency-reset
// Body: { secret: "your_admin_secret", email: "user@email.com", newPassword: "newpass123" }
export async function POST(request: Request) {
  try {
    const { secret, email, newPassword } = await request.json()

    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret || secret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'email and newPassword required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { shop: true }
    })

    if (!user) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    return NextResponse.json({
      success: true,
      message: `Password reset for ${email}. Shop: ${user.shop?.slug || 'none'}. Login now.`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
