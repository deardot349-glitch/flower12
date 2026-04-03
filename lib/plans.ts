export type PlanSlug = 'free' | 'basic' | 'premium'

export interface PlanConfig {
  slug: PlanSlug
  name: string
  price: number
  priceLabel: string
  tagline: string
  durationDays: number
  maxBouquets: number          // 999 = unlimited
  // ── feature gates ──────────────────────────
  allowProfileDetails: boolean // address, hours, phone on free page
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
  // ── display ────────────────────────────────
  features: string[]
  limitations: string[]
  highlight?: boolean
}

export const PLANS: PlanConfig[] = [
  // ─────────────────────────────────────────────────────────────── FREE ──────
  {
    slug: 'free',
    name: 'Безкоштовний',
    price: 0,
    priceLabel: 'Безкоштовно',
    tagline: 'Спробуйте платформу без жодного ризику.',
    durationDays: 0,
    maxBouquets: 5, // strictly 5 on free

    // Free gets a complete-looking profile so the shop page doesn't look broken
    allowProfileDetails: true,   // address, working hours, phone number visible
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
    allowRemoveBranding: false,  // platform branding shown

    features: [
      'До 5 букетів — щоб запуститись',
      'Публічна сторінка магазину з адресою та годинами роботи',
      'Приймання замовлень через сайт',
      'Email сповіщення про нові замовлення',
    ],
    limitations: [
      'Без Telegram сповіщень',
      'Без зон доставки',
      'Без аналітики',
      'Без кастомних кольорів і логотипу',
      'Брендинг FlowerGoUa на сторінці',
    ],
  },

  // ────────────────────────────────────────────────────────────── BASIC ──────
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
    allowAnalytics: false,        // analytics is Premium only
    allowCustomColors: false,     // branding customisation is Premium
    allowCoverPhoto: true,        // cover photo: basic gets it
    allowLogoUpload: false,       // logo upload: Premium only
    allowStockManagement: false,
    allowWrappingOptions: false,
    allowCustomBouquet: false,
    allowCustomExtras: false,
    allowRemoveBranding: true,

    features: [
      'До 40 букетів — вистачить для більшості магазинів',
      'Повний профіль — адреса, години, контакти',
      'Telegram сповіщення з кнопками — не пропустіть жодне замовлення',
      'Зони доставки з вартістю — клієнти бачать ціну одразу',
      'Фото обкладинки — красивий перший екран',
      'Посилання на WhatsApp та Instagram',
      'Без логотипу FlowerGoUa на сторінці',
    ],
    limitations: [
      'Без кастомних кольорів та логотипу магазину',
      'Без кастомного конструктора букетів',
      'Без аналітики та трендів',
    ],
    highlight: true,
  },

  // ─────────────────────────────────────────────────────────────── PREMIUM ──
  {
    slug: 'premium',
    name: 'Преміум',
    price: 2000,
    priceLabel: '2000 грн / міс',
    tagline: 'Повний контроль для серйозного бізнесу.',
    durationDays: 30,
    maxBouquets: 999,             // unlimited

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

    features: [
      'Необмежена кількість букетів',
      'Все з Базового плану',
      '🔥 Кастомний конструктор букетів — клієнт збирає сам',
      '🔥 Кастом речі — іграшки, вузлики, цукерки тощо',
      '🔥 Управління запасами квітів',
      '🔥 Варіанти обгортання для кастому',
      'Детальна аналітика — доходи, популярні букети, тренди',
      'Власні кольори та логотип — повністю ваш бренд',
      'Пріоритетна підтримка — відповідаємо першочергово',
    ],
    limitations: [],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

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
