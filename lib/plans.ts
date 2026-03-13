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
  allowCustomBouquet: boolean
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
    tagline: 'Спробуйте платформу без жодного ризику.',
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
    allowCustomBouquet: false,
    allowRemoveBranding: false,
    features: [
      'До 5 букетів (ідеально для старту та тестування)',
      'Публічна сторінка магазину — поділіться з першими клієнтами',
      'Приймання замовлень через сайт',
      'Email сповіщення про нові замовлення',
    ],
    limitations: [
      'Без кастомного конструктора букетів',
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
    tagline: 'Для магазинів що активно ростуть.',
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
    allowCustomBouquet: false,
    allowRemoveBranding: true,
    features: [
      'До 30 букетів (ідеально для більшості магазинів)',
      'Повний профіль — адреса, години роботи, контакти',
      'Telegram сповіщення з кнопками — не пропустіть жодне замовлення',
      'Зони доставки з вартістю — клієнти бачать ціну одразу',
      'Посилання на WhatsApp та Instagram',
      'Без логотипу платформи — магазин виглядає вашим',
      'Базова статистика замовлень',
    ],
    limitations: [
      'Без кастомного конструктора букетів',
      'Без детальної аналітики',
      'Без кастомних кольорів',
    ],
    highlight: true,
  },
  {
    slug: 'premium',
    name: 'Преміум',
    price: 1500,
    priceLabel: '1500 грн / міс',
    tagline: 'Повний контроль для серйозного бізнесу.',
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
    allowCustomBouquet: true,
    allowRemoveBranding: true,
    features: [
      'До 100 букетів — повний каталог без обмежень',
      'Все з Базового плану',
      '🔥 Кастомний конструктор букетів — клієнт збирає сам',
      '🔥 Кастом речі — іграшки, вузлики, цукерки тощо',
      'Детальна аналітика — доходи, популярні букети, тренди',
      'Власні кольори та логотип — повністю ваш бренд',
      'Фото обкладинки — перше враження, що продає',
      'Управління запасами — клієнти бачать наявність',
      'Варіанти обгортання — більше вибору = більший чек',
      'Пріоритетна підтримка — відповідаємо першочергово',
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

export function planAllows(planSlug: string | null | undefined, feature: keyof PlanConfig): boolean {
  const plan = getPlanConfig(planSlug)
  return !!plan[feature]
}
