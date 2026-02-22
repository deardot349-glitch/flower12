import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create plans
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      name: 'Free Plan',
      slug: 'free',
      description: 'Perfect for getting started',
      price: 0,
      durationDays: 30,
      maxBouquets: 5,
      allowProfileDetails: false,
      features: JSON.stringify(['5 bouquets', 'Basic listing']),
    },
  })

  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro Plan',
      slug: 'pro',
      description: 'For growing businesses',
      price: 29.99,
      durationDays: 30,
      maxBouquets: 50,
      allowProfileDetails: true,
      features: JSON.stringify([
        '50 bouquets',
        'Custom profile',
        'Analytics',
        'Priority support',
      ]),
    },
  })

  console.log('✅ Plans created')

  // Create demo user and shop
  const hashedPassword = await bcrypt.hash('demo123', 10)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@flowershop.com' },
    update: {},
    create: {
      email: 'demo@flowershop.com',
      passwordHash: hashedPassword,
    },
  })

  console.log('✅ Demo user created (email: demo@flowershop.com, password: demo123)')

  const demoShop = await prisma.shop.upsert({
    where: { slug: 'rose-garden' },
    update: {},
    create: {
      name: 'Rose Garden Boutique',
      slug: 'rose-garden',
      ownerId: demoUser.id,
      planId: proPlan.id,
      location: '123 Main Street, New York',
      city: 'New York',
      country: 'USA',
      about: 'Welcome to Rose Garden Boutique! We specialize in creating beautiful, handcrafted bouquets for every occasion. Each arrangement is made with love and care using the freshest flowers.',
      workingHours: JSON.stringify({
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      }),
      email: 'info@rosegarden.com',
      phoneNumber: '+1 (555) 123-4567',
      whatsappNumber: '+15551234567',
      telegramHandle: '@rosegarden',
      instagramHandle: '@rosegardenflowers',
      sameDayDelivery: true,
      deliveryTimeEstimate: '2-4 hours',
      deliveryCutoffTime: '14:00',
      minimumOrderAmount: 25,
      autoConfirmOrders: false,
      showDeliveryEstimate: true,
      allowSameDayOrders: true,
      language: 'en',
      currency: 'USD',
      primaryColor: '#ec4899',
      accentColor: '#a855f7',
      enableAnimations: true,
    },
  })

  console.log('✅ Demo shop created: http://localhost:3000/rose-garden')

  // Create delivery zones
  const zones = [
    { name: 'Manhattan', fee: 10, estimatedMinHours: 2, estimatedMaxHours: 3, minimumOrder: 25 },
    { name: 'Brooklyn', fee: 15, estimatedMinHours: 2, estimatedMaxHours: 4, minimumOrder: 30 },
    { name: 'Queens', fee: 20, estimatedMinHours: 3, estimatedMaxHours: 5, minimumOrder: 35 },
    { name: 'Bronx', fee: 18, estimatedMinHours: 3, estimatedMaxHours: 5, minimumOrder: 30 },
    { name: 'Staten Island', fee: 25, estimatedMinHours: 4, estimatedMaxHours: 6, minimumOrder: 40 },
  ]

  for (let i = 0; i < zones.length; i++) {
    await prisma.deliveryZone.create({
      data: {
        shopId: demoShop.id,
        ...zones[i],
        sameDayAvailable: true,
        active: true,
        sortOrder: i,
      },
    })
  }

  console.log('✅ Delivery zones created')

  // Create subscription for demo shop
  const now = new Date()
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 30)

  await prisma.subscription.upsert({
    where: { id: 'demo-subscription' },
    update: {},
    create: {
      id: 'demo-subscription',
      shopId: demoShop.id,
      planId: proPlan.id,
      status: 'active',
      startDate: now,
      expiryDate: expiryDate,
      autoRenew: true,
    },
  })

  console.log('✅ Subscription activated')

  // Create stock flowers for custom bouquets
  const stockFlowers = [
    { name: 'Red Rose', color: 'Red', pricePerStem: 3.5, stockCount: 100 },
    { name: 'White Rose', color: 'White', pricePerStem: 3.5, stockCount: 80 },
    { name: 'Pink Rose', color: 'Pink', pricePerStem: 3.5, stockCount: 90 },
    { name: 'Tulip', color: 'Mixed', pricePerStem: 2.5, stockCount: 60 },
    { name: 'Lily', color: 'White', pricePerStem: 4.0, stockCount: 50 },
    { name: 'Sunflower', color: 'Yellow', pricePerStem: 3.0, stockCount: 40 },
    { name: 'Carnation', color: 'Mixed', pricePerStem: 2.0, stockCount: 120 },
    { name: 'Orchid', color: 'Purple', pricePerStem: 5.0, stockCount: 30 },
  ]

  for (const flower of stockFlowers) {
    await prisma.stockFlower.create({
      data: {
        shopId: demoShop.id,
        ...flower,
      },
    })
  }

  console.log('✅ Stock flowers created')

  // Create wrapping options
  const wrappingOptions = [
    { name: 'Kraft Paper', price: 5 },
    { name: 'Cellophane', price: 3 },
    { name: 'Satin Ribbon', price: 7 },
    { name: 'Burlap Wrap', price: 6 },
    { name: 'Luxury Box', price: 12 },
  ]

  for (const wrap of wrappingOptions) {
    await prisma.wrappingOption.create({
      data: {
        shopId: demoShop.id,
        ...wrap,
        available: true,
      },
    })
  }

  console.log('✅ Wrapping options created')

  // Create pre-made bouquets
  const bouquets = [
    {
      name: 'Classic Red Roses',
      price: 49.99,
      description: 'A dozen beautiful red roses elegantly arranged',
      availability: 'in_stock',
    },
    {
      name: 'Spring Mix',
      price: 39.99,
      description: 'Colorful tulips and daisies in a cheerful arrangement',
      availability: 'in_stock',
    },
    {
      name: 'Elegant Lilies',
      price: 59.99,
      description: 'Pure white lilies with green accents',
      availability: 'in_stock',
    },
    {
      name: 'Sunflower Delight',
      price: 44.99,
      description: 'Bright sunflowers that bring sunshine to any room',
      availability: 'in_stock',
    },
    {
      name: 'Romance Bouquet',
      price: 69.99,
      description: 'Red and pink roses with baby\'s breath',
      availability: 'limited',
    },
  ]

  for (const bouquet of bouquets) {
    await prisma.flower.create({
      data: {
        shopId: demoShop.id,
        ...bouquet,
      },
    })
  }

  console.log('✅ Pre-made bouquets created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📝 Demo Credentials:')
  console.log('   Email: demo@flowershop.com')
  console.log('   Password: demo123')
  console.log('\n🌐 Shop URL: http://localhost:3000/rose-garden')
  console.log('\n🔐 Admin Panel: http://localhost:3000/dashboard')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
