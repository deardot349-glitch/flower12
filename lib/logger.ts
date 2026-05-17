/**
 * Minimal structured logger.
 *
 * - In development: pretty-prints to console.
 * - In production: emits JSON for log aggregators (Vercel, Datadog, etc.).
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.error('order/create', 'Failed to create order', { orderId, error: e.message })
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level:   Level
  scope:   string
  message: string
  data?:   Record<string, unknown>
  ts:      string
}

function log(level: Level, scope: string, message: string, data?: Record<string, unknown>) {
  if (level === 'debug' && process.env.NODE_ENV === 'production') return

  const entry: LogEntry = { level, scope, message, ts: new Date().toISOString(), ...(data ? { data } : {}) }

  if (process.env.NODE_ENV === 'development') {
    const prefix = { debug: '🔍', info: 'ℹ️ ', warn: '⚠️ ', error: '❌' }[level]
    const detail = data ? ` ${JSON.stringify(data)}` : ''
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](`${prefix} [${scope}] ${message}${detail}`)
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  debug: (scope: string, message: string, data?: Record<string, unknown>) => log('debug', scope, message, data),
  info:  (scope: string, message: string, data?: Record<string, unknown>) => log('info',  scope, message, data),
  warn:  (scope: string, message: string, data?: Record<string, unknown>) => log('warn',  scope, message, data),
  error: (scope: string, message: string, data?: Record<string, unknown>) => log('error', scope, message, data),
}
