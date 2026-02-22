#!/bin/bash

echo "💾 Backing up SQLite data before migration..."
echo ""

# Create backup directory
mkdir -p backups
BACKUP_DIR="backups/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup SQLite database
if [ -f "prisma/dev.db" ]; then
    echo "📦 Copying dev.db..."
    cp prisma/dev.db "$BACKUP_DIR/dev.db"
    echo "✅ SQLite database backed up to $BACKUP_DIR"
else
    echo "⚠️  No dev.db found - nothing to backup"
fi

# Backup .env file
if [ -f ".env" ]; then
    echo "📦 Copying .env..."
    cp .env "$BACKUP_DIR/.env.backup"
    echo "✅ Environment variables backed up"
fi

echo ""
echo "🎉 Backup complete!"
echo "📂 Location: $BACKUP_DIR"
echo ""
echo "If something goes wrong, you can restore by:"
echo "  cp $BACKUP_DIR/dev.db prisma/dev.db"
echo "  cp $BACKUP_DIR/.env.backup .env"
echo ""
