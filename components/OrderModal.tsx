'use client'

import { useState } from 'react'

interface Flower {
  id: string
  name: string
  price: number
}

export default function OrderModal({
  flower,
  shopId,
  onClose,
}: {
  flower: Flower
  shopId: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          flowerId: flower.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Помилка при відправці замовлення')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setFormData({ customerName: '', phone: '', message: '' })
      }, 2500)
    } catch (error) {
      alert('Не вдалося відправити замовлення. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Замовлення прийнято!</h2>
          <p className="text-gray-500">Ми зв'яжемося з вами найближчим часом.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
        </div>

        <div className="px-6 py-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-black text-gray-900">Замовити</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {flower.name} · <span className="font-bold text-pink-600">₴{flower.price.toFixed(0)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors active:scale-90 text-lg"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ім'я та прізвище *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 transition-colors bg-gray-50"
                placeholder="Ірина Ковальчук"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Номер телефону *
              </label>
              <input
                type="tel"
                inputMode="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-base focus:outline-none focus:border-pink-400 transition-colors bg-gray-50"
                placeholder="+380 99 123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Побажання <span className="text-gray-400 font-normal">(необов'язково)</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-pink-400 transition-colors bg-gray-50"
                rows={3}
                placeholder="Текст на листівку, особливі побажання..."
              />
            </div>

            <div className="flex gap-3 pt-1 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95 transition-all"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
              >
                {loading ? '⏳ Надсилаємо...' : '✅ Замовити'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
