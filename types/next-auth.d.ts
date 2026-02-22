import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    shopId?: string
    shopSlug?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      shopId?: string
      shopSlug?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    shopId?: string
    shopSlug?: string
  }
}
