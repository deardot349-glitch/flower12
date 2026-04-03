'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Payment = {
  id: string
  amount: number
  status: string
  cardLast4: string
  cardType: string
  cardHolderName: string
  createdAt: string
  subscription: {
    id: string
    plan: { name: string; slug: string }
    shop: { id: string; name: string; slug: string; owner: { email: string } }
  }
}

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
    expiryDate?: string
    plan: { name: string; slug: string }
    payment?: { amount: number; status: string; cardLast4: string; cardType: string; cardHolderName: string }
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function planBadge(slug: string) {
  if (slug === 'premium') return 'bg-purple-100 text-purple-700'
  if (slug === 'basic')   return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-500'
}

function statusBadge(status: string) {
  if (status === 'active')    return 'bg-green-100 text-green-700'
  if (status === 'pending')   return 'bg-yellow-100 text-yellow-700'
  if (status === 'approved')  return 'bg-green-100 text-green-700'
  if (status === 'rejected')  return 'bg-red-100 text-red-700'
  if (status === 'cancelled') return 'bg-gray-100 text-gray-500'
  if (status === 'expired')   return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Login screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (secret: string) => void }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const attempt = async () => {
    if (!val.trim()) return
    setLoading(true); setErr('')
    const res = await fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${val}` } })
    if (res.ok) { onLogin(val) } else { setErr('Невірний ключ') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">🌸</div>
          <h1 className="text-xl font-black text-gray-900">FlowerGoUa Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Введіть секретний ключ</p>
        </div>
        <input type="password" value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-pink-400 outline-none mb-3"
          placeholder="••••••••••••••••" />
        {err && <p className="text-red-600 text-sm text-center mb-3">{err}</p>}
        <button onClick={attempt} disabled={loading || !val.trim()}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 transition-all shadow-md">
          {loading ? 'Перевіряємо...' : 'Увійти'}
        </button>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function Stat({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-3`}>{icon}</div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'ok' | 'err'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'ok' ? '✅' : '❌'} {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  )
}

