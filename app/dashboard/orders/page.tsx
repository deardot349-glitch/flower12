'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Order {
  id: string
  customerName: string
  phone: string
  email: string | null
  status: string
  deliveryMethod: string | null
  deliveryAddress: string | null
  totalAmount: number | null
  message: string | null
  createdAt: string
  updatedAt: string
  flowerId: string | null
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; icon: string; color: string; bg: string; border: string; next: string[]
}> = {
  pending:    { label: 'Очікує',        icon: '⏳', color: '#d97706', bg: '#fef3c7', border: '#fde68a', next: ['confirmed', 'cancelled'] },
  confirmed:  { label: 'Підтверджено',  icon: '✅', color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', next: ['preparing', 'cancelled'] },
  preparing:  { label: 'Готується',     icon: '💐', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', next: ['ready', 'cancelled'] },
  ready:      { label: 'Готово',        icon: '🎁', color: '#db2777', bg: '#fce7f3', border: '#fbcfe8', next: ['delivering', 'delivered', 'cancelled'] },
  delivering: { label: 'В дорозі',      icon: '🚚', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd', next: ['delivered', 'cancelled'] },
  delivered:  { label: 'Доставлено',    icon: '🎉', color: '#059669', bg: '#d1fae5', border: '#a7f3d0', next: ['completed'] },
  completed:  { label: 'Завершено',     icon: '⭐', color: '#059669', bg: '#d1fae5', border: '#6ee7b7', next: [] },
  cancelled:  { label: 'Скасовано',     icon: '❌', color: '#dc2626', bg: '#fee2e2', border: '#fecaca', next: ['pending'] },
}

const PIPELINE = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered']

const NEXT_LABEL: Record<string, string> = {
  confirmed:  '✅ Підтвердити',
  preparing:  '💐 Розпочати',
  ready:      '🎁 Готово',
  delivering: '🚚 Передати кур\'єру',
  delivered:  '🎉 Доставлено',
  completed:  '⭐ Завершити',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'щойно'
  if (mins < 60) return `${mins} хв тому`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} год тому`
  return `${Math.floor(hrs / 24)} дн тому`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('uk-UA', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [search, setSearch] = useState('')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders/manage')
      const data = await res.json()
      if (data.orders) setOrders(data.orders as Order[])
    } catch {
      showToast('Помилка завантаження замовлень', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Auto-refresh every 60 s
  useEffect(() => {
    const interval = setInterval(fetchOrders, 60000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch('/api/orders/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o)
        )
        const cfg = STATUS_CONFIG[status]
        showToast(`${cfg?.icon} Статус змінено: ${cfg?.label}`)
        if (status === 'cancelled' || status === 'completed') setExpandedOrder(null)
      } else {
        showToast(data.error || 'Помилка оновлення', 'error')
      }
    } catch {
      showToast('Не вдалося оновити статус', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered']
  const filteredOrders = orders.filter(o => {
    const matchSearch = !search ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search)
    if (!matchSearch) return false
    if (filter === 'active') return activeStatuses.includes(o.status)
    if (filter === 'all') return true
    if (filter === 'done') return ['delivered', 'completed'].includes(o.status)
    if (filter === 'preparing') return ['confirmed', 'preparing'].includes(o.status)
    if (filter === 'delivering') return ['ready', 'delivering'].includes(o.status)
    return o.status === filter
  })

  const counts = {
    active:     orders.filter(o => activeStatuses.includes(o.status)).length,
    pending:    orders.filter(o => o.status === 'pending').length,
    preparing:  orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length,
    delivering: orders.filter(o => ['ready', 'delivering'].includes(o.status)).length,
    done:       orders.filter(o => ['delivered', 'completed'].includes(o.status)).length,
    cancelled:  orders.filter(o => o.status === 'cancelled').length,
    all:        orders.length,
  }

  const FILTER_TABS = [
    { key: 'active',     label: '🔥 Активні',  count: counts.active },
    { key: 'pending',    label: '⏳ Нові',       count: counts.pending },
    { key: 'preparing',  label: '💐 Готуються', count: counts.preparing },
    { key: 'delivering', label: '🚚 Доставка',  count: counts.delivering },
    { key: 'done',       label: '✅ Готово',     count: counts.done },
    { key: 'cancelled',  label: '❌ Скасовані', count: counts.cancelled },
    { key: 'all',        label: 'Всі',           count: counts.all },
  ]

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold transition-all ${
          toast.type === 'success' ? 'bg-gray-900' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Замовлення</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {counts.active > 0
              ? `${counts.active} активних · оновлюється автоматично`
              : 'Немає активних замовлень'}
          </p>
        </div>
        <button onClick={fetchOrders}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          🔄 Оновити
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Пошук за ім'ям або телефоном..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 shadow-sm"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTER_TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === key
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                filter === key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-14 text-center border border-gray-100">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600 text-lg font-bold">Замовлень немає</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Спробуйте інший пошуковий запит' : 'Поділіться посиланням на магазин'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const cfg         = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
            const isExpanded  = expandedOrder === order.id
            const isUpdating  = updating === order.id
            const nextStatuses = cfg.next.filter(s => s !== 'cancelled')
            const canCancel   = cfg.next.includes('cancelled')
            const pipelineIdx = PIPELINE.indexOf(order.status)

            return (
              <div key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">

                {/* Status color stripe */}
                <div className="h-1 w-full" style={{ background: cfg.color }} />

                {/* Collapsed row */}
                <div className="p-4 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                  <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-gray-900 truncate">{order.customerName}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {order.deliveryMethod && (
                        <span className="text-xs text-gray-400">
                          {order.deliveryMethod === 'pickup' ? '🏪 Самовивіз' : '🚚 Доставка'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {(order.totalAmount ?? 0) > 0 && (
                      <div className="font-black text-gray-900 text-base">₴{order.totalAmount}</div>
                    )}
                    <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="text-gray-400 text-sm flex-shrink-0">{isExpanded ? '▲' : '▼'}</div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100">

                    {/* Visual pipeline (skip for cancelled) */}
                    {order.status !== 'cancelled' && (
                      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center">
                          {PIPELINE.map((s, i) => {
                            const scfg   = STATUS_CONFIG[s]
                            const done   = pipelineIdx > i
                            const active = pipelineIdx === i
                            return (
                              <div key={s} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                                      done ? 'text-white border-transparent' :
                                      active ? 'text-white border-transparent' :
                                      'bg-white border-gray-200 text-gray-300'
                                    }`}
                                    style={{
                                      background: (done || active) ? cfg.color : undefined,
                                      boxShadow: active ? `0 0 0 4px ${cfg.color}30` : undefined,
                                    }}>
                                    {done ? '✓' : scfg.icon}
                                  </div>
                                  <span
                                    className={`text-xs mt-1 text-center leading-tight w-14 ${
                                      active ? 'font-bold' : done ? 'text-gray-500' : 'text-gray-300'
                                    }`}
                                    style={active ? { color: cfg.color } : {}}>
                                    {scfg.label}
                                  </span>
                                </div>
                                {i < PIPELINE.length - 1 && (
                                  <div className="flex-1 h-0.5 mx-1 rounded-full mb-5"
                                    style={{ background: pipelineIdx > i ? cfg.color : '#e5e7eb' }} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Details grid */}
                    <div className="p-5 grid sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Клієнт</div>
                        <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
                        <a href={`tel:${order.phone}`}
                          className="text-sm text-blue-600 font-medium block mt-0.5 hover:underline">
                          📞 {order.phone}
                        </a>
                        {order.email && (
                          <div className="text-xs text-gray-500 mt-0.5">✉️ {order.email}</div>
                        )}
                      </div>

                      {order.deliveryMethod && (
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Отримання</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {order.deliveryMethod === 'delivery' ? '🚚 Доставка' : '🏪 Самовивіз'}
                          </div>
                          {order.deliveryAddress && (
                            <div className="text-xs text-gray-600 mt-0.5">📍 {order.deliveryAddress}</div>
                          )}
                        </div>
                      )}

                      {(order.totalAmount ?? 0) > 0 && (
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Сума</div>
                          <div className="text-2xl font-black text-gray-900">₴{order.totalAmount}</div>
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Час замовлення</div>
                        <div className="text-sm text-gray-700">{formatDate(order.createdAt)}</div>
                        <div className="text-xs text-gray-400">ID: #{order.id.slice(-8).toUpperCase()}</div>
                      </div>

                      {order.message && (
                        <div className="sm:col-span-2">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Деталі замовлення</div>
                          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 border border-gray-200 whitespace-pre-line leading-relaxed">
                            {order.message}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="px-5 pb-5 flex flex-wrap gap-2">
                      {nextStatuses.map(nextStatus => (
                        <button key={nextStatus}
                          onClick={() => updateStatus(order.id, nextStatus)}
                          disabled={isUpdating}
                          className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50 transition-all active:scale-95 hover:brightness-95"
                          style={{ background: STATUS_CONFIG[nextStatus]?.color ?? '#374151' }}>
                          {isUpdating ? '⏳ ...' : (NEXT_LABEL[nextStatus] ?? `→ ${STATUS_CONFIG[nextStatus]?.label}`)}
                        </button>
                      ))}

                      {canCancel && (
                        <button onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={isUpdating}
                          className="bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors active:scale-95">
                          ❌ Скасувати
                        </button>
                      )}

                      {order.status === 'cancelled' && (
                        <button onClick={() => updateStatus(order.id, 'pending')}
                          disabled={isUpdating}
                          className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors active:scale-95">
                          ↩️ Відновити
                        </button>
                      )}

                      <a href={`tel:${order.phone}`}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                        📞 Зателефонувати
                      </a>
                      <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
