/**
 * Password validation with strong requirements
 */
export function validatePassword(password: string): { 
  valid: boolean
  error?: string 
} {
  if (!password || password.length < 8) {
    return { 
      valid: false, 
      error: 'Password must be at least 8 characters long' 
    }
  }

  if (!/[A-Z]/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one uppercase letter (A-Z)' 
    }
  }

  if (!/[a-z]/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one lowercase letter (a-z)' 
    }
  }

  if (!/[0-9]/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one number (0-9)' 
    }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { 
      valid: false, 
      error: 'Password must contain at least one special character (!@#$%^&*...)' 
    }
  }

  return { valid: true }
}

/**
 * Email validation
 */
export function validateEmail(email: string): { 
  valid: boolean
  error?: string 
} {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}

/**
 * Shop name validation
 */
export function validateShopName(name: string): { 
  valid: boolean
  error?: string 
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Shop name is required' }
  }

  if (name.trim().length < 3) {
    return { valid: false, error: 'Shop name must be at least 3 characters' }
  }

  if (name.trim().length > 50) {
    return { valid: false, error: 'Shop name must be less than 50 characters' }
  }

  return { valid: true }
}

/**
 * Phone number validation (basic)
 */
export function validatePhone(phone: string): { 
  valid: boolean
  error?: string 
} {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Phone number is required' }
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Check if it contains only digits and optional + at start
  if (!/^\+?\d{10,15}$/.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid phone number format. Must be 10-15 digits.' 
    }
  }

  return { valid: true }
}

/**
 * Sanitize string input (remove HTML, scripts, etc.)
 */
export function sanitizeString(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim()
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): { 
  valid: boolean
  error?: string 
} {
  if (!url || url.trim().length === 0) {
    return { valid: true } // URL is optional
  }

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}
