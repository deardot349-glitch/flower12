export type PlanSlug = 'free' | 'basic' | 'premium'

export interface PlanConfig {
  slug: PlanSlug
  name: string
  price: number
  priceLabel: string
  tagline: string
  /** How long the plan lasts. 7 for Старт, 30 for paid. */
  durationDays: number
  maxBouquets: number
  // ── feature gates ──────────────────────────────────────────────────────────
  allowProfileDetails: boolean
  allowTelegram: boolean
  allowCustomColors: boolean
  allowCoverPhoto: boolean
  allowLogoUpload: boolean
  allowCustomBouquet: boolean
  allowWrappingOptions: boolean
  allowStockManagement: boolean
  allowCustomExtras: boolean
  allowRemoveBranding: boolean
  /** Shop appears in public /shops directory */
  allowDirectoryListing: boolean
  // ── display ────────────────────────────────────────────────────────────────
  features: string[]
  limitations: string[]
  highlight?: boolean
}

export const PLANS: PlanConfig[] = [
  // ──────────────────────────────────────────────────── СТАРТ (free) ─────
  {
    slug: 'free',
    name: 'Старт',
    price: 0,
    priceLabel: 'Безкоштовно',
    tagline: '7 днів щоб спробувати — без картки.',
    durationDays: 7,
    maxBouquets: 10,

    allowProfileDetails: true,
    allowTelegram: false,
    allowCustomColors: false,
    allowCoverPhoto: false,
    allowLogoUpload: false,
    allowCustomBouquet: false,
    allowWrappingOptions: false,
    allowStockManagement: false,
    allowCustomExtras: false,
    allowRemoveBranding: false,
    allowDirectoryListing: false,

    features: [
      'До 10 букетів',
      'Публічна сторінка магазину',
      'Приймання замовлень онлайн',
      'Email сповіщення про нові замовлення',
    ],
    limitations: [
      '7 днів — після чого магазин вимикається',
      'Без Telegram сповіщень',
      'Без фото обкладинки та логотипу',
      'Без кастомних кольорів',
      'Без відображення у каталозі /shops',
      'Брендинг FlowerGoUa на сторінці',
    ],
  },

  // ────────────────────────────────────────────────────── ПРО (basic) ───
  {
    slug: 'basic',
    name: 'Про',
    price: 490,
    priceLabel: '490 грн / міс',
    tagline: 'Все для повноцінного онлайн-магазину.',
    durationDays: 30,
    maxBouquets: 999,

    allowProfileDetails: true,
    allowTelegram: true,
    allowCustomColors: true,
    allowCoverPhoto: true,
    allowLogoUpload: false,
    allowCustomBouquet: false,
    allowWrappingOptions: false,
    allowStockManagement: false,
    allowCustomExtras: false,
    allowRemoveBranding: true,
    allowDirectoryListing: true,

    features: [
      'Необмежена кількість букетів',
      'Telegram сповіщення з кнопками',
      'Фото обкладинки магазину',
      'Кастомні кольори та тема бренду',
      '📍 Відображення у каталозі /shops',
      'Без брендингу FlowerGoUa',
    ],
    limitations: [
      'Без логотипу магазину',
      'Без конструктора букетів на замовлення',
      'Без управління запасами квітів',
    ],
    highlight: true,
  },

  // ─────────────────────────────────────────── БІЗНЕС (premium) ───
  {
    slug: 'premium',
    name: 'Бізнес',
    price: 990,
    priceLabel: '990 грн / міс',
    tagline: 'Повний контроль для серйозного бізнесу.',
    durationDays: 30,
    maxBouquets: 999,

    allowProfileDetails: true,
    allowTelegram: true,
    allowCustomColors: true,
    allowCoverPhoto: true,
    allowLogoUpload: true,
    allowCustomBouquet: true,
    allowWrappingOptions: true,
    allowStockManagement: true,
    allowCustomExtras: true,
    allowRemoveBranding: true,
    allowDirectoryListing: true,

    features: [
      'Все з плану Про',
      '🔥 Кастомний конструктор букетів',
      '🔥 Управління запасами квітів',
      '🔥 Варіанти обгортання та додатки',
      '🔥 Власний логотип магазину',
      '📍 Пріоритетне відображення у каталозі',
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
