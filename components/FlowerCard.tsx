'use client'

import { useState } from 'react'
import Image from 'next/image'
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

  const isUnavailable = flower.availability === 'out_of_stock'

  const getAvailabilityBadge = () => {
    if (flower.availability === 'in_stock') {
      return (
        <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
          В наявності
        </span>
      )
    } else if (flower.availability === 'limited') {
      return (
        <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
          Мало
        </span>
      )
    } else if (isUnavailable) {
      return (
        <span className="inline-block bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">
          Немає
        </span>
      )
    }
    return null
  }

  return (
    <>
      <div className={`bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${isUnavailable ? 'opacity-60' : ''}`}>
        {/* Image */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50" style={{ height: '220px' }}>
          {flower.imageUrl ? (
            <Image
              src={flower.imageUrl}
              alt={flower.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl">🌸</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-black text-gray-900 leading-snug">{flower.name}</h3>
            {getAvailabilityBadge()}
          </div>

          {flower.description && (
            <p className="text-sm text-gray-500 mb-3 leading-relaxed line-clamp-2">
              {flower.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="text-2xl font-black text-pink-600">
              ₴{flower.price.toFixed(0)}
            </p>
            <button
              onClick={() => !isUnavailable && setShowOrderModal(true)}
              disabled={isUnavailable}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:from-pink-600 hover:to-purple-700 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
            >
              {isUnavailable ? 'Немає' : 'Замовити'}
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
