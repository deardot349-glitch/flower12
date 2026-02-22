// Error logging and monitoring
// For production, integrate with Sentry: npm install @sentry/nextjs

interface ErrorLog {
  timestamp: Date
  level: 'error' | 'warning' | 'info'
  message: string
  context?: any
  userId?: string
  shopId?: string
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(log: ErrorLog): string {
    return `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message} ${
      log.context ? JSON.stringify(log.context) : ''
    }`
  }

  error(message: string, context?: any, error?: Error) {
    const log: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      message,
      context,
      stack: error?.stack,
      ...context
    }

    console.error(this.formatLog(log))

    // In production, send to Sentry or logging service
    if (!this.isDevelopment) {
      // TODO: Send to Sentry
      // Sentry.captureException(error || new Error(message), { extra: context })
    }

    return log
  }

  warning(message: string, context?: any) {
    const log: ErrorLog = {
      timestamp: new Date(),
      level: 'warning',
      message,
      context
    }

    console.warn(this.formatLog(log))

    if (!this.isDevelopment) {
      // TODO: Send to monitoring service
    }

    return log
  }

  info(message: string, context?: any) {
    const log: ErrorLog = {
      timestamp: new Date(),
      level: 'info',
      message,
      context
    }

    if (this.isDevelopment) {
      console.log(this.formatLog(log))
    }

    return log
  }

  // Track business metrics
  metric(name: string, value: number, tags?: Record<string, string>) {
    const log = {
      timestamp: new Date(),
      metric: name,
      value,
      tags
    }

    if (this.isDevelopment) {
      console.log(`[METRIC] ${name}: ${value}`, tags)
    }

    // TODO: Send to analytics service (PostHog, Mixpanel, etc.)
  }

  // Track user actions
  track(event: string, properties?: Record<string, any>) {
    const log = {
      timestamp: new Date(),
      event,
      properties
    }

    if (this.isDevelopment) {
      console.log(`[TRACK] ${event}`, properties)
    }

    // TODO: Send to analytics
  }
}

export const logger = new Logger()

// Helper to wrap async functions with error logging
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error: any) {
      logger.error(`Error in ${context || fn.name}`, { args }, error)
      throw error
    }
  }) as T
}
