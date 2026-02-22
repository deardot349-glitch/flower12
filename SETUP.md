# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the root directory with the following content:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"
```

**Important**: Generate a secure `NEXTAUTH_SECRET` for production:
```bash
openssl rand -base64 32
```

## Step 3: Initialize Database

```bash
npx prisma generate
npx prisma db push
```

This will:
- Generate the Prisma Client
- Create the SQLite database file (`dev.db`)
- Set up all the tables (Users, Shops, Flowers, Orders)

## Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Create Your First Shop

1. Go to `/signup`
2. Enter:
   - Shop Name (e.g., "Rosy Flower Shop")
   - Email
   - Password (min 6 characters)
3. Your shop will be automatically created with a URL like: `/{shop-slug}`
4. Sign in at `/login`
5. Access your dashboard at `/dashboard`

## Testing the Flow

1. **As a Shop Owner:**
   - Sign up → Get shop automatically
   - Login → Access dashboard
   - Add flowers → Manage inventory
   - View orders → See customer requests

2. **As a Customer:**
   - Visit `/{shop-slug}` (no login needed)
   - Browse flowers
   - Click "Order" → Fill form → Submit

## Database Management

- View database: `npm run db:studio`
- Reset database: Delete `prisma/dev.db` and run `npx prisma db push` again

## Production Deployment

1. Switch to PostgreSQL:
   - Update `DATABASE_URL` in `.env`
   - Change `provider` in `prisma/schema.prisma` to `"postgresql"`
   - Run `npx prisma db push`

2. Set secure environment variables on your hosting platform

3. Deploy to Vercel, Railway, or your preferred platform
