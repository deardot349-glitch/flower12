import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// For production, use Redis (Upstash Redis recommended)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  limit: number
  window: number // in milliseconds
}

const configs: Record<string, RateLimitConfig> = {
  '/api/auth/signup': { limit: 5, window: 60000 }, // 5 signups per minute
  '/api/auth': { limit: 10, window: 60000 }, // 10 login attempts per minute
  '/api/orders': { limit: 20, window: 60000 }, // 20 orders per minute
  '/api/subscriptions': { limit: 5, window: 60000 }, // 5 subscription attempts per minute
  default: { limit: 100, window: 60000 } // 100 requests per minute for other routes
}

export function rateLimit(request: NextRequest): NextResponse | null {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const path = request.nextUrl.pathname
  const now = Date.now()

  // Find matching config
  let config = configs.default
  for (const [pattern, cfg] of Object.entries(configs)) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      config = cfg
      break
    }
  }

  const key = `${ip}:${path}`
  const clientData = rateLimitMap.get(key)

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    const keys = Array.from(rateLimitMap.keys())
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      const v = rateLimitMap.get(k)
      if (v && now > v.resetTime) {
        rateLimitMap.delete(k)
      }
    }
  }

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.window })
    return null
  }

  if (clientData.count >= config.limit) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((clientData.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(clientData.resetTime)
        }
      }
    )
  }

  clientData.count++
  return null
}
