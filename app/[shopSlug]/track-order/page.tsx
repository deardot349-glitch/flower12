'use client'

import { useState, useEffect } from 'react'

interface Order {
  id: string
  customerName: string
  phone: string
  status: string
  deliveryMethod: string | null
  deliveryAddress: string | null
  totalAmount: number | null
  message: string | null
  createdAt: string
  updatedAt: string
}

interface Shop {
  name: string
  slug: string
  primaryColor: string | null
  accentColor: string | null
  logoUrl: string | null
  currency: string
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; step: number; description: string }> = {
  pending:    { label: 'Очікує підтвердження', icon: '⏳', color: '#f59e0b', bg: '#fef3c7', step: 1, description: 'Ваше замовлення отримано і чекає підтвердження від магазину.' },
  confirmed:  { label: 'Підтверджено',         icon: '✅', color: '#10b981', bg: '#d1fae5', step: 2, description: 'Магазин підтвердив ваше замовлення і починає його готувати.' },
  preparing:  { label: 'Готується',            icon: '💐', color: '#8b5cf6', bg: '#ede9fe', step: 3, description: 'Флористи вже збирають ваш букет із найсвіжіших квітів.' },
  ready:      { label: 'Готово до видачі',     icon: '🎁', color: '#ec4899', bg: '#fce7f3', step: 4, description: 'Ваш букет готовий! Можете забирати або чекати доставки.' },
  delivering: { label: 'В дорозі',             icon: '🚚', color: '#3b82f6', bg: '#dbeafe', step: 4, description: 'Кур\'єр вже їде до вас із вашим замовленням.' },
  delivered:  { label: 'Доставлено',           icon: '🎉', color: '#10b981', bg: '#d1fae5', step: 5, description: 'Замовлення успішно доставлено. Дякуємо за покупку!' },
  completed:  { label: 'Завершено',            icon: '⭐', color: '#10b981', bg: '#d1fae5', step: 5, description: 'Замовлення успішно завершено. Дякуємо!' },
  cancelled:  { label: 'Скасовано',            icon: '❌', color: '#ef4444', bg: '#fee2e2', step: 0, description: 'На жаль, замовлення було скасовано. Зв\'яжіться з магазином для уточнення.' },
}

