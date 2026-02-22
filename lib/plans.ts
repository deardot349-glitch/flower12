export type PlanSlug = 'free' | 'basic' | 'premium'

export interface PlanConfig {
  slug: PlanSlug
  name: string
  price: number
  priceLabel: string
  tagline: string
  durationDays: number
  maxBouquets: number
  allowProfileDetails: boolean
  features: string[]
  highlight?: boolean
}

export const PLANS: PlanConfig[] = [
  {
    slug: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free Forever',
    tagline: 'Try the platform with a simple shop.',
    durationDays: 0, // No expiry
    maxBouquets: 10,
    allowProfileDetails: false,
    features: [
      'Up to 10 bouquets',
      'Basic shop page',
      'Customer inquiries',
      'Limited customization'
    ]
  },
  {
    slug: 'basic',
    name: 'Basic',
    price: 15,
    priceLabel: '$15 / month',
    tagline: 'For growing shops with professional needs.',
    durationDays: 30,
    maxBouquets: 50,
    allowProfileDetails: true,
    features: [
      'Up to 50 bouquets',
      'Full profile customization',
      'Location & hours display',
      'Priority support',
      'Monthly renewal'
    ],
    highlight: true,
  },
  {
    slug: 'premium',
    name: 'Premium',
    price: 149,
    priceLabel: '$149 / year',
    tagline: 'Best value! For serious florists.',
    durationDays: 365,
    maxBouquets: 200,
    allowProfileDetails: true,
    features: [
      'Up to 200 bouquets',
      'Full profile customization',
      'Analytics dashboard',
      'Priority support',
      'Annual plan (save $31)',
      'Custom domain ready'
    ],
  },
]

export function getPlanConfig(slug: string | null | undefined): PlanConfig {
  const fallback = PLANS[0]
  if (!slug) return fallback
  const match = PLANS.find((p) => p.slug === slug)
  return match ?? fallback
}
