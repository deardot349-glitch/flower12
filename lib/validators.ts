/**
 * Shared validation and sanitisation utilities.
 *
 * All functions are pure and have no side effects.
 */

// ── Password ──────────────────────────────────────────────────────────────────

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Пароль має містити мінімум 8 символів' }
  }
  if (password.length > 128) {
    return { valid: false, error: 'Пароль занадто довгий (максимум 128 символів)' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Пароль має містити хоча б одну велику літеру (A–Z)' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Пароль має містити хоча б одну малу літеру (a–z)' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Пароль має містити хоча б одну цифру (0–9)' }
  }
  if (!/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return { valid: false, error: 'Пароль має містити хоча б один спеціальний символ (!@#$%...)' }
  }
  return { valid: true }
}

// ── Email ─────────────────────────────────────────────────────────────────────

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email обовʼязковий' }
  }
  if (email.length > 254) {
    return { valid: false, error: 'Email занадто довгий' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Невірний формат email' }
  }
  return { valid: true }
}

// ── Shop name ─────────────────────────────────────────────────────────────────

export function validateShopName(name: string): { valid: boolean; error?: string } {
  const trimmed = name?.trim()
  if (!trimmed) return { valid: false, error: 'Назва магазину обовʼязкова' }
  if (trimmed.length < 3) return { valid: false, error: 'Назва магазину має містити мінімум 3 символи' }
  if (trimmed.length > 50) return { valid: false, error: 'Назва магазину має містити максимум 50 символів' }
  return { valid: true }
}

// ── Phone ─────────────────────────────────────────────────────────────────────

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone?.trim()) return { valid: false, error: 'Номер телефону обовʼязковий' }
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    return { valid: false, error: 'Невірний формат телефону. Введіть 7–15 цифр.' }
  }
  return { valid: true }
}

// ── URL ───────────────────────────────────────────────────────────────────────

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url?.trim()) return { valid: true } // optional
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL має починатись з http:// або https://' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Невірний формат URL' }
  }
}

// ── String sanitiser ──────────────────────────────────────────────────────────
// Removes HTML tags and dangerous patterns to prevent XSS stored in plain text
// fields (name, address, description, etc.).  For fields that will be rendered
// inside HTML, additional output-encoding is always required.

const DANGEROUS_PATTERNS = [
  /<[^>]*>/g,           // HTML tags
  /javascript\s*:/gi,   // javascript: URIs
  /data\s*:/gi,         // data: URIs
  /on\w+\s*=/gi,        // inline event handlers (onclick=, onmouseover=, …)
  /<!--[\s\S]*?-->/g,   // HTML comments
  /<!\[CDATA\[[\s\S]*?\]\]>/gi, // CDATA sections
  /\bvbscript\s*:/gi,   // VBScript
  /expression\s*\(/gi,  // CSS expression()
]

export function sanitizeString(input: string): string {
  if (!input) return ''
  let result = input
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '')
  }
  return result.trim()
}
