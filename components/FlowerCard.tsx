'use client'

import { useState } from 'react'
import OrderModal from './OrderModal'

interface Flower {
  id: string
  name: string
  price: number
  imageUrl: string | null
  availability: string
  description: string | null
}

export default function FlowerCard({ flower, shopId }: { flower: Flower; shopId: string }) {
  const [showOrderModal, setShowOrderModal] = useState(false)

  const getAvailabilityBadge = () => {
    if (flower.availability === 'in_stock') {
      return (
        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
          In Stock
        </span>
      )
    } else if (flower.availability === 'limited') {
      return (
        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
          Limited
        </span>
      )
    }
    return null
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
          {flower.imageUrl ? (
            <img
              src={flower.imageUrl}
              alt={flower.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl">🌸</span>
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{flower.name}</h3>
            {getAvailabilityBadge()}
          </div>
          {flower.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {flower.description}
            </p>
          )}
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-primary-600">
              ${flower.price.toFixed(2)}
            </p>
            <button
              onClick={() => setShowOrderModal(true)}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Order
            </button>
          </div>
        </div>
      </div>

      {showOrderModal && (
        <OrderModal
          flower={flower}
          shopId={shopId}
          onClose={() => setShowOrderModal(false)}
        />
      )}
    </>
  )
}
