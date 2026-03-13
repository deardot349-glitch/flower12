// Run: node add-iscustom.js
const { Client } = require('pg')
require('dotenv').config()

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query(`
      ALTER TABLE "Flower" ADD COLUMN IF NOT EXISTS "isCustom" BOOLEAN NOT NULL DEFAULT false;
    `)
    console.log('✅ Added isCustom column to Flower table')
  } finally {
    await client.end()
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
