import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './lib/rateLimit'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── Admin route protection ─────────────────────────────────────────────────
  // Returns 404 to anyone who didn't supply the secret query param.
  // This makes the route undiscoverable by scanners.
  // Referer-based bypass was removed — it is trivially spoofable.
  if (path === '/admin' || path.startsWith('/admin/')) {
    const adminSecret = process.env.ADMIN_SECRET
    const suppliedParam = request.nextUrl.searchParams.get('_a')

    // If ADMIN_SECRET is not configured, block all access
    if (!adminSecret || suppliedParam !== adminSecret) {
      return new NextResponse(null, { status: 404 })
    }
  }

  // ── API rate limiting ──────────────────────────────────────────────────────
  if (path.startsWith('/api')) {
    const rateLimitResponse = await rateLimit(request)
    if (rateLimitResponse) return rateLimitResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/admin', '/admin/:path*'],
}
