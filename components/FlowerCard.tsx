'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import OrderModal from './OrderModal'

interface Flower {
  id: string
  name: string
  price: number
  imageUrl: string | null
  availability: string
  description: string | null
}

const availabilityConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' }> = {
  in_stock:     { label: 'В наявності', variant: 'success' },
  limited:      { label: 'Мало',        variant: 'warning' },
  out_of_stock: { label: 'Немає',       variant: 'muted'   },
}

export default function FlowerCard({ flower, shopId }: { flower: Flower; shopId: string }) {
  const [showOrderModal, setShowOrderModal] = useState(false)

  const isUnavailable = flower.availability === 'out_of_stock'
  const avail = availabilityConfig[flower.availability] ?? availabilityConfig['in_stock']

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
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-base font-bold text-gray-900 leading-snug">{flower.name}</h3>
            <Badge variant={avail.variant} className="flex-shrink-0">{avail.label}</Badge>
          </div>

          {flower.description && (
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed line-clamp-2">
              {flower.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="text-2xl font-bold text-pink-600">
              ₴{flower.price.toFixed(0)}
            </p>
            <Button
              onClick={() => !isUnavailable && setShowOrderModal(true)}
              disabled={isUnavailable}
              size="sm"
              className="flex-shrink-0"
            >
              <ShoppingBag className="h-4 w-4" />
              {isUnavailable ? 'Немає' : 'Замовити'}
            </Button>
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
