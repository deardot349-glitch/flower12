'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EditFlowerFormProps {
  flower: {
    id: string
    name: string
    price: number
    imageUrl: string | null
    availability: string
    description: string | null
  }
}

export default function EditFlowerForm({ flower }: EditFlowerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: flower.name,
    price: flower.price.toString(),
    imageUrl: flower.imageUrl || '',
    availability: flower.availability,
    description: flower.description || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/flowers/${flower.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          imageUrl: form.imageUrl || null,
          availability: form.availability,
          description: form.description || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Помилка при збереженні')
      }

      router.push('/dashboard/flowers')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
    >
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Назва букету *
        </label>
        <input
          type="text"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Ціна (₴) *
        </label>
        <input
          type="number"
          name="price"
          min={0}
          step="1"
          required
          value={form.price}
          onChange={handleChange}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
        />
        <p className="mt-1 text-xs text-gray-400">
          Ціну можна змінити будь-коли для акцій або знижок.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Посилання на фото
        </label>
        <input
          type="url"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
          placeholder="https://example.com/buket.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Наявність *
        </label>
        <select
          name="availability"
          value={form.availability}
          onChange={handleChange}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
        >
          <option value="in_stock">В наявності</option>
          <option value="limited">Мало залишилось</option>
          <option value="out_of_stock">Немає в наявності</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Опис
        </label>
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors resize-none"
          placeholder="Деталі, розмір, для яких подій підходить..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
      >
        {loading ? '⏳ Зберігаємо...' : '✅ Зберегти зміни'}
      </button>
    </form>
  )
}
