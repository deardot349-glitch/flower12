const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function go() {
  const u = await p.user.findUnique({
    where: { email: 'areyoureal@gmail.com' },
    include: { shop: { include: { subscriptions: true } } },
  })

  if (!u || !u.shop) {
    console.log('not found — check email spelling')
    return
  }

  console.log('Shop:', u.shop.name, '| slug:', u.shop.slug)
  console.log('Active subs:', u.shop.subscriptions.filter(s => s.status === 'active').length)

  await p.subscription.updateMany({
    where: { shopId: u.shop.id, status: 'active' },
    data: { status: 'expired', expiryDate: new Date(Date.now() - 60000) },
  })

  await p.shop.update({
    where: { id: u.shop.id },
    data: { suspended: true, suspendedAt: new Date(), suspendedReason: 'subscription_expired' },
  })

  console.log('Done — shop is now OFFLINE')
  console.log('Go check: https://your-domain.com/' + u.shop.slug)
}

go().catch(console.error).finally(() => p.$disconnect())
