import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-gray-900 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
    >
      {children}
    </Link>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const shopSlug = session.user.shopSlug

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
                🌸 Dashboard
              </Link>
              <div className="hidden md:flex gap-1">
                <NavLink href="/dashboard">Home</NavLink>
                <NavLink href="/dashboard/flowers">Flowers</NavLink>
                <NavLink href="/dashboard/stock-flowers">Stock Flowers</NavLink>
                <NavLink href="/dashboard/wrapping">Wrapping</NavLink>
                <NavLink href="/dashboard/orders">Orders</NavLink>
                <NavLink href="/dashboard/subscription">Subscription</NavLink>
                <NavLink href="/dashboard/settings">Settings</NavLink>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {shopSlug && (
                <Link
                  href={`/${shopSlug}`}
                  target="_blank"
                  className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                  View Shop →
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-1 rounded-md hover:bg-gray-100">
            Home
          </Link>
          <Link href="/dashboard/flowers" className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-1 rounded-md hover:bg-gray-100">
            Flowers
          </Link>
          <Link href="/dashboard/stock-flowers" className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-1 rounded-md hover:bg-gray-100">
            Stock
          </Link>
          <Link href="/dashboard/wrapping" className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-1 rounded-md hover:bg-gray-100">
            Wrapping
          </Link>
          <Link href="/dashboard/orders" className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-1 rounded-md hover:bg-gray-100">
            Orders
          </Link>
          <Link href="/dashboard/subscription" className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-1 rounded-md hover:bg-gray-100">
            Subscription
          </Link>
          <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap px-3 py-1 rounded-md hover:bg-gray-100">
            Settings
          </Link>
        </div>
      </div>

      {children}
    </div>
  )
}
