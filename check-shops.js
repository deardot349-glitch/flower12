const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkShops() {
  try {
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
      }
    })

    console.log('\n=== SHOPS IN DATABASE ===\n')
    
    if (shops.length === 0) {
      console.log('❌ No shops found in the database!')
      console.log('\nTo create a shop, you need to:')
      console.log('1. Sign up at http://localhost:3000/signup')
      console.log('2. Complete the shop setup form')
      console.log('3. Your shop will then be accessible at http://localhost:3000/[your-shop-slug]')
    } else {
      shops.forEach((shop, index) => {
        console.log(`${index + 1}. ${shop.name}`)
        console.log(`   Slug: ${shop.slug}`)
        console.log(`   URL: http://localhost:3000/${shop.slug}`)
        console.log(`   Plan: ${shop.plan}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkShops()
