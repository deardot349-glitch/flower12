const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function go() {
  const u = await p.user.findUnique({
    where: { email: 'areyoureal@gmail.com' },
    include: { shop: true },
  })

  if (!u || !u.shop) {
    console.log('not found')
    return
  }

  const plan = await p.plan.findUnique({ where: { slug: 'free' } })
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await p.subscription.create({
    data: {
      shopId: u.shop.id,
      planId: plan.id,
      status: 'active',
      startDate: new Date(),
      expiryDate: expiry,
    },
  })

  await p.shop.update({
    where: { id: u.shop.id },
    data: { suspended: false, suspendedAt: null, suspendedReason: null },
  })

  console.log('Restored — shop is back online for 7 days')
}

go().catch(console.error).finally(() => p.$disconnect())
