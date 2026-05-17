'use client'

import { useState, useEffect } from 'react'

interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount: number | null
  maxUses: number | null
  usedCount: number
  active: boolean
  expiresAt: string | null
  createdAt: string
}

export default function DiscountsTab({ currency = 'UAH' }: { currency?: string }) {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: ''
  })

  const sym = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : '$'

  const load = () => {
    fetch('/api/discounts').then(r => r.json()).then(d => { setCodes(d.codes || []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const notify = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setError('')
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' })
      setShowForm(false); load(); notify('✅ Промокод створено!')
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Помилка створення промокоду') }
    finally { setCreating(false) }
  }

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/discounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  const del = async (id: string) => {
    if (!confirm('Видалити цей промокод?')) return
    await fetch(`/api/discounts/${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(p => ({ ...p, code }))
  }

  const isExpired = (d: DiscountCode) => d.expiresAt && new Date(d.expiresAt) < new Date()
  const isExhausted = (d: DiscountCode) => d.maxUses != null && d.usedCount >= d.maxUses

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🏷️</div>
        <div>
          <h3 className="font-bold text-gray-900">Промокоди та знижки</h3>
          <p className="text-sm text-gray-500 mt-0.5">Коди що клієнти вводять при оформленні замовлення</p>
        </div>
      </div>

      {error   && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>}

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:from-pink-600 hover:to-purple-700 transition-all">
          + Створити промокод
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-gray-900 text-sm">Новий промокод</p>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Код промокоду *</label>
            <div className="flex gap-2">
              <input type="text" required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono uppercase focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none bg-white"
                placeholder="SPRING20" maxLength={20} />
              <button type="button" onClick={generateCode}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl text-sm font-semibold text-gray-700 transition-colors whitespace-nowrap">
                🎲 Згенерувати
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Тип знижки</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-pink-400 outline-none bg-white">
                <option value="percentage">Відсоток (%)</option>
                <option value="fixed">Фіксована ({sym})</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {form.type === 'percentage' ? 'Розмір знижки (%)' : `Розмір знижки (${sym})`}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">
                  {form.type === 'percentage' ? '%' : sym}
                </span>
                <input type="number" required min="1" max={form.type === 'percentage' ? '100' : undefined}
                  value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-2.5 text-sm focus:border-pink-400 outline-none bg-white" placeholder="20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Мін. сума замовлення ({sym})</label>
              <input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-pink-400 outline-none bg-white" placeholder="0 = будь-яка" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Макс. кількість використань</label>
              <input type="number" min="1" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-pink-400 outline-none bg-white" placeholder="Необмежено" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Діє до (необов'язково)</label>
            <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-pink-400 outline-none bg-white" />
          </div>

          {form.code && form.value && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl px-4 py-2.5 text-sm text-pink-800">
              <span className="font-bold font-mono">{form.code}</span> — {form.type === 'percentage' ? `${form.value}% знижка` : `${sym}${form.value} знижка`}
              {form.minOrderAmount && parseFloat(form.minOrderAmount) > 0 ? ` · від ${sym}${form.minOrderAmount}` : ''}
              {form.maxUses ? ` · ${form.maxUses}× використань` : ''}
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={creating}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all">
              {creating ? 'Створюємо...' : '✓ Створити промокод'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-300 transition-colors">
              Скасувати
            </button>
          </div>
        </form>
      )}

      {loading && <div className="text-center py-8 text-gray-400 text-sm">Завантажуємо...</div>}

      {!loading && codes.length === 0 && !showForm && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">🏷️</p>
          <p className="text-sm">Ще немає промокодів. Створіть перший!</p>
        </div>
      )}

      {!loading && codes.length > 0 && (
        <div className="space-y-2">
          {codes.map(c => {
            const expired = isExpired(c)
            const exhausted = isExhausted(c)
            const dead = expired || exhausted || !c.active

            return (
              <div key={c.id} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                dead ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-200 bg-white'
              }`}>
                {/* Code + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black font-mono text-sm text-gray-900">{c.code}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.type === 'percentage'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {c.type === 'percentage' ? `-${c.value}%` : `-${sym}${c.value}`}
                    </span>
                    {expired    && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Термін вийшов</span>}
                    {exhausted  && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Вичерпано</span>}
                    {!dead && !c.active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Вимкнено</span>}
                    {!dead && c.active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Активний</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span>Використано: <span className="font-semibold text-gray-700">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</span></span>
                    {c.minOrderAmount && c.minOrderAmount > 0 ? <span>Від: {sym}{c.minOrderAmount}</span> : null}
                    {c.expiresAt && <span>До: {new Date(c.expiresAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!expired && !exhausted && (
                    <button onClick={() => toggle(c.id, c.active)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${c.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${c.active ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  )}
                  <button onClick={() => del(c.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors text-sm">
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
