#!/bin/bash

echo "🚀 Applying comprehensive SaaS improvements..."
echo ""

# Stop on any error
set -e

cd /Users/Mykola/Desktop/flower12

echo "📦 Installing dependencies..."
npm install

echo "🔨 Generating Prisma client..."
npx prisma generate

echo "🗄️  Pushing database schema..."
npx prisma db push

echo "🌱 Seeding database with new structure..."
npx tsx prisma/seed.ts

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 What's New:"
echo "   ✓ Enhanced database schema with delivery zones"
echo "   ✓ Shop settings (language, contact, delivery, appearance)"
echo "   ✓ Delivery zones management"
echo "   ✓ Improved order system"
echo "   ✓ Better dashboard structure"
echo ""
echo "🌐 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Visit: http://localhost:3000/dashboard/settings"
echo "   3. Configure your delivery zones"
echo ""
echo "🔐 Demo Login:"
echo "   Email: demo@flowershop.com"
echo "   Password: demo123"
