'use client'

import { useState, useEffect } from 'react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Очікує',
  confirmed: '✅ Підтверджено',
  completed: '🎉 Виконано',
  cancelled: '❌ Скасовано',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders/manage')
      const data = await res.json()
      if (data.orders) setOrders(data.orders)
    } catch (err) {
      console.error('Помилка завантаження замовлень')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId)
    setMessage('')
    try {
      const res = await fetch('/api/orders/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      const data = await res.json()
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
        setMessage(`Замовлення позначено: ${STATUS_LABELS[status] || status}`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.error || 'Помилка оновлення')
      }
    } catch {
      setMessage('Не вдалося оновити замовлення')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Замовлення</h1>
          <p className="text-gray-500 mt-1">Керування та обробка замовлень клієнтів</p>
        </div>
        <button onClick={fetchOrders} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          🔄 Оновити
        </button>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          ✅ {message}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Всі' },
          { key: 'pending', label: '⏳ Очікують' },
          { key: 'confirmed', label: '✅ Підтверджені' },
          { key: 'completed', label: '🎉 Виконані' },
          { key: 'cancelled', label: '❌ Скасовані' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {label} ({counts[key as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 text-lg font-semibold">
            {filter !== 'all' ? `Немає ${STATUS_LABELS[filter]?.toLowerCase()} замовлень` : 'Замовлень ще немає'}
          </p>
          <p className="text-gray-400 text-sm mt-2">Поділіться посиланням на магазин щоб отримати перші замовлення</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Order row */}
              <div className="p-5 flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900">{order.customerName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
                    <span>📞 {order.phone}</span>
                    {order.email && <span>✉️ {order.email}</span>}
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  {order.totalAmount > 0 && (
                    <div className="font-black text-gray-900">₴{order.totalAmount}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  {expandedOrder === order.id ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded details */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    {order.message && (
                      <div className="sm:col-span-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Повідомлення клієнта</div>
                        <div className="bg-white rounded-xl p-3 text-sm text-gray-700 border border-gray-200 leading-relaxed">{order.message}</div>
                      </div>
                    )}
                    {order.deliveryMethod && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Спосіб отримання</div>
                        <div className="text-sm font-semibold text-gray-800">{order.deliveryMethod === 'delivery' ? '🚚 Доставка' : '🏪 Самовивіз'}</div>
                      </div>
                    )}
                    {order.deliveryAddress && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Адреса доставки</div>
                        <div className="text-sm text-gray-800">{order.deliveryAddress}</div>
                      </div>
                    )}
                    {order.scheduledDeliveryDate && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Запланована дата</div>
                        <div className="text-sm text-gray-800">{new Date(order.scheduledDeliveryDate).toLocaleDateString('uk-UA')}</div>
                      </div>
                    )}
                    {order.totalAmount > 0 && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Сума замовлення</div>
                        <div className="text-xl font-black text-gray-900">₴{order.totalAmount}</div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(order.id, 'confirmed')}
                          disabled={updating === order.id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                          {updating === order.id ? '...' : '✅ Підтвердити'}
                        </button>
                        <button onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={updating === order.id}
                          className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors">
                          ❌ Скасувати
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <>
                        <button onClick={() => updateStatus(order.id, 'completed')}
                          disabled={updating === order.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                          {updating === order.id ? '...' : '🎉 Виконано'}
                        </button>
                        <button onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={updating === order.id}
                          className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors">
                          ❌ Скасувати
                        </button>
                      </>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <button onClick={() => updateStatus(order.id, 'pending')}
                        disabled={updating === order.id}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-300 disabled:opacity-50 transition-colors">
                        ↩️ Відновити
                      </button>
                    )}
                    <a href={`tel:${order.phone}`}
                      className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                      📞 Зателефонувати
                    </a>
                    {order.phone && (
                      <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors">
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
