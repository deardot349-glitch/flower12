#!/bin/bash

echo "📦 Installing Cloudinary..."
echo ""

npm install cloudinary

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Cloudinary installed successfully!"
    echo ""
    echo "🔄 Restarting dev server required..."
    echo ""
    echo "Next steps:"
    echo "1. Stop your dev server (Ctrl+C)"
    echo "2. Run: npm run dev"
    echo "3. Test uploading an image!"
    echo ""
else
    echo ""
    echo "❌ Installation failed"
    echo "Try running: npm install cloudinary"
fi
