import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './lib/rateLimit'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ── Admin route protection ─────────────────────────────────────────────────
  // Return a plain 404 to anyone who didn't arrive via the internal admin link.
  // The admin panel itself sends ?_a=1 — anything else gets a 404.
  // This makes the route undiscoverable by scanners and curious visitors.
  // To access admin: navigate to /admin?_a=1  (or set it as a bookmark).
  if (path === '/admin' || path.startsWith('/admin/')) {
    const hasAdminFlag = request.nextUrl.searchParams.has('_a')
    // Allow if: has the flag, OR is an internal navigation (referer from same origin)
    const referer = request.headers.get('referer') || ''
    const sameOrigin = referer.includes(request.nextUrl.host)
    if (!hasAdminFlag && !sameOrigin) {
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
