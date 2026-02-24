import { PrismaClient } from '@prisma/client'
import { PLANS } from '../lib/plans'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding plans...')

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.tagline,
        price: plan.price,
        durationDays: plan.durationDays,
        maxBouquets: plan.maxBouquets,
        allowProfileDetails: plan.allowProfileDetails,
        features: JSON.stringify(plan.features),
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.tagline,
        price: plan.price,
        durationDays: plan.durationDays,
        maxBouquets: plan.maxBouquets,
        allowProfileDetails: plan.allowProfileDetails,
        features: JSON.stringify(plan.features),
      },
    })
    console.log(`✅ Plan upserted: ${plan.name}`)
  }

  console.log('🌸 Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
