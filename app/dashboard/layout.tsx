import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import SidebarNav from '@/components/SidebarNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const shopSlug = session.user.shopSlug
  const shopName = session.user.name || 'Мій магазин'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 xl:w-64 bg-white border-r border-gray-100 fixed top-0 left-0 h-screen z-40 flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm shadow-sm">
              🌸
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">FlowerGoUa</span>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <SidebarNav shopSlug={shopSlug} />
        </div>

        {/* Shop link + logout */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          {shopSlug && (
            <Link href={`/${shopSlug}`} target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-pink-600 transition-colors group">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <span className="font-medium">Мій магазин</span>
            </Link>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {shopName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-600 font-medium truncate flex-1">{shopName}</span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm">🌸</div>
          <span className="font-bold text-gray-900 text-sm">FlowerGoUa</span>
        </Link>
        {shopSlug && (
          <Link href={`/${shopSlug}`} target="_blank"
            className="text-xs text-pink-600 font-semibold px-3 py-1.5 bg-pink-50 rounded-lg">
            Магазин →
          </Link>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-2 py-2 flex justify-around">
        {[
          { href: '/dashboard', icon: '🏠', label: 'Головна' },
          { href: '/dashboard/assortment', icon: '🌸', label: 'Асортимент' },
          { href: '/dashboard/orders', icon: '📦', label: 'Замовлення' },
          { href: '/dashboard/settings', icon: '⚙️', label: 'Налаштування' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500 hover:text-pink-600 transition-colors">
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Page content ── */}
      <main className="flex-1 md:ml-60 xl:ml-64 pt-0 md:pt-0 mt-14 md:mt-0 mb-16 md:mb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
