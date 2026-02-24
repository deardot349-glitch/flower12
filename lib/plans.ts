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
  allowTelegram: boolean
  allowDeliveryZones: boolean
  allowAnalytics: boolean
  allowCustomColors: boolean
  allowCoverPhoto: boolean
  allowStockManagement: boolean
  allowWrappingOptions: boolean
  allowRemoveBranding: boolean
  features: string[]
  limitations: string[]
  highlight?: boolean
}

export const PLANS: PlanConfig[] = [
  {
    slug: 'free',
    name: 'Безкоштовний',
    price: 0,
    priceLabel: 'Безкоштовно',
    tagline: 'Спробуйте платформу з простим магазином.',
    durationDays: 0,
    maxBouquets: 5,
    allowProfileDetails: false,
    allowTelegram: false,
    allowDeliveryZones: false,
    allowAnalytics: false,
    allowCustomColors: false,
    allowCoverPhoto: false,
    allowStockManagement: false,
    allowWrappingOptions: false,
    allowRemoveBranding: false,
    features: [
      'До 5 букетів у каталозі',
      'Базова сторінка магазину',
      'Приймання замовлень',
      'Email сповіщення',
    ],
    limitations: [
      'Без Telegram сповіщень',
      'Без зон доставки',
      'Без аналітики',
      'Брендинг платформи на сторінці',
    ],
  },
  {
    slug: 'basic',
    name: 'Базовий',
    price: 800,
    priceLabel: '800 грн / міс',
    tagline: 'Для магазинів, що розвиваються.',
    durationDays: 30,
    maxBouquets: 30,
    allowProfileDetails: true,
    allowTelegram: true,
    allowDeliveryZones: true,
    allowAnalytics: false,
    allowCustomColors: false,
    allowCoverPhoto: false,
    allowStockManagement: false,
    allowWrappingOptions: false,
    allowRemoveBranding: true,
    features: [
      'До 30 букетів у каталозі',
      'Повний профіль (адреса, години, контакти)',
      'Telegram сповіщення з кнопками',
      'Зони доставки',
      'WhatsApp та Instagram посилання',
      'Без брендингу платформи',
      'Базова статистика замовлень',
    ],
    limitations: [
      'Без аналітики',
      'Без кастомних кольорів',
    ],
    highlight: true,
  },
  {
    slug: 'premium',
    name: 'Преміум',
    price: 1500,
    priceLabel: '1500 грн / міс',
    tagline: 'Максимум можливостей для серйозного бізнесу.',
    durationDays: 30,
    maxBouquets: 100,
    allowProfileDetails: true,
    allowTelegram: true,
    allowDeliveryZones: true,
    allowAnalytics: true,
    allowCustomColors: true,
    allowCoverPhoto: true,
    allowStockManagement: true,
    allowWrappingOptions: true,
    allowRemoveBranding: true,
    features: [
      'До 100 букетів у каталозі',
      'Все з Базового плану',
      'Повна аналітика (замовлення, дохід, популярні квіти)',
      'Кастомні кольори та логотип',
      'Фото обкладинки',
      'Управління запасами',
      'Варіанти обгортання',
      'Пріоритетна підтримка',
    ],
    limitations: [],
  },
]

export function getPlanConfig(slug: string | null | undefined): PlanConfig {
  const fallback = PLANS[0]
  if (!slug) return fallback
  const match = PLANS.find((p) => p.slug === slug)
  return match ?? fallback
}

// Check if a shop's plan allows a specific feature
export function planAllows(planSlug: string | null | undefined, feature: keyof PlanConfig): boolean {
  const plan = getPlanConfig(planSlug)
  return !!plan[feature]
}
