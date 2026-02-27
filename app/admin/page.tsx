'use client'

import { useState, useEffect } from 'react'

type Shop = {
  id: string
  name: string
  slug: string
  suspended: boolean
  createdAt: string
  plan: { name: string; slug: string }
  owner: { email: string }
  _count: { flowers: number; orders: number }
  subscriptions: Array<{
    id: string
    status: string
    createdAt: string
    plan: { name: string }
    payment?: { amount: number; status: string; cardLast4: string; cardType: string }
  }>
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [tab, setTab] = useState<'payments' | 'shops'>('payments')
  const [payments, setPayments] = useState<any[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [expandedShop, setExpandedShop] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg); setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  const handleLogin = async () => {
    if (!secret) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'Authorization': `Bearer ${secret}` }
      })
      if (res.ok) { setAuthenticated(true); fetchAll() }
      else notify('Невірний секретний ключ', 'error')
    } catch { notify('Помилка підключення', 'error') }
    finally { setLoading(false) }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [paymentsRes, shopsRes] = await Promise.all([
        fetch('/api/admin/payments', { headers: { 'Authorization': `Bearer ${secret}` } }),
        fetch('/api/admin/shops', { headers: { 'Authorization': `Bearer ${secret}` } }),
      ])
      const paymentsData = await paymentsRes.json()
      const shopsData = await shopsRes.json()
      if (paymentsData.payments) setPayments(paymentsData.payments)
      if (shopsData.shops) setShops(shopsData.shops)
    } catch { notify('Помилка завантаження', 'error') }
    finally { setLoading(false) }
  }

  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, paymentId, action })
      })
      const data = await res.json()
      if (res.ok) { notify(data.message); fetchAll() }
      else notify(data.error, 'error')
    } catch { notify('Помилка', 'error') }
    finally { setLoading(false) }
  }

  const handleShopAction = async (shopId: string, action: 'suspend' | 'unsuspend') => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, shopId, action })
      })
      const data = await res.json()
      if (res.ok) { notify(data.message); fetchAll() }
      else notify(data.error, 'error')
    } catch { notify('Помилка', 'error') }
    finally { setLoading(false) }
  }

  const handleSubscriptionAction = async (subscriptionId: string, action: 'cancel' | 'activate') => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, subscriptionId, action })
      })
      const data = await res.json()
      if (res.ok) { notify(data.message); fetchAll() }
      else notify(data.error, 'error')
    } catch { notify('Помилка', 'error') }
    finally { setLoading(false) }
  }

  const filteredShops = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner.email.toLowerCase().includes(search.toLowerCase())
  )

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-2xl font-black text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">FlowerGoUa Management</p>
          </div>
          <div className="space-y-4">
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-pink-400 focus:outline-none"
              placeholder="Секретний ключ адміністратора" />
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">
              {loading ? 'Входимо...' : 'Увійти'}
            </button>
            {message && <p className="text-red-600 text-sm text-center">{message}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌸</span>
            <span className="font-black text-gray-900">FlowerGoUa Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAll} disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors">
              {loading ? '...' : '🔄 Оновити'}
            </button>
            <button onClick={() => setAuthenticated(false)}
              className="text-sm text-gray-500 hover:text-red-600 px-3 py-2">
              Вийти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Всього магазинів', value: shops.length, icon: '🏪' },
            { label: 'Активні підписки', value: shops.filter(s => s.subscriptions?.some(sub => sub.status === 'active')).length, icon: '✅' },
            { label: 'Очікують оплати', value: payments.length, icon: '⏳' },
            { label: 'Заблоковані', value: shops.filter(s => s.suspended).length, icon: '🚫' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Notification */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>{message}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('payments')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === 'payments' ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            ⏳ Оплати {payments.length > 0 && <span className="ml-1 bg-white text-pink-600 px-1.5 rounded-full text-xs">{payments.length}</span>}
          </button>
          <button onClick={() => setTab('shops')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === 'shops' ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            🏪 Магазини ({shops.length})
          </button>
        </div>

        {/* PAYMENTS TAB */}
        {tab === 'payments' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {payments.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-500">Немає очікуючих платежів</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Магазин / Email', 'План', 'Сума', 'Картка', 'Дата', 'Дії'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900 text-sm">{payment.subscription.shop.name}</div>
                          <div className="text-xs text-gray-400">{payment.subscription.shop.owner.email}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">{payment.subscription.plan.name}</td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-900">{payment.amount} грн</td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-gray-700">{payment.cardHolderName}</div>
                          <div className="text-xs text-gray-400">{payment.cardType} •••• {payment.cardLast4}</div>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400">
                          {new Date(payment.createdAt).toLocaleDateString('uk-UA')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => handlePaymentAction(payment.id, 'approve')} disabled={loading}
                              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50">
                              ✅ Підтвердити
                            </button>
                            <button onClick={() => handlePaymentAction(payment.id, 'reject')} disabled={loading}
                              className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 disabled:opacity-50">
                              ❌ Відхилити
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SHOPS TAB */}
        {tab === 'shops' && (
          <div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full mb-4 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
              placeholder="🔍 Пошук за назвою або email..." />

            <div className="space-y-3">
              {filteredShops.map(shop => (
                <div key={shop.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${shop.suspended ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                  {/* Shop row */}
                  <div className="p-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{shop.name}</span>
                        {shop.suspended && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">🚫 Заблокований</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          shop.plan.slug === 'premium' ? 'bg-purple-100 text-purple-700' :
                          shop.plan.slug === 'basic' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{shop.plan.name}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
                        <span>✉️ {shop.owner.email}</span>
                        <span>💐 {shop._count.flowers} букетів</span>
                        <span>📦 {shop._count.orders} замовлень</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/${shop.slug}`} target="_blank"
                        className="text-xs text-gray-400 hover:text-pink-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                        Переглянути →
                      </a>
                      <button onClick={() => setExpandedShop(expandedShop === shop.id ? null : shop.id)}
                        className="text-gray-400 hover:text-gray-600 px-2 text-lg">
                        {expandedShop === shop.id ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedShop === shop.id && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                      {/* Actions */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Керування магазином</p>
                        <div className="flex gap-2">
                          {shop.suspended ? (
                            <button onClick={() => handleShopAction(shop.id, 'unsuspend')} disabled={loading}
                              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                              ✅ Розблокувати магазин
                            </button>
                          ) : (
                            <button onClick={() => handleShopAction(shop.id, 'suspend')} disabled={loading}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50">
                              🚫 Заблокувати магазин
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subscriptions */}
                      {shop.subscriptions?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Підписки</p>
                          <div className="space-y-2">
                            {shop.subscriptions.map(sub => (
                              <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-semibold text-gray-900 text-sm">{sub.plan.name}</span>
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                                      sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                      sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {sub.status === 'active' ? '✅ Активна' :
                                       sub.status === 'pending' ? '⏳ Очікує' :
                                       sub.status === 'cancelled' ? '❌ Скасована' : sub.status}
                                    </span>
                                    {sub.payment && (
                                      <span className="ml-2 text-xs text-gray-400">
                                        {sub.payment.amount} грн · {sub.payment.cardType} •••• {sub.payment.cardLast4}
                                      </span>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {new Date(sub.createdAt).toLocaleDateString('uk-UA')}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {sub.status !== 'active' && sub.status !== 'cancelled' && (
                                      <button onClick={() => handleSubscriptionAction(sub.id, 'activate')} disabled={loading}
                                        className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 disabled:opacity-50">
                                        Активувати
                                      </button>
                                    )}
                                    {sub.status === 'active' && (
                                      <button onClick={() => handleSubscriptionAction(sub.id, 'cancel')} disabled={loading}
                                        className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 disabled:opacity-50">
                                        Скасувати
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
