'use client'

import { useState, useEffect } from 'react'
import { PLANS } from '@/lib/plans'

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string>('free')

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardHolderName: ''
  })

  useEffect(() => {
    fetchSubscriptions()
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch('/api/shop')
      const data = await res.json()
      if (data.shop?.plan?.slug) setCurrentPlanSlug(data.shop.plan.slug)
    } catch {}
  }

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions')
      const data = await res.json()
      if (data.subscriptions) setSubscriptions(data.subscriptions)
    } catch {}
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target
    if (name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      if (value.length > 19) return
    }
    if (name === 'cardExpiry') {
      value = value.replace(/\D/g, '')
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4)
      if (value.length > 5) return
    }
    if (name === 'cardCvc') value = value.replace(/\D/g, '').slice(0, 4)
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug: selectedPlan, ...formData })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to submit payment')
      setSuccess(data.message)
      setFormData({ cardNumber: '', cardExpiry: '', cardCvc: '', cardHolderName: '' })
      setSelectedPlan('')
      setTimeout(() => fetchSubscriptions(), 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const paidPlans = PLANS.filter(p => p.price > 0)
  const selectedPlanConfig = PLANS.find(p => p.slug === selectedPlan)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Підписка</h1>
        <p className="text-gray-500 mt-1">Оберіть план для вашого магазину</p>
      </div>

      {/* Current plan badge */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-2xl">
          {currentPlanSlug === 'premium' ? '🌺' : currentPlanSlug === 'basic' ? '🌸' : '🌱'}
        </div>
        <div>
          <p className="text-sm text-gray-500">Поточний план</p>
          <p className="font-bold text-gray-900 text-lg">
            {PLANS.find(p => p.slug === currentPlanSlug)?.name || 'Безкоштовний'}
          </p>
        </div>
        {subscriptions.find(s => s.status === 'pending') && (
          <div className="ml-auto bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded-xl">
            ⏳ Очікує підтвердження оплати
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">{success}</div>}

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug
          const isSelected = plan.slug === selectedPlan

          return (
            <div key={plan.slug}
              className={`relative rounded-2xl border-2 p-6 transition-all cursor-pointer ${
                isCurrent ? 'border-green-400 bg-green-50' :
                isSelected ? 'border-pink-500 bg-pink-50 shadow-lg' :
                plan.highlight ? 'border-purple-300 bg-white shadow-md' :
                'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => !isCurrent && plan.price > 0 && setSelectedPlan(plan.slug)}
            >
              {/* Badges */}
              {plan.highlight && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  Популярний
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  ✓ Активний
                </div>
              )}

              <div className="text-3xl mb-3">
                {plan.slug === 'free' ? '🌱' : plan.slug === 'basic' ? '🌸' : '🌺'}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="text-2xl font-black text-gray-900 mb-1">
                {plan.price === 0 ? 'Безкоштовно' : `${plan.price} грн`}
              </div>
              {plan.price > 0 && <p className="text-xs text-gray-400 mb-3">на місяць</p>}
              <p className="text-sm text-gray-500 mb-4">{plan.tagline}</p>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <ul className="space-y-1">
                  {plan.limitations.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="flex-shrink-0 mt-0.5">✗</span>
                      {l}
                    </li>
                  ))}
                </ul>
              )}

              {/* Select button */}
              {!isCurrent && plan.price > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan.slug)}
                  className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSelected ? '✓ Обрано' : 'Обрати план'}
                </button>
              )}
              {isCurrent && (
                <div className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-center text-green-700 bg-green-100">
                  Ваш поточний план
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment form */}
      {selectedPlan && selectedPlanConfig && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">💳 Оплата</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ви обрали: <strong>{selectedPlanConfig.name}</strong> — {selectedPlanConfig.price} грн/міс.
            Після відправки оплата буде перевірена вручну протягом 24 годин.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ім'я власника картки</label>
              <input type="text" name="cardHolderName" required value={formData.cardHolderName}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none"
                placeholder="Іван Іваненко" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Номер картки</label>
              <input type="text" name="cardNumber" required value={formData.cardNumber}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono tracking-wider"
                placeholder="1234 5678 9012 3456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Термін дії</label>
                <input type="text" name="cardExpiry" required value={formData.cardExpiry}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono"
                  placeholder="MM/YY" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">CVC</label>
                <input type="text" name="cardCvc" required value={formData.cardCvc}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none font-mono"
                  placeholder="123" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
              ⏳ Після відправки ваш план буде активовано протягом 24 годин після перевірки оплати адміністратором.
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-semibold hover:bg-pink-700 disabled:opacity-50 transition-colors">
                {loading ? 'Відправляємо...' : `Оплатити ${selectedPlanConfig.price} грн`}
              </button>
              <button type="button" onClick={() => setSelectedPlan('')}
                className="px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                Скасувати
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Payment history */}
      {subscriptions.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Історія підписок</h2>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="font-semibold text-gray-900">{sub.plan?.name}</p>
                  <p className="text-sm text-gray-500">{new Date(sub.createdAt).toLocaleDateString('uk-UA')}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sub.status === 'active' ? 'bg-green-100 text-green-700' :
                    sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {sub.status === 'active' ? '✓ Активна' :
                     sub.status === 'pending' ? '⏳ Очікує' : sub.status}
                  </span>
                  {sub.payment && (
                    <p className="text-xs text-gray-400 mt-1">{sub.payment.amount} грн</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
