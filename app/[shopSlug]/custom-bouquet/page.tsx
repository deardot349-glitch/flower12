'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface StockFlower {
  id: string
  name: string
  color: string | null
  pricePerStem: number
  stockCount: number
  imageUrl: string | null
}

interface WrappingOption {
  id: string
  name: string
  price: number
  imageUrl: string | null
}

interface SelectedFlower {
  id: string
  name: string
  color: string | null
  pricePerStem: number
  quantity: number
}

interface CustomBouquet {
  flowers: SelectedFlower[]
  wrapping: WrappingOption | null
  size: 'small' | 'medium' | 'large'
  specialInstructions: string
  totalPrice: number
}

const BOUQUET_SIZES = {
  small: { label: 'Small', minStems: 5, maxStems: 15, recommended: 10 },
  medium: { label: 'Medium', minStems: 16, maxStems: 30, recommended: 20 },
  large: { label: 'Large', minStems: 31, maxStems: 50, recommended: 40 }
}

export default function CustomBouquetPage({ params }: { params: { shopSlug: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stockFlowers, setStockFlowers] = useState<StockFlower[]>([])
  const [wrappingOptions, setWrappingOptions] = useState<WrappingOption[]>([])
  const [currency, setCurrency] = useState('USD')

  const [bouquet, setBouquet] = useState<CustomBouquet>({
    flowers: [],
    wrapping: null,
    size: 'medium',
    specialInstructions: '',
    totalPrice: 0
  })

  const [showCheckout, setShowCheckout] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    zipCode: ''
  })
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    fetchData()
  }, [params.shopSlug])

  useEffect(() => {
    calculateTotal()
  }, [bouquet.flowers, bouquet.wrapping])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/shop/public/${params.shopSlug}/custom-bouquet-data`)
      const data = await res.json()
      if (data.stockFlowers && data.wrappingOptions) {
        setStockFlowers(data.stockFlowers)
        setWrappingOptions(data.wrappingOptions)
        if (data.currency) setCurrency(data.currency)
      }
    } catch (err) {
      console.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const flowersTotal = bouquet.flowers.reduce(
      (sum, f) => sum + (f.pricePerStem * f.quantity),
      0
    )
    const wrappingTotal = bouquet.wrapping?.price || 0
    const total = flowersTotal + wrappingTotal
    setBouquet(prev => ({ ...prev, totalPrice: total }))
  }

  const addFlower = (flower: StockFlower) => {
    const existing = bouquet.flowers.find(f => f.id === flower.id)
    if (existing) {
      updateFlowerQuantity(flower.id, existing.quantity + 1)
    } else {
      setBouquet(prev => ({
        ...prev,
        flowers: [...prev.flowers, {
          id: flower.id,
          name: flower.name,
          color: flower.color,
          pricePerStem: flower.pricePerStem,
          quantity: 1
        }]
      }))
    }
  }

  const updateFlowerQuantity = (flowerId: string, quantity: number) => {
    if (quantity <= 0) {
      setBouquet(prev => ({
        ...prev,
        flowers: prev.flowers.filter(f => f.id !== flowerId)
      }))
    } else {
      setBouquet(prev => ({
        ...prev,
        flowers: prev.flowers.map(f =>
          f.id === flowerId ? { ...f, quantity } : f
        )
      }))
    }
  }

  const selectWrapping = (wrapping: WrappingOption) => {
    setBouquet(prev => ({
      ...prev,
      wrapping: prev.wrapping?.id === wrapping.id ? null : wrapping
    }))
  }

  const getTotalStems = () => {
    return bouquet.flowers.reduce((sum, f) => sum + f.quantity, 0)
  }

  const handleCheckout = async () => {
    if (bouquet.flowers.length === 0) {
      alert('Please select at least one flower')
      return
    }
    const totalStems = getTotalStems()
    const sizeConfig = BOUQUET_SIZES[bouquet.size]
    if (totalStems < sizeConfig.minStems) {
      alert(`${bouquet.size} bouquet requires at least ${sizeConfig.minStems} stems. You have ${totalStems}.`)
      return
    }
    setShowCheckout(true)
  }

  const submitOrder = async () => {
    setSubmitStatus('loading')
    try {
      const res = await fetch('/api/custom-bouquet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: params.shopSlug,
          customerName: formData.customerName,
          phone: formData.phone,
          email: formData.email,
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'delivery' ? {
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode
          } : null,
          customBouquet: {
            flowers: bouquet.flowers,
            wrapping: bouquet.wrapping,
            size: bouquet.size,
            specialInstructions: bouquet.specialInstructions,
            totalPrice: bouquet.totalPrice
          }
        })
      })
      if (res.ok) {
        setSubmitStatus('success')
        setTimeout(() => {
          router.push(`/${params.shopSlug}`)
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (err) {
      setSubmitStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading custom bouquet builder...</p>
        </div>
      </div>
    )
  }

  const totalStems = getTotalStems()
  const sizeConfig = BOUQUET_SIZES[bouquet.size]
  const currencySymbol = currency === 'UAH' ? '₴' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <button
            onClick={() => router.push(`/${params.shopSlug}`)}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Shop
          </button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">🎨 Create Your Custom Bouquet</h1>
          <p className="text-white/90">Choose your flowers, wrapping, and size to create the perfect arrangement</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Choose Size */}
            <div className="bg-white rounded-2xl shadow-md p-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-pink-100 text-pink-600 rounded-full text-sm font-bold">1</span>
                Choose Bouquet Size
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(BOUQUET_SIZES).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setBouquet(prev => ({ ...prev, size: key as any }))}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      bouquet.size === key
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {key === 'small' && '💐'}
                      {key === 'medium' && '🌸'}
                      {key === 'large' && '🌹'}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{config.label}</h3>
                    <p className="text-xs text-gray-600">{config.minStems}-{config.maxStems} stems</p>
                    <p className="text-xs text-pink-600 mt-1">~{config.recommended} recommended</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Flowers */}
            <div className="bg-white rounded-2xl shadow-md p-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-pink-100 text-pink-600 rounded-full text-sm font-bold">2</span>
                Select Flowers
              </h2>

              {stockFlowers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No flowers available for custom bouquets at the moment.</p>
                  <p className="text-sm mt-2">Please check our pre-made bouquets instead.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {stockFlowers.map((flower) => {
                    const selected = bouquet.flowers.find(f => f.id === flower.id)
                    return (
                      <div
                        key={flower.id}
                        className={`border-2 rounded-xl p-3 transition-all cursor-pointer ${
                          selected
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="relative h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg mb-2 overflow-hidden">
                          {flower.imageUrl ? (
                            <Image src={flower.imageUrl} alt={flower.name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">🌸</div>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900">{flower.name}</h3>
                        {flower.color && <p className="text-xs text-gray-500">{flower.color}</p>}
                        <p className="text-sm font-bold text-pink-600 mt-1">
                          {currencySymbol}{flower.pricePerStem.toFixed(2)}/stem
                        </p>
                        <p className="text-xs text-gray-400">Stock: {flower.stockCount}</p>

                        {selected ? (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateFlowerQuantity(flower.id, selected.quantity - 1)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors text-sm font-semibold"
                            >−</button>
                            <span className="font-bold text-gray-900">{selected.quantity}</span>
                            <button
                              onClick={() => updateFlowerQuantity(flower.id, selected.quantity + 1)}
                              disabled={selected.quantity >= flower.stockCount}
                              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded transition-colors text-sm font-semibold disabled:opacity-50"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addFlower(flower)}
                            className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded transition-colors text-sm font-semibold"
                          >Add</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Choose Wrapping */}
            <div className="bg-white rounded-2xl shadow-md p-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-pink-100 text-pink-600 rounded-full text-sm font-bold">3</span>
                Choose Wrapping Style
              </h2>

              {wrappingOptions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No wrapping options available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {wrappingOptions.map((wrapping) => (
                    <button
                      key={wrapping.id}
                      onClick={() => selectWrapping(wrapping)}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        bouquet.wrapping?.id === wrapping.id
                          ? 'border-pink-500 bg-pink-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="relative h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg mb-2 overflow-hidden">
                        {wrapping.imageUrl ? (
                          <Image src={wrapping.imageUrl} alt={wrapping.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl">🎁</div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900">{wrapping.name}</h3>
                      <p className="text-sm font-bold text-pink-600">
                        {wrapping.price > 0 ? `+${currencySymbol}${wrapping.price.toFixed(2)}` : 'Free'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Special Instructions */}
            <div className="bg-white rounded-2xl shadow-md p-6 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-pink-100 text-pink-600 rounded-full text-sm font-bold">4</span>
                Special Instructions (Optional)
              </h2>
              <textarea
                value={bouquet.specialInstructions}
                onChange={(e) => setBouquet(prev => ({ ...prev, specialInstructions: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-pink-500 focus:ring-pink-500"
                placeholder="Any special requests? Color preferences? Message for the card?"
              />
            </div>
          </div>

          {/* Right Column: Summary & Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Bouquet</h2>

              {/* Size */}
              <div className="mb-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Size:</span>
                  <span className="font-bold text-pink-600">{BOUQUET_SIZES[bouquet.size].label}</span>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {totalStems} / {sizeConfig.minStems}-{sizeConfig.maxStems} stems
                </div>
                {totalStems > 0 && totalStems < sizeConfig.minStems && (
                  <div className="mt-2 text-xs text-orange-600 font-medium">
                    ⚠️ Add {sizeConfig.minStems - totalStems} more stems
                  </div>
                )}
              </div>

              {/* Selected Flowers */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Flowers:</h3>
                {bouquet.flowers.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No flowers selected yet</p>
                ) : (
                  <div className="space-y-2">
                    {bouquet.flowers.map((flower) => (
                      <div key={flower.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{flower.quantity}x {flower.name}</span>
                          {flower.color && <span className="text-gray-500 text-xs ml-1">({flower.color})</span>}
                        </div>
                        <span className="font-semibold text-gray-700">
                          {currencySymbol}{(flower.quantity * flower.pricePerStem).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wrapping */}
              {bouquet.wrapping && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Wrapping: {bouquet.wrapping.name}</span>
                    <span className="font-semibold text-gray-700">
                      {currencySymbol}{bouquet.wrapping.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mb-6 p-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">{currencySymbol}{bouquet.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={bouquet.flowers.length === 0 || totalStems < sizeConfig.minStems}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform hover:scale-105"
              >
                Proceed to Checkout
              </button>

              {bouquet.flowers.length === 0 && (
                <p className="text-xs text-gray-500 text-center mt-2">Select flowers to continue</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 relative my-8">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Order</h2>

            {submitStatus === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-green-900 mb-2">Order Placed Successfully!</h3>
                <p className="text-green-700">Redirecting you back to the shop...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Delivery Method */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Delivery Method</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        deliveryMethod === 'pickup'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">🏪</div>
                      <h4 className="font-bold text-sm">Store Pickup</h4>
                    </button>
                    <button
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        deliveryMethod === 'delivery'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">🚚</div>
                      <h4 className="font-bold text-sm">Delivery</h4>
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Full Name *"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone Number *"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email (Optional)"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                {deliveryMethod === 'delivery' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street Address *"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="City *"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                        />
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                          placeholder="ZIP Code *"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Stems:</span>
                      <span className="font-medium">{totalStems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{BOUQUET_SIZES[bouquet.size].label}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-pink-600">{currencySymbol}{bouquet.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    Failed to place order. Please try again.
                  </div>
                )}

                <button
                  onClick={submitOrder}
                  disabled={
                    submitStatus === 'loading' ||
                    !formData.customerName ||
                    !formData.phone ||
                    (deliveryMethod === 'delivery' && (!formData.address || !formData.city || !formData.zipCode))
                  }
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  {submitStatus === 'loading' ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </main>
  )
}
