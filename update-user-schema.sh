#!/bin/bash

echo "🔄 Updating database schema for email verification..."
echo ""

npx prisma db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema updated successfully!"
    echo ""
    echo "New fields added to User:"
    echo "  - emailVerified (boolean)"
    echo "  - verificationToken (string)"
    echo "  - verificationTokenExpiry (datetime)"
    echo "  - resetToken (string)"
    echo "  - resetTokenExpiry (datetime)"
    echo ""
    echo "🔄 Restart your dev server:"
    echo "  npm run dev"
    echo ""
else
    echo ""
    echo "❌ Schema update failed"
    exit 1
fi
