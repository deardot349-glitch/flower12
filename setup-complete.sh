#!/bin/bash

echo "🌸 Setting up Flower Shop SaaS..."
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Reset and seed database
echo "🗄️  Resetting database..."
npx prisma db push --force-reset

echo "🌱 Seeding database..."
npx tsx prisma/seed.ts

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Demo Credentials:"
echo "   Email: demo@flowershop.com"
echo "   Password: demo123"
echo ""
echo "🌐 Your demo shop: http://localhost:3000/rose-garden"
echo "🔐 Admin panel: http://localhost:3000/dashboard"
echo ""
echo "▶️  Start the dev server with: npm run dev"
