# 🚀 PostgreSQL Migration - Quick Start

## ✅ What I've Done For You

1. ✅ Updated `.env` with your Neon PostgreSQL connection
2. ✅ Changed `prisma/schema.prisma` from SQLite to PostgreSQL
3. ✅ Added database indexes for performance
4. ✅ Created migration scripts

---

## 🎯 What You Need To Do

### Option 1: Run the Master Script (RECOMMENDED)

```bash
cd /Users/Mykola/Desktop/flower12
chmod +x run-migration.sh
./run-migration.sh
```

This does everything automatically:
- Creates backup
- Generates Prisma client
- Creates database tables
- Seeds initial data
- Verifies everything works

---

### Option 2: Manual Steps

If the script doesn't work, run these commands one by one:

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Create tables in database
npx prisma db push

# 3. Seed with initial data
npm run db:seed

# 4. Test it works
npm run dev
```

---

## 🧪 Testing

After migration, test your app:

```bash
# Start development server
npm run dev
```

Open http://localhost:3000 and check:
- [ ] Can you login?
- [ ] Can you see your shop?
- [ ] Can you see your flowers?
- [ ] Can you create a new flower?

---

## 📊 View Your Database

```bash
npx prisma studio
```

Opens at http://localhost:5555

Check that you see:
- Users table (with your account)
- Shop table (with your shop)
- Flowers table (with your flowers)
- Plan table (Free, Basic, Premium)

---

## 🆘 Troubleshooting

### "Can't reach database server"

**Fix:**
1. Check internet connection
2. Verify DATABASE_URL in `.env` is correct
3. Login to https://console.neon.tech to check your database is running

### "Prisma generate failed"

**Fix:**
```bash
rm -rf node_modules
npm install
npx prisma generate
```

### Need to rollback?

Your old SQLite database is backed up in `backups/` folder.

To restore:
```bash
cp backups/backup-XXXXXX/dev.db prisma/dev.db
cp backups/backup-XXXXXX/.env.backup .env
```

---

## ✅ Verification Script

To check if migration succeeded:

```bash
chmod +x verify-migration.sh
./verify-migration.sh
```

---

## 📝 What Changed

**Before:**
```
DATABASE_URL="file:./dev.db"
provider = "sqlite"
```

**After:**
```
DATABASE_URL="postgresql://...@neon.tech/neondb"
provider = "postgresql"
```

**Added:**
- Database indexes for faster queries
- Connection to cloud PostgreSQL
- Automatic backups in Neon

---

## 🎉 After Success

Once migration works:

1. Delete old SQLite files:
   ```bash
   rm prisma/dev.db
   rm prisma/dev.db.backup
   ```

2. Tell me: **"Migration successful!"**

3. We'll move to Day 2: **Cloudinary Setup** (image storage)

---

## 🚨 If You Get Stuck

**Tell me:**
1. What command you ran
2. What error message you got
3. Copy/paste the full error

I'll help you fix it immediately!

---

**Ready? Run the migration script now!** 🚀

```bash
chmod +x run-migration.sh
./run-migration.sh
```
