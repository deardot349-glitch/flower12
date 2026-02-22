# Flower Shop SaaS Platform

A vertical SaaS platform for flower shops - a simplified Shopify-like solution specifically designed for flower shop owners.

## Features

- **User Signup & Shop Creation**: When a flower shop owner signs up, they automatically get a shop with a unique URL slug
- **Public Shop Pages**: Each shop has a public catalog page at `/{shop-slug}`
- **Private Dashboard**: Shop owners can manage their flowers and orders
- **Flower Management**: Add, edit, delete flowers and manage availability
- **Order System**: Customers can place orders without login
- **Responsive Design**: Mobile-first, beautiful UI

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** (SQLite database)
- **NextAuth.js** (Authentication)
- **Tailwind CSS** (Styling)
- **bcryptjs** (Password hashing)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL="file:./dev.db"` (SQLite database)
- `NEXTAUTH_URL="http://localhost:3000"`
- `NEXTAUTH_SECRET` (generate a random string)

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── [shopSlug]/          # Public shop pages
│   ├── api/                 # API routes
│   ├── dashboard/           # Private dashboard
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   └── page.tsx             # Home page
├── components/              # React components
├── lib/                     # Utilities and config
├── prisma/                  # Database schema
└── middleware.ts            # Auth middleware
```

## Key Features Explained

### Automatic Shop Creation
When a user signs up with a shop name, the system:
1. Creates a user account
2. Generates a URL-safe slug from the shop name
3. Creates a shop linked to the user
4. Makes the shop immediately available at `/{shop-slug}`

### Public Shop Pages
- No authentication required
- Displays all available flowers
- Customers can place orders with contact information

### Dashboard
- Protected routes (login required)
- Shop owners can only see/modify their own data
- Manage flowers and view orders

## Database Schema

- **User**: Email, password hash
- **Shop**: Name, slug, owner relationship
- **Flower**: Name, price, image, availability, description
- **Order**: Customer name, phone, message

## Development

- Database Studio: `npm run db:studio`
- Generate Prisma Client: `npm run db:generate`
- Push schema changes: `npm run db:push`

## Production Deployment

1. Switch to PostgreSQL (recommended for production):
   - Update `DATABASE_URL` in `.env`
   - Change `provider` in `prisma/schema.prisma` to `"postgresql"`
   - Run `npx prisma db push`

2. Set secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

3. Deploy to Vercel, Railway, or your preferred platform.

## License

MIT
