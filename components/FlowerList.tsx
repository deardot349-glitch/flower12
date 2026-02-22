'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Flower {
  id: string
  name: string
  price: number
  imageUrl: string | null
  availability: string
  description: string | null
}

export default function FlowerList({ flowers }: { flowers: Flower[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flower?')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/flowers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete flower')
      }

      router.refresh()
    } catch (error) {
      alert('Failed to delete flower. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleAvailability = async (flower: Flower) => {
    const newAvailability =
      flower.availability === 'in_stock' ? 'out_of_stock' : 'in_stock'

    try {
      const response = await fetch(`/api/flowers/${flower.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: newAvailability }),
      })

      if (!response.ok) {
        throw new Error('Failed to update availability')
      }

      router.refresh()
    } catch (error) {
      alert('Failed to update availability. Please try again.')
    }
  }

  if (flowers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">No flowers yet. Add your first flower!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {flowers.map((flower) => (
        <div
          key={flower.id}
          className="bg-white rounded-xl shadow-sm p-6 flex gap-6"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {flower.imageUrl ? (
              <img
                src={flower.imageUrl}
                alt={flower.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-3xl">🌸</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{flower.name}</h3>
                <p className="text-lg font-bold text-primary-600">
                  ${flower.price.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleAvailability(flower)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    flower.availability === 'in_stock'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {flower.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
            </div>
            {flower.description && (
              <p className="text-gray-600 text-sm mb-4">{flower.description}</p>
            )}
            <div className="flex gap-3 text-sm">
              <Link
                href={`/dashboard/flowers/${flower.id}/edit`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(flower.id)}
                disabled={deletingId === flower.id}
                className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {deletingId === flower.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
