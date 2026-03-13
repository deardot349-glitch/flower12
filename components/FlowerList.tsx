'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Flower {
  id: string
  name: string
  price: number
  imageUrl: string | null
  availability: string
  description: string | null
  madeAt?: string | Date | null
}

function getAgeLabel(madeAt?: string | Date | null): string | null {
  if (!madeAt) return null
  const made = new Date(madeAt)
  const now = new Date()
  const diff = Math.floor((now.getTime() - made.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Сьогодні'
  if (diff === 1) return '1 день'
  if (diff < 5) return `${diff} дні`
  return `${diff} днів`
}

const availabilityLabels: Record<string, { label: string; color: string }> = {
  in_stock: { label: 'В наявності', color: 'bg-green-100 text-green-700' },
  limited: { label: 'Мало', color: 'bg-amber-100 text-amber-700' },
  out_of_stock: { label: 'Немає', color: 'bg-gray-100 text-gray-500' },
}

export default function FlowerList({ flowers }: { flowers: Flower[] }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити цей букет? Цю дію не можна скасувати.')) return
    setDeletingId(id)
    try {
      const response = await fetch(`/api/flowers/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Помилка видалення')
      router.refresh()
    } catch (error) {
      alert('Не вдалося видалити букет. Спробуйте ще раз.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleAvailability = async (flower: Flower) => {
    const newAvailability = flower.availability === 'in_stock' ? 'out_of_stock' : 'in_stock'
    setTogglingId(flower.id)
    try {
      const response = await fetch(`/api/flowers/${flower.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: newAvailability }),
      })
      if (!response.ok) throw new Error('Помилка оновлення')
      router.refresh()
    } catch (error) {
      alert('Не вдалося оновити наявність. Спробуйте ще раз.')
    } finally {
      setTogglingId(null)
    }
  }

  if (flowers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
        <div className="text-6xl mb-4">🌸</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Букетів ще немає</h3>
        <p className="text-gray-400 text-sm">Додайте перший букет за допомогою форми зліва</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {flowers.map((flower) => {
        const avail = availabilityLabels[flower.availability] || availabilityLabels['in_stock']
        return (
          <div key={flower.id}
            className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 border border-gray-100 hover:shadow-md transition-shadow">
            {/* Image */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {flower.imageUrl ? (
                <Image src={flower.imageUrl} alt={flower.name} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🌸</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <h3 className="text-base font-black text-gray-900 leading-snug">{flower.name}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${avail.color}`}>
                  {avail.label}
                </span>
              </div>

              <p className="text-lg font-black text-pink-600 mb-1">
                ₴{flower.price.toFixed(0)}
              </p>

              {flower.description && (
                <p className="text-sm text-gray-400 line-clamp-1 mb-1">{flower.description}</p>
              )}
              {flower.madeAt && (
                <p className="text-xs text-purple-500 font-medium mb-1">
                  🕐 {getAgeLabel(flower.madeAt)} · {new Date(flower.madeAt).toLocaleDateString('uk-UA')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <button
                  onClick={() => handleToggleAvailability(flower)}
                  disabled={togglingId === flower.id}
                  className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50 transition-colors"
                >
                  {togglingId === flower.id ? '⏳' : flower.availability === 'in_stock' ? '🚫 Приховати' : '✅ Показати'}
                </button>
                <Link
                  href={`/dashboard/flowers/${flower.id}/edit`}
                  className="text-gray-500 hover:text-gray-700 font-semibold transition-colors"
                >
                  ✏️ Редагувати
                </Link>
                <button
                  onClick={() => handleDelete(flower.id)}
                  disabled={deletingId === flower.id}
                  className="text-red-500 hover:text-red-600 font-semibold disabled:opacity-50 transition-colors"
                >
                  {deletingId === flower.id ? '⏳ Видалення...' : '🗑️ Видалити'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
