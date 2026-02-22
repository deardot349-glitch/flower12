#!/bin/bash

echo "🌸 Flower Shop Platform - Setup Script 🌸"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from template..."
    cat > .env << EOL
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-later"
ADMIN_SECRET="admin-secret-2024"
EOL
    echo "✅ .env file created"
else
    # Check if ADMIN_SECRET exists
    if ! grep -q "ADMIN_SECRET" .env; then
        echo "⚠️  ADMIN_SECRET not found in .env"
        echo "Adding ADMIN_SECRET..."
        echo 'ADMIN_SECRET="admin-secret-2024"' >> .env
        echo "✅ ADMIN_SECRET added"
    fi
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Test registration at: http://localhost:3000/signup"
echo "4. Access admin at: http://localhost:3000/admin"
echo "   (Use secret: admin-secret-2024)"
echo ""
echo "📖 See IMPROVEMENTS.md for full documentation"
echo ""
