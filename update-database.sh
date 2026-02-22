#!/bin/bash

echo "🌸 Flower Shop SaaS - Database Update Script"
echo "=============================================="
echo ""
echo "This will update your database schema with new fields:"
echo "  ✅ Contact information (phone, whatsapp, telegram, instagram)"
echo "  ✅ Delivery settings (zones, same-day, time estimates)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "📊 Pushing schema changes to database..."
    npx prisma db push
    
    echo ""
    echo "🔄 Generating Prisma Client..."
    npx prisma generate
    
    echo ""
    echo "✅ Database updated successfully!"
    echo ""
    echo "🎉 Your flower shop is ready with:"
    echo "   • Custom Bouquet Builder"
    echo "   • Contact Section"  
    echo "   • Delivery Information"
    echo "   • Freshness Indicators"
    echo ""
    echo "🚀 Start your dev server with: npm run dev"
    echo ""
fi
