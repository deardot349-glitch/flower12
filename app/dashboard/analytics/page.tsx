'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AnalyticsData {
  currency: string
  summary: {
    totalRevenue: number; totalOrders: number; completedCount: number
    avgOrderValue: number; totalDiscounts: number; repeatCustomers: number
    newCustomers: number; revenueChange: number | null
  }
  revenueByDay: { date: string; revenue: number; orders: number }[]
  statusCount: Record<string, number>
  topProducts: { name: string; category: string | null; count: number; revenue: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує', confirmed: 'Підтверджено', preparing: 'Готується',
  ready: 'Готово', delivery: 'Доставка', completed: 'Завершено',
  cancelled: 'Скасовано', refunded: 'Повернено',
}
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#8b5cf6',
  ready: '#06b6d4', delivery: '#f97316', completed: '#22c55e',
  cancelled: '#ef4444', refunded: '#6b7280',
}

function MiniBarChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="flex items-end gap-px h-24 w-full">
      {data.map((d, i) => {
        const h = Math.max((d.revenue / maxRev) * 96, d.revenue > 0 ? 4 : 1)
        const label = new Date(d.date).getDate()
        const showLabel = data.length <= 30 ? i % 5 === 0 : i % 15 === 0
        return (
          <div key={d.date} className="flex flex-col items-center flex-1 gap-0.5 group relative">
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
              {d.date}<br/>₴{d.revenue.toFixed(0)} · {d.orders} зам.
            </div>
            <div className="w-full rounded-t-sm transition-all"
              style={{ height: h + 'px', background: d.revenue > 0 ? 'linear-gradient(to top, #ec4899, #a855f7)' : '#374151' }} />
            {showLabel && <span className="text-[8px] text-gray-600">{label}</span>}
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color?: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg">{icon}</span>
        {sub && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color || 'text-gray-500 bg-gray-100'}`}>{sub}</span>}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const sym = data?.currency === 'UAH' ? '₴' : data?.currency === 'EUR' ? '€' : '$'
  const s = data?.summary

  const changeColor = !s?.revenueChange ? '' :
    s.revenueChange > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
  const changeLabel = s?.revenueChange != null
    ? `${s.revenueChange > 0 ? '+' : ''}${s.revenueChange.toFixed(1)}%`
    : undefined

  const totalOrdersInStatus = Object.values(data?.statusCount || {}).reduce((a, b) => a + b, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 md:py-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900">Аналітика</h1>
          <p className="text-gray-500 text-sm mt-0.5">Доходи, замовлення та активність клієнтів</p>
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[['7', '7 днів'], ['30', '30 днів'], ['90', '90 днів']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>{l}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard icon="💰" label={`Дохід за ${period} днів`}
              value={`${sym}${(s?.totalRevenue || 0).toFixed(0)}`}
              sub={changeLabel} color={changeColor} />
            <StatCard icon="📦" label="Всього замовлень"
              value={String(s?.totalOrders || 0)}
              sub={`${s?.completedCount || 0} завершено`} color="text-gray-600 bg-gray-100" />
            <StatCard icon="🧾" label="Середній чек"
              value={`${sym}${(s?.avgOrderValue || 0).toFixed(0)}`} />
            <StatCard icon="👥" label="Постійних клієнтів"
              value={String(s?.repeatCustomers || 0)}
              sub={`${s?.newCustomers || 0} нових`} color="text-purple-700 bg-purple-100" />
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-5">
            <h2 className="font-bold text-gray-900 mb-4 text-sm">Дохід за днями</h2>
            {data.revenueByDay.every(d => d.revenue === 0) ? (
              <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                Замовлень за цей період ще немає
              </div>
            ) : (
              <MiniBarChart data={data.revenueByDay} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Order status breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-sm">Статуси замовлень</h2>
              {totalOrdersInStatus === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Немає замовлень за цей період</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(data.statusCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const pct = Math.round((count / totalOrdersInStatus) * 100)
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5 font-medium text-gray-700">
                              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status] || '#6b7280' }} />
                              {STATUS_LABELS[status] || status}
                            </span>
                            <span className="text-gray-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: pct + '%', background: STATUS_COLORS[status] || '#6b7280' }} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Top products */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
              <h2 className="font-bold text-gray-900 mb-4 text-sm">Топ букетів</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Немає даних за цей період</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-[10px] font-black text-pink-700 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                        {p.category && <p className="text-[10px] text-gray-400">{p.category}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{sym}{p.revenue.toFixed(0)}</p>
                        <p className="text-[10px] text-gray-400">{p.count} зам.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Extra stats row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">🏷️ Знижки видано</p>
              <p className="text-xl font-black text-gray-900">{sym}{(s?.totalDiscounts || 0).toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">📈 Конверсія</p>
              <p className="text-xl font-black text-gray-900">
                {s?.totalOrders ? Math.round((s.completedCount / s.totalOrders) * 100) : 0}%
              </p>
            </div>
            <div className="col-span-2 md:col-span-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-100 p-4 flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-xs font-semibold text-pink-900">Порада</p>
                <p className="text-xs text-pink-700 leading-relaxed">
                  {(s?.repeatCustomers || 0) > 0
                    ? `У вас ${s?.repeatCustomers} постійних клієнтів — запропонуйте їм знижку!`
                    : 'Заповніть всі дані магазину для кращого SEO і більше клієнтів.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
