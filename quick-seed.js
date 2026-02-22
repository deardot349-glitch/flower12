const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Quick seeding database...')

  // Create plan
  const plan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro Plan',
      slug: 'pro',
      price: 29.99,
      durationDays: 30,
      maxBouquets: 50,
      allowProfileDetails: true,
    },
  })

  // Create user
  const hashedPassword = await bcrypt.hash('demo123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'demo@flowershop.com' },
    update: {},
    create: {
      email: 'demo@flowershop.com',
      passwordHash: hashedPassword,
    },
  })

  // Create shop
  const shop = await prisma.shop.upsert({
    where: { slug: 'rose-garden' },
    update: {},
    create: {
      name: 'Rose Garden Boutique',
      slug: 'rose-garden',
      ownerId: user.id,
      planId: plan.id,
      location: '123 Main St, New York, NY',
      about: 'Beautiful flowers for every occasion',
      workingHours: '9:00 AM - 6:00 PM',
      phoneNumber: '+1 (555) 123-4567',
      whatsappNumber: '+15551234567',
      telegramHandle: '@rosegarden',
      instagramHandle: '@rosegardenflowers',
      deliveryZones: JSON.stringify([
        { name: 'Manhattan', fee: 10 },
        { name: 'Brooklyn', fee: 15 },
        { name: 'Queens', fee: 20 },
      ]),
      sameDayDelivery: true,
      deliveryTimeEstimate: '2-4 hours',
    },
  })

  // Create flowers
  await prisma.flower.create({
    data: {
      shopId: shop.id,
      name: 'Classic Red Roses',
      price: 49.99,
      description: 'A dozen beautiful red roses',
      availability: 'in_stock',
    },
  })

  console.log('✅ Done!')
  console.log('\n🌐 Visit: http://localhost:3000/rose-garden')
  console.log('📧 Email: demo@flowershop.com')
  console.log('🔑 Password: demo123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
