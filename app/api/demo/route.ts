import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { PLANS } from '@/lib/plans'
import { logger } from '@/lib/logger'

// ── Auth guard ────────────────────────────────────────────────────────────────
function checkAuth(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') || ''
  return auth.replace('Bearer ', '') === secret
}

const DEMO_SLUG  = 'kvity-demo'
const DEMO_EMAIL = 'demo@flowergoua.com'

// ── Upsert plans so they exist ────────────────────────────────────────────────
async function ensurePlans() {
  await Promise.all(PLANS.map(p =>
    prisma.plan.upsert({
      where: { slug: p.slug },
      create: { name: p.name, slug: p.slug, description: p.tagline, price: p.price, durationDays: p.durationDays, maxBouquets: p.maxBouquets, allowProfileDetails: p.allowProfileDetails, features: JSON.stringify(p.features) },
      update: { name: p.name, price: p.price, durationDays: p.durationDays, maxBouquets: p.maxBouquets },
    })
  ))
}

// ── GET — check if demo exists ────────────────────────────────────────────────
export async function GET() {
  const shop = await prisma.shop.findUnique({ where: { slug: DEMO_SLUG } })
  if (!shop) return NextResponse.json({ exists: false, url: null })
  return NextResponse.json({ exists: true, url: `/${DEMO_SLUG}`, shopId: shop.id })
}

