'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

const STATUS_CONFIG: Record<string, {
  label: string
  step: number
  description: string
  color: string
  darkColor: string
  isFinal?: boolean
  isError?: boolean
}> = {
  pending:    { label: 'Очікує підтвердження', step: 1, description: 'Ваше замовлення отримано і чекає підтвердження від магазину.',        color: '#f59e0b', darkColor: '#fbbf24' },
  confirmed:  { label: 'Підтверджено',          step: 2, description: 'Магазин підтвердив ваше замовлення і починає його готувати.',          color: '#3b82f6', darkColor: '#60a5fa' },
  preparing:  { label: 'Готується',             step: 3, description: 'Флористи вже збирають ваш букет із найсвіжіших квітів.',              color: '#8b5cf6', darkColor: '#a78bfa' },
  ready:      { label: 'Готово до видачі',      step: 4, description: 'Ваш букет готовий! Можете забирати або чекати доставки.',             color: '#ec4899', darkColor: '#f472b6' },
  delivering: { label: 'В дорозі',              step: 4, description: "Кур'єр вже їде до вас із вашим замовленням.",                         color: '#3b82f6', darkColor: '#60a5fa' },
  delivered:  { label: 'Доставлено',            step: 5, description: 'Замовлення успішно доставлено. Дякуємо за покупку!',                  color: '#10b981', darkColor: '#34d399', isFinal: true },
  completed:  { label: 'Завершено',             step: 5, description: 'Замовлення успішно завершено. Дякуємо!',                              color: '#10b981', darkColor: '#34d399', isFinal: true },
  cancelled:  { label: 'Скасовано',             step: 0, description: "На жаль, замовлення було скасовано. Зв'яжіться з магазином.",         color: '#ef4444', darkColor: '#f87171', isError: true },
}

