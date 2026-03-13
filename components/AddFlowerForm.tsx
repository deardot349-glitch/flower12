'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

function getDaysAge(dateStr: string): string {
  if (!dateStr) return ''
  const made = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - made.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Зроблено сьогодні'
  if (diff === 1) return '1 день тому'
  if (diff < 5) return `${diff} дні тому`
  return `${diff} днів тому`
}

export default function AddFlowerForm({ shopId, currency = 'UAH' }: { shopId: string; currency?: string }) {
  const currencySymbol = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrl: '',
    availability: 'in_stock',
    description: '',
    madeAt: today,
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Файл занадто великий. Максимальний розмір — 5МБ.'); return }
    if (!file.type.startsWith('image/')) { alert('Будь ласка, оберіть файл зображення.'); return }
    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'flower')
      const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Помилка завантаження')
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      setImagePreview(data.url)
    } catch (err: any) {
      alert(err.message || 'Не вдалося завантажити фото')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/flowers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          ...formData,
          price: parseFloat(formData.price),
          madeAt: formData.madeAt || null,
        }),
      })
      if (!response.ok) throw new Error('Помилка при збереженні')
      router.refresh()
      setFormData({ name: '', price: '', imageUrl: '', availability: 'in_stock', description: '', madeAt: today })
      setImagePreview(null)
    } catch {
      alert('Не вдалося додати букет. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  const ageLabel = getDaysAge(formData.madeAt)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Назва букету *</label>
        <input type="text" required value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
          placeholder="Троянди мікс" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Ціна ({currencySymbol}) *
        </label>
        <input type="number" step="1" min="0" required value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
          placeholder="450" />
      </div>

      {/* Date made */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Дата виготовлення</label>
        <input
          type="date"
          value={formData.madeAt}
          max={today}
          onChange={(e) => setFormData({ ...formData, madeAt: e.target.value })}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors"
        />
        {ageLabel && (
          <p className="mt-1.5 text-xs font-medium text-pink-600 flex items-center gap-1">
            🕐 {ageLabel}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Фото букету</label>
        {imagePreview && (
          <div className="mb-3 relative h-40 rounded-2xl overflow-hidden border border-gray-200">
            <Image src={imagePreview} alt="Попередній перегляд" fill className="object-cover" />
            <button type="button"
              onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })) }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <label className="cursor-pointer">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-pink-400 transition-colors bg-gray-50">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mb-1"></div>
                <p className="text-xs text-gray-600">Завантаження...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs font-semibold text-gray-700">Натисніть щоб завантажити</p>
                <p className="text-xs text-gray-400">PNG, JPG до 5МБ</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Наявність *</label>
        <select required value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors">
          <option value="in_stock">В наявності</option>
          <option value="limited">Мало залишилось</option>
          <option value="out_of_stock">Немає в наявності</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Опис</label>
        <textarea value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-pink-400 bg-gray-50 transition-colors resize-none"
          rows={3} placeholder="Розкажіть про цей букет..." />
      </div>

      <button type="submit" disabled={loading || uploading}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-[0.98] text-sm">
        {loading ? '⏳ Зберігаємо...' : '🌸 Додати букет'}
      </button>
    </form>
  )
}
