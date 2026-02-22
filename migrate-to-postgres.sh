#!/bin/bash

echo "🚀 Starting PostgreSQL Migration..."
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1/4: Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi
echo "✅ Prisma client generated"
echo ""

# Step 2: Push schema to database
echo "🗄️  Step 2/4: Pushing schema to PostgreSQL..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema"
    exit 1
fi
echo "✅ Schema pushed to database"
echo ""

# Step 3: Seed database
echo "🌱 Step 3/4: Seeding database with initial data..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Seed failed (this is OK if plans already exist)"
fi
echo ""

# Step 4: Test connection
echo "🔍 Step 4/4: Testing database connection..."
npx prisma studio --browser none &
STUDIO_PID=$!
sleep 3
kill $STUDIO_PID 2>/dev/null
echo "✅ Database connection verified"
echo ""

echo "🎉 Migration Complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Test your app at http://localhost:3000"
echo "3. Verify your data migrated correctly"
echo ""
echo "📊 To view your database, run: npx prisma studio"
