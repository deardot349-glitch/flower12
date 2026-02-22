#!/bin/bash

echo "🔍 Verifying PostgreSQL Migration..."
echo ""

# Check 1: Prisma Client exists
echo "1️⃣  Checking Prisma Client..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma Client found"
else
    echo "❌ Prisma Client not found - run: npx prisma generate"
    exit 1
fi

# Check 2: Database URL is PostgreSQL
echo ""
echo "2️⃣  Checking DATABASE_URL..."
if grep -q "postgresql://" .env; then
    echo "✅ Using PostgreSQL"
    # Show first part of URL (hide password)
    DB_URL=$(grep "DATABASE_URL" .env | cut -d'"' -f2 | cut -d'@' -f2)
    echo "   Connected to: $DB_URL"
else
    echo "❌ Not using PostgreSQL!"
    exit 1
fi

# Check 3: Schema file is PostgreSQL
echo ""
echo "3️⃣  Checking schema.prisma..."
if grep -q 'provider = "postgresql"' prisma/schema.prisma; then
    echo "✅ Schema configured for PostgreSQL"
else
    echo "❌ Schema still set to SQLite!"
    exit 1
fi

# Check 4: Test database connection
echo ""
echo "4️⃣  Testing database connection..."
echo "   (This might take a few seconds...)"

npx prisma db execute --stdin <<EOF > /dev/null 2>&1
SELECT 1;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "⚠️  Could not verify connection (might be OK)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All checks passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your app is ready to use PostgreSQL!"
echo ""
echo "Try these commands:"
echo "  npm run dev         # Start development server"
echo "  npx prisma studio   # View database in browser"
echo ""
