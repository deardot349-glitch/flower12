// ─── Currency utility ─────────────────────────────────────────────────────────
// Single source of truth for currency symbols used across the entire app.
// Previously this logic was copy-pasted in 5+ files.

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'UAH': return '₴'
    case 'EUR': return '€'
    case 'GBP': return '£'
    case 'PLN': return 'zł'
    default:    return '$'
  }
}