const STEPS = [
  { label: 'Прийнято',    short: '1' },
  { label: 'Підтверджено', short: '2' },
  { label: 'Готується',   short: '3' },
  { label: 'Готово',      short: '4' },
  { label: 'Завершено',   short: '5' },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('uk-UA', {
    day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
  })
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
    setError(''); setLoading(true); setSearched(false)
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
      setError("Помилка з'єднання. Спробуйте ще раз.")
    } finally {
      setLoading(false)
    }
  }

  const primary = shop?.primaryColor || '#ec4899'
  const accent  = shop?.accentColor  || '#a855f7'
  const sym     = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  return (
    <main className="min-h-screen bg-gray-950">
      <style>{`
        .btn-primary { background: linear-gradient(135deg, ${primary}, ${accent}); transition: filter .2s, transform .15s; }
        .btn-primary:hover { filter: brightness(0.9); }
        .btn-primary:active { transform: scale(0.97); }
      `}</style>

      {/* ── Topbar ── */}
      <div className="border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href={`/${params.shopSlug}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {shop?.name || 'Назад до магазину'}
          </Link>
          {shop?.logoUrl && (
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src={shop.logoUrl} alt="logo" width={28} height={28} className="object-cover" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5">

        {/* ── Hero ── */}
        <div className="pt-12 pb-10 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-48 pointer-events-none">
            <div className="absolute inset-0 rounded-full blur-[60px] opacity-20" style={{ background: `radial-gradient(circle, ${primary}, ${accent})` }} />
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
              Відстеження замовлення
            </h1>
            <p className="text-gray-500 text-sm">
              Введіть номер телефону, який ви вказували при замовленні
            </p>
          </div>
        </div>

        {/* ── Search card ── */}
        <div className="bg-gray-900 border border-white/[0.08] rounded-2xl p-5 mb-7">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Номер телефону
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+380 99 123 45 67"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-white/20 text-sm transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary text-white px-5 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {loading ? 'Шукаємо...' : 'Знайти'}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-400 text-xs">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* ── Empty state ── */}
        {searched && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Замовлень не знайдено</h3>
            <p className="text-gray-500 text-sm mb-6">
              Перевірте номер телефону або зв'яжіться з магазином напряму.
            </p>
            <Link href={`/${params.shopSlug}`}
              className="btn-primary inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg">
              Перейти до {shop?.name || 'магазину'}
            </Link>
          </div>
        )}

        {/* ── Order cards ── */}
        {orders.length > 0 && (
          <div className="space-y-4 pb-12">
            <p className="text-xs text-gray-600 font-medium">
              Знайдено {orders.length} {orders.length === 1 ? 'замовлення' : orders.length < 5 ? 'замовлення' : 'замовлень'} для номера {phone}
            </p>

            {orders.map((order, idx) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending']
              const isCancelled = order.status === 'cancelled'
              const isDone = cfg.isFinal

              return (
                <div key={order.id}
                  className="bg-gray-900 border border-white/[0.08] rounded-2xl overflow-hidden">

                  {/* Status header */}
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Status indicator */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cfg.darkColor}18`, border: `1px solid ${cfg.darkColor}30` }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.darkColor,
                          boxShadow: isDone || isCancelled ? 'none' : `0 0 8px ${cfg.darkColor}` }} />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{cfg.label}</p>
                        <p className="text-xs text-gray-500">{timeAgo(order.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-600 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
                      {order.totalAmount && order.totalAmount > 0 && (
                        <p className="font-bold text-sm" style={{ color: cfg.darkColor }}>
                          {sym}{order.totalAmount.toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress stepper */}
                  {!isCancelled && (
                    <div className="px-5 py-5 border-b border-white/[0.06]">
                      <div className="flex items-center">
                        {STEPS.map((step, i) => {
                          const stepNum = i + 1
                          const isActive  = cfg.step === stepNum
                          const isDoneStep = cfg.step > stepNum
                          return (
                            <div key={i} className="flex items-center flex-1">
                              {/* Dot */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDoneStep ? 'text-white' :
                                  isActive   ? 'text-white' :
                                  'text-gray-600 bg-gray-800'
                                }`} style={
                                  isDoneStep ? { background: primary } :
                                  isActive   ? { background: `linear-gradient(135deg, ${primary}, ${accent})`,
                                                  boxShadow: `0 0 16px ${primary}50` } :
                                  {}
                                }>
                                  {isDoneStep ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : stepNum}
                                </div>
                                <span className={`text-[9px] mt-1.5 text-center leading-tight whitespace-nowrap ${
                                  isActive ? 'font-semibold' : 'text-gray-600'
                                }`} style={isActive ? { color: cfg.darkColor } : {}}>
                                  {step.label}
                                </span>
                              </div>
                              {/* Connector */}
                              {i < STEPS.length - 1 && (
                                <div className="flex-1 h-px mx-1.5 mb-5 rounded-full transition-all"
                                  style={{ background: cfg.step > stepNum ? primary : '#374151' }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="px-5 py-3.5 border-b border-white/[0.06]">
                    <p className="text-sm text-gray-400 leading-relaxed">{cfg.description}</p>
                  </div>

                  {/* Details grid */}
                  <div className="px-5 py-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold mb-1">Спосіб отримання</p>
                      <p className="text-sm font-medium text-white">
                        {order.deliveryMethod === 'pickup'   ? '🏪 Самовивіз' :
                         order.deliveryMethod === 'delivery' ? '🚚 Доставка'  : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold mb-1">Дата замовлення</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    {order.deliveryAddress && (
                      <div className="col-span-2">
                        <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold mb-1">Адреса доставки</p>
                        <p className="text-sm text-gray-300">📍 {order.deliveryAddress}</p>
                      </div>
                    )}
                  </div>

                  {/* Message / details */}
                  {order.message && (
                    <div className="mx-5 mb-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold mb-2">Деталі замовлення</p>
                      <p className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">{order.message}</p>
                    </div>
                  )}

                  {/* Footer CTA */}
                  <div className="px-5 pb-5">
                    {isDone ? (
                      <div className="space-y-3">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
                          <p className="text-emerald-400 text-sm font-semibold">
                            🎉 Дякуємо за замовлення!
                          </p>
                        </div>
                        <Link href={`/${params.shopSlug}`}
                          className="btn-primary block text-center text-white py-3 rounded-xl font-semibold text-sm">
                          Замовити ще →
                        </Link>
                      </div>
                    ) : isCancelled ? (
                      <div className="space-y-3">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
                          <p className="text-red-400 text-sm">Замовлення скасовано. Зв'яжіться з магазином для уточнення.</p>
                        </div>
                        <Link href={`/${params.shopSlug}`}
                          className="btn-primary block text-center text-white py-3 rounded-xl font-semibold text-sm">
                          Повернутись до магазину →
                        </Link>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600 text-center">
                        Є питання? Зв'яжіться з магазином напряму
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Before search info ── */}
        {!searched && !loading && (
          <div className="pb-12 space-y-4">
            {/* Security notice */}
            <div className="bg-gray-900 border border-white/[0.08] rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Приватно та безпечно</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ваші замовлення доступні лише за вашим номером телефону. Ніхто інший не може їх переглянути.
                </p>
              </div>
            </div>

            {/* Status legend */}
            <div className="bg-gray-900 border border-white/[0.08] rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Статуси замовлення</p>
              <div className="space-y-3">
                {[
                  { status: 'pending',   label: 'Очікує підтвердження' },
                  { status: 'preparing', label: 'Готується' },
                  { status: 'ready',     label: 'Готово' },
                  { status: 'delivering',label: 'В дорозі' },
                  { status: 'completed', label: 'Завершено' },
                ].map(({ status, label }) => {
                  const cfg = STATUS_CONFIG[status]
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.darkColor }} />
                      <span className="text-sm text-gray-400">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
