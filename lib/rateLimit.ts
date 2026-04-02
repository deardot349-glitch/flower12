import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Config ─────────────────────────────────────────────────────────────────────
interface RateLimitConfig { limit: number; windowSeconds: number }

const CONFIGS: Record<string, RateLimitConfig> = {
  '/api/auth/signup':   { limit: 5,   windowSeconds: 60 },
  '/api/auth':          { limit: 10,  windowSeconds: 60 },
  '/api/orders/track':  { limit: 10,  windowSeconds: 60 },
  '/api/orders':        { limit: 20,  windowSeconds: 60 },
  '/api/subscriptions': { limit: 5,   windowSeconds: 60 },
  default:              { limit: 100, windowSeconds: 60 },
}

function getConfig(path: string): RateLimitConfig {
  for (const [pattern, cfg] of Object.entries(CONFIGS)) {
    if (pattern !== 'default' && path.startsWith(pattern)) return cfg
  }
  return CONFIGS.default
}

// ── In-memory fallback ─────────────────────────────────────────────────────────
// Works in development and single-instance environments.
// On Vercel with multiple serverless instances this is NOT reliable —
// configure Upstash (see below) for proper distributed rate limiting.
const mem = new Map<string, { count: number; resetTime: number }>()

function memCheck(key: string, cfg: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = mem.get(key)
  if (!entry || now > entry.resetTime) {
    mem.set(key, { count: 1, resetTime: now + cfg.windowSeconds * 1000 })
    return false // not rate-limited
  }
  if (entry.count >= cfg.limit) return true // rate-limited
  entry.count++
  return false
}

// ── Upstash Redis via REST API (no npm package required) ───────────────────────
// 1. Create a free database at https://console.upstash.com
// 2. Add to Vercel → Settings → Environment Variables:
//    UPSTASH_REDIS_REST_URL   = https://xxx.upstash.io
//    UPSTASH_REDIS_REST_TOKEN = Axxxxx...
// When both vars are present, Upstash is used automatically.
async function upstashCheck(key: string, cfg: RateLimitConfig): Promise<boolean | null> {
  const restUrl   = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!restUrl || !restToken) return null // not configured → fall through to mem

  try {
    const res = await fetch(`${restUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${restToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, cfg.windowSeconds, 'NX'], // set TTL only on new key
      ]),
    })
    if (!res.ok) return null
    const data = await res.json()
    const count: number = data?.[0]?.result ?? 0
    return count > cfg.limit
  } catch {
    // Upstash unreachable → fall through to in-memory
    return null
  }
}

// ── Public export ──────────────────────────────────────────────────────────────
export async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    (request as any).ip ||
    'unknown'

  const path = request.nextUrl.pathname
  const cfg  = getConfig(path)
  const key  = `rl:${ip}:${path}`

  const upResult = await upstashCheck(key, cfg)
  const limited  = upResult !== null ? upResult : memCheck(key, cfg)

  if (!limited) return null

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.', retryAfter: cfg.windowSeconds },
    {
      status: 429,
      headers: {
        'Retry-After':           String(cfg.windowSeconds),
        'X-RateLimit-Limit':     String(cfg.limit),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}
