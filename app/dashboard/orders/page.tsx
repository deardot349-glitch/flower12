'use client'

import { useState, useEffect } from 'react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  confirmed: '✅ Confirmed',
  completed: '🎉 Completed',
  cancelled: '❌ Cancelled',
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
      console.error('Failed to fetch orders')
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
        setMessage(`Order marked as ${status}`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.error || 'Failed to update')
      }
    } catch {
      setMessage('Failed to update order')
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
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and process customer orders</p>
        </div>
        <button onClick={fetchOrders} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          🔄 Refresh
        </button>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {message}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
          <button key={status} onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {status === 'all' ? 'All' : STATUS_LABELS[status]} ({counts[status]})
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">No {filter !== 'all' ? filter : ''} orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Orders will appear here when customers place them from your shop</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Order row */}
              <div className="p-5 flex items-center gap-4">
                {/* Status badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>

                {/* Customer info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{order.customerName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
                    <span>📞 {order.phone}</span>
                    {order.email && <span>✉️ {order.email}</span>}
                  </div>
                </div>

                {/* Amount + date */}
                <div className="text-right hidden sm:block">
                  {order.totalAmount > 0 && (
                    <div className="font-bold text-gray-900">${order.totalAmount}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Expand button */}
                <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="text-gray-400 hover:text-gray-600 px-2">
                  {expandedOrder === order.id ? '▲' : '▼'}
                </button>
              </div>

              {/* Expanded details */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <div className="grid sm:grid-cols-2 gap-4 mb-5">
                    {order.message && (
                      <div className="sm:col-span-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message from customer</div>
                        <div className="bg-white rounded-xl p-3 text-sm text-gray-700 border border-gray-200">{order.message}</div>
                      </div>
                    )}
                    {order.deliveryMethod && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delivery Method</div>
                        <div className="text-sm font-medium text-gray-800">{order.deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</div>
                      </div>
                    )}
                    {order.deliveryAddress && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delivery Address</div>
                        <div className="text-sm text-gray-800">{order.deliveryAddress}</div>
                      </div>
                    )}
                    {order.scheduledDeliveryDate && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Scheduled Date</div>
                        <div className="text-sm text-gray-800">{new Date(order.scheduledDeliveryDate).toLocaleDateString()}</div>
                      </div>
                    )}
                    {order.totalAmount > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Order Total</div>
                        <div className="text-lg font-bold text-gray-900">${order.totalAmount}</div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(order.id, 'confirmed')}
                          disabled={updating === order.id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                          {updating === order.id ? '...' : '✅ Confirm Order'}
                        </button>
                        <button onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={updating === order.id}
                          className="bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors">
                          ❌ Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <>
                        <button onClick={() => updateStatus(order.id, 'completed')}
                          disabled={updating === order.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                          {updating === order.id ? '...' : '🎉 Mark Completed'}
                        </button>
                        <button onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={updating === order.id}
                          className="bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors">
                          ❌ Cancel
                        </button>
                      </>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <button onClick={() => updateStatus(order.id, 'pending')}
                        disabled={updating === order.id}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors">
                        ↩️ Reopen
                      </button>
                    )}
                    {/* Contact buttons */}
                    <a href={`tel:${order.phone}`}
                      className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                      📞 Call
                    </a>
                    {order.phone && (
                      <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
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