// ── POST — seed demo shop (idempotent) ────────────────────────────────────────
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensurePlans()

    const premiumPlan = await prisma.plan.findUnique({ where: { slug: 'premium' } })
    if (!premiumPlan) return NextResponse.json({ error: 'Premium plan not found' }, { status: 500 })

  // ── User & shop ────────────────────────────────────────────────────────────
  const existing = await prisma.shop.findUnique({ where: { slug: DEMO_SLUG }, include: { owner: true } })

  let shop: { id: string; slug: string } | null = existing
  if (!existing) {
    const emailExists = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
    const passwordHash = await bcrypt.hash('demo-password-not-for-login', 10)

    if (emailExists) {
      // Just create the shop under existing user
      shop = await prisma.shop.create({
        data: {
          name:   'Квіти від Марії 🌸',
          slug:   DEMO_SLUG,
          ownerId: emailExists.id,
          planId: premiumPlan.id,
          about:  'Свіжі букети на кожен день і для особливих моментів. Доставка по місту за 2 години. Працюємо з любов\'ю до кожного клієнта!',
          location:       'вул. Хрещатик 22',
          city:           'Київ',
          country:        'Україна',
          phoneNumber:    '+380991234567',
          telegramHandle: '@kvity_mariyi',
          instagramHandle:'@kvity.mariyi',
          primaryColor:   '#ec4899',
          accentColor:    '#a855f7',
          sameDayDelivery: true,
          deliveryTimeEstimate: '2–4 години',
          deliveryCutoffTime: '16:00',
          minimumOrderAmount: 300,
          showDeliveryEstimate: true,
          showPhone:    true,
          showTelegram: true,
          showInstagram: true,
          showLocation: true,
          allowCustomBouquet: true,
          workingHours: JSON.stringify({
            monday:    { open: '09:00', close: '19:00', closed: false },
            tuesday:   { open: '09:00', close: '19:00', closed: false },
            wednesday: { open: '09:00', close: '19:00', closed: false },
            thursday:  { open: '09:00', close: '19:00', closed: false },
            friday:    { open: '09:00', close: '20:00', closed: false },
            saturday:  { open: '10:00', close: '18:00', closed: false },
            sunday:    { open: '11:00', close: '16:00', closed: false },
          }),
        },
      })
    } else {
      const user = await prisma.user.create({
        data: {
          email:         DEMO_EMAIL,
          passwordHash,
          emailVerified: true,
          shop: {
            create: {
              name:   'Квіти від Марії 🌸',
              slug:   DEMO_SLUG,
              planId: premiumPlan.id,
              about:  'Свіжі букети на кожен день і для особливих моментів. Доставка по місту за 2 години. Працюємо з любов\'ю до кожного клієнта!',
              location:       'вул. Хрещатик 22',
              city:           'Київ',
              country:        'Україна',
              phoneNumber:    '+380991234567',
              telegramHandle: '@kvity_mariyi',
              instagramHandle:'@kvity.mariyi',
              primaryColor:   '#ec4899',
              accentColor:    '#a855f7',
              sameDayDelivery: true,
              deliveryTimeEstimate: '2–4 години',
              deliveryCutoffTime: '16:00',
              minimumOrderAmount: 300,
              showDeliveryEstimate: true,
              showPhone:    true,
              showTelegram: true,
              showInstagram: true,
              showLocation: true,
              allowCustomBouquet: true,
              workingHours: JSON.stringify({
                monday:    { open: '09:00', close: '19:00', closed: false },
                tuesday:   { open: '09:00', close: '19:00', closed: false },
                wednesday: { open: '09:00', close: '19:00', closed: false },
                thursday:  { open: '09:00', close: '19:00', closed: false },
                friday:    { open: '09:00', close: '20:00', closed: false },
                saturday:  { open: '10:00', close: '18:00', closed: false },
                sunday:    { open: '11:00', close: '16:00', closed: false },
              }),
            },
          },
        },
        include: { shop: true },
      })
      shop = user.shop!
    }

    // Subscription
    await prisma.subscription.create({
      data: {
        shopId:     shop!.id,
        planId:     premiumPlan.id,
        status:     'active',
        startDate:  new Date(),
        expiryDate: new Date('2099-01-01'),
      },
    })
  }

  if (!shop) return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 })

  // ── Flowers ────────────────────────────────────────────────────────────────
  const flowerDefs = [
    { name: 'Троянди мікс', price: 450, availability: 'in_stock',    description: '21 троянда — класика яку люблять всі. Різнокольорова підбірка свіжих троянд.' },
    { name: 'Піоновий букет', price: 680, availability: 'in_stock',  description: 'Пишні піони пастельних відтінків — ніжність і розкіш в кожній квітці.' },
    { name: 'Весняний букет', price: 320, availability: 'in_stock',  description: 'Свіжі польові квіти — тюльпани, нарциси, ромашки. Немов луговий бриз.' },
    { name: 'Монобукет Червоні троянди', price: 550, availability: 'in_stock', description: '15 бордових троянд із зеленню. Класичний подарунок для особливої людини.' },
    { name: 'Лавандовий сон', price: 390, availability: 'in_stock',  description: 'Лаванда, евкаліпт і польові квіти. Ароматний і стильний.' },
    { name: 'Авторська композиція', price: 890, availability: 'limited', description: 'Унікальна авторська робота — щоразу різна. Підходить як VIP-подарунок.' },
    { name: 'Тюльпани 25 шт', price: 375, availability: 'in_stock',  description: '25 свіжих тюльпанів на ваш вибір. Є різні кольори — уточніть при замовленні.' },
    { name: 'Орхідея в горщику', price: 750, availability: 'in_stock', description: 'Фаленопсис 2 гілки — цвіте до 3 місяців. Відмінний подарунок що залишається надовго.' },
    { name: 'Польовий кошик', price: 520, availability: 'in_stock',  description: 'Кошик з польовими квітами та сухоцвітом. Стильний і довговічний.' },
    { name: 'Хризантеми сезонні', price: 280, availability: 'out_of_stock', description: 'Сезонні хризантеми великі. Поки що відсутні — очікуйте поповнення.' },
  ]

  const existingFlowers = await prisma.flower.count({ where: { shopId: shop.id } })
  if (existingFlowers === 0) {
    await prisma.flower.createMany({
      data: flowerDefs.map(f => ({
        shopId:       shop!.id,
        name:         f.name,
        price:        f.price,
        availability: f.availability,
        description:  f.description,
      })),
    })
  }

  // ── Stock flowers (for custom bouquet builder) ─────────────────────────────
  const existingStock = await prisma.stockFlower.count({ where: { shopId: shop.id } })
  if (existingStock === 0) {
    await prisma.stockFlower.createMany({
      data: [
        { shopId: shop.id, name: 'Троянда червона',   color: 'Червона',    pricePerStem: 35,  stockCount: 120 },
        { shopId: shop.id, name: 'Троянда біла',      color: 'Біла',       pricePerStem: 35,  stockCount: 80  },
        { shopId: shop.id, name: 'Троянда рожева',    color: 'Рожева',     pricePerStem: 35,  stockCount: 95  },
        { shopId: shop.id, name: 'Піон',              color: 'Блідо-рожевий', pricePerStem: 65, stockCount: 40 },
        { shopId: shop.id, name: 'Тюльпан',           color: 'Мікс',       pricePerStem: 18,  stockCount: 200 },
        { shopId: shop.id, name: 'Лілія',             color: 'Біла',       pricePerStem: 55,  stockCount: 30  },
        { shopId: shop.id, name: 'Гербера',           color: 'Жовта',      pricePerStem: 22,  stockCount: 60  },
        { shopId: shop.id, name: 'Лаванда',           color: 'Фіолетова',  pricePerStem: 15,  stockCount: 150 },
        { shopId: shop.id, name: 'Евкаліпт',          color: 'Зелений',    pricePerStem: 12,  stockCount: 200 },
        { shopId: shop.id, name: 'Хризантема',        color: 'Біла',       pricePerStem: 20,  stockCount: 70  },
      ],
    })
  }

  // ── Wrapping options ───────────────────────────────────────────────────────
  const existingWrapping = await prisma.wrappingOption.count({ where: { shopId: shop.id } })
  if (existingWrapping === 0) {
    await prisma.wrappingOption.createMany({
      data: [
        { shopId: shop.id, name: 'Крафт-папір',     price: 0,   available: true },
        { shopId: shop.id, name: 'Матовий целофан', price: 50,  available: true },
        { shopId: shop.id, name: 'Корейський шовк', price: 80,  available: true },
        { shopId: shop.id, name: 'Подарункова коробка', price: 150, available: true },
      ],
    })
  }

  // ── Delivery zone ──────────────────────────────────────────────────────────
  const existingZones = await prisma.deliveryZone.count({ where: { shopId: shop.id } })
  if (existingZones === 0) {
    await prisma.deliveryZone.createMany({
      data: [
        { shopId: shop.id, name: 'Центр Києва',       fee: 100, estimatedMinHours: 1, estimatedMaxHours: 2, sortOrder: 0 },
        { shopId: shop.id, name: 'Правий берег',      fee: 150, estimatedMinHours: 2, estimatedMaxHours: 3, sortOrder: 1 },
        { shopId: shop.id, name: 'Лівий берег',       fee: 180, estimatedMinHours: 2, estimatedMaxHours: 4, sortOrder: 2 },
        { shopId: shop.id, name: 'Передмістя',        fee: 250, estimatedMinHours: 3, estimatedMaxHours: 5, sortOrder: 3 },
      ],
    })
  }

    return NextResponse.json({
      success: true,
      url: `/${DEMO_SLUG}`,
      message: `Demo shop ready at /${DEMO_SLUG}`,
    })
  } catch (error: unknown) {
    logger.error('demo/post', 'Failed to seed demo shop', { error: String(error) })
    return NextResponse.json({ error: 'Failed to seed demo shop' }, { status: 500 })
  }
}
