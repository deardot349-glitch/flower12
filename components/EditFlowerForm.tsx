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
        throw new Error(data.error || 'Failed to update bouquet')
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
      className="space-y-4 rounded-xl bg-white p-6 shadow-sm border border-gray-100"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price
        </label>
        <input
          type="number"
          name="price"
          min={0}
          step="0.01"
          required
          value={form.price}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        />
        <p className="mt-1 text-[11px] text-gray-500">
          You can lower the price at any time for promotions or discounts.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <input
          type="url"
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="https://example.com/bouquet.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Availability
        </label>
        <select
          name="availability"
          value={form.availability}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="in_stock">In stock</option>
          <option value="limited">Limited</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Optional details customers find helpful, like size or best occasions."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

