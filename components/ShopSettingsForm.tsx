'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ShopSettingsFormProps {
  shop: {
    id: string
    name: string
    location: string | null
    about: string | null
    workingHours: string | null
  }
  plan: {
    name: string
    allowProfileDetails: boolean
  }
}

export default function ShopSettingsForm({ shop, plan }: ShopSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    location: shop.location || '',
    about: shop.about || '',
    workingHours: shop.workingHours || '',
  })

  const disabled = !plan.allowProfileDetails

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) return
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/shop', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location || null,
          about: form.about || null,
          workingHours: form.workingHours || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update shop')
      }

      setSuccess(true)
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
      className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4"
    >
      {disabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 mb-2">
          Profile details are available on higher plans. You can still run your shop,
          but your public page will show a simpler layout. Upgrade to unlock a richer
          shop profile.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Changes saved. Your public shop page has been updated.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          name="location"
          disabled={disabled}
          value={form.location}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="Neighborhood, city, or address customers will recognize"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Working hours
        </label>
        <input
          type="text"
          name="workingHours"
          disabled={disabled}
          value={form.workingHours}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="e.g. Mon–Sat 9:00–19:00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          About your shop
        </label>
        <textarea
          name="about"
          rows={4}
          disabled={disabled}
          value={form.about}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="Tell customers about your story, what you specialize in, and why they’ll love ordering from you."
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={disabled || loading}
          className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

