import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './lib/rateLimit'

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const rateLimitResponse = rateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