const STEPS = [
  { label: 'Прийнято',     icon: '📋' },
  { label: 'Підтверджено', icon: '✅' },
  { label: 'Готується',    icon: '💐' },
  { label: 'Готово',       icon: '🎁' },
  { label: 'Завершено',    icon: '🎉' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('uk-UA', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'щойно'
  if (mins < 60) return `${mins} хв тому`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} год тому`
  return `${Math.floor(hrs / 24)} дн тому`
}

export default function TrackOrderPage({ params }: { params: { shopSlug: string } }) {
  const [shop, setShop] = useState<Shop | null>(null)
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [currency, setCurrency] = useState('UAH')

  useEffect(() => {
    fetch(`/api/shop/public/${params.shopSlug}`)
      .then(r => r.json())
      .then(d => { if (d.shop) setShop(d.shop) })
      .catch(() => {})
  }, [params.shopSlug])

  const handleSearch = async () => {
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 7) {
      setError('Введіть коректний номер телефону')
      return
    }
    setError('')
    setLoading(true)
    setSearched(false)
    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(phone.trim())}&shopSlug=${params.shopSlug}`)
      const data = await res.json()
      if (res.ok) {
        setOrders(data.orders || [])
        setCurrency(data.currency || 'UAH')
        setSearched(true)
      } else {
        setError(data.error || 'Помилка пошуку')
      }
    } catch {
      setError('Помилка з\'єднання. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  const primary = shop?.primaryColor || '#ec4899'
  const accent = shop?.accentColor || '#a855f7'
  const currencySymbol = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  return (
    <main className="min-h-screen bg-gray-50">
      <style>{`
        :root { --primary: ${primary}; --accent: ${accent}; }
        .btn-primary { background: linear-gradient(135deg, ${primary}, ${accent}); }
        .btn-primary:hover { filter: brightness(0.92); }
        .btn-primary:active { transform: scale(0.98); }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .anim-fade { animation: fadeInUp 0.4s ease-out both; }
      `}</style>

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-2xl mx-auto px-4 py-10 relative">
          <a href={`/${params.shopSlug}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition-colors active:scale-95">
            ← {shop?.name || 'Назад до магазину'}
          </a>
          <div className="text-center">
            <div className="text-5xl mb-3">📦</div>
            <h1 className="text-3xl font-black text-white mb-2">Відстеження замовлення</h1>
            <p className="text-white/80 text-base">Введіть номер телефону, який ви вказували при замовленні</p>
          </div>
        </div>
      </div>

      {/* Search box */}
      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-2">Номер телефону</label>
          <div className="flex gap-3">
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+380 99 123 45 67"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary text-white px-6 py-3.5 rounded-2xl font-bold shadow-md disabled:opacity-50 transition-all active:scale-[0.98] whitespace-nowrap"
            >
              {loading ? '⏳' : '🔍 Знайти'}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2 font-medium">❌ {error}</p>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {searched && orders.length === 0 && (
          <div className="text-center py-14 anim-fade">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Замовлень не знайдено</h3>
            <p className="text-gray-500 text-sm">Перевірте номер телефону або зв'яжіться з магазином.</p>
            {shop?.name && (
              <a href={`/${params.shopSlug}`} className="inline-block mt-6 btn-primary text-white px-6 py-3 rounded-2xl font-bold shadow-md">
                Перейти до {shop.name}
              </a>
            )}
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-5 anim-fade">
            <p className="text-sm text-gray-500 font-medium">Знайдено {orders.length} {orders.length === 1 ? 'замовлення' : orders.length < 5 ? 'замовлення' : 'замовлень'}</p>

            {orders.map((order, idx) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending']
              const isCancelled = order.status === 'cancelled'
              const isDone = order.status === 'delivered' || order.status === 'completed'

              return (
                <div key={order.id}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden anim-fade"
                  style={{ animationDelay: `${idx * 0.07}s` }}>

                  {/* Status bar */}
                  <div className="px-5 py-4 flex items-center justify-between" style={{ background: cfg.bg }}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cfg.icon}</span>
                      <div>
                        <div className="font-black text-gray-900 text-base">{cfg.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{timeAgo(order.updatedAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</div>
                      {order.totalAmount && order.totalAmount > 0 && (
                        <div className="font-black text-lg" style={{ color: primary }}>{currencySymbol}{order.totalAmount.toFixed(0)}</div>
                      )}
                    </div>
                  </div>

                  {/* Progress steps (skip for cancelled) */}
                  {!isCancelled && (
                    <div className="px-5 py-4 border-b border-gray-50">
                      <div className="flex items-center justify-between">
                        {STEPS.map((step, i) => {
                          const stepNum = i + 1
                          const isActive = cfg.step === stepNum
                          const isDoneStep = cfg.step > stepNum
                          return (
                            <div key={i} className="flex flex-col items-center flex-1">
                              {/* connector line before */}
                              <div className="flex items-center w-full">
                                {i > 0 && (
                                  <div className="flex-1 h-0.5 rounded-full" style={{ background: cfg.step > i ? primary : '#e5e7eb' }} />
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                                  isDoneStep ? 'text-white shadow-sm' :
                                  isActive ? 'text-white shadow-md ring-4' :
                                  'bg-gray-100 text-gray-400'
                                }`}
                                  style={{
                                    background: isDoneStep ? primary : isActive ? primary : undefined,
                                    boxShadow: isActive ? `0 0 0 4px ${primary}30` : undefined
                                  }}>
                                  {isDoneStep ? '✓' : isActive ? step.icon : stepNum}
                                </div>
                                {i < STEPS.length - 1 && (
                                  <div className="flex-1 h-0.5 rounded-full" style={{ background: cfg.step > stepNum ? primary : '#e5e7eb' }} />
                                )}
                              </div>
                              <span className={`text-xs mt-1.5 text-center leading-tight px-0.5 ${isActive ? 'font-bold' : 'text-gray-400'}`}
                                style={isActive ? { color: primary } : {}}>
                                {step.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Status description */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm text-gray-600">{cfg.description}</p>
                  </div>

                  {/* Order details */}
                  <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-400 font-medium mb-0.5">Отримання</div>
                        <div className="font-semibold text-gray-800">
                          {order.deliveryMethod === 'pickup' ? '🏪 Самовивіз' :
                           order.deliveryMethod === 'delivery' ? '🚚 Доставка' : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 font-medium mb-0.5">Дата замовлення</div>
                        <div className="font-semibold text-gray-800 text-xs">{formatDate(order.createdAt)}</div>
                      </div>
                    </div>

                    {order.deliveryAddress && (
                      <div className="text-sm">
                        <div className="text-xs text-gray-400 font-medium mb-0.5">Адреса доставки</div>
                        <div className="font-semibold text-gray-800">📍 {order.deliveryAddress}</div>
                      </div>
                    )}

                    {order.message && (
                      <div className="text-sm bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div className="text-xs text-gray-400 font-medium mb-1">Деталі замовлення</div>
                        <div className="text-gray-700 text-xs whitespace-pre-line leading-relaxed">{order.message}</div>
                      </div>
                    )}
                  </div>

                  {/* CTA footer */}
                  {(isDone || isCancelled) ? (
                    <div className="px-5 pb-5">
                      <a href={`/${params.shopSlug}`}
                        className="btn-primary block text-center text-white py-3.5 rounded-2xl font-bold shadow-md active:scale-[0.98] transition-all">
                        🌸 Замовити ще
                      </a>
                    </div>
                  ) : (
                    <div className="px-5 pb-5">
                      <p className="text-xs text-gray-400 text-center">Є питання? Зв'яжіться з магазином напряму</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Info banner (before search) */}
        {!searched && !loading && (
          <div className="mt-4 anim-fade">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold text-gray-900 mb-2">Приватно та безпечно</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Ваші замовлення доступні лише за вашим номером телефону. Ніхто інший не може переглянути ваші дані.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: '⏳', label: 'Очікує', desc: 'Прийнято' },
                { icon: '💐', label: 'Готується', desc: 'В роботі' },
                { icon: '🎉', label: 'Готово', desc: 'Завершено' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xs font-bold text-gray-900">{s.label}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
