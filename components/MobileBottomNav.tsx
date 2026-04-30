'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    exact: true,
    label: 'Огляд',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/assortment',
    label: 'Букети',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/dashboard/orders',
    label: 'Замовлення',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Налаштування',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const MORE_LINKS = [
  { href: '/dashboard/analytics',  emoji: '📊', label: 'Аналітика',          desc: 'Дохід, замовлення, клієнти' },
  { href: '/dashboard/customers',  emoji: '👥', label: 'Клієнти',            desc: 'База покупців' },
  { href: '/dashboard/subscription', emoji: '💳', label: 'Підписка',          desc: 'Плани та оплата' },
  { href: '/shops',                emoji: '🏪', label: 'Каталог магазинів', desc: 'Всі флористи платформи' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setMoreOpen(false) }, [pathname])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const moreIsActive = pathname.startsWith('/dashboard/subscription') || pathname === '/shops'

  return (
    <>
      {/* ── Backdrop ── */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* ── More drawer ── */}
      <div className={`md:hidden fixed left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
        moreOpen ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ bottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
        <div className="px-4 pt-3 pb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Більше</p>
          <div className="space-y-1">
            {MORE_LINKS.map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <span className="text-2xl w-10 text-center">{item.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10"
        style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-stretch px-1">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 transition-colors ${
                  active ? 'text-pink-600' : 'text-gray-400'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                )}
                <span>{item.icon}</span>
                <span className={`text-[10px] font-semibold leading-tight ${active ? 'text-pink-600' : 'text-gray-400'}`}>
                  {item.label === 'Налаштування' ? 'Налашт.' : item.label}
                </span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 transition-colors ${
              moreIsActive || moreOpen ? 'text-pink-600' : 'text-gray-400'
            }`}
          >
            {(moreIsActive || moreOpen) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className={`text-[10px] font-semibold leading-tight ${moreIsActive || moreOpen ? 'text-pink-600' : 'text-gray-400'}`}>
              Ще
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
