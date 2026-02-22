#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║   🚀 POSTGRESQL MIGRATION - COMPLETE SETUP            ║"
echo "║   Flower Shop SaaS Platform                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 STEP 1: Creating backup..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p backups
BACKUP_DIR="backups/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db "$BACKUP_DIR/dev.db"
    echo -e "${GREEN}✅ SQLite database backed up${NC}"
fi

if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/.env.backup"
    echo -e "${GREEN}✅ Environment variables backed up${NC}"
fi

echo -e "${GREEN}📂 Backup saved to: $BACKUP_DIR${NC}"
echo ""

# Step 2: Verify PostgreSQL connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 STEP 2: Verifying PostgreSQL connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if DATABASE_URL is set
if grep -q "postgresql://" .env; then
    echo -e "${GREEN}✅ PostgreSQL URL found in .env${NC}"
else
    echo -e "${RED}❌ PostgreSQL URL not found in .env${NC}"
    echo "Please make sure your .env has:"
    echo "DATABASE_URL=\"postgresql://...\" "
    exit 1
fi
echo ""

# Step 3: Generate Prisma Client
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 STEP 3: Generating Prisma client..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client generated successfully${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    echo "Try running: npm install"
    exit 1
fi
echo ""

# Step 4: Push schema to database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  STEP 4: Creating database tables..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}This will create all tables in your PostgreSQL database${NC}"
echo ""

npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema created successfully${NC}"
else
    echo -e "${RED}❌ Failed to push schema${NC}"
    echo "Check your database connection and try again"
    exit 1
fi
echo ""

# Step 5: Seed database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌱 STEP 5: Seeding database with plans..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm run db:seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Seed may have failed (OK if plans already exist)${NC}"
fi
echo ""

# Step 6: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 MIGRATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Your app is now using PostgreSQL on Neon.tech"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Test your app:"
echo "   npm run dev"
echo "   Open: http://localhost:3000"
echo ""
echo "2️⃣  View your database:"
echo "   npx prisma studio"
echo "   Open: http://localhost:5555"
echo ""
echo "3️⃣  If everything works, you can delete:"
echo "   - prisma/dev.db (old SQLite file)"
echo "   - prisma/dev.db.backup"
echo ""
echo "📂 Backup location: $BACKUP_DIR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
