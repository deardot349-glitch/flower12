// Run: npx prisma db execute --stdin < migrate-new-fields.sql
// OR:  npx ts-node migrate-new-fields.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Flower" ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN NOT NULL DEFAULT false;
  `)
  console.log('✅ Added isCustom to Flower')

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "layoutStyle" TEXT NOT NULL DEFAULT 'classic';
  `)
  console.log('✅ Added layoutStyle to Shop')
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
