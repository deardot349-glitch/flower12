'use client'

import { useState, useEffect } from 'react'

interface Customer {
  phone: string
  name: string
  orderCount: number
  totalSpent: number
  lastOrderAt: string
  statuses: string[]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'spent' | 'orders' | 'recent'>('spent')
  const [currency, setCurrency] = useState('UAH')

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(d => { setCustomers(d.customers || []); setCurrency(d.currency || 'UAH'); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sym = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : '$'

  const filtered = customers
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    .sort((a, b) => {
      if (sort === 'spent')  return b.totalSpent - a.totalSpent
      if (sort === 'orders') return b.orderCount - a.orderCount
      return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    })

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const repeatCustomers = customers.filter(c => c.orderCount > 1).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:py-8 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-black text-gray-900">Клієнти</h1>
        <p className="text-gray-500 text-sm mt-0.5">Всі хто робив замовлення у вашому магазині</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{customers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Всього клієнтів</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-purple-600">{repeatCustomers}</p>
          <p className="text-xs text-gray-500 mt-1">Постійних</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-pink-600">{sym}{totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">Загальний дохід</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Пошук за ім'ям або телефоном..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none" />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-pink-400 outline-none bg-white">
          <option value="spent">За сумою</option>
          <option value="orders">За кількістю</option>
          <option value="recent">Нещодавні</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">{search ? 'Клієнтів не знайдено' : 'Замовлень ще немає'}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.map((c, i) => {
            const isRepeat = c.orderCount > 1
            const initials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div key={c.phone} className={`flex items-center gap-4 px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-pink-700 bg-gradient-to-br from-pink-100 to-purple-100">
                  {initials || '?'}
                </div>

                {/* Name + phone */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                    {isRepeat && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        ⭐ Постійний
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <a href={`tel:${c.phone}`} className="text-xs text-gray-500 hover:text-pink-600 transition-colors">{c.phone}</a>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.lastOrderAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-gray-800">{c.orderCount}</p>
                    <p className="text-[10px] text-gray-400">зам.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{sym}{c.totalSpent.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400 hidden sm:block">загалом</p>
                  </div>
                  <a href={`https://wa.me/${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