// ── Main admin panel ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret]           = useState('')
  const [payments, setPayments]       = useState<Payment[]>([])
  const [shops, setShops]             = useState<Shop[]>([])
  const [loading, setLoading]         = useState(false)
  const [tab, setTab]                 = useState<'payments' | 'shops'>('payments')
  const [search, setSearch]           = useState('')
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [toast, setToast]             = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shop | null>(null)

  const notify = (msg: string, type: 'ok' | 'err' = 'ok') => setToast({ msg, type })

  const fetchAll = useCallback(async (sk: string) => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${sk}` }
      const [pr, sr] = await Promise.all([
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/shops',    { headers }),
      ])
      const pd = await pr.json()
      const sd = await sr.json()
      if (pd.payments) setPayments(pd.payments)
      if (sd.shops)    setShops(sd.shops)
    } catch { notify('Помилка завантаження', 'err') }
    finally { setLoading(false) }
  }, [])

  const handleLogin = (sk: string) => { setSecret(sk); fetchAll(sk) }

  const api = async (url: string, opts: RequestInit) => {
    const res = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}`, ...(opts.headers || {}) },
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error || 'Error')
    return d
  }

  const paymentAction = async (id: string, action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      const d = await api('/api/admin/payments', { method: 'POST', body: JSON.stringify({ paymentId: id, action }) })
      notify(d.message); fetchAll(secret)
    } catch (e: any) { notify(e.message, 'err') }
    finally { setLoading(false) }
  }

  const shopAction = async (shopId: string, action: 'suspend' | 'unsuspend') => {
    setLoading(true)
    try {
      const d = await api('/api/admin/shops', { method: 'POST', body: JSON.stringify({ shopId, action }) })
      notify(d.message); fetchAll(secret)
    } catch (e: any) { notify(e.message, 'err') }
    finally { setLoading(false) }
  }

  const subAction = async (subscriptionId: string, action: 'cancel' | 'activate') => {
    setLoading(true)
    try {
      const d = await api('/api/admin/shops', { method: 'PATCH', body: JSON.stringify({ subscriptionId, action }) })
      notify(d.message); fetchAll(secret)
    } catch (e: any) { notify(e.message, 'err') }
    finally { setLoading(false) }
  }

  const deleteShop = async (shop: Shop) => {
    setLoading(true)
    try {
      const d = await api('/api/admin/shops', { method: 'DELETE', body: JSON.stringify({ shopId: shop.id }) })
      notify(d.message); setDeleteTarget(null); fetchAll(secret)
    } catch (e: any) { notify(e.message, 'err') }
    finally { setLoading(false) }
  }

  if (!secret) return <LoginScreen onLogin={handleLogin} />

  const filtered = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalActive  = shops.filter(s => s.subscriptions.some(sub => sub.status === 'active')).length
  const totalPending = payments.length
  const totalSuspended = shops.filter(s => s.suspended).length

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-md w-full">
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🗑️</div>
              <h2 className="text-lg font-black text-gray-900">Видалити магазин?</h2>
              <p className="text-sm text-gray-500 mt-2">
                <strong>{deleteTarget.name}</strong> ({deleteTarget.owner.email})<br/>
                Усі дані будуть видалені безповоротно.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                Скасувати
              </button>
              <button onClick={() => deleteShop(deleteTarget)} disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {loading ? 'Видаляємо...' : 'Видалити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-sm shadow">🌸</div>
            <span className="font-black text-gray-900 text-sm">FlowerGoUa Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchAll(secret)} disabled={loading}
              className="flex items-center gap-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg font-medium transition-colors">
              {loading ? '⏳' : '🔄'} Оновити
            </button>
            <button onClick={() => setSecret('')}
              className="text-xs text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg transition-colors">
              Вийти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat icon="🏪" label="Всього магазинів"   value={shops.length}   color="bg-pink-50" />
          <Stat icon="✅" label="Активні підписки"   value={totalActive}    color="bg-green-50" />
          <Stat icon="⏳" label="Очікують оплати"    value={totalPending}   color="bg-amber-50" />
          <Stat icon="🚫" label="Заблоковані"        value={totalSuspended} color="bg-red-50" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([
            { id: 'payments', label: `Оплати${payments.length > 0 ? ` (${payments.length})` : ''}`, icon: '💳' },
            { id: 'shops',    label: `Магазини (${shops.length})`,                                    icon: '🏪' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ PAYMENTS TAB ══ */}
        {tab === 'payments' && (
          payments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-gray-500 font-medium">Немає очікуючих платежів</p>
              <p className="text-sm text-gray-400 mt-1">Усі оплати оброблені</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Shop info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{p.subscription.shop.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planBadge(p.subscription.plan.slug)}`}>
                          {p.subscription.plan.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{p.subscription.shop.owner.email}</p>
                    </div>

                    {/* Payment details */}
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Сума</p>
                        <p className="font-black text-gray-900 text-lg">{p.amount} грн</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Картка</p>
                        <p className="font-medium text-gray-700">{p.cardType} •••• {p.cardLast4}</p>
                        <p className="text-xs text-gray-400">{p.cardHolderName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Дата</p>
                        <p className="font-medium text-gray-700">{fmtDate(p.createdAt)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => paymentAction(p.id, 'approve')} disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                        ✅ Схвалити
                      </button>
                      <button onClick={() => paymentAction(p.id, 'reject')} disabled={loading}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                        ❌ Відхилити
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ══ SHOPS TAB ══ */}
        {tab === 'shops' && (
          <div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Пошук за назвою або email..."
              className="w-full mb-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-pink-400 outline-none shadow-sm" />

            <div className="space-y-3">
              {filtered.map(shop => {
                const isOpen = expanded === shop.id
                const activeSub = shop.subscriptions.find(s => s.status === 'active')

                return (
                  <div key={shop.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${shop.suspended ? 'border-red-200' : 'border-gray-100'}`}>

                    {/* Row */}
                    <div className="flex items-center gap-3 p-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 ${
                        shop.suspended ? 'bg-red-100 text-red-500' :
                        shop.plan.slug === 'premium' ? 'bg-purple-100 text-purple-600' :
                        shop.plan.slug === 'basic'   ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {shop.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">{shop.name}</span>
                          {shop.suspended && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">🚫 Заблоковано</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${planBadge(shop.plan.slug)}`}>{shop.plan.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{shop.owner.email}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">💐 {shop._count.flowers}</span>
                          <span className="text-xs text-gray-400">📦 {shop._count.orders}</span>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a href={`/${shop.slug}`} target="_blank"
                          className="text-xs text-gray-400 hover:text-pink-500 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors hidden sm:block">
                          Відкрити →
                        </a>
                        <button onClick={() => setExpanded(isOpen ? null : shop.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all text-sm">
                          {isOpen ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isOpen && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-2xl space-y-4">

                        {/* Shop actions */}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Дії з магазином</p>
                          <div className="flex flex-wrap gap-2">
                            {shop.suspended ? (
                              <button onClick={() => shopAction(shop.id, 'unsuspend')} disabled={loading}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors">
                                ✅ Розблокувати
                              </button>
                            ) : (
                              <button onClick={() => shopAction(shop.id, 'suspend')} disabled={loading}
                                className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors">
                                🔒 Заблокувати
                              </button>
                            )}
                            <button onClick={() => setDeleteTarget(shop)}
                              className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors">
                              🗑️ Видалити назавжди
                            </button>
                          </div>
                        </div>

                        {/* Subscriptions */}
                        {shop.subscriptions.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Підписки</p>
                            <div className="space-y-2">
                              {shop.subscriptions.map(sub => (
                                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-sm text-gray-900">{sub.plan.name}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadge(sub.status)}`}>
                                        {sub.status === 'active' ? '✅ Активна' :
                                         sub.status === 'pending' ? '⏳ Очікує' :
                                         sub.status === 'cancelled' ? '❌ Скасована' :
                                         sub.status === 'expired' ? '🕐 Закінчилась' : sub.status}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {fmtDate(sub.createdAt)}
                                      {sub.expiryDate && ` → ${fmtDate(sub.expiryDate)}`}
                                      {sub.payment && ` · ${sub.payment.amount} грн · •••• ${sub.payment.cardLast4}`}
                                    </p>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    {sub.status !== 'active' && sub.status !== 'cancelled' && sub.status !== 'expired' && (
                                      <button onClick={() => subAction(sub.id, 'activate')} disabled={loading}
                                        className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 disabled:opacity-50 transition-colors">
                                        Активувати
                                      </button>
                                    )}
                                    {sub.status === 'active' && (
                                      <button onClick={() => subAction(sub.id, 'cancel')} disabled={loading}
                                        className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 disabled:opacity-50 transition-colors">
                                        Скасувати
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-gray-400">Зареєстровано: {fmtDate(shop.createdAt)}</p>
                      </div>
                    )}
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <p className="text-gray-400">Магазинів не знайдено</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
