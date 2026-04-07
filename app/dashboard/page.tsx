import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const shopId = session.user.shopId
  const shopSlug = session.user.shopSlug

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      flowers: true,
      orders: { orderBy: { createdAt: 'desc' } },
      plan: true,
      stockFlowers: true,
    },
  })

  if (!shop) return <div>Магазин не знайдено</div>

  const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${shopSlug}`

  const totalOrders = shop.orders.length
  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering']
  const pendingOrders = shop.orders.filter(o => activeStatuses.includes(o.status)).length
  const inStockCount = shop.flowers.filter(f => f.availability === 'in_stock').length
  const recentOrders = shop.orders.slice(0, 6)

  const totalRevenue = shop.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const confirmedRevenue = shop.orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const currencySymbol =
    shop.currency === 'UAH' ? '₴' :
    shop.currency === 'EUR' ? '€' :
    shop.currency === 'GBP' ? '£' : '$'

  const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'muted' | 'secondary' | 'destructive' }> = {
    pending:    { label: 'Очікує',      variant: 'warning' },
    confirmed:  { label: 'Підтверджено', variant: 'default' },
    preparing:  { label: 'Готується',   variant: 'default' },
    ready:      { label: 'Готово',       variant: 'success' },
    delivering: { label: 'В дорозі',    variant: 'default' },
    delivered:  { label: 'Доставлено',  variant: 'success' },
    completed:  { label: 'Завершено',   variant: 'success' },
    cancelled:  { label: 'Скасовано',   variant: 'muted'  },
  }

  const completionItems = [
    { label: 'Фото обкладинки', done: !!shop.coverImageUrl },
    { label: 'Опис магазину',   done: !!shop.about },
    { label: 'Телефон',         done: !!shop.phoneNumber },
    { label: 'Адреса',          done: !!shop.location },
    { label: 'Години роботи',   done: !!shop.workingHours },
    { label: 'Перший букет',    done: shop.flowers.length > 0 },
  ]
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  const stats = [
    { label: 'Букети',        value: shop.flowers.length, sub: `${inStockCount} в наявності`, color: 'text-pink-600',   bg: 'bg-pink-50',   border: 'border-pink-100' },
    { label: 'Замовлення',    value: totalOrders,         sub: `${pendingOrders} очікують`,   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { label: 'Загальний дохід', value: `${currencySymbol}${totalRevenue.toFixed(0)}`, sub: `${currencySymbol}${confirmedRevenue.toFixed(0)} виконано`, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Запас квітів',  value: shop.stockFlowers.reduce((s, f) => s + f.stockCount, 0), sub: `${shop.stockFlowers.length} видів`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ]

  return (
    <div className="p-6 xl:p-8 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Вітаємо 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{shop.name} · <span className="text-gray-400">{shop.plan.name}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${shopSlug}`} target="_blank"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-pink-600 bg-white border border-gray-200 hover:border-pink-200 px-4 py-2 rounded-xl transition-all shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Переглянути магазин
          </Link>
          <Link href="/dashboard/assortment"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-4 py-2 rounded-xl transition-all shadow-sm">
            + Додати букет
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-5 shadow-sm`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent orders — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">

          {/* Shop URL card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Посилання на магазин</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 font-mono truncate">
                {publicUrl}
              </div>
              <CopyButton text={publicUrl} />
            </div>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Останні замовлення</h2>
              <Link href="/dashboard/orders" className="text-xs text-pink-600 hover:text-pink-700 font-semibold">
                Всі →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm font-medium text-gray-500">Замовлень ще немає</p>
                <p className="text-xs text-gray-400 mt-1">Поділіться посиланням на магазин</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map(order => {
                  const s = statusConfig[order.status] || { label: order.status, variant: 'muted' as const }
                  return (
                    <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-base flex-shrink-0">
                        {order.deliveryMethod === 'delivery' ? '🚚' : '🏪'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{order.customerName}</p>
                        <p className="text-xs text-gray-400 truncate">{order.phone}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {order.totalAmount && order.totalAmount > 0 && (
                          <p className="text-sm font-bold text-gray-900">{currencySymbol}{order.totalAmount.toFixed(0)}</p>
                        )}
                        <Badge variant={s.variant as any} className="text-[10px] mt-0.5">{s.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-300 hidden sm:block flex-shrink-0">
                        {new Date(order.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Швидкі дії</h2>
            </div>
            <div className="p-3 space-y-1">
              {[
                { href: '/dashboard/assortment', label: 'Асортимент', desc: 'Букети та квіти' },
                { href: '/dashboard/orders',     label: 'Замовлення', desc: pendingOrders > 0 ? `${pendingOrders} очікують підтвердження` : 'Все оброблено', highlight: pendingOrders > 0 },
                { href: '/dashboard/settings',   label: 'Налаштування', desc: 'Дизайн і контакти' },
                { href: '/dashboard/subscription', label: 'Підписка', desc: shop.plan.name },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors group ${
                    item.highlight ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'
                  }`}>
                  <div>
                    <p className={`font-medium ${item.highlight ? 'text-amber-800' : 'text-gray-800'}`}>{item.label}</p>
                    <p className={`text-xs mt-0.5 ${item.highlight ? 'text-amber-600' : 'text-gray-400'}`}>{item.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile completion */}
          {completionPct < 100 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900 text-sm">Профіль магазину</h2>
                <span className="text-xs font-bold text-pink-600">{completionPct}%</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Повний профіль підвищує довіру клієнтів</p>
              <Progress value={completionPct} className="mb-4" />
              <div className="space-y-2">
                {completionItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {item.done
                        ? <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      }
                    </div>
                    <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-600'}>{item.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/settings"
                className="mt-4 block text-center text-xs font-semibold text-pink-600 hover:text-pink-700 transition-colors">
                Заповнити профіль →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
