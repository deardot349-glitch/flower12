import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'

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
  const recentOrders = shop.orders.slice(0, 5)
  const totalFlowerStems = shop.stockFlowers.reduce((sum, sf) => sum + sf.stockCount, 0)

  const totalRevenue = shop.orders
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const confirmedRevenue = shop.orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const ordersWithAmount = shop.orders.filter(o => o.totalAmount && o.totalAmount > 0).length

  const currencySymbol =
    shop.currency === 'UAH' ? '₴' :
    shop.currency === 'EUR' ? '€' :
    shop.currency === 'GBP' ? '£' : '$'

  const statusColors: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700',
    confirmed:  'bg-blue-100 text-blue-700',
    preparing:  'bg-purple-100 text-purple-700',
    ready:      'bg-pink-100 text-pink-700',
    delivering: 'bg-blue-100 text-blue-700',
    delivered:  'bg-green-100 text-green-700',
    completed:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    pending:    '⏳ Очікує',
    confirmed:  '✅ Підтверджено',
    preparing:  '💐 Готується',
    ready:      '🎁 Готово',
    delivering: '🚚 В дорозі',
    delivered:  '🎉 Доставлено',
    completed:  '⭐ Завершено',
    cancelled:  '❌ Скасовано',
  }

  const completionItems = [
    { label: 'Фото обкладинки', done: !!shop.coverImageUrl },
    { label: 'Опис магазину', done: !!shop.about },
    { label: 'Номер телефону', done: !!shop.phoneNumber },
    { label: 'Адреса', done: !!shop.location },
    { label: 'Години роботи', done: !!shop.workingHours },
    { label: 'Перший букет', done: shop.flowers.length > 0 },
  ]
  const completionScore = completionItems.filter(i => i.done).length
  const completionPct = Math.round((completionScore / completionItems.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              Вітаємо! 👋
            </h1>
            <p className="text-gray-500 mt-1">{shop.name} · {shop.plan.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${shopSlug}`} target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-pink-300 hover:text-pink-600 transition-all shadow-sm text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Переглянути магазин
            </Link>
            <Link href="/dashboard/assortment"
              className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-md text-sm">
              + Додати букет
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="🌸" label="Букетів" value={shop.flowers.length} color="from-pink-500 to-rose-500" />
          <StatCard icon="✅" label="В наявності" value={inStockCount} color="from-emerald-500 to-green-500" />
          <StatCard icon="📦" label="Замовлень всього" value={totalOrders} color="from-blue-500 to-indigo-500" />
          <StatCard icon="⏳" label="Очікують" value={pendingOrders} color="from-amber-500 to-orange-500" />
        </div>

        {/* Flowers Widget */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center text-lg">🌷</div>
              <div>
                <h3 className="font-bold text-gray-900">Запас квітів для кастому</h3>
                <p className="text-xs text-gray-400">{shop.stockFlowers.length} видів · {totalFlowerStems} стебел загалом</p>
              </div>
            </div>
            <Link href="/dashboard/assortment?tab=stock" className="text-sm text-pink-600 hover:text-pink-700 font-semibold">
              Керувати →
            </Link>
          </div>
          {shop.stockFlowers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {shop.stockFlowers.slice(0, 8).map(sf => (
                <div key={sf.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm">
                  <span className="text-pink-500">🌷</span>
                  <span className="font-medium text-gray-700">{sf.name}</span>
                  {sf.color && <span className="text-gray-400">· {sf.color}</span>}
                  <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-semibold ml-1">{sf.stockCount} шт</span>
                </div>
              ))}
              {shop.stockFlowers.length > 8 && (
                <div className="flex items-center px-3 py-1.5 text-sm text-gray-400">+{shop.stockFlowers.length - 8} ще</div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-2">
              Квітів ще немає.{' '}
              <Link href="/dashboard/assortment" className="text-pink-500 font-semibold hover:underline">Додайте перші квіти →</Link>
            </p>
          )}
        </div>

        {/* Revenue + Shop Link Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-lg">💰</div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Загальний дохід</p>
                <p className="text-2xl font-black text-gray-900">{currencySymbol}{totalRevenue.toFixed(0)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Виконані замовлення</span>
                <span className="font-bold text-green-700">{currencySymbol}{confirmedRevenue.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Замовлень з сумою</span>
                <span className="font-bold text-purple-700">{ordersWithAmount} з {totalOrders}</span>
              </div>
              {totalRevenue === 0 && totalOrders > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg mt-1">
                  ℹ️ Суми з'являються після підтвердження замовлення
                </p>
              )}
              {totalRevenue === 0 && totalOrders === 0 && (
                <p className="text-xs text-gray-400">Поки ще немає замовлень</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">🔗 Посилання на ваш магазин</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 font-mono truncate">
                {publicUrl}
              </div>
              <CopyButton text={publicUrl} />
              <Link href={`/${shopSlug}`} target="_blank"
                className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-purple-700 transition-all">
                Відкрити →
              </Link>
            </div>
          </div>
        </div>

        {/* Shop Completion */}
        {completionPct < 100 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🎯</div>
              <div className="flex-1">
                <h3 className="font-black text-amber-900 mb-1">Заповніть профіль магазину ({completionPct}%)</h3>
                <p className="text-sm text-amber-700 mb-4">Повний профіль збільшує довіру клієнтів і конверсію замовлень.</p>
                <div className="w-full bg-amber-200 rounded-full h-2 mb-4">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {completionItems.map(item => (
                    <div key={item.label} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${item.done ? 'bg-green-50 text-green-700' : 'bg-white text-gray-500'}`}>
                      <span>{item.done ? '✅' : '⭕'}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
                {!completionItems.every(i => i.done) && (
                  <Link href="/dashboard/settings" className="mt-4 inline-block text-sm text-amber-700 font-semibold hover:underline">
                    Перейти до налаштувань →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-gray-900">Останні замовлення</h2>
              <Link href="/dashboard/orders" className="text-sm text-pink-600 hover:text-pink-700 font-semibold">
                Всі замовлення →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-500 font-medium">Замовлень ще немає</p>
                <p className="text-gray-400 text-sm mt-1">Поділіться посиланням на магазин щоб отримати перші замовлення</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {order.deliveryMethod === 'delivery' ? '🚚' : '🏪'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{order.customerName}</p>
                      <p className="text-sm text-gray-500 truncate">{order.phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {order.totalAmount && order.totalAmount > 0 && (
                        <p className="font-bold text-gray-900">{currencySymbol}{order.totalAmount.toFixed(0)}</p>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                      {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-black text-gray-900 mb-4">Швидкі дії</h2>
              <div className="space-y-2">
                <QuickAction href="/dashboard/assortment" icon="🌸" label="Асортимент" desc="Букети, квіти, упаковка" />
                <QuickAction href="/dashboard/orders" icon="📦" label="Замовлення" desc={pendingOrders > 0 ? `${pendingOrders} очікують` : 'Все оброблено!'} highlight={pendingOrders > 0} />
                <QuickAction href="/dashboard/settings" icon="⚙️" label="Налаштування" desc="Кольори, години, контакти" />
                <QuickAction href="/dashboard/delivery" icon="🚚" label="Зони доставки" desc="Налаштувати райони і ціни" />
                <QuickAction href="/shops" icon="🏙️" label="Каталог магазинів" desc="Всі магазини по містах України" />
              </div>
            </div>

            {/* Plan Info */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm">👑</div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Поточний план</p>
                  <p className="font-black text-gray-900">{shop.plan.name}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <span className="font-bold text-purple-700">{shop.flowers.length}</span>
                {' / '}
                <span>{shop.plan.maxBouquets === 999 ? '∞' : shop.plan.maxBouquets}</span>
                {' букетів використано'}
              </div>
              <Link href="/dashboard/subscription"
                className="block text-center py-2.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md">
                Керування підпискою
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  )
}

function QuickAction({ href, icon, label, desc, highlight }: {
  href: string; icon: string; label: string; desc: string; highlight?: boolean
}) {
  return (
    <Link href={href}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${highlight ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200' : 'hover:bg-gray-50'}`}>
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${highlight ? 'text-amber-800' : 'text-gray-800'}`}>{label}</p>
        <p className={`text-xs ${highlight ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
