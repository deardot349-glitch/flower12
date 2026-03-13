/**
 * Run: node fix-db.js
 * Then: npm run dev
 * Then: delete this file
 */
const { execSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')

async function main() {
  console.log('\n📐 Pushing schema to Neon database...')
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: __dirname })
    console.log('✅ Schema pushed\n')
  } catch (e) {
    console.error('❌ db push failed:', e.message)
    process.exit(1)
  }

  const prisma = new PrismaClient()

  console.log('📋 Setting up plans...')
  const plans = [
    { slug: 'free',    name: 'Безкоштовний', description: 'Стартовий план', price: 0,    durationDays: 0,  maxBouquets: 5,   allowProfileDetails: false, features: JSON.stringify(['До 5 букетів','Email сповіщення']) },
    { slug: 'basic',   name: 'Базовий',       description: 'Для зростання',  price: 800,  durationDays: 30, maxBouquets: 30,  allowProfileDetails: true,  features: JSON.stringify(['До 30 букетів','Telegram','Зони доставки']) },
    { slug: 'premium', name: 'Преміум',        description: 'Повний доступ', price: 1500, durationDays: 30, maxBouquets: 100, allowProfileDetails: true,  features: JSON.stringify(['До 100 букетів','Кастомний конструктор','Аналітика']) },
  ]
  for (const p of plans) {
    await prisma.plan.upsert({ where: { slug: p.slug }, update: p, create: p })
    console.log(`  ✅ Plan: ${p.slug}`)
  }

  console.log('\n🗑️  Cleaning test data...')
  for (const [fn, label] of [
    [() => prisma.payment.deleteMany({}), 'payments'],
    [() => prisma.subscription.deleteMany({}), 'subscriptions'],
    [() => prisma.order.deleteMany({}), 'orders'],
    [() => prisma.flower.deleteMany({}), 'flowers'],
    [() => prisma.customExtra.deleteMany({}), 'customExtras'],
    [() => prisma.stockFlower.deleteMany({}), 'stockFlowers'],
    [() => prisma.wrappingOption.deleteMany({}), 'wrappingOptions'],
    [() => prisma.deliveryZone.deleteMany({}), 'deliveryZones'],
    [() => prisma.shop.deleteMany({}), 'shops'],
    [() => prisma.user.deleteMany({}), 'users'],
  ]) {
    try { await fn(); console.log(`  ✅ Cleared ${label}`) }
    catch (e) { console.log(`  ⏭️  ${label}: ${e.message.slice(0,60)}`) }
  }

  const userCount = await prisma.user.count()
  const planList = await prisma.plan.findMany({ select: { slug: true, maxBouquets: true } })
  console.log(`\n✅ Done! Users: ${userCount}, Plans: ${planList.map(p => p.slug).join(', ')}`)
  console.log('\n→ Run: npm run dev')
  console.log('→ Go to: http://localhost:3000/signup')
  console.log('→ Then delete this file\n')

  await prisma.$disconnect()
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
