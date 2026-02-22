# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### 1. "Shop Not Found" Error

**Problem:** Visiting shop page shows "This flower shop doesn't exist"

**Solutions:**

**A) Check if shops exist:**
```bash
node check-shops.js
```

**B) Reset and seed database:**
```bash
npm run db:reset
```

**C) Make sure you're using correct URL:**
- Demo shop: `http://localhost:3000/rose-garden`
- NOT: `http://localhost:3000/shop` or other URLs

---

### 2. Custom Bouquet Page Empty

**Problem:** No flowers or wrapping options available

**Solution:**
```bash
npm run db:reset
```

This recreates stock flowers and wrapping options.

---

### 3. Dependencies Missing

**Problem:** Errors about missing packages

**Solution:**
```bash
npm install
npx prisma generate
```

---

### 4. Database Errors

**Problem:** Prisma client errors or schema issues

**Solution:**
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

---

### 5. Port Already in Use

**Problem:** "Port 3000 is already in use"

**Solution A (Kill the process):**
```bash
# macOS/Linux:
lsof -ti:3000 | xargs kill

# Windows:
netstat -ano | findstr :3000
taskkill /PID [process_id] /F
```

**Solution B (Use different port):**
```bash
PORT=3001 npm run dev
```

Then visit: `http://localhost:3001`

---

### 6. Can't Login to Dashboard

**Problem:** Wrong credentials or login fails

**Demo Credentials:**
- Email: `demo@flowershop.com`
- Password: `demo123`

**Create New Account:**
Go to: `http://localhost:3000/signup`

---

### 7. Images Not Showing

**Problem:** Flower or cover images not displaying

**Note:** Demo shop uses placeholder icons. To add real images:

1. Login to dashboard
2. Go to shop settings
3. Upload cover image
4. Edit flowers and add image URLs

---

### 8. Custom Bouquet Price Not Updating

**Problem:** Price stays at $0 or doesn't change

**Check:**
- Are flowers selected?
- Is wrapping selected?
- Try refreshing the page

**Reset if needed:**
```bash
npm run db:reset
```

---

### 9. Orders Not Saving

**Problem:** Clicking "Place Order" does nothing

**Check Console:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

**Common causes:**
- API route not working
- Database connection issue
- Missing required fields

**Solution:**
```bash
npm run db:reset
npm run dev
```

---

### 10. Page Not Loading / White Screen

**Problem:** Blank page or loading forever

**Check:**
1. Is dev server running? (`npm run dev`)
2. Any console errors? (F12 → Console)
3. Correct URL?

**Solution:**
```bash
# Stop server (Ctrl+C)
# Clear cache
npm run dev
```

---

### 11. TypeScript Errors

**Problem:** TS compilation errors

**Solution:**
```bash
npx prisma generate
npm run dev
```

---

### 12. "Cannot find module" Errors

**Problem:** Import errors

**Solution:**
```bash
npm install
npx prisma generate
```

---

### 13. Styling Looks Broken

**Problem:** CSS not loading or looks wrong

**Check:**
- Tailwind CSS classes working?
- Any CSS file errors?

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### 14. Google Maps Not Showing

**Problem:** Map embed not working

**Note:** You need a Google Maps API key for production.

**Current setup uses:** Public embed (works for demo)

**For production:**
1. Get API key from Google Cloud Console
2. Replace in shop page component

---

### 15. Can't Create New Shop

**Problem:** Signup fails

**Check:**
- Email already exists?
- Password meets requirements?
- Shop slug already taken?

**View existing shops:**
```bash
node check-shops.js
```

---

## Quick Diagnostic Commands

```bash
# Check shops in database
node check-shops.js

# Reset everything
npm run db:reset

# View database in browser
npm run db:studio

# Check for errors
npm run dev
# (Watch terminal for errors)

# Clear Next.js cache
rm -rf .next

# Reinstall everything
rm -rf node_modules
rm package-lock.json
npm install
```

---

## Still Having Issues?

### Step-by-Step Full Reset:

```bash
# 1. Stop server (Ctrl+C)

# 2. Remove all generated files
rm -rf node_modules
rm -rf .next
rm package-lock.json
rm prisma/dev.db

# 3. Reinstall
npm install

# 4. Setup database
npx prisma generate
npx prisma db push
npm run db:seed

# 5. Start fresh
npm run dev
```

---

## Environment Check

Make sure you have:

- ✅ Node.js 18+ installed
- ✅ npm installed
- ✅ Port 3000 available
- ✅ Write permissions in project folder
- ✅ Internet connection (for CDN resources)

**Check Node version:**
```bash
node --version
# Should be v18.0.0 or higher
```

---

## Files to Check

If something's wrong, check these files exist:

```
/Users/Mykola/Desktop/flower12/
├── .env                     (Database config)
├── package.json             (Dependencies)
├── prisma/
│   ├── schema.prisma       (Database schema)
│   └── seed.ts             (Demo data)
├── app/
│   ├── [shopSlug]/
│   │   ├── page.tsx        (Shop page)
│   │   └── custom-bouquet/
│   │       └── page.tsx    (Bouquet builder)
│   └── api/
└── check-shops.js          (Debug script)
```

---

## Getting Help

1. **Check error message** in terminal or browser console
2. **Run diagnostic:** `node check-shops.js`
3. **Try reset:** `npm run db:reset`
4. **Read logs** carefully for specific error

Most issues are solved by resetting the database! 🔄
