export type PlanSlug = 'free' | 'basic' | 'premium'

export interface PlanConfig {
  slug: PlanSlug
  name: string
  price: number
  priceLabel: string
  tagline: string
  durationDays: number
  maxBouquets: number
  // ── feature gates ──────────────────────────────────────────────────────────
  allowProfileDetails: boolean
  allowTelegram: boolean
  allowDeliveryZones: boolean
  allowAnalytics: boolean
  allowCustomColors: boolean
  allowCoverPhoto: boolean
  allowLogoUpload: boolean
  allowStockManagement: boolean
  allowWrappingOptions: boolean
  allowCustomBouquet: boolean
  allowCustomExtras: boolean
  allowRemoveBranding: boolean
  /** Shop appears in the public /shops directory */
  allowDirectoryListing: boolean
  // ── display ────────────────────────────────────────────────────────────────
  features: string[]
  limitations: string[]
  highlight?: boolean
}

export const PLANS: PlanConfig[] = [
  // ──────────────────────────────────────────────────────────────── FREE ─────
  {
    slug: 'free',
    name: 'Безкоштовний',
    price: 0,
    priceLabel: 'Безкоштовно',
    tagline: 'Спробуйте платформу без жодного ризику.',
    durationDays: 0,
    maxBouquets: 5,

    allowProfileDetails: true,
    allowTelegram: false,
    allowDeliveryZones: false,
    allowAnalytics: false,
    allowCustomColors: false,
    allowCoverPhoto: false,
    allowLogoUpload: false,
    allowStockManagement: false,
    allowWrappingOptions: false,
    allowCustomBouquet: false,
    allowCustomExtras: false,
    allowRemoveBranding: false,
    allowDirectoryListing: false, // ← not listed in /shops

    features: [
      'До 5 букетів — щоб запуститись',
      'Публічна сторінка магазину з адресою та годинами роботи',
      'Приймання замовлень через сайт',
      'Email сповіщення про нові замовлення',
    ],
    limitations: [
      'Без відображення у загальному каталозі /shops',
      'Без Telegram сповіщень',
      'Без зон доставки',
      'Без аналітики',
      'Без кастомних кольорів і логотипу',
      'Брендинг FlowerGoUa на сторінці',
    ],
  },

  // ───────────────────────────────────────────────────────────────── BASIC ───
  {
    slug: 'basic',
    name: 'Базовий',
    price: 900,
    priceLabel: '900 грн / міс',
    tagline: 'Для магазинів що активно ростуть.',
    durationDays: 30,
    maxBouquets: 40,

    allowProfileDetails: true,
    allowTelegram: true,
    allowDeliveryZones: true,
    allowAnalytics: false,
    allowCustomColors: false,
    allowCoverPhoto: true,
    allowLogoUpload: false,
    allowStockManagement: false,
    allowWrappingOptions: false,
    allowCustomBouquet: false,
    allowCustomExtras: false,
    allowRemoveBranding: true,
    allowDirectoryListing: true,  // ← listed in /shops

    features: [
      'До 40 букетів — вистачить для більшості магазинів',
      'Повний профіль — адреса, години, контакти',
      '📍 Відображення у загальному каталозі /shops',
      'Telegram сповіщення з кнопками',
      'Зони доставки з вартістю',
      'Фото обкладинки',
      'Без логотипу FlowerGoUa',
    ],
    limitations: [
      'Без кастомних кольорів та логотипу магазину',
      'Без кастомного конструктора букетів',
      'Без аналітики та трендів',
    ],
    highlight: true,
  },

  // ─────────────────────────────────────────────────────────────── PREMIUM ───
  {
    slug: 'premium',
    name: 'Преміум',
    price: 2000,
    priceLabel: '2000 грн / міс',
    tagline: 'Повний контроль для серйозного бізнесу.',
    durationDays: 30,
    maxBouquets: 999,

    allowProfileDetails: true,
    allowTelegram: true,
    allowDeliveryZones: true,
    allowAnalytics: true,
    allowCustomColors: true,
    allowCoverPhoto: true,
    allowLogoUpload: true,
    allowStockManagement: true,
    allowWrappingOptions: true,
    allowCustomBouquet: true,
    allowCustomExtras: true,
    allowRemoveBranding: true,
    allowDirectoryListing: true,  // ← listed in /shops

    features: [
      'Необмежена кількість букетів',
      'Все з Базового плану',
      '📍 Пріоритетне відображення у каталозі /shops',
      '🔥 Кастомний конструктор букетів',
      '🔥 Управління запасами квітів',
      '🔥 Варіанти обгортання',
      'Детальна аналітика',
      'Власні кольори та логотип',
      'Пріоритетна підтримка',
    ],
    limitations: [],
  },
]

export function getPlanConfig(slug: string | null | undefined): PlanConfig {
  const fallback = PLANS[0]
  if (!slug) return fallback
  return PLANS.find((p) => p.slug === slug) ?? fallback
}

export function planAllows(
  planSlug: string | null | undefined,
  feature: keyof PlanConfig
): boolean {
  const plan = getPlanConfig(planSlug)
  return !!plan[feature]
}
