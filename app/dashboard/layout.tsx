import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-600 hover:text-gray-900 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 text-sm">
      {children}
    </Link>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const shopSlug = session.user.shopSlug

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-xl">🌸</span>
                <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                  FlowerGoUa
                </span>
              </Link>
              <div className="hidden md:flex gap-1">
                <NavLink href="/dashboard">Головна</NavLink>
                <NavLink href="/dashboard/flowers">Букети</NavLink>
                <NavLink href="/dashboard/orders">Замовлення</NavLink>
                <NavLink href="/dashboard/subscription">Підписка</NavLink>
                <NavLink href="/dashboard/settings">Налаштування</NavLink>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {shopSlug && (
                <Link href={`/${shopSlug}`} target="_blank"
                  className="text-sm text-gray-500 hover:text-pink-600 font-medium transition-colors hidden sm:block">
                  Мій магазин →
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { href: '/dashboard', label: 'Головна' },
            { href: '/dashboard/flowers', label: 'Букети' },
            { href: '/dashboard/orders', label: 'Замовлення' },
            { href: '/dashboard/subscription', label: 'Підписка' },
            { href: '/dashboard/settings', label: 'Налаштування' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="text-xs text-gray-600 font-medium whitespace-nowrap px-3 py-1.5 rounded-lg hover:bg-gray-100">
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  )
}
