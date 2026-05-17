import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set')
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const normalizedEmail = credentials.email.toLowerCase().trim()

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { shop: true },
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )
        if (!isPasswordValid) return null

        // ── Email verification gate ──────────────────────────────────────
        if (!user.emailVerified) {
          if (!user.verificationToken) {
            // Legacy account without a pending token — verify silently
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: true },
            })
          } else {
            // New account awaiting verification
            throw new Error('EmailNotVerified')
          }
        }

        return {
          id:        user.id,
          email:     user.email,
          shopId:    user.shop?.id    ?? undefined,
          shopSlug:  user.shop?.slug  ?? undefined,
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id
        token.shopId   = user.shopId
        token.shopSlug = user.shopSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.id
        session.user.shopId   = token.shopId
        session.user.shopSlug = token.shopSlug
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  // Disable error details in production
  debug: process.env.NODE_ENV === 'development',
}
